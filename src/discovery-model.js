import {localizeCandidate} from '../backend/korean-names.mjs';
export function selectedCandidate(row){
 const selected=row?.aiSelection;
 if(selected?.provider!=='plantnet'||typeof selected.scientificName!=='string'||!selected.scientificName.trim()||selected.scientificName.length>200)return null;
 return localizeCandidate({scientificName:selected.scientificName,commonName:typeof selected.commonName==='string'?selected.commonName:''});
}
const time=value=>Number.isSafeInteger(value)&&value>0&&value<=8640000000000000?value:null;
// This only recognizes the explicit saved label, not an AI confidence or review status.
export function isUnnamedObservation(row){
 return typeof row?.name==='string'&&row.name.normalize('NFC').replace(/\s+/g,'')==='이름모름';
}
export function filterDiscoveries(records,query,scope='all',nameSource='all'){
 return (Array.isArray(records)?records:[]).filter(row=>(scope!=='unnamed'||isUnnamedObservation(row))&&(nameSource==='ai'?!!selectedCandidate(row):nameSource==='other'?!selectedCandidate(row):true)&&matchesObservation(row,query));
}
export function sortObservations(records,order='newest'){
 return (Array.isArray(records)?records:[]).map((row,index)=>({row,index,stamp:time(row.createdAt)})).sort((a,b)=>{
  if(a.stamp===null||b.stamp===null)return a.stamp===b.stamp?a.index-b.index:a.stamp===null?1:-1;
  return (order==='oldest'?a.stamp-b.stamp:b.stamp-a.stamp)||a.index-b.index;
 }).map(item=>item.row);
}
export function summarizeDiscoveries(records){
 const rows=Array.isArray(records)?records:[],groups=new Map(),unclassified=[];
 for(const row of rows){
  const candidate=selectedCandidate(row);
  if(!candidate){unclassified.push(row);continue;}
  const key=candidate.scientificName;
  let group=groups.get(key);
  if(!group){group={key,scientificName:key,name:candidate.koreanName||key,records:[],firstSavedAt:null,lastSavedAt:null,centers:[]};groups.set(key,group);}
  // A localized name may be absent in an older response for the same candidate.
  if(group.name===key&&candidate.koreanName)group.name=candidate.koreanName;
  group.records.push(row);
  const savedAt=time(row.createdAt);
  if(savedAt!==null){group.firstSavedAt=group.firstSavedAt===null?savedAt:Math.min(group.firstSavedAt,savedAt);group.lastSavedAt=group.lastSavedAt===null?savedAt:Math.max(group.lastSavedAt,savedAt);}
  if(typeof row.centerName==='string'&&row.centerName.trim()&&!group.centers.includes(row.centerName.trim()))group.centers.push(row.centerName.trim());
 }
 const sorted=[...groups.values()].sort((a,b)=>(b.firstSavedAt||0)-(a.firstSavedAt||0)||a.scientificName.localeCompare(b.scientificName));
 for(const group of sorted)group.records.sort((a,b)=>(time(b.createdAt)||0)-(time(a.createdAt)||0));
 unclassified.sort((a,b)=>(time(b.createdAt)||0)-(time(a.createdAt)||0));
 return {recordCount:rows.length,candidateCount:sorted.length,unclassifiedCount:unclassified.length,groups:sorted,unclassified,recent:sorted.filter(g=>g.firstSavedAt!==null).slice(0,3)};
}
export function matchesObservation(row,query){
 const q=String(query||'').trim().normalize('NFC').toLocaleLowerCase('ko');
 if(!q)return true;
 const candidate=selectedCandidate(row);
 return [row.name,row.centerName,candidate?.scientificName,candidate?.koreanName,candidate?.commonName].some(x=>typeof x==='string'&&x.normalize('NFC').toLocaleLowerCase('ko').includes(q));
}
export function savedDate(value){const stamp=time(value);return stamp===null?'저장일 미상':new Date(stamp).toLocaleDateString('ko-KR',{year:'numeric',month:'long',day:'numeric'});}
