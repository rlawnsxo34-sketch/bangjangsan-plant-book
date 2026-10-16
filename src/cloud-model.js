import {validCenterId} from './center-model.js';
export const CLOUD_LIMIT=50;
export const PHOTO_BYTES=120000;
export function cloudMessage(error){
 const code=error?.code||'';
 const messages={'auth/invalid-credential':'이메일과 비밀번호를 확인해주세요.','auth/wrong-password':'이메일과 비밀번호를 확인해주세요.','auth/user-not-found':'이메일과 비밀번호를 확인해주세요.','auth/email-already-in-use':'이미 등록된 이메일입니다. 로그인하거나 비밀번호를 재설정해주세요.','auth/weak-password':'비밀번호는 6자 이상 입력해주세요.','auth/invalid-email':'이메일 주소를 확인해주세요.','auth/operation-not-allowed':'Firebase 콘솔에서 이메일/비밀번호 로그인을 사용 설정해주세요.','auth/network-request-failed':'네트워크 연결을 확인해주세요.','auth/too-many-requests':'요청이 많습니다. 잠시 후 다시 시도해주세요.','failed-precondition':'Firestore 인덱스가 준비되지 않았습니다. 인덱스를 배포하고 생성 완료를 확인해주세요.','permission-denied':'접근이 거부되었습니다. 본인 계정과 Firestore 규칙 배포 여부를 확인해주세요.','resource-exhausted':'Firebase 사용량 한도에 도달했습니다. 사용량을 확인해주세요.','unavailable':'서버에 연결하지 못했습니다. 입력은 유지됩니다. 잠시 후 다시 시도해주세요.'};
 return messages[code]||error?.message||'작업을 완료하지 못했습니다.';
}
export function validateDraft(row){
 if(!row||!/^[A-Za-z0-9_-]{1,80}$/.test(row.id))throw new Error('기록 ID가 올바르지 않습니다.');
 for(const [key,max]of [['name',80],['centerName',80],['description',1000]])if(typeof row[key]!=='string'||row[key].length>max||(key!=='description'&&!row[key].trim()))throw new Error('숲체원 이름·식물 이름·메모를 확인해주세요.');
 if('centerId' in row&&!validCenterId(row.centerId))throw new Error('관찰 기관 ID를 확인해주세요.');
 if(row.location!=null){const p=row.location;if(!Number.isFinite(p.lat)||!Number.isFinite(p.lng)||Math.abs(p.lat)>90||Math.abs(p.lng)>180)throw new Error('위치 좌표를 확인해주세요.');}
 if(!['gps','map','center_only','legacy_unspecified'].includes(row.locationSource))throw new Error('위치 입력 방식을 확인해주세요.');
 if((row.locationSource==='center_only')!== (row.location===null))throw new Error('위치와 입력 방식이 맞지 않습니다.');
 for(const key of ['createdAt','updatedAt'])if(!Number.isSafeInteger(row[key])||row[key]<=0)throw new Error('기록 시각이 올바르지 않습니다.');
 return row;
}
export function validatePhoto(data){
 if(typeof data!=='string'||!/^data:image\/jpeg;base64,(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(data))throw new Error('JPEG 사진을 선택해주세요.');
 const bytes=atob(data.slice(23));
 if(bytes.length<4||bytes.length>PHOTO_BYTES||bytes.charCodeAt(0)!==255||bytes.charCodeAt(1)!==216||bytes.charCodeAt(bytes.length-2)!==255||bytes.charCodeAt(bytes.length-1)!==217)throw new Error('사진 크기 또는 형식이 올바르지 않습니다.');
 return bytes.length;
}
export function createEpoch(){let value=0;return{next:()=>++value,current:()=>value,isCurrent:token=>token===value};}
