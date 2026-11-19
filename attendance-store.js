(function(root){
 'use strict';
 function shiftDate(value,offset){
  if(!/^\d{4}-\d{2}-\d{2}$/.test(value))throw new Error('日付を入力してください。');
  const date=new Date(value+'T00:00:00Z');
  if(!Number.isFinite(date.getTime())||date.toISOString().slice(0,10)!==value)throw new Error('正しい日付を入力してください。');
  date.setUTCDate(date.getUTCDate()+offset);return date.toISOString().slice(0,10);
 }
 function weekDates(start){const dates=Array.from({length:7},(_,i)=>shiftDate(start,i));if(start<'2000-01-01'||dates[6]>'2100-12-31')throw new Error('2000年から2100年の範囲で入力してください。');return dates;}
 function localDate(date=new Date()){return [date.getFullYear(),String(date.getMonth()+1).padStart(2,'0'),String(date.getDate()).padStart(2,'0')].join('-');}
 function memberName(value){const name=value.trim();if(!name||name.length>60)throw new Error('名前を1〜60文字で入力してください。');return name;}
 class Store{
  constructor(config,fetcher=root.fetch.bind(root)){if(!config||!/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(config.url)||!/^sb_publishable_[A-Za-z0-9_-]+$/.test(config.publishableKey))throw new Error('共有保存先の設定を確認してください。');this.config=config;this.fetcher=fetcher;}
  async request(path,body){
   const authToken = await root.SiteAuth.token();
   let response;try{response=await this.fetcher(this.config.url+'/rest/v1/'+path,{method:body?'POST':'GET',headers:{Authorization:"Bearer "+authToken,apikey:this.config.publishableKey,'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined,cache:'no-store',signal:AbortSignal.timeout(12000)});}catch{throw new Error('共有保存先に接続できません。「一覧を更新」で再試行してください。続く場合は保存先の稼働状況を確認してください。');}
   const data=await response.json().catch(()=>null);
   if(!response.ok){const messages={edit_conflict:'別の人が先に変更しました。一覧を更新してから、もう一度操作してください。',member_missing:'この名前は名簿から削除されています。一覧を更新してください。',write_limit:'更新が集中しています。1分ほど待って再試行してください。',member_limit:'名簿は200名までです。',invalid_name:'名前を1〜60文字で入力してください。',invalid_day:'日付を確認してください。'};throw new Error(data?.code==='23505'?'同じ名前が登録されています。':messages[data?.message]||'共有保存に失敗しました。変更は確定していません。一覧を更新してください。');}
   return data;
  }
  async load(start){const dates=weekDates(start);const [members,days]=await Promise.all([this.request('attendance_members?select=id,name,version&order=sort_order.asc,id.asc&limit=200'),this.request('attendance_days?select=member_id,work_date,present,version&work_date=gte.'+dates[0]+'&work_date=lte.'+dates[6]+'&order=member_id.asc,work_date.asc&limit=1500')]);
   // PostgREST may cap rows at 1000; load each day if the snapshot reaches that cap.
   const allDays=days.length>=1000?(await Promise.all(dates.map(date=>this.request('attendance_days?select=member_id,work_date,present,version&work_date=eq.'+date+'&limit=200')))).flat():days;
   return {members,days:allDays};
  }
  add(name){return this.request('rpc/add_attendance_member',{p_name:memberName(name)});}
  move(id,direction,members){return this.request('rpc/move_attendance_member',{p_id:id,p_direction:direction,p_order:members.map(m=>m.id)});}
  archive(member){return this.request('rpc/archive_attendance_member',{p_id:member.id,p_version:member.version});}
  set(member,date,present,version){shiftDate(date,0);if(date<'2000-01-01'||date>'2100-12-31')throw new Error('日付を確認してください。');return this.request('rpc/set_attendance_day',{p_member_id:member,p_date:date,p_present:present,p_version:version??null});}
 }
 root.AttendanceCore={shiftDate,weekDates,localDate,memberName,Store};
 if(typeof module!=='undefined')module.exports=root.AttendanceCore;
})(typeof window==='undefined'?globalThis:window);
