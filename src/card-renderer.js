import {layoutCard} from './record-card.js';
export const CARD_LOGO_PATH='/brand/egmy-horizontal-v19.png';
export function abortError(){return new DOMException('이미지 만들기를 취소했어요.','AbortError');}
function check(signal){if(signal?.aborted)throw abortError();}
export function waitForCard(promise,{signal,timeout=10000,message='이미지 준비가 오래 걸려요. 잠시 후 다시 해주세요.'}={}){
 check(signal);
 return new Promise((resolve,reject)=>{let done=false;const finish=(fn,value)=>{if(done)return;done=true;clearTimeout(timer);signal?.removeEventListener('abort',abort);fn(value);};const abort=()=>finish(reject,abortError());const timer=setTimeout(()=>finish(reject,new Error(message)),timeout);signal?.addEventListener('abort',abort,{once:true});Promise.resolve(promise).then(value=>finish(resolve,value),e=>finish(reject,e));});
}
async function loadLogo(document,ImageCtor,signal){
 const current=document.querySelector?.('.brand-horizontal-logo');
 if(current?.complete&&current.naturalWidth>0)return current;
 if(!ImageCtor)throw new Error('logo');
 const image=new ImageCtor();const pending=new Promise((resolve,reject)=>{image.onload=()=>resolve(image);image.onerror=()=>reject(new Error('logo'));image.src=CARD_LOGO_PATH;});
 try{return await waitForCard(pending,{signal,timeout:12000});}finally{image.onload=null;image.onerror=null;if(!image.complete)image.src='';}
}
export function paintCard(canvas,model,logo,{fontFamily='"Noto Sans KR","Malgun Gothic","Apple SD Gothic Neo",sans-serif'}={}){
 const ctx=canvas.getContext('2d');if(!ctx)throw new Error('이 기기에서는 카드 이미지를 만들지 못했어요. 글 파일로 받아주세요.');
 const layout=layoutCard(model,(text,size,weight)=>{ctx.font=`${weight} ${size}px ${fontFamily}`;return ctx.measureText(text).width;});
 canvas.width=layout.width;canvas.height=layout.height;
 ctx.fillStyle='#f7f9f4';ctx.fillRect(0,0,canvas.width,canvas.height);
 ctx.fillStyle='#ffffff';ctx.fillRect(40,40,canvas.width-80,canvas.height-80);
 ctx.textAlign='left';ctx.textBaseline='top';
 if(logo){const ratio=(logo.naturalHeight||logo.height)/(logo.naturalWidth||logo.width);ctx.drawImage(logo,72,54,320,320*ratio);ctx.font=`700 42px ${fontFamily}`;ctx.fillStyle='#075640';ctx.fillText('ㅇㄱㅁㅇ · 이건뭐야',440,108);ctx.font=`400 26px ${fontFamily}`;ctx.fillStyle='#637359';ctx.fillText('오늘의 나무 이야기',440,166);}else{ctx.font=`700 50px ${fontFamily}`;ctx.fillStyle='#4c281b';ctx.fillText('ㅇㄱㅁㅇ · 이건뭐야',72,115);}
 for(const c of layout.commands){
  if(c.type==='line'){ctx.fillStyle=c.color;ctx.fillRect(c.x,c.y,c.width,2);continue;}
  ctx.font=`${c.weight} ${c.size}px ${fontFamily}`;ctx.fillStyle=c.color;
  c.lines.forEach((line,index)=>ctx.fillText(line,c.x,c.y+index*c.lineHeight));
 }
 return layout;
}
export async function renderRecordCard(model,{signal,document=globalThis.document,ImageCtor=globalThis.Image}={}){
 check(signal);if(!document?.createElement)throw new Error('이 기기에서는 이미지 만들기를 지원하지 않아요. 글 파일로 받아주세요.');
 let logo=null,fontFallback=false;
 // No remote photos, private coordinates or account data are requested.
 const fontJob=(async()=>{if(!document.fonts?.load)return;try{await waitForCard(document.fonts.load('400 36px "Noto Sans KR"','ㅇㄱㅁㅇ 이건뭐야 오늘의 나무 이야기 내가 남긴 숲 이야기 선택한 숲체원 기록을 시작한 날 살펴봤다고 표시한 나무 가지 표시 없이 적은 글이에요 아직 글이 없어요 길어 일부만 담았어요 전체 내용은 파일로 받아주세요 고른 장소와 직접 방문 사실이나 식물 이름을 증명하지 않아요 …'+model.dateLabel+model.centerName+model.entries.map(x=>x.note+x.name).join('')),{signal,timeout:5000});}catch(e){check(signal);fontFallback=true;}})();
 const logoJob=(async()=>{try{logo=await loadLogo(document,ImageCtor,signal);}catch(e){check(signal);}})();
 await Promise.all([fontJob,logoJob]);check(signal);
 const canvas=document.createElement('canvas');
 try{const layout=paintCard(canvas,model,logo,fontFallback?{fontFamily:'"Malgun Gothic","Apple SD Gothic Neo",sans-serif'}:{});check(signal);
  const pending=new Promise((resolve,reject)=>{if(!canvas.toBlob){reject(new Error('이미지 저장을 지원하지 않아요. 글 파일로 받아주세요.'));return;}canvas.toBlob(blob=>blob?resolve(blob):reject(new Error('이미지를 만들지 못했어요. 다시 시도하거나 글 파일로 받아주세요.')),'image/png');});
  const blob=await waitForCard(pending,{signal,timeout:10000});check(signal);
  return {blob,truncated:layout.truncated,logoFallback:!logo,fontFallback};
 }finally{canvas.width=1;canvas.height=1;}
}
