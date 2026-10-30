import React,{useEffect,useRef,useState} from 'react';
import {visitRows} from './experience-model.js';
import {reactionLabels} from './visit-reactions.js';
import RecordCardExport from './RecordCardExport.jsx';
import VisitTextExport from './VisitTextExport.jsx';
export default function GuestRecordHandoff({visit,center,onBusy,onContinue,onBack,Card=RecordCardExport}){
 const[approved,setApproved]=useState(false),[cardBusy,setCardBusy]=useState(false),heading=useRef(null);
 const rows=visitRows(visit);
 useEffect(()=>{heading.current?.focus();},[]);
 useEffect(()=>{onBusy(cardBusy);return()=>onBusy(false);},[cardBusy,onBusy]);
 return <section className="guest-record-handoff" aria-label="로그인 전 발견 보관">
  <h2 ref={heading} tabIndex={-1}>지금 남긴 발견</h2><p>로그인하면 지금 고른 느낌과 글, 살펴본 표시가 지워져요. 필요한 기록은 먼저 받아주세요.</p>
  <p className="experience-help">선택한 숲체원: {center.name}</p>
  <ul className="visit-memories">{rows.map(row=><li key={row.tree.id}><h3>{row.tree.name}</h3><p className="visit-observed">{row.observed?'살펴봤다고 표시했어요 · 이름이 맞는지는 확인이 필요해요':'살펴본 표시는 하지 않았어요'}</p><div className="visit-reaction-summary">{reactionLabels(row).map(value=><span key={value}>{value}</span>)}</div>{row.note.trim()&&<p className="visit-memo-text">{row.note.trim()}</p>}</li>)}</ul>
  <Card visit={visit} centerName={center.name} onBusy={setCardBusy}/>
  <VisitTextExport visit={visit} centerName={center.name}/>
  <div className="guest-record-continue"><p>카드를 만든 것만으로 저장되지는 않아요. 기기에 파일이 있는지 직접 확인해주세요.</p><label className="share-consent"><input type="checkbox" checked={approved} disabled={cardBusy} onChange={e=>setApproved(e.target.checked)}/><span>필요한 기록을 보관했거나, 보관하지 않아도 괜찮아요.</span></label><button type="button" className="visit-secondary visit-wide" disabled={cardBusy||!approved} onClick={()=>{if(approved&&!cardBusy)onContinue();}}>로그인 화면으로 계속하기</button><button type="button" className="visit-secondary visit-wide" disabled={cardBusy} onClick={()=>{if(!cardBusy)onBack();}}>돌아가서 더 살펴보기</button></div>
 </section>;
}
