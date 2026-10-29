import TreeMapPanel from './TreeMapPanel.jsx';
import ObservationPlace from './ObservationPlace.jsx';
import {observationPlaceNotice,observationPlaceReview} from './observation-places.js';
import TreePhotos from './TreePhotos.jsx';
import RecordCardExport from './RecordCardExport.jsx';
import {readableTree} from './easy-language.js';
import React,{useEffect,useRef,useState} from 'react';
import {Leaf,Camera,Notebook,ArrowRight,DownloadSimple,LinkSimple} from '@phosphor-icons/react';
import {EXPERIENCE} from './experience-data.js';
import {VISIT_NOTE_LIMIT,updateVisit,visitRows,visitText,hasVisit,experienceLink} from './experience-model.js';
export default function ExperiencePanel({center,visit,onChange,onCapture,onPanelState}){
 const[mapOpen,setMapOpen]=useState(false),[mapState,setMapState]=useState({busy:false,dirty:false});
 const[summary,setSummary]=useState(false),[notice,setNotice]=useState(''),[downloadError,setDownloadError]=useState(''),[cardBusy,setCardBusy]=useState(false);
 const activities=useRef(null),heading=useRef(null),initialized=useRef(false),linkField=useRef(null),alive=useRef(true);
 const rows=visitRows(visit),observed=rows.filter(x=>x.observed).length;
 useEffect(()=>{onPanelState({busy:cardBusy||mapState.busy,dirty:mapState.dirty});return()=>onPanelState({busy:false,dirty:false});},[cardBusy,mapState,onPanelState]);
 useEffect(()=>{alive.current=true;return()=>{alive.current=false;};},[]);
 useEffect(()=>{if(initialized.current)heading.current?.focus();initialized.current=true;},[summary,mapOpen]);
 function leaveMap(action){if(mapState.busy)return;if(mapState.dirty&&!window.confirm('저장하지 않은 위치 선택을 버릴까요?'))return;action();}
 function startLooking(){activities.current?.scrollIntoView?.({block:'start',behavior:'instant'});activities.current?.focus();}
 function change(treeId,patch){onChange(current=>updateVisit(current?.centerId===center.id?current:visit,treeId,patch));}
 const link=typeof window==='undefined'?'':experienceLink(window.location.href,center.id);
 async function copyLink(){setNotice('');try{if(!navigator.clipboard?.writeText)throw new Error('clipboard');await navigator.clipboard.writeText(link);if(alive.current)setNotice('이 숲체원의 체험 주소를 복사했어요.');}catch(_){if(!alive.current)return;setNotice('아래 주소를 길게 누르거나 선택해 복사해주세요.');linkField.current?.focus();linkField.current?.select();}}
 function download(){setDownloadError('');let url;try{const text=visitText(visit,center.name),blob=new Blob(['\ufeff',text],{type:'text/plain;charset=utf-8'});url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='egmy-observation-'+new Date(visit.startedAt+9*60*60*1000).toISOString().slice(0,10)+'.txt';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);setNotice('기록 파일 받기를 눌렀어요. 인터넷 앱의 다운로드 목록에서 파일을 확인해주세요.');}catch(e){if(url)URL.revokeObjectURL(url);setDownloadError(e.message||'기록 파일을 받지 못했어요. 적은 내용을 복사해서 따로 보관해주세요.');}}
 return <main className="experience-panel">
  <div className="page-heading"><p className="eyebrow">로그인 없이 나무를 살펴봐요</p><h1 ref={heading} tabIndex={-1}>{mapOpen?'나무 지도':summary?'내가 남긴 기록':'어떤 나무가 궁금하세요?'}</h1>{!summary&&<p>원하는 나무부터 살펴보고 한 줄 남겨보세요.</p>}</div>
  {!summary&&!mapOpen&&<section className="visitor-start" aria-label="나무 관찰 시작"><div className="visitor-start-actions"><button type="button" className="visitor-start-main" onClick={startLooking}><Leaf size={23} aria-hidden="true"/><strong>나무 고르기</strong><span>설명과 관찰 질문 보기</span></button><button type="button" className="visitor-start-photo" onClick={onCapture}><Camera size={23} aria-hidden="true"/><strong>사진으로 알아보기</strong><span>로그인 후 사진으로 찾기</span></button></div>{hasVisit(visit)&&<p className="visitor-start-note">로그인하면 여기 적은 글이 지워져요. 먼저 ‘내 기록 보기’에서 파일로 받아주세요.</p>}<details className="visitor-quick-help"><summary>이용 방법 보기</summary><dl><div><dt>어떤 나무부터 보면 되나요?</dt><dd>편백나무·갈참나무·단풍나무 중 원하는 나무부터 살펴보세요. 모두 찾지 않아도 괜찮아요.</dd></div><div><dt>이름을 정확히 알아야 하나요?</dt><dd>잘 몰라도 괜찮아요. 눈에 보이는 모양을 적어보세요. AI가 알려주는 이름도 틀릴 수 있어요.</dd></div><div><dt>글과 사진을 계속 보관하려면요?</dt><dd>여기 적은 글은 기록 파일을 받아 보관해요. 사진은 로그인한 뒤 ‘식물 찾기’에서 ‘내 도감에 저장하기’를 눌러주세요.</dd></div></dl></details></section>}
  {!summary&&<aside className="observation-safety" aria-label="관찰 전 안내"><span className="experience-tag">{observationPlaceReview(center.id,EXPERIENCE.reviewLabel)}</span><p>{EXPERIENCE.safety}</p></aside>}
  <aside className="visit-save-help"><strong>적은 글은 자동으로 저장되지 않아요.</strong><p>남기려면 ‘내 기록 보기’에서 파일로 받아주세요.</p><details><summary>언제 글이 지워지나요?</summary><p>새로고침하거나 창을 닫으면 지워져요. 다른 숲체원으로 바꾸거나 로그인·로그아웃할 때도 지워져요. ‘내 도감’에 자동으로 저장되거나 다른 사람에게 공개되지는 않아요.</p></details></aside>
  <div className="experience-views" aria-label="화면 고르기"><button type="button" disabled={mapState.busy} aria-pressed={!summary&&!mapOpen} onClick={()=>leaveMap(()=>{setMapOpen(false);setSummary(false);})}><Leaf size={20} aria-hidden="true"/>나무 살펴보기</button><button type="button" disabled={mapState.busy} aria-pressed={mapOpen} onClick={()=>{setSummary(false);setMapOpen(true);}}>나무 지도</button><button type="button" disabled={mapState.busy} aria-pressed={summary&&!mapOpen} onClick={()=>leaveMap(()=>{setMapOpen(false);setSummary(true);})}><Notebook size={20} aria-hidden="true"/>내 기록 보기</button></div>
  {notice&&<p role="status" className="visit-status">{notice}</p>}{downloadError&&<p role="alert" className="visit-status text-red-900">{downloadError}</p>}
  {mapOpen?<TreeMapPanel key={center.id} center={center} onState={setMapState} onBack={()=>{setMapOpen(false);setSummary(false);}}/>:!summary?<>
   <h2 className="visitor-activity-title" ref={activities} tabIndex={-1}>살펴보고 싶은 나무를 골라보세요</h2><div className="experience-trees">{EXPERIENCE.trees.map((original,i)=>{const tree=readableTree(original);const row=visit.entries[tree.id]||{note:'',observed:false};return <article key={tree.id} className="tree-activity" aria-labelledby={'tree-'+tree.id}>
    <div className="tree-activity-heading"><span aria-hidden="true">0{i+1}</span><div><p>{tree.feature}</p><h2 id={'tree-'+tree.id}>{tree.name}</h2></div></div>
    <TreePhotos tree={tree} centerId={center.id}/><ObservationPlace centerId={center.id} tree={tree} onMap={()=>{setSummary(false);setMapOpen(true);}}/>
    <div className="tree-question"><span>직접 살펴봐요</span><p>{tree.question}</p></div>
    <details className="tree-hints tree-more"><summary>{tree.name} 특징·관찰 요령 보기</summary><h3>{tree.theme}</h3><p className="tree-description">{tree.description}</p><ul>{tree.hints.map(h=><li key={h}>{h}</li>)}</ul></details>
    <label className="visit-check"><input type="checkbox" checked={row.observed} onChange={e=>change(tree.id,{observed:e.target.checked})}/><span>이 나무를 살펴봤어요</span></label>
    <label className="visit-note">내가 발견한 특징<textarea rows={3} maxLength={VISIT_NOTE_LIMIT} value={row.note} onChange={e=>change(tree.id,{note:e.target.value})} placeholder={tree.placeholder}/><span>{row.note.length}/{VISIT_NOTE_LIMIT}자</span></label>
    <details className="tree-sources"><summary>다른 이름과 설명 자료 보기</summary><p>식물 자료를 참고해 쉽게 풀어 썼어요. 나무 이름이 맞는지는 잎과 줄기를 함께 보며 확인해주세요.</p><p className="tree-scientific">학명(세계에서 함께 쓰는 이름): {tree.scientificName}</p><p>{tree.reviewed?'이 나무에 입력된 안내 확인 표시가 있어요.':'이 화면에 등록된 정보에는 담당자의 최종 확인 표시가 아직 없어요.'}</p><ul>{tree.sources.map(s=><li key={s.url}><a href={s.url} target="_blank" rel="noopener noreferrer">{s.label} ↗</a></li>)}</ul></details>
   </article>;})}</div>
   <button className="visit-primary visit-wide" type="button" onClick={()=>setSummary(true)}>내 기록 보기 <ArrowRight size={20} aria-hidden="true"/></button>
  </>:<section className="visit-summary" aria-label="내가 남긴 기록"><p className="eyebrow">ㅇㄱㅁㅇ · 오늘의 나무 이야기</p><h2>내가 남긴 기록</h2><p className="visit-center">선택한 숲체원: {center.name}{center.isDemo?' · 시연용':''}</p><p className="visit-date">{new Date(visit.startedAt).toLocaleDateString('ko-KR',{timeZone:'Asia/Seoul'})} · 시작한 날</p><p className="visit-count">살펴봤다고 표시한 나무 <strong>{observed}가지</strong></p>
   {rows.length?<ul className="visit-memories">{rows.map(({tree,note,observed})=><li key={tree.id}><h3>{tree.name}</h3><p className="visit-observed">{observed?'살펴봤다고 표시했어요 · 이름이 맞는지는 확인이 필요해요':'살펴봤다는 표시 없이 적은 글'}</p><p className="visit-memo-text">{note.trim()||'아직 적은 글이 없어요.'}</p></li>)}</ul>:<p className="visit-empty">아직 기록이 없어요. 나무를 살펴봤다고 표시하거나 글을 한 줄 적어보세요.</p>}
   <p className="experience-help">내가 직접 남긴 기록이에요. 나무 이름이 맞는지 확인해주는 증명서는 아니에요.</p><RecordCardExport visit={visit} centerName={center.name} onBusy={setCardBusy}/><p className="experience-help">글로 된 파일(.txt)을 받아요. 휴대폰이나 컴퓨터에서 열어볼 수 있어요.</p><button type="button" className="visit-primary visit-wide" disabled={!rows.length} onClick={download}><DownloadSimple size={20} aria-hidden="true"/>기록 파일 받기</button><button type="button" className="visit-secondary visit-wide" onClick={()=>setSummary(false)}>나무 더 살펴보기</button>
  </section>}
  <details className="tree-sources"><summary>체험 소개·관찰 장소 안내</summary><h2>{EXPERIENCE.title}</h2><p>{EXPERIENCE.subtitle}</p><p>{observationPlaceNotice(center.id,EXPERIENCE.locationNotice)}</p><p>{observationPlaceReview(center.id,EXPERIENCE.reviewLabel)}</p></details>
  <section className="visit-next"><h2>눈앞의 식물이 궁금하다면</h2><p>사진으로 비슷한 식물을 찾아보세요. 로그인이 필요해요.</p>{hasVisit(visit)&&<p className="visitor-start-note">로그인하면 여기 적은 글이 지워져요. 먼저 ‘내 기록 보기’에서 파일로 받아주세요. 글은 자동으로 옮겨지지 않아요.</p>}<button type="button" className="visit-secondary visit-wide" onClick={onCapture}>식물 찾기 열기 <ArrowRight size={20} aria-hidden="true"/></button></section>
  <details className="visit-entry-link"><summary>이 숲체원의 체험 주소 나누기</summary><p>이 주소를 열면 이 숲체원의 나무 살펴보기가 열려요. 내가 적은 글이나 로그인 정보는 전달되지 않아요.</p><label>체험 주소<input ref={linkField} readOnly value={link} onFocus={e=>e.target.select()}/></label><button type="button" className="visit-secondary" onClick={copyLink}><LinkSimple size={18} aria-hidden="true"/>체험 주소 복사</button></details>
  <button className="center-text-button" disabled={!hasVisit(visit)} type="button" onClick={()=>{if(window.confirm('여기 적은 글과 살펴본 표시를 모두 지울까요? 내 도감에 저장한 사진과 기록은 그대로 남아요.')){onChange({...visit,entries:{}});setNotice('적은 글과 표시를 지웠어요.');}}}>여기 적은 글과 표시 지우기</button>
 </main>;
}
