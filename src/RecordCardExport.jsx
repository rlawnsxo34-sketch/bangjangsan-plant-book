import React,{useEffect,useMemo,useRef,useState} from 'react';
import {Image as ImageIcon,DownloadSimple} from '@phosphor-icons/react';
import {cardModel} from './record-card.js';
import {renderRecordCard} from './card-renderer.js';
import {createCardController} from './card-controller.js';
export default function RecordCardExport({visit,centerName,onBusy,render=renderRecordCard}){
 const model=useMemo(()=>cardModel(visit,centerName),[visit,centerName]);
 const key=model?JSON.stringify(model):'';
 const controller=useRef(null),[state,setState]=useState({key:'',phase:'idle'});
 useEffect(()=>{const job=createCardController({render,createURL:blob=>URL.createObjectURL(blob),revokeURL:url=>URL.revokeObjectURL(url),onChange:next=>{setState(next);onBusy(next.phase==='working');}});controller.current=job;return()=>{controller.current=null;job.dispose();onBusy(false);};},[render,onBusy]);
 useEffect(()=>{controller.current?.setSource(model,key);},[key,render,onBusy]);
 // Hide a stale preview immediately, before effects revoke its URL.
 const shown=state.key===key?state:{phase:'idle'};
 return <section className="record-card-export" aria-label="기록을 이미지로 받기">
  <h3>오늘의 발견 카드</h3><p>내가 고른 느낌과 글을 이미지 한 장으로 가져가요. 먼저 미리 보기를 만든 뒤 파일을 받아주세요.</p>
  <p className="card-private-note">정확한 위치와 로그인 정보는 자동으로 넣지 않아요. 적은 글은 그대로 들어가니, 다른 사람에게 보여주기 전에 개인 정보가 있는지 살펴보세요.</p>
  <button type="button" className={(shown.phase==='ready'?'visit-secondary':'visit-primary')+' visit-wide'} disabled={!model||shown.phase==='working'} onClick={()=>controller.current?.prepare()}><ImageIcon size={21} aria-hidden="true"/>{shown.phase==='working'?'카드 이미지를 만들고 있어요…':shown.phase==='ready'?'카드 다시 만들기':'오늘의 발견 카드 받기'}</button>
  {!model&&<p className="card-small-help">느낌을 고르거나 글, 살펴본 표시를 하나 남기면 만들 수 있어요.</p>}
  {shown.phase==='working'&&<><p role="status" className="card-small-help">이미지를 준비하고 있어요. 잠시만 기다려주세요.</p><button type="button" className="visit-secondary visit-wide" onClick={()=>controller.current?.cancel()}>이미지 만들기 취소</button></>}
  {shown.phase==='error'&&<p role="alert" className="card-export-error">{shown.message} 아래에서 글 파일로 받아도 괜찮아요.</p>}
  {shown.phase==='ready'&&<>
   {shown.truncated&&<p role="status" className="card-export-warning">글이 길거나 줄바꿈이 많아 일부만 담았어요. 전체 내용은 아래의 ‘글 파일로 받기’를 열어 받아주세요.</p>}
   {shown.logoFallback&&<p role="status" className="card-small-help">로고 그림을 불러오지 못해 이름을 글자로 넣었어요.</p>}
   {shown.fontFallback&&<p role="status" className="card-small-help">이 기기의 기본 글꼴로 만들었어요.</p>}
   <figure className="record-card-preview"><img src={shown.url} alt="오늘의 발견 카드 미리 보기. 카드 내용은 위의 기록 목록에서도 읽을 수 있어요."/><figcaption>이미지 미리 보기 · 내용을 확인한 뒤 받아주세요.</figcaption></figure>
   <a className="visit-primary visit-wide card-download-link" href={shown.url} download={shown.filename}><DownloadSimple size={21} aria-hidden="true"/>오늘의 발견 카드 받기 (.png)</a>
   <a className="visit-secondary visit-wide card-download-link" href={shown.url} target="_blank" rel="noopener noreferrer">이미지 크게 열기</a>
   <p className="card-small-help">이미지로 열리면 길게 눌러 저장해보세요. 기기마다 저장 방법이 다를 수 있어요. 파일을 받기 전에는 카드가 기기에 저장된 것이 아니에요.</p>
  </>}
 </section>;
}
