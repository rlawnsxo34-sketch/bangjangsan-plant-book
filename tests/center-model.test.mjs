import {test} from 'node:test';
import assert from 'node:assert/strict';
import {activeCenters,readCenterPreference,saveCenterPreference,institutionFields,canShareAt} from '../src/center-model.js';
import {validateDraft} from '../src/cloud-model.js';
test('institution list includes active valid rows without granting roles or inventing centers',()=>{
 const list=activeCenters([{id:'jangseong',name:'장성',active:true,role:'reviewer'},{id:'jangseong',name:'중복',active:true},{id:'inactive',name:'비활성',active:false},{id:'bad/id',name:'오류',active:true},{id:'b',name:'다른 기관',active:true,isDemo:true}]);
 assert.equal(list.length,2);assert.ok(list.every(c=>!('role' in c)));assert.ok(list.some(c=>c.isDemo));
 assert.deepEqual(activeCenters(undefined),[]);
});
test('only an institution ID is remembered; blocked storage does not prevent selecting',()=>{
 let stored='';const storage={getItem:()=>stored,setItem:(key,value)=>{stored=value;}};
 saveCenterPreference(storage,'jangseong');assert.equal(readCenterPreference(storage),'jangseong');assert.equal(stored,'jangseong');
 const denied={getItem(){throw new Error('denied');},setItem(){throw new Error('denied');}};
 assert.equal(readCenterPreference(denied),'');assert.doesNotThrow(()=>saveCenterPreference(denied,'jangseong'));
});
test('draft institution context uses stable ID and official name, without assuming a GPS location',()=>{
 assert.deepEqual(institutionFields({id:'a',name:'기관 A',active:true,mapCenter:{lat:35,lng:126}}),{centerId:'a',centerName:'기관 A'});
 assert.throws(()=>institutionFields(null));assert.throws(()=>institutionFields({id:'a/b',name:'기관'}));
 const draft={id:'test',name:'소나무',description:'',centerName:'기관 A',centerId:'a',createdAt:1,updatedAt:1,location:null,locationSource:'center_only'};
 assert.equal(validateDraft(draft).centerId,'a');assert.throws(()=>validateDraft({...draft,centerId:'a/b'}));
 const {centerId,...legacy}=draft;assert.doesNotThrow(()=>validateDraft(legacy));
});
test('bound records share only to their own institution while legacy records remain explicitly selectable',()=>{
 assert.equal(canShareAt({centerId:'a'},'a'),true);assert.equal(canShareAt({centerId:'a'},'b'),false);
 assert.equal(canShareAt({centerName:'이전 수기 기관'},'a'),true);
});
