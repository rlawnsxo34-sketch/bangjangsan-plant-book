import test from 'node:test';
import assert from 'node:assert/strict';
import {validTreePlace,mapTree,groupTreePlaces} from '../src/tree-map-model.js';
test('public map rows are bounded and a withdrawn remote coordinate overrides legacy fallback',()=>{
 const row={id:'hinoki',label:'공개 관찰 장소',coordinates:{lat:35,lng:126},revision:1,privateMemo:'excluded'};
 assert.deepEqual(validTreePlace(row),{id:row.id,label:row.label,coordinates:row.coordinates,revision:1});
 for(const patch of [{id:'unknown'},{label:''},{coordinates:{lat:'35',lng:126}},{revision:0},{coordinates:{lat:95,lng:126}}])assert.throws(()=>validTreePlace({...row,...patch}));
 const tree={id:'hinoki',name:'편백나무'};assert.equal(mapTree(tree,'other',[]).label,'');
 const removed=mapTree(tree,'jangseong',[{...row,coordinates:null}]);assert.equal(removed.coordinates,null);assert.equal(removed.label,row.label);
});

test('place grouping uses matching descriptions within one institution without inventing coordinates',()=>{
 const trees=[
 {id:'hinoki',name:'편백나무',label:' 숙소동1  난간 ',coordinates:{lat:35,lng:126}},
 {id:'galcham-oak',name:'갈참나무',label:'숙소동1 난간',coordinates:{lat:35.00001,lng:126}},
 {id:'japanese-maple',name:'단풍나무',label:'숙소동2 시작점',coordinates:{lat:35,lng:126}}
 ];
 const before=JSON.stringify(trees),groups=groupTreePlaces(trees);assert.equal(groups.length,2);assert.equal(groups[0].trees.length,2);assert.equal(groups[0].pinnedCount,2);assert.equal(groups[0].sourceTreeId,'hinoki');assert.deepEqual(groups[0].coordinates,trees[0].coordinates);assert.equal(JSON.stringify(trees),before);
 const withdrawn=groupTreePlaces(trees.map((t,i)=>({...t,coordinates:i===0?null:t.coordinates})));
 assert.equal(withdrawn[0].sourceTreeId,'galcham-oak');assert.deepEqual(withdrawn[0].coordinates,trees[1].coordinates);
 const empty=groupTreePlaces(trees.map(t=>({...t,coordinates:null})));assert.equal(empty.length,2);assert.ok(empty.every(p=>p.coordinates===null&&p.pinnedCount===0));
 const unknown=groupTreePlaces(trees.map(t=>({...t,label:'',coordinates:{lat:'35',lng:126}})));assert.equal(unknown.length,3);assert.ok(unknown.every(p=>p.coordinates===null));
 assert.deepEqual(groupTreePlaces([]),[]);
});
