import {canShareAt} from './center-model.js';
import React,{useState,useEffect,useRef} from 'react';
import {getRuntime} from './cloud-runtime.js';
import {cloudMessage,createEpoch} from './cloud-model.js';
import Dialog from './dialog.jsx';
const button='rounded-xl bg-emerald-800 px-4 py-3 font-bold text-white disabled:opacity-50';
const secondary='rounded-xl border border-slate-400 bg-white px-4 py-3 font-semibold text-slate-800 disabled:opacity-50';
const field='mt-1 w-full rounded-xl border border-slate-400 bg-white p-3 text-slate-950';
const statusLabel={pending:'검토 대기',approved:'공개 중',rejected:'반려',withdrawn:'철회'};
export default function SharingPanel({center,onPanelState}){
 const centerId=center.id;
 const[rt,setRt]=useState(null),[sessionVersion,setSessionVersion]=useState(0),[user,setUser]=useState(null),[publicRows,setPublicRows]=useState([]),[mine,setMine]=useState([]),[records,setRecords]=useState([]),[grants,setGrants]=useState([]),[pending,setPending]=useState([]),[recordId,setRecordId]=useState(''),[publicNote,setPublicNote]=useState(''),[consent,setConsent]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState(''),[busy,setBusy]=useState(false),[loaded,setLoaded]=useState(false),[privateLoaded,setPrivateLoaded]=useState(false),[selected,setSelected]=useState(null),[decision,setDecision]=useState('approved'),[reason,setReason]=useState(''),[dialog,setDialog]=useState(null),[hasMore,setHasMore]=useState(false);
 const epoch=useRef(createEpoch()),alive=useRef(true),lock=useRef(false),refreshId=useRef(0),cursor=useRef(null),background=useRef(null),opener=useRef(null),modalId=useRef(0);
 const current=t=>alive.current&&epoch.current.isCurrent(t);
 useEffect(()=>{alive.current=true;let stop;try{const runtime=getRuntime();setRt(runtime);stop=runtime.subscribe(next=>{if(!alive.current)return;epoch.current.next();setSessionVersion(v=>v+1);refreshId.current++;modalId.current++;setUser(next);setMine([]);setRecords([]);setGrants([]);setPending([]);setSelected(null);setDialog(null);setReason('');setPublicNote('');setConsent(false);setRecordId('');setPrivateLoaded(false);setLoaded(false);setPublicRows([]);cursor.current=null;setHasMore(false);setError('');setNotice('');lock.current=false;setBusy(false);});}catch(e){setError(cloudMessage(e));}return()=>{alive.current=false;epoch.current.next();stop?.();};},[]);

 async function refresh(){if(!rt||!centerId)return;const token=epoch.current.current(),id=++refreshId.current;setLoaded(false);setPrivateLoaded(false);setError('');setPending([]);try{const results=await Promise.allSettled([rt.sharing.publicPage(centerId),user?rt.sharing.mine(user.uid):Promise.resolve([]),user?rt.repo.list(user.uid):Promise.resolve([]),user?rt.sharing.grants(user.uid):Promise.resolve([])]);
   if(!current(token)||id!==refreshId.current)return;const [pub,m,r,g]=results;
   if(pub.status==='fulfilled'){setPublicRows(pub.value.rows);cursor.current=pub.value.cursor;setHasMore(pub.value.hasMore);setLoaded(true);}else{setPublicRows([]);setHasMore(false);setError(cloudMessage(pub.reason));}
   if([m,r,g].every(x=>x.status==='fulfilled')){setMine(m.value);setRecords(r.value);setGrants(g.value);setPrivateLoaded(true);if(g.value.includes(centerId)){const queue=await rt.sharing.pending(user.uid,centerId);if(current(token)&&id===refreshId.current)setPending(queue);}}
   else{setMine([]);setRecords([]);setGrants([]);setError(cloudMessage(results.find(x=>x.status==='rejected').reason));}
  }catch(e){if(current(token)&&id===refreshId.current)setError(cloudMessage(e));}}
 useEffect(()=>{refresh();},[rt,sessionVersion,centerId]);
 useEffect(()=>{if(!dialog)return;const nav=document.getElementById('storage-navigation'),institutionNav=document.getElementById('institution-navigation');if(nav)nav.inert=true;if(institutionNav)institutionNav.inert=true;const node=background.current;node.inert=true;node.setAttribute('aria-hidden','true');return()=>{if(nav)nav.inert=false;if(institutionNav)institutionNav.inert=false;node.inert=false;node.removeAttribute('aria-hidden');};},[!!dialog]);
 async function operation(fn,success){if(lock.current)return;const token=epoch.current.current();lock.current=true;setBusy(true);setError('');setNotice('');try{const result=await fn();if(current(token))await success?.(result);}catch(e){if(current(token))setError(cloudMessage(e));}finally{if(current(token)){lock.current=false;setBusy(false);}}}
 function close(force=false){if(lock.current&&!force)return;modalId.current++;setDialog(null);setSelected(null);setReason('');setError('');}
 function open(row,kind,event){opener.current=event.currentTarget;setSelected(row);setDialog(kind);setReason('');setDecision('approved');setError('');}
 async function nextPage(){const token=epoch.current.current(),id=refreshId.current;await operation(()=>rt.sharing.publicPage(centerId,cursor.current),p=>{if(current(token)&&id===refreshId.current){setPublicRows(old=>{const seen=new Set(old.map(x=>x.id));return [...old,...p.rows.filter(x=>!seen.has(x.id))];});cursor.current=p.cursor;setHasMore(p.hasMore);}});}
 useEffect(()=>{onPanelState({busy:busy||!!dialog,dirty:!!publicNote||consent});return()=>onPanelState({busy:false,dirty:false});},[busy,dialog,publicNote,consent,onPanelState]);
 const institutionMine=mine.filter(row=>row.centerId===centerId);
 const shareableRecords=records.filter(row=>canShareAt(row,centerId));
 const selectedRecord=shareableRecords.find(x=>x.id===recordId);
 return <><main ref={background} className="sharing-panel mx-auto max-w-2xl space-y-5 p-5 pb-12">
  <h1 className="text-2xl font-bold text-emerald-950">숲체원 공유 도감</h1><p className="leading-relaxed text-slate-700">공유를 신청하고 기관 담당자의 검토를 거친 기록을 함께 봅니다. 검토는 공유 적합성 확인이며 식물 종의 전문가 확정이 아닙니다.</p>
  {error&&<p role="alert" className="rounded-xl bg-red-50 p-4 text-red-900">{error}</p>}{notice&&<p role="status" className="rounded-xl bg-emerald-50 p-4 text-emerald-950">{notice}</p>}
  <p className="selected-share-center">공유 숲체원 <strong>{center.name}</strong></p>
  <button className={secondary} disabled={busy||!rt||!centerId} onClick={refresh}>공유 목록 새로고침</button>
  <section aria-label="승인된 공유 기록"><h2 className="mb-3 text-xl font-bold">승인된 공유 기록</h2>{!loaded&&centerId&&<p role="status">공개 목록 확인 중 · 오류가 있으면 새로고침해주세요.</p>}{loaded&&!publicRows.length&&<p>아직 승인된 공유 기록이 없습니다.</p>}<ul className="space-y-3">{publicRows.map(row=><li key={row.id}><button className="w-full rounded-2xl border border-emerald-200 bg-white p-4 text-left" disabled={busy} onClick={e=>open(row,'public',e)}><strong className="break-words">{row.name}</strong><span className="mt-1 block text-sm text-slate-700">{row.centerName} · 담당자 검토 · 공유 사진 보기</span></button></li>)}</ul>{hasMore&&<button className={secondary+' mt-3'} disabled={busy} onClick={nextPage}>공유 기록 더 보기</button>}</section>
  {!user&&<p className="rounded-xl bg-slate-100 p-4">공개 기록은 로그인 없이 볼 수 있습니다. 공유 신청과 검토는 내 도감에서 로그인한 뒤 이용하세요.</p>}
  {user&&<><p className="break-all text-sm text-slate-600">로그인: {user.email}</p><form className="space-y-4 rounded-2xl border border-slate-300 bg-white p-5" onSubmit={e=>{e.preventDefault();if(!consent||!selectedRecord||!centerId)return;operation(()=>rt.sharing.submit(user.uid,selectedRecord,centerId,publicNote),async()=>{setConsent(false);setPublicNote('');setNotice('공유를 신청했습니다. 담당자 승인 전에는 공개되지 않습니다.');await refresh();});}}>
   <h2 className="text-xl font-bold">내 기록 공유 신청</h2><label className="block">공유할 개인 기록<select className={field} required value={recordId} disabled={busy||!privateLoaded} onChange={e=>{setRecordId(e.target.value);setConsent(false);}}><option value="">기록 선택</option>{shareableRecords.map(r=><option key={r.id} value={r.id}>{r.name} · {r.centerName}{!r.centerId?' · 이전 기록':''}</option>)}</select></label>
   {selectedRecord&&!selectedRecord.centerId&&<p className="text-sm">기관 ID가 없는 이전 기록입니다. 기록된 장소 ‘{selectedRecord.centerName}’가 현재 공유할 ‘{center.name}’와 맞는지 확인해주세요.</p>}
   {!shareableRecords.length&&privateLoaded&&<p className="text-sm">이 기관에 공유할 기록이 없습니다. 사진 기록에서 관찰 내용을 먼저 저장해주세요.</p>}
   <label className="block">공개 메모 · 선택<textarea className={field} rows={3} maxLength={1000} value={publicNote} disabled={busy} onChange={e=>setPublicNote(e.target.value)} placeholder="개인 메모는 자동으로 공개되지 않습니다. 공유할 내용만 입력하세요."/></label>
   <p className="rounded-xl bg-amber-50 p-3 text-sm leading-relaxed text-amber-950">공개 항목: 식물 이름, 사진 사본, 위에서 선택한 숲체원, 공개 메모. 개인 메모·이메일·개인 GPS 좌표는 복사하지 않습니다. 사진이나 메모에 사람 얼굴·연락처·민감한 위치가 담겨 있는지 확인하세요. 이미 저장·캡처된 사본은 철회해도 회수할 수 없습니다.</p>
   <label className="flex items-start gap-3"><input type="checkbox" className="mt-1 h-5 w-5 shrink-0" checked={consent} disabled={busy} onChange={e=>setConsent(e.target.checked)}/><span>선택한 숲체원과 공개 항목을 확인했으며, 검토 후 다른 이용자에게 공개하는 데 동의합니다.</span></label>
   <button className={button} type="submit" disabled={busy||!privateLoaded||!selectedRecord||!consent||!centerId}>담당자 검토를 위한 공유 신청</button>
  </form>
  <section aria-label="내 공유 신청 상태"><h2 className="mb-3 text-xl font-bold">내 공유 신청 상태</h2><p className="mb-3 text-sm text-slate-600">개인 기록을 수정·삭제하면 공개가 철회됩니다. 수정 후에는 다시 신청해주세요.</p>{privateLoaded&&!institutionMine.length&&<p>아직 공유 신청이 없습니다.</p>}<ul className="space-y-3">{institutionMine.map(row=><li key={row.id} className="rounded-xl border border-slate-300 bg-white p-4"><strong>{row.name}</strong><p className="my-2 break-words">{row.centerName} · {statusLabel[row.status]}{row.reviewReason&&` · 검토 사유: ${row.reviewReason}`}</p>{row.status!=='withdrawn'&&<button className={secondary} disabled={busy} onClick={e=>open(row,'withdraw',e)}>공유 철회</button>}</li>)}</ul></section>
  {grants.includes(centerId)&&<section aria-label="기관 담당자 검토"><h2 className="mb-3 text-xl font-bold">기관 담당자 검토</h2>{!pending.length&&<p>현재 검토 대기 기록이 없습니다.</p>}<ul className="space-y-3">{pending.map(row=><li key={row.id}><button className="w-full rounded-xl border border-emerald-200 bg-white p-4 text-left" disabled={busy} onClick={e=>open(row,'review',e)}>{row.name} · 검토하기</button></li>)}</ul></section>}
  </>}
 </main>
 {dialog&&selected&&<div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-3"><Dialog returnFocus={opener} label={dialog==='review'?'공유 신청 검토':dialog==='withdraw'?'공유 철회 확인':'공개 관찰 기록'} onClose={()=>close()} busy={busy} className="max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-5">
  {error&&<p role="alert" className="mb-3 text-red-900">{error}</p>}
  <h2 className="text-xl font-bold">{selected.name}</h2>
  {dialog!=='withdraw'&&<><img src={selected.imageData} alt={`${selected.name} 공유 사진`} className="my-3 max-h-72 w-full rounded-xl object-contain"/><p className="my-3">숲체원: {selected.centerName}</p><p className="my-3 whitespace-pre-wrap break-words">{selected.publicNote||'공개 메모 없음'}</p></>}
  {dialog==='public'&&<><p className="my-3 text-sm">{selected.locationLabel}{selected.institutionLocation&&` · ${selected.institutionLocation.lat}, ${selected.institutionLocation.lng}`}</p><p className="mb-4 text-sm">{selected.reviewScope}</p><button className={secondary} onClick={()=>close()}>닫기</button></>}
  {dialog==='review'&&<form className="space-y-3" onSubmit={e=>{e.preventDefault();operation(()=>rt.sharing.review(user.uid,selected,decision,reason),async()=>{close(true);setNotice(decision==='approved'?'공유를 승인했습니다. 공개 목록에 표시됩니다.':'공유를 반려했습니다. 신청자에게 사유가 표시됩니다.');await refresh();});}}><label className="block">검토 결과<select className={field} disabled={busy} value={decision} onChange={e=>setDecision(e.target.value)}><option value="approved">공유 승인</option><option value="rejected">공유 반려</option></select></label><label className="block">검토 사유<textarea className={field} required maxLength={500} value={reason} disabled={busy} onChange={e=>setReason(e.target.value)} placeholder="사진·메모의 공개 적합성 등 검토 내용을 입력하세요."/></label><button className={button} disabled={busy}>검토 결과 저장</button><button type="button" className={secondary+' ml-2'} disabled={busy} onClick={()=>close()}>취소</button></form>}
  {dialog==='withdraw'&&<><p className="my-4">공유를 철회할까요? 개인 기록은 유지하고 공개 목록에서 제거합니다.</p><button className={button} disabled={busy} onClick={()=>operation(()=>rt.sharing.withdraw(user.uid,selected.id),async()=>{close(true);setNotice('공유를 철회했습니다. 새로 조회하는 이용자에게는 표시되지 않습니다.');await refresh();})}>공유 철회 확인</button><button className={secondary+' ml-2'} disabled={busy} onClick={()=>close()}>취소</button></>}
 </Dialog></div>}
 </>;
}
