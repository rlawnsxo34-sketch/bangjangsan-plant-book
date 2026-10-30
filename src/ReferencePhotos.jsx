import React,{useState,useRef,useEffect} from 'react';
import PhotoViewer from './PhotoViewer.jsx';
import {referenceImages} from '../backend/reference-images.mjs';
const organs={leaf:'잎',flower:'꽃',fruit:'열매',bark:'나무껍질',habit:'전체 모습',other:'참고 사진'};
function Attribution({photo}){return <><span>{photo.author} / <a href="https://plantnet.org/" target="_blank" rel="noopener noreferrer">Pl@ntNet</a></span><a href={photo.licenseUrl} target="_blank" rel="noopener noreferrer">이용 조건: {photo.license}</a>{photo.citation&&<span className="reference-citation">{photo.citation}</span>}</>;}
function ReferencePhoto({photo,name,index,onOpen}){
 const[failed,setFailed]=useState(false);
 return <figure className="reference-photo">
  {failed?<div className="reference-unavailable" role="status">사진을 불러오지 못했어요.<br/>사진이 없어도 이름을 골라 기록할 수 있어요.</div>:<button type="button" className="reference-preview" onClick={onOpen} aria-label={`${name} 비교 사진 ${index+1} 크게 보기`}><img src={photo.thumbnailUrl} alt={`${name} 비교용 ${organs[photo.organ]} ${index+1}`} loading="lazy" decoding="async" referrerPolicy="no-referrer" onError={()=>setFailed(true)}/><span>크게 비교하기</span></button>}
  <figcaption><span className="reference-organ">{organs[photo.organ]}</span><Attribution photo={photo}/></figcaption>
 </figure>;
}
export default function ReferencePhotos({images=[],name}){
 const photos=referenceImages(images),[view,setView]=useState(null),opener=useRef(null);
 const signature=JSON.stringify(photos),matches=view&&view.signature===signature&&photos[view.index];
 useEffect(()=>{if(view&&!matches)setView(null);},[view,!!matches]);
 return <div className="reference-section"><p className="reference-label">비슷한 식물 사진 · 내가 찍은 사진과 비교해보세요</p>{photos.length?<div className="reference-grid">{photos.map((photo,index)=><ReferencePhoto key={photo.thumbnailUrl} photo={photo} name={name} index={index} onOpen={event=>{opener.current=event.currentTarget;setView({index,signature});}}/>)}</div>:<p className="reference-empty">비교할 사진이 없어요. 이름을 골라 기록하거나 직접 적어주세요.</p>}{matches&&<PhotoViewer title={`${name} 비교 사진`} photos={photos.map((photo,i)=>({src:photo.originalUrl,fallbackSrc:photo.thumbnailUrl,label:`${organs[photo.organ]} · 비교 사진 ${i+1}`,alt:`${name} 비교용 ${organs[photo.organ]} ${i+1}`,details:<Attribution photo={photo}/>}))} index={view.index} onIndex={index=>setView(value=>value?{...value,index}:null)} onClose={()=>setView(null)} returnFocus={opener}/>}</div>;
}
