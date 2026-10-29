import {recordPhotos} from './record-photos.js';
export function samePhotos(a,b){return a.length===b.length&&a.every((photo,index)=>photo===b[index]);}
export function validPhotoEditId(id){return typeof id==='string'&&/^[A-Za-z0-9_-]{1,80}$/.test(id);}
export function photoEditRecord(old,before,after,now=Date.now()){
 recordPhotos({imageData:after[0]??null,additionalImages:after.slice(1)});
 if(!after.length)throw new Error('사진은 한 장 이상 남겨주세요.');
 const{aiSelection,...base}=old;
 return {...base,...(before[0]===after[0]&&aiSelection?{aiSelection}:{}),revision:old.revision+1,updatedAt:Math.max(now,old.updatedAt+1)};
}
