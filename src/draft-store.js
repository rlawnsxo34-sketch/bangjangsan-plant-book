import {recordPhotos} from './record-photos.js';
import {validCenterId} from './center-model.js';
export const DRAFT_TTL=7*24*60*60*1000;
export const DRAFT_LIMIT=20;
export function draftKey(uid,centerId){
 if(typeof uid!=='string'||!uid||uid.length>128||!validCenterId(centerId))throw new Error('임시 보관 계정과 기관을 확인해주세요.');
 return JSON.stringify([uid,centerId]);
}
export function hasDraft(d){return !!(d?.imageData||d?.name||d?.description||d?.location);}
// Explicit allowlist: never persist passwords, tokens, consent or provider requests.
export function cleanDraft(d,centerId){
 if(!d||d.centerId!==centerId)throw new Error('임시 기록의 관찰 기관이 다릅니다.');
 for(const [key,max] of [['name',80],['description',1000],['centerName',80]])if(typeof d[key]!=='string'||d[key].length>max)throw new Error('임시 기록 내용을 확인해주세요.');
 recordPhotos(d);
 const p=d.location;
 if(p!==null&&(!p||!Number.isFinite(p.lat)||Math.abs(p.lat)>90||!Number.isFinite(p.lng)||Math.abs(p.lng)>180))throw new Error('임시 기록 좌표가 올바르지 않습니다.');
 if(!['gps','map','center_only'].includes(d.locationSource)||(d.locationSource==='center_only')!==(p===null))throw new Error('임시 기록 위치 정보가 올바르지 않습니다.');
 const result={name:d.name,description:d.description,centerId,centerName:d.centerName,imageData:d.imageData,location:p?{lat:p.lat,lng:p.lng}:null,locationSource:d.locationSource};
 if(d.additionalImages?.length)result.additionalImages=[...d.additionalImages];
 const a=d.aiSelection;
 if(a?.provider==='plantnet'&&typeof a.scientificName==='string'&&a.scientificName.length>0&&a.scientificName.length<=200&&typeof a.commonName==='string'&&a.commonName.length<=200&&(a.score===null||(Number.isFinite(a.score)&&a.score>=0&&a.score<=1))&&Number.isSafeInteger(a.selectedAt)&&a.selectedAt>0)result.aiSelection={provider:'plantnet',scientificName:a.scientificName,commonName:a.commonName,score:a.score,selectedAt:a.selectedAt};
 return result;
}
export function pendingSave(value){
 if(!value)return null;
 if(typeof value.id!=='string'||!/^[A-Za-z0-9_-]{1,80}$/.test(value.id)||!Number.isSafeInteger(value.createdAt)||value.createdAt<=0||!Number.isSafeInteger(value.updatedAt)||value.updatedAt<value.createdAt)throw new Error('저장 요청 ID가 올바르지 않습니다.');
 return {id:value.id,createdAt:value.createdAt,updatedAt:value.updatedAt};
}
export function draftStorageMessage(e){return e?.code==='draft-conflict'?'다른 탭에서 이 임시 기록이 변경되었습니다. 현재 입력은 화면에 남아 있습니다. 내용을 따로 보관한 뒤 새로고침해주세요.':e?.name==='QuotaExceededError'?'기기 저장 공간이 부족해 임시 보관하지 못했습니다. 화면을 닫기 전에 계정에 저장해주세요.':'기기 임시 보관에 실패했습니다. 화면을 닫기 전에 계정에 저장해주세요.';}
function conflict(){const e=new Error('임시 기록 충돌');e.code='draft-conflict';return e;}
export function createDraftStore(indexedDB=globalThis.indexedDB,now=Date.now,uuid=()=>globalThis.crypto.randomUUID()){
 let opening;
 function open(){if(!indexedDB)return Promise.reject(new Error('기기 저장소를 사용할 수 없습니다.'));if(!opening)opening=new Promise((resolve,reject)=>{const r=indexedDB.open('egmy-account-drafts',1);r.onupgradeneeded=()=>r.result.createObjectStore('drafts',{keyPath:'key'});r.onerror=()=>{opening=null;reject(r.error);};r.onblocked=()=>{reject(new Error('다른 탭의 기기 저장소를 닫아주세요.'));};r.onsuccess=()=>{const db=r.result;db.onversionchange=()=>{db.close();opening=null;};resolve(db);};});return opening;}
 async function transaction(change){const db=await open();return new Promise((resolve,reject)=>{const tx=db.transaction('drafts','readwrite'),s=tx.objectStore('drafts');let result,problem;tx.oncomplete=()=>resolve(result);tx.onabort=()=>reject(problem||tx.error||new Error('임시 보관이 취소되었습니다.'));tx.onerror=()=>{};const r=s.getAll();r.onsuccess=()=>{try{const active=r.result.filter(x=>x.expiresAt>now());for(const row of r.result)if(row.expiresAt<=now())s.delete(row.key);result=change(s,active);}catch(e){problem=e;tx.abort();}};});}
 return {
  read(uid,centerId){const key=draftKey(uid,centerId);return transaction((_s,rows)=>{const row=rows.find(x=>x.key===key);if(!row)return null;return {...row,draft:cleanDraft(row.draft,centerId),pending:pendingSave(row.pending)};});},
  write(uid,centerId,draft,pending,expected){const key=draftKey(uid,centerId),safe=cleanDraft(draft,centerId),save=pendingSave(pending);return transaction((s,rows)=>{const old=rows.find(x=>x.key===key);if((old?.revision||null)!==expected)throw conflict();if(!hasDraft(safe)){s.delete(key);return null;}if(!old&&rows.length>=DRAFT_LIMIT)throw new Error('임시 보관 한도 20개에 도달했습니다. 다른 기관의 임시 기록을 정리해주세요.');const time=now(),row={key,draft:safe,pending:save,revision:uuid(),updatedAt:time,expiresAt:time+DRAFT_TTL};s.put(row);return row;});},
  remove(uid,centerId,expected){const key=draftKey(uid,centerId);return transaction((s,rows)=>{if((rows.find(x=>x.key===key)?.revision||null)!==expected)throw conflict();s.delete(key);return null;});}
 };
}
// Each queue owns one immutable account/institution. Writes commit in order even
// when its UI unmounts; callbacks in the hook are separately session guarded.
export function createDraftQueue(store,uid,centerId){
 let tail=Promise.resolve(),revision=null,ready=false;
 function run(fn){const result=tail.then(fn);tail=result.catch(()=>{});return result;}
 return {
  read:()=>run(async()=>{const row=await store.read(uid,centerId);revision=row?.revision||null;ready=true;return row;}),
  write:(draft,pending)=>run(async()=>{if(!ready)throw new Error('임시 기록 확인 중입니다.');const row=await store.write(uid,centerId,draft,pending,revision);revision=row?.revision||null;return row;}),
  remove:()=>run(async()=>{if(!ready)throw new Error('임시 기록 확인 중입니다.');await store.remove(uid,centerId,revision);revision=null;})
 };
}
