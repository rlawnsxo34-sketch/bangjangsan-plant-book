import React,{useEffect,useState} from 'react';
import {hasVisit} from './experience-model.js';
import {downloadVisitText} from './visit-file.js';
export default function VisitTextExport({visit,centerName,download=downloadVisitText}){
 const[notice,setNotice]=useState(''),[error,setError]=useState('');
 useEffect(()=>{setNotice('');setError('');},[visit,centerName]);
 function request(){setNotice('');setError('');try{download(visit,centerName);setNotice('기록 파일 받기를 눌렀어요. 인터넷 앱의 다운로드 목록에서 파일을 확인해주세요.');}catch(_){setError('기록 파일을 받지 못했어요. 다시 시도하거나 위에 보이는 내용을 복사해 보관해주세요.');}}
 return <details className="visit-text-export"><summary>글 파일로 받기 · 선택</summary><p className="experience-help">고른 느낌과 글을 텍스트 파일(.txt)로 받아요.</p><button type="button" className="visit-secondary visit-wide" disabled={!hasVisit(visit)} onClick={request}>기록 파일 받기</button>{notice&&<p role="status" className="card-small-help">{notice}</p>}{error&&<p role="alert" className="card-export-error">{error}</p>}</details>;
}
