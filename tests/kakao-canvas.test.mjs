import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import React from 'react';
import {create,act} from 'react-test-renderer';
import {build} from 'esbuild';
const out=new URL(`.kakao-canvas-test-${process.pid}.mjs`,import.meta.url);
const b=await build({absWorkingDir:fileURLToPath(new URL('../',import.meta.url)),entryPoints:['src/KakaoTreeCanvas.jsx'],bundle:true,platform:'node',format:'esm',write:false,external:['react']});await fs.writeFile(out,b.outputFiles[0].text);let Canvas;try{({default:Canvas}=await import(out.href));}finally{await fs.unlink(out);}
test('actual map adapter selects registered markers, gates location picking, resizes and removes listeners',async()=>{
 const events=new Map(),markers=[];let instance,observer,selected,picked,disconnected=false;
 class LatLng{constructor(lat,lng){this.lat=lat;this.lng=lng;}getLat(){return this.lat;}getLng(){return this.lng;}}
 class MapFake{constructor(){instance=this;this.center=new LatLng(36.5,127.8);}setCenter(p){this.center=p;}getCenter(){return this.center;}setLevel(){}setBounds(){}relayout(){this.resized=true;}panBy(){}}
 class Marker{constructor(o){this.point=o.position;this.onMap=o.map;markers.push(this);}getPosition(){return this.point;}setMap(m){this.onMap=m;}}
 const sdk={Map:MapFake,LatLng,LatLngBounds:class{extend(){}},Marker,event:{addListener:(o,n,fn)=>events.set(o,fn),removeListener:o=>events.delete(o)}};
 globalThis.ResizeObserver=class{constructor(fn){observer=fn;}observe(){}disconnect(){disconnected=true;}};
 const load=async()=>sdk,rows=[{id:'hinoki',name:'편백나무',coordinates:{lat:35,lng:126}}];let root;
 const props={apiKey:'fake',centerName:'기관',markers:rows,load,onSelect:id=>selected=id,onPick:p=>picked=p};
 await act(async()=>root=create(React.createElement(Canvas,props),{createNodeMock:()=>({})}));
 await act(async()=>events.get(markers[0])());assert.equal(selected,'hinoki');await act(async()=>events.get(instance)({latLng:new LatLng(35.1,126.1)}));assert.equal(picked,undefined);
 await act(async()=>root.update(React.createElement(Canvas,{...props,editable:true})));await act(async()=>events.get(instance)({latLng:new LatLng(35.1,126.1)}));assert.deepEqual(picked,{lat:35.1,lng:126.1});observer();assert.equal(instance.resized,true);
 await act(async()=>root.unmount());assert.equal(events.size,0);assert.equal(markers[0].onMap,null);assert.ok(disconnected);delete globalThis.ResizeObserver;
});
