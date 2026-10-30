import {mascot} from './brand-assets.js';
import React,{useEffect,useRef,useState} from 'react';
import {createInstallController,installationGuide} from './install-controller.js';
const initial={canPrompt:false,installing:false,standalone:false,addedThisSession:false,message:''};
export default function InstallPanel(){
 const[state,setState]=useState(initial),[guide,setGuide]=useState(()=>installationGuide()),controller=useRef(null);
 useEffect(()=>{setGuide(installationGuide(window.navigator));const current=createInstallController(window,setState);controller.current=current;return()=>{controller.current=null;current.dispose();};},[]);
 if(state.standalone)return <p className="installed-mode">홈 화면에서 ㅇㄱㅁㅇ를 실행하고 있어요.</p>;
 return <aside id="installation-panel" className="install-panel" aria-label="홈 화면에 추가"><div className="install-brand"><img src={mascot} alt="ㅇㄱㅁㅇ 앱 아이콘" width="64" height="64"/><div><h2>홈 화면에서 바로 만나요</h2><p>ㅇㄱㅁㅇ 아이콘으로 더 쉽게 열어보세요.</p></div></div>
  {state.canPrompt&&<button type="button" className="install-action" disabled={state.installing} onClick={()=>controller.current?.install()}>홈 화면에 추가</button>}
  {state.installing&&<p role="status">브라우저의 설치 안내를 확인해주세요.</p>}
  {state.message&&<p role="status" className="install-message">{state.message}</p>}
  <details><summary>홈 화면 추가 방법</summary><h3>{guide.title}</h3><ol>{guide.steps.map(step=><li key={step}>{step}</li>)}</ol><p>메뉴 이름과 설치 지원 여부는 브라우저에 따라 다를 수 있습니다.</p></details>
  <p className="install-online">AI 분석·계정 저장·공유에는 인터넷 연결이 필요합니다.</p>
 </aside>;
}
