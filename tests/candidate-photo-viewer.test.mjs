import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import React from 'react';
import {create,act} from 'react-test-renderer';
import {build} from 'esbuild';
const out=new URL(`.routing-test-candidate-photos-${process.pid}.mjs`,import.meta.url);
const built=await build({absWorkingDir:fileURLToPath(new URL('../',import.meta.url)),entryPoints:['src/ReferencePhotos.jsx'],bundle:true,platform:'node',format:'esm',write:false,external:['react']});await fs.writeFile(out,built.outputFiles[0].text);let Reference;try{({default:Reference}=await import(out.href));}finally{await fs.unlink(out);}
const label=v=>typeof v==='string'?v:Array.isArray(v)?v.map(label).join(''):v?.props?label(v.props.children):'';
const button=(root,text)=>root.root.findAllByType('button').find(x=>label(x.props.children)===text);
const photos=['a','b'].map((id,index)=>({thumbnailUrl:`https://bs.plantnet.org/image/m/${id.repeat(40)}`,originalUrl:`https://bs.plantnet.org/image/o/${id.repeat(40)}`,author:`촬영자 ${index+1}`,license:'CC BY-SA 4.0',licenseUrl:'https://creativecommons.org/licenses/by-sa/4.0/',citation:'제공 사진 출처',organ:index?'bark':'leaf'}));
function environment(){
 const oldWindow=globalThis.window,oldDocument=globalThis.document,listeners=new Set(),keys=new Map(),stack=[null];let pos=0,backs=0;
 const opener={isConnected:true,closest:()=>null,focus(){}};
 globalThis.window={history:{get state(){return stack[pos];},pushState(value){stack.splice(pos+1);stack.push(value);pos++;},replaceState(value){stack[pos]=value;},back(){backs++;}},addEventListener:(_n,fn)=>listeners.add(fn),removeEventListener:(_n,fn)=>listeners.delete(fn)};
 globalThis.document={activeElement:opener,body:{style:{overflow:'auto'}},addEventListener:(n,fn)=>keys.set(n,fn),removeEventListener:n=>keys.delete(n)};
 return {opener,node:()=>({focus(){},querySelectorAll:()=>[],contains:()=>true}),get position(){return pos;},get backs(){return backs;},pop(){pos--;for(const fn of [...listeners])fn({state:stack[pos]});},restore(){globalThis.window=oldWindow;globalThis.document=oldDocument;}};
}
test('candidate photos open internally with full attribution, switch in one history entry and never select the candidate',async()=>{
 const env=environment();let root,chosen=0;
 function Candidate(){return React.createElement('section',null,React.createElement(Reference,{images:photos,name:'갈참나무'}),React.createElement('button',{onClick:()=>chosen++},'이 이름 고르기'));}
 try{
  await act(async()=>root=create(React.createElement(Candidate),{createNodeMock:env.node}));assert.equal(root.root.findAllByType('a').some(a=>photos.some(p=>p.originalUrl===a.props.href)),false);
  await act(async()=>root.root.findByProps({'aria-label':'갈참나무 비교 사진 1 크게 보기'}).props.onClick({currentTarget:env.opener}));assert.equal(chosen,0);assert.equal(env.position,1);
  const image=()=>root.root.findByProps({className:'photo-viewer-image'});assert.equal(image().props.src,photos[0].originalUrl);assert.equal(image().props.referrerPolicy,'no-referrer');
  const attribution=()=>root.root.findByProps({'aria-label':'사진 출처와 이용 조건'});assert.ok(attribution().findAllByType('span').some(span=>label(span.props.children).includes('촬영자 1')));assert.ok(attribution().findAllByType('a').some(a=>a.props.href===photos[0].licenseUrl));
  await act(async()=>button(root,'다음 사진').props.onClick());assert.equal(image().props.src,photos[1].originalUrl);assert.equal(env.position,1);assert.ok(attribution().findAllByType('span').some(span=>label(span.props.children).includes('촬영자 2')));assert.equal(chosen,0);
  await act(async()=>{window.history.back();env.pop();});assert.equal(root.root.findAllByProps({role:'dialog'}).length,0);assert.equal(chosen,0);await act(async()=>button(root,'이 이름 고르기').props.onClick());assert.equal(chosen,1);
 }finally{if(root)await act(async()=>root.unmount());env.restore();}
});
test('original image failure falls back once to thumbnail; failure of both keeps closing available',async()=>{
 const env=environment();let root;try{
  await act(async()=>root=create(React.createElement(Reference,{images:photos,name:'갈참나무'}),{createNodeMock:env.node}));
  await act(async()=>root.root.findByProps({'aria-label':'갈참나무 비교 사진 1 크게 보기'}).props.onClick({currentTarget:env.opener}));
  await act(async()=>root.root.findByProps({className:'photo-viewer-image'}).props.onError());assert.equal(root.root.findByProps({className:'photo-viewer-image'}).props.src,photos[0].thumbnailUrl);assert.ok(JSON.stringify(root.toJSON()).includes('미리보기 사진을 보여드려요'));
  await act(async()=>root.root.findByProps({className:'photo-viewer-image'}).props.onError());assert.ok(root.root.findByProps({role:'alert'}));assert.ok(button(root,'닫기'));
  await act(async()=>button(root,'다음 사진').props.onClick());assert.equal(root.root.findByProps({className:'photo-viewer-image'}).props.src,photos[1].originalUrl);
  await act(async()=>button(root,'닫기').props.onClick());await act(async()=>env.pop());assert.equal(root.root.findAllByProps({role:'dialog'}).length,0);
 }finally{if(root)await act(async()=>root.unmount());env.restore();}
});
test('changed candidates close their old photo, and unsupported image URLs or licenses have no preview action',async()=>{
 const env=environment();let root;try{
  await act(async()=>root=create(React.createElement(Reference,{images:photos,name:'갈참나무'}),{createNodeMock:env.node}));
  await act(async()=>root.root.findByProps({'aria-label':'갈참나무 비교 사진 1 크게 보기'}).props.onClick({currentTarget:env.opener}));
  await act(async()=>root.update(React.createElement(Reference,{images:[{...photos[1],license:'all-rights-reserved'}],name:'다른 식물'})));assert.equal(root.root.findAllByProps({role:'dialog'}).length,0);assert.equal(root.root.findAllByType('button').length,0);assert.equal(env.backs,0);assert.ok(JSON.stringify(root.toJSON()).includes('비교할 사진이 없어요'));
  await act(async()=>root.update(React.createElement(Reference,{images:[{...photos[0],thumbnailUrl:'https://invalid.example/photo.jpg'}],name:'다른 식물'})));assert.equal(root.root.findAllByType('button').length,0);
 }finally{if(root)await act(async()=>root.unmount());env.restore();}
});
