import {validatePhoto} from './cloud-model.js';
import {samePhotos} from './photo-edit-model.js';
export function selectedPhotos(photos,indexes){
 if(!Array.isArray(indexes)||indexes.length<1||indexes.length>3||indexes.some((index,i)=>!Number.isInteger(index)||index<0||index>=photos.length||(i>0&&index<=indexes[i-1])))throw new Error('공유할 사진을 1~3장 골라주세요.');
 const images=indexes.map(index=>photos[index]);images.forEach(validatePhoto);return images;
}
export function sharedPhotos(row){
 const extra=row?.additionalImages===undefined?[]:row.additionalImages;
 if(!Array.isArray(extra)||extra.length>2)throw new Error('공유 사진을 읽지 못했어요. 목록을 다시 불러와주세요.');
 const images=[row?.imageData,...extra];images.forEach(validatePhoto);return images;
}
export function sharedPhotoFields(images){
 if(!Array.isArray(images)||!images.length||images.length>3)throw new Error('공유할 사진을 1~3장 골라주세요.');
 images.forEach(validatePhoto);return {imageData:images[0],...(images.length>1?{additionalImages:images.slice(1)}:{})};
}
export function samePhotoSelection(a,b){return JSON.stringify(a.selectedPhotoIndexes??[0])===JSON.stringify(b.selectedPhotoIndexes??[0])&&samePhotos(sharedPhotos(a),sharedPhotos(b));}
function stamp(value){return Number.isInteger(value?.seconds)&&Number.isInteger(value?.nanoseconds)?`${value.seconds}:${value.nanoseconds}`:String(value?.toMillis?.());}
export function sameReviewSnapshot(a,b){
 return ['ownerId','observationId','centerId','centerName','name','publicNote','originalRevision','submissionId'].every(key=>a[key]===b[key])&&stamp(a.submittedAt)===stamp(b.submittedAt)&&samePhotoSelection(a,b);
}
