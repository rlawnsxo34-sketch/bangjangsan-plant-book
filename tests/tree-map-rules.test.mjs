import {readFile} from 'node:fs/promises';
import {before,after,test} from 'node:test';
import assert from 'node:assert/strict';
import {initializeTestEnvironment,assertSucceeds,assertFails} from '@firebase/rules-unit-testing';
import {doc,setDoc,getDoc,getDocs,collection,serverTimestamp,deleteDoc} from 'firebase/firestore';
import {createTreePlaces} from '../src/tree-place-runtime.js';
let env;const databases=new Map();const db=(uid,provider='password')=>{const key=(uid||'public')+':'+provider;if(!databases.has(key))databases.set(key,uid?env.authenticatedContext(uid,{firebase:{sign_in_provider:provider}}).firestore():env.unauthenticatedContext().firestore());return databases.get(key);};
const ref=(database,c='a',tree='hinoki')=>doc(database,'forestCenters',c,'treePlaces',tree);
const value=()=>({label:'공개 관찰 장소',coordinates:{lat:35,lng:126},revision:1,updatedAt:serverTimestamp()});
before(async()=>{env=await initializeTestEnvironment({projectId:'demo-forest-book',firestore:{host:'127.0.0.1',port:8080,rules:await readFile('firestore.rules','utf8')}});await env.clearFirestore();await env.withSecurityRulesDisabled(async c=>{const admin=c.firestore();for(const [id,active]of [['a',true],['b',true],['off',false]])await setDoc(doc(admin,'forestCenters',id),{name:id,active});await setDoc(doc(admin,'forestReviewerGrants','reviewer','centers','a'),{active:true});});});
after(async()=>env?.cleanup());
test('only password reviewers of the active institution can publish public place fields',async()=>{
 await assertFails(setDoc(ref(db()),value()));await assertFails(setDoc(ref(db('visitor')),value()));await assertFails(setDoc(ref(db('reviewer','anonymous')),value()));await assertFails(setDoc(ref(db('reviewer'),'b'),value()));await assertFails(setDoc(ref(db('reviewer'),'off'),value()));
 await assertSucceeds(setDoc(ref(db('reviewer')),value()));await assertSucceeds(getDoc(ref(db())));await assertSucceeds(getDocs(collection(db(),'forestCenters','a','treePlaces')));await assertFails(getDocs(collection(db(),'forestCenters','off','treePlaces')));
 await assertFails(setDoc(ref(db('reviewer'),'a','unknown'),value()));await assertFails(setDoc(ref(db('reviewer'),'a','galcham-oak'),{...value(),email:'private@example.test'}));
 await assertFails(setDoc(ref(db('reviewer'),'a','galcham-oak'),{...value(),coordinates:{lat:91,lng:126}}));await assertFails(setDoc(ref(db('reviewer'),'a','galcham-oak'),{...value(),coordinates:{lat:35,lng:126,private:true}}));await assertFails(setDoc(ref(db('reviewer'),'a','galcham-oak'),{...value(),updatedAt:1}));
 await assertFails(deleteDoc(ref(db('reviewer'))));
});
test('actual repository rejects stale edits, supports explicit unpublishing, and rejects account changes',async()=>{
 const auth={currentUser:{uid:'reviewer'}},repo=createTreePlaces(db('reviewer'),auth);
 const row=await assertSucceeds(repo.save('reviewer','a','galcham-oak',{label:'새 장소',coordinates:{lat:35.1,lng:126.1}},0));assert.equal(row.revision,1);
 await assert.rejects(repo.save('reviewer','a','galcham-oak',{label:'다른 장소',coordinates:{lat:35,lng:126}},0),/다른 담당자/);
 const removed=await assertSucceeds(repo.save('reviewer','a','galcham-oak',{label:'새 장소',coordinates:null},1));assert.equal(removed.coordinates,null);assert.equal(removed.revision,2);
 const visitor=createTreePlaces(db(),{currentUser:null});assert.equal((await visitor.list('a')).find(x=>x.id==='galcham-oak').coordinates,null);
 auth.currentUser=null;await assert.rejects(repo.save('reviewer','a','hinoki',{label:'x',coordinates:{lat:35,lng:126}},1),/계정/);
});
