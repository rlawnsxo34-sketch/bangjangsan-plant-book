import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import React from 'react';
import {create,act} from 'react-test-renderer';
import {build} from 'esbuild';
const out=new URL(`.tree-map-test-${process.pid}.mjs`,import.meta.url);
const result=await build({absWorkingDir:fileURLToPath(new URL('../',import.meta.url)),entryPoints:['src/TreeMapPanel.jsx'],bundle:true,platform:'node',format:'esm',write:false,external:['react'],plugins:[{name:'mock',setup(b){b.onLoad({filter:/[\\/]cloud-runtime\.js$/},()=>({contents:'export const getRuntime=()=>globalThis.__mapRuntime;',loader:'js'}));}}]});
await fs.writeFile(out,result.outputFiles[0].text);let Panel;try{({default:Panel}=await import(out.href));}finally{await fs.unlink(out);}
const center={id:'jangseong',name:'국립장성숲체원'},noop=()=>{};
function label(x){return typeof x==='string'?x:Array.isArray(x)?x.map(label).join(''):x?.props?label(x.props.children):'';}
const button=(root,name)=>root.root.findAllByType('button').find(b=>label(b.props.children)===name);
function Canvas({onPick,onSelect,editable}){return React.createElement('div',null,React.createElement('button',{onClick:()=>onSelect('japanese-maple')},'단풍 표시 선택'),React.createElement('button',{disabled:!editable,onClick:()=>onPick({lat:35,lng:126})},'선택할 지도 지점'));}
async function setup({reviewer=true,save=async(_uid,_c,id,value,revision)=>({id,...value,revision:revision+1})}={}){
 let subscriber;globalThis.requestAnimationFrame=fn=>fn();globalThis.window={confirm:()=>true};
 globalThis.__mapRuntime={subscribe:fn=>{subscriber=fn;fn(reviewer?{uid:'reviewer'}:null);return noop;},sharing:{grants:async()=>reviewer?['jangseong']:[]},places:{list:async()=>[],save}};
 let root;await act(async()=>root=create(React.createElement(Panel,{center,onState:noop,onBack:noop,Canvas,apiKey:'test-key'})));return {root,auth:value=>subscriber(value)};
}
test('reviewer selects a point, explicitly confirms publication, and changing the point clears consent',async()=>{
 let calls=0,args;const {root}=await setup({save:async(...a)=>{calls++;args=a;return {id:a[2],...a[3],revision:1};}});
 await act(async()=>button(root,'지도에서 나무 위치 고르기').props.onClick());assert.equal(calls,0);assert.equal(button(root,'이 위치 공개하기').props.disabled,true);
 await act(async()=>button(root,'선택할 지도 지점').props.onClick());const consent=()=>root.root.findByProps({type:'checkbox'});assert.equal(consent().props.checked,false);
 await act(async()=>consent().props.onChange({target:{checked:true}}));await act(async()=>button(root,'선택할 지도 지점').props.onClick());assert.equal(consent().props.checked,false);
 await act(async()=>consent().props.onChange({target:{checked:true}}));await act(async()=>root.root.findByProps({'aria-label':'공개 나무 위치 선택'}).props.onSubmit({preventDefault(){}}));assert.equal(calls,1);assert.deepEqual(args[3].coordinates,{lat:35,lng:126});assert.equal(args[4],0);assert.ok(JSON.stringify(root.toJSON()).includes('위치를 공개했어요'));await act(async()=>root.unmount());
});
test('visitors can choose tree details but cannot edit, and late saves cannot update a changed account',async()=>{
 let env=await setup({reviewer:false});assert.equal(button(env.root,'지도에서 나무 위치 고르기'),undefined);await act(async()=>button(env.root,'지도 열기').props.onClick());await act(async()=>button(env.root,'단풍 표시 선택').props.onClick());assert.ok(JSON.stringify(env.root.toJSON()).includes('숙소동2에서 숲누림길'));await act(async()=>env.root.unmount());
 let finish;env=await setup({save:()=>new Promise(r=>finish=r)});const root=env.root;
 await act(async()=>button(root,'지도에서 나무 위치 고르기').props.onClick());await act(async()=>button(root,'선택할 지도 지점').props.onClick());await act(async()=>root.root.findByProps({type:'checkbox'}).props.onChange({target:{checked:true}}));
 await act(async()=>{root.root.findByProps({'aria-label':'공개 나무 위치 선택'}).props.onSubmit({preventDefault(){}});});await act(async()=>env.auth(null));await act(async()=>finish({id:'hinoki',label:'late',coordinates:{lat:35,lng:126},revision:1}));assert.equal(button(root,'이 위치 공개하기'),undefined);assert.ok(!JSON.stringify(root.toJSON()).includes('위치를 공개했어요'));await act(async()=>root.unmount());
});
