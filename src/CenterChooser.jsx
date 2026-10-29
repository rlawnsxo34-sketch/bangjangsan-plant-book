import React from 'react';
export default function CenterChooser({centers,candidateId,onCandidate,onContinue,loading,error,onRefresh,onLocal,onBack}){
 return <main className="center-chooser"><h1>어느 숲에 오셨나요?</h1><p className="center-intro">방문한 숲체원을 골라주세요.<br/>로그인 없이 나무를 살펴볼 수 있어요.</p>
  {error&&<p role="alert" className="rounded-xl bg-red-50 p-4 text-red-900">{error}</p>}
  {loading?<p role="status">등록된 숲체원을 확인하고 있어요…</p>:<><label className="center-label">지금 방문한 숲체원<select value={candidateId} onChange={e=>onCandidate(e.target.value)} disabled={!centers.length}><option value="">숲체원을 선택하세요</option>{centers.map(c=><option key={c.id} value={c.id}>{c.name}{c.isDemo?' · 시연용':''}</option>)}</select></label>{!error&&!centers.length&&<p className="mt-3 text-sm">아직 등록된 숲체원이 없습니다. 담당자에게 숲체원을 목록에 넣어달라고 알려주세요.</p>}<button className="center-continue" disabled={!centers.some(c=>c.id===candidateId)} onClick={onContinue}>이 숲체원에서 시작하기</button></>}
  <button className="center-text-button" onClick={onRefresh} disabled={loading}>숲체원 목록 다시 불러오기</button>
  <details className="center-about"><summary>처음 이용하시나요?</summary><p>나무 설명을 읽고 관찰한 모습을 한 줄 남겨보세요. 숲체원은 나중에 바꿀 수 있어요.</p><p>사진으로 이름을 찾고 내 도감에 저장하려면 로그인이 필요해요. 사진은 보내기 전에 동의를 받아요.</p><p>로그인 없이 적은 글은 내 도감에 자동 저장되지 않아요. 기록 파일로 받아 보관해주세요.</p></details>
  <button className="center-text-button" onClick={onLocal}>이전 기록·백업</button>{onBack&&<button className="center-text-button" onClick={onBack}>선택 취소하고 돌아가기</button>}
 </main>;
}
