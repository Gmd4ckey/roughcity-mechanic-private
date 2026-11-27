(async () => {
 'use strict';
 await SiteAuth.ready;
 if (SiteAuth.access?.role !== 'owner') return;
 const $ = id => document.getElementById(id);
 const app = $('bonusApp'), budget = $('bonusBudget'), rate = $('bonusRate'), rows = $('bonusRows');
 const yen = value => '¥' + value.toLocaleString('ja-JP');
 const time = value => `${value / 60n}時間${value % 60n}分`;
 let manual = false, serial = 0, lastResult = null;
 function integer(input) {
  if (!input.value.trim()) return 0n;
  if (!/^\d+$/.test(input.value) || !input.checkValidity()) return null;
  return BigInt(input.value);
 }
 function update() {
  const entries = [...rows.children];
  const amount = integer(budget), override = manual ? integer(rate) : null;
  const durations = entries.map(row => {
   const hours = integer(row.querySelector('.hours')), minutes = integer(row.querySelector('.minutes'));
   return hours === null || minutes === null ? null : hours * 60n + minutes;
  });
  const invalid = amount === null || (manual && (override === null || !rate.value.trim())) || durations.includes(null);
  $('bonusWarning').hidden = !invalid;
  $('bonusWarning').textContent = invalid ? '金額・時間は0以上の整数で入力してください。分は0〜59、時間は100,000以下、金額は999,999,999,999円以下です。' : '';
  $('copyBonus').disabled = invalid;
  if (invalid) {
   lastResult = null;
   for (const id of ['totalHours','totalPaid','remaining']) $(id).textContent = '—';
   entries.forEach(row => row.querySelector('output').textContent = '—');
   return;
  }
  lastResult = BonusMath.calculate(amount, durations, override);
  if (!manual) rate.value = lastResult.totalMinutes ? String(lastResult.rate) : '';
  $('autoRate').disabled = !manual;
  $('rateNote').textContent = manual ? `手入力の時給を使用中（自動計算なら ${yen(lastResult.automaticRate)}／時間）。予算や時間を変えても手入力額を維持します。` : '自動計算中。必要に応じて上の時給を書き換えてください。';
  $('totalHours').textContent = time(lastResult.totalMinutes);
  $('totalPaid').textContent = yen(lastResult.paid);
  $('remaining').textContent = yen(lastResult.remaining);
  entries.forEach((row,i) => row.querySelector('output').textContent = yen(lastResult.amounts[i]));
  if (lastResult.remaining < 0n) {
   $('bonusWarning').hidden = false;
   $('bonusWarning').textContent = `支給合計が予算を ${yen(-lastResult.remaining)} 超えています。時給または出勤時間を確認してください。`;
  }
 }
 function addRow() {
  const id = ++serial, row = document.createElement('div'); row.className = 'bonus-row';
  row.innerHTML = `<label class="name-field">名前<input class="employee-name" aria-label="従業員${id}の名前" maxlength="80" autocomplete="off" placeholder="名前を入力"></label><label>時間<input class="hours" aria-label="従業員${id}の出勤時間" type="number" min="0" max="100000" step="1" inputmode="numeric" value="0"></label><label>分<input class="minutes" aria-label="従業員${id}の出勤分" type="number" min="0" max="59" step="1" inputmode="numeric" value="0"></label><div class="payout"><span class="muted">支給額</span><output>¥0</output></div><button class="remove-row" type="button" aria-label="従業員${id}の行を削除">削除</button>`;
  row.addEventListener('input', () => { $('bonusStatus').textContent = ''; update(); });
  row.querySelector('button').onclick = () => {
   const name = row.querySelector('.employee-name').value.trim();
   if ((name || integer(row.querySelector('.hours')) !== 0n || integer(row.querySelector('.minutes')) !== 0n) && !confirm((name || 'この従業員') + 'の行を削除しますか？')) return;
   row.remove(); update();
  };
  rows.append(row); update(); return row;
 }
 budget.addEventListener('input', update);
 rate.addEventListener('input', () => { manual = true; update(); });
 $('autoRate').onclick = () => { manual = false; update(); };
 $('addBonusRow').onclick = () => addRow().querySelector('input').focus();
 $('copyBonus').onclick = async () => {
  if (!lastResult) return;
  const lines = ['ボーナス計算', `総支給額（予算）：${yen(integer(budget))}`, `合計出勤時間：${time(lastResult.totalMinutes)}`, `1時間あたり：${yen(lastResult.rate)}`, ''];
  [...rows.children].forEach((row,i) => {
   const name = row.querySelector('.employee-name').value.trim() || `未入力 ${i+1}`;
   const minutes = integer(row.querySelector('.hours'))*60n + integer(row.querySelector('.minutes'));
   lines.push(`${name}：${time(minutes)} → ${yen(lastResult.amounts[i])}`);
  });
  lines.push('',`実際の支給合計：${yen(lastResult.paid)}`,`残額：${yen(lastResult.remaining)}`);
  try { await navigator.clipboard.writeText(lines.join('\n')); $('bonusStatus').textContent = '計算結果をコピーしました。'; }
  catch { $('bonusStatus').textContent = 'コピーできませんでした。画面の結果を選択してコピーしてください。'; }
 };
 // Never persist employee names or payments in browser storage or transmit them.
 window.addEventListener('beforeunload', event => {
  if (budget.value || [...rows.querySelectorAll('.employee-name')].some(input => input.value) || lastResult?.totalMinutes > 0n) {event.preventDefault();event.returnValue='';}
 });
 window.addEventListener('pagehide', () => {app.hidden=true;rows.replaceChildren();budget.value='';rate.value='';lastResult=null;});
 window.addEventListener('pageshow', event => {if(event.persisted)location.reload();});
 addRow(); app.hidden = false;
})();
