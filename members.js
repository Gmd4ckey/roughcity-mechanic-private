(async()=>{
 'use strict';await SiteAuth.ready;
 const list=document.getElementById('memberList'),status=document.getElementById('memberStatus'),refresh=document.getElementById('refreshMembers');
 const roles={owner:'オーナー',admin:'管理者',member:'メンバー',pending:'承認待ち',blocked:'利用停止'};
 let busy=false;
 function disabled(value){for(const button of document.querySelectorAll('.access-panel button'))button.disabled=value;}
 async function load(){
  if(busy)return;busy=true;disabled(true);
  try{
   await SiteAuth.refresh();const members=await SiteAuth.rpc('site_list_members');list.replaceChildren();
   for(const member of members){
    const row=document.createElement('section');row.className='member-entry';
    const info=document.createElement('div'),name=document.createElement('p'),id=document.createElement('small');
    name.textContent=(member.display_name||member.discord_id)+' · '+roles[member.role];id.textContent=member.discord_id;info.append(name,id);row.append(info);
    const owner=SiteAuth.access.role==='owner';
    if(member.role!=='owner'&&member.discord_id!==SiteAuth.access.discord_id&&(owner||member.role!=='admin')){
     const actions=document.createElement('div');actions.className='access-actions';
     for(const role of (owner?['member','admin','blocked']:['member','blocked'])){
      if(role===member.role)continue;
      const button=document.createElement('button');button.textContent={member:member.role==='admin'?'管理者を解除':'利用を許可',admin:'管理者にする',blocked:'利用を停止'}[role];
      button.onclick=async()=>{
       if(busy||!confirm((member.display_name||member.discord_id)+'（'+member.discord_id+'）を「'+roles[role]+'」に変更しますか？'))return;
       busy=true;disabled(true);
       try{await SiteAuth.rpc('site_set_role',{p_discord_id:member.discord_id,p_role:role,p_version:member.version});status.textContent='変更しました。';}
       catch(e){status.textContent=SiteAuth.errorText(e);}
       finally{busy=false;disabled(false);await load();}
      };actions.append(button);
     }row.append(actions);
    }list.append(row);
   }
  }catch(e){list.replaceChildren();status.textContent=SiteAuth.errorText(e);}
  finally{busy=false;disabled(false);}
 }
 refresh.onclick=load;await load();
})();
