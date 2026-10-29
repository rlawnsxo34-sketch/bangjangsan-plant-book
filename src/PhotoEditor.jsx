import React,{useEffect,useRef,useState} from 'react';
import RecordPhotos from './RecordPhotos.jsx';
import {RECORD_PHOTO_LIMIT} from './record-photos.js';
import {samePhotos} from './photo-edit-model.js';
import {cloudMessage} from './cloud-model.js';
import {smallPhoto} from './cloud-runtime.js';

export default function PhotoEditor({repo,uid,recordId,onSaved,onCancel,onBusy,onDirty}){
 const[snapshot,setSnapshot]=useState(null),[photos,setPhotos]=useState([]),[loading,setLoading]=useState(true),[working,setWorking]=useState(false),[saving,setSaving]=useState(false),[error,setError]=useState(''),[pending,setPending]=useState(false);
 const alive=useRef(false),request=useRef(0),lock=useRef(false),processing=useRef(null),attempt=useRef(null),camera=useRef(null),album=useRef(null);
 const dirty=!!snapshot&&!samePhotos(snapshot.photos,photos),busy=working||saving;
 useEffect(()=>{onBusy(busy);return()=>onBusy(false);},[busy,onBusy]);
 useEffect(()=>{onDirty(dirty||pending);return()=>onDirty(false);},[dirty,pending,onDirty]);
 useEffect(()=>{if(!dirty&&!pending)return;const warn=e=>{e.preventDefault();e.returnValue='';};window.addEventListener('beforeunload',warn);return()=>window.removeEventListener('beforeunload',warn);},[dirty,pending]);
 useEffect(()=>{alive.current=true;load();return()=>{alive.current=false;request.current++;processing.current?.abort();};},[repo,uid,recordId]);
 async function load(){
  if(lock.current)return;
  if((dirty||attempt.current)&&!window.confirm('지금 고르거나 뺀 사진 변경을 버리고 최신 기록을 불러올까요? 저장 결과가 불확실한 경우 서버의 최신 기록으로 확인해요.'))return;
  const id=++request.current;setLoading(true);setError('');
  try{const result=await repo.album(uid,recordId);if(alive.current&&request.current===id){setSnapshot(result);setPhotos(result.photos);attempt.current=null;setPending(false);}}
  catch(e){if(alive.current&&request.current===id)setError(cloudMessage(e));}
  finally{if(alive.current&&request.current===id)setLoading(false);}
 }
 async function add(files){
  const list=Array.from(files||[]);if(!list.length||lock.current||loading||pending||!snapshot)return;
  if(photos.length+list.length>RECORD_PHOTO_LIMIT){setError('사진은 최대 3장이에요. 기존 사진을 빼거나 선택한 수를 줄여주세요.');return;}
  const task=new AbortController();processing.current=task;lock.current=true;setWorking(true);setError('');
  try{const added=[];for(const file of list){const prepared=await window.plantPhotoFlow.preparePhoto(file,{signal:task.signal});const data=await smallPhoto(prepared,task.signal);if(!alive.current||task.signal.aborted)return;if([...photos,...added].includes(data))throw new Error('이미 있는 사진이에요. 다른 사진을 골라주세요.');added.push(data);}if(alive.current&&!task.signal.aborted)setPhotos([...photos,...added]);}
  catch(e){if(alive.current&&!task.signal.aborted)setError(cloudMessage(e)+' 기존 사진은 그대로 남아 있어요.');}
  finally{if(processing.current===task){processing.current=null;lock.current=false;if(alive.current)setWorking(false);}}
 }
 function cancelProcessing(){const task=processing.current;if(!task)return;task.abort();processing.current=null;lock.current=false;setWorking(false);setError('사진 추가를 취소했어요. 기존 사진은 그대로 남아 있어요.');}
 function change(index,remove){if(busy||loading||pending)return;const next=[...photos],picked=next.splice(index,1)[0];if(!remove)next.unshift(picked);setPhotos(next);setError('');}
 async function save(){
  if(lock.current||loading||!snapshot||!photos.length||!dirty)return;
  attempt.current||={id:crypto.randomUUID(),photos:[...photos]};
  const attemptValue=attempt.current,id=request.current;lock.current=true;setPending(true);setSaving(true);setError('');
  try{const result=await repo.editPhotos(uid,snapshot.record,attemptValue.photos,attemptValue.id);if(alive.current&&request.current===id)await onSaved(result);}
  catch(e){if(alive.current&&request.current===id)setError(cloudMessage(e)+' 변경한 사진은 화면에 남아 있어요. 같은 변경으로 다시 저장하거나 최신 기록을 확인해주세요.');}
  finally{lock.current=false;if(alive.current)setSaving(false);}
 }
 return <section className="photo-editor" aria-label="저장한 사진 바꾸기">
  <h2>사진 추가·바꾸기</h2><p>같은 식물의 다른 모습을 최대 3장까지 남길 수 있어요. 변경 저장을 눌러야 내 도감에 반영돼요.</p>
  {loading&&<p role="status">최신 기록과 사진을 불러오고 있어요…</p>}
  {error&&<p role="alert" className="photo-editor-error">{error}</p>}
  {snapshot&&<><p><strong>{snapshot.record.name}</strong> · {snapshot.record.centerName}</p>
   <RecordPhotos photos={photos} name={snapshot.record.name} editable disabled={busy||loading||pending} onCover={i=>change(i,false)} onRemove={i=>change(i,true)}/>
   {!photos.length&&<p>사진은 한 장 이상 남겨주세요. 다른 사진을 추가한 뒤 저장할 수 있어요.</p>}
   <div className="photo-editor-actions"><button type="button" disabled={busy||loading||pending||photos.length>=RECORD_PHOTO_LIMIT} onClick={()=>camera.current?.click()}>사진 촬영해서 추가</button><button type="button" disabled={busy||loading||pending||photos.length>=RECORD_PHOTO_LIMIT} onClick={()=>album.current?.click()}>앨범에서 추가</button></div>
   <input ref={camera} type="file" accept="image/*" capture="environment" className="hidden" aria-label="기존 기록 카메라 사진 추가" onChange={e=>{add(e.target.files);e.target.value='';}}/>
   <input ref={album} type="file" accept="image/*" multiple className="hidden" aria-label="기존 기록 앨범 사진 추가" onChange={e=>{add(e.target.files);e.target.value='';}}/>
   <p>사진을 바꾸면 공유 신청과 기존 공개는 함께 철회해요. 다시 공유하려면 ‘함께 보기’에서 신청해주세요. 공유로 고르지 않은 사진은 나만 볼 수 있어요.</p>
   {snapshot.photos[0]!==photos[0]&&snapshot.record.aiSelection&&<p className="photo-editor-warning">대표사진이 달라져 이전 AI 선택 정보는 저장할 때 지워져요. 적어둔 식물 이름과 글은 유지하니 이름이 맞는지 직접 확인해주세요.</p>}
   {pending&&<p>저장 요청을 보낸 뒤에는 사진을 더 바꾸지 않아요. 실패했거나 결과가 불확실하면 같은 변경으로 다시 저장하거나 최신 기록을 불러와 확인해주세요.</p>}
  </>}
  {working&&<><p role="status">사진 크기를 줄이고 있어요…</p><button type="button" onClick={cancelProcessing}>사진 추가 취소</button></>}
  {saving&&<p role="status">사진 변경을 저장하고 있어요…</p>}
  <div className="photo-editor-actions"><button type="button" className="photo-editor-save" disabled={busy||loading||!dirty||!photos.length} onClick={save}>{saving?'저장 중…':pending?'같은 변경 다시 저장':'사진 변경 저장하기'}</button><button type="button" disabled={busy} onClick={load}>최신 기록 다시 불러오기</button><button type="button" disabled={busy} onClick={onCancel}>닫기</button></div>
  <p className="experience-help">수정 중인 사진은 이 창에서만 유지돼요. 새로고침하거나 창을 닫기 전에 저장해주세요. 사진 원본은 따로 보관하세요.</p>
 </section>;
}
