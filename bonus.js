(async () => {
 'use strict';
 await SiteAuth.ready;
 if (!SiteAuth.canUseBonus()) return;
 const $ = id => document.getElementById(id);
 const app = $('bonusApp'), budget = $('bonusBudget'), rate = $('bonusRate'), rows = $('bonusRows');
 const yen = value => '¥' + value.toLocaleString('ja-JP');
 const time = value => `${value / 60n}時間${value % 60n}分`;
 let manual = false, serial = 0, lastResult = null;
 const storageKey = SiteAuth.access.discord_id ? 'mechanic-bonus-v1:' + SiteAuth.access.discord_id : null;
 let restoring = true, dirty = false, saving = false, sharedVersion = null;
 const snapshot = () => ({version:1,budget:budget.value,rate:rate.value,manual,
  rows:[...rows.children].map(row=>({name:row.querySelector('.employee-name').value,hours:row.querySelector('.hours').value,minutes:row.querySelector('.minutes').value,farm:row.querySelector('.farm').value}))});
 function save() {
  if(restoring)return;
  dirty=true;
  $('saveStatus').textContent='未保存の変更があります。「共有して保存」で3人に反映します。';
 }
 function applyDraft(draft){
  restoring=true; rows.replaceChildren(); serial=0;
  budget.value=draft?.budget||'';rate.value=draft?.rate||'';manual=draft?.manual===true;
  for(const saved of draft?.rows||[]){const row=addRow();
   row.querySelector('.employee-name').value=saved.name;
   row.querySelector('.hours').value=saved.hours;
   row.querySelector('.minutes').value=saved.minutes;
   row.querySelector('.farm').value=saved.farm||'0';
  }
  if(!draft)addRow();
  update();restoring=false;dirty=false;
 }
 async function loadShared(force=false){
  const before=JSON.stringify(snapshot());
  const result=await SiteAuth.rpc('bonus_load');
  if(JSON.stringify(snapshot())!==before||saving){$('saveStatus').textContent='読み込み中に入力が変更されたため、入力内容を残しました。';return result;}
  if(force||(!dirty&&!saving&&result.version!==sharedVersion)){
   sharedVersion=result.version;applyDraft(result.payload);
   $('saveStatus').textContent=result.payload?'共有内容を読み込みました。':'共有データはまだありません。入力後に「共有して保存」を押してください。';
  }
  return result;
 }
 $('saveSharedBonus').onclick=async()=>{
  if(saving||sharedVersion===null)return;
  if(!lastResult){$('saveStatus').textContent='入力エラーを修正してから保存してください。';return;}
  const draft=snapshot();saving=true;$('saveSharedBonus').disabled=true;
  try{
   const result=await SiteAuth.rpc('bonus_save',{p_payload:draft,p_version:sharedVersion});
   sharedVersion=result.version;
   dirty=JSON.stringify(snapshot())!==JSON.stringify(draft);
   $('saveStatus').textContent=dirty?'保存しました。その後の入力変更はまだ未保存です。':'3人で共有する内容を保存しました。';
  }catch(e){$('saveStatus').textContent=e.message?.includes('edit_conflict')?'他の人が先に保存しました。入力内容は残しています。必要なら結果をコピーし、「共有内容を更新」で最新内容を読み込んでください。':'共有保存に失敗しました。入力内容は残しています。通信を確認して再度保存してください。';}
  finally{saving=false;$('saveSharedBonus').disabled=false;}
 };
 $('reloadSharedBonus').onclick=async()=>{
  if(saving)return;
  if(dirty&&!confirm('未保存の変更を破棄し、共有されている最新内容に置き換えますか？'))return;
  try{await loadShared(true);$('saveSharedBonus').disabled=false;}catch{$('saveStatus').textContent='共有内容を読み込めませんでした。再度更新してください。';}
 };
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
  const farms = entries.map(row => integer(row.querySelector('.farm')));
  const invalid = farms.includes(null) || amount === null || (manual && (override === null || !rate.value.trim())) || durations.includes(null);
  $('bonusWarning').hidden = !invalid;
  $('bonusWarning').textContent = invalid ? '金額・時間は0以上の整数で入力してください。分は0〜59、時間は100,000以下、金額は999,999,999,999円以下です。' : '';
  $('copyBonus').disabled = invalid;
  if (invalid) {
   lastResult = null;
   for (const id of ['totalHours','totalPaid','remaining']) $(id).textContent = '—';
   entries.forEach(row => row.querySelector('output').textContent = '—');
   save();
   return;
  }
  lastResult = BonusMath.calculate(amount, durations, override, farms);
  if (!manual) rate.value = lastResult.totalMinutes ? String(lastResult.rate) : '';
  $('autoRate').disabled = !manual;
  $('rateNote').textContent = manual ? `手入力の時給を使用中（自動計算なら ${yen(lastResult.automaticRate)}／時間）。予算や時間を変えても手入力額を維持します。` : '自動計算中。必要に応じて上の時給を書き換えてください。';
  $('totalHours').textContent = time(lastResult.totalMinutes);
  $('totalPaid').textContent = yen(lastResult.paid);
  $('remaining').textContent = yen(lastResult.remaining);
  entries.forEach((row,i) => row.querySelector('output').textContent = yen(lastResult.amounts[i]));
  if (lastResult.remaining < 0n) {
   $('bonusWarning').hidden = false;
   $('bonusWarning').textContent = `支給合計が予算を ${yen(-lastResult.remaining)} 超えています。時給・出勤時間・ファームボーナスを確認してください。`;
  }
  save();
 }
 function addRow() {
  const id = ++serial, row = document.createElement('div'); row.className = 'bonus-row';
  row.innerHTML = `<label class="name-field">名前<input class="employee-name" aria-label="従業員${id}の名前" maxlength="80" autocomplete="off" placeholder="名前を入力"></label><label>時間<input class="hours" aria-label="従業員${id}の出勤時間" type="number" min="0" max="100000" step="1" inputmode="numeric" value="0"></label><label>分<input class="minutes" aria-label="従業員${id}の出勤分" type="number" min="0" max="59" step="1" inputmode="numeric" value="0"></label><label class="farm-field">ファームボーナス（円）<input class="farm" aria-label="従業員${id}のファームボーナス" type="number" min="0" max="999999999999" step="1" inputmode="numeric" value="0"></label><div class="payout"><span class="muted">支給額</span><output>¥0</output></div><button class="remove-row" type="button" aria-label="従業員${id}の行を削除">削除</button>`;
  row.addEventListener('input', () => { $('bonusStatus').textContent = ''; update(); });
  row.querySelector('button').onclick = () => {
   const name = row.querySelector('.employee-name').value.trim();
   if ((name || integer(row.querySelector('.hours')) !== 0n || integer(row.querySelector('.minutes')) !== 0n || integer(row.querySelector('.farm')) !== 0n) && !confirm((name || 'この従業員') + 'の行を削除しますか？')) return;
   row.remove(); update();
  };
  rows.append(row); update(); return row;
 }
 budget.addEventListener('input', update);
 rate.addEventListener('input', () => { manual = true; update(); });
 $('autoRate').onclick = () => { manual = false; update(); };
 $('resetBonus').onclick = () => {
  if (!confirm('名前と並び順を残して、全員の出勤時間・総支給額・時給・ファームボーナスをリセットしますか？共有内容への反映には「共有して保存」が必要です。')) return;
  budget.value = '';
  rate.value = '';
  manual = false;
  for (const row of rows.children) {
   row.querySelector('.hours').value = '0';
   row.querySelector('.minutes').value = '0';
   row.querySelector('.farm').value = '0';
  }
  update();
  $('bonusStatus').textContent = '名前を残して、出勤時間・総支給額・時給・ファームボーナスをリセットしました。';
 };
 $('addBonusRow').onclick = () => addRow().querySelector('input').focus();
 $('copyBonus').onclick = async () => {
  if (!lastResult) return;
  const lines = ['ボーナス計算', `総支給額（予算）：${yen(integer(budget))}`, `合計出勤時間：${time(lastResult.totalMinutes)}`, `1時間あたり：${yen(lastResult.rate)}`, ''];
  [...rows.children].forEach((row,i) => {
   const name = row.querySelector('.employee-name').value.trim() || `未入力 ${i+1}`;
   const minutes = integer(row.querySelector('.hours'))*60n + integer(row.querySelector('.minutes'));
   lines.push(`${name}：${time(minutes)} ＋ ファーム ${yen(lastResult.farms[i])} → ${yen(lastResult.amounts[i])}`);
  });
  lines.push('',`実際の支給合計：${yen(lastResult.paid)}`,`残額：${yen(lastResult.remaining)}`);
  try { await navigator.clipboard.writeText(lines.join('\n')); $('bonusStatus').textContent = '計算結果をコピーしました。'; }
  catch { $('bonusStatus').textContent = 'コピーできませんでした。画面の結果を選択してコピーしてください。'; }
 };
 window.addEventListener('beforeunload',event=>{if(dirty||saving){event.preventDefault();event.returnValue='';}});
 window.addEventListener('pagehide',()=>{app.hidden=true;rows.replaceChildren();budget.value='';rate.value='';lastResult=null;});
 window.addEventListener('pageshow',event=>{if(event.persisted)location.reload();});
 app.hidden=false;$('saveSharedBonus').disabled=true;
 try{
  const result=await loadShared(true);
  // Only offer the owner's original local draft when no shared record exists.
  if(!result.payload&&SiteAuth.access.role==='owner'){
   try{
    const raw=storageKey&&localStorage.getItem(storageKey);const draft=raw&&JSON.parse(raw);
    if(draft?.version===1&&typeof draft.budget==='string'&&typeof draft.rate==='string'&&Array.isArray(draft.rows)){
     applyDraft(draft);dirty=true;
     $('saveStatus').textContent='このブラウザに保存されていた内容を復元しました。「共有して保存」で3人に共有できます。';
    }
   }catch{$('saveStatus').textContent='以前のブラウザ保存を読み込めませんでした。元の保存データは残しています。';}
  }
  $('saveSharedBonus').disabled=false;
 }catch{$('saveStatus').textContent='共有データを読み込めませんでした。「共有内容を更新」を押してください。';}
 setInterval(async()=>{
  if(document.visibilityState!=='visible'||dirty||saving||sharedVersion===null)return;
  try{await loadShared();}catch{$('saveStatus').textContent='共有内容の更新に失敗しました。通信状況を確認してください。';}
 },10000);
})();
