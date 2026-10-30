// Optional, surveyed place photos. Keep empty until real field photos are added.
// Institution document ID and place description must both match.
export const PLACE_GUIDE_PHOTOS={
 jangseong:{
  '숙소동1 부근 난간 근처':{src:'',alt:'숙소동1 부근 난간 근처의 주변 모습',caption:'숙소동1 부근 난간 근처',credit:''},
  '숙소동2에서 숲누림길로 올라가는 시작점':{src:'',alt:'숙소동2에서 숲누림길로 올라가는 시작점의 주변 모습',caption:'숙소동2에서 숲누림길로 올라가는 시작점',credit:''}
 }
};
export function placeGuidePhoto(centerId,label,source=PLACE_GUIDE_PHOTOS){
 const key=typeof label==='string'?label.trim().replace(/\s+/g,' '):'';
 if(!source||!Object.hasOwn(source,centerId)||!source[centerId]||!Object.hasOwn(source[centerId],key))return null;
 const photo=source[centerId][key];
 if(!photo||typeof photo.src!=='string'||!/^\/place-guides\/[a-z0-9][a-z0-9._-]*\.(?:jpe?g|png|webp)$/i.test(photo.src))return null;
 return {src:photo.src,alt:typeof photo.alt==='string'&&photo.alt.trim()?photo.alt.slice(0,200):key+'의 주변 모습',caption:typeof photo.caption==='string'?photo.caption.slice(0,200):key,credit:typeof photo.credit==='string'?photo.credit.slice(0,160):''};
}
