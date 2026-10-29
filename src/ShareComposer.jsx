import React,{useEffect,useRef,useState} from 'react';
import {canShareAt} from './center-model.js';
import {selectedPhotos,sharedPhotoFields} from './share-photos.js';
import SharedPhotos from './SharedPhotos.jsx';
import {cloudMessage} from './cloud-model.js';
export default function ShareComposer({repo,sharing,uid,center,records,disabled=false,onSaved,onBusy,onDirty}){
 const[id,setId]=useState(''),[album,setAlbum]=useState(null),[indexes,setIndexes]=useState([]),[note,setNote]=useState(''),[preview,setPreview]=useState(null),[consent,setConsent]=useState(false),[loading,setLoading]=useState(false),[saving,setSaving]=useState(false),[error,setError]=useState('');
 const alive=useRef(false),request=useRef(0),lock=useRef(false),previewTitle=useRef(null),previewButton=useRef(null),wasPreview=useRef(false);
 const choices=records.filter(row=>canShareAt(row,center.id)),row=choices.find(row=>row.id===id),revision=row?.revision;
 useEffect(()=>{alive.current=true;return()=>{alive.current=false;request.current++;};},[]);
 useEffect(()=>{onBusy(saving);return()=>onBusy(false);},[saving,onBusy]);
 useEffect(()=>{onDirty(!!id||!!note||!!preview);return()=>onDirty(false);},[id,note,preview,onDirty]);
 useEffect(()=>{fetchAlbum();},[id,revision]);
 useEffect(()=>{if(preview)previewTitle.current?.focus();else if(wasPreview.current)previewButton.current?.focus();wasPreview.current=!!preview;},[preview]);
 async function fetchAlbum(){
  const token=++request.current;setAlbum(null);setIndexes([]);setPreview(null);setConsent(false);setError('');
  if(!id||!row){setLoading(false);return;}
  setLoading(true);
  try{const result=await repo.album(uid,id);if(!alive.current||token!==request.current)return;if(!canShareAt(result.record,center.id))throw new Error('기록의 숲체원이 달라졌어요. 목록을 다시 불러와주세요.');setAlbum(result);}
  catch(e){if(alive.current&&token===request.current)setError(cloudMessage(e));}
  finally{if(alive.current&&token===request.current)setLoading(false);}
 }
 function toggle(index,checked){setIndexes(current=>checked?[...current,index].sort((a,b)=>a-b):current.filter(value=>value!==index));setPreview(null);setConsent(false);setError('');}
 function showPreview(){if(!album||album.record.id!==id||!indexes.length||disabled||loading||saving)return;const images=selectedPhotos(album.photos,indexes);setPreview({submissionId:crypto.randomUUID(),record:album.record,indexes:[...indexes],images,note,centerName:center.name});setConsent(false);setError('');}
 async function submit(event){
  event.preventDefault();if(lock.current||!preview||!consent||disabled)return;
  const token=request.current;lock.current=true;setSaving(true);setError('');
  try{const result=await sharing.submit(uid,{id:preview.record.id,revision:preview.record.revision},center.id,preview.note,{indexes:preview.indexes,images:preview.images,centerName:preview.centerName,submissionId:preview.submissionId});if(alive.current&&token===request.current){setId('');setNote('');setPreview(null);setConsent(false);setAlbum(null);setIndexes([]);await onSaved(result);}}
  catch(e){if(alive.current&&token===request.current)setError(cloudMessage(e)+' 미리보기는 그대로 남아 있어요. 신청 상태를 확인하거나 같은 내용으로 다시 요청할 수 있어요.');}
  finally{lock.current=false;if(alive.current)setSaving(false);}
 }
 const blocked=disabled||saving;
 return <form className="share-composer" onSubmit={submit}>
  <h2>내 기록 함께 나누기</h2><p className="share-stage">{preview?'2 / 2 · 공개 전 확인':'1 / 2 · 사진과 글 고르기'}</p>
  {error&&<p role="alert" className="share-composer-error">{error}</p>}
  {!preview&&<section className="share-editor" aria-label="공유할 내용 선택"><p>함께 볼 사진만 골라주세요. 개인 메모는 공개되지 않아요.</p><label>어떤 기록을 나눌까요?<select required value={id} disabled={blocked||!!preview} onChange={e=>{setId(e.target.value);setNote('');setAlbum(null);setIndexes([]);setPreview(null);setConsent(false);setError('');}}><option value="">기록 선택</option>{choices.map(record=><option key={record.id} value={record.id}>{record.name} · {record.centerName}</option>)}</select></label>
  {!choices.length&&<p>이 숲체원에 함께 보여줄 기록이 없어요. 식물 찾기에서 먼저 저장해주세요.</p>}
  {loading&&<p role="status">이 기록의 사진을 불러오고 있어요…</p>}
  {id&&<button type="button" className="visit-secondary" disabled={blocked} onClick={fetchAlbum}>사진 다시 불러오기</button>}
  {album&&album.record.id===id&&<>
   {!album.record.centerId&&<p>이전 기록이에요. 기록된 장소 ‘{album.record.centerName}’와 공유할 ‘{center.name}’가 맞는지 확인해주세요.</p>}
   <fieldset className="share-photo-picker" disabled={blocked||!!preview}><legend>공유할 사진 · 1~3장</legend><p>공개할 사진에만 표시해주세요.</p><ol>{album.photos.map((src,index)=><li key={index}><label><img src={src} alt={`내 기록 사진 ${index+1}`}/><span>{index===0?'내 도감 대표사진':`추가사진 ${index+1}`}</span><span><input type="checkbox" checked={indexes.includes(index)} onChange={e=>toggle(index,e.target.checked)}/> {index+1}번 사진 공유</span></label></li>)}</ol></fieldset>
   <p role="status">{album.photos.length}장 중 {indexes.length}장 선택</p>
   <label>함께 보여줄 글 · 선택<textarea rows={3} maxLength={1000} value={note} disabled={blocked||!!preview} onChange={e=>setNote(e.target.value)} placeholder="다른 사람에게 알려주고 싶은 특징을 적어주세요."/></label>
   {!preview&&<button type="button" ref={previewButton} className="visit-primary visit-wide" disabled={blocked||!indexes.length} onClick={showPreview}>공개 전 확인하기</button>}
  </>}
  {id&&<p className="experience-help">화면을 나가면 작성 중인 공유 글은 지워져요.</p>}</section>}
  {preview&&<section className="share-preview" aria-label="공유 전 미리보기">
   <h3 tabIndex={-1} ref={previewTitle}>이렇게 함께 보여요</h3><p><strong>{preview.record.name}</strong><br/>공유 숲체원: {preview.centerName}</p>
   <SharedPhotos row={{name:preview.record.name,...sharedPhotoFields(preview.images)}}/><p className="share-preview-note">{preview.note||'함께 보여줄 글 없음'}</p>
   <p>사진 {preview.images.length}장과 식물 이름·숲체원·위 글을 공유해요. 담당자가 확인하면 다른 사람도 볼 수 있어요.</p>
   <p>개인 메모·이메일·정확한 위치는 제외해요. 사진과 글에 얼굴·연락처·민감한 장소가 없는지 확인해주세요.</p><p className="experience-help">다른 사람이 저장하거나 캡처한 사본은 공유를 취소해도 남을 수 있어요.</p>
   <details className="share-help"><summary>다시 신청하거나 취소하면?</summary><p>다시 신청하면 기존 공개는 내려가고 담당자가 새로 확인해요. 확인을 기다리는 내용을 바꾸려면 기존 신청부터 취소해주세요.</p><p>공유를 취소해도 내 도감의 원본은 남아요.</p></details>
   <label className="share-consent"><input type="checkbox" checked={consent} disabled={blocked} onChange={e=>setConsent(e.target.checked)}/><span>위 사진 {preview.images.length}장과 내용을 확인했으며, 담당자 확인 후 공개하는 데 동의해요.</span></label>
   <button type="submit" className="visit-primary visit-wide" disabled={blocked||!consent}>{saving?'신청 중…':'공유 신청하기'}</button><button type="button" className="visit-secondary visit-wide" disabled={blocked} onClick={()=>{setPreview(null);setConsent(false);setError('');}}>사진·글 다시 고르기</button>
  </section>}
  {saving&&<p role="status">공유 확인을 요청하고 있어요…</p>}
 </form>;
}
