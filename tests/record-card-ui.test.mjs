import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {create,act} from 'react-test-renderer';
import React from 'react';
import {build} from 'esbuild';
import {newVisit,updateVisit} from '../src/experience-model.js';
const output=new URL(`.record-card-test-${process.pid}.mjs`,import.meta.url);
const bundle=await build({absWorkingDir:fileURLToPath(new URL('../',import.meta.url)),entryPoints:['src/RecordCardExport.jsx'],bundle:true,platform:'node',format:'esm',write:false,external:['react','@phosphor-icons/react']});await fs.writeFile(output,bundle.outputFiles[0].text);let Panel;try{({default:Panel}=await import(output.href));}finally{await fs.unlink(output);}
const label=v=>typeof v==='string'?v:Array.isArray(v)?v.map(label).join(''):v?.props?label(v.props.children):'';
const button=(root,t)=>root.root.findAllByType('button').find(b=>label(b.props.children).includes(t));
const visit=()=>updateVisit(newVisit('jangseong',1),'hinoki',{note:'새로운 발견'});
test('PNG is prepared only on demand, then preview and direct download are shown',async()=>{const previousCreate=URL.createObjectURL,previousRevoke=URL.revokeObjectURL;let calls=0;const revoked=[];URL.createObjectURL=()=> 'blob:card-preview';URL.revokeObjectURL=u=>revoked.push(u);let root;const busy=[],render=async()=>{calls++;return{blob:new Blob(['png']),truncated:true};},onBusy=b=>busy.push(b);try{await act(async()=>root=create(React.createElement(Panel,{visit:visit(),centerName:'장성',onBusy,render})));assert.equal(calls,0);await act(async()=>button(root,'오늘의 발견 카드 받기').props.onClick());assert.equal(calls,1);assert.equal(root.root.findAllByType('img').length,1);assert.equal(root.root.findAllByType('a').filter(x=>x.props.download).length,1);assert.ok(JSON.stringify(root.toJSON()).includes('일부만 담았어요'));assert.ok(busy.includes(true));await act(async()=>root.update(React.createElement(Panel,{visit:newVisit('jangseong',1),centerName:'장성',onBusy,render})));assert.equal(root.root.findAllByType('img').length,0);assert.equal(root.root.findAllByType('a').length,0);assert.equal(button(root,'오늘의 발견 카드 받기').props.disabled,true);assert.deepEqual(revoked,['blob:card-preview']);}finally{if(root)await act(async()=>root.unmount());URL.createObjectURL=previousCreate;URL.revokeObjectURL=previousRevoke;}});
test('a pending card can be canceled and never appears after account/session reset',async()=>{let finish,signal,root;const pending=new Promise(r=>finish=r),render=(_m,o)=>{signal=o.signal;return pending;},onBusy=()=>{};await act(async()=>root=create(React.createElement(Panel,{visit:visit(),centerName:'장성',onBusy,render})));await act(async()=>{button(root,'오늘의 발견 카드 받기').props.onClick();});assert.ok(button(root,'이미지 만들기 취소'));await act(async()=>root.update(React.createElement(Panel,{visit:newVisit('jangseong',1),centerName:'장성',onBusy,render})));assert.equal(signal.aborted,true);await act(async()=>{finish({blob:new Blob(['late'])});await pending;});assert.equal(root.root.findAllByType('img').length,0);await act(async()=>root.unmount());});

test('the primary discovery action prepares a preview, and changing a reaction revokes the previous card',async()=>{
 let root,calls=0,captured;const revoked=[],oldCreate=URL.createObjectURL,oldRevoke=URL.revokeObjectURL;
 URL.createObjectURL=()=> 'blob:reaction-preview';URL.revokeObjectURL=url=>revoked.push(url);
 const render=async model=>{calls++;captured=model;return {blob:new Blob(['png'])};},onBusy=()=>{},first=updateVisit(newVisit('jangseong',1),'hinoki',{reactions:['color']});
 try{
  await act(async()=>root=create(React.createElement(Panel,{visit:first,centerName:'장성',onBusy,render})));assert.equal(calls,0);assert.ok(button(root,'오늘의 발견 카드 받기').props.className.includes('visit-primary'));
  await act(async()=>button(root,'오늘의 발견 카드 받기').props.onClick());assert.equal(captured.observedCount,0);assert.deepEqual(captured.entries[0].reactions,['색이 눈에 띄어요']);
  const link=root.root.findAllByType('a').find(a=>a.props.download);assert.ok(label(link.props.children).includes('오늘의 발견 카드 받기'));assert.ok(link.props.className.includes('visit-primary'));assert.ok(button(root,'카드 다시 만들기').props.className.includes('visit-secondary'));
  await act(async()=>root.update(React.createElement(Panel,{visit:updateVisit(first,'hinoki',{reactions:['unsure']}),centerName:'장성',onBusy,render})));
  assert.equal(root.root.findAllByType('img').length,0);assert.equal(root.root.findAllByType('a').length,0);assert.deepEqual(revoked,['blob:reaction-preview']);assert.equal(calls,1);
 }finally{if(root)await act(async()=>root.unmount());URL.createObjectURL=oldCreate;URL.revokeObjectURL=oldRevoke;}
});
