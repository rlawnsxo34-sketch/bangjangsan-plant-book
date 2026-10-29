import React from 'react';
import {sharedPhotos} from './share-photos.js';
export default function SharedPhotos({row}){
 let images;try{images=sharedPhotos(row);}catch(_){return <p role="alert">공유 사진을 읽지 못했어요. 목록을 다시 불러와주세요.</p>;}
 return <section className="record-photos shared-photos" aria-label="공유로 선택한 사진"><p className="record-photos-count">공유 사진 {images.length}장</p><ol>{images.map((src,i)=><li key={i}><figure><img src={src} alt={`${row.name} 공유 사진 ${i+1}`} loading={i?'lazy':undefined}/><figcaption>공유 사진 {i+1} / {images.length}</figcaption></figure></li>)}</ol></section>;
}
