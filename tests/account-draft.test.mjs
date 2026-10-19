import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {create,act} from 'react-test-renderer';
import {IDBFactory} from 'fake-indexeddb';
// Module is loaded after storage injection, just as the browser loads it.
globalThis.indexedDB=new IDBFactory();
const {default:useAccountDraft}=await import('../src/useAccountDraft.js');
const {createDraftStore}=await import('../src/draft-store.js');
const center={id:'jangseong',name:'장성숲체원'};
const empty={name:'',description:'',...{centerId:center.id,centerName:center.name},imageData:null,location:null,locationSource:'center_only'};
const row={...empty,name:'복구할 기록',imageData:'data:image/jpeg;base64,/9j/AP/Z'};
let api;
function Harness({uid='a',draft=empty}){const pending=React.useRef(null);api=useAccountDraft(uid?{uid}:null,center,draft,pending);return null;}
async function settle(){for(let i=0;i<3;i++)await act(async()=>{await new Promise(resolve=>setTimeout(resolve,15));});}
test('hook requires explicit restore, preserves draft while choosing, and clears UI across accounts',async()=>{const store=createDraftStore();await store.write('a',center.id,row,null,null);let root;await act(async()=>{root=create(React.createElement(Harness,{}));});await settle();assert.equal(api.recovery.draft.name,row.name);assert.equal((await store.read('a',center.id)).draft.name,row.name);
 await act(async()=>{await api.decide(true);});await settle(); // blank form must not erase restored data before parent applies it
 assert.equal((await store.read('a',center.id)).draft.name,row.name);
 await act(async()=>{root.update(React.createElement(Harness,{draft:row}));});await settle();assert.match(api.message,/기기에 임시 보관됨/);
 await act(async()=>{root.update(React.createElement(Harness,{uid:'b',draft:empty}));});await settle();assert.equal(api.recovery,null);assert.equal(api.message,'');assert.equal((await store.read('a',center.id)).draft.name,row.name);
 await act(async()=>{root.update(React.createElement(Harness,{uid:null}));});assert.equal(api.recovery,null);await act(async()=>root.unmount());});
test('successful save cleanup followed by blank form does not recreate the draft',async()=>{const store=createDraftStore();let root;await act(async()=>{root=create(React.createElement(Harness,{uid:'save',draft:empty}));});await settle();await act(async()=>root.update(React.createElement(Harness,{uid:'save',draft:row})));await settle();assert.ok(await store.read('save',center.id));await act(async()=>{await api.clear();root.update(React.createElement(Harness,{uid:'save',draft:empty}));});await settle();assert.equal(await store.read('save',center.id),null);await act(async()=>root.unmount());});
test('location-only recovery is not erased while its form is still blank',async()=>{const store=createDraftStore(),point={...empty,location:{lat:35,lng:126},locationSource:'map'};await store.write('point',center.id,point,null,null);let root;await act(async()=>root=create(React.createElement(Harness,{uid:'point'})));await settle();await act(async()=>api.decide(true));await settle();assert.deepEqual((await store.read('point',center.id)).draft.location,point.location);await act(async()=>root.update(React.createElement(Harness,{uid:'point',draft:point})));await settle();assert.match(api.message,/기기에 임시 보관됨/);await act(async()=>root.unmount());});
