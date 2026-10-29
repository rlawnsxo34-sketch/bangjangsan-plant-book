import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import React from 'react';
import {create,act} from 'react-test-renderer';
import {build} from 'esbuild';
import {photoEditRecord,samePhotos,validPhotoEditId} from '../src/photo-edit-model.js';
const image=n=>'data:image/jpeg;base64,'+Buffer.from([255,216,n,255,217]).toString('base64');
const record={id:'one',name:'갈참나무',centerName:'장성',revision:1,updatedAt:1,aiSelection:{provider:'plantnet',scientificName:'Quercus aliena'}};
test('only a different final cover clears AI; photo edits preserve text and require at least one photo',()=>{
 const kept=photoEditRecord(record,[image(1)],[image(1),image(2)],2);assert.equal(kept.aiSelection,record.aiSelection);assert.equal(kept.revision,2);
 assert.equal(photoEditRecord(record,[image(1),image(2)],[image(2)],2).aiSelection,undefined);
 assert.throws(()=>photoEditRecord(record,[image(1)],[],2));assert.equal(samePhotos([image(1)],[image(1)]),true);
 assert.equal(validPhotoEditId('../bad'),false);assert.equal(validPhotoEditId('same-request'),true);
});
const output=new URL(`.photo-editor-test-${process.pid}.mjs`,import.meta.url);
const bundled=await build({absWorkingDir:fileURLToPath(new URL('../',import.meta.url)),entryPoints:['src/PhotoEditor.jsx'],bundle:true,platform:'node',format:'esm',write:false,external:['react'],plugins:[{name:'small-photo',setup(b){b.onLoad({filter:/[\\/]cloud-runtime\.js$/},()=>({contents:'export async function smallPhoto(value,signal){return globalThis.__smallPhoto(value,signal);}',loader:'js'}));}}]});
await fs.writeFile(output,bundled.outputFiles[0].text);let Editor;try{({default:Editor}=await import(output.href));}finally{await fs.unlink(output);}
const noop=()=>{};
function label(v){return typeof v==='string'?v:Array.isArray(v)?v.map(label).join(''):v?.props?label(v.props.children):'';}
function button(root,text){return root.root.findAllByType('button').find(b=>label(b.props.children)===text);}
function setup(){globalThis.window={confirm:()=>true,addEventListener(){},removeEventListener(){},plantPhotoFlow:{preparePhoto:async file=>{if(file.bad)throw new Error('잘못된 사진');return {dataUrl:image(file.n)};}}};globalThis.__smallPhoto=value=>value.dataUrl;}
async function mount(repo,extra={}){let root;await act(async()=>{root=create(React.createElement(Editor,{repo,uid:'owner',recordId:'one',onSaved:noop,onCancel:noop,onBusy:noop,onDirty:noop,...extra}));await new Promise(resolve=>setImmediate(resolve));});return root;}
test('saved-photo editor keeps failed additions, validates an empty album and never saves on selection or cancel',async()=>{
 setup();let saved=0,canceled=0,dirty=false;const repo={album:async()=>({record,photos:[image(1)]}),editPhotos:async()=>saved++};
 const root=await mount(repo,{onCancel:()=>canceled++,onDirty:value=>dirty=value});
 assert.equal(button(root,'사진 변경 저장하기').props.disabled,true);
 const add=files=>root.root.findByProps({'aria-label':'기존 기록 앨범 사진 추가'}).props.onChange({target:{files,value:''}});
 await act(async()=>add([{n:2},{n:3}]));assert.equal(root.root.findAllByType('img').length,3);assert.equal(dirty,true);assert.equal(saved,0);
 await act(async()=>root.root.findByProps({'aria-label':'3번 사진 빼기'}).props.onClick());
 await act(async()=>add([{bad:true}]));assert.equal(root.root.findAllByType('img').length,2);
 await act(async()=>root.root.findByProps({'aria-label':'2번 사진을 대표사진으로'}).props.onClick());assert.ok(JSON.stringify(root.toJSON()).includes('이전 AI 선택 정보'));
 await act(async()=>root.root.findByProps({'aria-label':'2번 사진 빼기'}).props.onClick());await act(async()=>root.root.findByProps({'aria-label':'1번 사진 빼기'}).props.onClick());
 assert.equal(button(root,'사진 변경 저장하기').props.disabled,true);assert.equal(saved,0);
 await act(async()=>button(root,'닫기').props.onClick());assert.equal(canceled,1);assert.equal(saved,0);await act(async()=>root.unmount());
});
test('failed or uncertain save freezes its payload and reuses the same ID, and reload requires discard confirmation',async()=>{
 setup();const attempts=[];let success=0;
 const repo={album:async()=>({record,photos:[image(1)]}),editPhotos:async(...args)=>{attempts.push(args);if(attempts.length===1)throw new Error('응답을 확인하지 못했어요.');return {record,photos:args[2]};}};
 const root=await mount(repo,{onSaved:()=>success++});
 await act(async()=>root.root.findByProps({'aria-label':'기존 기록 앨범 사진 추가'}).props.onChange({target:{files:[{n:2}],value:''}}));
 await act(async()=>button(root,'사진 변경 저장하기').props.onClick());assert.equal(success,0);assert.equal(root.root.findByProps({'aria-label':'1번 사진 빼기'}).props.disabled,true);
 window.confirm=()=>false;await act(async()=>button(root,'최신 기록 다시 불러오기').props.onClick());assert.equal(root.root.findAllByType('img').length,2);
 await act(async()=>button(root,'같은 변경 다시 저장').props.onClick());assert.equal(success,1);assert.equal(attempts[0][3],attempts[1][3]);assert.deepEqual(attempts[0][2],attempts[1][2]);await act(async()=>root.unmount());
});
test('late load, added photo and save callbacks cannot reach an unmounted account editor',async()=>{
 setup();let finishLoad,finishSave,finishPhoto,saved=0;
 const lateLoad=mount({album:()=>new Promise(resolve=>finishLoad=resolve)});const loading=await lateLoad;await act(async()=>loading.unmount());await act(async()=>finishLoad({record,photos:[image(1)]}));
 const repo={album:async()=>({record,photos:[image(1)]}),editPhotos:()=>new Promise(resolve=>finishSave=resolve)};
 let root=await mount(repo,{onSaved:()=>saved++});globalThis.__smallPhoto=()=>new Promise(resolve=>finishPhoto=resolve);
 await act(async()=>root.root.findByProps({'aria-label':'기존 기록 앨범 사진 추가'}).props.onChange({target:{files:[{n:2}],value:''}}));await act(async()=>root.unmount());await act(async()=>finishPhoto(image(2)));assert.equal(saved,0);
 setup();root=await mount(repo,{onSaved:()=>saved++});await act(async()=>root.root.findByProps({'aria-label':'기존 기록 앨범 사진 추가'}).props.onChange({target:{files:[{n:2}],value:''}}));
 await act(async()=>{button(root,'사진 변경 저장하기').props.onClick();});await act(async()=>root.unmount());await act(async()=>finishSave({record,photos:[image(1),image(2)]}));assert.equal(saved,0);
});
