import {recordPhotos} from './record-photos.js';
import {samePhotos} from './photo-edit-model.js';
import {selectedPhotos,sharedPhotoFields,samePhotoSelection,sameReviewSnapshot} from './share-photos.js';
import {doc,collection,query,where,orderBy,limit,startAfter,getDocsFromServer,getDocFromServer,runTransaction,serverTimestamp} from 'firebase/firestore';
export const shareRefs=(db,id)=>({request:doc(db,'forestShareRequests',id),public:doc(db,'forestPublicObservations',id)});
export function invalidateShare(tx,refs,snapshot){
 if(snapshot.exists()){tx.update(refs.request,{status:'withdrawn'});tx.delete(refs.public);}
}
export function createSharing(db,auth){
 const logged=uid=>{if(!auth.currentUser||auth.currentUser.uid!==uid)throw new Error('계정이 변경되었습니다. 다시 로그인해주세요.');};
 const rows=s=>s.docs.map(d=>({...d.data(),id:d.id}));
 return {
  async centers(){return rows(await getDocsFromServer(query(collection(db,'forestCenters'),where('active','==',true),limit(100))));},
  async grants(uid){logged(uid);const r=rows(await getDocsFromServer(collection(db,'forestReviewerGrants',uid,'centers')));logged(uid);return r.filter(x=>x.active===true).map(x=>x.id);},
  async mine(uid){logged(uid);const s=await getDocsFromServer(query(collection(db,'forestShareRequests'),where('ownerId','==',uid),orderBy('submittedAt','desc'),limit(50)));logged(uid);return rows(s);},
  async pending(uid,centerId){logged(uid);const s=await getDocsFromServer(query(collection(db,'forestShareRequests'),where('centerId','==',centerId),where('status','==','pending'),orderBy('submittedAt','desc'),limit(10)));logged(uid);return rows(s);},
  async publicPage(centerId,cursor=null){const clauses=[where('centerId','==',centerId),orderBy('publishedAt','desc'),limit(5)];if(cursor)clauses.push(startAfter(cursor));const s=await getDocsFromServer(query(collection(db,'forestPublicObservations'),...clauses));return{rows:rows(s),cursor:s.docs.at(-1)||null,hasMore:s.size===5};},
  async submit(uid,row,centerId,publicNote,selection){logged(uid);if(!centerId||typeof publicNote!=='string'||publicNote.length>1000)throw new Error('공유 기관과 공개 메모를 확인해주세요.');if(selection&&(typeof selection.submissionId!=='string'||!/^[A-Za-z0-9_-]{1,80}$/.test(selection.submissionId)))throw new Error('공유 요청을 다시 준비해주세요.');const refs=shareRefs(db,row.id);
   return runTransaction(db,async tx=>{logged(uid);const [source,photo,center,previous]=await Promise.all([tx.get(doc(db,'forestDevUsers',uid,'observations',row.id)),tx.get(doc(db,'forestDevUsers',uid,'photos',row.id)),tx.get(doc(db,'forestCenters',centerId)),tx.get(refs.request)]);
    if(!source.exists()||!photo.exists())throw new Error('개인 기록 또는 사진이 없습니다. 계정 도감을 새로고침해주세요.');if(source.data().revision!==row.revision)throw new Error('기록이 변경되었습니다. 최신 기록을 확인한 뒤 다시 공유해주세요.');if(!center.exists()||!center.data().active)throw new Error('공유할 기관을 사용할 수 없습니다.');if(previous.exists()&&previous.data().ownerId!==uid)throw new Error('공유 ID가 충돌했습니다. 관리자에게 문의해주세요.');
    if(selection&&selection.centerName!==center.data().name)throw new Error('숲체원 이름이 바뀌었어요. 기관 목록을 다시 확인하고 신청해주세요.');
    const sourcePhotos=recordPhotos(photo.data()),indexes=selection?.indexes??[0],images=selectedPhotos(sourcePhotos,indexes);
    if(selection&&!samePhotos(images,selection.images||[]))throw new Error('미리 본 사진과 저장된 사진이 달라졌어요. 사진을 다시 불러와 확인해주세요.');
    const fields={...sharedPhotoFields(images),...(selection?{selectedPhotoIndexes:[...indexes],submissionId:selection.submissionId}:{})};
    if(selection&&previous.exists()&&previous.data().submissionId===selection.submissionId){const old=previous.data();if(old.originalRevision!==row.revision||old.centerId!==centerId||old.publicNote!==publicNote||!samePhotoSelection(old,fields))throw new Error('같은 공유 요청의 내용이 달라졌어요. 미리보기를 다시 준비해주세요.');return {status:old.status,reused:true};}
    if(previous.exists()&&previous.data().status==='pending'&&previous.data().originalRevision===row.revision){if(!selection&&previous.data().centerId===centerId&&previous.data().publicNote===publicNote&&samePhotoSelection(previous.data(),fields))return {status:'pending',reused:true};throw new Error('이미 다른 내용으로 검토 대기 중이에요. 신청 상태를 확인하고 철회한 뒤 다시 신청해주세요.');}
    const s=source.data();if(s.centerId&&s.centerId!==centerId)throw new Error('기록한 숲체원과 공유할 숲체원이 다릅니다. 기록의 기관을 확인해주세요.');
    tx.set(refs.request,{ownerId:uid,observationId:row.id,centerId,centerName:center.data().name,name:s.name,publicNote,...fields,originalRevision:s.revision,submittedAt:serverTimestamp(),status:'pending',reviewReason:'',reviewedAt:null,reviewedBy:null,reviewId:null});tx.delete(refs.public);return {status:'pending',reused:false};
   });},
  async withdraw(uid,id){logged(uid);const refs=shareRefs(db,id);return runTransaction(db,async tx=>{logged(uid);const s=await tx.get(refs.request);if(!s.exists())return;if(s.data().ownerId!==uid)throw new Error('본인의 공유 신청만 철회할 수 있습니다.');invalidateShare(tx,refs,s);});},
  async review(uid,row,decision,reason){logged(uid);if(!['approved','rejected'].includes(decision)||typeof reason!=='string'||!reason.trim()||reason.length>500)throw new Error('검토 사유를 1~500자로 입력해주세요.');const refs=shareRefs(db,row.id),reviewId=crypto.randomUUID();
   return runTransaction(db,async tx=>{logged(uid);const s=await tx.get(refs.request);if(!s.exists()||s.data().status!=='pending'||!sameReviewSnapshot(s.data(),row))throw new Error('이미 처리되었거나 새로 신청된 기록입니다. 목록을 새로고침해주세요.');const request=s.data();const center=await tx.get(doc(db,'forestCenters',request.centerId));if(!center.exists()||!center.data().active)throw new Error('기관이 비활성화되었습니다.');
    tx.update(refs.request,{status:decision,reviewReason:reason.trim(),reviewedAt:serverTimestamp(),reviewedBy:uid,reviewId});
    tx.set(doc(db,'forestShareRequests',row.id,'reviews',reviewId),{decision,reason:reason.trim(),reviewerId:uid,originalRevision:request.originalRevision,reviewedAt:serverTimestamp()});
    if(decision==='approved')tx.set(refs.public,{centerId:request.centerId,centerName:request.centerName,name:request.name,publicNote:request.publicNote,...sharedPhotoFields([request.imageData,...(request.additionalImages||[])]),institutionLocation:center.data().mapCenter||null,locationLabel:'기관 위치 · 관찰 지점 아님',reviewScope:'담당자 공유 검토 · 식물 종 확정 아님',publishedAt:serverTimestamp()});else tx.delete(refs.public);
   });}
 };
}
