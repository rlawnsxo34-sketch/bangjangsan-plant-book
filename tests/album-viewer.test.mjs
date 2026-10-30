import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import React from 'react';
import {create,act} from 'react-test-renderer';
import {build} from 'esbuild';
const out=new URL(`.routing-test-album-${process.pid}.mjs`,import.meta.url),dir=fileURLToPath(new URL('../',import.meta.url));
const built=await build({absWorkingDir:dir,stdin:{contents:"export {default as Saved} from './src/RecordPhotos.jsx';export {default as Shared} from './src/SharedPhotos.jsx';export {default as Dialog} from './src/dialog.jsx';",resolveDir:dir,loader:'jsx'},bundle:true,platform:'node',format:'esm',write:false,external:['react']});await fs.writeFile(out,built.outputFiles[0].text);let Saved,Shared,Dialog;try{({Saved,Shared,Dialog}=await import(out.href));}finally{await fs.unlink(out);}
const label=v=>typeof v==='string'?v:Array.isArray(v)?v.map(label).join(''):v?.props?label(v.props.children):'';
const button=(root,text)=>root.root.findAllByType('button').find(x=>label(x.props.children)===text);
const image=n=>'data:image/jpeg;base64,'+Buffer.from([255,216,n,255,217]).toString('base64');
function environment(){
 const oldWindow=globalThis.window,oldDocument=globalThis.document,keys=new Map(),events=new Set(),stack=[null];let pos=0,backs=0;
 const opener={isConnected:true,closest:()=>null,focus(){}};
 globalThis.window={history:{get state(){return stack[pos];},pushState(v){stack.splice(pos+1);stack.push(v);pos++;},replaceState(v){stack[pos]=v;},back(){backs++;}},addEventListener:(type,fn)=>events.add(fn),removeEventListener:(type,fn)=>events.delete(fn)};
 globalThis.document={activeElement:opener,body:{style:{overflow:'auto'}},addEventListener:(n,fn)=>{if(!keys.has(n))keys.set(n,new Set());keys.get(n).add(fn);},removeEventListener:(n,fn)=>keys.get(n)?.delete(fn)};
 return {opener,node:()=>({focus(){},querySelectorAll:()=>[],contains:()=>true}),get backs(){return backs;},get position(){return pos;},escape(){for(const fn of [...keys.get('keydown')||[]])fn({key:'Escape',preventDefault(){}});},pop(){pos--;for(const fn of [...events])fn({state:stack[pos]});},restore(){globalThis.window=oldWindow;globalThis.document=oldDocument;}};
}
test('saved album inside a detail dialog closes only the enlarged photo on Escape and leaves memo and scroll lock intact',async()=>{
 const env=environment();let root,parentClosed=0;
 function Harness(){const[open,setOpen]=React.useState(true);return open?React.createElement(Dialog,{label:'계정 기록 상세',onClose:()=>{parentClosed++;setOpen(false);}},React.createElement('textarea',{value:'저장한 관찰 글',readOnly:true}),React.createElement(Saved,{name:'갈참나무',photos:[image(1),image(2),image(3)]})):null;}
 try{
  await act(async()=>root=create(React.createElement(Harness),{createNodeMock:env.node}));
  await act(async()=>root.root.findByProps({'aria-label':'갈참나무 사진 2 크게 보기'}).props.onClick({currentTarget:env.opener}));assert.equal(root.root.findAllByProps({role:'dialog'}).length,2);assert.equal(root.root.findByProps({className:'photo-viewer-image'}).props.src,image(2));
  await act(async()=>button(root,'다음 사진').props.onClick());assert.equal(root.root.findByProps({className:'photo-viewer-image'}).props.src,image(3));assert.equal(env.position,1);
  await act(async()=>env.escape());assert.equal(parentClosed,0);assert.equal(env.backs,1);await act(async()=>env.pop());assert.equal(root.root.findAllByProps({role:'dialog'}).length,1);assert.equal(root.root.findByType('textarea').props.value,'저장한 관찰 글');assert.equal(document.body.style.overflow,'hidden');
  await act(async()=>env.escape());assert.equal(parentClosed,1);assert.equal(document.body.style.overflow,'auto');
 }finally{if(root)await act(async()=>root.unmount());env.restore();}
});
test('shared viewer uses only the published subset, supports phone Back, and closes immediately when its images change',async()=>{
 const env=environment();let root;const row={name:'편백나무',imageData:image(2),additionalImages:[image(3)]};
 try{
  await act(async()=>root=create(React.createElement(Shared,{row}),{createNodeMock:env.node}));
  await act(async()=>root.root.findByProps({'aria-label':'편백나무 공유 사진 1 크게 보기'}).props.onClick({currentTarget:env.opener}));await act(async()=>button(root,'다음 사진').props.onClick());assert.equal(root.root.findByProps({className:'photo-viewer-image'}).props.src,image(3));assert.ok(!JSON.stringify(root.toJSON()).includes(image(1)));
  await act(async()=>{window.history.back();env.pop();});assert.equal(root.root.findAllByProps({role:'dialog'}).length,0);
  await act(async()=>root.root.findByProps({'aria-label':'편백나무 공유 사진 2 크게 보기'}).props.onClick({currentTarget:env.opener}));const backCount=env.backs;
  await act(async()=>root.update(React.createElement(Shared,{row:{name:'다른 나무',imageData:image(4)}})));assert.equal(root.root.findAllByProps({role:'dialog'}).length,0);assert.ok(!JSON.stringify(root.toJSON()).includes(image(3)));assert.equal(env.backs,backCount);
 }finally{if(root)await act(async()=>root.unmount());env.restore();}
});
test('editable photo lists retain the original cover/remove actions without adding preview buttons',async()=>{
 let root;await act(async()=>root=create(React.createElement(Saved,{photos:[image(1)],editable:true,name:'식물',onRemove(){}})));assert.equal(root.root.findAllByProps({className:'record-photo-preview'}).length,0);assert.equal(root.root.findAllByType('img').length,1);await act(async()=>root.unmount());
});
