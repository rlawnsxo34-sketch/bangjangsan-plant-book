import {test} from 'node:test';
import assert from 'node:assert/strict';
import {summarizeDiscoveries,matchesObservation,savedDate,isUnnamedObservation,filterDiscoveries,sortObservations} from '../src/discovery-model.js';
import {applyTextEdit} from '../src/cloud-model.js';
const observation=(id,scientificName,createdAt=1000,patch={})=>({id,name:'소나무',centerName:'기관 A',description:'',createdAt,...(scientificName?{aiSelection:{provider:'plantnet',scientificName,commonName:'',score:.8,selectedAt:1}}:{}),...patch});
test('same selected scientific name groups across institutions; manually entered names do not merge',()=>{
 const records=[observation('one','Pinus densiflora',1000),observation('two',' Pinus   densiflora ',2000,{centerName:'기관 B'}),observation('manual-one',null,3000),observation('manual-two',null,4000)];
 const before=JSON.stringify(records),result=summarizeDiscoveries(records);
 assert.equal(result.recordCount,4);assert.equal(result.candidateCount,1);assert.equal(result.unclassifiedCount,2);assert.equal(result.groups[0].name,'소나무');assert.equal(result.groups[0].records.length,2);assert.deepEqual(result.groups[0].centers,['기관 A','기관 B']);assert.equal(JSON.stringify(records),before);
});
test('different taxa and user names are never guessed into the same candidate',()=>{
 const result=summarizeDiscoveries([observation('a','Pinus densiflora'),observation('b','Pinus densiflora var. test'),observation('c','Pinus rigida'),observation('d',null,1000,{name:'Pinus densiflora'})]);
 assert.equal(result.candidateCount,3);assert.equal(result.unclassifiedCount,1);
});
test('recent discoveries use earliest remaining save, not latest repeat observation',()=>{
 const result=summarizeDiscoveries([observation('old','Pinus densiflora',1000),observation('repeat','Pinus densiflora',9000),observation('new','Ginkgo biloba',5000)]);
 assert.equal(result.recent[0].scientificName,'Ginkgo biloba');
 const pine=result.groups.find(g=>g.scientificName==='Pinus densiflora');assert.equal(pine.firstSavedAt,1000);assert.equal(pine.lastSavedAt,9000);
});
test('empty data and unknown dates do not fabricate discoveries or a completion target',()=>{
 const empty=summarizeDiscoveries([]);assert.equal(empty.recordCount,0);assert.equal(empty.candidateCount,0);assert.deepEqual(empty.recent,[]);assert.equal('percentage' in empty,false);
 const unknown=summarizeDiscoveries([observation('invalid-date','Unknown species',NaN)]);assert.equal(unknown.recent.length,0);assert.equal(savedDate(NaN),'저장일 미상');
});
test('search supports scientific and Korean candidate names and institutions without altering the source data',()=>{
 const row=observation('a','Pinus densiflora',1000,{name:'Japanese red pine',centerName:'국립장성숲체원'});
 for(const query of ['소나무','PINUS','장성','red pine'])assert.equal(matchesObservation(row,query),true);
 assert.equal(matchesObservation(row,'은행나무'),false);
});
test('memo and institution edits preserve an unchanged candidate, while a changed name becomes unclassified',()=>{
 const old=observation('a','Pinus densiflora',1000,{centerId:'a',ownerId:'owner'});
 for(const patch of [{description:'메모 수정'},{name:old.name,centerId:'b',centerName:'기관 B'}]){
  const next=applyTextEdit(old,patch);assert.deepEqual(next.aiSelection,old.aiSelection);assert.equal(summarizeDiscoveries([next]).candidateCount,1);
 }
 const renamed=applyTextEdit(old,{name:'다시 확인할 식물'});assert.equal('aiSelection' in renamed,false);assert.equal(summarizeDiscoveries([renamed]).unclassifiedCount,1);
 const protectedFields=applyTextEdit(old,{ownerId:'attacker',aiSelection:{provider:'fake'}});assert.equal(protectedFields.ownerId,'owner');assert.deepEqual(protectedFields.aiSelection,old.aiSelection);
});

test('the unnamed filter recognizes only the explicit saved label and composes with institution search',()=>{
 const rows=[observation('a',null,1,{name:'이름 모름',centerName:'장성'}),observation('b',null,2,{name:' 이름  모름 ',centerName:'다른 숲체원'}),observation('c',null,3,{name:'이름 모름이라고 적은 꽃'}),observation('d',null,4,{name:'소나무'}),observation('e',null,5,{name:''})];
 const before=JSON.stringify(rows);assert.deepEqual(filterDiscoveries(rows,'','unnamed').map(r=>r.id),['a','b']);assert.deepEqual(filterDiscoveries(rows,'장성','unnamed').map(r=>r.id),['a']);assert.equal(filterDiscoveries(rows,'소나무','unnamed').length,0);assert.equal(filterDiscoveries(rows,'소나무','all').length,1);assert.equal(isUnnamedObservation(null),false);assert.equal(isUnnamedObservation({name:'미확인'}),false);assert.equal(JSON.stringify(rows),before);
 const renamed=applyTextEdit(rows[0],{name:'편백나무'});assert.equal(isUnnamedObservation(renamed),false);assert.equal(renamed.description,rows[0].description);assert.equal(renamed.createdAt,rows[0].createdAt);assert.equal(summarizeDiscoveries([renamed]).candidateCount,0);
});

test('saved-date sorting is immutable, stable, and keeps missing dates at the end in both directions',()=>{
 const rows=[{id:'new',createdAt:9},{id:'missing',createdAt:null},{id:'old',createdAt:1},{id:'same',createdAt:9},{id:'invalid',createdAt:NaN}];const before=rows.map(r=>r.id);
 assert.deepEqual(sortObservations(rows).map(r=>r.id),['new','same','old','missing','invalid']);assert.deepEqual(sortObservations(rows,'oldest').map(r=>r.id),['old','new','same','missing','invalid']);assert.deepEqual(rows.map(r=>r.id),before);
});

test('name-source filtering uses saved candidate metadata and intersects unknown scope and search',()=>{
 const rows=[observation('ai','Pinus densiflora',1,{centerName:'장성'}),observation('typed',null,2,{centerName:'장성'}),observation('old',null,3,{name:'이름 모름'}),observation('invalid',null,4,{aiSelection:{provider:'other',scientificName:'Pinus densiflora'}})];
 const before=JSON.stringify(rows);
 assert.deepEqual(filterDiscoveries(rows,'','all','ai').map(r=>r.id),['ai']);
 assert.deepEqual(filterDiscoveries(rows,'','all','other').map(r=>r.id),['typed','old','invalid']);
 assert.deepEqual(filterDiscoveries(rows,'장성','all','other').map(r=>r.id),['typed']);
 assert.equal(filterDiscoveries(rows,'','unnamed','ai').length,0);
 assert.deepEqual(filterDiscoveries(rows,'','unnamed','other').map(r=>r.id),['old']);
 const renamed=applyTextEdit(rows[0],{name:'편백나무'});
 assert.equal(filterDiscoveries([renamed],'','all','ai').length,0);
 assert.equal(filterDiscoveries([renamed],'','all','other').length,1);
 assert.equal(filterDiscoveries(rows,'','all','unexpected').length,4);
 assert.equal(JSON.stringify(rows),before);
});
