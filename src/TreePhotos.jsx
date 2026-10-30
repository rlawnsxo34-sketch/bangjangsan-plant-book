import {observationPlace} from './observation-places.js';
import PhotoViewer from './PhotoViewer.jsx';
import React,{useState,useRef} from 'react';
import {experiencePhotos} from './experience-photos.js';
function Photo({photo,name,onOpen}){
 const[failed,setFailed]=useState(false);
 return <figure className="tree-reference-photo"><figcaption><strong>{photo.label}</strong>{photo.credit&&<span>{photo.credit}</span>}</figcaption>
  {failed?<p role="status" className="tree-image-error">사진을 불러오지 못했어요. 설명과 관찰 질문은 계속 볼 수 있어요.</p>:<button type="button" onClick={onOpen} aria-label={`${name} ${photo.label} 크게 보기`}><img src={photo.src} alt={photo.alt||`${name} ${photo.label}`} loading="lazy" decoding="async" onError={()=>setFailed(true)}/><span>크게 보기</span></button>}
 </figure>;
}
export default function TreePhotos({tree,centerId}){
 const photos=experiencePhotos(tree),[index,setIndex]=useState(null),opener=useRef(null);
 return photos.length?<section className="tree-reference-photos" aria-label={`${tree.name} 참고 사진`}><div className="tree-reference-grid">{photos.map((photo,i)=><Photo key={photo.src+':'+i} photo={photo} name={tree.name} onOpen={event=>{opener.current=event.currentTarget;setIndex(i);}}/>)}</div><p className="tree-reference-note">{observationPlace(centerId,tree.id)?'잎과 나무 모습을 비교하고 아래 장소 안내도 참고해주세요.':'잎과 나무 모습을 함께 비교해보세요. 선택한 숲체원의 관찰 위치를 뜻하는 사진은 아니에요.'}</p>{index!==null&&photos[index]&&<PhotoViewer title={tree.name} photos={photos} index={index} onIndex={setIndex} onClose={()=>setIndex(null)} returnFocus={opener}/>}</section>:<p className="tree-photo-pending">사진 준비 중</p>;
}
