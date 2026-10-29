import {cardFilename} from './record-card.js';
export function createCardController({render,createURL,revokeURL,onChange}){
 let alive=true,source=null,key='',version=0,abort=null,url='';
 const release=()=>{if(url){revokeURL(url);url='';}};
 const emit=state=>{if(alive)onChange({key,...state});};
 return {
  setSource(next,nextKey){version++;abort?.abort();abort=null;release();source=next;key=nextKey;emit({phase:'idle'});},
  async prepare(){if(!alive||!source)return;const token=++version;abort?.abort();release();const job=new AbortController();abort=job;const snapshot=source;emit({phase:'working'});
   try{const result=await render(snapshot,{signal:job.signal});if(!alive||version!==token)return;url=createURL(result.blob);emit({phase:'ready',url,filename:cardFilename(snapshot),truncated:result.truncated,logoFallback:result.logoFallback,fontFallback:result.fontFallback});}
   catch(e){if(alive&&version===token)emit({phase:e?.name==='AbortError'?'idle':'error',message:typeof e?.message==='string'&&/[가-힣]/.test(e.message)?e.message:'이 기기에서 카드 이미지를 만들지 못했어요. 다시 시도하거나 글 파일로 받아주세요.'});}
   finally{if(alive&&version===token)abort=null;}
  },
  cancel(){version++;abort?.abort();abort=null;release();emit({phase:'idle'});},
  dispose(){alive=false;version++;abort?.abort();abort=null;release();source=null;}
 };
}
