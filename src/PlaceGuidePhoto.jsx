import PhotoViewer from './PhotoViewer.jsx';
import React,{useState,useRef} from 'react';
import {placeGuidePhoto} from './place-guide-photos.js';
function GuideImage({photo}){
 const[failed,setFailed]=useState(false),[open,setOpen]=useState(false),opener=useRef(null);
 return <figure className="place-guide-photo"><figcaption><strong>주변 모습으로 찾아봐요</strong><span>{photo.caption}</span></figcaption>{failed?<p className="tree-map-help" role="status">장소 사진을 불러오지 못했어요. 장소 설명을 참고해주세요.</p>:<button type="button" aria-label="장소 사진 크게 보기" onClick={event=>{opener.current=event.currentTarget;setOpen(true);}}><img src={photo.src} alt={photo.alt} loading="lazy" decoding="async" onError={()=>setFailed(true)}/><span>장소 사진 크게 보기</span></button>}{photo.credit&&<p className="tree-map-help">{photo.credit}</p>}{open&&<PhotoViewer title="장소 사진" photos={[{...photo,label:photo.caption}]} index={0} onIndex={()=>{}} onClose={()=>setOpen(false)} returnFocus={opener}/>}</figure>;
}
export default function PlaceGuidePhoto({centerId,label,resolve=placeGuidePhoto}){
 const photo=resolve(centerId,label);
 return photo?<GuideImage key={centerId+':'+photo.src} photo={photo}/>:null;
}
