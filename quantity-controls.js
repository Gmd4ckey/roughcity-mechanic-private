(() => {
 'use strict';
 document.querySelectorAll('.repair-quantity, .sale-quantity').forEach(input => {
  const name=input.closest('.repair-item, .sales-item').querySelector('strong').textContent.trim();
  const control=document.createElement('div');control.className='quantity-control';
  control.setAttribute('role','group');control.setAttribute('aria-label',name+'の数量');
  input.setAttribute('aria-label',name+'の数量');input.inputMode='numeric';
  input.before(control);
  const makeButton=(text,delta)=>{
   const button=document.createElement('button');button.type='button';button.textContent=text;
   button.setAttribute('aria-label',name+'を1'+(delta>0?'増やす':'減らす'));
   button.addEventListener('click',()=>{
    if(input.disabled||input.readOnly)return;
    const current=Number(input.value),minimum=Number(input.min)||0;
    const next=Math.max(minimum,Math.floor(Number.isFinite(current)?current:minimum)+delta);
    input.value=String(input.max!==''?Math.min(Number(input.max),next):next);
    input.dispatchEvent(new Event('input',{bubbles:true}));
   });return button;
  };
  control.append(makeButton('−',-1),input,makeButton('＋',1));
 });
})();
