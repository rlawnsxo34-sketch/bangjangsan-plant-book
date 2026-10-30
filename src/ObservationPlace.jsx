import React from 'react';
import PlaceGuidePhoto from './PlaceGuidePhoto.jsx';
import {observationPlace,placeMapURL} from './observation-places.js';
export function PlaceMapLink({place}){
 const href=placeMapURL(place);
 return href?<a className="visit-secondary tree-map-link" href={href} target="_blank" rel="noopener noreferrer" referrerPolicy="no-referrer" aria-label={`${place.label} 지도에서 보기 (카카오맵, 새 창)`}>지도에서 보기 (카카오맵)</a>:null;
}
export default function ObservationPlace({centerId,tree,onMap}){
 const place=observationPlace(centerId,tree.id);
 return place?<aside className="tree-place" aria-label={`${tree.name} 관찰 장소`}><h3>어디서 볼 수 있나요?</h3><p className="tree-place-label">{place.label}</p><PlaceGuidePhoto centerId={centerId} label={place.label}/>{onMap&&<button type="button" className="visit-secondary tree-map-link" onClick={onMap}>나무 지도에서 찾기</button>}<p className="tree-place-note">알려주신 장소를 바탕으로 안내해요. 현장 안내와 통행 가능한 길을 확인해주세요.</p></aside>:<p className="tree-place-pending">이 숲체원의 관찰 장소는 준비 중이에요.</p>;
}
