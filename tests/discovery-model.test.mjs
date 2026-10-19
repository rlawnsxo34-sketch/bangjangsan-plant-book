import {test} from 'node:test';
import assert from 'node:assert/strict';
import {summarizeDiscoveries,matchesObservation,savedDate} from '../src/discovery-model.js';
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
