import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import React from 'react';
import {create,act} from 'react-test-renderer';
import {build} from 'esbuild';
import {newVisit} from '../src/experience-model.js';
const bundlePath=new URL(`.experience-test-${process.pid}.mjs`,import.meta.url);
const built=await build({absWorkingDir:fileURLToPath(new URL('../',import.meta.url)),entryPoints:['src/ExperiencePanel.jsx'],bundle:true,platform:'node',format:'esm',write:false,external:['react','@phosphor-icons/react'],plugins:[{name:'no-network-runtime',setup(b){b.onLoad({filter:/[\\/]cloud-runtime\.js$/},()=>({contents:'export const getRuntime=()=>{throw new Error("실제 Firebase를 사용하지 않는 화면 검사입니다.");};',loader:'js'}));}}]});
await fs.writeFile(bundlePath,built.outputFiles[0].text);
let Panel;
try{({default:Panel}=await import(bundlePath.href));}finally{await fs.unlink(bundlePath);}
const center={id:'jangseong',name:'국립장성숲체원'};
const browser={location:{href:'https://example.test/?token=hidden'},confirm:()=>true};globalThis.window=browser;
function label(value){return typeof value==='string'?value:Array.isArray(value)?value.map(label).join(''):value?.props?label(value.props.children):'';}
function button(root,text){return root.root.findAllByType('button').find(b=>label(b.props.children).includes(text));}
function screenText(root){return JSON.stringify(root.toJSON());}
function Harness({onCapture=()=>{},onPanelState=()=>{}}){const[visit,setVisit]=React.useState(()=>newVisit(center.id));return React.createElement(Panel,{center,visit,onChange:setVisit,onCapture,onPanelState});}
test('visitor can read three activities and create a partial summary without login or uploading a personal photo',async()=>{let root;await act(async()=>root=create(React.createElement(Harness,{})));assert.equal(root.root.findAllByType('textarea').length,3);assert.equal(root.root.findAllByType('img').length,6);assert.ok(screenText(root).includes('관찰 장소 안내 · 시범 체험'));assert.ok(screenText(root).includes('로그인 없이'));
 const cards=root.root.findAllByType('article');assert.equal(cards.length,3);assert.ok(screenText(root).includes('숙소동1 부근 난간 근처'));assert.ok(screenText(root).includes('숙소동2에서 숲누림길로 올라가는 시작점'));assert.equal(root.root.findAllByProps({className:'tree-place'}).length,3);
 for(const card of cards){const gallery=card.findByProps({className:'tree-reference-photos'});assert.equal(gallery.findAllByType('img').length,2);assert.deepEqual(gallery.findAllByType('strong').map(v=>label(v.props.children)),['잎','전체 모습']);for(const link of gallery.findAllByType('a'))assert.equal(link.props.target,'_blank');}

 for(const card of cards){const info=card.findByProps({className:'tree-hints tree-more'});assert.ok(!info.props.open);assert.ok(info.findByProps({className:'tree-description'}));assert.ok(card.findByProps({className:'tree-question'}));assert.equal(card.findAllByType('textarea').length,1);assert.ok(!card.findAllByProps({type:'checkbox'})[0].props.checked);}
 const safety=root.root.findByProps({'aria-label':'관찰 전 안내'});assert.ok(label(safety.props.children).includes('꺾거나'));

 await act(async()=>{root.root.findAllByType('textarea')[0].props.onChange({target:{value:'작은 잎을 보았어요.'}});});
 await act(async()=>button(root,'내 기록 보기').props.onClick());assert.ok(screenText(root).includes('작은 잎을 보았어요.'));assert.ok(screenText(root).includes('살펴봤다는 표시 없이 적은 글'));assert.equal(button(root,'기록 파일 받기').props.disabled,false);assert.ok(!screenText(root).includes('체험 완료'));await act(async()=>root.unmount());});
test('empty summary disables download, observed mark counts only self-report, and reset removes it',async()=>{let root;await act(async()=>root=create(React.createElement(Harness,{})));await act(async()=>button(root,'내 기록 보기').props.onClick());assert.equal(button(root,'기록 파일 받기').props.disabled,true);await act(async()=>button(root,'나무 더 살펴보기').props.onClick());await act(async()=>root.root.findAllByProps({type:'checkbox'})[1].props.onChange({target:{checked:true}}));await act(async()=>button(root,'내 기록 보기').props.onClick());assert.ok(screenText(root).includes('갈참나무'));assert.ok(screenText(root).includes('이름이 맞는지는 확인이 필요해요'));await act(async()=>button(root,'여기 적은 글과 표시 지우기').props.onClick());assert.equal(button(root,'기록 파일 받기').props.disabled,true);await act(async()=>root.unmount());});
test('capture handoff is explicit and the visitor link excludes private URL fields',async()=>{let captured=0,root;await act(async()=>root=create(React.createElement(Harness,{onCapture:()=>captured++})));await act(async()=>button(root,'사진으로 알아보기').props.onClick());assert.equal(captured,1);const link=root.root.findAllByType('input').find(x=>x.props.readOnly);assert.equal(new URL(link.props.value).searchParams.get('token'),null);await act(async()=>root.unmount());});
test('start actions move focus to activities and show a save reminder before photo handoff',async()=>{let root,captured=0,focused=0,scrolled=0;await act(async()=>root=create(React.createElement(Harness,{onCapture:()=>captured++}),{createNodeMock:node=>node.props.className==='visitor-activity-title'?{scrollIntoView(){scrolled++;},focus(){focused++;}}:null}));await act(async()=>button(root,'나무 고르기').props.onClick());assert.equal(scrolled,1);assert.equal(focused,1);assert.equal(captured,0);await act(async()=>root.root.findAllByType('textarea')[0].props.onChange({target:{value:'작은 잎을 찾았어요.'}}));assert.ok(screenText(root).includes('로그인하면 여기 적은 글이 지워져요'));await act(async()=>button(root,'사진으로 알아보기').props.onClick());assert.equal(captured,1);assert.equal(root.root.findAllByType('textarea')[0].props.value,'작은 잎을 찾았어요.');await act(async()=>root.unmount());});
