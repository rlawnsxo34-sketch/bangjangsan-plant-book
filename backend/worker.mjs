import {referenceImages} from './reference-images.mjs';
import {localizeCandidate} from './korean-names.mjs';
const reply=(body,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store'}});
const fail=(message,status=400)=>Object.assign(new Error(message),{status});
async function boundedJSON(response,max){const reader=response.body?.getReader();if(!reader)throw fail('응답을 읽지 못했습니다.',502);let size=0,chunks=[];while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>max){await reader.cancel();throw fail('요청 또는 응답 크기가 너무 큽니다.',413);}chunks.push(value);}const data=new Uint8Array(size);let i=0;for(const c of chunks){data.set(c,i);i+=c.length;}try{return JSON.parse(new TextDecoder().decode(data));}catch(_){throw fail('JSON 형식이 올바르지 않습니다.');}}
export function imageBytes(data){if(typeof data!=='string'||data.length>160023||!/^data:image\/jpeg;base64,(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(data))throw fail('120KB 이하 JPEG 사진이 필요합니다.');const raw=atob(data.slice(23));if(raw.length<4||raw.length>120000||raw.charCodeAt(0)!==255||raw.charCodeAt(1)!==216||raw.charCodeAt(raw.length-2)!==255||raw.charCodeAt(raw.length-1)!==217)throw fail('JPEG 사진 형식이 올바르지 않습니다.');return Uint8Array.from(raw,c=>c.charCodeAt(0));}
export function candidates(data){return (Array.isArray(data?.results)?data.results:[]).slice(0,5).flatMap(r=>{
 const sci=r?.species?.scientificNameWithoutAuthor;
 if(typeof sci!=='string'||!sci.trim()||sci.length>200)return [];
 const names=Array.isArray(r.species.commonNames)?r.species.commonNames.filter(x=>typeof x==='string'&&x.trim()&&x.length<=200):[];
 const commonName=names.find(x=>/[가-힣]/u.test(x))||names[0]||'';
 return [localizeCandidate({images:referenceImages(r.images,{provider:true}),scientificName:sci,commonName,score:typeof r.score==='number'&&Number.isFinite(r.score)&&r.score>=0&&r.score<=1?r.score:null})];
});}
export async function preferredLanguage(storage,env,request=fetch){
 const now=Date.now(),key='meta:language:v1',cached=await storage.get(key);
 if(cached&&cached.expiresAt>now&&(cached.lang==='ko'||cached.lang==='en'))return cached.lang;
 let lang='en',ttl=10*60*1000;
 try {
  const response=await request('https://my-api.plantnet.org/v2/languages?api-key='+encodeURIComponent(env.PLANTNET_API_KEY),{signal:AbortSignal.timeout(5000)});
  if(!response.ok)throw new Error('language lookup failed');
  const languages=await boundedJSON(response,20000);
  if(!Array.isArray(languages)||!languages.every(x=>typeof x==='string'))throw new Error('invalid language list');
  lang=languages.includes('ko')?'ko':'en';ttl=86400000;
 }catch(_){/* Name lookup failure must not prevent identification. No identification retry. */}
 await storage.put(key,{lang,expiresAt:now+ttl});return lang;
}
async function firebaseUser(token,env){try{const payload=JSON.parse(atob(token.split('.')[1].replace(/-/g,'+').replace(/_/g,'/')));if(payload.aud!==env.FIREBASE_PROJECT_ID||payload.iss!=='https://securetoken.google.com/'+env.FIREBASE_PROJECT_ID||payload.exp<=Date.now()/1000)throw 0;}catch(_){throw fail('로그인이 만료되었거나 올바르지 않습니다.',401);}
 const res=await fetch('https://identitytoolkit.googleapis.com/v1/accounts:lookup?key='+encodeURIComponent(env.FIREBASE_API_KEY),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({idToken:token}),signal:AbortSignal.timeout(10000)});if(!res.ok)throw fail('로그인을 확인하지 못했습니다. 다시 로그인해주세요.',401);const data=await boundedJSON(res,100000),u=data.users?.[0];if(!u?.localId||u.disabled||!u.providerUserInfo?.some(p=>p.providerId==='password'))throw fail('이메일 계정 로그인이 필요합니다.',401);return u.localId;
}
export default {async fetch(request,env){const origin=request.headers.get('Origin'),allowed=(env.ALLOWED_ORIGINS||'').split(',').map(x=>x.trim()).filter(Boolean);if(!origin||!allowed.includes(origin))return reply({error:'허용되지 않은 접속 주소입니다.'},403);const headers={'Access-Control-Allow-Origin':origin,'Vary':'Origin','Access-Control-Allow-Methods':'POST, OPTIONS','Access-Control-Allow-Headers':'Authorization, Content-Type','Cache-Control':'no-store'};
 let response;try{if(request.method==='OPTIONS')response=new Response(null,{status:204});else{
  if(request.method!=='POST'||new URL(request.url).pathname!=='/identify')throw fail('지원하지 않는 요청입니다.',405);
  if(!env.PLANTNET_API_KEY||!env.FIREBASE_API_KEY||!env.QUOTA)throw fail('식별 서버 설정이 아직 완료되지 않았습니다.',503);
  const authorization=request.headers.get('Authorization')||'';if(!authorization.startsWith('Bearer ')||authorization.length>10000)throw fail('로그인이 필요합니다.',401);
  const input=await boundedJSON(request,180000);if(!/^[A-Za-z0-9_-]{1,80}$/.test(input.requestId||''))throw fail('요청 ID를 확인해주세요.');imageBytes(input.imageData);
  const uid=await firebaseUser(authorization.slice(7),env);const id=env.QUOTA.idFromName('project-global-v1');response=await env.QUOTA.get(id).fetch('https://internal/identify',{method:'POST',body:JSON.stringify({uid,requestId:input.requestId,imageData:input.imageData})});
 }}catch(e){response=reply({error:e.status?e.message:'식별 서버에 연결하지 못했습니다. 이름을 직접 입력할 수 있습니다.'},e.status||503);}const result=new Response(response.body,{status:response.status,headers:response.headers});for(const [k,v]of Object.entries(headers))result.headers.set(k,v);return result;}};
export class IdentificationQuota {
 constructor(ctx,env){this.ctx=ctx;this.env=env;}
 async fetch(request){try{const input=await request.json(),now=Date.now(),day=new Date(now).toISOString().slice(0,10),hash=[...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(input.imageData)))].map(x=>x.toString(16).padStart(2,'0')).join(''),key='r:'+input.uid+':'+input.requestId;
  const reservation=await this.ctx.storage.transaction(async tx=>{const old=await tx.get(key);if(old){if(old.hash!==hash)throw fail('같은 요청 ID에 다른 사진을 보낼 수 없습니다.',409);if(old.status==='complete')return old.result;throw fail(old.status==='pending'?'이전 분석이 진행 중입니다. 잠시 후 같은 사진으로 다시 확인해주세요.':'이 요청의 분석을 완료하지 못했습니다. 다른 사진을 선택하거나 이름을 직접 입력해주세요.',409);}
   const gkey='g:'+day,ukey='u:'+day+':'+input.uid,g=await tx.get(gkey)||0,u=await tx.get(ukey)||{count:0,last:0};const gl=Number(this.env.GLOBAL_DAILY_LIMIT),ul=Number(this.env.USER_DAILY_LIMIT);if(!Number.isInteger(gl)||gl<1||gl>100||!Number.isInteger(ul)||ul<1||ul>20)throw fail('서버 호출 한도 설정을 확인해주세요.',503);if(g>=gl||u.count>=ul)throw fail('오늘의 식별 호출 한도에 도달했습니다. 이름을 직접 입력해주세요.',429);if(now-u.last<10000)throw fail('분석 요청 사이에 10초 이상 기다려주세요.',429);
   await tx.put(gkey,g+1);await tx.put(ukey,{count:u.count+1,last:now});await tx.put(key,{hash,status:'pending',createdAt:now});return null;});
  if(reservation)return reply(reservation);
  // Alarm deletes quota/cache metadata after 48h; no photos or identity tokens are stored.
  if(!(await this.ctx.storage.getAlarm()))await this.ctx.storage.setAlarm(now+86400000);
  try{const language=await preferredLanguage(this.ctx.storage,this.env);const form=new FormData();form.append('images',new Blob([imageBytes(input.imageData)],{type:'image/jpeg'}),'plant.jpg');form.append('organs','auto');const upstream=await fetch('https://my-api.plantnet.org/v2/identify/all?api-key='+encodeURIComponent(this.env.PLANTNET_API_KEY)+'&include-related-images=true&nb-results=5&lang='+language,{method:'POST',body:form,signal:AbortSignal.timeout(25000)});if(!upstream.ok)throw fail(upstream.status===429?'Pl@ntNet 호출 한도에 도달했습니다.':'사진을 식별하지 못했습니다. 더 선명한 사진을 선택하거나 이름을 직접 입력해주세요.',502);const rows=candidates(await boundedJSON(upstream,1000000));if(!rows.length)throw fail('식물 후보를 찾지 못했습니다. 이름을 직접 입력할 수 있습니다.',422);const result={provider:'plantnet',candidates:rows};await this.ctx.storage.put(key,{hash,status:'complete',result,createdAt:now});return reply(result);
  }catch(e){await this.ctx.storage.put(key,{hash,status:'failed',createdAt:now});throw e;}
 }catch(e){return reply({error:e.status?e.message:'분석을 완료하지 못했습니다. 이름을 직접 입력할 수 있습니다.'},e.status||503);}}
 async alarm(){const all=await this.ctx.storage.list();const cutoff=Date.now()-2*86400000;for(const [k,v]of all){if(k==='meta:language:v1'&&v.expiresAt<Date.now())await this.ctx.storage.delete(k);else if(k.startsWith('r:')&&v.createdAt<cutoff)await this.ctx.storage.delete(k);else if((k.startsWith('g:')||k.startsWith('u:'))&&k.slice(2,12)<new Date(cutoff).toISOString().slice(0,10))await this.ctx.storage.delete(k);}if((await this.ctx.storage.list({limit:1})).size)await this.ctx.storage.setAlarm(Date.now()+86400000);}
}
