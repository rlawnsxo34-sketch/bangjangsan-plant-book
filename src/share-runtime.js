import {doc,collection,query,where,orderBy,limit,startAfter,getDocsFromServer,getDocFromServer,runTransaction,serverTimestamp} from 'firebase/firestore';
import {validatePhoto} from './cloud-model.js';
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
  async submit(uid,row,centerId,publicNote){logged(uid);if(!centerId||typeof publicNote!=='string'||publicNote.length>1000)throw new Error('공유 기관과 공개 메모를 확인해주세요.');const refs=shareRefs(db,row.id);
   return runTransaction(db,async tx=>{logged(uid);const [source,photo,center,previous]=await Promise.all([tx.get(doc(db,'forestDevUsers',uid,'observations',row.id)),tx.get(doc(db,'forestDevUsers',uid,'photos',row.id)),tx.get(doc(db,'forestCenters',centerId)),tx.get(refs.request)]);
    if(!source.exists()||!photo.exists())throw new Error('개인 기록 또는 사진이 없습니다. 계정 도감을 새로고침해주세요.');if(source.data().revision!==row.revision)throw new Error('기록이 변경되었습니다. 최신 기록을 확인한 뒤 다시 공유해주세요.');if(!center.exists()||!center.data().active)throw new Error('공유할 기관을 사용할 수 없습니다.');if(previous.exists()&&previous.data().ownerId!==uid)throw new Error('공유 ID가 충돌했습니다. 관리자에게 문의해주세요.');
    if(previous.exists()&&previous.data().status==='pending'&&previous.data().originalRevision===row.revision){if(previous.data().centerId===centerId&&previous.data().publicNote===publicNote)return;throw new Error('이미 검토 대기 중입니다. 내용을 바꾸려면 신청을 철회한 뒤 다시 신청해주세요.');}
    const s=source.data(),imageData=photo.data().imageData;if(s.centerId&&s.centerId!==centerId)throw new Error('기록한 숲체원과 공유할 숲체원이 다릅니다. 기록의 기관을 확인해주세요.');validatePhoto(imageData);
    tx.set(refs.request,{ownerId:uid,observationId:row.id,centerId,centerName:center.data().name,name:s.name,publicNote,imageData,originalRevision:s.revision,submittedAt:serverTimestamp(),status:'pending',reviewReason:'',reviewedAt:null,reviewedBy:null,reviewId:null});tx.delete(refs.public);
   });},
  async withdraw(uid,id){logged(uid);const refs=shareRefs(db,id);return runTransaction(db,async tx=>{logged(uid);const s=await tx.get(refs.request);if(!s.exists())return;if(s.data().ownerId!==uid)throw new Error('본인의 공유 신청만 철회할 수 있습니다.');invalidateShare(tx,refs,s);});},
  async review(uid,row,decision,reason){logged(uid);if(!['approved','rejected'].includes(decision)||typeof reason!=='string'||!reason.trim()||reason.length>500)throw new Error('검토 사유를 1~500자로 입력해주세요.');const refs=shareRefs(db,row.id),reviewId=crypto.randomUUID();
   return runTransaction(db,async tx=>{logged(uid);const s=await tx.get(refs.request);if(!s.exists()||s.data().status!=='pending'||s.data().originalRevision!==row.originalRevision||s.data().submittedAt?.toMillis()!==row.submittedAt?.toMillis())throw new Error('이미 처리되었거나 새로 신청된 기록입니다. 목록을 새로고침해주세요.');const request=s.data();const center=await tx.get(doc(db,'forestCenters',request.centerId));if(!center.exists()||!center.data().active)throw new Error('기관이 비활성화되었습니다.');
    tx.update(refs.request,{status:decision,reviewReason:reason.trim(),reviewedAt:serverTimestamp(),reviewedBy:uid,reviewId});
    tx.set(doc(db,'forestShareRequests',row.id,'reviews',reviewId),{decision,reason:reason.trim(),reviewerId:uid,originalRevision:request.originalRevision,reviewedAt:serverTimestamp()});
    if(decision==='approved')tx.set(refs.public,{centerId:request.centerId,centerName:request.centerName,name:request.name,publicNote:request.publicNote,imageData:request.imageData,institutionLocation:center.data().mapCenter||null,locationLabel:'기관 위치 · 관찰 지점 아님',reviewScope:'담당자 공유 검토 · 식물 종 확정 아님',publishedAt:serverTimestamp()});else tx.delete(refs.public);
   });}
 };
}
