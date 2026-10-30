import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import React from 'react';
import {create,act} from 'react-test-renderer';
import {build} from 'esbuild';
import {newVisit,updateVisit} from '../src/experience-model.js';
import {downloadVisitText} from '../src/visit-file.js';
const visit=()=>updateVisit(newVisit('jangseong',Date.UTC(2026,9,29)),'hinoki',{note:'직접 적은 특징',reactions:['color']});
function browser({fail=false}={}){
 const revoked=[],scheduled=[];let blob,removed=0,clicked=0;
 const anchor={click(){clicked++;if(fail)throw new Error('download blocked');},remove(){removed++;}};
 return {options:{document:{createElement:()=>anchor,body:{append(){}}},URL:{createObjectURL:value=>{blob=value;return 'blob:text';},revokeObjectURL:value=>revoked.push(value)},schedule:(fn,delay)=>scheduled.push({fn,delay})},revoked,scheduled,anchor,get blob(){return blob;},get removed(){return removed;},get clicked(){return clicked;}};
}
test('text downloads carry the intended reactions and notes, request a local file and clean up their URL',async()=>{
 const b=browser(),source={...visit(),email:'private@example.test',location:{lat:35,lng:126}};
 assert.equal(downloadVisitText(source,'장성',b.options),undefined);assert.equal(b.clicked,1);assert.equal(b.removed,1);assert.equal(b.anchor.download,'egmy-observation-2026-10-29.txt');
 const text=await b.blob.text();assert.ok(text.includes('직접 적은 특징'));assert.ok(text.includes('색이 눈에 띄어요'));assert.ok(!text.includes('private@example.test'));assert.ok(!text.includes('126'));
 assert.deepEqual([...new Uint8Array(await b.blob.arrayBuffer()).slice(0,3)],[239,187,191]);
 assert.deepEqual(b.revoked,[]);assert.equal(b.scheduled[0].delay,60000);b.scheduled[0].fn();assert.deepEqual(b.revoked,['blob:text']);
});
test('failed downloads remove the link and URL without claiming a saved file',()=>{
 const b=browser({fail:true});assert.throws(()=>downloadVisitText(visit(),'장성',b.options));assert.equal(b.removed,1);assert.deepEqual(b.revoked,['blob:text']);assert.equal(b.scheduled.length,0);
 const empty=browser();assert.throws(()=>downloadVisitText(newVisit('jangseong',1),'장성',empty.options));assert.equal(empty.clicked,0);assert.equal(empty.blob,undefined);
});
const components={};
for(const name of ['GuestRecordHandoff','VisitTextExport']){
 const out=new URL(`.routing-test-handoff-${name}-${process.pid}.mjs`,import.meta.url);
 const b=await build({absWorkingDir:fileURLToPath(new URL('../',import.meta.url)),entryPoints:[`src/${name}.jsx`],bundle:true,platform:'node',format:'esm',write:false,external:['react','@phosphor-icons/react']});
 await fs.writeFile(out,b.outputFiles[0].text);try{components[name]=(await import(out.href)).default;}finally{await fs.unlink(out);}
}
const label=v=>typeof v==='string'?v:Array.isArray(v)?v.map(label).join(''):v?.props?label(v.props.children):'';
const button=(root,text)=>root.root.findAllByType('button').find(b=>label(b.props.children)===text);
function Card({onBusy}){return React.createElement('div',null,React.createElement('button',{onClick:()=>onBusy(true)},'카드 작업 시작'),React.createElement('button',{onClick:()=>onBusy(false)},'카드 작업 끝'));}
test('handoff never infers approval from preparing a card, locks exits while busy and allows an explicit return',async()=>{
 let root,continued=0,back=0;const busy=[];
 await act(async()=>root=create(React.createElement(components.GuestRecordHandoff,{visit:visit(),center:{id:'jangseong',name:'장성'},onBusy:value=>busy.push(value),onContinue:()=>continued++,onBack:()=>back++,Card})));
 const next=()=>button(root,'로그인 화면으로 계속하기');assert.equal(next().props.disabled,true);
 await act(async()=>button(root,'카드 작업 시작').props.onClick());assert.equal(button(root,'돌아가서 더 살펴보기').props.disabled,true);assert.equal(root.root.findByProps({type:'checkbox'}).props.checked,false);
 await act(async()=>button(root,'카드 작업 끝').props.onClick());assert.equal(next().props.disabled,true);assert.equal(continued,0);
 await act(async()=>root.root.findByProps({type:'checkbox'}).props.onChange({target:{checked:true}}));assert.equal(next().props.disabled,false);await act(async()=>next().props.onClick());assert.equal(continued,1);
 await act(async()=>button(root,'돌아가서 더 살펴보기').props.onClick());assert.equal(back,1);assert.ok(busy.includes(true));await act(async()=>root.unmount());assert.equal(busy.at(-1),false);
});
test('text export reports a requested download and readable recovery instructions, never a completed save',async()=>{
 let root,fail=true;const download=()=>{if(fail)throw new Error('native English error');};
 await act(async()=>root=create(React.createElement(components.VisitTextExport,{visit:visit(),centerName:'장성',download})));
 await act(async()=>button(root,'기록 파일 받기').props.onClick());assert.ok(JSON.stringify(root.toJSON()).includes('다시 시도'));assert.ok(!JSON.stringify(root.toJSON()).includes('native English'));
 fail=false;await act(async()=>button(root,'기록 파일 받기').props.onClick());assert.ok(JSON.stringify(root.toJSON()).includes('다운로드 목록'));assert.ok(!JSON.stringify(root.toJSON()).includes('저장 완료'));
 await act(async()=>root.unmount());
});
