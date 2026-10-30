import {referenceImages} from '../backend/reference-images.mjs';
import {localizeCandidate} from '../backend/korean-names.mjs';
import {IdentificationError,responseProblem} from './identify-problem.js';
export async function identifyPhoto(runtime,endpoint,imageData,requestId,signal){
 if(!endpoint)throw new IdentificationError('setup');
 let url;try{url=new URL(endpoint);}catch(_){throw new IdentificationError('setup');}if(url.protocol!=='https:'||url.pathname!=='/identify'||url.search||url.hash||url.username||url.password)throw new IdentificationError('setup');
 let token;try{token=await runtime.token();}catch(e){if(e.name==='AbortError')throw e;throw new IdentificationError('auth');}if(signal.aborted)throw new DOMException('취소','AbortError');
 let response;try{response=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+token},body:JSON.stringify({imageData,requestId}),signal});}catch(e){if(e.name==='AbortError')throw e;throw new IdentificationError('connection');}
 let data;try{data=await response.json();}catch(_){throw new IdentificationError(response.ok?'service':responseProblem(response.status));}
 if(!response.ok)throw new IdentificationError(responseProblem(response.status,data?.error));
 if(data?.provider!=='plantnet'||!Array.isArray(data.candidates)||data.candidates.length>5)throw new IdentificationError('service');
 if(!data.candidates.length)throw new IdentificationError('notFound');
 return data.candidates.map(c=>{if(!c||typeof c.scientificName!=='string'||!c.scientificName.trim()||c.scientificName.length>200||typeof c.commonName!=='string'||c.commonName.length>200||(c.score!==null&&(!Number.isFinite(c.score)||c.score<0||c.score>1)))throw new IdentificationError('service');return localizeCandidate({scientificName:c.scientificName,commonName:c.commonName,score:c.score,images:referenceImages(c.images)});});
}
