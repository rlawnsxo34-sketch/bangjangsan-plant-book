import {validCenterId} from './center-model.js';
import {EXPERIENCE} from './experience-data.js';
export const VISIT_NOTE_LIMIT=300;
const treeIds=new Set(EXPERIENCE.trees.map(t=>t.id));
export function newVisit(centerId,now=Date.now()){
 if(!validCenterId(centerId)||!Number.isSafeInteger(now)||now<=0)throw new Error('관찰 기관과 시작 시각을 확인해주세요.');
 return {centerId,startedAt:now,entries:{}};
}
export function updateVisit(visit,treeId,patch){
 if(!visit||!validCenterId(visit.centerId)||!treeIds.has(treeId))throw new Error('관찰 대상을 확인해주세요.');
 const old=visit.entries[treeId]||{note:'',observed:false};
 const next={note:typeof patch.note==='string'?patch.note.slice(0,VISIT_NOTE_LIMIT):old.note,observed:typeof patch.observed==='boolean'?patch.observed:old.observed};
 return {...visit,entries:{...visit.entries,[treeId]:next}};
}
export function hasVisit(visit){return EXPERIENCE.trees.some(t=>{const row=visit?.entries?.[t.id];return !!row&&(row.observed||!!row.note?.trim());});}
export function visitRows(visit){return EXPERIENCE.trees.map(tree=>({tree,note:visit?.entries?.[tree.id]?.note||'',observed:visit?.entries?.[tree.id]?.observed===true})).filter(row=>row.observed||row.note.trim());}
export function visitText(visit,centerName){
 if(typeof centerName!=='string'||centerName.length>80)throw new Error('기관명을 확인해주세요.');
 const rows=visitRows(visit);
 if(!rows.length)throw new Error('관찰 표시나 메모를 하나 남겨주세요.');
 const date=new Date(visit.startedAt).toLocaleDateString('ko-KR',{timeZone:'Asia/Seoul',year:'numeric',month:'long',day:'numeric'});
 return ['ㅇㄱㅁㅇ · 오늘 내가 발견한 특징',`선택한 숲체원: ${centerName}`,`시작한 날: ${date}`,EXPERIENCE.title,'나무 살펴보기 시범 체험 · 내가 적은 기록이며, 방문이나 식물 이름을 증명하지 않아요.','',...rows.flatMap(({tree,note,observed})=>[`${tree.name} (${tree.scientificName})`,`살펴본 표시: ${observed?'살펴봤다고 표시했어요 · 이름이 맞는지는 확인이 필요해요':'표시하지 않음'}`,`내가 적은 글: ${note.trim()||'작성하지 않았어요.'}`,'']), '정확한 위치, 사진, 로그인 정보는 이 파일에 넣지 않았어요.'].join('\n');
}
export function experienceLink(base,centerId){
 if(!validCenterId(centerId))throw new Error('기관 ID를 확인해주세요.');
 const url=new URL(base);if(!['http:','https:'].includes(url.protocol)||url.username||url.password)throw new Error('사이트 주소를 확인해주세요.');
 url.search='';url.hash='';url.searchParams.set('center',centerId);url.searchParams.set('view','explore');return url.href;
}
export function readExperienceEntry(search){
 if(typeof search!=='string'||search.length>1024)return null;
 const p=new URLSearchParams(search),id=p.get('center');
 if(p.getAll('center').length!==1||!validCenterId(id)||(p.has('view')&&p.get('view')!=='explore'))return null;
 return {centerId:id};
}
export function resolveExperienceEntry(entry,centers){return entry?centers.find(c=>c.id===entry.centerId)||null:null;}
