// Pl@ntNet API images only. Retain attribution; do not proxy arbitrary URLs.
export const REFERENCE_IMAGE_ORIGIN='https://bs.plantnet.org';
function imageUrl(value){
 if(typeof value!=='string'||value.length>500)return '';
 try {
  const url=new URL(value);
  return url.origin===REFERENCE_IMAGE_ORIGIN&&!url.username&&!url.password&&!url.search&&!url.hash&&/^\/image\/[smo]\/[A-Za-z0-9_-]{16,128}$/.test(url.pathname)?url.href:'';
 }catch(_){return '';}
}
function licenseInfo(value){
 if(typeof value!=='string'||value.length>150)return null;
 const raw=value.trim().toLowerCase();
 const urlMatch=raw.match(/^https?:\/\/creativecommons\.org\/licenses\/(by-sa|by)\/(\d\.\d)\/?$/);
 const code=raw.replace(/\s+/g,'-');
 const textMatch=code.match(/^cc-(by-sa|by)(?:-(\d\.\d))?$/);
 const match=urlMatch||textMatch;
 if(!match)return null;
 const type=match[1],version=match[2];
 if(version&&!['1.0','2.0','2.5','3.0','4.0'].includes(version))return null;
 return {license:'CC '+type.toUpperCase()+(version?' '+version:''),licenseUrl:version?'https://creativecommons.org/licenses/'+type+'/'+version+'/':'https://creativecommons.org/licenses/'};
}
export function referenceImages(value,{provider=false}={}){
 const rows=Array.isArray(value)?value:[],result=[],seen=new Set();
 for(const row of rows.slice(0,30)){
  if(!row||typeof row!=='object')continue;
  const thumbnailUrl=provider?imageUrl(row.url?.m)||imageUrl(row.url?.s)||imageUrl(row.url?.o):imageUrl(row.thumbnailUrl);
  const originalUrl=provider?imageUrl(row.url?.o)||thumbnailUrl:imageUrl(row.originalUrl)||thumbnailUrl;
  const author=typeof row.author==='string'?row.author.trim():'';
  const license=licenseInfo(row.license);
  if(!thumbnailUrl||!author||author.length>200||!license||seen.has(originalUrl))continue;
  seen.add(originalUrl);
  result.push({thumbnailUrl,originalUrl,author,...license,
   citation:typeof row.citation==='string'&&row.citation.length<=500?row.citation.trim():'',
   organ:['leaf','flower','fruit','bark','habit','other'].includes(row.organ)?row.organ:'other'});
  if(result.length===2)break;
 }
 return result;
}
