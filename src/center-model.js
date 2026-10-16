export const CENTER_PREFERENCE_KEY='egmy-observation-center-v1';
export const validCenterId=id=>typeof id==='string'&&id.length>0&&id.length<=80&&!id.includes('/')&&id!=='.'&&id!=='..';
export function activeCenters(rows){
 const seen=new Set();
 return (Array.isArray(rows)?rows:[]).filter(c=>c&&c.active===true&&validCenterId(c.id)&&typeof c.name==='string'&&c.name.trim()&&c.name.length<=80&&!seen.has(c.id)&&seen.add(c.id))
  .map(c=>({id:c.id,name:c.name,isDemo:c.isDemo===true})).sort((a,b)=>a.name.localeCompare(b.name,'ko'));
}
export function readCenterPreference(storage){try{const id=storage.getItem(CENTER_PREFERENCE_KEY);return validCenterId(id)?id:'';}catch(_){return '';}}
export function saveCenterPreference(storage,id){try{if(validCenterId(id))storage.setItem(CENTER_PREFERENCE_KEY,id);}catch(_){/* Selection still works when browser storage is blocked. */}}
export function institutionFields(center){
 if(!center||!validCenterId(center.id)||typeof center.name!=='string'||!center.name.trim()||center.name.length>80)throw new Error('관찰할 숲체원을 먼저 선택해주세요.');
 return {centerId:center.id,centerName:center.name};
}
export function canShareAt(row,id){return !row.centerId||row.centerId===id;}
