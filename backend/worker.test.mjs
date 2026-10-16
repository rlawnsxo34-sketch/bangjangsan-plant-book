import {test} from 'node:test';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {Miniflare,convertV4MiniflareOptions} from 'miniflare';
import {imageBytes,candidates,preferredLanguage} from './worker.mjs';
test('photo bounds and provider normalization',()=>{assert.equal(imageBytes('data:image/jpeg;base64,/9j/2Q==').length,4);assert.throws(()=>imageBytes('data:image/png;base64,/9j/2Q=='));assert.throws(()=>imageBytes('data:image/jpeg;base64,AAAA'));const row=candidates({results:[{score:2,species:{scientificNameWithoutAuthor:'Pinus densiflora',commonNames:[]}}]})[0];assert.equal(row.scientificName,'Pinus densiflora');assert.equal(row.koreanName,'소나무');assert.equal(row.score,null);});
test('actual Worker + durable quota: authentication, CORS, idempotency and hard budgets',async()=>{
 let calls=0,languageCalls=0;const origin='https://book.example.test',token=uid=>'header.'+Buffer.from(JSON.stringify({aud:'demo-forest-book',iss:'https://securetoken.google.com/demo-forest-book',exp:Math.floor(Date.now()/1000)+3600,sub:uid})).toString('base64url')+'.test-signature';
 const mf=new Miniflare(convertV4MiniflareOptions({workers:[{name:'test',modules:[{type:'ESModule',path:fileURLToPath(new URL('./worker.mjs',import.meta.url))},{type:'ESModule',path:fileURLToPath(new URL('./korean-names.mjs',import.meta.url))},{type:'ESModule',path:fileURLToPath(new URL('./reference-images.mjs',import.meta.url))}],compatibilityDate:'2026-10-13',bindings:{FIREBASE_PROJECT_ID:'demo-forest-book',FIREBASE_API_KEY:'fake-public-key',PLANTNET_API_KEY:'TEST_SECRET',ALLOWED_ORIGINS:origin,GLOBAL_DAILY_LIMIT:'3',USER_DAILY_LIMIT:'1'},durableObjects:{QUOTA:{className:'IdentificationQuota',useSQLite:true}},outboundService:async request=>{
  const url=new URL(request.url);if(url.hostname==='identitytoolkit.googleapis.com'){const {idToken}=await request.json();const p=JSON.parse(Buffer.from(idToken.split('.')[1],'base64url'));return Response.json({users:[{localId:p.sub,providerUserInfo:[{providerId:'password'}]}]});}
  if(url.hostname==='my-api.plantnet.org'&&url.pathname==='/v2/languages'){languageCalls++;return Response.json(['en','ko']);}
  if(url.hostname==='my-api.plantnet.org'){assert.equal(url.searchParams.get('lang'),'ko');assert.equal(url.searchParams.get('include-related-images'),'true');assert.equal(url.searchParams.get('nb-results'),'5');calls++;const f=await request.formData();assert.deepEqual([...f.keys()],['images','organs']);assert.equal(f.get('organs'),'auto');if(calls===3)return new Response('secret diagnostic',{status:500});return Response.json({results:[{score:.8,species:{scientificNameWithoutAuthor:'Pinus densiflora',commonNames:['Japanese red pine']},images:[{author:'Test contributor',license:'cc-by-sa',url:{m:'https://bs.plantnet.org/image/m/0123456789abcdef0123456789abcdef01234567',o:'https://bs.plantnet.org/image/o/0123456789abcdef0123456789abcdef01234567'}}]}]});}throw new Error('Unexpected outbound host');}}]}));
 const post=(uid,id,extra={},requestOrigin=origin)=>mf.dispatchFetch('https://worker.example.test/identify',{method:'POST',headers:{Origin:requestOrigin,'Content-Type':'application/json',Authorization:'Bearer '+token(uid)},body:JSON.stringify({requestId:id,imageData:'data:image/jpeg;base64,/9j/2Q==',...extra})});
 try{assert.equal((await post('a','denied',{},'https://bad.example')).status,403);const unauthorized=await mf.dispatchFetch('https://worker.example.test/identify',{method:'POST',headers:{Origin:origin},body:'{}'});assert.equal(unauthorized.status,401);
 const first=await post('a','one');assert.equal(first.status,200);const result=await first.json();assert.equal(result.candidates[0].scientificName,'Pinus densiflora');assert.equal(result.candidates[0].koreanName,'소나무');assert.equal(result.candidates[0].images.length,1);assert.equal(result.candidates[0].images[0].author,'Test contributor');assert.equal(result.candidates[0].images[0].license,'CC BY-SA');assert.equal(calls,1);
 assert.equal((await post('a','one')).status,200);assert.equal(calls,1);assert.equal((await post('a','one',{imageData:'data:image/jpeg;base64,/9j/2f/Z'})).status,409);assert.equal((await post('a','two')).status,429);
 assert.equal((await post('b','one')).status,200);assert.equal((await post('c','one')).status,502);const repeat=await post('c','one');assert.equal(repeat.status,409);assert.equal((await post('d','one')).status,429);assert.equal(calls,3);assert.equal(languageCalls,1);assert.equal((await repeat.text()).includes('TEST_SECRET'),false);
 }finally{await mf.dispose();}
});

function memoryStorage(){const data=new Map();return {get:async k=>data.get(k),put:async(k,v)=>{data.set(k,v);}};}
test('supported Korean is cached and unsupported Korean falls back before identification',async()=>{
 const storage=memoryStorage();let calls=0;
 const lookup=async()=>{calls++;return Response.json(['en','ko']);};
 assert.equal(await preferredLanguage(storage,{PLANTNET_API_KEY:'test'},lookup),'ko');
 assert.equal(await preferredLanguage(storage,{PLANTNET_API_KEY:'test'},lookup),'ko');assert.equal(calls,1);
 assert.equal(await preferredLanguage(memoryStorage(),{PLANTNET_API_KEY:'test'},async()=>Response.json(['en','fr'])),'en');
});
test('language lookup network or malformed response does not block identification',async()=>{
 for(const lookup of [async()=>{throw new Error('network');},async()=>Response.json({error:'bad list'}),async()=>new Response('denied',{status:403})]){
  assert.equal(await preferredLanguage(memoryStorage(),{PLANTNET_API_KEY:'test'},lookup),'en');
 }
});
test('provider Korean name preferred over English and malformed common names tolerated',()=>{
 const row=candidates({results:[{species:{scientificNameWithoutAuthor:'Unlisted species',commonNames:['English name','제공된 한국어 이름']}}]})[0];
 assert.equal(row.koreanName,'제공된 한국어 이름');assert.equal(row.koreanNameSource,'plantnet');
 assert.equal(candidates({results:[{species:{scientificNameWithoutAuthor:'Unlisted species',commonNames:{bad:true}}}]})[0].displayName,'한글 이름 미등록');
});
