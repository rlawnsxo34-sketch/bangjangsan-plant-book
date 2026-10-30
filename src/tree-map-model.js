import {placeCoordinates,observationPlace} from './observation-places.js';
export const TREE_IDS=['hinoki','galcham-oak','japanese-maple'];
export function validTreePlace(row){
 if(!row||!TREE_IDS.includes(row.id)||typeof row.label!=='string'||!row.label.trim()||row.label.length>160||!Number.isInteger(row.revision)||row.revision<1||!(row.coordinates===null||placeCoordinates(row.coordinates)))throw new Error('나무 위치 정보를 읽지 못했어요. 다시 불러와주세요.');
 return {id:row.id,label:row.label,coordinates:row.coordinates===null?null:placeCoordinates(row.coordinates),revision:row.revision};
}
export function mapTree(tree,centerId,rows){
 const remote=rows.find(row=>row.id===tree.id),local=observationPlace(centerId,tree.id);
 return {...tree,label:remote?.label??local?.label??'',coordinates:remote?remote.coordinates:local?.coordinates??null,revision:remote?.revision??0};
}
// Each call is scoped to the selected institution. Equal place descriptions
// form one visitor stop; coordinates never merge unrelated stops or get averaged.
export function groupTreePlaces(trees){
 const groups=new Map();
 for(const tree of trees){
  const label=typeof tree.label==='string'?tree.label.trim().replace(/\s+/g,' '):'';
  const id=label?'place:'+label:'tree:'+tree.id;
  if(!groups.has(id))groups.set(id,{id,label:label||'장소 안내 준비 중',trees:[],coordinates:null,sourceTreeId:null,pinnedCount:0});
  const group=groups.get(id),point=placeCoordinates(tree.coordinates);
  group.trees.push(tree);
  if(point){group.pinnedCount++;if(!group.coordinates){group.coordinates=point;group.sourceTreeId=tree.id;}}
 }
 return [...groups.values()].map(group=>({...group,name:group.label+' · 나무 '+group.trees.length+'종'}));
}
