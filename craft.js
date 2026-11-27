(() => {
 'use strict';
 const materials=['ゴム','スティール','プラスチック','鉄くず','空のニトロボトル'];
 const recipes=[];
 const add=(category,name,tier,amounts,note='')=>{if(tier===1||tier===2)return;recipes.push({category,name,tier,amounts,note});};
 add('整備・修理','メカニック専用ボックス',0,[200,150,150]);
 add('整備・修理','エンジンオイル',0,[1]);
 add('整備・修理','スパークプラグ',0,[0,1], '素材');add('整備・修理','スパークプラグ',0,[0,0,0,30],'鉄くず');
 add('整備・修理','車両バッテリー',0,[0,0,1],'素材');add('整備・修理','車両バッテリー',0,[0,0,0,25],'鉄くず');
 add('整備・修理','アクセルパーツ',0,[0,1],'素材');add('整備・修理','アクセルパーツ',0,[0,0,0,30],'鉄くず');
 add('整備・修理','スペアタイヤ',0,[1]);
 add('性能','スーパーチャージャー',0,[5,5]);add('性能','アンチラグ',0,[0,5]);add('性能','耐久パーツ',0,[20,45,25]);
 for(let t=1;t<=5;t++)add('性能','エンジン',t,[0,4*t]);
 for(let t=1;t<=4;t++)add('性能','トランスミッション',t,[0,2*t,t===4?7:2*t]);
 for(let t=1;t<=4;t++)add('性能','ブレーキ',t,[2*t,0,2*t]);
 for(let t=1;t<=5;t++)add('性能','サスペンション',t,[2*t,2*t]);
 [4,6,12].forEach((n,i)=>add('追加パーツ','オイルポンプ',i+1,[0,0,n]));
 [[2,0,2],[4,0,4],[4,0,8]].forEach((n,i)=>add('追加パーツ','ドライブシャフト',i+1,n));
 [4,6,12].forEach((n,i)=>add('追加パーツ','シリンダーヘッド',i+1,[n]));
 for(let t=1;t<=3;t++)add('追加パーツ','バッテリーケーブル',t,[2*t,2*t]);
 for(let t=1;t<=3;t++)add('追加パーツ','燃料タンク',t,[0,2*t,2*t]);
 add('ニトロ','ニトロボトル',0,[0,0,0,0,1],'空ボトルを使用');add('ニトロ','ニトロボトル',0,[3,5,5],'素材で作成');add('ニトロ','ニトロボトル',0,[2,0,3,45],'鉄くずを使用');
 const $=id=>document.getElementById(id),el=(tag,text)=>{const node=document.createElement(tag);if(text!==undefined)node.textContent=text;return node;};
 const quantities=recipes.map(()=>0),rows=[];
 const fmt=n=>n.toLocaleString('ja-JP');
 function total(){
  const sums=materials.map((_,m)=>recipes.reduce((sum,r,i)=>sum+(r.amounts[m]||0)*quantities[i],0));
  $('craftTotals').replaceChildren(...materials.map((name,i)=>{const box=el('div');box.append(el('span',name),el('strong',fmt(sums[i])));return box;}));
  $('craftCount').textContent='作成個数：'+fmt(quantities.reduce((a,b)=>a+b,0))+'個';
 }
 recipes.forEach((recipe,i)=>{
  const row=el('tr'),name=el('th',recipe.name);name.scope='row';if(recipe.note)name.append(el('small',recipe.note));row.append(name,el('td',recipe.tier?'Tier '+recipe.tier:'—'));
  materials.forEach((material,m)=>{const cell=el('td',recipe.amounts[m]?fmt(recipe.amounts[m]):'—');cell.dataset.label=material;row.append(cell);});
  const td=el('td'),control=el('div');td.dataset.label='作成個数';control.className='craft-quantity';const input=el('input');input.type='number';input.min='0';input.max='9999';input.step='1';input.inputMode='numeric';input.value='0';
  const label=recipe.name+(recipe.tier?' Tier '+recipe.tier:'')+(recipe.note?' '+recipe.note:'');input.setAttribute('aria-label',label+'の作成個数');
  const update=value=>{quantities[i]=Math.min(9999,Math.max(0,Math.floor(Number(value)||0)));input.value=String(quantities[i]);row.classList.toggle('chosen',quantities[i]>0);total();};
  input.addEventListener('input',()=>update(input.value));
  [-1,1].forEach(d=>{const button=el('button',d<0?'−':'＋');button.type='button';button.setAttribute('aria-label',label+'を1'+(d<0?'減らす':'増やす'));button.onclick=()=>update(quantities[i]+d);control.append(button);if(d<0)control.append(input);});td.append(control);row.append(td);$('craftBody').append(row);rows.push(row);
 });
 function filter(){const query=$('craftSearch').value.trim().toLowerCase(),category=$('craftCategory').value;let count=0;recipes.forEach((r,i)=>{rows[i].hidden=!!((category&&r.category!==category)||![r.name,r.note,r.tier?'Tier '+r.tier:''].join(' ').toLowerCase().includes(query));if(!rows[i].hidden)count++;});$('craftEmpty').hidden=count!==0;}
 $('craftSearch').addEventListener('input',filter);$('craftCategory').addEventListener('change',filter);
 $('craftReset').onclick=()=>{quantities.fill(0);rows.forEach(row=>{row.querySelector('input').value='0';row.classList.remove('chosen');});total();};
 try{document.body.classList.toggle('dark',localStorage.getItem('theme')==='dark');}catch{}
 $('themeButton').onclick=()=>{document.body.classList.toggle('dark');try{localStorage.setItem('theme',document.body.classList.contains('dark')?'dark':'light');}catch{}};
 total();
 // Stable recipe keys distinguish alternate recipes and survive reordering.
 const recipeKey=r=>JSON.stringify([r.category,r.name,r.tier,r.note]);
 let sets=[],storageKey;
 const status=message=>{$('craftSetStatus').textContent=message;};
 const selected=()=>sets.find(set=>set.id===$('craftSetSelect').value);
 function selection(){
  const set=selected();
  $('craftSetLoad').disabled=!set;$('craftSetDelete').disabled=!set;
  $('craftSetPreview').textContent=set?set.items.map(item=>{
   const r=recipes.find(r=>recipeKey(r)===item.key);
   return (r?r.name+(r.tier?' Tier '+r.tier:'')+(r.note?'（'+r.note+'）':''):'未対応のアイテム')+' × '+item.quantity;
  }).join(' ／ '):'';
 }
 function renderSets(id=''){
  $('craftSetSelect').replaceChildren(new Option('セットを選択',''),...sets.map(set=>new Option(set.name,set.id)));
  $('craftSetSelect').value=id;selection();
 }
 function persist(next){
  try{localStorage.setItem(storageKey,JSON.stringify(next));sets=next;return true;}
  catch{status('保存できませんでした。ブラウザの保存設定や空き容量をご確認ください。');return false;}
 }
 $('craftSetSelect').onchange=selection;
 $('craftSetSave').onclick=()=>{
  const name=$('craftSetName').value.trim();
  if(!name){status('セット名を入力してください。');return;}
  const items=recipes.flatMap((r,i)=>quantities[i]>0?[{key:recipeKey(r),quantity:quantities[i]}]:[]);
  if(!items.length){status('保存するアイテムの個数を1個以上にしてください。');return;}
  const old=sets.find(set=>set.name===name);
  if(old&&!confirm('「'+name+'」を現在の個数で上書きしますか？'))return;
  const set={id:old?.id||crypto.randomUUID(),name,items};
  const next=old?sets.map(s=>s.id===old.id?set:s):[...sets,set];
  if(persist(next)){renderSets(set.id);status('「'+name+'」を保存しました。');}
 };
 $('craftSetLoad').onclick=()=>{
  const set=selected();if(!set)return;
  if(set.items.some(item=>!recipes.some(r=>recipeKey(r)===item.key))){status('現在の一覧にないアイテムが含まれるため、呼び出せません。');return;}
  if(quantities.some(n=>n>0)&&!confirm('現在の作成個数を「'+set.name+'」の内容で置き換えますか？'))return;
  recipes.forEach((r,i)=>{quantities[i]=set.items.find(item=>item.key===recipeKey(r))?.quantity||0;rows[i].querySelector('input').value=String(quantities[i]);rows[i].classList.toggle('chosen',quantities[i]>0);});
  $('craftSearch').value='';$('craftCategory').value='';filter();total();
  $('craftSetName').value=set.name;status('「'+set.name+'」を呼び出しました。');
 };
 $('craftSetDelete').onclick=()=>{
  const set=selected();if(!set||!confirm('保存したセット「'+set.name+'」を削除しますか？現在の作成個数は残ります。'))return;
  if(persist(sets.filter(s=>s.id!==set.id))){renderSets();status('セットを削除しました。');}
 };
 SiteAuth.ready.then(()=>{
  const access=SiteAuth.access;
  if(!['owner','admin','member'].includes(access?.role)||!access.discord_id)return;
  storageKey='mechanic-craft-sets-v1:'+access.discord_id;
  try{
   const raw=localStorage.getItem(storageKey),saved=raw?JSON.parse(raw):[];
   if(!Array.isArray(saved)||!saved.every(s=>s&&typeof s.id==='string'&&typeof s.name==='string'&&Array.isArray(s.items)&&s.items.every(i=>typeof i.key==='string'&&Number.isInteger(i.quantity)&&i.quantity>0&&i.quantity<=9999)))throw Error('invalid');
   sets=saved;renderSets();$('craftSetSave').disabled=false;
  }catch{status('保存済みセットを読み込めませんでした。保存内容を保護するため登録を停止しています。');}
 }).catch(()=>status('ログインを確認できませんでした。'));
})();
