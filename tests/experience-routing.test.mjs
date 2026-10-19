import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import React from 'react';
import {create,act} from 'react-test-renderer';
import {build} from 'esbuild';
const output=new URL(`.routing-test-${process.pid}.mjs`,import.meta.url);
const runtimeFilter=/[\\/]cloud-runtime\.js$/;
// esbuild passes native paths to plugins, including backslashes on Windows.
assert.ok(runtimeFilter.test('C:\\Users\\김준태\\Documents\\GitHub\\bangjangsan-plant-book\\src\\cloud-runtime.js'));
assert.ok(runtimeFilter.test('/workspace/plant book/src/cloud-runtime.js'));
let runtimeMocked=false;
const built=await build({absWorkingDir:fileURLToPath(new URL('../',import.meta.url)),entryPoints:['src/CloudApp.jsx'],bundle:true,platform:'node',format:'esm',write:false,external:['react','@phosphor-icons/react'],plugins:[{name:'test-runtime',setup(b){b.onLoad({filter:runtimeFilter},()=>{runtimeMocked=true;return {contents:'export function getRuntime(){return globalThis.__runtime;} export async function smallPhoto(){throw new Error("not used");}',loader:'js'};});}}]});
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
test('valid active institution entry goes directly to a visitor experience without requiring login',async()=>{setup('?center=jangseong&view=explore');const root=await mount();assert.equal(root.root.findAllByType('textarea').length,3);assert.ok(JSON.stringify(root.toJSON()).includes('로그인 없이 나무를 살펴봐요'));assert.equal(root.root.findAllByProps({type:'password'}).length,0);assert.equal(root.root.findByProps({'aria-label':'아래 메뉴'}).findAllByType('button').length,5);await act(async()=>root.unmount());});
test('unknown or inactive institution entries remain in the chooser',async()=>{for(const id of ['off','missing']){setup('?center='+id);const root=await mount();assert.equal(root.root.findAllByType('textarea').length,0);assert.ok(JSON.stringify(root.toJSON()).includes('체험 주소에 있는 숲체원을 찾지 못했어요'));await act(async()=>root.unmount());}});
test('changing institutions asks before clearing guest notes and account changes clear the in-memory session',async()=>{const env=setup('?center=jangseong');const root=await mount();await act(async()=>root.root.findAllByType('textarea')[0].props.onChange({target:{value:'잎의 모양을 보았어요.'}}));assert.ok(env.events.has('beforeunload'));
 await act(async()=>button(root,'숲체원 바꾸기').props.onClick());await act(async()=>root.root.findByType('select').props.onChange({target:{value:'other'}}));env.cancel();await act(async()=>button(root,'이 숲체원에서 시작하기').props.onClick());assert.equal(root.root.findAllByType('textarea').length,0); // remains in chooser when canceled
 env.confirm();await act(async()=>button(root,'이 숲체원에서 시작하기').props.onClick());assert.equal(root.root.findAllByType('textarea')[0].props.value,'');await act(async()=>root.root.findAllByType('textarea')[0].props.onChange({target:{value:'다른 기관의 메모'}}));await act(async()=>env.auth({uid:'account-b'}));assert.equal(root.root.findAllByType('textarea')[0].props.value,'');assert.equal(env.events.has('beforeunload'),false);assert.ok(JSON.stringify(root.toJSON()).includes('로그인 또는 로그아웃해서'));await act(async()=>root.unmount());});

test('visitor notes survive going to the signed-in-only photo flow and returning',async()=>{setup('?center=jangseong');const root=await mount();await act(async()=>root.root.findAllByType('textarea')[0].props.onChange({target:{value:'사진 기록으로 이동하기 전 메모'}}));await act(async()=>button(root,'식물 찾기').props.onClick());assert.equal(root.root.findAllByProps({type:'password'}).length,1);await act(async()=>button(root,'숲 둘러보기').props.onClick());assert.equal(root.root.findAllByType('textarea')[0].props.value,'사진 기록으로 이동하기 전 메모');await act(async()=>root.unmount());});
