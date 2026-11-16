(() => {
 'use strict';
 const $=id=>document.getElementById(id),core=AttendanceCore;
 const status=$('attendanceStatus'),error=$('attendanceError'),start=$('weekStart');
 let members=[],days=[],loaded=false,reading=false,saving=false,store,signature='';
 let selected=core.localDate();
 const monday=()=>{const now=new Date(),day=now.getDay();return core.shiftDate(core.localDate(now),-(day===0?6:day-1));};
 selected=monday();start.value=selected;
 const theme=$('themeButton');
 try{document.body.classList.toggle('dark',localStorage.getItem('theme')==='dark');}catch{}
 theme.addEventListener('click',()=>{document.body.classList.toggle('dark');try{localStorage.setItem('theme',document.body.classList.contains('dark')?'dark':'light');}catch{}});
 const element=(tag,text)=>{const el=document.createElement(tag);if(text!==undefined)el.textContent=text;return el;};
 function showError(message){error.textContent=message;error.hidden=!message;}
 function busy(){
  const waiting=reading||saving;
  ['weekStart','previousWeek','nextWeek','currentWeek','refreshAttendance'].forEach(id=>$(id).disabled=waiting);
  $('addMemberButton').disabled=waiting||!loaded;
  document.querySelectorAll('#attendanceBody input,#memberList button').forEach(el=>el.disabled=waiting||!loaded);
 }
 function render(force=false){
  const dates=core.weekDates(selected),nextSignature=JSON.stringify({selected,members,days});
  if(!force&&signature===nextSignature)return;
  signature=nextSignature;
  const head=$('attendanceHead'),body=$('attendanceBody'),foot=$('attendanceFoot');head.replaceChildren();body.replaceChildren();foot.replaceChildren();
  $('weekCaption').textContent=dates[0].replaceAll('-','/')+' 〜 '+dates[6].replaceAll('-','/');
  const header=element('tr'),nameHead=element('th','名前');nameHead.scope='col';header.append(nameHead);
  dates.forEach(date=>{const th=element('th',Number(date.slice(5,7))+'/'+Number(date.slice(8,10)));th.scope='col';th.append(element('small',['日','月','火','水','木','金','土'][new Date(date+'T00:00:00Z').getUTCDay()]));if(date===core.localDate())th.className='today';header.append(th);});
  const totalHead=element('th','出勤');totalHead.scope='col';header.append(totalHead);head.append(header);
  const lookup=new Map(days.map(day=>[day.member_id+'/'+day.work_date,day]));const totals=Array(7).fill(0);
  members.forEach(member=>{const tr=element('tr'),name=element('th',member.name);name.scope='row';tr.append(name);let count=0;
   dates.forEach((date,index)=>{const record=lookup.get(member.id+'/'+date),td=element('td'),label=element('label'),checkbox=element('input');checkbox.type='checkbox';checkbox.checked=record?.present===true;checkbox.setAttribute('aria-label',member.name+' '+date+' 出勤');checkbox.dataset.member=member.id;checkbox.dataset.date=date;
    if(checkbox.checked){count++;totals[index]++;}
    checkbox.addEventListener('change',()=>saveDay(member,date,checkbox.checked,record?.version));label.append(checkbox);td.append(label);tr.append(td);});
   tr.append(element('td',count+'日'));body.append(tr);
  });
  const footer=element('tr'),footerName=element('th','出勤人数');footerName.scope='row';footer.append(footerName);totals.forEach(total=>footer.append(element('td',total+'人')));footer.append(element('td','—'));foot.append(footer);
  $('attendanceEmpty').hidden=!loaded||members.length>0;$('memberCount').textContent='登録 '+members.length+'名';
  const list=$('memberList');list.replaceChildren();members.forEach(member=>{const li=element('li'),name=element('span',member.name),button=element('button','削除');button.type='button';button.className='danger';button.setAttribute('aria-label',member.name+'を名簿から削除');button.addEventListener('click',()=>confirmRemove(member));li.append(name,button);list.append(li);});busy();
 }
 async function refresh(){
  if(reading||saving||!store)return;
  reading=true;busy();status.textContent='共有データを読み込んでいます…';
  try{const result=await store.load(selected);members=result.members;days=result.days;loaded=true;render();showError('');status.textContent='共有済み · '+new Date().toLocaleTimeString('ja-JP')+' 時点（15秒ごとに更新）';}
  catch(e){showError(e.message);status.textContent=loaded?'更新できませんでした。直前の一覧を表示しています。':'共有データを取得できていません。名簿とチェックは取得後に操作できます。';}
  finally{reading=false;busy();}
 }
 async function saveDay(member,date,present,version){
  if(!loaded||reading||saving){render(true);return;}
  saving=true;busy();showError('');status.textContent='出勤チェックを保存しています…';
  try{const saved=await store.set(member.id,date,present,version);if(saved?.member_id!==member.id||saved.work_date!==date||saved.present!==present)throw new Error('保存結果を確認できません。一覧を更新してください。');days=days.filter(d=>!(d.member_id===member.id&&d.work_date===date));days.push(saved);status.textContent='出勤チェックを全員に共有しました。';}
  catch(e){showError(e.message);status.textContent='変更を確定できませんでした。一覧を更新して保存状態をご確認ください。';}
  finally{saving=false;render(true);busy();}
 }
 function changeWeek(value){
  if(reading||saving){start.value=selected;return;}
  try{core.weekDates(value);}catch(e){showError(e.message);start.value=selected;return;}
  selected=value;start.value=selected;loaded=false;members=[];days=[];render(true);refresh();
 }
 start.addEventListener('change',()=>changeWeek(start.value));
 $('previousWeek').addEventListener('click',()=>changeWeek(core.shiftDate(selected,-7)));
 $('nextWeek').addEventListener('click',()=>changeWeek(core.shiftDate(selected,7)));
 $('currentWeek').addEventListener('click',()=>changeWeek(monday()));
 $('refreshAttendance').addEventListener('click',refresh);
 $('addMemberForm').addEventListener('submit',async event=>{
  event.preventDefault();if(!loaded||reading||saving)return;
  let name;try{name=core.memberName($('memberName').value);}catch(e){showError(e.message);return;}
  saving=true;busy();showError('');status.textContent='名簿に追加しています…';
  try{const member=await store.add(name);if(!member?.id)throw new Error('登録結果を確認できません。一覧を更新してください。');members.push(member);$('memberName').value='';status.textContent='「'+member.name+'」を名簿に追加しました。';}
  catch(e){showError(e.message);status.textContent='名簿への追加を確定できませんでした。';}
  finally{saving=false;render(true);busy();}
 });
 function confirmRemove(member){
  if(reading||saving)return;
  const dialog=$('removeMemberDialog');$('removeMemberText').textContent='「'+member.name+'」を全週の名簿から削除します。';
  dialog.returnValue='';dialog.addEventListener('close',()=>{if(dialog.returnValue==='remove')remove(member);},{once:true});dialog.showModal();
 }
 async function remove(member){
  if(reading||saving){showError('一覧の更新中です。もう一度削除を選んでください。');return;}
  saving=true;busy();showError('');status.textContent='名簿を更新しています…';
  try{const saved=await store.archive(member);if(saved?.id!==member.id||!saved.archived_at)throw new Error('削除結果を確認できません。一覧を更新してください。');members=members.filter(m=>m.id!==member.id);days=days.filter(d=>d.member_id!==member.id);status.textContent='「'+member.name+'」を名簿から削除しました。';}
  catch(e){showError(e.message);status.textContent='削除を確定できませんでした。';}
  finally{saving=false;render(true);busy();}
 }
 try{store=new core.Store(window.COLOR_STORAGE);}catch(e){showError(e.message);$('refreshAttendance').disabled=true;return;}
 render();refresh();setInterval(()=>{if(!document.hidden&&!$('removeMemberDialog').open&&!error.hidden)return;if(!document.hidden&&!$('removeMemberDialog').open)refresh();},15000);
 window.addEventListener('online',refresh);document.addEventListener('visibilitychange',()=>{if(!document.hidden&&!$('removeMemberDialog').open)refresh();});
})();
