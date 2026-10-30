import React,{useMemo,useState,useId,useRef} from 'react';
import {Leaf,Plus,ArrowRight,CaretDown} from '@phosphor-icons/react';
import {mascot} from './brand-assets.js';
import {summarizeDiscoveries,filterDiscoveries,sortObservations,isUnnamedObservation,savedDate} from './discovery-model.js';
import {CLOUD_LIMIT} from './cloud-model.js';
function ObservationButton({row,disabled,onRecord}){
 return <button type="button" className="observation-row" disabled={disabled} onClick={e=>onRecord(row,e)}><strong>{row.name}</strong><span>{row.centerName} · 저장 {savedDate(row.createdAt)}</span>{isUnnamedObservation(row)&&row.description?.trim()&&<span className="unnamed-note-preview">{row.description}</span>}<span>나만 보기 · {isUnnamedObservation(row)?'사진 보고 이름 적기':'사진과 글 보기'} <ArrowRight size={15} aria-hidden="true"/></span></button>;
}
function CandidateGroup({group,open,onToggle,disabled,onRecord}){
 const id=useId();
 return <article className="discovery-group"><button type="button" className="discovery-group-toggle" aria-expanded={open} aria-controls={id} onClick={onToggle}><span className="discovery-leaf"><Leaf size={24} aria-hidden="true"/></span><span className="discovery-group-name"><strong>{group.name}</strong><span>{group.scientificName}</span><span>{group.records.length}건의 기록 · AI가 알려준 이름 중 내가 고른 이름</span></span><CaretDown size={20} aria-hidden="true" className={open?'group-open':''}/></button>
  <div id={id} hidden={!open} className="discovery-group-content"><p>처음 저장: {savedDate(group.firstSavedAt)}<br/>최근 저장: {savedDate(group.lastSavedAt)}</p><p>기록된 숲체원: {group.centers.join(', ')||'기관 이름 없음'}</p><ul>{group.records.map(row=><li key={row.id}><ObservationButton row={row} disabled={disabled} onRecord={onRecord}/></li>)}</ul></div>
 </article>;
}
export default function DiscoveryBook({records,disabled,onRecord,onCreate}){
 const[mode,setMode]=useState('groups'),[query,setQuery]=useState(''),[scope,setScope]=useState('all'),[nameSource,setNameSource]=useState('all'),[order,setOrder]=useState('newest'),[openKey,setOpenKey]=useState(null),searchId=useId(),searchField=useRef(null);
 const model=useMemo(()=>summarizeDiscoveries(records),[records]),partial=records.length>CLOUD_LIMIT;
 const unnamedCount=records.filter(isUnnamedObservation).length;
 const rows=sortObservations(filterDiscoveries(records,query,scope,nameSource),order),visible=summarizeDiscoveries(rows),groups=visible.groups,manual=visible.unclassified;
 function resetFilters(){setScope('all');setNameSource('all');setQuery('');setOpenKey(null);}
 return <section aria-label="내 발견 도감" className="discovery-book">
  <div className="discovery-title"><div><p className="eyebrow">계속 쌓이는 나의 발견</p><h2>내 발견 도감</h2></div><button type="button" className="discovery-add" disabled={disabled} onClick={onCreate}><Plus size={18} aria-hidden="true"/> 새 기록</button></div>
  <p className="discovery-scope">여러 숲체원에서 내 도감에 저장한 기록을 함께 보여드려요.</p>
  <dl className="discovery-stats"><div><dt>관찰 기록</dt><dd>{model.recordCount}<small>건</small></dd></div><div><dt>AI에서 고른 이름</dt><dd>{model.candidateCount}<small>개</small></dd></div><div><dt>직접 입력·기타</dt><dd>{model.unclassifiedCount}<small>건</small></dd></div></dl>
  <details className="discovery-explainer"><summary>이름을 모아 보여주는 기준</summary><p>AI가 알려준 세계 공통 이름(학명)이 같은 기록끼리 모았어요. 이 숫자는 실제 식물 종류를 정확히 센 것은 아니에요. 직접 적은 이름과 AI 정보가 없는 기록은 따로 보여드려요.</p></details>
  {partial&&<p className="discovery-limit" role="status">현재 불러온 최신 {records.length}건 안에서만 집계합니다. 전체 기록의 통계나 최초 발견일은 아닙니다.</p>}
  {!records.length?<div className="empty-guide"><img src={mascot} alt="" width="2048" height="2048"/><h3>첫 번째 발견을 기다리고 있어요</h3><p>아직 계정에 저장한 기록이 없습니다.</p><button type="button" className="center-continue" disabled={disabled} onClick={onCreate}>사진으로 첫 기록 남기기</button></div>:<>
   <div className="discovery-scope-filter" role="group" aria-label="내 도감 기록 고르기"><button type="button" disabled={disabled} aria-pressed={scope==='all'} onClick={()=>setScope('all')}>전체 기록 <span>{records.length}건</span></button><button type="button" disabled={disabled} aria-pressed={scope==='unnamed'} onClick={()=>setScope('unnamed')}>이름 모름 <span>{unnamedCount}건</span></button></div>
   {scope==='unnamed'&&<p className="discovery-scope">이름 모름으로 남긴 사진을 모았어요. 기록을 열어 사진을 확인한 뒤 이름을 적을 수 있어요.</p>}
   {scope==='all'&&nameSource==='all'&&!query.trim()&&!!model.recent.length&&<section aria-label="최근 새로 모은 이름" className="recent-discoveries"><h3>{partial?'이 목록에서 새로 모은 이름':'최근 새로 모은 이름'}</h3><p>현재 남아 있는 기록의 첫 저장일 기준입니다.</p><ul>{model.recent.map(g=><li key={g.key}><Leaf size={18} aria-hidden="true"/><div><strong>{g.name}</strong><span>첫 저장 {savedDate(g.firstSavedAt)}</span></div></li>)}</ul></section>}
   {scope==='all'&&<div className="discovery-view" role="group" aria-label="내 도감 보기 방식"><button type="button" aria-pressed={mode==='groups'} onClick={()=>setMode('groups')}>같은 이름끼리 보기</button><button type="button" aria-pressed={mode==='records'} onClick={()=>setMode('records')}>기록 목록</button></div>}
   <label className="discovery-sort">이름을 기록한 방법<select aria-describedby={`${searchId}-source-help`} value={nameSource} disabled={disabled} onChange={e=>setNameSource(e.target.value)}><option value="all">모든 기록</option><option value="ai">AI 후보를 고른 기록</option><option value="other">직접 입력·기타 기록</option></select></label>
   <p hidden={nameSource!=='other'} id={`${searchId}-source-help`} className="discovery-scope">직접 입력·기타에는 이름 모름이나 AI 선택 정보가 없는 예전 기록도 포함돼요.</p>
   <label className="discovery-search" htmlFor={searchId}>식물 이름·숲체원으로 찾기<input ref={searchField} id={searchId} type="search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="예: 소나무, Pinus, 장성"/></label>
   {query&&<button type="button" className="discovery-clear-search" disabled={disabled} onClick={()=>{setQuery('');searchField.current?.focus();}}>검색어 지우기</button>}
   {(mode==='records'||scope==='unnamed')&&<label className="discovery-sort">저장일 순서<select value={order} disabled={disabled} onChange={e=>setOrder(e.target.value)}><option value="newest">최근에 저장한 순서</option><option value="oldest">오래전에 저장한 순서</option></select></label>}
   {(query.trim()||scope==='unnamed'||nameSource!=='all')&&<p className="discovery-scope" role="status">{scope==='unnamed'?'이름 모름 목록':'검색된 기록'} {rows.length}건</p>}
   {mode==='records'||scope==='unnamed'?<ul className="discovery-records">{rows.map(row=><li key={row.id}><ObservationButton row={row} disabled={disabled} onRecord={onRecord}/></li>)}</ul>:<>
    <div className="discovery-groups">{groups.map(group=><CandidateGroup key={group.key} group={group} open={openKey===group.key} onToggle={()=>setOpenKey(old=>old===group.key?null:group.key)} disabled={disabled} onRecord={onRecord}/>)}</div>
    {!!manual.length&&<section className="unclassified-records" aria-label="직접 입력·기타 기록"><h3>직접 입력·기타 기록 · {manual.length}건</h3><p>이름이 같아도 같은 종류라고 묶지 않아요.</p><ul>{manual.map(row=><li key={row.id}><ObservationButton row={row} disabled={disabled} onRecord={onRecord}/></li>)}</ul></section>}
   </>}
   {!rows.length&&<div className="discovery-no-results"><p>{scope==='unnamed'?((query.trim()||nameSource!=='all')?'이 조건에 맞는 이름 모름 기록이 없어요.':'이름 모름으로 남긴 기록이 없어요. 이름을 바꾼 기록은 전체 기록에서 볼 수 있어요.'):'조건에 맞는 기록이 없어요. 검색어나 이름을 기록한 방법을 바꿔보세요.'}</p><button type="button" className="visit-secondary" disabled={disabled} onClick={resetFilters}>전체 기록 보기</button></div>}
  </>}
 </section>;
}
