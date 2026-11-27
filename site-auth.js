/* Loaded before page scripts. Database permissions are the security boundary. */
(() => {
 'use strict';
 const loginPage=location.pathname.endsWith('/login.html');
 const bonusPage=location.pathname.endsWith('/bonus.html');
 const bonusAdmins=new Set(['626065423024128010','1051175275880259716']);
 const canUseBonus=()=>access?.role==='owner'||(access?.role==='admin'&&bonusAdmins.has(access.discord_id));
 const base=new URL('./',location.href);
 let client,access,checking=false;
 const text=(id,value)=>{const el=document.getElementById(id);if(el)el.textContent=value;};
 const loginUrl=new URL('login.html',base).href;
 const errorText=e=>({edit_conflict:'別の管理者が変更しました。更新してから操作してください。',owner_required:'管理者の変更はオーナーだけが行えます。',protected_account:'このアカウントの権限は変更できません。',not_authorized:'この操作を行う権限がありません。',request_limit:'申請が混み合っています。管理者へ連絡してください。'}[e?.message]||'通信またはログイン設定を確認して、もう一度お試しください。');
 function lock(){document.documentElement.classList.remove('site-authorized');location.replace(loginUrl);}
 async function rpc(name,args){const {data,error}=await client.rpc(name,args);if(error)throw error;return data;}
 async function refresh(){
  if(checking)return access;checking=true;
  try{access=await rpc('site_access');if(!loginPage&&!['owner','admin','member'].includes(access.role))lock();
   if(bonusPage&&!canUseBonus()){document.documentElement.classList.remove('site-authorized');document.getElementById('bonusApp')?.replaceChildren();location.replace(new URL('index.html',base));}
   return access;}
  catch(e){if(!loginPage)lock();throw e;}finally{checking=false;}
 }
 async function token(){
  await window.SiteAuth.ready;
  const {data,error}=await client.auth.getSession();
  if(error||!data.session){lock();throw Error('ログインしてください。');}
  return data.session.access_token;
 }
 async function logout(){
  await client.auth.signOut({scope:'local'});location.replace(loginUrl);
 }
 function addNavigation(){
  const nav=document.createElement('div');nav.className='site-account';
  if(document.body.classList.contains('mechanic-page')){
   const command=document.createElement('div');command.className='mechanic-command';
   const field=document.createElement('input');field.type='text';field.value='/mechanicxp';field.readOnly=true;field.setAttribute('aria-label','メカニックコマンド');
   const copy=document.createElement('button');copy.type='button';copy.textContent='コピー';copy.setAttribute('aria-label','/mechanicxpをコピー');
   const status=document.createElement('span');status.className='command-copy-status';status.setAttribute('role','status');
   let timer;
   copy.onclick=async()=>{
    clearTimeout(timer);
    try{await navigator.clipboard.writeText(field.value);copy.textContent='コピー済み';status.textContent='コピーしました';}
    catch{field.focus();field.select();status.textContent='選択した文字をコピーしてください';}
    timer=setTimeout(()=>{copy.textContent='コピー';status.textContent='';},2500);
   };
   command.append(field,copy,status);nav.append(command);
  }
  const role=document.createElement('span');role.textContent={owner:'オーナー',admin:'管理者',member:'メンバー'}[access.role];nav.append(role);
  if(['owner','admin'].includes(access.role)){const a=document.createElement('a');a.href='members.html';a.textContent='メンバー管理';nav.append(a);}
  if(canUseBonus()){const a=document.createElement('a');a.href='bonus.html';a.textContent='ボーナス計算';nav.append(a);}
  const button=document.createElement('button');button.type='button';button.textContent='ログアウト';button.onclick=()=>logout().catch(()=>text('authMessage','ログアウトに失敗しました。'));nav.append(button);
  document.body.prepend(nav);
 }
 async function start(){
  await new Promise(resolve=>{if(document.readyState!=='loading')resolve();else document.addEventListener('DOMContentLoaded',resolve,{once:true});});
  try {
   const {createClient}=await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.49.8/+esm');
   client=createClient(COLOR_STORAGE.url,COLOR_STORAGE.publishableKey,{auth:{flowType:'pkce',detectSessionInUrl:true,persistSession:true,autoRefreshToken:true}});
   const {data,error}=await client.auth.getSession();if(error)throw error;
   // The SDK handles the PKCE callback; remove OAuth query text from the address afterwards.
   if(loginPage&&location.search)history.replaceState(null,'',loginUrl);
   if(!data.session){
    if(!loginPage){lock();return false;}
    document.getElementById('discordLogin').hidden=false;text('authMessage','許可されたメンバーだけが利用できます。');
   }else{
    await refresh();
    if(loginPage){
     document.getElementById('signOut').hidden=false;
     text('discordId',(access.display_name||access.username||'Discordアカウント')+(access.username?'（@'+access.username+'）':''));
     if(['owner','admin','member'].includes(access.role)){location.replace(new URL('index.html',base));return true;}
     text('authMessage',access.role==='blocked'?'現在、利用が許可されていません。管理者へ連絡してください。':access.role==='pending'?'承認待ちです。管理者の承認後に「承認状況を確認」を押してください。':'ログインできました。利用申請を送ってください。');
     document.getElementById('requestAccess').hidden=access.role!=='unregistered';
     document.getElementById('refreshAccess').hidden=false;
    }else if(['owner','admin','member'].includes(access.role)&&(!bonusPage||canUseBonus())){
     document.documentElement.classList.add('site-authorized');addNavigation();
     setInterval(()=>{if(document.visibilityState==='visible')refresh().catch(()=>{});},15000);
     document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')refresh().catch(()=>{});});
    }
   }
   client.auth.onAuthStateChange(event=>{if(event==='SIGNED_OUT'&&!loginPage)lock();});
   if(loginPage){
    document.getElementById('discordLogin').onclick=async()=>{try{const {error}=await client.auth.signInWithOAuth({provider:'discord',options:{redirectTo:loginUrl}});if(error)throw error;}catch(e){text('authMessage',errorText(e));}};
    document.getElementById('requestAccess').onclick=async()=>{try{await rpc('site_request_access');location.reload();}catch(e){text('authMessage',errorText(e));}};
    document.getElementById('refreshAccess').onclick=()=>location.reload();
    document.getElementById('signOut').onclick=()=>logout();
   }
   return !!data.session;
  }catch(e){
   if(loginPage)text('authMessage',errorText(e));
   else lock();
   return false;
  }
 }
 window.SiteAuth={ready:null,token,rpc,refresh,errorText,canUseBonus,get access(){return access;}};
 window.SiteAuth.ready=start();
})();
