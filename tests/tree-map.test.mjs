import test from 'node:test';
import assert from 'node:assert/strict';
import {validTreePlace,mapTree} from '../src/tree-map-model.js';
test('public map rows are bounded and a withdrawn remote coordinate overrides legacy fallback',()=>{
 const row={id:'hinoki',label:'공개 관찰 장소',coordinates:{lat:35,lng:126},revision:1,privateMemo:'excluded'};
 assert.deepEqual(validTreePlace(row),{id:row.id,label:row.label,coordinates:row.coordinates,revision:1});
 for(const patch of [{id:'unknown'},{label:''},{coordinates:{lat:'35',lng:126}},{revision:0},{coordinates:{lat:95,lng:126}}])assert.throws(()=>validTreePlace({...row,...patch}));
 const tree={id:'hinoki',name:'편백나무'};assert.equal(mapTree(tree,'other',[]).label,'');
 const removed=mapTree(tree,'jangseong',[{...row,coordinates:null}]);assert.equal(removed.coordinates,null);assert.equal(removed.label,row.label);
});
