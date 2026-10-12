// This module never calls Firebase or any external service.
export const LIMITS = Object.freeze({records:200, imageBytes:675000, totalBytes:32*1024*1024, backupBytes:50*1024*1024});
export const DB_NAME = 'bangjangsan-spark-dev-v1';
const FORMAT='bangjangsan-local-backup';
const fail=message=>new Error(message);
export function storageMessage(error){
 if(error?.name==='QuotaExceededError')return '브라우저 저장 공간이 부족합니다. 먼저 백업한 뒤 불필요한 기록을 삭제해주세요.';
 if(error?.name==='SecurityError'||error?.name==='InvalidStateError')return '브라우저 저장소를 사용할 수 없습니다. 일반 브라우저 창에서 다시 열어주세요.';
 if(error?.name==='AbortError')return '저장이 완료되지 않았습니다. 입력을 유지했으니 다시 시도해주세요.';
 return error?.message||'기록을 처리하지 못했습니다. 다시 시도해주세요.';
}
export function cleanRecord(value){
 if(!value||typeof value!=='object'||Array.isArray(value))throw fail('올바른 식물 기록이 아닙니다.');
 const {id,name,description,createdAt,updatedAt,image,location}=value;
 if(typeof id!=='string'||!/^[a-zA-Z0-9_-]{1,80}$/.test(id))throw fail('기록 ID가 올바르지 않습니다.');
 if(typeof name!=='string'||!name.trim()||name.trim().length>80)throw fail('식물 이름은 1~80자로 입력해주세요.');
 if(typeof description!=='string'||description.length>1000)throw fail('메모는 1,000자 이하로 입력해주세요.');
 for(const date of [createdAt,updatedAt])if(!Number.isSafeInteger(date)||date<=0||date>8640000000000000)throw fail('기록 날짜가 올바르지 않습니다.');
 if(!(image instanceof Blob)||image.type!=='image/jpeg'||image.size<4||image.size>LIMITS.imageBytes)throw fail('저장 가능한 JPEG 사진이 아닙니다.');
 let coords=null;
 if(location!=null){
  if(typeof location!=='object'||!Number.isFinite(location.lat)||!Number.isFinite(location.lng)||Math.abs(location.lat)>90||Math.abs(location.lng)>180)throw fail('위치 좌표가 올바르지 않습니다.');
  coords={lat:location.lat,lng:location.lng};
 }
 return {id,name:name.trim(),description,createdAt,updatedAt,image,location:coords};
}
export function jpegDataToBlob(data){
 if(typeof data!=='string'||!/^data:image\/jpeg;base64,(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(data)||data.length>900000)throw fail('백업 사진 형식이 올바르지 않습니다.');
 const binary=atob(data.slice(23));
 if(binary.length<4||binary.length>LIMITS.imageBytes||binary.charCodeAt(0)!==255||binary.charCodeAt(1)!==216||binary.charCodeAt(2)!==255||binary.charCodeAt(binary.length-2)!==255||binary.charCodeAt(binary.length-1)!==217)throw fail('JPEG 사진 데이터가 올바르지 않습니다.');
 const bytes=Uint8Array.from(binary,c=>c.charCodeAt(0));return new Blob([bytes],{type:'image/jpeg'});
}
export function blobToDataUrl(blob){return new Promise((resolve,reject)=>{
 const reader=new FileReader();reader.onerror=()=>reject(fail('백업 사진을 읽지 못했습니다.'));reader.onload=()=>resolve(reader.result);reader.readAsDataURL(blob);
});}
function decodePhoto(blob,signal){return new Promise((resolve,reject)=>{
 const url=URL.createObjectURL(blob),img=new Image();let done=false;
 const finish=error=>{if(done)return;done=true;clearTimeout(timer);signal?.removeEventListener('abort',abort);img.onload=img.onerror=null;img.src='';URL.revokeObjectURL(url);error?reject(error):resolve();};
 const abort=()=>finish(Object.assign(fail('복원을 취소했습니다.'),{name:'AbortError'}));
 const timer=setTimeout(()=>finish(fail('백업 사진을 열지 못했습니다.')),15000);
 img.onerror=()=>finish(fail('손상된 사진이 포함된 백업입니다. 기존 기록은 변경하지 않았습니다.'));
 img.onload=()=>finish(img.naturalWidth>0&&img.naturalHeight>0&&Math.max(img.naturalWidth,img.naturalHeight)<=1000?null:fail('백업 사진은 긴 변 1,000px 이하이어야 합니다.'));
 if(signal?.aborted)return abort();signal?.addEventListener('abort',abort,{once:true});img.src=url;
});}
export async function parseBackup(text,{signal,decode=decodePhoto}={}){
 if(typeof text!=='string'||new Blob([text]).size>LIMITS.backupBytes)throw fail('백업 파일은 50MB 이하로 선택해주세요.');
 let data;try{data=JSON.parse(text);}catch(_){throw fail('읽을 수 없는 JSON 백업 파일입니다.');}
 if(data?.format!==FORMAT||data.version!==1||!Array.isArray(data.records)||data.records.length>LIMITS.records)throw fail('이 개발용 도감에서 내보낸 백업 파일을 선택해주세요.');
 const ids=new Set(),records=[];let total=0;
 for(const item of data.records){
  if(signal?.aborted)throw Object.assign(fail('복원을 취소했습니다.'),{name:'AbortError'});
  if(!item||typeof item!=='object')throw fail('백업 기록 형식이 올바르지 않습니다.');
  const record=cleanRecord({...item,image:jpegDataToBlob(item.imageData)});
  if(ids.has(record.id))throw fail('같은 ID가 반복된 백업 파일입니다.');ids.add(record.id);
  total+=record.image.size;if(total>LIMITS.totalBytes)throw fail('백업 사진의 합계는 32MB 이하이어야 합니다.');
  await decode(record.image,signal);records.push(record);
 }
 return records;
}
export async function makeBackup(records){
 checkCapacity(records);
 const packed=[];for(const row of records){const r=cleanRecord(row);const {image,...fields}=r;packed.push({...fields,imageData:await blobToDataUrl(image)});}
 const result=JSON.stringify({format:FORMAT,version:1,exportedAt:new Date().toISOString(),records:packed});
 if(new Blob([result]).size>LIMITS.backupBytes)throw fail('백업 파일이 너무 큽니다. 기록 수를 줄여주세요.');return result;
}
export function checkCapacity(records){
 if(records.length>LIMITS.records)throw fail('개발용 도감은 최대 200개 기록까지 저장할 수 있습니다. 먼저 백업해주세요.');
 if(records.reduce((sum,r)=>sum+r.image.size,0)>LIMITS.totalBytes)throw fail('개발용 사진 저장 한도 32MB를 넘었습니다. 먼저 백업한 뒤 기록을 정리해주세요.');
}
export function createStore(factory=globalThis.indexedDB){
 let connection;
 function open(){
  if(connection)return connection;
  connection=new Promise((resolve,reject)=>{
   if(!factory){reject(fail('이 브라우저는 사진 저장소를 지원하지 않습니다. 최신 브라우저를 사용해주세요.'));return;}
   const req=factory.open(DB_NAME,1);let blocked=false;
   req.onupgradeneeded=()=>{if(!req.result.objectStoreNames.contains('plants'))req.result.createObjectStore('plants',{keyPath:'id'});};
   req.onblocked=()=>{blocked=true;reject(fail('다른 탭에서 저장소를 사용 중입니다. 다른 도감 탭을 닫고 다시 시도해주세요.'));};
   req.onerror=()=>reject(req.error);
   req.onsuccess=()=>{if(blocked){req.result.close();return;}const db=req.result;db.onversionchange=()=>{db.close();connection=null;};resolve(db);};
  });connection.catch(()=>{connection=null;});return connection;
 }
 async function list(){const db=await open();return new Promise((resolve,reject)=>{const tx=db.transaction('plants','readonly');const req=tx.objectStore('plants').getAll();let rows;req.onsuccess=()=>{rows=req.result;};tx.oncomplete=()=>resolve(rows.sort((a,b)=>b.createdAt-a.createdAt));tx.onabort=()=>reject(tx.error||fail('도감을 읽지 못했습니다.'));tx.onerror=()=>{};});}
 // All decisions, capacity checks and writes share one serialized IDB transaction.
 async function mutate(operation){const db=await open();return new Promise((resolve,reject)=>{
  const tx=db.transaction('plants','readwrite'),store=tx.objectStore('plants');let result,reason;
  tx.oncomplete=()=>{globalThis.dispatchEvent?.(new Event('plant-records-changed'));resolve(result);};
  tx.onabort=()=>reject(reason||tx.error||fail('저장을 완료하지 못했습니다.'));tx.onerror=()=>{};
  const req=store.getAll();req.onsuccess=()=>{try{result=operation(store,req.result);}catch(error){reason=error;tx.abort();}};
 });}
 async function add(value){const record=cleanRecord(value);return mutate((store,rows)=>{
  const existing=rows.find(r=>r.id===record.id);if(existing)return {saved:existing,alreadySaved:true};
  checkCapacity([...rows,record]);store.add(record);return {saved:record,alreadySaved:false};
 });}
 async function edit(id,patch,expectedUpdatedAt){return mutate((store,rows)=>{
  const old=rows.find(r=>r.id===id);if(!old)throw fail('이 기록은 다른 탭에서 삭제되었습니다. 도감을 새로 불러와주세요.');
  if(old.updatedAt!==expectedUpdatedAt)throw fail('다른 탭에서 수정된 기록입니다. 최신 기록을 확인한 뒤 다시 수정해주세요.');
  const record=cleanRecord({...old,name:patch.name,description:patch.description,updatedAt:Math.max(Date.now(),old.updatedAt+1)});store.put(record);return record;
 });}
 async function remove(id,expectedUpdatedAt){return mutate((store,rows)=>{
  const old=rows.find(r=>r.id===id);if(old&&old.updatedAt!==expectedUpdatedAt)throw fail('다른 탭에서 수정된 기록입니다. 최신 기록을 확인한 뒤 삭제해주세요.');
  store.delete(id);return {deleted:!!old};
 });}
 async function restore(values){const incoming=values.map(cleanRecord);return mutate((store,rows)=>{
  const ids=new Set(rows.map(r=>r.id)),added=[];let skipped=0;
  for(const r of incoming){if(ids.has(r.id)){skipped++;continue;}ids.add(r.id);added.push(r);}
  checkCapacity([...rows,...added]);for(const r of added)store.add(r);return {added:added.length,skipped};
 });}
 return {list,add,edit,remove,restore};
}
