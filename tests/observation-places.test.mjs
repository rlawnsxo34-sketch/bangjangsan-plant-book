import test from 'node:test';
import assert from 'node:assert/strict';
import {observationPlace,observationPlaceNotice,observationPlaceReview,OBSERVATION_PLACES,placeCoordinates,placeMapURL} from '../src/observation-places.js';
import {EXPERIENCE} from '../src/experience-data.js';
test('places are isolated by exact institution and species IDs, with no guessed coordinates',()=>{
 assert.equal(observationPlace('jangseong','hinoki')?.label,'숙소동1 부근 난간 근처');
 assert.equal(observationPlace('jangseong','galcham-oak')?.label,'숙소동1 부근 난간 근처');
 assert.equal(observationPlace('jangseong','japanese-maple')?.label,'숙소동2에서 숲누림길로 올라가는 시작점');
 for(const center of ['other','jangseong-demo','국립장성숲체원','__proto__','toString',undefined])assert.equal(observationPlace(center,'hinoki'),null);
 for(const tree of ['cork-oak','unknown','__proto__','constructor'])assert.equal(observationPlace('jangseong',tree),null);
 const copy=observationPlace('jangseong','hinoki');copy.label='changed';assert.notEqual(OBSERVATION_PLACES.jangseong.hinoki.label,'changed');
});
test('only default stale text changes for a configured center; institution-authored guidance is retained',()=>{
 assert.notEqual(observationPlaceNotice('jangseong',EXPERIENCE.locationNotice),EXPERIENCE.locationNotice);
 assert.equal(observationPlaceNotice('other',EXPERIENCE.locationNotice),EXPERIENCE.locationNotice);
 assert.equal(observationPlaceNotice('jangseong','기관에서 직접 확인한 안내'),'기관에서 직접 확인한 안내');
 assert.equal(observationPlaceReview('jangseong',EXPERIENCE.reviewLabel),'관찰 장소 안내 · 시범 체험');
 assert.equal(observationPlaceReview('other',EXPERIENCE.reviewLabel),EXPERIENCE.reviewLabel);
 assert.equal(observationPlaceReview('jangseong','기관 고유 표시'),'기관 고유 표시');
 for(const tree of EXPERIENCE.trees){assert.equal(tree.location,null);assert.equal(tree.reviewed,false);}
});

test('map URLs use only an explicitly registered pair and encode the public label',()=>{
 const label='난간, 앞/나무 #1';const point={lat:35.12345,lng:126.12345};
 assert.equal(placeMapURL({label,coordinates:point}),`https://map.kakao.com/link/map/${encodeURIComponent(label)},35.12345,126.12345`);
 assert.deepEqual(placeCoordinates({...point,uid:'private'}),point);
 for(const coordinates of [null,{}, {lat:35},{lat:35,lng:null},{lat:'35',lng:126},{lat:NaN,lng:126},{lat:35,lng:Infinity},{lat:91,lng:126},{lat:35,lng:-181}]){assert.equal(placeCoordinates(coordinates),null);assert.equal(placeMapURL({label,coordinates}),null);}
 assert.equal(placeMapURL({label:'',coordinates:point}),null);
});
test('configured coordinates are copied and stay within the exact institution',()=>{
 const original=OBSERVATION_PLACES.jangseong.hinoki.coordinates;
 try{OBSERVATION_PLACES.jangseong.hinoki.coordinates={lat:35.12345,lng:126.12345};
 const result=observationPlace('jangseong','hinoki');assert.ok(placeMapURL(result));result.coordinates.lat=0;assert.equal(OBSERVATION_PLACES.jangseong.hinoki.coordinates.lat,35.12345);
 assert.equal(observationPlace('other','hinoki'),null);assert.ok(observationPlaceNotice('jangseong',EXPERIENCE.locationNotice).includes('지도에서 보기'));
 }finally{OBSERVATION_PLACES.jangseong.hinoki.coordinates=original;}
});
