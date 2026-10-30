import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import React from 'react';
import {create,act} from 'react-test-renderer';
import {build} from 'esbuild';
const out=new URL(`.routing-test-viewer-${process.pid}.mjs`,import.meta.url);
const rootPath=fileURLToPath(new URL('../',import.meta.url));
const b=await build({absWorkingDir:rootPath,stdin:{contents:"export {default as Tree} from './src/TreePhotos.jsx';export {default as Place} from './src/PlaceGuidePhoto.jsx';",resolveDir:rootPath,loader:'jsx'},bundle:true,platform:'node',format:'esm',write:false,external:['react']});await fs.writeFile(out,b.outputFiles[0].text);let Tree,Place;try{({Tree,Place}=await import(out.href));}finally{await fs.unlink(out);}
const label=v=>typeof v==='string'?v:Array.isArray(v)?v.map(label).join(''):v?.props?label(v.props.children):'';
const button=(root,text)=>root.root.findAllByType('button').find(x=>label(x.props.children)===text);
function environment(){
 const oldWindow=globalThis.window,oldDocument=globalThis.document,events=new Map(),keys=new Map(),stack=[null];let position=0,backs=0,pending=false,focus=0;
 const opener={isConnected:true,closest:()=>null,focus(){focus++;}};
 globalThis.window={history:{get state(){return stack[position];},pushState(value){stack.splice(position+1);stack.push(value);position++;},replaceState(value){stack[position]=value;},back(){backs++;pending=true;}},addEventListener:(n,fn)=>events.set(n,fn),removeEventListener:(n,fn)=>{if(events.get(n)===fn)events.delete(n);}};
 globalThis.document={activeElement:opener,body:{style:{overflow:'auto'}},addEventListener:(n,fn)=>keys.set(n,fn),removeEventListener:(n,fn)=>{if(keys.get(n)===fn)keys.delete(n);}};
 return {opener,keys,stack,get backs(){return backs;},get position(){return position;},get focus(){return focus;},node:()=>({querySelectorAll:()=>[],focus(){},contains:()=>true}),pop(){assert.ok(pending);pending=false;position--;events.get('popstate')?.({state:stack[position]});},restore(){globalThis.window=oldWindow;globalThis.document=oldDocument;}};
}
const photos=[{src:'/leaf.jpg',label:'잎',alt:'편백나무 잎',credit:'기관 사진'},{src:'/whole.jpg',label:'전체 모습',alt:'편백나무 전체',credit:'기관 사진'}];
test('tree photos stay inside the app; switching photos uses one history entry and phone Back preserves notes',async()=>{
 const env=environment();let root;
 function Harness(){const[note,setNote]=React.useState('작성 중인 글');return React.createElement('main',null,React.createElement('textarea',{value:note,onChange:e=>setNote(e.target.value)}),React.createElement(Tree,{centerId:'jangseong',tree:{id:'hinoki',name:'편백나무',photos}}));}
 try{
  await act(async()=>root=create(React.createElement(Harness),{createNodeMock:env.node}));assert.equal(root.root.findAllByType('a').length,0);
  await act(async()=>root.root.findByProps({'aria-label':'편백나무 잎 크게 보기'}).props.onClick({currentTarget:env.opener}));assert.equal(env.position,1);assert.equal(root.root.findByProps({role:'dialog'}).props['aria-label'],'편백나무 크게 보기');assert.equal(document.body.style.overflow,'hidden');
  await act(async()=>button(root,'다음 사진').props.onClick());assert.equal(root.root.findByProps({className:'photo-viewer-image'}).props.src,'/whole.jpg');assert.equal(env.position,1);assert.equal(env.stack.length,2);
  await act(async()=>{window.history.back();env.pop();});assert.equal(root.root.findAllByProps({role:'dialog'}).length,0);assert.equal(root.root.findByType('textarea').props.value,'작성 중인 글');assert.equal(env.position,0);assert.equal(document.body.style.overflow,'auto');assert.ok(env.focus>0);
  await act(async()=>root.root.findByProps({'aria-label':'편백나무 전체 모습 크게 보기'}).props.onClick({currentTarget:env.opener}));assert.equal(env.position,1);
  await act(async()=>button(root,'닫기').props.onClick());assert.equal(button(root,'닫는 중…').props.disabled,true);await act(async()=>env.pop());assert.equal(root.root.findAllByProps({role:'dialog'}).length,0);assert.equal(env.position,0);
 }finally{if(root)await act(async()=>root.unmount());env.restore();}
});
test('place photos support Escape and an image error keeps closing available',async()=>{
 const env=environment();let root;try{
  await act(async()=>root=create(React.createElement(Place,{centerId:'jangseong',label:'장소',resolve:()=>({src:'/place-guides/test.jpg',alt:'난간',caption:'난간 근처',credit:'기관 사진'})}),{createNodeMock:env.node}));
  await act(async()=>root.root.findByProps({'aria-label':'장소 사진 크게 보기'}).props.onClick({currentTarget:env.opener}));assert.equal(root.root.findAllByType('a').length,0);
  await act(async()=>root.root.findByProps({className:'photo-viewer-image'}).props.onError());assert.ok(root.root.findByProps({role:'alert'}));assert.ok(button(root,'닫기'));
  await act(async()=>env.keys.get('keydown')({key:'Escape',preventDefault(){}}));assert.equal(env.backs,1);await act(async()=>env.pop());assert.equal(root.root.findAllByProps({role:'dialog'}).length,0);assert.equal(document.body.style.overflow,'auto');
 }finally{if(root)await act(async()=>root.unmount());env.restore();}
});
