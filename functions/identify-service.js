const { createHash } = require('node:crypto');
const { HttpsError } = require('firebase-functions/v2/https');
const MAX_IMAGE_BYTES = 700000;
const safeText = value => typeof value === 'string' ? value.trim().slice(0,200) : '';
function validateInput(data) {
  if (!data || Object.keys(data).some(k=>!['imageData','organ','requestId'].includes(k))
    || !/^[A-Za-z0-9_-]{16,80}$/.test(data.requestId || '')
    || !['auto','leaf','flower','fruit','bark'].includes(data.organ)
    || typeof data.imageData !== 'string' || data.imageData.length > 950000
    || !/^data:image\/jpeg;base64,[A-Za-z0-9+/]+={0,2}$/.test(data.imageData)) {
    throw new HttpsError('invalid-argument','변환된 JPG 사진과 올바른 요청 정보가 필요합니다.');
  }
  const encoded=data.imageData.split(',')[1],bytes=Buffer.from(encoded,'base64');
  if (bytes.toString('base64') !== encoded || bytes.length < 4 || bytes.length > MAX_IMAGE_BYTES
    || bytes[0]!==255 || bytes[1]!==216 || bytes[2]!==255 || bytes.at(-2)!==255 || bytes.at(-1)!==217) {
    throw new HttpsError('invalid-argument','JPG 사진 형식 또는 크기를 확인해주세요.');
  }
  return { bytes,organ:data.organ,requestId:data.requestId,
    hash:createHash('sha256').update(bytes).update(data.organ).digest('hex') };
}
function normalizeResults(payload) {
  if (!payload || !Array.isArray(payload.results)) throw new HttpsError('data-loss','식별 결과 형식을 확인하지 못했습니다.');
  const seen=new Set(),candidates=[];
  for(const result of payload.results) {
    const scientificName=safeText(result.species?.scientificNameWithoutAuthor || result.species?.scientificName);
    const commonName=(Array.isArray(result.species?.commonNames)?result.species.commonNames:[]).map(safeText).find(Boolean)||'';
    if(!scientificName || !Number.isFinite(result.score) || result.score<0 || result.score>1 || seen.has(scientificName)) continue;
    seen.add(scientificName);candidates.push({scientificName,commonName,score:result.score});
  }
  return {provider:'plantnet',candidates:candidates.sort((a,b)=>b.score-a.score).slice(0,5)};
}
async function identifyWithPlantNet({bytes,organ,key,fetchImpl=fetch,timeoutMs=25000}) {
  const url=new URL('https://my-api.plantnet.org/v2/identify/all');
  url.searchParams.set('api-key',key);url.searchParams.set('nb-results','5');
  // English common names are supported; scientific names remain language independent.
  url.searchParams.set('lang','en');url.searchParams.set('include-related-images','false');
  const form=new FormData();form.append('images',new Blob([bytes],{type:'image/jpeg'}),'plant.jpg');form.append('organs',organ);
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),timeoutMs);
  try {
    const response=await fetchImpl(url,{method:'POST',body:form,signal:controller.signal,redirect:'error'});
    if(response.status===404) return {provider:'plantnet',candidates:[]};
    if(response.status===429) throw new HttpsError('resource-exhausted','식별 서비스 사용 한도에 도달했습니다. 나중에 다시 시도해주세요.');
    if([401,403].includes(response.status)) throw new HttpsError('failed-precondition','식별 서비스를 준비 중입니다. 이름을 직접 기록할 수 있습니다.');
    if(!response.ok) throw new HttpsError('unavailable','식별 서비스가 응답하지 않습니다. 잠시 후 다시 시도해주세요.');
    // Never forward raw provider responses, URLs, images or keys to the client/logs.
    const raw=await response.text();
    if(raw.length>300000) throw new HttpsError('data-loss','식별 결과 크기가 예상 범위를 초과했습니다.');
    return normalizeResults(JSON.parse(raw));
  } catch(error) {
    if(error instanceof HttpsError) throw error;
    if(controller.signal.aborted) throw new HttpsError('deadline-exceeded','식별 시간이 초과되었습니다. 결과를 다시 확인해주세요.');
    throw new HttpsError('unavailable','식별 서비스 연결을 확인하지 못했습니다. 잠시 후 다시 시도해주세요.');
  } finally {clearTimeout(timer);}
}
function createIdentifyService({db,getKey,provider=identifyWithPlantNet,now=()=>Date.now(),uidLimit=10,globalLimit=100}) {
  return async request=>{
    if(!request.auth?.uid) throw new HttpsError('unauthenticated','체험 계정 연결 또는 로그인이 필요합니다.');
    const input=validateInput(request.data),key=getKey();
    if(!key) throw new HttpsError('failed-precondition','식별 서비스를 준비 중입니다. 이름을 직접 기록할 수 있습니다.');
    const uid=request.auth.uid,time=now(),day=new Date(time).toISOString().slice(0,10);
    const base=db.collection('plantIdentificationRequests').doc(uid).collection('plantIdentificationAttempts');
    const ref=base.doc(input.requestId),ownerBudget=db.doc(`plantIdentificationUsage/${day}_${uid}`),budget=db.doc(`plantIdentificationUsage/${day}_global`);
    const reserved=await db.runTransaction(async tx=>{
      const previous=await tx.get(ref);
      if(previous.exists) {
        const record=previous.data();
        if(record.hash!==input.hash) throw new HttpsError('invalid-argument','같은 요청 ID에 다른 사진을 보낼 수 없습니다.');
        if(record.status==='complete') return {cached:record.result};
        if(record.status==='failed') throw new HttpsError(record.errorCode,record.errorMessage);
        throw new HttpsError('aborted','이전 식별 요청을 처리 중입니다. 잠시 후 결과를 다시 확인해주세요.');
      }
      const owner=await tx.get(ownerBudget),global=await tx.get(budget);
      const userUsage=owner.data()||{},allUsage=global.data()||{};
      if((userUsage.count||0)>=uidLimit || (allUsage.count||0)>=globalLimit) throw new HttpsError('resource-exhausted','오늘의 식별 사용 한도에 도달했습니다. 이름을 직접 기록하거나 내일 다시 이용해주세요.');
      if(userUsage.lastAt && time-userUsage.lastAt<10000) throw new HttpsError('resource-exhausted','식별 요청 사이에 10초 이상 기다려주세요.');
      const expiresAt=new Date(time+2*86400000);
      tx.set(ownerBudget,{count:(userUsage.count||0)+1,lastAt:time,expiresAt});
      tx.set(budget,{count:(allUsage.count||0)+1,expiresAt});
      tx.set(ref,{hash:input.hash,status:'pending',createdAt:time,expiresAt});
      return {cached:null};
    });
    if(reserved.cached) return reserved.cached;
    try {
      const result=await provider({...input,key});
      await ref.update({status:'complete',result});return result;
    } catch(error) {
      const safeError=error instanceof HttpsError?error:new HttpsError('unavailable','식별 결과를 확인하지 못했습니다.');
      // A failed/uncertain paid request is not automatically charged a second time.
      try {await ref.update({status:'failed',errorCode:safeError.code,errorMessage:safeError.message});}catch(_){}
      throw safeError;
    }
  };
}
module.exports={validateInput,normalizeResults,identifyWithPlantNet,createIdentifyService};
