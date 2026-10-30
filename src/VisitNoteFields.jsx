import React from 'react';
import {VISIT_NOTE_LIMIT} from './experience-model.js';
import {VISIT_REACTIONS,visitReactions} from './visit-reactions.js';

// Controlled fields shared by the tree cards and the map. No local copy,
// network write, location claim or automatic observed mark is created here.
export default function VisitNoteFields({tree,entry,onChange,disabled=false}){
 const row=entry||{note:'',observed:false};
 const selected=visitReactions(row.reactions);
 return <div className="visit-note-fields" role="group" aria-label={`${tree.name} 관찰 기록`}>
  <fieldset className="visit-reactions" disabled={disabled}><legend>어떤 느낌이 들었나요? <span>여러 개 골라도 괜찮아요</span></legend><div>{VISIT_REACTIONS.map(item=><button type="button" key={item.id} disabled={disabled} aria-pressed={selected.includes(item.id)} onClick={()=>onChange({reactions:selected.includes(item.id)?selected.filter(id=>id!==item.id):[...selected,item.id]})}>{item.label}</button>)}</div></fieldset>
  <label className="visit-check"><input type="checkbox" checked={row.observed===true} disabled={disabled} onChange={e=>onChange({observed:e.target.checked})}/><span>이 나무를 살펴봤어요</span></label>
  <label className="visit-note">한 줄 더 남기기 · 선택<textarea rows={3} maxLength={VISIT_NOTE_LIMIT} value={row.note} disabled={disabled} onChange={e=>onChange({note:e.target.value})} placeholder={tree.placeholder}/><span>{row.note.length}/{VISIT_NOTE_LIMIT}자</span></label>
 </div>;
}
