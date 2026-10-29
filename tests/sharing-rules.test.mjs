import {readFile} from 'node:fs/promises';
import {test,before,after} from 'node:test';
import assert from 'node:assert/strict';
import {initializeTestEnvironment,assertSucceeds,assertFails} from '@firebase/rules-unit-testing';
import {doc,collection,query,where,getDoc,getDocs,setDoc,updateDoc,writeBatch,serverTimestamp,deleteDoc} from 'firebase/firestore';
let env,n=0;const databases=new Map();const db=uid=>{if(!databases.has(uid))databases.set(uid,env.authenticatedContext(uid,{firebase:{sign_in_provider:'password'}}).firestore());return databases.get(uid);};
const refs=(database,id)=>({o:doc(database,'forestDevUsers','author','observations',id),p:doc(database,'forestDevUsers','author','photos',id),s:doc(database,'forestShareRequests',id),pub:doc(database,'forestPublicObservations',id)});
const base={ownerId:'author',schemaVersion:3,revision:1,shareStatus:'private',speciesId:null,observedAt:null,name:'소나무',description:'비공개 개인 메모',centerName:'기관 A',createdAt:1,updatedAt:1,location:{lat:37.11111,lng:127.99999},locationSource:'gps'};
const imageData='data:image/jpeg;base64,/9j/2Q==';
async function source(id,extra={}){const database=db('author'),r=refs(database,id),b=writeBatch(database);b.set(r.o,base);b.set(r.p,{ownerId:'author',schemaVersion:3,imageData,...extra});await b.commit();}
const submission=()=>({ownerId:'author',observationId:'',centerId:'a',centerName:'기관 A',name:'소나무',publicNote:'공개 메모',imageData,originalRevision:1,submittedAt:serverTimestamp(),status:'pending',reviewReason:'',reviewedAt:null,reviewedBy:null,reviewId:null});
async function submit(id,patch={}){await setDoc(refs(db('author'),id).s,{...submission(),observationId:id,...patch});}
function publication(){return {centerId:'a',centerName:'기관 A',name:'소나무',publicNote:'공개 메모',imageData,institutionLocation:{lat:35,lng:126},locationLabel:'기관 위치 · 관찰 지점 아님',reviewScope:'담당자 공유 검토 · 식물 종 확정 아님',publishedAt:serverTimestamp()};}
function approval(id,uid='reviewer-a',decision='approved',extra={},withAudit=true){const database=db(uid),r=refs(database,id),b=writeBatch(database),reviewId='review-'+(++n);b.update(r.s,{status:decision,reviewReason:'공개 적합성 검토',reviewedBy:uid,reviewedAt:serverTimestamp(),reviewId});if(withAudit)b.set(doc(database,'forestShareRequests',id,'reviews',reviewId),{decision,reason:'공개 적합성 검토',reviewerId:uid,originalRevision:1,reviewedAt:serverTimestamp()});if(decision==='approved')b.set(r.pub,{...publication(),...extra});else b.delete(r.pub);return b.commit();}
before(async()=>{env=await initializeTestEnvironment({projectId:'demo-forest-book',firestore:{host:'127.0.0.1',port:8080,rules:await readFile('firestore.rules','utf8')}});await env.clearFirestore();await env.withSecurityRulesDisabled(async c=>{const admin=c.firestore();await setDoc(doc(admin,'forestCenters','a'),{name:'기관 A',active:true,mapCenter:{lat:35,lng:126},isDemo:true});await setDoc(doc(admin,'forestCenters','b'),{name:'기관 B',active:true,mapCenter:null,isDemo:true});await setDoc(doc(admin,'forestReviewerGrants','reviewer-a','centers','a'),{active:true});await setDoc(doc(admin,'forestReviewerGrants','reviewer-b','centers','b'),{active:true});});});
after(async()=>{await env?.cleanup();});
test('a chosen subset reaches review and publication exactly; unchosen originals stay private after withdrawal',async()=>{
 const id='selected-subset',second='data:image/jpeg;base64,/9j/AP/Z',third='data:image/jpeg;base64,/9j/Af/Z';
 await source(id,{additionalImages:[second,third]});
 await assertSucceeds(submit(id,{imageData:second,additionalImages:[third],selectedPhotoIndexes:[1,2]}));
 const snapshot=(await getDoc(refs(db('reviewer-a'),id).s)).data();assert.equal(snapshot.imageData,second);assert.deepEqual(snapshot.additionalImages,[third]);
 await assertFails(approval(id,'reviewer-a','approved',{imageData:second}));
 await assertFails(approval(id,'reviewer-a','approved',{imageData:second,additionalImages:[third,imageData]}));
 await assertSucceeds(approval(id,'reviewer-a','approved',{imageData:second,additionalImages:[third]}));
 const visitor=env.unauthenticatedContext().firestore(),published=(await getDoc(refs(visitor,id).pub)).data();assert.equal(published.imageData,second);assert.deepEqual(published.additionalImages,[third]);assert.equal(published.selectedPhotoIndexes,undefined);
 await assertFails(getDoc(refs(visitor,id).p));await assertFails(getDoc(refs(db('reviewer-a'),id).p));
 const original=(await getDoc(refs(db('author'),id).p)).data();assert.equal(original.imageData,imageData);assert.deepEqual(original.additionalImages,[second,third]);
 const batch=writeBatch(db('author'));batch.update(refs(db('author'),id).s,{status:'withdrawn'});batch.delete(refs(db('author'),id).pub);await assertSucceeds(batch.commit());await assertFails(getDoc(refs(visitor,id).pub));
 assert.deepEqual((await getDoc(refs(db('author'),id).p)).data().additionalImages,[second,third]);
});
test('selection bounds, order and photo provenance cannot be forged or bypassed using the legacy shape',async()=>{
 const second='data:image/jpeg;base64,/9j/AP/Z',third='data:image/jpeg;base64,/9j/Af/Z';let index=0;
 const patches=[{selectedPhotoIndexes:[]},{selectedPhotoIndexes:[-1]},{selectedPhotoIndexes:[3]},{selectedPhotoIndexes:['0']},{selectedPhotoIndexes:[1,1],imageData:second,additionalImages:[second]},{selectedPhotoIndexes:[2,1],imageData:third,additionalImages:[second]},{selectedPhotoIndexes:[0,1,2,3],additionalImages:[second,third]},{selectedPhotoIndexes:[1],imageData},{selectedPhotoIndexes:[1,2],imageData:second},{selectedPhotoIndexes:[0,1],additionalImages:[third]},{additionalImages:[second]},{selectedPhotoIndexes:[0],submissionId:'../bad'}];
 for(const patch of patches){const id='invalid-selection-'+index++;await source(id,{additionalImages:[second,third]});await assertFails(submit(id,patch));}
 const one='selected-one-extra';await source(one,{additionalImages:[second,third]});await assertSucceeds(submit(one,{imageData:third,selectedPhotoIndexes:[2]}));
 const tokenId='same-submission-id';await source(tokenId);await assertSucceeds(submit(tokenId,{selectedPhotoIndexes:[0],submissionId:'stable-request'}));await assertFails(submit(tokenId,{selectedPhotoIndexes:[0],submissionId:'stable-request',publicNote:'다른 내용'}));
 const all='selected-all-three';await source(all,{additionalImages:[second,third]});await assertSucceeds(submit(all,{selectedPhotoIndexes:[0,1,2],additionalImages:[second,third]}));await assertSucceeds(approval(all,'reviewer-a','approved',{additionalImages:[second,third]}));const clear=writeBatch(db('author'));clear.update(refs(db('author'),all).s,{status:'withdrawn'});clear.delete(refs(db('author'),all).pub);await assertSucceeds(clear.commit());
 const missing='missing-extra';await source(missing);await assertFails(submit(missing,{imageData:third,selectedPhotoIndexes:[2]}));
});
test('editing a shared album atomically withdraws its review and public snapshot',async()=>{
 const id='edited-shared-album';await source(id,{additionalImages:['data:image/jpeg;base64,/9j/AP/Z']});await submit(id);await assertSucceeds(approval(id));
 const database=db('author'),r=refs(database,id);
 function edit(withdraw){const batch=writeBatch(database);batch.update(r.o,{revision:2,updatedAt:2});batch.set(r.p,{ownerId:'author',schemaVersion:3,imageData,lastEditId:'album-edit'});if(withdraw){batch.update(r.s,{status:'withdrawn'});batch.delete(r.pub);}return batch.commit();}
 await assertFails(edit(false));await assertSucceeds(edit(true));
 assert.equal((await getDoc(r.s)).data().status,'withdrawn');
 await assertFails(getDoc(r.pub));
 await env.withSecurityRulesDisabled(async context=>{assert.equal((await getDoc(refs(context.firestore(),id).pub)).exists(),false);});
 const saved=(await getDoc(r.p)).data();assert.equal(saved.imageData,imageData);assert.equal(saved.additionalImages,undefined);
});
test('active center list is publicly readable; grants cannot be self-created',async()=>{const anon=env.unauthenticatedContext().firestore();await assertSucceeds(getDocs(query(collection(anon,'forestCenters'),where('active','==',true))));await assertFails(setDoc(doc(db('author'),'forestReviewerGrants','author','centers','a'),{active:true}));await assertFails(updateDoc(doc(db('author'),'forestCenters','a'),{active:true}));});
test('share request contains verified photo/name snapshot, no private coordinates',async()=>{await source('pending');await assertSucceeds(getDoc(refs(db('author'),'pending').s));await assertSucceeds(submit('pending'));const s=(await getDoc(refs(db('author'),'pending').s)).data();assert.equal('location' in s,false);assert.equal('description' in s,false);assert.equal(s.publicNote,'공개 메모');});
test('unapproved request and photo cannot be read by visitors or other users',async()=>{const anon=env.unauthenticatedContext().firestore();await assertFails(getDoc(refs(anon,'pending').s));await assertFails(getDoc(refs(db('other'),'pending').s));const s=await getDocs(query(collection(anon,'forestPublicObservations'),where('centerId','==','a')));assert.equal(s.size,0);});
test('institution reviewer reads queue snapshot but cannot read personal source',async()=>{await assertSucceeds(getDocs(query(collection(db('reviewer-a'),'forestShareRequests'),where('centerId','==','a'),where('status','==','pending'))));await assertFails(getDoc(refs(db('reviewer-a'),'pending').o));await assertFails(getDoc(refs(db('reviewer-a'),'pending').p));await assertFails(getDoc(refs(db('reviewer-b'),'pending').s));});
test('author cannot publish, and different institution cannot approve',async()=>{await assertFails(approval('pending','author'));await assertFails(approval('pending','reviewer-b'));});
test('forged snapshot, injected exact location and audit-free approvals are denied',async()=>{await source('forged');await assertFails(submit('forged',{name:'다른 식물'}));await assertFails(submit('forged',{imageData:'data:image/jpeg;base64,AAAA'}));await assertFails(submit('forged',{location:{lat:37,lng:127}}));await assertFails(approval('pending','reviewer-a','approved',{ownerId:'author'}));await assertFails(approval('pending','reviewer-a','approved',{institutionLocation:base.location}));await assertFails(approval('pending','reviewer-a','approved',{},false));});
test('approval publishes allowed fields and immutable review history atomically',async()=>{await assertSucceeds(approval('pending'));const anon=env.unauthenticatedContext().firestore(),data=(await getDoc(refs(anon,'pending').pub)).data();assert.deepEqual(Object.keys(data).sort(),Object.keys(publication()).sort());assert.deepEqual(data.institutionLocation,{lat:35,lng:126});assert.equal('ownerId' in data,false);await assertFails(approval('pending'));});
test('old client cannot edit approved source without withdrawal',async()=>{await assertFails(updateDoc(refs(db('author'),'pending').o,{name:'변경',revision:2,updatedAt:2}));});
test('owner withdrawal removes public photo copy and preserves private original',async()=>{const database=db('author'),r=refs(database,'pending'),b=writeBatch(database);b.update(r.s,{status:'withdrawn'});b.delete(r.pub);await assertSucceeds(b.commit());assert.equal((await getDoc(r.o)).exists(),true);const anon=env.unauthenticatedContext().firestore();assert.equal((await getDocs(query(collection(anon,'forestPublicObservations'),where('centerId','==','a')))).size,0);});
test('approval after pending source mutation/withdrawal is denied',async()=>{await source('stale');await submit('stale');const database=db('author'),r=refs(database,'stale'),b=writeBatch(database);b.update(r.o,{name:'수정',revision:2,updatedAt:2});b.update(r.s,{status:'withdrawn'});b.delete(r.pub);await assertSucceeds(b.commit());await assertFails(approval('stale'));await assertFails(submit('stale'));});
test('rejection provides reason without publishing and author can resubmit',async()=>{await source('reject');await submit('reject');await assertSucceeds(approval('reject','reviewer-a','rejected'));assert.equal((await getDoc(refs(db('author'),'reject').s)).data().status,'rejected');await assertSucceeds(submit('reject'));});
test('review history cannot be edited/deleted by author or reviewer',async()=>{const database=db('reviewer-a');const reviews=await getDocs(collection(database,'forestShareRequests','reject','reviews'));assert.equal(reviews.size,1);await assertFails(updateDoc(reviews.docs[0].ref,{reason:'덮어쓰기'}));await assertFails(deleteDoc(reviews.docs[0].ref));});
test('public copies cannot be silently removed while request remains approved',async()=>{await source('guard');await submit('guard');await assertSucceeds(approval('guard'));await assertFails(deleteDoc(refs(db('author'),'guard').pub));await assertFails(deleteDoc(refs(db('reviewer-a'),'guard').pub));});
test('source edit removes public copy in same atomic operation',async()=>{const database=db('author'),r=refs(database,'guard'),b=writeBatch(database);b.update(r.o,{name:'수정된 소나무',revision:2,updatedAt:2});b.update(r.s,{status:'withdrawn'});b.delete(r.pub);await assertSucceeds(b.commit());assert.equal((await getDocs(query(collection(env.unauthenticatedContext().firestore(),'forestPublicObservations'),where('centerId','==','a')))).size,0);});

test('old review ID cannot be reused for a new approval',async()=>{const database=db('reviewer-a'),r=refs(database,'reject'),old=await getDocs(collection(database,'forestShareRequests','reject','reviews')),b=writeBatch(database);b.update(r.s,{status:'approved',reviewReason:'새 승인',reviewedBy:'reviewer-a',reviewedAt:serverTimestamp(),reviewId:old.docs[0].id});b.set(r.pub,publication());await assertFails(b.commit());});

test('bound institution cannot be replaced by another institution in a share submission',async()=>{
 const database=db('author'),r=refs(database,'bound-share'),b=writeBatch(database);
 b.set(r.o,{...base,centerId:'a'});b.set(r.p,{ownerId:'author',schemaVersion:3,imageData});await assertSucceeds(b.commit());
 await assertFails(submit('bound-share',{centerId:'b',centerName:'기관 B'}));
 await assertSucceeds(submit('bound-share'));
});
test('changing observation institution withdraws existing sharing before new submission',async()=>{
 const database=db('author'),r=refs(database,'bound-share');
 await assertFails(updateDoc(r.o,{centerId:'b',centerName:'기관 B',revision:2,updatedAt:2}));
 const b=writeBatch(database);b.update(r.o,{centerId:'b',centerName:'기관 B',revision:2,updatedAt:2});b.update(r.s,{status:'withdrawn'});b.delete(r.pub);await assertSucceeds(b.commit());
 await assertFails(submit('bound-share',{originalRevision:2}));
 await assertSucceeds(submit('bound-share',{centerId:'b',centerName:'기관 B',originalRevision:2}));
});

test('additional private photos never appear in the reviewed or public cover snapshot',async()=>{
 const extra='data:image/jpeg;base64,/9j/AP/Z';await source('private-album',{additionalImages:[extra]});
 await assertSucceeds(submit('private-album'));
 const request=(await getDoc(refs(db('author'),'private-album').s)).data();assert.equal(request.imageData,imageData);assert.equal(request.additionalImages,undefined);
 await assertFails(submit('private-album',{additionalImages:[extra]}));
 await assertSucceeds(approval('private-album'));
 const visitor=env.unauthenticatedContext().firestore();const data=(await getDoc(refs(visitor,'private-album').pub)).data();assert.equal(data.imageData,imageData);assert.equal(data.additionalImages,undefined);
 await assertFails(getDoc(refs(visitor,'private-album').p));await assertFails(getDoc(refs(db('reviewer-a'),'private-album').p));
});
