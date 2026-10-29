// Institution-specific places supplied by the user. No coordinates are inferred.
// The key must match the forestCenters document ID, not its display name.
export const OBSERVATION_PLACES={
 jangseong:{
  'hinoki':{label:'숙소동1 부근 난간 근처',coordinates:null},
  'galcham-oak':{label:'숙소동1 부근 난간 근처',coordinates:null},
  'japanese-maple':{label:'숙소동2에서 숲누림길로 올라가는 시작점',coordinates:null}
 }
};
export function placeCoordinates(value){
 if(!value||typeof value.lat!=='number'||typeof value.lng!=='number'||!Number.isFinite(value.lat)||!Number.isFinite(value.lng)||Math.abs(value.lat)>90||Math.abs(value.lng)>180)return null;
 return {lat:value.lat,lng:value.lng};
}
export function placeMapURL(place){
 const point=placeCoordinates(place?.coordinates);
 return point&&typeof place.label==='string'&&place.label.trim()?`https://map.kakao.com/link/map/${encodeURIComponent(place.label)},${point.lat},${point.lng}`:null;
}
export function observationPlace(centerId,treeId){
 if(!Object.hasOwn(OBSERVATION_PLACES,centerId))return null;
 const places=OBSERVATION_PLACES[centerId];
 if(!Object.hasOwn(places,treeId))return null;
 const value=places[treeId];
 if(typeof value?.label!=='string'||!value.label.trim())return null;
 const point=placeCoordinates(value.coordinates);
 return {label:value.label,...(point?{coordinates:point}:{})};
}
export function observationPlaceNotice(centerId,fallback){
 const hasPlaces=Object.hasOwn(OBSERVATION_PLACES,centerId)&&Object.values(OBSERVATION_PLACES[centerId]).some(value=>value?.label?.trim());
 const hasMap=hasPlaces&&Object.values(OBSERVATION_PLACES[centerId]).some(value=>placeMapURL(value));
 return hasPlaces&&fallback==='실제 관찰 지점은 준비 중이에요. 이 목록은 선택한 기관에서 세 나무를 모두 만날 수 있다는 안내가 아닙니다.'?(hasMap?'좌표가 등록된 나무는 지도에서 보기를 이용할 수 있어요. 현장 안내와 통행 가능한 길을 확인해주세요.':'장소 안내를 참고하고, 지도에 등록된 위치는 숲 둘러보기의 나무 지도에서 확인해주세요.'):fallback;
}
export function observationPlaceReview(centerId,fallback){
 return Object.hasOwn(OBSERVATION_PLACES,centerId)&&fallback==='장소 확인 전 시범 체험'?'관찰 장소 안내 · 시범 체험':fallback;
}
