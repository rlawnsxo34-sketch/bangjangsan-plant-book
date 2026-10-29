import React from 'react';
export default function RecordPhotos({photos,name='식물',editable=false,disabled=false,onCover,onRemove}){
 if(!photos.length)return null;
 return <section className="record-photos" aria-label={editable?'저장할 사진 목록':'저장된 사진 목록'}><p className="record-photos-count">사진 {photos.length}장{editable?' / 최대 3장':''} · 첫 사진이 대표사진이에요.</p><ol>{photos.map((photo,index)=><li key={index}>
  <figure><img src={photo} alt={`${name} ${index===0?'대표사진':`추가사진 ${index+1}`}`} loading={index?'lazy':undefined}/><figcaption>{index===0?'대표사진 · AI 분석에 사용':`추가사진 ${index+1} · 공유하려면 직접 선택`}</figcaption></figure>
  {editable&&<div className="record-photo-actions">{index>0&&<button type="button" disabled={disabled} onClick={()=>onCover(index)} aria-label={`${index+1}번 사진을 대표사진으로`}>대표사진으로</button>}<button type="button" disabled={disabled} onClick={()=>onRemove(index)} aria-label={`${index+1}번 사진 빼기`}>사진 빼기</button></div>}
 </li>)}</ol></section>;
}
