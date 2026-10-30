import {visitText} from './experience-model.js';
// A click requests a download; it does not prove that the user saved the file.
export function downloadVisitText(visit,centerName,{document=globalThis.document,URL=globalThis.URL,schedule=setTimeout}={}){
 let url,anchor;
 try{
  const text=visitText(visit,centerName);
  url=URL.createObjectURL(new Blob(['\ufeff',text],{type:'text/plain;charset=utf-8'}));
  anchor=document.createElement('a');anchor.href=url;
  anchor.download='egmy-observation-'+new Date(visit.startedAt+9*60*60*1000).toISOString().slice(0,10)+'.txt';
  document.body.append(anchor);anchor.click();
  schedule(()=>URL.revokeObjectURL(url),60000);
 }catch(e){if(url)URL.revokeObjectURL(url);throw e;}
 finally{anchor?.remove();}
}
