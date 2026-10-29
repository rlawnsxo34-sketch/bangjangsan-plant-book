import {useEffect,useRef,useState} from 'react';
import {createDraftStore,createDraftQueue,draftKey,draftStorageMessage,hasDraft} from './draft-store.js';
const store=createDraftStore();
export default function useAccountDraft(user,center,draft,saveValue){
 const key=user?draftKey(user.uid,center.id):null;
 const current=useRef(null),sequence=useRef(0);
 const [state,setState]=useState({key:null,ready:false,recovery:null,message:'',failed:false});
 useEffect(()=>{
  if(!key){current.current=null;setState({key:null,ready:false,recovery:null,message:'',failed:false});return;}
  const controller={key,queue:createDraftQueue(store,user.uid,center.id),alive:true,enabled:false,blocked:false};
  current.current=controller;
  setState({key,ready:false,recovery:null,message:'임시 기록을 확인하고 있습니다…',failed:false});
  controller.queue.read().then(row=>{if(!controller.alive)return;controller.enabled=!row;setState({key,ready:true,recovery:row,message:row?'이 기관에서 작성하던 임시 기록이 있습니다. 이어쓰거나 삭제해주세요.':'',failed:false});}).catch(e=>{if(!controller.alive)return;setState({key,ready:true,recovery:null,message:draftStorageMessage(e),failed:true});});
  return()=>{controller.alive=false;if(current.current===controller)current.current=null;};
 },[key]);
 function status(controller,value){if(controller.alive&&current.current===controller)setState(old=>({...old,...value}));}
 async function persist(value,pending){const c=current.current;if(!c||c.key!==key||!c.enabled||c.blocked)return false;const id=++sequence.current;status(c,{message:'기기에 임시 보관 중…',failed:false});try{const row=await c.queue.write(value,pending);if(id===sequence.current)status(c,{message:row?`기기에 임시 보관됨 · ${new Date(row.updatedAt).toLocaleTimeString('ko-KR')} · 계정 저장 전`:'',failed:false});return true;}catch(e){if(e.code==='draft-conflict')c.blocked=true;if(id===sequence.current)status(c,{message:draftStorageMessage(e),failed:true});return false;}}
 useEffect(()=>{const c=current.current;if(key&&c?.enabled&&!c.blocked&&state.key===key&&state.ready&&!state.recovery){if(c.restoring){const d=c.restoring;if(draft.imageData!==d.imageData||JSON.stringify(draft.additionalImages||[])!==JSON.stringify(d.additionalImages||[])||draft.name!==d.name||draft.description!==d.description||JSON.stringify(draft.location)!==JSON.stringify(d.location)||draft.locationSource!==d.locationSource)return;c.restoring=null;}persist(draft,saveValue.current);}},[draft,key,state.ready,state.recovery]);
 async function decide(restore){const c=current.current;if(!c||c.key!==key)return null;const row=state.recovery;
  if(restore){c.enabled=true;c.restoring=row.draft;setState(old=>({...old,recovery:null,message:'임시 기록을 불러왔습니다. 계정 저장은 아직 완료되지 않았습니다.'}));return row;}
  try{await c.queue.remove();if(!c.alive)return null;c.enabled=true;c.blocked=false;setState(old=>({...old,recovery:null,message:'임시 기록을 삭제했습니다.',failed:false}));return true;}catch(e){status(c,{message:draftStorageMessage(e),failed:true});return null;}
 }
 async function clear(){const c=current.current;if(!c||c.key!==key)return false;++sequence.current;try{await c.queue.remove();status(c,{message:'',failed:false});return true;}catch(e){if(e.code==='draft-conflict')c.blocked=true;status(c,{message:'계정 저장 또는 작성 초기화 이후 기기 임시 기록을 삭제하지 못했습니다. '+draftStorageMessage(e),failed:true});return false;}}
 const visible=state.key===key?state:{ready:false,recovery:null,message:'임시 기록 확인 중…',failed:false};
 return {...visible,persist,decide,clear,hasDraft:hasDraft(draft)};
}
