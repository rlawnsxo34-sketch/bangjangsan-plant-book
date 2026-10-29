import React,{useEffect,useMemo,useRef,useState} from 'react';
import config from '../public-config.json';
import {getRuntime} from './cloud-runtime.js';
import {cloudMessage} from './cloud-model.js';
import {EXPERIENCE} from './experience-data.js';
import {readableTree} from './easy-language.js';
import {mapTree} from './tree-map-model.js';
import TreePhotos from './TreePhotos.jsx';
import KakaoTreeCanvas from './KakaoTreeCanvas.jsx';
export default function TreeMapPanel({center,onState,onBack,Canvas=KakaoTreeCanvas,apiKey=config.kakaoMap?.javascriptKey||''}){
 const[rows,setRows]=useState([]),[user,setUser]=useState(null),[canEdit,setCanEdit]=useState(false),[loaded,setLoaded]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState(''),[opened,setOpened]=useState(false),[attempt,setAttempt]=useState(0),[selected,setSelected]=useState(EXPERIENCE.trees[0].id),[draft,setDraft]=useState(null),[consent,setConsent]=useState(false),[busy,setBusy]=useState(false);
 const rt=useRef(null),alive=useRef(false),epoch=useRef(0),currentUser=useRef(null),lock=useRef(false),detail=useRef(null);
 const trees=useMemo(()=>EXPERIENCE.trees.map(t=>mapTree(readableTree(t),center.id,rows)),[rows,center.id]),tree=trees.find(t=>t.id===selected)||trees[0];
 const markers=useMemo(()=>loaded?trees.filter(t=>t.coordinates):[],[trees,loaded]);
 useEffect(()=>{onState({busy,dirty:!!draft});return()=>onState({busy:false,dirty:false});},[busy,draft,onState]);
 useEffect(()=>{if(!draft)return;const warn=e=>{e.preventDefault();e.returnValue='';};window.addEventListener?.('beforeunload',warn);return()=>window.removeEventListener?.('beforeunload',warn);},[!!draft]);
 async function refresh(next=currentUser.current){const token=++epoch.current;setLoaded(false);setError('');setCanEdit(false);
  try{const results=await Promise.allSettled([rt.current.places.list(center.id),next?rt.current.sharing.grants(next.uid):Promise.resolve([])]);if(!alive.current||token!==epoch.current)return;
   if(results[0].status==='rejected')throw results[0].reason;
   setRows(results[0].value);setLoaded(true);if(results[1].status==='fulfilled')setCanEdit(results[1].value.includes(center.id));else setError('담당자 권한'+'을 확인하지 못했어요. 다시 불러와주세요.');
  }catch(e){if(alive.current&&token===epoch.current){setRows([]);setError(cloudMessage(e));}}
 }
 useEffect(()=>{alive.current=true;let stop;try{rt.current=getRuntime();stop=rt.current.subscribe(next=>{epoch.current++;currentUser.current=next;lock.current=false;setBusy(false);setDraft(null);setConsent(false);setRows([]);setCanEdit(false);setUser(next);setNotice('');refresh(next);});}catch(e){setError(cloudMessage(e));}
  return()=>{alive.current=false;epoch.current++;stop?.();};
 },[center.id]);
 function mayDiscard(){return !busy&&(!draft||window.confirm('저장하지 않은 위치 선택을 버릴까요?'));}
 function select(id){if(!mayDiscard())return;setDraft(null);setConsent(false);setSelected(id);setError('');setNotice('');requestAnimationFrame(()=>detail.current?.focus());}
 function startEdit(){if(!loaded||!canEdit||!user||busy)return;setDraft({treeId:tree.id,label:tree.label,coordinates:null,revision:tree.revision});setConsent(false);setNotice('');setError('');setOpened(true);}
 async function write(value,revision){if(lock.current||!user||!canEdit)return;const token=epoch.current,uid=user.uid;lock.current=true;setBusy(true);setError('');
  try{const row=await rt.current.places.save(uid,center.id,tree.id,value,revision);if(alive.current&&token===epoch.current&&currentUser.current?.uid===uid){setRows(old=>[...old.filter(x=>x.id!==row.id),row]);setDraft(null);setConsent(false);setNotice(row.coordinates?'나무 위치를 공개했어요. 다른 기기에서도 볼 수 있어요.':'지도 표시를 지웠어요. 장소 설명은 유지해요.');}}
  catch(e){if(alive.current&&token===epoch.current)setError(cloudMessage(e)+' 선택한 위치는 아직 화면에 남아 있어요.');}
  finally{if(alive.current&&token===epoch.current){lock.current=false;setBusy(false);}}
 }
 return <section className="tree-map-panel" aria-label="나무 지도">
  <h2>나무 지도</h2><p>나무 표시나 아래 이름을 눌러 사진과 관찰할 특징을 확인해보세요.</p>
  {error&&<p role="alert" className="tree-map-alert">{error}</p>}{notice&&<p role="status" className="visit-status">{notice}</p>}{!loaded&&!error&&<p role="status">나무 위치를 확인하고 있어요…</p>}
  <button type="button" className="visit-secondary" disabled={busy} onClick={()=>{if(mayDiscard()){setDraft(null);setConsent(false);refresh();}}}>나무 위치 다시 불러오기</button>
  <div className="tree-map-workspace"><div className="tree-map-area">
   {!apiKey?<p className="tree-map-placeholder">나무 지도는 준비 중이에요. 사진과 장소 안내를 먼저 살펴보세요.</p>:!opened?<div className="tree-map-placeholder"><p>카카오 지도로 이 숲의 나무 위치를 살펴봐요.</p><button type="button" className="visit-primary" onClick={()=>setOpened(true)}>지도 열기</button></div>:<><Canvas key={attempt} apiKey={apiKey} markers={markers} centerName={center.name} onSelect={select} onPick={point=>{if(canEdit&&draft&&!busy){setDraft(d=>d?{...d,coordinates:point}:d);setConsent(false);}}} pending={draft?.coordinates} editable={canEdit&&!!draft&&!busy}/><button type="button" className="center-text-button" disabled={busy||!!draft} onClick={()=>setAttempt(n=>n+1)}>지도 다시 열기</button></>}
   {loaded&&!markers.length&&<p className="tree-map-help">아직 지도에 등록된 나무가 없어요. 장소 설명은 아래에서 볼 수 있어요.</p>}
   <div className="tree-map-names" role="group" aria-label="지도에서 살펴볼 나무">{trees.map(t=><button type="button" key={t.id} className="visit-secondary" disabled={busy} aria-pressed={tree.id===t.id} onClick={()=>select(t.id)}>{t.name}<small>{t.coordinates?'지도 위치 있음':'장소 안내'}</small></button>)}</div>
  </div><div className="tree-map-info" ref={detail} tabIndex={-1} aria-label="선택한 나무 정보"><h3>{tree.name}</h3><TreePhotos tree={tree} centerId={center.id}/><p className="tree-place-label">{tree.label||'이 숲체원의 관찰 장소는 준비 중이에요.'}</p><div className="tree-question"><span>직접 살펴봐요</span><p>{tree.question}</p></div><p className="tree-map-help">기관에서 안내하는 관찰 위치예요. 방문 인증이나 식물 이름의 확정을 뜻하지 않아요.</p>
   {canEdit&&loaded&&!draft&&<div className="tree-map-editor"><h4>담당자 위치 관리</h4><button type="button" className="visit-secondary visit-wide" disabled={busy||!apiKey} onClick={startEdit}>지도에서 나무 위치 고르기</button>{tree.coordinates&&<button type="button" className="visit-secondary visit-wide" disabled={busy} onClick={()=>{if(window.confirm('이 나무의 지도 표시를 지울까요? 사진과 장소 설명은 남아요.'))write({label:tree.label||tree.name+' 관찰 장소',coordinates:null},tree.revision);}}>공개 위치 지우기</button>}</div>}
   {draft&&canEdit&&<form className="tree-map-editor" aria-label="공개 나무 위치 선택" onSubmit={e=>{e.preventDefault();if(draft.coordinates&&consent)write(draft,draft.revision);}}><h4>{tree.name} 위치 고르기</h4><p>지도를 눌러 위치를 고른 뒤 공개해주세요.</p><label>장소 설명<input required maxLength={160} value={draft.label} disabled={busy} onChange={e=>{setDraft(d=>({...d,label:e.target.value}));setConsent(false);}}/></label><p role="status">{draft.coordinates?'위치를 골랐어요. 아직 저장하지 않았어요.':'지도에서 나무가 있는 곳을 눌러주세요.'}</p><label className="share-consent"><input type="checkbox" checked={consent} disabled={busy||!draft.coordinates} onChange={e=>setConsent(e.target.checked)}/><span>선택한 나무 위치와 장소 설명을 모든 방문객에게 공개하는 데 동의해요.</span></label><button type="submit" className="visit-primary visit-wide" disabled={busy||!draft.coordinates||!draft.label.trim()||!consent}>{busy?'저장 중…':'이 위치 공개하기'}</button><button type="button" className="visit-secondary visit-wide" disabled={busy} onClick={()=>{if(mayDiscard()){setDraft(null);setConsent(false);}}}>위치 선택 취소</button></form>}
  </div></div>
  {!user&&<p className="tree-map-help">다른 사람도 등록된 위치를 볼 수 있어요. 담당자는 내 도감에서 로그인 후 위치를 등록할 수 있어요.</p>}
  <button type="button" className="visit-secondary visit-wide" disabled={busy} onClick={()=>{if(mayDiscard())onBack();}}>나무 살펴보기로 돌아가기</button>
 </section>;
}
