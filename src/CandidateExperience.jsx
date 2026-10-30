import ObservationPlace from './ObservationPlace.jsx';
import {observationPlaceNotice} from './observation-places.js';
import TreePhotos from './TreePhotos.jsx';
import VisitNoteFields from './VisitNoteFields.jsx';
import React,{useEffect,useRef,useState} from 'react';
import {experienceForSelection} from './candidate-experience.js';
import {readableTree} from './easy-language.js';
import {EXPERIENCE} from './experience-data.js';
import {updateVisit} from './experience-model.js';

export default function CandidateExperience({selection,visit,onChange,onUseNote,disabled=false}){
 const original=experienceForSelection(selection);
 return original?<Guide key={original.id} tree={readableTree(original)} visit={visit} onChange={onChange} onUseNote={onUseNote} disabled={disabled}/>:selection?<p className="experience-help">이 식물의 살펴보는 방법은 아직 준비 중이에요. 사진과 글은 아래에서 내 도감에 저장할 수 있어요.</p>:null;
}
function Guide({tree,visit,onChange,onUseNote,disabled}){
 const[open,setOpen]=useState(false),heading=useRef(null),opener=useRef(null);
 const row=visit.entries[tree.id]||{note:'',observed:false};
 useEffect(()=>{if(open)heading.current?.focus();},[open]);
 function change(patch){onChange(current=>updateVisit(current?.centerId===visit.centerId?current:visit,tree.id,patch));}
 return <section className="candidate-experience" aria-label={tree.name+' 살펴보기 안내'}>
  <h3>{tree.name}의 특징을 살펴볼까요?</h3><p>내가 고른 이름과 실제 식물이 같은지 잎과 줄기를 함께 살펴보세요.</p>
  <button type="button" ref={opener} className="visit-secondary visit-wide" disabled={disabled} aria-expanded={open} aria-controls={'candidate-guide-'+tree.id} onClick={()=>{setOpen(value=>!value);}}>살펴보는 방법 {open?'닫기':'보기'}</button>
  {open&&<div id={'candidate-guide-'+tree.id} className="candidate-guide">
   <h4 ref={heading} tabIndex={-1}>{tree.theme}</h4><TreePhotos tree={tree} centerId={visit.centerId}/><ObservationPlace centerId={visit.centerId} tree={tree}/><p>{tree.description}</p>
   <div className="tree-question"><span>직접 살펴봐요</span><p>{tree.question}</p></div>
   <ul>{tree.hints.map(hint=><li key={hint}>{hint}</li>)}</ul><p>{EXPERIENCE.safety}</p>
   <p className="experience-help">{observationPlaceNotice(visit.centerId,EXPERIENCE.locationNotice)} 사진을 올렸다는 것만으로 지금 이 숲에 있다는 뜻은 아니에요.</p>
   <VisitNoteFields tree={tree} entry={row} onChange={change} disabled={disabled}/>
   <p className="experience-help">이 글은 ‘숲 둘러보기’의 메모와 이어져요. 새로고침·창 닫기·기관이나 계정 변경 시 지워져요. 사진 기록에도 남기려면 아래 버튼을 누른 뒤 ‘내 도감에 저장하기’를 눌러주세요. 살펴봤다는 표시는 자동으로 켜지지 않아요.</p>
   <button type="button" className="visit-secondary visit-wide" disabled={disabled||!row.note.trim()} onClick={()=>onUseNote(row.note.trim())}>이 글을 사진 기록에 넣기</button>
   <details className="tree-sources"><summary>설명을 참고한 자료 보기</summary><p>학명: {tree.scientificName} · 실제 식물 이름은 추가 확인이 필요해요.</p><ul>{tree.sources.map(source=><li key={source.url}><a href={source.url} target="_blank" rel="noopener noreferrer">{source.label} ↗</a></li>)}</ul></details>
   <button type="button" className="visit-secondary visit-wide" onClick={()=>{setOpen(false);opener.current?.focus();}}>안내 접고 사진 기록 계속하기</button>
  </div>}
 </section>;
}
