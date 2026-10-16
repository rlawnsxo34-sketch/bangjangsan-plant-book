import React from 'react';
import {mascot} from './brand-assets.js';
export default function CenterChooser({centers,candidateId,onCandidate,onContinue,loading,error,onRefresh,onLocal,onBack}){
 return <main className="center-chooser"><p className="eyebrow">발견의 시작</p><h1>어느 숲체원에서<br/>관찰하나요?</h1><p className="center-intro">장소를 고르면 사진 기록과 공유 도감이<br/>선택한 숲체원으로 이어져요.</p><img className="welcome-mascot" src={mascot} alt="돋보기로 식물을 살피는 관찰포이" width="1080" height="1080"/>
  {error&&<p role="alert" className="rounded-xl bg-red-50 p-4 text-red-900">{error}</p>}
  {loading?<p role="status">등록된 숲체원을 확인하고 있어요…</p>:<><label className="center-label">관찰할 숲체원<select value={candidateId} onChange={e=>onCandidate(e.target.value)} disabled={!centers.length}><option value="">숲체원을 선택하세요</option>{centers.map(c=><option key={c.id} value={c.id}>{c.name}{c.isDemo?' · 시연용':''}</option>)}</select></label>{!error&&!centers.length&&<p className="mt-3 text-sm">아직 등록된 숲체원이 없습니다. 관리자에게 기관 등록을 요청해주세요.</p>}<button className="center-continue" disabled={!centers.some(c=>c.id===candidateId)} onClick={onContinue}>이 숲체원에서 시작하기</button></>}
  <button className="center-text-button" onClick={onRefresh} disabled={loading}>기관 목록 새로고침</button>
  <p className="center-help">선택은 나중에 바꿀 수 있어요.<br/>기관 선택만으로 담당자 권한이 생기지는 않습니다.</p>
  <button className="center-text-button" onClick={onLocal}>이 기기에 저장한 기록 먼저 보기</button>{onBack&&<button className="center-text-button" onClick={onBack}>선택 취소하고 돌아가기</button>}
 </main>;
}
