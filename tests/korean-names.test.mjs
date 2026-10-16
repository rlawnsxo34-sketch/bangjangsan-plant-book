import {test} from 'node:test';
import assert from 'node:assert/strict';
import {localizeCandidate} from '../backend/korean-names.mjs';
import {identifyPhoto} from '../src/identify-client.js';
test('source-checked exact scientific name wins without guessing related taxa',()=>{
 const known=localizeCandidate({scientificName:' Pinus   densiflora ',commonName:'Japanese red pine'});
 assert.equal(known.koreanName,'소나무');assert.equal(known.koreanNameSource,'nibr-2015');assert.ok(known.koreanNameSourceUrl.endsWith('#page=23'));
 for(const name of ['Pinus densiflora var. unknown','Pinus unknown','Pinus','Pinus densiflora × Pinus rigida']){
  assert.equal(localizeCandidate({scientificName:name,commonName:'pine'}).koreanName,'');
 }
});
test('unknown and legacy candidates retain scientific names with honest Korean fallback',()=>{
 const c=localizeCandidate({scientificName:'Unknown species',commonName:'English name'});
 assert.equal(c.displayName,'한글 이름 미등록');assert.equal(c.scientificName,'Unknown species');assert.equal(c.koreanNameSource,'none');
 assert.equal(localizeCandidate({scientificName:'Unlisted species',commonName:'제공된 이름'}).koreanNameSource,'plantnet');
});
test('client localizes legacy cached responses without another identification request',async t=>{
 let calls=0;const old=globalThis.fetch;t.after(()=>{globalThis.fetch=old;});
 globalThis.fetch=async(url,options)=>{calls++;assert.deepEqual(Object.keys(JSON.parse(options.body)).sort(),['imageData','requestId']);return Response.json({provider:'plantnet',candidates:[{scientificName:'Pinus densiflora',commonName:'Japanese red pine',score:.8}]});};
 const rows=await identifyPhoto({token:async()=> 'test'},'https://example.test/identify','photo','id',new AbortController().signal);
 assert.equal(rows[0].koreanName,'소나무');assert.equal(calls,1);
});
