import React,{useEffect,useRef,useState} from 'react';
import Dialog from './dialog.jsx';
import {createPhotoHistory} from './photo-history.js';
function LargeImage({photo}){
 const[failed,setFailed]=useState(false),[fallback,setFallback]=useState(false);
 return failed?<p role="alert">사진을 불러오지 못했어요. 닫고 다시 열어주세요.</p>:<>{fallback&&<p className="photo-viewer-help" role="status">원본을 불러오지 못해 미리보기 사진을 보여드려요.</p>}<img className="photo-viewer-image" src={fallback?photo.fallbackSrc:photo.src} alt={photo.alt||photo.label||'사진'} referrerPolicy="no-referrer" onError={()=>{if(!fallback&&photo.fallbackSrc&&photo.fallbackSrc!==photo.src)setFallback(true);else setFailed(true);}}/></>;
}
export default function PhotoViewer({photos,index,onIndex,onClose,title,returnFocus}){
 const controller=useRef(null),closeCallback=useRef(onClose),[closing,setClosing]=useState(false),[historyReady,setHistoryReady]=useState(true);
 closeCallback.current=onClose;
 useEffect(()=>{
  const current=createPhotoHistory(window,()=>closeCallback.current(),()=>setClosing(true));controller.current=current;setHistoryReady(current.supported);
  return()=>{current.dispose();controller.current=null;};
 },[]);
 const photo=photos[index],close=()=>controller.current?.close();
 return <div className="photo-viewer-backdrop" onClick={event=>{if(event.target===event.currentTarget)close();}}>
  <Dialog label={`${title} 크게 보기`} onClose={close} busy={closing} returnFocus={returnFocus} className="photo-viewer">
   <header><h2>{title}</h2><button type="button" className="visit-secondary" disabled={closing} onClick={close}>{closing?'닫는 중…':'닫기'}</button></header>
   <p className="photo-viewer-caption" role="status">{photo.label||'사진'} · {index+1} / {photos.length}</p>
   <LargeImage key={photo.src} photo={photo}/>
   {photo.credit&&<p className="photo-viewer-credit">{photo.credit}</p>}
   {photo.details&&<div className="photo-viewer-attribution" aria-label="사진 출처와 이용 조건">{photo.details}</div>}
   {photos.length>1&&<div className="photo-viewer-controls" role="group" aria-label="큰 사진 바꾸기"><button type="button" className="visit-secondary" disabled={closing||index===0} onClick={()=>onIndex(index-1)}>이전 사진</button><button type="button" className="visit-secondary" disabled={closing||index===photos.length-1} onClick={()=>onIndex(index+1)}>다음 사진</button></div>}
   <p className="photo-viewer-help">{historyReady?'뒤로가기를 눌러도 사진만 닫혀요.':'사진을 닫으려면 닫기를 눌러주세요.'}</p>
  </Dialog>
 </div>;
}
