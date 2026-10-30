import TreeMapPanel from './TreeMapPanel.jsx';
import VisitNoteFields from './VisitNoteFields.jsx';
import {reactionLabels} from './visit-reactions.js';
import ObservationPlace from './ObservationPlace.jsx';
import {observationPlace,observationPlaceNotice,observationPlaceReview} from './observation-places.js';
import TreePhotos from './TreePhotos.jsx';
import {experiencePhotos} from './experience-photos.js';
import RecordCardExport from './RecordCardExport.jsx';
import VisitTextExport from './VisitTextExport.jsx';
import {readableTree} from './easy-language.js';
import React,{useEffect,useRef,useState} from 'react';
import {Leaf,Camera,Notebook,ArrowRight} from '@phosphor-icons/react';
import {EXPERIENCE} from './experience-data.js';
import {updateVisit,visitRows,hasVisit} from './experience-model.js';
function TreeThumbnail({photo}){
 const[failed,setFailed]=useState(false);
 return <>{photo&&!failed?<img src={photo.src} alt="" loading="lazy" decoding="async" onError={()=>setFailed(true)}/>:<Leaf size={30} aria-hidden="true"/>}<span>{photo&&!failed?'참고 사진':'사진 준비 중'}{photo?.credit&&<> · {photo.credit}</>}</span></>;
}
export default function ExperiencePanel({center,visit,onChange,onCapture,onPanelState}){
 const[mapOpen,setMapOpen]=useState(false),[mapState,setMapState]=useState({busy:false,dirty:false});
 const[mapTreeId,setMapTreeId]=useState(EXPERIENCE.trees[0].id),[expandedTreeId,setExpandedTreeId]=useState(null);
 const hasPlaces=EXPERIENCE.trees.some(tree=>observationPlace(center.id,tree.id));
 const[summary,setSummary]=useState(false),[notice,setNotice]=useState(''),[cardBusy,setCardBusy]=useState(false);
 const activities=useRef(null),heading=useRef(null),initialized=useRef(false);
 const rows=visitRows(visit),observed=rows.filter(x=>x.observed).length;
 useEffect(()=>{onPanelState({busy:cardBusy||mapState.busy,dirty:mapState.dirty});return()=>onPanelState({busy:false,dirty:false});},[cardBusy,mapState,onPanelState]);
 useEffect(()=>{if(initialized.current)heading.current?.focus();initialized.current=true;},[summary,mapOpen]);
 function leaveMap(action){if(mapState.busy)return;if(mapState.dirty&&!window.confirm('저장하지 않은 위치 선택을 버릴까요?'))return;action();}
 function startLooking(){activities.current?.scrollIntoView?.({block:'start',behavior:'instant'});activities.current?.focus();}
 function change(treeId,patch){onChange(current=>updateVisit(current?.centerId===center.id?current:visit,treeId,patch));}
 return <main className="experience-panel">
  <div className="page-heading"><p className="eyebrow">로그인 없이 나무를 살펴봐요</p><h1 ref={heading} tabIndex={-1}>{mapOpen?'나무 지도':summary?'내가 남긴 기록':'숲에서 무엇이 궁금하세요?'}</h1>{!summary&&!mapOpen&&<p>나무를 골라 살펴보거나, 사진으로 이름을 찾아보세요.</p>}</div>
  {!summary&&!mapOpen&&<section className="visitor-start" aria-label="나무 관찰 시작"><div className="visitor-start-actions"><button type="button" className="visitor-start-main" onClick={startLooking}><Leaf size={23} aria-hidden="true"/><strong>{hasPlaces?'주변 나무 둘러보기':'나무 사진 둘러보기'}</strong><span>{hasPlaces?'장소와 사진으로 살펴봐요':'사진과 특징을 비교해요'}</span></button><button type="button" className="visitor-start-photo" onClick={onCapture}><Camera size={23} aria-hidden="true"/><strong>사진으로 이름 찾기</strong><span>로그인 후 촬영하거나 사진을 골라요</span></button></div>{hasVisit(visit)&&<p className="visitor-start-note">로그인하면 고른 느낌과 글이 지워져요. 먼저 ‘내 기록 보기’에서 발견 카드를 받아주세요.</p>}<details className="visitor-quick-help"><summary>이용 방법 보기</summary><dl><div><dt>어떤 나무부터 보면 되나요?</dt><dd>편백나무·갈참나무·단풍나무 중 원하는 나무부터 살펴보세요. 모두 찾지 않아도 괜찮아요.</dd></div><div><dt>이름을 정확히 알아야 하나요?</dt><dd>잘 몰라도 괜찮아요. 눈에 보이는 모양을 적어보세요. AI가 알려주는 이름도 틀릴 수 있어요.</dd></div><div><dt>글과 사진을 계속 보관하려면요?</dt><dd>여기 적은 글은 발견 카드를 받아 보관해요. 사진은 로그인한 뒤 ‘식물 찾기’에서 ‘내 도감에 저장하기’를 눌러주세요.</dd></div></dl></details></section>}
  {!summary&&<aside className="observation-safety" aria-label="관찰 전 안내"><span className="experience-tag">{observationPlaceReview(center.id,EXPERIENCE.reviewLabel)}</span><p>{EXPERIENCE.safety}</p></aside>}
  <aside className="visit-save-help"><strong>고른 느낌과 글은 자동으로 저장되지 않아요.</strong><p>보관하려면 ‘내 기록 보기’에서 발견 카드를 받아주세요.</p><details><summary>언제 기록이 지워지나요?</summary><p>새로고침하거나 창을 닫으면 지워져요. 다른 숲체원으로 바꾸거나 로그인·로그아웃할 때도 지워져요. ‘내 도감’에 자동으로 저장되거나 다른 사람에게 공개되지는 않아요.</p></details></aside>
  <div className="experience-views" aria-label="화면 고르기"><button type="button" disabled={mapState.busy} aria-pressed={!summary&&!mapOpen} onClick={()=>leaveMap(()=>{setMapOpen(false);setSummary(false);})}><Leaf size={20} aria-hidden="true"/>나무 살펴보기</button><button type="button" disabled={mapState.busy} aria-pressed={mapOpen} onClick={()=>{setSummary(false);setMapOpen(true);}}>나무 지도</button><button type="button" disabled={mapState.busy} aria-pressed={summary&&!mapOpen} onClick={()=>leaveMap(()=>{setMapOpen(false);setSummary(true);})}><Notebook size={20} aria-hidden="true"/>내 기록 보기</button></div>
  {notice&&<p role="status" className="visit-status">{notice}</p>}
  {mapOpen?<TreeMapPanel key={center.id} center={center} initialTreeId={mapTreeId} onTreeSelect={setMapTreeId} visitEntries={visit.entries} onVisitChange={change} onViewRecords={()=>{setMapOpen(false);setSummary(true);}} onState={setMapState} onBack={()=>{setExpandedTreeId(mapTreeId);setMapOpen(false);setSummary(false);}}/>:!summary?<>
   <h2 className="visitor-activity-title" ref={activities} tabIndex={-1}>살펴보고 싶은 나무를 골라보세요</h2><div className="experience-trees">{EXPERIENCE.trees.map(original=>{const tree=readableTree(original);const row=visit.entries[tree.id]||{note:'',observed:false},photo=experiencePhotos(tree)[0],place=observationPlace(center.id,tree.id),hasEntry=rows.some(value=>value.tree.id===tree.id);return <article key={tree.id} className={'tree-activity'+(expandedTreeId===tree.id?' tree-activity-open':'')} aria-labelledby={'tree-'+tree.id}>
    <details className="tree-picker" open={expandedTreeId===tree.id} onToggle={event=>{const open=event.currentTarget.open;setExpandedTreeId(current=>open?tree.id:current===tree.id?null:current);}}><summary className="tree-picker-summary"><span className="tree-picker-image"><TreeThumbnail key={tree.id+':'+(photo?.src||'')} photo={photo}/></span><span className="tree-picker-text"><strong id={'tree-'+tree.id}>{tree.name}</strong><span>{tree.feature}</span><small>{place?.label||'장소 안내 준비 중 · 참고 사진으로 살펴봐요'}</small>{hasEntry&&<span className="tree-picker-saved">남긴 발견 있음</span>}<span className="tree-picker-toggle">{expandedTreeId===tree.id?'접기':'펼쳐 보기'}</span></span></summary><div className="tree-activity-body">
    <TreePhotos tree={tree} centerId={center.id}/><ObservationPlace centerId={center.id} tree={tree} onMap={()=>{setMapTreeId(tree.id);setSummary(false);setMapOpen(true);}}/>
    <div className="tree-question"><span>직접 살펴봐요</span><p>{tree.question}</p></div>
    <details className="tree-hints tree-more"><summary>{tree.name} 특징·관찰 요령 보기</summary><h3>{tree.theme}</h3><p className="tree-description">{tree.description}</p><ul>{tree.hints.map(h=><li key={h}>{h}</li>)}</ul></details>
    <VisitNoteFields tree={tree} entry={row} onChange={patch=>change(tree.id,patch)}/>

   </div></details></article>;})}</div>
   <button className="visit-primary visit-wide" type="button" onClick={()=>setSummary(true)}>내 기록 보기 <ArrowRight size={20} aria-hidden="true"/></button>
  </>:<section className="visit-summary" aria-label="내가 남긴 기록"><p className="eyebrow">ㅇㄱㅁㅇ · 오늘의 나무 이야기</p><h2>내가 남긴 기록</h2><p className="visit-center">선택한 숲체원: {center.name}{center.isDemo?' · 시연용':''}</p><p className="visit-date">{new Date(visit.startedAt).toLocaleDateString('ko-KR',{timeZone:'Asia/Seoul'})} · 시작한 날</p><p className="visit-count">발견을 남긴 나무 <strong>{rows.length}가지</strong></p><p className="experience-help">살펴봤다고 표시한 나무 {observed}가지</p>
   {rows.length?<ul className="visit-memories">{rows.map(({tree,note,observed,reactions})=><li key={tree.id}><h3>{tree.name}</h3><p className="visit-observed">{observed?'살펴봤다고 표시했어요 · 이름이 맞는지는 확인이 필요해요':reactions?.length?'살펴본 표시 없이 남긴 발견':'살펴봤다는 표시 없이 적은 글'}</p><div className="visit-reaction-summary">{reactionLabels({reactions}).map(value=><span key={value}>{value}</span>)}</div>{note.trim()?<p className="visit-memo-text">{note.trim()}</p>:!reactions?.length&&<p className="visit-memo-text">아직 적은 글이 없어요.</p>}</li>)}</ul>:<p className="visit-empty">아직 기록이 없어요. 나무를 골라 느낌을 남겨보세요. 글은 적지 않아도 괜찮아요.</p>}
   <p className="experience-help">내가 고른 느낌과 직접 남긴 글이에요. 나무 이름이 맞는지 확인해주는 증명서는 아니에요.</p><RecordCardExport visit={visit} centerName={center.name} onBusy={setCardBusy}/><VisitTextExport visit={visit} centerName={center.name}/><button type="button" className="visit-secondary visit-wide" onClick={()=>setSummary(false)}>나무 더 살펴보기</button>
  </section>}
  <details className="tree-sources"><summary>체험 소개·관찰 장소 안내</summary><h2>{EXPERIENCE.title}</h2><p>{EXPERIENCE.subtitle}</p><p>{observationPlaceNotice(center.id,EXPERIENCE.locationNotice)}</p><p>{observationPlaceReview(center.id,EXPERIENCE.reviewLabel)}</p></details>
  <section className="visit-next"><h2>눈앞의 식물이 궁금하다면</h2><p>사진으로 비슷한 식물을 찾아보세요. 로그인이 필요해요.</p>{hasVisit(visit)&&<p className="visitor-start-note">로그인하면 고른 느낌과 글이 지워져요. 먼저 ‘내 기록 보기’에서 발견 카드를 받아주세요. 느낌과 글은 자동으로 옮겨지지 않아요.</p>}<button type="button" className="visit-secondary visit-wide" onClick={onCapture}>식물 찾기 열기 <ArrowRight size={20} aria-hidden="true"/></button></section>

  <button className="center-text-button" disabled={!hasVisit(visit)} type="button" onClick={()=>{if(window.confirm('여기 고른 느낌과 적은 글, 살펴본 표시를 모두 지울까요? 내 도감에 저장한 사진과 기록은 그대로 남아요.')){onChange({...visit,entries:{}});setNotice('고른 느낌과 글, 표시를 지웠어요.');}}}>오늘의 발견 지우기</button>
 </main>;
}
