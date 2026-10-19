export function installationGuide(navigator={}){
 const agent=navigator.userAgent||'';
 if(/KAKAOTALK|NAVER|Instagram|FBAN|FBAV/i.test(agent))return {kind:'in-app',title:'외부 브라우저에서 열어주세요',steps:['현재 앱의 메뉴에서 외부 브라우저로 열기를 선택하세요.','Android는 Chrome, 아이폰은 Safari에서 도감을 여세요.','브라우저 메뉴의 앱 설치 또는 홈 화면에 추가를 선택하세요.']};
 const ios=/iPhone|iPad|iPod/i.test(agent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
 if(ios)return {kind:'ios',title:'아이폰·아이패드에서 추가하기',steps:['Safari에서 이 도감을 여세요.','공유 메뉴를 열고 홈 화면에 추가를 선택하세요. 메뉴 안쪽에 있을 수 있습니다.','이름을 확인하고 추가를 누른 뒤 홈 화면의 아이콘을 열어보세요.']};
 if(/Android/i.test(agent))return {kind:'android',title:'Android에서 추가하기',steps:['Chrome에서 이 도감을 여세요.','오른쪽 위 메뉴의 앱 설치 또는 홈 화면에 추가를 선택하세요.','안내에 따라 추가하고 홈 화면의 아이콘을 열어보세요.']};
 return {kind:'other',title:'브라우저에서 추가하기',steps:['브라우저 주소창이나 메뉴에서 앱 설치 또는 홈 화면에 추가 항목을 찾아보세요.','지원하지 않는 브라우저에서는 즐겨찾기로 저장해 이용할 수 있습니다.']};
}
export function createInstallController(environment,onChange=()=>{}){
 let active=true,pending=null,media;
 try{media=environment.matchMedia?.('(display-mode: standalone)');}catch(_){}
 const isStandalone=()=>!!media?.matches||environment.navigator?.standalone===true;
 let state={canPrompt:false,installing:false,standalone:isStandalone(),addedThisSession:false,message:''};
 const emit=patch=>{if(!active)return;state={...state,...patch};onChange({...state});};
 const before=event=>{if(typeof event.prompt!=='function'||isStandalone())return;event.preventDefault();if(state.installing)return;pending=event;emit({canPrompt:true,message:''});};
 const installed=()=>{pending=null;emit({canPrompt:false,installing:false,addedThisSession:true,message:'홈 화면 추가가 완료되었습니다. 아이콘을 눌러 열어보세요.'});};
 const changed=()=>emit({standalone:isStandalone(),canPrompt:isStandalone()?false:!!pending});
 environment.addEventListener('beforeinstallprompt',before);environment.addEventListener('appinstalled',installed);
 if(media?.addEventListener)media.addEventListener('change',changed);else media?.addListener?.(changed);
 onChange({...state});
 return {
  getState:()=>({...state}),
  async install(){
   if(!active||!pending||state.installing||state.standalone)return false;
   const event=pending;pending=null;emit({canPrompt:false,installing:true,message:''});
   try{
    const result=await event.prompt(),choice=event.userChoice?await event.userChoice:result;
    if(!state.addedThisSession)emit({message:choice?.outcome==='accepted'?'설치 요청을 전달했습니다. 홈 화면에서 아이콘을 확인해주세요.':'홈 화면 추가를 취소했습니다. 나중에 브라우저 메뉴에서 다시 추가할 수 있어요.'});
   }catch(_){emit({message:'설치 창을 열지 못했습니다. 아래의 홈 화면 추가 방법을 이용해주세요.'});}
   finally{emit({installing:false});}
   return true;
  },
  dispose(){active=false;pending=null;environment.removeEventListener('beforeinstallprompt',before);environment.removeEventListener('appinstalled',installed);if(media?.removeEventListener)media.removeEventListener('change',changed);else media?.removeListener?.(changed);}
 };
}
