import React from 'react';
export default function PhotoSearchFeedback({problem,disabled=false,retryDisabled=false,onRetry,onUnknown}){
 if(!problem)return null;
 return <section className="photo-search-feedback" aria-label="사진 검색 도움" role={problem.code==='cancelled'?'status':'alert'}><h4>{problem.title}</h4><p>{problem.text}</p><div>{problem.retry&&<button type="button" className="visit-secondary" disabled={disabled||retryDisabled} onClick={onRetry}>다시 이름 찾기</button>}<button type="button" className="visit-secondary" disabled={disabled} onClick={onUnknown}>이름 모름으로 기록하기</button></div><p className="experience-help">이름 칸에 ‘이름 모름’을 넣어요. 아래의 ‘내 도감에 저장하기’를 눌러야 계정에 남아요.</p></section>;
}
