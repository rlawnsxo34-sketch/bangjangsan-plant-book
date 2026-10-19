import {referenceImages} from '../backend/reference-images.mjs';
import {localizeCandidate} from '../backend/korean-names.mjs';
export async function identifyPhoto(runtime,endpoint,imageData,requestId,signal){
 if(!endpoint)throw new Error('AI_SETUP.txt에 따라 식별 서버 주소를 설정해주세요.');
 const url=new URL(endpoint);if(url.protocol!=='https:'||url.pathname!=='/identify'||url.search||url.hash||url.username||url.password)throw new Error('식별 서버 주소는 https://.../identify 형식으로 설정해주세요.');
 const token=await runtime.token();if(signal.aborted)throw new DOMException('취소','AbortError');
 const response=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+token},body:JSON.stringify({imageData,requestId}),signal});let data;try{data=await response.json();}catch(_){throw new Error('식별 서버 응답을 읽지 못했습니다.');}if(!response.ok)throw new Error(data.error||'식별 요청을 완료하지 못했습니다.');if(data.provider!=='plantnet'||!Array.isArray(data.candidates)||!data.candidates.length||data.candidates.length>5)throw new Error('식물을 찾지 못했어요. 잎이나 꽃이 잘 보이는 사진으로 다시 해보세요.');
 return data.candidates.map(c=>{if(typeof c.scientificName!=='string'||!c.scientificName.trim()||c.scientificName.length>200||typeof c.commonName!=='string'||c.commonName.length>200||(c.score!==null&&(!Number.isFinite(c.score)||c.score<0||c.score>1)))throw new Error('식물 설명을 읽지 못했어요. 잠시 후 다시 해보세요.');return localizeCandidate({scientificName:c.scientificName,commonName:c.commonName,score:c.score,images:referenceImages(c.images)});});
}
