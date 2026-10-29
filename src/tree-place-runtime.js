import {collection,doc,getDocsFromServer,runTransaction,serverTimestamp} from 'firebase/firestore';
import {validCenterId} from './center-model.js';
import {TREE_IDS,validTreePlace} from './tree-map-model.js';
import {placeCoordinates} from './observation-places.js';
export function createTreePlaces(db,auth){
 const owner=uid=>{if(!auth.currentUser||auth.currentUser.uid!==uid)throw new Error('계정이 변경됐어요. 다시 로그인해주세요.');};
 return {
  async list(centerId){if(!validCenterId(centerId))throw new Error('숲체원을 먼저 선택해주세요.');const result=await getDocsFromServer(collection(db,'forestCenters',centerId,'treePlaces'));return result.docs.filter(d=>TREE_IDS.includes(d.id)).map(d=>validTreePlace({...d.data(),id:d.id}));},
  async save(uid,centerId,treeId,{label,coordinates},revision){
   owner(uid);if(!validCenterId(centerId)||!TREE_IDS.includes(treeId)||typeof label!=='string'||!label.trim()||label.trim().length>160||!Number.isInteger(revision)||revision<0)throw new Error('나무와 장소 설명을 확인해주세요.');
   const point=coordinates===null?null:placeCoordinates(coordinates);if(coordinates!==null&&!point)throw new Error('지도에서 위치를 다시 골라주세요.');
   const ref=doc(db,'forestCenters',centerId,'treePlaces',treeId);
   const result=await runTransaction(db,async tx=>{owner(uid);const snap=await tx.get(ref);if((snap.exists()?snap.data().revision:0)!==revision)throw new Error('다른 담당자가 위치를 바꿨어요. 다시 불러온 뒤 확인해주세요.');const value={label:label.trim(),coordinates:point,revision:revision+1};tx.set(ref,{...value,updatedAt:serverTimestamp()});return {id:treeId,...value};});owner(uid);return result;
  }
 };
}
