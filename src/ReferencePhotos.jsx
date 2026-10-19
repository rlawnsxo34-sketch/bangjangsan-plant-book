import React,{useState} from 'react';
const organs={leaf:'잎',flower:'꽃',fruit:'열매',bark:'나무껍질',habit:'전체 모습',other:'참고 사진'};
function ReferencePhoto({photo,name,index}){
 const[failed,setFailed]=useState(false);
 return <figure className="reference-photo">
  {failed?<div className="reference-unavailable" role="status">사진을 불러오지 못했어요.<br/>사진이 없어도 이름을 골라 기록할 수 있어요.</div>:<a href={photo.originalUrl} target="_blank" rel="noopener noreferrer" aria-label={`${name} 비교 사진 ${index+1} 원본 열기 (새 창)`}><img src={photo.thumbnailUrl} alt={`${name} 비교용 ${organs[photo.organ]} ${index+1}`} loading="lazy" decoding="async" referrerPolicy="no-referrer" onError={()=>setFailed(true)}/></a>}
  <figcaption><span className="reference-organ">{organs[photo.organ]}</span><span>{photo.author} / <a href="https://plantnet.org/" target="_blank" rel="noopener noreferrer">Pl@ntNet</a></span><a href={photo.licenseUrl} target="_blank" rel="noopener noreferrer">{photo.license}</a>{photo.citation&&<span className="reference-citation">{photo.citation}</span>}</figcaption>
 </figure>;
}
export default function ReferencePhotos({images=[],name}){
 return <div className="reference-section"><p className="reference-label">비슷한 식물 사진 · 내가 찍은 사진과 비교해보세요</p>{images.length?<div className="reference-grid">{images.map((photo,index)=><ReferencePhoto key={photo.thumbnailUrl} photo={photo} name={name} index={index}/>)}</div>:<p className="reference-empty">비교할 사진이 없어요. 이름을 골라 기록하거나 직접 적어주세요.</p>}</div>;
}
