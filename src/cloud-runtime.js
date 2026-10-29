import {createTreePlaces} from './tree-place-runtime.js';
import {samePhotos,validPhotoEditId,photoEditRecord} from './photo-edit-model.js';
import {recordPhotos,photoDocument} from './record-photos.js';
import {initializeApp} from 'firebase/app';
import {getAuth,onAuthStateChanged,createUserWithEmailAndPassword,signInWithEmailAndPassword,signOut,sendPasswordResetEmail,connectAuthEmulator} from 'firebase/auth';
import {getFirestore,connectFirestoreEmulator,doc,collection,query,orderBy,limit,getDocsFromServer,getDocFromServer,runTransaction} from 'firebase/firestore';
import config from '../public-config.json';
import {createSharing,shareRefs,invalidateShare} from './share-runtime.js';
import {validateDraft,validatePhoto,CLOUD_LIMIT,applyTextEdit} from './cloud-model.js';
let cached;
export function getRuntime(){
 if(cached)return cached;
 const f=config.firebase;
 if(!f?.apiKey||!f?.projectId||!f?.appId)throw new Error('public-config.json에 Firebase 웹 앱 설정을 입력한 뒤 npm run build를 실행해주세요.');
 const local=['127.0.0.1','localhost'].includes(location.hostname),emulator=config.emulators?.enabled===true;
 if(emulator&&(!local||!f.projectId.startsWith('demo-')))throw new Error('에뮬레이터는 localhost의 demo- 프로젝트에서만 사용할 수 있습니다.');
 const app=initializeApp(f,'forest-cloud'),auth=getAuth(app),db=getFirestore(app);
 if(emulator){connectAuthEmulator(auth,'http://127.0.0.1:9099',{disableWarnings:true});connectFirestoreEmulator(db,'127.0.0.1',8080);}
 const paths=(uid,id)=>({ob:doc(db,'forestDevUsers',uid,'observations',id),photo:doc(db,'forestDevUsers',uid,'photos',id)});
 function owner(uid){if(!auth.currentUser||auth.currentUser.uid!==uid)throw new Error('계정이 변경되었습니다. 다시 로그인해주세요.');}
 const repo={
  async list(uid){owner(uid);const rows=await getDocsFromServer(query(collection(db,'forestDevUsers',uid,'observations'),orderBy('createdAt','desc'),limit(CLOUD_LIMIT+1)));owner(uid);return rows.docs.map(d=>({...d.data(),id:d.id}));},
  async photo(uid,id){owner(uid);const s=await getDocFromServer(paths(uid,id).photo);owner(uid);if(!s.exists())throw new Error('사진을 찾지 못했습니다.');validatePhoto(s.data().imageData);return s.data().imageData;},
  async photos(uid,id){owner(uid);const s=await getDocFromServer(paths(uid,id).photo);owner(uid);if(!s.exists())throw new Error('사진을 찾지 못했습니다.');return recordPhotos(s.data());},
  async album(uid,id){owner(uid);const p=paths(uid,id);const result=await runTransaction(db,async tx=>{owner(uid);const [observation,photo]=await Promise.all([tx.get(p.ob),tx.get(p.photo)]);if(!observation.exists()||!photo.exists())throw new Error('기록 또는 사진이 없습니다. 목록을 다시 불러와주세요.');return {record:{...observation.data(),id},photos:recordPhotos(photo.data())};});owner(uid);return result;},
  async editPhotos(uid,row,images,editId){
   owner(uid);if(!validPhotoEditId(editId))throw new Error('사진 저장 요청을 확인해주세요.');
   const target=photoDocument(uid,{imageData:images[0]??null,additionalImages:images.slice(1)}),p=paths(uid,row.id),share=shareRefs(db,row.id);
   return runTransaction(db,async tx=>{owner(uid);const [observation,photo,submission]=await Promise.all([tx.get(p.ob),tx.get(p.photo),tx.get(share.request)]);
    if(!observation.exists()||!photo.exists())throw new Error('기록이 삭제되었습니다. 목록을 다시 불러와주세요.');
    const old=observation.data(),before=recordPhotos(photo.data());
    if(photo.data().lastEditId===editId){if(!samePhotos(before,images))throw new Error('같은 저장 요청의 사진이 달라졌어요. 최신 기록을 다시 불러와주세요.');return {record:{...old,id:row.id},photos:before};}
    if(old.revision!==row.revision)throw new Error('다른 기기에서 기록이 바뀌었어요. 변경 중인 사진을 확인한 뒤 최신 기록을 다시 불러와주세요.');
    if(samePhotos(before,images))return {record:{...old,id:row.id},photos:before};
    const data=photoEditRecord(old,before,images);validateDraft({...data,id:row.id});
    invalidateShare(tx,share,submission);tx.set(p.ob,data);tx.set(p.photo,{...target,lastEditId:editId});
    return {record:{...data,id:row.id},photos:[...images]};
   });
  },
  async add(uid,value){owner(uid);validateDraft(value);const photos=photoDocument(uid,value);const p=paths(uid,value.id);
   return runTransaction(db,async tx=>{owner(uid);const existing=await tx.get(p.ob);if(existing.exists())return existing.data();
    const {imageData,additionalImages,id,...fields}=value;const data={...fields,ownerId:uid,schemaVersion:3,revision:1,shareStatus:'private',speciesId:null,observedAt:null};
    tx.set(p.ob,data);tx.set(p.photo,photos);return data;});},
  async edit(uid,row,patch){owner(uid);const p=paths(uid,row.id);return runTransaction(db,async tx=>{owner(uid);const s=await tx.get(p.ob);if(!s.exists())throw new Error('기록이 삭제되었습니다. 새로고침해주세요.');const share=shareRefs(db,row.id),submission=await tx.get(share.request);const old=s.data();if(old.revision!==row.revision)throw new Error('다른 기기에서 수정된 기록입니다. 새로고침 후 다시 수정해주세요.');const data={...applyTextEdit(old,patch),revision:old.revision+1,updatedAt:Math.max(Date.now(),old.updatedAt+1)};validateDraft({...data,id:row.id});invalidateShare(tx,share,submission);tx.set(p.ob,data);return data;});},
  async remove(uid,row){owner(uid);const p=paths(uid,row.id);return runTransaction(db,async tx=>{owner(uid);const s=await tx.get(p.ob);if(!s.exists())return;const share=shareRefs(db,row.id),submission=await tx.get(share.request);if(s.data().revision!==row.revision)throw new Error('다른 기기에서 수정된 기록입니다. 새로고침 후 삭제해주세요.');invalidateShare(tx,share,submission);tx.delete(p.ob);tx.delete(p.photo);});}
 };
 cached={auth,repo,places:createTreePlaces(db,auth),identifyEndpoint:config.identifyEndpoint||'',token:()=>{if(!auth.currentUser)throw new Error('로그인이 필요합니다.');return auth.currentUser.getIdToken();},sharing:createSharing(db,auth),subscribe:callback=>onAuthStateChanged(auth,callback),login:(email,password)=>signInWithEmailAndPassword(auth,email,password),signup:(email,password)=>createUserWithEmailAndPassword(auth,email,password),logout:()=>signOut(auth),reset:email=>sendPasswordResetEmail(auth,email)};return cached;
}
export async function smallPhoto(photo,signal){
 const image=new Image();await new Promise((resolve,reject)=>{image.onload=resolve;image.onerror=()=>reject(new Error('사진을 열 수 없습니다.'));image.src=photo.dataUrl;});
 if(signal?.aborted)throw new DOMException('취소','AbortError');
 for(const side of [800,640,480,320]){const ratio=Math.min(1,side/Math.max(image.naturalWidth,image.naturalHeight));const c=document.createElement('canvas');c.width=Math.max(1,Math.round(image.naturalWidth*ratio));c.height=Math.max(1,Math.round(image.naturalHeight*ratio));c.getContext('2d').drawImage(image,0,0,c.width,c.height);
  for(const quality of [.8,.65,.45]){if(signal?.aborted)throw new DOMException('취소','AbortError');const data=c.toDataURL('image/jpeg',quality);try{validatePhoto(data);return data;}catch(_){}}
 }
 throw new Error('사진을 120KB 이하로 줄이지 못했습니다. 다른 사진을 선택해주세요.');
}
