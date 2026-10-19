import React from 'react';
export default function CenterChooser({centers,candidateId,onCandidate,onContinue,loading,error,onRefresh,onLocal,onBack}){
 return <main className="center-chooser"><p className="eyebrow">발견의 시작</p><h1>어느 숲체원에서<br/>살펴볼까요?</h1><p className="center-intro">방문한 숲체원을 고르고 나무를 살펴보세요.<br/>설명 읽기와 한 줄 쓰기는 로그인 없이 할 수 있어요.</p><section className="visitor-welcome" aria-label="처음 이용하는 분께"><h2>궁금한 나무와 친해져요</h2><ul><li><strong>나무 설명 읽기</strong><span>잎과 나무껍질을 살펴보고 한 줄 남겨요.</span></li><li><strong>사진으로 알아보기</strong><span>로그인하면 AI가 알려주는 식물을 비교할 수 있어요.</span></li></ul><p>사진은 식물 찾기 서비스로 보내기 전에 동의를 받아요.</p></section>
  {error&&<p role="alert" className="rounded-xl bg-red-50 p-4 text-red-900">{error}</p>}
  {loading?<p role="status">등록된 숲체원을 확인하고 있어요…</p>:<><label className="center-label">지금 방문한 숲체원<select value={candidateId} onChange={e=>onCandidate(e.target.value)} disabled={!centers.length}><option value="">숲체원을 선택하세요</option>{centers.map(c=><option key={c.id} value={c.id}>{c.name}{c.isDemo?' · 시연용':''}</option>)}</select></label>{!error&&!centers.length&&<p className="mt-3 text-sm">아직 등록된 숲체원이 없습니다. 담당자에게 숲체원을 목록에 넣어달라고 알려주세요.</p>}<button className="center-continue" disabled={!centers.some(c=>c.id===candidateId)} onClick={onContinue}>이 숲체원에서 시작하기</button></>}
  <button className="center-text-button" onClick={onRefresh} disabled={loading}>숲체원 목록 다시 불러오기</button>
  <p className="center-help">나중에 다른 숲체원으로 바꿀 수 있어요.<br/>여기 적은 글은 ‘내 도감’에 자동으로 저장되지 않아요.</p>
  <button className="center-text-button" onClick={onLocal}>이 기기에 저장한 기록 보기</button>{onBack&&<button className="center-text-button" onClick={onBack}>선택 취소하고 돌아가기</button>}
 </main>;
}
