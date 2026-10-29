import {validatePhoto} from './cloud-model.js';
export const RECORD_PHOTO_LIMIT=3;
export function recordPhotos(row){
 const extras=row?.additionalImages===undefined?[]:row.additionalImages;
 if(!Array.isArray(extras)||extras.length>RECORD_PHOTO_LIMIT-1)throw new Error('사진은 한 기록에 최대 3장까지 남길 수 있어요.');
 if(row?.imageData===null){if(extras.length)throw new Error('대표사진이 필요해요.');return [];}
 const photos=[row.imageData,...extras];photos.forEach(validatePhoto);return photos;
}
export function withPhotos(draft,photos){
 if(!Array.isArray(photos)||photos.length>RECORD_PHOTO_LIMIT)throw new Error('사진은 한 기록에 최대 3장까지 남길 수 있어요.');
 photos.forEach(validatePhoto);
 const next={...draft,imageData:photos[0]||null,additionalImages:photos.slice(1)};
 // AI results belong only to the cover photo that was analyzed.
 if(next.imageData!==draft.imageData)delete next.aiSelection;
 return next;
}
export function photoDocument(uid,value){
 const images=recordPhotos(value);if(!images.length)throw new Error('사진을 한 장 이상 골라주세요.');
 return {ownerId:uid,schemaVersion:3,imageData:images[0],...(images.length>1?{additionalImages:images.slice(1)}:{})};
}
