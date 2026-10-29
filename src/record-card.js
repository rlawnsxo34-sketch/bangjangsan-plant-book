import {visitRows,VISIT_NOTE_LIMIT} from './experience-model.js';
export const CARD_WIDTH=1080;
export const CARD_MAX_HEIGHT=4096;
const MARGIN=72,CONTENT=CARD_WIDTH-MARGIN*2;
const segmenter=typeof Intl.Segmenter==='function'?new Intl.Segmenter('ko',{granularity:'grapheme'}):null;
const characters=text=>segmenter?Array.from(segmenter.segment(text),x=>x.segment):Array.from(text);
export function cardModel(visit,centerName){
 const rows=visitRows(visit);
 if(!rows.length)return null;
 if(typeof centerName!=='string'||!centerName.trim()||centerName.length>80)throw new Error('숲체원 이름을 확인해주세요.');
 const date=new Date(visit.startedAt);
 if(!Number.isSafeInteger(visit.startedAt)||visit.startedAt<=0||!Number.isFinite(date.getTime()))throw new Error('기록 날짜를 확인해주세요.');
 const parts=Object.fromEntries(new Intl.DateTimeFormat('en',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(date).map(p=>[p.type,p.value]));
 return {centerName:centerName.trim(),dateLabel:date.toLocaleDateString('ko-KR',{timeZone:'Asia/Seoul',year:'numeric',month:'long',day:'numeric'}),day:`${parts.year}-${parts.month}-${parts.day}`,observedCount:rows.filter(r=>r.observed).length,entries:rows.slice(0,3).map(r=>({name:String(r.tree.name).slice(0,80),observed:r.observed,note:r.note.slice(0,VISIT_NOTE_LIMIT).trim()}))};
}
export function cardFilename(model){return `egmy-record-${model.day}.png`;}
export function wrapCardText(input,measure,maxWidth,maxLines){
 const text=String(input).replace(/\r\n?/g,'\n').replace(/\t/g,'  ').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g,'');
 const lines=[];let current='',overflow=false;
 function push(){lines.push(current);current='';if(lines.length>maxLines){overflow=true;return false;}return true;}
 outer:for(const paragraph of text.split('\n')){
  for(const c of characters(paragraph)){
   if(current&&measure(current+c)>maxWidth){
    // Keep sentence-ending punctuation with the preceding character.
    if(/^[.,!?，。？！、:;\)\]\}〉》」』】…]/u.test(c)){
     const previous=characters(current);if(previous.length>1){const last=previous.pop();current=previous.join('');if(!push())break outer;current=last;}
     else if(!push())break outer;
    }else if(!push())break outer;
   }
   current+=c;
  }
  if(!push())break;
 }
 if(overflow){lines.length=maxLines;let last=characters(lines[maxLines-1]||'');while(last.length&&measure(last.join('')+'…')>maxWidth)last.pop();lines[maxLines-1]=last.join('')+'…';}
 return {lines,truncated:overflow};
}
// A bounded list of drawing commands; text is never interpreted as HTML/SVG.
export function layoutCard(model,measure){
 const commands=[];let y=260,truncated=false;
 function text(value,size,lineHeight,maxLines,color='#173d31',weight=400){const wrapped=wrapCardText(value,s=>measure(s,size,weight),CONTENT,maxLines);truncated ||= wrapped.truncated;commands.push({type:'text',lines:wrapped.lines,x:MARGIN,y,size,lineHeight,color,weight});y+=wrapped.lines.length*lineHeight;}
 text('내가 남긴 숲 이야기',62,80,1,'#173d31',700);y+=16;
 text('선택한 숲체원',26,36,1,'#637359');y+=4;
 text(model.centerName,36,50,4,'#173d31',700);y+=16;
 text(`기록을 시작한 날 · ${model.dateLabel}`,28,40,1,'#637359');y+=8;
 text(`살펴봤다고 표시한 나무 ${model.observedCount}가지`,32,44,1,'#075640',700);y+=28;
 for(const entry of model.entries){
  commands.push({type:'line',x:MARGIN,y,width:CONTENT,color:'#d7e2cf'});y+=24;
  text(entry.name,42,56,2,'#173d31',700);y+=4;
  text(entry.observed?'살펴봤다고 표시했어요':'표시 없이 적은 글이에요',26,38,1,'#637359');y+=10;
  text(entry.note||'아직 적은 글이 없어요.',36,52,14);y+=32;
 }
 commands.push({type:'line',x:MARGIN,y,width:CONTENT,color:'#d7e2cf'});y+=22;
 if(truncated){text('글이 길어 일부만 담았어요.',24,34,1,'#815a25');text('전체 내용은 글 파일로 받아주세요.',24,34,1,'#815a25');y+=10;}
 text('내가 고른 장소와 직접 남긴 기록이에요.',24,34,1,'#637359');
 text('방문 사실이나 식물 이름을 증명하지 않아요.',24,34,1,'#637359');
 const height=Math.ceil(y+56);
 if(height>CARD_MAX_HEIGHT)throw new Error('글이 많아 카드에 담지 못했어요. 글 파일로 받아주세요.');
 return {width:CARD_WIDTH,height,commands,truncated};
}
