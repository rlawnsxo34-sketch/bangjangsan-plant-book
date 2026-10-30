import React,{useEffect,useMemo,useRef,useState} from 'react';
import config from '../public-config.json';
import {getRuntime} from './cloud-runtime.js';
import {cloudMessage} from './cloud-model.js';
import {EXPERIENCE} from './experience-data.js';
import {readableTree} from './easy-language.js';
import {mapTree,groupTreePlaces} from './tree-map-model.js';
import {experiencePhotos} from './experience-photos.js';
import TreePhotos from './TreePhotos.jsx';
import PlaceGuidePhoto from './PlaceGuidePhoto.jsx';
import VisitNoteFields from './VisitNoteFields.jsx';
import KakaoTreeCanvas from './KakaoTreeCanvas.jsx';
function TreeChoice({tree,selected,disabled,onClick,showPlace=false}){
 const photo=experiencePhotos(tree)[0], [failed,setFailed]=useState(false);
 return <button type="button" className="tree-place-choice" aria-pressed={selected} disabled={disabled} onClick={onClick}>
  {photo&&!failed?<img key={photo.src} src={photo.src} alt="" loading="lazy" decoding="async" onError={()=>setFailed(true)}/>:<span className="tree-place-no-photo">사진 준비 중</span>}
  <span><strong>{tree.name}</strong><small>{tree.feature}</small>{showPlace&&<small>{tree.label||'장소 안내 준비 중'}</small>}</span>
 </button>;
}
export default function TreeMapPanel({center,onState,onBack,initialTreeId,onTreeSelect,visitEntries={},onVisitChange,onViewRecords,Canvas=KakaoTreeCanvas,apiKey=config.kakaoMap?.javascriptKey||''}){
 const[rows,setRows]=useState([]),[user,setUser]=useState(null),[canEdit,setCanEdit]=useState(false),[loaded,setLoaded]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState(''),[opened,setOpened]=useState(false),[selectedOnly,setSelectedOnly]=useState(true),[attempt,setAttempt]=useState(0),[selected,setSelected]=useState(()=>EXPERIENCE.trees.some(t=>t.id===initialTreeId)?initialTreeId:EXPERIENCE.trees[0].id),[draft,setDraft]=useState(null),[consent,setConsent]=useState(false),[busy,setBusy]=useState(false);
 const rt=useRef(null),alive=useRef(false),epoch=useRef(0),currentUser=useRef(null),lock=useRef(false),detail=useRef(null);
 const trees=useMemo(()=>EXPERIENCE.trees.map(t=>mapTree(readableTree(t),center.id,rows)),[rows,center.id]),tree=trees.find(t=>t.id===selected)||trees[0];
 const places=useMemo(()=>groupTreePlaces(trees),[trees]),place=places.find(p=>p.trees.some(t=>t.id===tree.id));
 const markers=useMemo(()=>!loaded?[]:draft?trees.filter(t=>t.coordinates):places.filter(p=>p.coordinates&&(!selectedOnly||p.id===place.id)),[trees,places,loaded,!!draft,selectedOnly,place.id]);
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
 function select(id,moveFocus=true){if(!EXPERIENCE.trees.some(t=>t.id===id)||!mayDiscard())return false;setDraft(null);setConsent(false);setSelected(id);onTreeSelect?.(id);setError('');setNotice('');if(moveFocus)requestAnimationFrame(()=>detail.current?.focus());}
 function selectPlace(id){const next=places.find(p=>p.id===id);if(next)select(next.trees.some(t=>t.id===tree.id)?tree.id:next.trees[0].id);}
 function startEdit(){if(!loaded||!canEdit||!user||busy)return;setDraft({treeId:tree.id,label:tree.label,coordinates:null,revision:tree.revision});setConsent(false);setNotice('');setError('');setOpened(true);}
 async function write(value,revision){if(lock.current||!user||!canEdit)return;const token=epoch.current,uid=user.uid;lock.current=true;setBusy(true);setError('');
  try{const row=await rt.current.places.save(uid,center.id,tree.id,value,revision);if(alive.current&&token===epoch.current&&currentUser.current?.uid===uid){setRows(old=>[...old.filter(x=>x.id!==row.id),row]);setDraft(null);setConsent(false);setNotice(row.coordinates?'나무 위치를 공개했어요. 다른 기기에서도 볼 수 있어요.':'지도 표시를 지웠어요. 장소 설명은 유지해요.');}}
  catch(e){if(alive.current&&token===epoch.current)setError(cloudMessage(e)+' 선택한 위치는 아직 화면에 남아 있어요.');}
  finally{if(alive.current&&token===epoch.current){lock.current=false;setBusy(false);}}
 }
 return <section className="tree-map-panel" aria-label="나무 지도">
  <h2>나무 지도</h2><p>사진에서 나무를 고르면, 찾아갈 장소를 보여드려요.</p>
  <section className="tree-first-picker" aria-label="찾고 싶은 나무 고르기"><h3>어떤 나무를 찾으세요?</h3><div className="tree-place-choices">{trees.map(t=><TreeChoice key={t.id+':'+(experiencePhotos(t)[0]?.src||'')} tree={t} selected={tree.id===t.id} disabled={busy} showPlace onClick={()=>{if(select(t.id,false)!==false)setSelectedOnly(true);}}/>)}</div><p role="status">고른 나무: <strong>{tree.name}</strong> · {tree.label||'장소 안내 준비 중'}</p><button type="button" className="visit-secondary" disabled={busy||!!draft} aria-pressed={!selectedOnly} onClick={()=>setSelectedOnly(value=>!value)}>{selectedOnly?'모든 장소 보기':'고른 나무의 장소만 보기'}</button></section>
  {error&&<p role="alert" className="tree-map-alert">{error}</p>}{notice&&<p role="status" className="visit-status">{notice}</p>}{!loaded&&!error&&<p role="status">나무 위치를 확인하고 있어요…</p>}
  <button type="button" className="visit-secondary" disabled={busy} onClick={()=>{if(mayDiscard()){setDraft(null);setConsent(false);refresh();}}}>나무 위치 다시 불러오기</button>
  <div className="tree-map-workspace"><div className="tree-map-area">
   {!apiKey?<p className="tree-map-placeholder">나무 지도는 준비 중이에요. 사진과 장소 안내를 먼저 살펴보세요.</p>:!opened?<div className="tree-map-placeholder"><p>카카오 지도로 나무를 관찰할 장소를 살펴봐요.</p><button type="button" className="visit-primary" onClick={()=>setOpened(true)}>지도 열기</button></div>:<><Canvas key={attempt} apiKey={apiKey} markers={markers} focusPoint={loaded&&!draft?place.coordinates:null} centerName={center.name} onSelect={selectPlace} onPick={point=>{if(canEdit&&draft&&!busy){setDraft(d=>d?{...d,coordinates:point}:d);setConsent(false);}}} pending={draft?.coordinates} editable={canEdit&&!!draft&&!busy}/><button type="button" className="center-text-button" disabled={busy||!!draft} onClick={()=>setAttempt(n=>n+1)}>지도 다시 열기</button></>}
   {loaded&&!markers.length&&<p className="tree-map-help">표시할 위치가 없어요. 아래 장소 설명을 참고해주세요.</p>}
   <p className="tree-map-help">{draft?'위치를 고치는 동안에는 나무별 표시가 나와요.':selectedOnly?'고른 나무가 있는 장소만 표시해요.':'같은 장소의 나무는 표시 하나로 보여줘요.'}</p>
   <details className="tree-map-other-places"><summary>장소 목록에서 고르기</summary><div className="tree-map-places" role="group" aria-label="관찰할 장소 선택">{places.map((p,i)=><button type="button" key={p.id} className="tree-place-stop" disabled={busy} aria-pressed={place.id===p.id} onClick={()=>selectPlace(p.id)}><span className="tree-place-number" aria-hidden="true">{i+1}</span><span><strong>{p.label}</strong><small>{p.trees.map(t=>t.name).join(' · ')} · {p.trees.length}종</small><small>{!loaded?'지도 위치 확인 중':p.coordinates?'지도에서 장소 보기':'장소 설명으로 찾아보기'}</small></span></button>)}</div></details>
  </div><div className="tree-map-info" ref={detail} tabIndex={-1} aria-label="선택한 나무 정보"><div className="tree-place-heading"><span>선택한 장소</span><h3>{place.label}</h3><PlaceGuidePhoto centerId={center.id} label={place.label}/><p>어떤 나무를 살펴볼까요?</p></div><div className="tree-place-choices" role="group" aria-label="이 장소에서 살펴볼 나무">{place.trees.map(t=><TreeChoice key={t.id+':'+(experiencePhotos(t)[0]?.src||'')} tree={t} selected={tree.id===t.id} disabled={busy} onClick={()=>select(t.id)}/>)}</div>
   {place.coordinates&&loaded&&!draft&&<p className="tree-map-help">표시는 {trees.find(t=>t.id===place.sourceTreeId)?.name}의 위치예요. 같은 장소의 다른 나무는 주변에서 찾아보세요.</p>}
   <h3>{tree.name}</h3><TreePhotos tree={tree} centerId={center.id}/><p className="tree-place-label">{tree.label||'이 숲체원의 관찰 장소는 준비 중이에요.'}</p><p className="tree-map-help">{loaded?(tree.coordinates?'이 나무의 위치가 등록되어 있어요.':'이 나무는 지도 위치가 아직 없어요.'):''}</p><div className="tree-question"><span>직접 살펴봐요</span><p>{tree.question}</p></div><p className="tree-map-help">탐방로에서 보이는 나무를 사진과 비교해보세요.</p><details className="capture-help"><summary>지도 안내</summary><p>표시는 찾아갈 장소를 안내해요. 나무가 가까이 모여 있으면 잎과 줄기를 함께 비교해주세요. 이 표시는 방문 여부나 나무 이름을 확인해주는 증명은 아니에요.</p></details>
   {onVisitChange&&!draft&&<section className="tree-map-note" aria-label={`${tree.name}에 글 남기기`}><h4>이 나무를 보니 어떤 느낌인가요?</h4><VisitNoteFields tree={tree} entry={visitEntries[tree.id]} disabled={busy} onChange={patch=>onVisitChange(tree.id,patch)}/><p className="tree-map-help">고른 느낌과 글은 다른 사람에게 공개되지 않아요. 보관하려면 ‘내 기록 보기’에서 발견 카드로 받아주세요.</p>{onViewRecords&&<button type="button" className="visit-primary visit-wide" disabled={busy} onClick={()=>{if(mayDiscard())onViewRecords();}}>내 기록 보기</button>}</section>}
   {canEdit&&loaded&&!draft&&<div className="tree-map-editor"><h4>담당자 위치 관리</h4><button type="button" className="visit-secondary visit-wide" disabled={busy||!apiKey} onClick={startEdit}>지도에서 나무 위치 고르기</button>{tree.coordinates&&<button type="button" className="visit-secondary visit-wide" disabled={busy} onClick={()=>{if(window.confirm('이 나무의 지도 표시를 지울까요? 사진과 장소 설명은 남아요.'))write({label:tree.label||tree.name+' 관찰 장소',coordinates:null},tree.revision);}}>공개 위치 지우기</button>}</div>}
   {draft&&canEdit&&<form className="tree-map-editor" aria-label="공개 나무 위치 선택" onSubmit={e=>{e.preventDefault();if(draft.coordinates&&consent)write(draft,draft.revision);}}><h4>{tree.name} 위치 고르기</h4><p>지도를 눌러 위치를 고른 뒤 공개해주세요.</p><label>장소 설명<input required maxLength={160} value={draft.label} disabled={busy} onChange={e=>{setDraft(d=>({...d,label:e.target.value}));setConsent(false);}}/></label><p role="status">{draft.coordinates?'위치를 골랐어요. 아직 저장하지 않았어요.':'지도에서 나무가 있는 곳을 눌러주세요.'}</p><label className="share-consent"><input type="checkbox" checked={consent} disabled={busy||!draft.coordinates} onChange={e=>setConsent(e.target.checked)}/><span>선택한 나무 위치와 장소 설명을 모든 방문객에게 공개하는 데 동의해요.</span></label><button type="submit" className="visit-primary visit-wide" disabled={busy||!draft.coordinates||!draft.label.trim()||!consent}>{busy?'저장 중…':'이 위치 공개하기'}</button><button type="button" className="visit-secondary visit-wide" disabled={busy} onClick={()=>{if(mayDiscard()){setDraft(null);setConsent(false);}}}>위치 선택 취소</button></form>}
  </div></div>
  {!user&&<details className="capture-help"><summary>담당자 안내</summary><p>내 도감에서 로그인하면 담당자 권한으로 나무 위치를 등록할 수 있어요.</p></details>}
  <button type="button" className="visit-secondary visit-wide" disabled={busy} onClick={()=>{if(mayDiscard())onBack();}}>나무 살펴보기로 돌아가기</button>
 </section>;
}
