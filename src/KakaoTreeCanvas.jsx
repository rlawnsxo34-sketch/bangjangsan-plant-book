import React,{useEffect,useRef,useState} from 'react';
import {loadKakaoMap} from './kakao-loader.js';
export default function KakaoTreeCanvas({apiKey,markers,onSelect,onPick,editable=false,pending=null,focusPoint=null,centerName,load=loadKakaoMap}){
 const container=useRef(null),map=useRef(null),sdk=useRef(null),callbacks=useRef({}),searchRequest=useRef(0),alive=useRef(false),searchTimer=useRef(null);
 callbacks.current={onSelect,onPick,editable};
 const[ready,setReady]=useState(false),[error,setError]=useState(''),[query,setQuery]=useState(centerName),[results,setResults]=useState([]),[searching,setSearching]=useState(false),[searchNotice,setSearchNotice]=useState('');
 useEffect(()=>{alive.current=true;let cancelled=false,observer,click,m;
  load(apiKey).then(maps=>{if(cancelled)return;sdk.current=maps;m=new maps.Map(container.current,{center:new maps.LatLng(36.5,127.8),level:13});map.current=m;
   click=event=>{if(callbacks.current.editable)callbacks.current.onPick?.({lat:event.latLng.getLat(),lng:event.latLng.getLng()});};maps.event.addListener(m,'click',click);
   if(typeof ResizeObserver!=='undefined'){observer=new ResizeObserver(()=>{const point=m.getCenter();m.relayout();m.setCenter(point);});observer.observe(container.current);}setReady(true);
  }).catch(e=>{if(!cancelled)setError(e.message);});
  return()=>{alive.current=false;cancelled=true;searchRequest.current++;clearTimeout(searchTimer.current);observer?.disconnect();if(m&&sdk.current)sdk.current.event.removeListener(m,'click',click);map.current=null;};
 },[apiKey,load]);
 useEffect(()=>{if(!ready||!map.current)return;const maps=sdk.current,m=map.current,items=[];const bounds=new maps.LatLngBounds();
  for(const row of markers){const point=new maps.LatLng(row.coordinates.lat,row.coordinates.lng),marker=new maps.Marker({map:m,position:point,title:row.name});const handler=()=>{if(callbacks.current.editable)callbacks.current.onPick?.({lat:point.getLat(),lng:point.getLng()});else callbacks.current.onSelect?.(row.id);};maps.event.addListener(marker,'click',handler);items.push([marker,handler]);bounds.extend(point);}
  if(items.length===1){m.setCenter(items[0][0].getPosition());m.setLevel(3);}else if(items.length)m.setBounds(bounds);
  return()=>{for(const [marker,handler]of items){maps.event.removeListener(marker,'click',handler);marker.setMap(null);}};
 },[ready,markers]);
 useEffect(()=>{if(!ready||!focusPoint||!map.current)return;map.current.setCenter(new sdk.current.LatLng(focusPoint.lat,focusPoint.lng));map.current.setLevel(3);},[ready,focusPoint?.lat,focusPoint?.lng]);
 useEffect(()=>{if(!ready||!pending||!map.current)return;const maps=sdk.current;const marker=new maps.Marker({map:map.current,position:new maps.LatLng(pending.lat,pending.lng),opacity:.65,zIndex:10,title:'선택 중인 위치 · 저장 전'});return()=>marker.setMap(null);},[ready,pending]);
 function search(e){e.preventDefault();if(!ready||!query.trim())return;const token=++searchRequest.current;setSearching(true);setResults([]);setSearchNotice('');clearTimeout(searchTimer.current);
  searchTimer.current=setTimeout(()=>{if(alive.current&&token===searchRequest.current){searchRequest.current++;setSearching(false);setSearchNotice('검색이 늦어지고 있어요. 다시 시도해주세요.');}},10000);
  try{new sdk.current.services.Places().keywordSearch(query.trim(),(rows,status)=>{if(!alive.current||token!==searchRequest.current)return;clearTimeout(searchTimer.current);setSearching(false);if(status===sdk.current.services.Status.OK)setResults(rows.slice(0,5));else setSearchNotice('장소를 찾지 못했어요. 다른 이름으로 검색해주세요.');});}catch(_){clearTimeout(searchTimer.current);setSearching(false);setSearchNotice('장소를 찾지 못했어요. 다시 시도해주세요.');}
 }
 function move(result){if(!map.current)return;const lat=Number(result.y),lng=Number(result.x);if(!Number.isFinite(lat)||!Number.isFinite(lng))return;map.current.setCenter(new sdk.current.LatLng(lat,lng));map.current.setLevel(3);setResults([]);setSearchNotice('지도를 이동했어요. 나무 위치를 저장한 것은 아니에요.');}
 return <div className="kakao-tree-canvas">{error&&<p role="alert">{error}</p>}{!ready&&!error&&<p role="status">지도를 불러오고 있어요…</p>}
  <div className="tree-map-frame"><div ref={container} className="tree-map-surface" role="region" aria-label="카카오 나무 지도"/>{editable&&<span className="tree-map-crosshair" aria-hidden="true">+</span>}</div>
  {ready&&<><div className="tree-map-tools" role="group" aria-label="지도 확대 축소"><button type="button" className="visit-secondary" onClick={()=>map.current?.setLevel(Math.max(1,map.current.getLevel()-1))}>지도 확대</button><button type="button" className="visit-secondary" onClick={()=>map.current?.setLevel(Math.min(14,map.current.getLevel()+1))}>지도 축소</button></div><form className="tree-map-search" onSubmit={search}><label>숲체원·건물 찾기<input value={query} onChange={e=>setQuery(e.target.value)} maxLength={100}/></label><button className="visit-secondary" disabled={searching||!query.trim()}>{searching?'찾는 중…':'지도 이동'}</button></form><p className="tree-map-help">검색은 지도를 이동해요. 표시는 등록된 관찰 위치에만 나타나요.</p>{searchNotice&&<p role="status">{searchNotice}</p>}<ul>{results.map(r=><li key={r.id}><button type="button" className="tree-search-result" onClick={()=>move(r)}>{r.place_name}<small>{r.road_address_name||r.address_name}</small></button></li>)}</ul>
  {editable&&<div className="tree-map-keyboard"><p>나무가 있는 곳을 누르거나, 지도를 움직여 가운데 위치를 골라주세요.</p><div>{[['위',0,-100],['아래',0,100],['왼쪽',-100,0],['오른쪽',100,0]].map(([label,x,y])=><button type="button" key={label} className="visit-secondary" onClick={()=>map.current?.panBy(x,y)}>{label}로 이동</button>)}<button type="button" className="visit-secondary" onClick={()=>{const point=map.current?.getCenter();if(point)callbacks.current.onPick?.({lat:point.getLat(),lng:point.getLng()});}}>지도 가운데를 위치로 선택</button></div></div>}
  </>}
 </div>;
}
