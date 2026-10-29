import {readFile} from 'node:fs/promises';
import {test,before,after} from 'node:test';
import {initializeTestEnvironment,assertSucceeds,assertFails} from '@firebase/rules-unit-testing';
import {doc,getDoc,getDocs,collection,writeBatch,setDoc,updateDoc,deleteDoc,deleteField} from 'firebase/firestore';
let env;const record=uid=>({ownerId:uid,schemaVersion:3,revision:1,shareStatus:'private',speciesId:null,observedAt:null,name:'이름 모름',description:'메모',centerName:'시연 기관',createdAt:1,updatedAt:1,location:null,locationSource:'center_only'});
const refs=(db,uid,id)=>({o:doc(db,'forestDevUsers',uid,'observations',id),p:doc(db,'forestDevUsers',uid,'photos',id)});
const photo=uid=>({ownerId:uid,schemaVersion:3,imageData:'data:image/jpeg;base64,/9j/2Q=='});
const databases=new Map();const db=uid=>{if(!databases.has(uid))databases.set(uid,env.authenticatedContext(uid,{firebase:{sign_in_provider:'password'}}).firestore());return databases.get(uid);};
const pair=(database,uid,id,patch={})=>{const p=refs(database,uid,id),b=writeBatch(database);b.set(p.o,{...record(uid),...patch});b.set(p.p,photo(uid));return b.commit();};
before(async()=>{env=await initializeTestEnvironment({projectId:'demo-forest-book',firestore:{host:'127.0.0.1',port:8080,rules:await readFile('firestore.rules','utf8')}});await env.clearFirestore();});
after(async()=>{await env?.cleanup();});
test('photo edits require a bounded owner album, a paired revision and a fresh operation ID; cover changes clear AI',async()=>{
 const aiSelection={provider:'plantnet',scientificName:'Quercus aliena',commonName:'갈참나무',score:.8,selectedAt:1};
 const database=db('photo-editor'),id='edit-photos';await assertSucceeds(pair(database,'photo-editor',id,{aiSelection}));const p=refs(database,'photo-editor',id);
 const original=photo('photo-editor'),different='data:image/jpeg;base64,/9j/AP/Z';
 function edit(data,patch){const batch=writeBatch(database);batch.update(p.o,{revision:2,updatedAt:2,...patch});batch.set(p.p,data);return batch.commit();}
 await assertFails(setDoc(p.p,{...original,imageData:different,lastEditId:'alone'}));
 await assertFails(edit({...original,imageData:different,lastEditId:'keep-ai'},{}));
 await assertFails(edit({...original,imageData:different},{aiSelection:deleteField()}));
 await assertFails(edit({...original,additionalImages:[different,different,different],lastEditId:'too-many'},{}));
 await assertFails(edit({...original,ownerId:'other',lastEditId:'bad-owner'},{}));
 await assertFails(edit({...original,lastEditId:'../invalid'},{}));
 await assertSucceeds(edit({...original,additionalImages:[different],lastEditId:'extra-only'},{}));
 await assertFails(edit({...original,lastEditId:'stale'},{}));
 const next=writeBatch(database);next.update(p.o,{revision:3,updatedAt:3,aiSelection:deleteField()});next.set(p.p,{...original,imageData:different,additionalImages:[original.imageData],lastEditId:'cover-changed'});await assertSucceeds(next.commit());
 const replay=writeBatch(database);replay.update(p.o,{revision:4,updatedAt:4});replay.set(p.p,{...original,lastEditId:'cover-changed'});await assertFails(replay.commit());
});
test('one to three photos remain private and bounded inside the atomic photo document',async()=>{
 async function album(id,extras){const p=refs(db('a'),'a',id),b=writeBatch(db('a'));b.set(p.o,record('a'));b.set(p.p,{...photo('a'),additionalImages:extras});return b.commit();}
 const image=photo('a').imageData;
 await assertSucceeds(album('album-three',[image,image]));
 await assertSucceeds(getDoc(refs(db('a'),'a','album-three').p));
 await assertFails(getDoc(refs(db('b'),'a','album-three').p));
 await assertFails(album('album-four',[image,image,image]));
 await assertFails(album('album-map',{a:image}));
 await assertFails(album('album-invalid',[123]));
 await assertFails(album('album-wrong-type',['data:image/png;base64,AAAA']));
 await assertFails(album('album-too-big',['data:image/jpeg;base64,'+'A'.repeat(160004)]));
 await assertFails(updateDoc(refs(db('a'),'a','album-three').p,{additionalImages:[]}));
 const p=refs(db('a'),'a','album-three'),batch=writeBatch(db('a'));batch.delete(p.o);batch.delete(p.p);await assertSucceeds(batch.commit());
 await assertFails(getDoc(p.p));
});
test('owner writes atomically paired private metadata and photo',async()=>{await assertSucceeds(pair(db('a'),'a','owned'));await assertSucceeds(getDoc(refs(db('a'),'a','owned').o));await assertSucceeds(getDoc(refs(db('a'),'a','owned').p));await assertSucceeds(getDocs(collection(db('a'),'forestDevUsers','a','observations')));});
test('other account cannot read photo, metadata, list or write',async()=>{for(const type of ['o','p'])await assertFails(getDoc(refs(db('b'),'a','owned')[type]));await assertFails(getDocs(collection(db('b'),'forestDevUsers','a','observations')));await assertFails(pair(db('b'),'a','intruder'));});
test('anonymous and unauthenticated reads and writes are denied',async()=>{for(const database of [env.unauthenticatedContext().firestore(),env.authenticatedContext('a',{firebase:{sign_in_provider:'anonymous'}}).firestore()]){await assertFails(getDoc(refs(database,'a','owned').o));await assertFails(pair(database,'a','no-auth'));}});
test('partial metadata or photo create is denied',async()=>{await assertFails(setDoc(refs(db('a'),'a','partial').o,record('a')));await assertFails(setDoc(refs(db('a'),'a','partial').p,photo('a')));});
test('allowed edit increments revision; stale writes and protected fields denied',async()=>{const ref=refs(db('a'),'a','owned').o;await assertSucceeds(updateDoc(ref,{name:'수정',revision:2,updatedAt:2}));await assertFails(updateDoc(ref,{name:'오래된 수정',revision:2,updatedAt:3}));await assertFails(updateDoc(ref,{shareStatus:'published',revision:3,updatedAt:3}));await assertFails(updateDoc(ref,{ownerId:'b',revision:3,updatedAt:3}));await assertFails(updateDoc(ref,{createdAt:2,revision:3,updatedAt:3}));});
test('photo updates and separate delete are denied; atomic delete succeeds',async()=>{const p=refs(db('a'),'a','owned');await assertFails(updateDoc(p.p,{imageData:'data:image/jpeg;base64,AAAA'}));await assertFails(deleteDoc(p.o));await assertFails(deleteDoc(p.p));const b=writeBatch(db('a'));b.delete(p.o);b.delete(p.p);await assertSucceeds(b.commit());});
test('invalid coordinates, extra roles and oversized photos denied',async()=>{await assertFails(pair(db('a'),'a','bad-location',{location:{lat:91,lng:126},locationSource:'gps'}));await assertFails(pair(db('a'),'a','bad-role',{role:'admin'}));const p=refs(db('a'),'a','huge'),b=writeBatch(db('a'));b.set(p.o,record('a'));b.set(p.p,{...photo('a'),imageData:'data:image/jpeg;base64,'+'A'.repeat(160004)});await assertFails(b.commit());});
test('review grants and public paths remain denied',async()=>{await assertFails(setDoc(doc(db('a'),'reviewerGrants','a'),{role:'reviewer'}));await assertFails(setDoc(doc(db('a'),'publicObservations','x'),record('a')));});
test('previous delivered namespace retains owner-only access',async()=>{const database=db('a'),ref=doc(database,'artifacts','plant-book-84803','users','a','plants','legacy');await assertSucceeds(setDoc(ref,{name:'이전 기록',description:'',imageData:'data:image/jpeg;base64,/9j/2Q==',createdAt:1}));await assertSucceeds(getDoc(ref));await assertFails(getDoc(doc(db('b'),'artifacts','plant-book-84803','users','a','plants','legacy')));});

test('AI selection is user metadata; invalid score or replacement is denied and manual edits can clear it',async()=>{const database=db('a'),aiSelection={provider:'plantnet',scientificName:'Pinus densiflora',commonName:'소나무',score:.8,selectedAt:1};await assertSucceeds(pair(database,'a','ai',{aiSelection}));await assertFails(pair(database,'a','ai-bad',{aiSelection:{...aiSelection,score:2}}));const ref=refs(database,'a','ai').o;await assertFails(updateDoc(ref,{aiSelection:{...aiSelection,score:.99},revision:2,updatedAt:2}));await assertSucceeds(updateDoc(ref,{name:'직접 입력',aiSelection:deleteField(),revision:2,updatedAt:2}));});

test('bound record validates active institution and exact registered name',async()=>{
 await env.withSecurityRulesDisabled(async c=>{const admin=c.firestore();await setDoc(doc(admin,'forestCenters','registered'),{name:'등록 기관',active:true});await setDoc(doc(admin,'forestCenters','inactive'),{name:'비활성 기관',active:false});});
 await assertSucceeds(pair(db('a'),'a','institution-bound',{centerId:'registered',centerName:'등록 기관'}));
 await assertFails(pair(db('a'),'a','institution-forged-name',{centerId:'registered',centerName:'다른 이름'}));
 await assertFails(pair(db('a'),'a','institution-missing',{centerId:'missing',centerName:'없는 기관'}));
 await assertFails(pair(db('a'),'a','institution-inactive',{centerId:'inactive',centerName:'비활성 기관'}));
});
test('bound institution cannot be erased to bypass sharing; inactive records remain editable',async()=>{
 const ref=refs(db('a'),'a','institution-bound').o;
 await assertFails(updateDoc(ref,{centerId:deleteField(),revision:2,updatedAt:2}));
 await assertFails(updateDoc(ref,{centerName:'변조 기관',revision:2,updatedAt:2}));
 await env.withSecurityRulesDisabled(async c=>{await updateDoc(doc(c.firestore(),'forestCenters','registered'),{active:false});});
 await assertSucceeds(updateDoc(ref,{description:'개인 메모 수정',revision:2,updatedAt:2}));
});
