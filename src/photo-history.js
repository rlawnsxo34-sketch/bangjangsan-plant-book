// Only the viewer adds a same-page history entry; no photo URL or data is stored.
const KEY='egmyPhotoViewer';
let sequence=0;
export function createPhotoHistory(win,onClose,onPending=()=>{}){
 const id=`photo-${Date.now()}-${++sequence}`,base=win?.history?.state;
 let active=true,closing=false,supported=false;
 const ownsEntry=()=>win?.history?.state?.[KEY]===id;
 function finish(){if(!active)return;active=false;win?.removeEventListener?.('popstate',pop);onClose();}
 function pop(){if(!ownsEntry())finish();}
 try{
  if(win?.history?.pushState&&win.history.back&&win.addEventListener&&win.removeEventListener){
   win.history.pushState({...base,[KEY]:id},'');supported=true;win.addEventListener('popstate',pop);
  }
 }catch(_){}
 return {
  supported,
  close(){
   if(!active||closing)return;
   if(!supported||!ownsEntry()){finish();return;}
   closing=true;onPending();
   try{win.history.back();}catch(_){try{if(ownsEntry())win.history.replaceState(base,'');}catch(_){}finish();}
  },
  dispose(){
   active=false;win?.removeEventListener?.('popstate',pop);
   // Forced unmount must not move a newer account/center screen backwards.
   if(supported&&!closing&&ownsEntry())try{win.history.replaceState(base,'');}catch(_){}
  }
 };
}
