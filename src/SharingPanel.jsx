import ShareComposer from './ShareComposer.jsx';
import SharedPhotos from './SharedPhotos.jsx';
import React,{useState,useEffect,useRef} from 'react';
import {getRuntime} from './cloud-runtime.js';
import {cloudMessage,createEpoch} from './cloud-model.js';
import Dialog from './dialog.jsx';
const button='rounded-xl bg-emerald-800 px-4 py-3 font-bold text-white disabled:opacity-50';
const secondary='rounded-xl border border-slate-400 bg-white px-4 py-3 font-semibold text-slate-800 disabled:opacity-50';
const field='mt-1 w-full rounded-xl border border-slate-400 bg-white p-3 text-slate-950';
const statusLabel={pending:'담당자가 확인할 차례예요',approved:'다른 사람도 볼 수 있어요',rejected:'다시 확인해주세요',withdrawn:'공유를 취소했어요'};
export default function SharingPanel({center,onPanelState}){
 const centerId=center.id;
 const[rt,setRt]=useState(null),[sessionVersion,setSessionVersion]=useState(0),[user,setUser]=useState(null),[publicRows,setPublicRows]=useState([]),[mine,setMine]=useState([]),[records,setRecords]=useState([]),[grants,setGrants]=useState([]),[pending,setPending]=useState([]),[error,setError]=useState(''),[notice,setNotice]=useState(''),[busy,setBusy]=useState(false),[loaded,setLoaded]=useState(false),[privateLoaded,setPrivateLoaded]=useState(false),[selected,setSelected]=useState(null),[decision,setDecision]=useState('approved'),[reason,setReason]=useState(''),[dialog,setDialog]=useState(null),[hasMore,setHasMore]=useState(false);
 const[composerBusy,setComposerBusy]=useState(false),[composerDirty,setComposerDirty]=useState(false);
 const blocked=busy||composerBusy;
 const epoch=useRef(createEpoch()),alive=useRef(true),lock=useRef(false),refreshId=useRef(0),cursor=useRef(null),background=useRef(null),opener=useRef(null),modalId=useRef(0);
 const current=t=>alive.current&&epoch.current.isCurrent(t);
 useEffect(()=>{alive.current=true;let stop;try{const runtime=getRuntime();setRt(runtime);stop=runtime.subscribe(next=>{if(!alive.current)return;epoch.current.next();setSessionVersion(v=>v+1);refreshId.current++;modalId.current++;setUser(next);setMine([]);setRecords([]);setGrants([]);setPending([]);setSelected(null);setDialog(null);setReason('');setComposerBusy(false);setComposerDirty(false);setPrivateLoaded(false);setLoaded(false);setPublicRows([]);cursor.current=null;setHasMore(false);setError('');setNotice('');lock.current=false;setBusy(false);});}catch(e){setError(cloudMessage(e));}return()=>{alive.current=false;epoch.current.next();stop?.();};},[]);

 async function refresh(){if(!rt||!centerId)return;const token=epoch.current.current(),id=++refreshId.current;setLoaded(false);setPrivateLoaded(false);setError('');setPending([]);try{const results=await Promise.allSettled([rt.sharing.publicPage(centerId),user?rt.sharing.mine(user.uid):Promise.resolve([]),user?rt.repo.list(user.uid):Promise.resolve([]),user?rt.sharing.grants(user.uid):Promise.resolve([])]);
   if(!current(token)||id!==refreshId.current)return;const [pub,m,r,g]=results;
   if(pub.status==='fulfilled'){setPublicRows(pub.value.rows);cursor.current=pub.value.cursor;setHasMore(pub.value.hasMore);setLoaded(true);}else{setPublicRows([]);setHasMore(false);setError(cloudMessage(pub.reason));}
   if([m,r,g].every(x=>x.status==='fulfilled')){setMine(m.value);setRecords(r.value);setGrants(g.value);setPrivateLoaded(true);if(g.value.includes(centerId)){const queue=await rt.sharing.pending(user.uid,centerId);if(current(token)&&id===refreshId.current)setPending(queue);}}
   else{setMine([]);setRecords([]);setGrants([]);setError(cloudMessage(results.find(x=>x.status==='rejected').reason));}
  }catch(e){if(current(token)&&id===refreshId.current)setError(cloudMessage(e));}}
 useEffect(()=>{refresh();},[rt,sessionVersion,centerId]);
 useEffect(()=>{if(!dialog)return;const nav=document.getElementById('storage-navigation'),institutionNav=document.getElementById('institution-navigation');if(nav)nav.inert=true;if(institutionNav)institutionNav.inert=true;const installation=document.getElementById('installation-panel');if(installation)installation.inert=true;const node=background.current;node.inert=true;node.setAttribute('aria-hidden','true');return()=>{if(nav)nav.inert=false;if(institutionNav)institutionNav.inert=false;if(installation)installation.inert=false;node.inert=false;node.removeAttribute('aria-hidden');};},[!!dialog]);
 async function operation(fn,success){if(lock.current)return;const token=epoch.current.current();lock.current=true;setBusy(true);setError('');setNotice('');try{const result=await fn();if(current(token))await success?.(result);}catch(e){if(current(token))setError(cloudMessage(e));}finally{if(current(token)){lock.current=false;setBusy(false);}}}
 function close(force=false){if(lock.current&&!force)return;modalId.current++;setDialog(null);setSelected(null);setReason('');setError('');}
 function open(row,kind,event){opener.current=event.currentTarget;setSelected(row);setDialog(kind);setReason('');setDecision('approved');setError('');}
 async function nextPage(){const token=epoch.current.current(),id=refreshId.current;await operation(()=>rt.sharing.publicPage(centerId,cursor.current),p=>{if(current(token)&&id===refreshId.current){setPublicRows(old=>{const seen=new Set(old.map(x=>x.id));return [...old,...p.rows.filter(x=>!seen.has(x.id))];});cursor.current=p.cursor;setHasMore(p.hasMore);}});}
 useEffect(()=>{onPanelState({busy:blocked||!!dialog,dirty:composerDirty});return()=>onPanelState({busy:false,dirty:false});},[blocked,dialog,composerDirty,onPanelState]);
 const institutionMine=mine.filter(row=>row.centerId===centerId);
 return <><main ref={background} className="sharing-panel mx-auto max-w-2xl space-y-5 p-5 pb-12">
  <h1 className="text-2xl font-bold text-emerald-950">함께 보는 숲체원 도감</h1><p className="leading-relaxed text-slate-700">이 숲에서 나눈 사진과 글이에요. 식물 이름은 정확하지 않을 수 있어요.</p>
  {error&&<p role="alert" className="rounded-xl bg-red-50 p-4 text-red-900">{error}</p>}{notice&&<p role="status" className="rounded-xl bg-emerald-50 p-4 text-emerald-950">{notice}</p>}
  <p className="selected-share-center">공유 숲체원 <strong>{center.name}</strong></p>
  <button className={secondary} disabled={blocked||!rt||!centerId} onClick={refresh}>새 기록 불러오기</button>
  <div className="sharing-workspace"><section className="public-records-panel" aria-label="함께 볼 수 있는 기록"><h2 className="mb-3 text-xl font-bold">함께 볼 수 있는 기록</h2>{!loaded&&centerId&&<p role="status">공개 목록 확인 중 · 오류가 있으면 새로고침해주세요.</p>}{loaded&&!publicRows.length&&<p>아직 함께 볼 수 있는 기록이 없습니다.</p>}<ul className="space-y-3">{publicRows.map(row=><li key={row.id}><button className="w-full rounded-2xl border border-emerald-200 bg-white p-4 text-left" disabled={blocked} onClick={e=>open(row,'public',e)}><strong className="break-words">{row.name}</strong><span className="mt-1 block text-sm text-slate-700">{row.centerName} · 담당자 검토 · 공유 사진 보기</span></button></li>)}</ul>{hasMore&&<button className={secondary+' mt-3'} disabled={blocked} onClick={nextPage}>공유 기록 더 보기</button>}</section>
  {!user&&<p className="rounded-xl bg-slate-100 p-4">함께 나누려면 ‘내 도감’에서 로그인해주세요.</p>}
  {user&&<div className="sharing-account"><p className="break-all text-sm text-slate-600">로그인: {user.email}</p><ShareComposer key={user.uid+':'+centerId} uid={user.uid} center={center} repo={rt.repo} sharing={rt.sharing} records={records} disabled={blocked||!privateLoaded||!!dialog} onBusy={setComposerBusy} onDirty={setComposerDirty} onSaved={async result=>{setNotice(!result||result.status==='pending'?'신청했어요. 담당자가 확인하기 전에는 공개되지 않아요.':'이미 처리된 요청이에요. 내 공유 신청 상태를 확인해주세요.');await refresh();}}/>

  <section aria-label="내 공유 신청 상태"><h2 className="mb-3 text-xl font-bold">내 공유 신청 상태</h2><p className="mb-3 text-sm text-slate-600">내 도감에서 기록을 고치면 공유가 취소돼요. 수정 후 다시 신청해주세요.</p>{privateLoaded&&!institutionMine.length&&<p>아직 공유 신청이 없습니다.</p>}<ul className="space-y-3">{institutionMine.map(row=><li key={row.id} className="rounded-xl border border-slate-300 bg-white p-4"><strong>{row.name}</strong><p className="my-2 break-words">{row.centerName} · {statusLabel[row.status]}{row.reviewReason&&` · 검토 사유: ${row.reviewReason}`}</p>{row.status!=='withdrawn'&&<button className={secondary} disabled={blocked} onClick={e=>open(row,'withdraw',e)}>공유 취소</button>}</li>)}</ul></section>
  {grants.includes(centerId)&&<section aria-label="숲체원 담당자 확인"><h2 className="mb-3 text-xl font-bold">숲체원 담당자 확인</h2>{!pending.length&&<p>현재 검토 대기 기록이 없습니다.</p>}<ul className="space-y-3">{pending.map(row=><li key={row.id}><button className="w-full rounded-xl border border-emerald-200 bg-white p-4 text-left" disabled={blocked} onClick={e=>open(row,'review',e)}>{row.name} · 검토하기</button></li>)}</ul></section>}
  </div>}
 </div></main>
 {dialog&&selected&&<div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-3"><Dialog returnFocus={opener} label={dialog==='review'?'공유 신청 검토':dialog==='withdraw'?'공유 취소 확인':'공개 관찰 기록'} onClose={()=>close()} busy={busy} className="max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-5">
  {error&&<p role="alert" className="mb-3 text-red-900">{error}</p>}
  <h2 className="text-xl font-bold">{selected.name}</h2>
  {dialog!=='withdraw'&&<><SharedPhotos row={selected}/><p className="my-3">숲체원: {selected.centerName}</p><p className="my-3 whitespace-pre-wrap break-words">{selected.publicNote||'함께 보여줄 글 없음'}</p></>}
  {dialog==='public'&&<><p className="my-3 text-sm">숲체원의 위치예요. 실제 나무를 만난 위치는 아니에요.{selected.institutionLocation&&` · ${selected.institutionLocation.lat}, ${selected.institutionLocation.lng}`}</p><p className="mb-4 text-sm">담당자는 사진과 글을 함께 봐도 되는지 확인했어요. 식물 이름이 맞다고 확인한 것은 아니에요.</p><button className={secondary} onClick={()=>close()}>닫기</button></>}
  {dialog==='review'&&<form className="space-y-3" onSubmit={e=>{e.preventDefault();operation(()=>rt.sharing.review(user.uid,selected,decision,reason),async()=>{close(true);setNotice(decision==='approved'?'공유를 승인했습니다. 공개 목록에 표시됩니다.':'공유를 보류했습니다. 신청자에게 사유가 표시됩니다.');await refresh();});}}><label className="block">검토 결과<select className={field} disabled={blocked} value={decision} onChange={e=>setDecision(e.target.value)}><option value="approved">공유 승인</option><option value="rejected">공유 보류</option></select></label><label className="block">검토 사유<textarea className={field} required maxLength={500} value={reason} disabled={blocked} onChange={e=>setReason(e.target.value)} placeholder="사진·메모의 공개 적합성 등 검토 내용을 입력하세요."/></label><button className={button} disabled={blocked}>검토 결과 저장</button><button type="button" className={secondary+' ml-2'} disabled={blocked} onClick={()=>close()}>취소</button></form>}
  {dialog==='withdraw'&&<><p className="my-4">다른 사람에게 보이지 않게 할까요? 내 도감의 사진과 글은 그대로 남아요.</p><p className="mb-4 text-sm">이미 저장하거나 캡처한 사본은 남을 수 있어요.</p><button className={button} disabled={blocked} onClick={()=>operation(()=>rt.sharing.withdraw(user.uid,selected.id),async()=>{close(true);setNotice('공유를 취소했습니다. 새로 조회하는 이용자에게는 표시되지 않습니다.');await refresh();})}>공유 취소 확인</button><button className={secondary+' ml-2'} disabled={blocked} onClick={()=>close()}>돌아가기</button></>}
 </Dialog></div>}
 </>;
}
