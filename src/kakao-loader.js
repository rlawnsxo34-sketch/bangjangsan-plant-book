let task=null,keyUsed='';
export function loadKakaoMap(key){
 if(typeof key!=='string'||!key.trim())return Promise.reject(new Error('나무 지도는 준비 중이에요. 사진과 장소 안내를 이용해주세요.'));
 if(task){if(key!==keyUsed)return Promise.reject(new Error('지도 설정이 바뀌었어요. 새로고침해주세요.'));return task;}
 keyUsed=key;
 task=new Promise((resolve,reject)=>{
  let finished=false;const script=document.createElement('script');
  const finish=(error)=>{if(finished)return;finished=true;clearTimeout(timer);if(error){script.remove();task=null;keyUsed='';reject(error);}else resolve(window.kakao.maps);};
  const timer=setTimeout(()=>finish(new Error('지도를 불러오지 못했어요. 연결을 확인한 뒤 다시 열어주세요.')),20000);
  const url=new URL('https://dapi.kakao.com/v2/maps/sdk.js');url.searchParams.set('appkey',key);url.searchParams.set('autoload','false');url.searchParams.set('libraries','services');script.src=url.href;script.async=true;script.referrerPolicy='origin';
  script.onerror=()=>finish(new Error('지도를 불러오지 못했어요. 연결과 지도 설정을 확인해주세요.'));
  script.onload=()=>{if(finished)return;try{if(!window.kakao?.maps?.load)throw new Error();window.kakao.maps.load(()=>{if(!window.kakao.maps.Map)return;finish();});}catch(_){finish(new Error('지도를 시작하지 못했어요. 다시 열어주세요.'));}};
  try{document.head.append(script);}catch(_){finish(new Error('지도를 시작하지 못했어요. 다시 열어주세요.'));}
 });return task;
}
