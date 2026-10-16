import {test} from 'node:test';
import assert from 'node:assert/strict';
import {referenceImages} from '../backend/reference-images.mjs';
import {identifyPhoto} from '../src/identify-client.js';
const id='0123456789abcdef0123456789abcdef01234567';
const m='https://bs.plantnet.org/image/m/'+id,o='https://bs.plantnet.org/image/o/'+id;
const row={author:'Test contributor',license:'cc-by-sa',citation:'Test contributor / Pl@ntNet, cc-by-sa',organ:'leaf',url:{m,o}};
test('reference photos retain author/license and deduplicate with a two-photo bound',()=>{
 const photos=referenceImages([row,row,...Array.from({length:8},(_,i)=>({...row,url:{m:m+i,o:o+i}}))],{provider:true});
 assert.equal(photos.length,2);assert.equal(photos[0].author,row.author);assert.equal(photos[0].license,'CC BY-SA');assert.equal(photos[0].citation,row.citation);assert.equal(photos[0].organ,'leaf');
 assert.equal(referenceImages(photos)[0].thumbnailUrl,m);
});
test('missing attribution, unsupported license and non-PlantNet URLs are not displayed',()=>{
 for(const patch of [{author:''},{license:'all-rights-reserved'},{license:'cc-by-nc'},{url:{m:'https://evil.example/image/m/'+id}},{url:{m:'https://bs.plantnet.org.evil.example/image/m/'+id}},{url:{m:'http://bs.plantnet.org/image/m/'+id}},{url:{m:m+'?api-key=secret'}},{url:{m:'https://user:secret@bs.plantnet.org/image/m/'+id}},{url:{m:'data:image/svg+xml,unsafe'}}]){
  assert.deepEqual(referenceImages([{...row,...patch}],{provider:true}),[]);
 }
 assert.deepEqual(referenceImages(null),[]);assert.deepEqual(referenceImages({bad:true}),[]);
});
test('specific license versions are retained and forged license links are discarded',()=>{
 const normalized=referenceImages([{...row,license:'https://creativecommons.org/licenses/by-sa/4.0/'}],{provider:true})[0];
 assert.equal(normalized.license,'CC BY-SA 4.0');assert.equal(normalized.licenseUrl,'https://creativecommons.org/licenses/by-sa/4.0/');
 const rechecked=referenceImages([{...normalized,licenseUrl:'https://evil.example/'}])[0];assert.equal(rechecked.licenseUrl,normalized.licenseUrl);
});
test('client accepts safe reference metadata and remains usable without images',async t=>{
 const old=globalThis.fetch;t.after(()=>{globalThis.fetch=old;});
 const images=referenceImages([row],{provider:true});
 globalThis.fetch=async()=>Response.json({provider:'plantnet',candidates:[{scientificName:'Pinus densiflora',commonName:'',score:.8,images},{scientificName:'Unknown species',commonName:'',score:null,images:[{...images[0],thumbnailUrl:'https://evil.example/'}]}]});
 const result=await identifyPhoto({token:async()=> 'test'},'https://example.test/identify','photo','id',new AbortController().signal);
 assert.equal(result[0].koreanName,'소나무');assert.equal(result[0].images.length,1);assert.equal(result[1].images.length,0);assert.equal(result[1].displayName,'한글 이름 미등록');
});
