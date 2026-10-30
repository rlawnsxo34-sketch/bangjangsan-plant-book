import React from 'react';
import usePhotoPreview from './usePhotoPreview.jsx';
import {sharedPhotos} from './share-photos.js';
export default function SharedPhotos({row}){
 let images=[],invalid=false;try{images=sharedPhotos(row);}catch(_){invalid=true;}
 const preview=usePhotoPreview(images,row?.name||'식물',i=>`공유 사진 ${i+1}`);
 if(invalid)return <p role="alert">공유 사진을 읽지 못했어요. 목록을 다시 불러와주세요.</p>;
 return <section className="record-photos shared-photos" aria-label="공유로 선택한 사진"><p className="record-photos-count">공유 사진 {images.length}장</p><ol>{images.map((src,i)=><li key={i}><figure><button type="button" className="record-photo-preview" aria-label={`${row.name} 공유 사진 ${i+1} 크게 보기`} onClick={event=>preview.open(i,event)}><img src={src} alt={`${row.name} 공유 사진 ${i+1}`} loading={i?'lazy':undefined}/><span>크게 보기</span></button><figcaption>공유 사진 {i+1} / {images.length}</figcaption></figure></li>)}</ol>{preview.viewer}</section>;
}
