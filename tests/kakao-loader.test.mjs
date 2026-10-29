import test from 'node:test';
import assert from 'node:assert/strict';
async function fixture(id){const scripts=[];globalThis.document={createElement:()=>({remove(){this.removed=true;}}),head:{append:s=>scripts.push(s)}};globalThis.window={};return {scripts,load:(await import('../src/kakao-loader.js?test='+id)).loadKakaoMap};}
test('Kakao SDK is requested explicitly once, validates its loaded API, and rejects a changed key',async()=>{
 const {load,scripts}=await fixture('shared');await assert.rejects(load(''));assert.equal(scripts.length,0);
 const pending=load('js-key');assert.equal(load('js-key'),pending);assert.equal(scripts.length,1);assert.equal(new URL(scripts[0].src).searchParams.get('libraries'),'services');assert.equal(scripts[0].referrerPolicy,'origin');
 window.kakao={maps:{Map:class{},load:fn=>fn()}};scripts[0].onload();assert.equal(await pending,window.kakao.maps);await assert.rejects(load('other-key'));
});
test('failed SDK requests remove the script and allow a fresh retry',async()=>{
 const {load,scripts}=await fixture('retry');const first=load('js-key');scripts[0].onerror();await assert.rejects(first);assert.equal(scripts[0].removed,true);
 const second=load('js-key');window.kakao={maps:{Map:class{},load:fn=>fn()}};scripts[1].onload();assert.equal(await second,window.kakao.maps);
});
