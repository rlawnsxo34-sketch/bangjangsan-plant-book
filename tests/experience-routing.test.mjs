import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import React from 'react';
import {IDBFactory} from 'fake-indexeddb';
import {create,act} from 'react-test-renderer';
import {build} from 'esbuild';
const output=new URL(`.routing-test-${process.pid}.mjs`,import.meta.url);
const runtimeFilter=/[\\/]cloud-runtime\.js$/;
// esbuild passes native paths to plugins, including backslashes on Windows.
assert.ok(runtimeFilter.test('C:\\Users\\김준태\\Documents\\GitHub\\bangjangsan-plant-book\\src\\cloud-runtime.js'));
assert.ok(runtimeFilter.test('/workspace/plant book/src/cloud-runtime.js'));
let runtimeMocked=false;
const built=await build({absWorkingDir:fileURLToPath(new URL('../',import.meta.url)),entryPoints:['src/CloudApp.jsx'],bundle:true,platform:'node',format:'esm',write:false,external:['react','@phosphor-icons/react'],plugins:[{name:'test-runtime',setup(b){b.onLoad({filter:runtimeFilter},()=>{runtimeMocked=true;return {contents:'export function getRuntime(){return globalThis.__runtime;} export async function smallPhoto(photo){return photo.dataUrl||"data:image/jpeg;base64,/9j/AP/Z";}',loader:'js'};});}}]});
assert.equal(runtimeMocked,true,'The isolated runtime must be installed before importing the app; no real Firebase calls are allowed in this test.');
await fs.writeFile(output,built.outputFiles[0].text);let App;
try{({default:App}=await import(output.href));}finally{await fs.unlink(output);}
const centers=[{id:'jangseong',name:'국립장성숲체원',active:true},{id:'other',name:'시연기관',active:true,isDemo:true},{id:'off',name:'비활성기관',active:false}];
function setup(search){const subscribers=new Set(),events=new Map();let user=null,confirm=true;globalThis.__runtime={sharing:{centers:async()=>centers},subscribe:fn=>{subscribers.add(fn);fn(user);return()=>subscribers.delete(fn);}};
 globalThis.window={plantPhotoFlow:{createLatestTask:()=>({cancel(){}})},location:{search,href:'https://example.test/'+search},navigator:{userAgent:'test'},localStorage:{getItem:()=>null,setItem:()=>{}},scrollTo:()=>{},confirm:()=>confirm,addEventListener:(n,fn)=>events.set(n,fn),removeEventListener:(n,fn)=>{if(events.get(n)===fn)events.delete(n);}};
 return{auth:next=>{user=next;subscribers.forEach(fn=>fn(next));},cancel:()=>confirm=false,confirm:()=>confirm=true,events};}
function label(value){return typeof value==='string'?value:Array.isArray(value)?value.map(label).join(''):value?.props?label(value.props.children):'';}
function button(root,text){return root.root.findAllByType('button').find(b=>label(b.props.children)===text);}
async function mount(){let root;await act(async()=>{root=create(React.createElement(App));await new Promise(r=>setImmediate(r));});return root;}
test('capture and book offer the public tree map without losing the photo draft or resetting the active book filters',async()=>{
 const env=setup('?center=jangseong');globalThis.indexedDB=new IDBFactory();let writes=0,placeReads=0;
 globalThis.__runtime.repo={list:async()=>[{id:'unknown',name:'이름 모름',centerId:'jangseong',centerName:'국립장성숲체원',createdAt:1,description:''}],add:async()=>writes++};
 globalThis.__runtime.places={list:async()=>{placeReads++;return [];}};globalThis.__runtime.sharing.grants=async()=>[];
 window.plantPhotoFlow={preparePhoto:async()=>({}),createLatestTask:()=>({cancel(){},begin(){return {signal:new AbortController().signal,isCurrent:()=>true};}})};
 let root;try{
  root=await mount();await act(async()=>env.auth({uid:'map-owner',email:'map@example.test'}));await act(async()=>button(root,'식물 찾기').props.onClick());
  for(let i=0;i<4;i++)await act(async()=>new Promise(r=>setTimeout(r,15)));
  const name=()=>root.root.findAllByType('input').find(i=>i.props.placeholder==='이름 모름으로 저장할 수 있습니다');
  await act(async()=>root.root.findByProps({'aria-label':'계정 앨범 사진 선택'}).props.onChange({target:{files:[{}],value:''}}));await act(async()=>name().props.onChange({target:{value:'기록 중인 나무'}}));
  await act(async()=>button(root,'나무 지도 보기').props.onClick());assert.equal(root.root.findByProps({className:'account-content'}).props.hidden,true);assert.ok(button(root,'식물 찾기로 돌아가기'));assert.equal(writes,0);
  await act(async()=>button(root,'식물 찾기로 돌아가기').props.onClick());assert.equal(root.root.findByProps({className:'account-content'}).props.hidden,false);assert.equal(name().props.value,'기록 중인 나무');assert.equal(root.root.findByProps({'aria-label':'저장할 사진 목록'}).findAllByType('img').length,1);
  await act(async()=>button(root,'내 도감').props.onClick());await act(async()=>root.root.findByProps({'aria-label':'내 도감 기록 고르기'}).findAllByType('button')[1].props.onClick());
  await act(async()=>button(root,'나무 지도 보기').props.onClick());assert.ok(button(root,'내 도감으로 돌아가기'));await act(async()=>button(root,'내 도감으로 돌아가기').props.onClick());assert.equal(root.root.findByProps({'aria-label':'내 도감 기록 고르기'}).findAllByType('button')[1].props['aria-pressed'],true);assert.equal(writes,0);assert.equal(placeReads,2);
 }finally{if(root)await act(async()=>root.unmount());}
});
test('tree map is available before login and the primary navigation still has four tabs',async()=>{
 setup('?center=jangseong');globalThis.__runtime.places={list:async()=>[]};let root;try{
  root=await mount();await act(async()=>button(root,'식물 찾기').props.onClick());await act(async()=>button(root,'나무 지도 보기').props.onClick());assert.ok(root.root.findByProps({'aria-label':'나무 지도'}));assert.equal(root.root.findByProps({'aria-label':'주요 메뉴'}).findAllByType('button').length,4);await act(async()=>button(root,'식물 찾기로 돌아가기').props.onClick());assert.equal(root.root.findAllByProps({type:'password'}).length,1);
 }finally{if(root)await act(async()=>root.unmount());}
});
test('saved record opens its photo editor, asks before discarding changes and refreshes after an explicit save',async()=>{
 const env=setup('?center=jangseong');globalThis.indexedDB=new IDBFactory();let writes=0;
 const photo=n=>'data:image/jpeg;base64,'+Buffer.from([255,216,n,255,217]).toString('base64');
 const row={id:'saved-album',name:'갈참나무',centerName:'국립장성숲체원',revision:1,createdAt:1,updatedAt:1,description:'내 기록',location:null};
 const oldDocument=globalThis.document;globalThis.document={activeElement:null,body:{style:{}},getElementById:()=>null,addEventListener(){},removeEventListener(){}};
 const node=()=>({focus(){},querySelectorAll:()=>[],setAttribute(){},removeAttribute(){},contains:()=>true});
 globalThis.__runtime.repo={list:async()=>[row],photos:async()=>[photo(1),photo(2)],album:async()=>({record:row,photos:[photo(1),photo(2)]}),editPhotos:async(_uid,record,photos)=>{writes++;return {record:{...record,revision:2},photos};}};
 let root;try{await act(async()=>{root=create(React.createElement(App),{createNodeMock:node});await new Promise(resolve=>setImmediate(resolve));});
 await act(async()=>env.auth({uid:'record-owner',email:'owner@example.test'}));await act(async()=>button(root,'내 도감').props.onClick());
 for(let i=0;i<3;i++)await act(async()=>new Promise(resolve=>setTimeout(resolve,15)));
 const observation=root.root.findAllByType('button').find(b=>b.props.className==='observation-row');assert.ok(observation);
 await act(async()=>observation.props.onClick({currentTarget:node()}));assert.ok(button(root,'사진 추가·바꾸기'));
 await act(async()=>button(root,'사진 추가·바꾸기').props.onClick());assert.equal(root.root.findByProps({role:'dialog'}).props['aria-label'],'저장한 사진 바꾸기');
 await act(async()=>root.root.findByProps({'aria-label':'2번 사진 빼기'}).props.onClick());env.cancel();await act(async()=>button(root,'닫기').props.onClick());assert.equal(root.root.findAllByProps({role:'dialog'}).length,1);assert.equal(writes,0);
 await act(async()=>button(root,'사진 변경 저장하기').props.onClick());assert.equal(writes,1);assert.equal(root.root.findAllByProps({role:'dialog'}).length,0);assert.ok(JSON.stringify(root.toJSON()).includes('사진 변경을 저장했어요'));
 }finally{if(root)await act(async()=>root.unmount());globalThis.document=oldDocument;}
});
test('four primary tabs keep old browser records in a separate archive with no create action',async()=>{
 setup('?center=jangseong');globalThis.indexedDB=new IDBFactory();
 const oldDocument=globalThis.document,oldChannel=globalThis.BroadcastChannel;
 globalThis.document={addEventListener(){},removeEventListener(){}};globalThis.BroadcastChannel=class{close(){}};
 let root;try{root=await mount();const nav=root.root.findByProps({'aria-label':'주요 메뉴'});assert.deepEqual(nav.findAllByType('button').map(b=>label(b.props.children)),['숲 둘러보기','식물 찾기','내 도감','함께 보기']);
 await act(async()=>button(root,'내 도감').props.onClick());assert.ok(button(root,'이전 기록·백업'));
 await act(async()=>button(root,'이전 기록·백업').props.onClick());
 await act(async()=>new Promise(resolve=>setTimeout(resolve,20)));
 assert.ok(JSON.stringify(root.toJSON()).includes('이전 기록은 계정 도감으로 자동 이동되지 않아요'));
 assert.equal(button(root,'식물 관찰 기록하기'),undefined);assert.equal(button(root,'관찰 기록'),undefined);assert.ok(button(root,'백업·복원'));
 }finally{if(root)await act(async()=>root.unmount());globalThis.document=oldDocument;globalThis.BroadcastChannel=oldChannel;}
});
test('valid active institution entry goes directly to a visitor experience without requiring login',async()=>{setup('?center=jangseong&view=explore');const root=await mount();assert.equal(root.root.findAllByType('textarea').length,3);assert.ok(JSON.stringify(root.toJSON()).includes('로그인 없이 나무를 살펴봐요'));assert.equal(root.root.findAllByProps({type:'password'}).length,0);assert.equal(root.root.findByProps({'aria-label':'주요 메뉴'}).findAllByType('button').length,4);await act(async()=>root.unmount());});
test('unknown or inactive institution entries remain in the chooser',async()=>{for(const id of ['off','missing']){setup('?center='+id);const root=await mount();assert.equal(root.root.findAllByType('textarea').length,0);assert.ok(JSON.stringify(root.toJSON()).includes('체험 주소에 있는 숲체원을 찾지 못했어요'));await act(async()=>root.unmount());}});
test('changing institutions asks before clearing guest notes and account changes clear the in-memory session',async()=>{const env=setup('?center=jangseong');const root=await mount();await act(async()=>root.root.findAllByType('textarea')[0].props.onChange({target:{value:'잎의 모양을 보았어요.'}}));assert.ok(env.events.has('beforeunload'));
 await act(async()=>button(root,'숲체원 바꾸기').props.onClick());await act(async()=>root.root.findByType('select').props.onChange({target:{value:'other'}}));env.cancel();await act(async()=>button(root,'이 숲체원에서 시작하기').props.onClick());assert.equal(root.root.findAllByType('textarea').length,0); // remains in chooser when canceled
 env.confirm();await act(async()=>button(root,'이 숲체원에서 시작하기').props.onClick());assert.equal(root.root.findAllByType('textarea')[0].props.value,'');assert.ok(!JSON.stringify(root.toJSON()).includes('숙소동1 부근 난간 근처'));assert.ok(!JSON.stringify(root.toJSON()).includes('숙소동2에서 숲누림길로 올라가는 시작점'));await act(async()=>root.root.findAllByType('textarea')[0].props.onChange({target:{value:'다른 기관의 메모'}}));await act(async()=>env.auth({uid:'account-b'}));assert.equal(root.root.findAllByType('textarea')[0].props.value,'');assert.equal(env.events.has('beforeunload'),false);assert.ok(JSON.stringify(root.toJSON()).includes('로그인 또는 로그아웃해서'));await act(async()=>root.unmount());});

test('visitor notes survive going to the signed-in-only photo flow and returning',async()=>{setup('?center=jangseong');const root=await mount();await act(async()=>root.root.findAllByType('textarea')[0].props.onChange({target:{value:'사진 기록으로 이동하기 전 메모'}}));await act(async()=>button(root,'식물 찾기').props.onClick());assert.equal(root.root.findAllByProps({type:'password'}).length,0);assert.ok(root.root.findByProps({'aria-label':'로그인 전 발견 보관'}));await act(async()=>button(root,'돌아가서 더 살펴보기').props.onClick());assert.equal(root.root.findAllByType('textarea')[0].props.value,'사진 기록으로 이동하기 전 메모');await act(async()=>root.unmount());});

test('photo form preserves existing photos after failure, analyzes only the cover, and saves the whole album',async()=>{
 const env=setup('?center=jangseong');globalThis.indexedDB=new IDBFactory();let stored=[],sent=[];
 globalThis.__runtime.repo={list:async()=>stored,add:async(_uid,value)=>stored.push(value)};
 globalThis.__runtime.identifyEndpoint='https://identify.test/identify';globalThis.__runtime.token=async()=>'test-token';
 const oldFetch=globalThis.fetch;globalThis.fetch=async(_url,options)=>{sent.push(JSON.parse(options.body));return {ok:true,json:async()=>({provider:'plantnet',candidates:[{scientificName:'Quercus aliena',commonName:'갈참나무',score:.8,images:[]}]})};};
 const photo=n=>'data:image/jpeg;base64,'+Buffer.from([255,216,n,255,217]).toString('base64');
 window.plantPhotoFlow={preparePhoto:async file=>{if(file.bad)throw new Error('사진을 열지 못했어요.');return {dataUrl:photo(file.n)};},createLatestTask:()=>({cancel(){},begin(){return {signal:new AbortController().signal,isCurrent:()=>true};}})};
 let root;try{root=await mount();await act(async()=>env.auth({uid:'album-user',email:'album@example.test'}));await act(async()=>button(root,'식물 찾기').props.onClick());
 for(let i=0;i<4;i++)await act(async()=>new Promise(resolve=>setTimeout(resolve,15)));
 const album=()=>root.root.findByProps({'aria-label':'계정 앨범 사진 선택'});
 const choose=files=>album().props.onChange({target:{files,value:''}});
 const gallery=()=>root.root.findByProps({'aria-label':'저장할 사진 목록'});
 assert.equal(album().props.multiple,true);
 const optional=root.root.findAllByType('details').find(d=>label(d.findAllByType('summary')[0].props.children)==='메모·위치 추가하기 · 선택');
 assert.ok(optional);assert.ok(!optional.props.open,'optional fields start collapsed');
 assert.ok(optional.findAllByType('textarea').some(t=>t.props.maxLength===1000));
 assert.equal(consentInput().props.checked,false);
 function consentInput(){return root.root.findAllByProps({type:'checkbox'}).find(c=>c.props.className?.includes('shrink-0'));}
 const aiSection=root.root.findByProps({'aria-label':'AI가 알려주는 식물'});
 assert.ok(aiSection.findAllByType('p').some(p=>label(p.props.children).includes('대표사진 1장을 앱 서버와 Pl@ntNet에 보내요')),'photo transmission is visible before consent');

 await act(async()=>choose([{n:1},{n:2}]));assert.equal(gallery().findAllByType('img').length,2);
 await act(async()=>choose([{bad:true}]));assert.equal(gallery().findAllByType('img').length,2);
 await act(async()=>choose([{n:3}]));assert.equal(gallery().findAllByType('img').length,3);
 await act(async()=>choose([{n:4}]));assert.equal(gallery().findAllByType('img').length,3);
 await act(async()=>root.root.findByProps({'aria-label':'2번 사진을 대표사진으로'}).props.onClick());assert.equal(gallery().findAllByType('img')[0].props.src,photo(2));
 const consent=()=>root.root.findAllByProps({type:'checkbox'}).find(c=>c.props.className?.includes('shrink-0'));
 await act(async()=>consent().props.onChange({target:{checked:true}}));await act(async()=>button(root,'사진으로 이름 찾기').props.onClick());
 const candidateDetails=root.root.findByProps({className:'candidate-details'});assert.ok(!candidateDetails.props.open);assert.ok(label(candidateDetails.props.children).includes('Quercus aliena'));assert.ok(root.root.findAllByType('h4').some(h=>label(h.props.children)==='어떤 식물과 닮았나요?'));
 assert.equal(sent.length,1);assert.equal(sent[0].imageData,photo(2));assert.equal(sent[0].additionalImages,undefined);
 await act(async()=>root.root.findAllByType('button').find(b=>b.props.className?.includes('candidate-select')).props.onClick());
 assert.ok(button(root,'이 이름으로 기록 작성하기'));await act(async()=>button(root,'이 이름으로 기록 작성하기').props.onClick());assert.equal(stored.length,0);
 await act(async()=>root.root.findByProps({'aria-label':'3번 사진 빼기'}).props.onClick());assert.equal(gallery().findAllByType('img').length,2);
 assert.ok(button(root,'살펴보는 방법 보기'));
 await act(async()=>root.root.findByProps({'aria-label':'2번 사진을 대표사진으로'}).props.onClick());assert.equal(button(root,'살펴보는 방법 보기'),undefined);assert.equal(consent().props.checked,false);
 assert.equal(button(root,'이 이름으로 기록 작성하기'),undefined);assert.equal(button(root,'직접 이름 적기'),undefined);
 await act(async()=>root.root.findAllByType('input').find(i=>i.props.placeholder==='이름 모름으로 저장할 수 있습니다').props.onChange({target:{value:'갈참나무'}}));
 await act(async()=>root.root.findByType('form').props.onSubmit({preventDefault(){}}));
 assert.equal(stored.length,1);assert.equal(stored[0].imageData,photo(1));assert.deepEqual(stored[0].additionalImages,[photo(2)]);
 assert.equal(stored[0].aiSelection,undefined);
 }finally{if(root)await act(async()=>root.unmount());globalThis.fetch=oldFetch;}
});

test('real photo form keeps the photo while opening a guide, copies notes explicitly and saves only on submit',async()=>{
 const env=setup('?center=jangseong');globalThis.indexedDB=new IDBFactory();let stored=[];
 globalThis.__runtime.repo={list:async()=>stored,add:async(_uid,value)=>{stored.push(value);}};
 globalThis.__runtime.identifyEndpoint='https://identify.test/identify';globalThis.__runtime.token=async()=>'test-token';
 const oldFetch=globalThis.fetch;globalThis.fetch=async()=>({ok:true,json:async()=>({provider:'plantnet',candidates:[{scientificName:'Quercus aliena',commonName:'갈참나무',score:0.8,images:[]}]})});
 window.plantPhotoFlow={preparePhoto:async()=>({}),createLatestTask:()=>({cancel(){},begin(){return {signal:new AbortController().signal,isCurrent:()=>true};}})};
 let root;try{
 root=await mount();await act(async()=>env.auth({uid:'photo-user',email:'photo@example.test'}));
 await act(async()=>button(root,'식물 찾기').props.onClick());
 for(let i=0;i<4;i++)await act(async()=>{await new Promise(resolve=>setTimeout(resolve,15));});
 const album=root.root.findByProps({'aria-label':'계정 앨범 사진 선택'});
 await act(async()=>album.props.onChange({target:{files:[{}],value:''}}));
 const consent=root.root.findAllByProps({type:'checkbox'}).find(c=>c.props.onChange);
 await act(async()=>consent.props.onChange({target:{checked:true}}));
 await act(async()=>button(root,'사진으로 이름 찾기').props.onClick());
 const candidate=root.root.findAllByType('button').find(b=>b.props.className?.includes('candidate-select'));
 await act(async()=>candidate.props.onClick());assert.equal(stored.length,0);
 await act(async()=>button(root,'살펴보는 방법 보기').props.onClick());
 const guide=root.root.findByProps({'aria-label':'갈참나무 살펴보기 안내'});
 assert.equal(guide.findByType('input').props.checked,false);
 await act(async()=>guide.findByType('textarea').props.onChange({target:{value:'잎 뒷면이 밝았어요.'}}));
 const memo=()=>root.root.findByType('form').findAllByType('textarea').find(t=>t.props.maxLength===1000);
 assert.equal(memo().props.value,'');assert.equal(stored.length,0);
 await act(async()=>memo().props.onChange({target:{value:'먼저 쓴 사진 메모'}}));env.cancel();
 await act(async()=>button(root,'이 글을 사진 기록에 넣기').props.onClick());assert.equal(memo().props.value,'먼저 쓴 사진 메모');env.confirm();
 await act(async()=>button(root,'이 글을 사진 기록에 넣기').props.onClick());assert.equal(memo().props.value,'잎 뒷면이 밝았어요.');
 assert.ok(root.root.findAllByType('img').some(i=>i.props.src==='data:image/jpeg;base64,/9j/AP/Z'));
 assert.equal(guide.findByType('input').props.checked,false);
 await act(async()=>root.root.findByType('form').props.onSubmit({preventDefault(){}}));
 assert.equal(stored.length,1);assert.equal(stored[0].description,'잎 뒷면이 밝았어요.');assert.equal(stored[0].aiSelection.scientificName,'Quercus aliena');
 await act(async()=>button(root,'숲 둘러보기').props.onClick());
 assert.equal(root.root.findAllByType('textarea')[1].props.value,'잎 뒷면이 밝았어요.');
 assert.equal(root.root.findAllByProps({type:'checkbox'})[1].props.checked,false);
 await act(async()=>env.auth({uid:'another-user'}));assert.equal(root.root.findAllByType('textarea')[1].props.value,'');
 }finally{if(root)await act(async()=>root.unmount());globalThis.fetch=oldFetch;}
});

test('reaction-only guest records require an explicit handoff before either login entry, and returning resets approval',async()=>{
 setup('?center=jangseong');let root;try{
  root=await mount();await act(async()=>root.root.findAllByProps({className:'visit-reactions'})[0].findAllByType('button')[2].props.onClick());
  await act(async()=>button(root,'내 도감').props.onClick());assert.equal(root.root.findAllByProps({type:'password'}).length,0);
  let handoff=root.root.findByProps({'aria-label':'로그인 전 발견 보관'});assert.ok(JSON.stringify(handoff.toJSON?.()||root.toJSON()).includes('구별하기 어려워요'));
  assert.equal(button(root,'로그인 화면으로 계속하기').props.disabled,true);
  await act(async()=>button(root,'식물 찾기').props.onClick());assert.equal(root.root.findAllByProps({type:'password'}).length,0);
  await act(async()=>handoff.findByProps({type:'checkbox'}).props.onChange({target:{checked:true}}));
  await act(async()=>button(root,'로그인 화면으로 계속하기').props.onClick());assert.equal(root.root.findAllByProps({type:'password'}).length,1);
  await act(async()=>button(root,'숲 둘러보기').props.onClick());assert.equal(root.root.findAllByProps({className:'visit-reactions'})[0].findAllByType('button')[2].props['aria-pressed'],true);
  await act(async()=>button(root,'식물 찾기').props.onClick());handoff=root.root.findByProps({'aria-label':'로그인 전 발견 보관'});assert.equal(handoff.findByProps({type:'checkbox'}).props.checked,false);assert.equal(button(root,'로그인 화면으로 계속하기').props.disabled,true);
 }finally{if(root)await act(async()=>root.unmount());}
});
test('failed login keeps guest discoveries, while a real account change clears them and removes the handoff',async()=>{
 const env=setup('?center=jangseong');globalThis.indexedDB=new IDBFactory();let attempts=0;
 globalThis.__runtime.login=async()=>{attempts++;throw new Error('로그인에 실패했어요.');};globalThis.__runtime.repo={list:async()=>[]};
 let root;try{
  root=await mount();await act(async()=>root.root.findAllByType('textarea')[0].props.onChange({target:{value:'로그인 전 내 기록'}}));await act(async()=>button(root,'식물 찾기').props.onClick());
  const box=root.root.findByProps({'aria-label':'로그인 전 발견 보관'}).findByProps({type:'checkbox'});
  await act(async()=>box.props.onChange({target:{checked:true}}));await act(async()=>button(root,'로그인 화면으로 계속하기').props.onClick());
  await act(async()=>root.root.findByProps({type:'email'}).props.onChange({target:{value:'visitor@example.test'}}));await act(async()=>root.root.findByProps({type:'password'}).props.onChange({target:{value:'test-password'}}));
  await act(async()=>root.root.findByType('form').props.onSubmit({preventDefault(){}}));assert.equal(attempts,1);
  await act(async()=>button(root,'숲 둘러보기').props.onClick());assert.equal(root.root.findAllByType('textarea')[0].props.value,'로그인 전 내 기록');
  await act(async()=>button(root,'내 도감').props.onClick());assert.ok(root.root.findByProps({'aria-label':'로그인 전 발견 보관'}));
  await act(async()=>env.auth({uid:'new-account',email:'new@example.test'}));assert.equal(root.root.findAllByProps({'aria-label':'로그인 전 발견 보관'}).length,0);
  await act(async()=>button(root,'숲 둘러보기').props.onClick());assert.equal(root.root.findAllByType('textarea')[0].props.value,'');assert.equal(env.events.has('beforeunload'),false);
 }finally{if(root)await act(async()=>root.unmount());}
});

test('successful candidates can lead to name editing or unknown recording without saving or losing photos',async()=>{
 const env=setup('?center=jangseong');globalThis.indexedDB=new IDBFactory();let stored=[],focus=0,scroll=0;
 globalThis.__runtime.repo={list:async()=>stored,add:async(_uid,row)=>stored.push(row)};
 globalThis.__runtime.identifyEndpoint='https://identify.test/identify';globalThis.__runtime.token=async()=>'test-token';
 const oldFetch=globalThis.fetch;globalThis.fetch=async()=>({ok:true,json:async()=>({provider:'plantnet',candidates:[{scientificName:'Quercus aliena',commonName:'갈참나무',score:.8,images:[]}]})});
 const photo=n=>'data:image/jpeg;base64,'+Buffer.from([255,216,n,255,217]).toString('base64');
 window.plantPhotoFlow={preparePhoto:async file=>({dataUrl:photo(file.n)}),createLatestTask:()=>({cancel(){},begin(){return {signal:new AbortController().signal,isCurrent:()=>true};}})};
 const node=element=>({focus(){if(element.props.placeholder==='이름 모름으로 저장할 수 있습니다')focus++;},scrollIntoView(){scroll++;}});
 let root;try{
  await act(async()=>{root=create(React.createElement(App),{createNodeMock:node});await new Promise(r=>setImmediate(r));});
  await act(async()=>env.auth({uid:'successful-candidate-owner',email:'owner@example.test'}));await act(async()=>button(root,'식물 찾기').props.onClick());
  for(let i=0;i<4;i++)await act(async()=>new Promise(r=>setTimeout(r,15)));
  await act(async()=>root.root.findByProps({'aria-label':'계정 앨범 사진 선택'}).props.onChange({target:{files:[{n:1},{n:2}],value:''}}));
  const form=()=>root.root.findByType('form'),name=()=>form().findAllByType('input').find(i=>i.props.placeholder==='이름 모름으로 저장할 수 있습니다'),memo=()=>form().findAllByType('textarea').find(t=>t.props.maxLength===1000);
  await act(async()=>memo().props.onChange({target:{value:'난간 옆에서 발견'}}));
  await act(async()=>root.root.findAllByProps({type:'checkbox'}).find(c=>c.props.className?.includes('shrink-0')).props.onChange({target:{checked:true}}));
  await act(async()=>button(root,'사진으로 이름 찾기').props.onClick());
  assert.equal(button(root,'이 이름으로 기록 작성하기'),undefined);assert.ok(button(root,'이름 모름으로 기록하기'));
  await act(async()=>button(root,'직접 이름 적기').props.onClick());assert.equal(focus,1);assert.equal(scroll,1);assert.equal(name().props.value,'');assert.equal(stored.length,0);
  await act(async()=>root.root.findAllByType('button').find(b=>b.props.className?.includes('candidate-select')).props.onClick());
  await act(async()=>button(root,'이 이름으로 기록 작성하기').props.onClick());assert.equal(focus,2);assert.equal(stored.length,0);assert.equal(name().props.value,'갈참나무');assert.ok(JSON.stringify(root.toJSON()).includes('아직 내 도감에 저장되지 않았어요'));
  env.cancel();await act(async()=>button(root,'이름 모름으로 기록하기').props.onClick());assert.equal(name().props.value,'갈참나무');
  env.confirm();await act(async()=>button(root,'이름 모름으로 기록하기').props.onClick());assert.equal(name().props.value,'이름 모름');assert.equal(memo().props.value,'난간 옆에서 발견');assert.equal(button(root,'이 이름으로 기록 작성하기'),undefined);assert.equal(stored.length,0);
  await act(async()=>form().props.onSubmit({preventDefault(){}}));assert.equal(stored.length,1);assert.equal(stored[0].name,'이름 모름');assert.equal(stored[0].description,'난간 옆에서 발견');assert.equal(stored[0].imageData,photo(1));assert.deepEqual(stored[0].additionalImages,[photo(2)]);assert.equal(stored[0].aiSelection,undefined);
 }finally{if(root)await act(async()=>root.unmount());globalThis.fetch=oldFetch;}
});

test('search recovery preserves photos and memo, requires consent for retry, and saves an unknown name only on submit',async()=>{
 const env=setup('?center=jangseong');globalThis.indexedDB=new IDBFactory();let stored=[],sent=[];
 globalThis.__runtime.repo={list:async()=>stored,add:async(_uid,value)=>stored.push(value)};globalThis.__runtime.identifyEndpoint='https://identify.test/identify';globalThis.__runtime.token=async()=>'test-token';
 const oldFetch=globalThis.fetch;globalThis.fetch=async(_url,options)=>{sent.push(JSON.parse(options.body));throw new TypeError('Failed to fetch PRIVATE_INTERNAL_DETAIL');};
 const photo=n=>'data:image/jpeg;base64,'+Buffer.from([255,216,n,255,217]).toString('base64');
 window.plantPhotoFlow={preparePhoto:async file=>({dataUrl:photo(file.n)}),createLatestTask:()=>({cancel(){},begin(){return {signal:new AbortController().signal,isCurrent:()=>true};}})};
 let root;try{
  root=await mount();await act(async()=>env.auth({uid:'recovery-user',email:'recovery@example.test'}));await act(async()=>button(root,'식물 찾기').props.onClick());for(let i=0;i<4;i++)await act(async()=>new Promise(resolve=>setTimeout(resolve,15)));
  await act(async()=>root.root.findByProps({'aria-label':'계정 앨범 사진 선택'}).props.onChange({target:{files:[{n:1},{n:2}],value:''}}));
  const form=()=>root.root.findByType('form'),name=()=>form().findAllByType('input').find(x=>x.props.maxLength===80),memo=()=>form().findAllByType('textarea').find(t=>t.props.maxLength===1000),consent=()=>form().findAllByProps({type:'checkbox'})[0];
  await act(async()=>name().props.onChange({target:{value:'내가 적은 이름'}}));await act(async()=>memo().props.onChange({target:{value:'사진 검색 전에 남긴 글'}}));
  await act(async()=>consent().props.onChange({target:{checked:true}}));await act(async()=>button(root,'사진으로 이름 찾기').props.onClick());assert.equal(sent.length,1);assert.ok(JSON.stringify(root.toJSON()).includes('사진 검색에 연결하지 못했어요'));assert.ok(!JSON.stringify(root.toJSON()).includes('PRIVATE_INTERNAL_DETAIL'));assert.equal(stored.length,0);
  await act(async()=>consent().props.onChange({target:{checked:false}}));assert.equal(button(root,'다시 이름 찾기').props.disabled,true);await act(async()=>button(root,'다시 이름 찾기').props.onClick());assert.equal(sent.length,1);
  await act(async()=>consent().props.onChange({target:{checked:true}}));await act(async()=>button(root,'다시 이름 찾기').props.onClick());assert.equal(sent.length,2);assert.equal(sent[0].requestId,sent[1].requestId);assert.deepEqual(Object.keys(sent[1]).sort(),['imageData','requestId']);assert.equal(sent[1].imageData,photo(1));
  env.cancel();await act(async()=>button(root,'이름 모름으로 기록하기').props.onClick());assert.equal(name().props.value,'내가 적은 이름');env.confirm();await act(async()=>button(root,'이름 모름으로 기록하기').props.onClick());assert.equal(name().props.value,'이름 모름');assert.equal(memo().props.value,'사진 검색 전에 남긴 글');assert.equal(stored.length,0);
  await act(async()=>form().props.onSubmit({preventDefault(){}}));assert.equal(stored.length,1);assert.equal(stored[0].name,'이름 모름');assert.equal(stored[0].description,'사진 검색 전에 남긴 글');assert.equal(stored[0].imageData,photo(1));assert.deepEqual(stored[0].additionalImages,[photo(2)]);assert.equal(stored[0].aiSelection,undefined);
 }finally{if(root)await act(async()=>root.unmount());globalThis.fetch=oldFetch;}
});

test('an unnamed record opens its stored photo, changes name only on explicit save and leaves the filtered list',async()=>{
 const env=setup('?center=jangseong');globalThis.indexedDB=new IDBFactory();let writes=0,photoReads=0,listFailed=false;
 const image='data:image/jpeg;base64,/9j/Af/Z';let row={id:'unnamed-record',name:'이름 모름',centerId:'jangseong',centerName:'국립장성숲체원',revision:1,createdAt:1,updatedAt:1,description:'난간 근처에서 본 잎',location:null};
 globalThis.__runtime.repo={list:async()=>{if(listFailed)throw new Error('목록을 불러오지 못했어요.');return[row];},photos:async()=>{photoReads++;return[image];},edit:async(_uid,old,patch)=>{writes++;assert.equal(old.id,row.id);assert.deepEqual(Object.keys(patch).sort(),['centerId','centerName','description','name']);row={...row,...patch,revision:row.revision+1};}};
 const previousDocument=globalThis.document;globalThis.document={activeElement:null,body:{style:{}},getElementById:()=>null,addEventListener(){},removeEventListener(){}};
 let root;const node=()=>({focus(){},querySelectorAll:()=>[],setAttribute(){},removeAttribute(){},contains:()=>true});
 try{
  await act(async()=>{root=create(React.createElement(App),{createNodeMock:node});await new Promise(resolve=>setImmediate(resolve));});await act(async()=>env.auth({uid:'name-owner',email:'name@example.test'}));await act(async()=>button(root,'내 도감').props.onClick());for(let i=0;i<4;i++)await act(async()=>new Promise(resolve=>setTimeout(resolve,15)));
  const unknown=()=>root.root.findByProps({'aria-label':'내 도감 기록 고르기'}).findAllByType('button')[1];await act(async()=>unknown().props.onClick());assert.equal(photoReads,0);assert.equal(writes,0);
  await act(async()=>root.root.findByProps({className:'observation-row'}).props.onClick({currentTarget:node()}));assert.equal(photoReads,1);assert.ok(root.root.findAllByType('img').some(i=>i.props.src===image));await act(async()=>button(root,'이름 적기').props.onClick());assert.equal(root.root.findByProps({role:'dialog'}).props['aria-label'],'식물 이름 적기');
  const editInput=()=>root.root.findByProps({role:'dialog'}).findAllByType('input').find(i=>i.props.maxLength===80);await act(async()=>editInput().props.onChange({target:{value:'편백나무'}}));assert.equal(writes,0);await act(async()=>button(root,'취소').props.onClick());assert.equal(writes,0);assert.equal(row.name,'이름 모름');
  await act(async()=>root.root.findByProps({className:'observation-row'}).props.onClick({currentTarget:node()}));await act(async()=>button(root,'이름 적기').props.onClick());await act(async()=>editInput().props.onChange({target:{value:'편백나무'}}));
  await act(async()=>root.root.findByProps({role:'dialog'}).findByType('form').props.onSubmit({preventDefault(){}}));assert.equal(writes,1);assert.equal(row.description,'난간 근처에서 본 잎');assert.equal(row.name,'편백나무');assert.equal(unknown().props['aria-pressed'],true);assert.equal(root.root.findAllByProps({className:'observation-row'}).length,0);assert.ok(JSON.stringify(root.toJSON()).includes('이름 모름으로 남긴 기록이 없어요'));
  await act(async()=>button(root,'전체 기록 보기').props.onClick());assert.ok(JSON.stringify(root.toJSON()).includes('편백나무'));
  // A failed refresh leaves this owner's previous data visible but unavailable for editing.
  listFailed=true;await act(async()=>button(root,'내 기록 다시 불러오기').props.onClick());assert.equal(root.root.findByProps({className:'observation-row'}).props.disabled,true);
  await act(async()=>env.auth({uid:'different-owner',email:'other@example.test'}));assert.equal(root.root.findAllByProps({className:'observation-row'}).length,0);
 }finally{if(root)await act(async()=>root.unmount());globalThis.document=previousDocument;}
});
