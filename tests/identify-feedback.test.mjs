import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import React from 'react';
import {create,act} from 'react-test-renderer';
import {build} from 'esbuild';
import {identifyPhoto} from '../src/identify-client.js';
import {identifyProblem,IdentificationError} from '../src/identify-problem.js';
const runtime={token:async()=> 'token'},endpoint='https://example.test/identify';
const request=()=>identifyPhoto(runtime,endpoint,'photo','stable-id',new AbortController().signal);
test('HTTP problems get bounded Korean recovery messages without displaying arbitrary server details',async t=>{
 const old=globalThis.fetch;t.after(()=>globalThis.fetch=old);
 for(const [status,message,code,retry] of [[401,'secret','auth',true],[429,'오늘의 호출 한도 SECRET','limit',false],[429,'10초 이상 기다려주세요.','wait',true],[422,'secret','notFound',false],[409,'이전 분석이 진행 중입니다.','pending',true],[409,'완료하지 못했습니다.','failed',false],[503,'secret','service',true],[502,'Pl@ntNet 호출 한도에 도달했습니다.','limit',false]]){
  globalThis.fetch=async()=>Response.json({error:message},{status});await assert.rejects(request(),e=>{const p=identifyProblem(e);assert.equal(p.code,code);assert.equal(p.retry,retry);assert.ok(!JSON.stringify(p).includes('SECRET'));assert.ok(!JSON.stringify(p).includes('secret'));return true;});
 }
});
test('connection failures are recoverable, aborts stay cancelled, and setup errors do not send a request',async t=>{
 const old=globalThis.fetch;t.after(()=>globalThis.fetch=old);let calls=0;
 globalThis.fetch=async()=>{calls++;throw new TypeError('Failed to fetch secret');};await assert.rejects(request(),e=>identifyProblem(e).code==='connection');
 globalThis.fetch=async()=>{throw new DOMException('cancel','AbortError');};await assert.rejects(request(),{name:'AbortError'});
 await assert.rejects(identifyPhoto(runtime,'bad endpoint','photo','id',new AbortController().signal),e=>identifyProblem(e).code==='setup');assert.equal(calls,1);
});
test('empty candidates differ from malformed responses and raw invalid response text is never shown',async t=>{
 const old=globalThis.fetch;t.after(()=>globalThis.fetch=old);
 globalThis.fetch=async()=>Response.json({provider:'plantnet',candidates:[]});await assert.rejects(request(),e=>identifyProblem(e).code==='notFound');
 for(const value of [null,{provider:'plantnet',candidates:[null]},{provider:'other',candidates:[]}] ){
  globalThis.fetch=async()=>Response.json(value);await assert.rejects(request(),e=>identifyProblem(e).code==='service');
 }
 assert.equal(identifyProblem(new Error('private internal error')).code,'service');
});
const out=new URL(`.candidate-test-feedback-${process.pid}.mjs`,import.meta.url);
const b=await build({absWorkingDir:fileURLToPath(new URL('../',import.meta.url)),entryPoints:['src/PhotoSearchFeedback.jsx'],bundle:true,platform:'node',format:'esm',write:false,external:['react']});await fs.writeFile(out,b.outputFiles[0].text);let Feedback;try{({default:Feedback}=await import(out.href));}finally{await fs.unlink(out);}
const label=v=>typeof v==='string'?v:Array.isArray(v)?v.map(label).join(''):v?.props?label(v.props.children):'';
test('daily limits hide retry, manual naming stays available, and revoked photo consent disables retry',async()=>{
 let root,retried=0,manual=0;const props={onRetry:()=>retried++,onUnknown:()=>manual++};
 await act(async()=>root=create(React.createElement(Feedback,{...props,problem:identifyProblem(new IdentificationError('limit'))})));
 assert.equal(root.root.findAllByType('button').length,1);await act(async()=>root.root.findByType('button').props.onClick());assert.equal(manual,1);assert.equal(retried,0);
 await act(async()=>root.update(React.createElement(Feedback,{...props,problem:identifyProblem(new IdentificationError('connection')),retryDisabled:true})));
 const buttons=root.root.findAllByType('button');assert.equal(buttons.find(x=>label(x.props.children)==='다시 이름 찾기').props.disabled,true);assert.equal(buttons.find(x=>label(x.props.children)==='이름 모름으로 기록하기').props.disabled,false);
 await act(async()=>root.unmount());
});
