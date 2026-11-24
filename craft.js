(() => {
 'use strict';
 const materials=['ゴム','スティール','プラスチック','鉄くず','空のニトロボトル'];
 const recipes=[];
 const add=(category,name,tier,amounts,note='')=>recipes.push({category,name,tier,amounts,note});
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
 add('ニトロ','ニトロボトル',0,[0,0,0,0,1],'空ボトルを使用');add('ニトロ','ニトロボトル',0,[37,5,5],'素材で作成');add('ニトロ','ニトロボトル',0,[2,0,3,45],'鉄くずを使用');
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
  materials.forEach((_,m)=>row.append(el('td',recipe.amounts[m]?fmt(recipe.amounts[m]):'—')));
  const td=el('td'),control=el('div');control.className='craft-quantity';const input=el('input');input.type='number';input.min='0';input.max='9999';input.step='1';input.inputMode='numeric';input.value='0';
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
})();
