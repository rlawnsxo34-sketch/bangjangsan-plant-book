import test from 'node:test';
import assert from 'node:assert/strict';
import {IDBFactory} from 'fake-indexeddb';
import {recordPhotos,withPhotos,photoDocument} from '../src/record-photos.js';
import {createDraftStore} from '../src/draft-store.js';
const photo=n=>'data:image/jpeg;base64,'+Buffer.from([255,216,n,255,217]).toString('base64');
const [a,b,c,d]=[1,2,3,4].map(photo);
const draft={name:'갈참나무',description:'잎',centerId:'jangseong',centerName:'장성',imageData:a,location:null,locationSource:'center_only',aiSelection:{provider:'plantnet',scientificName:'Quercus aliena',commonName:'갈참나무',score:.8,selectedAt:1}};
test('a legacy photo loads alone, three photos are bounded, and a new cover clears only its AI selection',()=>{
 assert.deepEqual(recordPhotos(draft),[a]);
 const album=withPhotos(draft,[a,b,c]);assert.deepEqual(recordPhotos(album),[a,b,c]);assert.equal(album.aiSelection,draft.aiSelection);
 const swapped=withPhotos(album,[b,a,c]);assert.equal(swapped.aiSelection,undefined);assert.equal(swapped.description,'잎');
 assert.throws(()=>withPhotos(draft,[a,b,c,d]));assert.throws(()=>recordPhotos({imageData:a,additionalImages:[123]}));
 assert.throws(()=>recordPhotos({imageData:null,additionalImages:[b]}));
 assert.throws(()=>recordPhotos({imageData:'',additionalImages:[]}));
 assert.throws(()=>recordPhotos({imageData:a,additionalImages:null}));
 assert.deepEqual(withPhotos(draft,[]).additionalImages,[]);
 const stored=photoDocument('owner',album);assert.deepEqual(stored,{ownerId:'owner',schemaVersion:3,imageData:a,additionalImages:[b,c]});
 assert.equal(stored.aiSelection,undefined);assert.equal(stored.description,undefined);
});
test('three-photo drafts restore all images and the same pending save ID without leaking into another account',async()=>{
 let serial=0;const store=createDraftStore(new IDBFactory(),()=>100,()=>String(++serial));
 const data=withPhotos(draft,[a,b,c]);
 await store.write('owner','jangseong',data,{id:'same-id',createdAt:1,updatedAt:1},null);
 const restored=await store.read('owner','jangseong');assert.deepEqual(recordPhotos(restored.draft),[a,b,c]);assert.equal(restored.pending.id,'same-id');
 assert.equal(await store.read('other','jangseong'),null);
 await store.remove('owner','jangseong',restored.revision);assert.equal(await store.read('owner','jangseong'),null);
});
