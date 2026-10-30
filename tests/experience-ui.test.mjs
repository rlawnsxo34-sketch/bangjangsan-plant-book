import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import React from 'react';
import {create,act} from 'react-test-renderer';
import {build} from 'esbuild';
import {newVisit} from '../src/experience-model.js';
const bundlePath=new URL(`.experience-test-${process.pid}.mjs`,import.meta.url);
const built=await build({absWorkingDir:fileURLToPath(new URL('../',import.meta.url)),entryPoints:['src/ExperiencePanel.jsx'],bundle:true,platform:'node',format:'esm',write:false,external:['react','@phosphor-icons/react'],plugins:[{name:'no-network-runtime',setup(b){b.onLoad({filter:/[\\/]cloud-runtime\.js$/},()=>({contents:'export const getRuntime=()=>{if(globalThis.__experienceRuntime)return globalThis.__experienceRuntime;throw new Error("실제 Firebase를 사용하지 않는 화면 검사입니다.");};',loader:'js'}));}}]});
await fs.writeFile(bundlePath,built.outputFiles[0].text);
let Panel;
try{({default:Panel}=await import(bundlePath.href));}finally{await fs.unlink(bundlePath);}
const center={id:'jangseong',name:'국립장성숲체원'};
const browser={location:{href:'https://example.test/?token=hidden'},confirm:()=>true};globalThis.window=browser;
function label(value){return typeof value==='string'?value:Array.isArray(value)?value.map(label).join(''):value?.props?label(value.props.children):'';}
function button(root,text){return root.root.findAllByType('button').find(b=>label(b.props.children).includes(text));}
function screenText(root){return JSON.stringify(root.toJSON());}
function Harness({onCapture=()=>{},onPanelState=()=>{}}){const[visit,setVisit]=React.useState(()=>newVisit(center.id));return React.createElement(Panel,{center,visit,onChange:setVisit,onCapture,onPanelState});}
test('visitor can read three activities and create a partial summary without login or uploading a personal photo',async()=>{let root;await act(async()=>root=create(React.createElement(Harness,{})));assert.equal(root.root.findAllByType('textarea').length,3);assert.equal(root.root.findAllByType('img').length,9);assert.ok(screenText(root).includes('관찰 장소 안내 · 시범 체험'));assert.ok(screenText(root).includes('로그인 없이'));
 const cards=root.root.findAllByType('article');assert.equal(cards.length,3);assert.ok(screenText(root).includes('숙소동1 부근 난간 근처'));assert.ok(screenText(root).includes('숙소동2에서 숲누림길로 올라가는 시작점'));assert.equal(root.root.findAllByProps({className:'tree-place'}).length,3);
 for(const card of cards){const gallery=card.findByProps({className:'tree-reference-photos'});assert.equal(gallery.findAllByType('img').length,2);assert.deepEqual(gallery.findAllByType('strong').map(v=>label(v.props.children)),['잎','전체 모습']);assert.equal(gallery.findAllByType('a').length,0);assert.equal(gallery.findAllByType('button').length,2);}

 for(const card of cards){const info=card.findByProps({className:'tree-hints tree-more'});assert.ok(!info.props.open);assert.ok(info.findByProps({className:'tree-description'}));assert.ok(card.findByProps({className:'tree-question'}));assert.equal(card.findAllByType('textarea').length,1);assert.ok(!card.findAllByProps({type:'checkbox'})[0].props.checked);}
 const safety=root.root.findByProps({'aria-label':'관찰 전 안내'});assert.ok(label(safety.props.children).includes('꺾거나'));

 await act(async()=>{root.root.findAllByType('textarea')[0].props.onChange({target:{value:'작은 잎을 보았어요.'}});});
 await act(async()=>button(root,'내 기록 보기').props.onClick());assert.ok(screenText(root).includes('작은 잎을 보았어요.'));assert.ok(screenText(root).includes('살펴봤다는 표시 없이 적은 글'));assert.equal(button(root,'기록 파일 받기').props.disabled,false);assert.ok(!screenText(root).includes('체험 완료'));await act(async()=>root.unmount());});
test('empty summary disables download, observed mark counts only self-report, and reset removes it',async()=>{let root;await act(async()=>root=create(React.createElement(Harness,{})));await act(async()=>button(root,'내 기록 보기').props.onClick());assert.equal(button(root,'기록 파일 받기').props.disabled,true);await act(async()=>button(root,'나무 더 살펴보기').props.onClick());await act(async()=>root.root.findAllByProps({type:'checkbox'})[1].props.onChange({target:{checked:true}}));await act(async()=>button(root,'내 기록 보기').props.onClick());assert.ok(screenText(root).includes('갈참나무'));assert.ok(screenText(root).includes('이름이 맞는지는 확인이 필요해요'));await act(async()=>button(root,'오늘의 발견 지우기').props.onClick());assert.equal(button(root,'기록 파일 받기').props.disabled,true);await act(async()=>root.unmount());});
test('capture handoff is explicit and the visitor link excludes private URL fields',async()=>{let captured=0,root;await act(async()=>root=create(React.createElement(Harness,{onCapture:()=>captured++})));await act(async()=>button(root,'사진으로 이름 찾기').props.onClick());assert.equal(captured,1);const link=root.root.findAllByType('input').find(x=>x.props.readOnly);assert.equal(new URL(link.props.value).searchParams.get('token'),null);await act(async()=>root.unmount());});
test('start actions move focus to activities and show a save reminder before photo handoff',async()=>{let root,captured=0,focused=0,scrolled=0;await act(async()=>root=create(React.createElement(Harness,{onCapture:()=>captured++}),{createNodeMock:node=>node.props.className==='visitor-activity-title'?{scrollIntoView(){scrolled++;},focus(){focused++;}}:null}));await act(async()=>button(root,'주변 나무 둘러보기').props.onClick());assert.equal(scrolled,1);assert.equal(focused,1);assert.equal(captured,0);await act(async()=>root.root.findAllByType('textarea')[0].props.onChange({target:{value:'작은 잎을 찾았어요.'}}));assert.ok(screenText(root).includes('로그인하면 고른 느낌과 글이 지워져요'));await act(async()=>button(root,'사진으로 이름 찾기').props.onClick());assert.equal(captured,1);assert.equal(root.root.findAllByType('textarea')[0].props.value,'작은 잎을 찾았어요.');await act(async()=>root.unmount());});

function installMapRuntime(){
 let writes=0;globalThis.requestAnimationFrame=fn=>fn();
 globalThis.__experienceRuntime={subscribe:fn=>{fn(null);return()=>{};},places:{list:async()=>[],save:async()=>{writes++;throw new Error('방문객 관찰 글은 공개 위치로 저장하면 안 됩니다.');}},sharing:{grants:async()=>[]}};
 return ()=>writes;
}
function viewButton(root,index){return root.root.findByProps({className:'experience-views'}).findAllByType('button')[index];}
function mapChoices(root){return root.root.findByProps({'aria-label':'이 장소에서 살펴볼 나무'}).findAllByType('button');}
test('map observation notes share the existing visitor state through tree changes, cards and summary',async()=>{
 const writes=installMapRuntime();let root;
 try{
  await act(async()=>root=create(React.createElement(Harness,{})));
  await act(async()=>root.root.findAllByType('textarea')[0].props.onChange({target:{value:'카드에서 적은 편백 메모'}}));
  await act(async()=>viewButton(root,1).props.onClick());
  let note=root.root.findByProps({'aria-label':'편백나무에 글 남기기'});assert.equal(note.findByType('textarea').props.value,'카드에서 적은 편백 메모');assert.equal(note.findByProps({type:'checkbox'}).props.checked,false);
  await act(async()=>note.findByType('textarea').props.onChange({target:{value:'지도에서 본 작은 잎'}}));
  await act(async()=>mapChoices(root)[1].props.onClick());
  note=root.root.findByProps({'aria-label':'갈참나무에 글 남기기'});assert.equal(note.findByType('textarea').props.value,'');assert.equal(note.findByProps({type:'checkbox'}).props.checked,false);
  await act(async()=>note.findByType('textarea').props.onChange({target:{value:'잎 가장자리가 둥글었어요.'}}));
  assert.equal(note.findByProps({type:'checkbox'}).props.checked,false);
  await act(async()=>note.findByProps({type:'checkbox'}).props.onChange({target:{checked:true}}));
  await act(async()=>viewButton(root,0).props.onClick());
  assert.equal(root.root.findAllByType('textarea')[0].props.value,'지도에서 본 작은 잎');assert.equal(root.root.findAllByType('textarea')[1].props.value,'잎 가장자리가 둥글었어요.');assert.equal(root.root.findAllByProps({type:'checkbox'})[0].props.checked,false);assert.equal(root.root.findAllByProps({type:'checkbox'})[1].props.checked,true);
  await act(async()=>viewButton(root,1).props.onClick());assert.equal(mapChoices(root)[1].props['aria-pressed'],true);
  note=root.root.findByProps({'aria-label':'갈참나무에 글 남기기'});
  await act(async()=>note.findAllByType('button').find(b=>label(b.props.children)==='내 기록 보기').props.onClick());
  const summary=root.root.findByProps({'aria-label':'내가 남긴 기록'});assert.equal(summary.findByProps({className:'visit-memories'}).findAllByType('li').length,2);
  assert.ok(label(summary.props.children).includes('지도에서 본 작은 잎'));assert.ok(label(summary.props.children).includes('잎 가장자리가 둥글었어요.'));assert.equal(button(root,'기록 파일 받기').props.disabled,false);assert.equal(writes(),0);
 }finally{if(root)await act(async()=>root.unmount());delete globalThis.__experienceRuntime;}
});
test('opening a tree card on the map preserves its selection and does not create an observation',async()=>{
 installMapRuntime();let root;
 try{
  await act(async()=>root=create(React.createElement(Harness,{})));
  const mapleCard=root.root.findAllByType('article')[2];
  await act(async()=>mapleCard.findAllByType('button').find(b=>label(b.props.children)==='나무 지도에서 찾기').props.onClick());
  assert.equal(mapChoices(root).length,1);assert.ok(label(mapChoices(root)[0].props.children).includes('단풍나무'));
  let note=root.root.findByProps({'aria-label':'단풍나무에 글 남기기'});assert.equal(note.findByType('textarea').props.value,'');assert.equal(note.findByProps({type:'checkbox'}).props.checked,false);
  await act(async()=>note.findAllByType('button').find(b=>label(b.props.children)==='내 기록 보기').props.onClick());assert.equal(button(root,'기록 파일 받기').props.disabled,true);
  await act(async()=>viewButton(root,1).props.onClick());assert.equal(mapChoices(root).length,1);
  const stops=root.root.findByProps({'aria-label':'관찰할 장소 선택'}).findAllByType('button');await act(async()=>stops[0].props.onClick());
  note=root.root.findByProps({'aria-label':'편백나무에 글 남기기'});assert.equal(note.findByType('textarea').props.value,'');assert.equal(note.findByProps({type:'checkbox'}).props.checked,false);
 }finally{if(root)await act(async()=>root.unmount());delete globalThis.__experienceRuntime;}
});

test('visitors can keep reactions without writing, carry them through the map, and clear the whole discovery',async()=>{
 const writes=installMapRuntime();let root;
 const reactions=()=>root.root.findAllByProps({className:'visit-reactions'})[0].findAllByType('button');
 try{
  await act(async()=>root=create(React.createElement(Harness,{})));
  assert.ok(reactions().every(b=>b.props['aria-pressed']===false));
  await act(async()=>reactions()[0].props.onClick());await act(async()=>reactions()[1].props.onClick());
  assert.equal(root.root.findAllByType('textarea')[0].props.value,'');assert.equal(root.root.findAllByProps({type:'checkbox'})[0].props.checked,false);
  await act(async()=>viewButton(root,1).props.onClick());assert.equal(reactions()[0].props['aria-pressed'],true);assert.equal(reactions()[1].props['aria-pressed'],true);
  await act(async()=>reactions()[0].props.onClick());assert.equal(reactions()[0].props['aria-pressed'],false);assert.equal(reactions()[1].props['aria-pressed'],true);
  await act(async()=>mapChoices(root)[1].props.onClick());assert.ok(reactions().every(b=>b.props['aria-pressed']===false));
  await act(async()=>viewButton(root,2).props.onClick());
  assert.ok(screenText(root).includes('색이 눈에 띄어요'));assert.ok(screenText(root).includes('살펴본 표시 없이 남긴 발견'));assert.equal(button(root,'오늘의 발견 카드 받기').props.disabled,false);
  assert.equal(root.root.findByProps({className:'visit-text-export'}).props.open,undefined);assert.equal(button(root,'기록 파일 받기').props.className,'visit-secondary visit-wide');
  await act(async()=>button(root,'오늘의 발견 지우기').props.onClick());assert.equal(button(root,'오늘의 발견 카드 받기').props.disabled,true);assert.equal(writes(),0);
 }finally{if(root)await act(async()=>root.unmount());delete globalThis.__experienceRuntime;}
});

const pickers=root=>root.root.findAllByProps({className:'tree-picker'});
const toggle=async(root,index,open)=>act(async()=>pickers(root)[index].props.onToggle({currentTarget:{open}}));
test('compact tree choices open one guide at a time while keeping notes, reactions and discovery badges',async()=>{
 let root;await act(async()=>root=create(React.createElement(Harness,{})));
 assert.ok(pickers(root).every(p=>p.props.open===false));
 assert.equal(root.root.findByProps({className:'visitor-start-actions'}).findAllByType('button').length,2);
 const firstSummary=pickers(root)[0].findByProps({className:'tree-picker-summary'});assert.ok(label(firstSummary.props.children).includes('편백나무'));assert.equal(firstSummary.findByType('img').props.src,'/experience/hinoki-leaf-v29.jpg');
 await toggle(root,0,true);assert.equal(pickers(root)[0].props.open,true);
 await act(async()=>pickers(root)[0].findByType('textarea').props.onChange({target:{value:'펼친 나무에 적은 글'}}));
 await act(async()=>pickers(root)[0].findByProps({className:'visit-reactions'}).findAllByType('button')[0].props.onClick());
 await toggle(root,1,true);assert.deepEqual(pickers(root).map(p=>p.props.open),[false,true,false]);
 // The browser may deliver the old disclosure's close event after the new one opens.
 await toggle(root,0,false);assert.deepEqual(pickers(root).map(p=>p.props.open),[false,true,false]);
 assert.ok(label(pickers(root)[0].findByProps({className:'tree-picker-summary'}).props.children).includes('남긴 발견 있음'));
 await toggle(root,0,true);assert.equal(pickers(root)[0].findByType('textarea').props.value,'펼친 나무에 적은 글');assert.equal(pickers(root)[0].findByProps({className:'visit-reactions'}).findAllByType('button')[0].props['aria-pressed'],true);assert.equal(pickers(root)[0].findByProps({type:'checkbox'}).props.checked,false);
 await toggle(root,0,false);assert.ok(pickers(root).every(p=>p.props.open===false));await act(async()=>viewButton(root,2).props.onClick());assert.ok(screenText(root).includes('펼친 나무에 적은 글'));assert.equal(button(root,'오늘의 발견 카드 받기').props.disabled,false);
 await act(async()=>root.unmount());
});
test('preview photo failures keep the tree choice usable and institutions without known places use reference wording',async()=>{
 let root;await act(async()=>root=create(React.createElement(Harness,{})));
 const preview=pickers(root)[0].findByProps({className:'tree-picker-summary'});await act(async()=>preview.findByType('img').props.onError());assert.equal(preview.findAllByType('img').length,0);assert.ok(screenText(root).includes('사진 준비 중'));await toggle(root,0,true);assert.equal(pickers(root)[0].findByType('textarea').props.value,'');await act(async()=>root.unmount());
 const other={id:'other',name:'다른 숲체원'};await act(async()=>root=create(React.createElement(Panel,{center:other,visit:newVisit(other.id),onChange:()=>{},onCapture:()=>{},onPanelState:()=>{}})));
 assert.ok(button(root,'나무 사진 둘러보기'));assert.equal(button(root,'주변 나무 둘러보기'),undefined);
 for(const picker of pickers(root)){const text=label(picker.findByProps({className:'tree-picker-summary'}).props.children);assert.ok(text.includes('장소 안내 준비 중'));assert.ok(!text.includes('숙소동1'));}
 await act(async()=>root.unmount());
});
test('returning from the map expands the selected tree without marking a discovery',async()=>{
 installMapRuntime();let root;try{
  await act(async()=>root=create(React.createElement(Harness,{})));await toggle(root,2,true);
  await act(async()=>pickers(root)[2].findAllByType('button').find(b=>label(b.props.children)==='나무 지도에서 찾기').props.onClick());
  await act(async()=>button(root,'나무 살펴보기로 돌아가기').props.onClick());assert.deepEqual(pickers(root).map(p=>p.props.open),[false,false,true]);
  assert.equal(pickers(root)[2].findByProps({type:'checkbox'}).props.checked,false);assert.equal(root.root.findAllByProps({className:'tree-picker-saved'}).length,0);
 }finally{if(root)await act(async()=>root.unmount());delete globalThis.__experienceRuntime;}
});
