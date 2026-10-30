import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import React from 'react';
import {create,act} from 'react-test-renderer';
import {build} from 'esbuild';
const out=new URL(`.tree-map-test-${process.pid}.mjs`,import.meta.url);
const result=await build({absWorkingDir:fileURLToPath(new URL('../',import.meta.url)),entryPoints:['src/TreeMapPanel.jsx'],bundle:true,platform:'node',format:'esm',write:false,external:['react'],plugins:[{name:'mock',setup(b){b.onLoad({filter:/[\\/]cloud-runtime\.js$/},()=>({contents:'export const getRuntime=()=>globalThis.__mapRuntime;',loader:'js'}));}}]});
await fs.writeFile(out,result.outputFiles[0].text);let Panel;try{({default:Panel}=await import(out.href));}finally{await fs.unlink(out);}
const center={id:'jangseong',name:'국립장성숲체원'},noop=()=>{};
function label(x){return typeof x==='number'?String(x):typeof x==='string'?x:Array.isArray(x)?x.map(label).join(''):x?.props?label(x.props.children):'';}
const button=(root,name)=>root.root.findAllByType('button').find(b=>label(b.props.children)===name);
function Canvas({onPick,onSelect,editable,markers}){return React.createElement('div',null,React.createElement('button',{onClick:()=>onSelect(markers.find(m=>m.trees?.some(t=>t.id==='japanese-maple'))?.id)},'단풍 표시 선택'),React.createElement('button',{disabled:!editable,onClick:()=>onPick({lat:35,lng:126})},'선택할 지도 지점'));}
async function setup({reviewer=true,rows=[],panelProps={},save=async(_uid,_c,id,value,revision)=>({id,...value,revision:revision+1})}={}){
 let subscriber;globalThis.requestAnimationFrame=fn=>fn();globalThis.window={confirm:()=>true};
 globalThis.__mapRuntime={subscribe:fn=>{subscriber=fn;fn(reviewer?{uid:'reviewer'}:null);return noop;},sharing:{grants:async()=>reviewer?['jangseong']:[]},places:{list:async()=>rows,save}};
 let root;await act(async()=>root=create(React.createElement(Panel,{center,onState:noop,onBack:noop,Canvas,apiKey:'test-key',...panelProps})));return {root,auth:value=>subscriber(value)};
}
test('reviewer selects a point, explicitly confirms publication, and changing the point clears consent',async()=>{
 let calls=0,args;const {root}=await setup({save:async(...a)=>{calls++;args=a;return {id:a[2],...a[3],revision:1};}});
 await act(async()=>button(root,'지도에서 나무 위치 고르기').props.onClick());assert.equal(calls,0);assert.equal(button(root,'이 위치 공개하기').props.disabled,true);
 await act(async()=>button(root,'선택할 지도 지점').props.onClick());const consent=()=>root.root.findByProps({type:'checkbox'});assert.equal(consent().props.checked,false);
 await act(async()=>consent().props.onChange({target:{checked:true}}));await act(async()=>button(root,'선택할 지도 지점').props.onClick());assert.equal(consent().props.checked,false);
 await act(async()=>consent().props.onChange({target:{checked:true}}));await act(async()=>root.root.findByProps({'aria-label':'공개 나무 위치 선택'}).props.onSubmit({preventDefault(){}}));assert.equal(calls,1);assert.deepEqual(args[3].coordinates,{lat:35,lng:126});assert.equal(args[4],0);assert.ok(JSON.stringify(root.toJSON()).includes('위치를 공개했어요'));await act(async()=>root.unmount());
});
test('visitors can choose tree details but cannot edit, and late saves cannot update a changed account',async()=>{
 let env=await setup({reviewer:false,rows:[{id:'japanese-maple',label:'숙소동2에서 숲누림길로 올라가는 시작점',coordinates:{lat:35,lng:126},revision:1}]});assert.equal(button(env.root,'지도에서 나무 위치 고르기'),undefined);await act(async()=>button(env.root,'지도 열기').props.onClick());await act(async()=>button(env.root,'단풍 표시 선택').props.onClick());assert.ok(JSON.stringify(env.root.toJSON()).includes('숙소동2에서 숲누림길'));await act(async()=>env.root.unmount());
 let finish;env=await setup({save:()=>new Promise(r=>finish=r)});const root=env.root;
 await act(async()=>button(root,'지도에서 나무 위치 고르기').props.onClick());await act(async()=>button(root,'선택할 지도 지점').props.onClick());await act(async()=>root.root.findByProps({type:'checkbox'}).props.onChange({target:{checked:true}}));
 await act(async()=>{root.root.findByProps({'aria-label':'공개 나무 위치 선택'}).props.onSubmit({preventDefault(){}});});await act(async()=>env.auth(null));await act(async()=>finish({id:'hinoki',label:'late',coordinates:{lat:35,lng:126},revision:1}));assert.equal(button(root,'이 위치 공개하기'),undefined);assert.ok(!JSON.stringify(root.toJSON()).includes('위치를 공개했어요'));await act(async()=>root.unmount());
});

const nearRows=[
 {id:'hinoki',label:'숙소동1 부근 난간 근처',coordinates:{lat:35,lng:126},revision:1},
 {id:'galcham-oak',label:'숙소동1 부근 난간 근처',coordinates:{lat:35.00001,lng:126},revision:3},
 {id:'japanese-maple',label:'숙소동2에서 숲누림길로 올라가는 시작점',coordinates:{lat:35.001,lng:126},revision:2}
];
const placeButtons=root=>root.root.findByProps({'aria-label':'관찰할 장소 선택'}).findAllByType('button');
const choices=root=>root.root.findByProps({'aria-label':'이 장소에서 살펴볼 나무'}).findAllByType('button');
const treePicker=root=>root.root.findByProps({'aria-label':'찾고 싶은 나무 고르기'}).findAllByProps({className:'tree-place-choice'});
test('tree-first picker isolates a place even when different places have identical coordinates; all places remain available',async()=>{
 let changed=[],writes=0;const samePoint=nearRows.map(row=>({...row,coordinates:{lat:35,lng:126}}));
 const {root}=await setup({reviewer:false,rows:samePoint,panelProps:{onTreeSelect:id=>changed.push(id)},save:async()=>writes++});
 assert.equal(treePicker(root).length,3);await act(async()=>button(root,'지도 열기').props.onClick());
 const canvas=()=>root.root.findByType(Canvas);assert.equal(canvas().props.markers.length,1);
 await act(async()=>treePicker(root)[2].props.onClick());assert.equal(treePicker(root)[2].props['aria-pressed'],true);assert.equal(canvas().props.markers.length,1);assert.equal(canvas().props.markers[0].trees[0].id,'japanese-maple');assert.deepEqual(changed,['japanese-maple']);
 await act(async()=>button(root,'모든 장소 보기').props.onClick());assert.equal(canvas().props.markers.length,2);
 await act(async()=>treePicker(root)[1].props.onClick());assert.equal(canvas().props.markers.length,1);assert.equal(treePicker(root)[1].props['aria-pressed'],true);assert.equal(choices(root)[1].props['aria-pressed'],true);assert.equal(writes,0);
 await act(async()=>root.unmount());
});
test('cancelling a location edit preserves selected tree, consent, and all-place mode',async()=>{
 const {root}=await setup({rows:nearRows});await act(async()=>button(root,'모든 장소 보기').props.onClick());
 await act(async()=>button(root,'지도에서 나무 위치 고르기').props.onClick());await act(async()=>button(root,'선택할 지도 지점').props.onClick());await act(async()=>root.root.findByProps({type:'checkbox'}).props.onChange({target:{checked:true}}));
 window.confirm=()=>false;await act(async()=>treePicker(root)[2].props.onClick());assert.equal(treePicker(root)[0].props['aria-pressed'],true);assert.equal(root.root.findByProps({type:'checkbox'}).props.checked,true);assert.ok(button(root,'고른 나무의 장소만 보기'));
 window.confirm=()=>true;await act(async()=>button(root,'위치 선택 취소').props.onClick());assert.ok(button(root,'고른 나무의 장소만 보기'));await act(async()=>root.unmount());
});
test('visitors see two place pins, choose nearby trees by photo, and never write a location',async()=>{
 let writes=0;const {root}=await setup({reviewer:false,rows:nearRows,save:async()=>{writes++;}});
 assert.equal(placeButtons(root).length,2);assert.equal(choices(root).length,2);
 assert.ok(label(placeButtons(root)[0].props.children).includes('편백나무 · 갈참나무 · 2종'));
 assert.equal(choices(root)[0].findAllByType('img')[0].props.src,'/experience/hinoki-leaf-v29.jpg');
 await act(async()=>button(root,'지도 열기').props.onClick());
 const canvas=()=>root.root.findByType(Canvas);assert.equal(canvas().props.markers.length,1);await act(async()=>button(root,'모든 장소 보기').props.onClick());assert.equal(canvas().props.markers.length,2);
 const first=canvas().props.markers[0];assert.deepEqual(first.coordinates,nearRows[0].coordinates);assert.equal(first.trees.length,2);
 await act(async()=>choices(root)[1].props.onClick());assert.equal(choices(root)[1].props['aria-pressed'],true);assert.ok(JSON.stringify(root.toJSON()).includes('갈참나무 잎'));
 await act(async()=>placeButtons(root)[1].props.onClick());assert.equal(choices(root).length,1);assert.equal(choices(root)[0].props['aria-pressed'],true);assert.deepEqual(canvas().props.focusPoint,nearRows[2].coordinates);
 await act(async()=>canvas().props.onSelect(first.id));assert.equal(choices(root).length,2);assert.equal(writes,0);
 await act(async()=>choices(root)[0].findByType('img').props.onError());assert.ok(label(choices(root)[0].props.children).includes('사진 준비 중'));assert.ok(label(choices(root)[0].props.children).includes('편백나무'));
 await act(async()=>root.unmount());
});
test('unpublished trees stay selectable without a fabricated pin, even without a map key',async()=>{
 const {root}=await setup({reviewer:false,rows:[{...nearRows[0],coordinates:null}]});
 assert.equal(placeButtons(root).length,2);await act(async()=>button(root,'지도 열기').props.onClick());assert.equal(root.root.findByType(Canvas).props.markers.length,0);
 assert.equal(choices(root).length,2);await act(async()=>choices(root)[1].props.onClick());assert.ok(JSON.stringify(root.toJSON()).includes('지도 위치가 아직 없어요'));
 await act(async()=>root.update(React.createElement(Panel,{center,onState:noop,onBack:noop,Canvas,apiKey:''})));
 assert.equal(root.root.findAllByType(Canvas).length,0);assert.equal(placeButtons(root).length,2);assert.equal(choices(root).length,2);await act(async()=>root.unmount());
});
test('reviewers edit individual pins, cancellation keeps drafts, and grouping never changes another tree',async()=>{
 let args;const {root}=await setup({rows:nearRows,save:async(...a)=>{args=a;return {id:a[2],...a[3],revision:a[4]+1};}});
 await act(async()=>button(root,'지도 열기').props.onClick());await act(async()=>button(root,'모든 장소 보기').props.onClick());assert.equal(root.root.findByType(Canvas).props.markers.length,2);
 await act(async()=>choices(root)[1].props.onClick());await act(async()=>button(root,'지도에서 나무 위치 고르기').props.onClick());
 let canvas=root.root.findByType(Canvas);assert.equal(canvas.props.markers.length,3);assert.equal(canvas.props.editable,true);assert.equal(canvas.props.focusPoint,null);
 await act(async()=>canvas.props.onPick({lat:35.00002,lng:126.00001}));await act(async()=>root.root.findByProps({type:'checkbox'}).props.onChange({target:{checked:true}}));
 window.confirm=()=>false;await act(async()=>placeButtons(root)[1].props.onClick());assert.equal(root.root.findByProps({type:'checkbox'}).props.checked,true);assert.equal(choices(root).length,2);
 assert.equal(args,undefined);window.confirm=()=>true;
 await act(async()=>root.root.findByProps({'aria-label':'공개 나무 위치 선택'}).props.onSubmit({preventDefault(){}}));
 assert.equal(args[2],'galcham-oak');assert.equal(args[4],3);assert.deepEqual(args[3].coordinates,{lat:35.00002,lng:126.00001});
 canvas=root.root.findByType(Canvas);assert.equal(canvas.props.markers.length,2);assert.deepEqual(canvas.props.markers[0].coordinates,nearRows[0].coordinates);assert.equal(canvas.props.markers[0].trees.find(t=>t.id==='hinoki').revision,1);
 await act(async()=>root.unmount());
});

test('private observation text stays separate from a reviewer public-location draft',async()=>{
 let changed=0,shown=0;
 const entries={hinoki:{note:'내가 따로 적은 관찰 글',observed:false}};
 const {root}=await setup({panelProps:{visitEntries:entries,onVisitChange:()=>changed++,onViewRecords:()=>shown++}});
 assert.equal(root.root.findByProps({'aria-label':'편백나무에 글 남기기'}).findByType('textarea').props.value,entries.hinoki.note);
 await act(async()=>button(root,'지도에서 나무 위치 고르기').props.onClick());assert.equal(root.root.findAllByType('textarea').length,0);
 assert.ok(root.root.findByProps({'aria-label':'공개 나무 위치 선택'}));assert.ok(!JSON.stringify(root.toJSON()).includes(entries.hinoki.note));
 await act(async()=>button(root,'위치 선택 취소').props.onClick());assert.equal(root.root.findByType('textarea').props.value,entries.hinoki.note);
 await act(async()=>button(root,'내 기록 보기').props.onClick());assert.equal(shown,1);assert.equal(changed,0);assert.equal(entries.hinoki.observed,false);
 await act(async()=>root.unmount());
});
