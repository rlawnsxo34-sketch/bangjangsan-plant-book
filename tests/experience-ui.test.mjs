import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import React from 'react';
import {create,act} from 'react-test-renderer';
import {build} from 'esbuild';
import {newVisit} from '../src/experience-model.js';
const bundlePath=new URL(`.experience-test-${process.pid}.mjs`,import.meta.url);
const built=await build({absWorkingDir:fileURLToPath(new URL('../',import.meta.url)),entryPoints:['src/ExperiencePanel.jsx'],bundle:true,platform:'node',format:'esm',write:false,external:['react','@phosphor-icons/react']});
await fs.writeFile(bundlePath,built.outputFiles[0].text);
let Panel;
try{({default:Panel}=await import(bundlePath.href));}finally{await fs.unlink(bundlePath);}
const center={id:'jangseong',name:'국립장성숲체원'};
const browser={location:{href:'https://example.test/?token=hidden'},confirm:()=>true};globalThis.window=browser;
function label(value){return typeof value==='string'?value:Array.isArray(value)?value.map(label).join(''):value?.props?label(value.props.children):'';}
function button(root,text){return root.root.findAllByType('button').find(b=>label(b.props.children).includes(text));}
function screenText(root){return JSON.stringify(root.toJSON());}
function Harness({onCapture=()=>{},onPanelState=()=>{}}){const[visit,setVisit]=React.useState(()=>newVisit(center.id));return React.createElement(Panel,{center,visit,onChange:setVisit,onCapture,onPanelState});}
test('visitor can read three activities and create a partial summary without login or any photo',async()=>{let root;await act(async()=>root=create(React.createElement(Harness,{})));assert.equal(root.root.findAllByType('textarea').length,3);assert.equal(root.root.findAllByType('img').length,0);assert.ok(screenText(root).includes('장소 확인 전 시범 체험'));assert.ok(screenText(root).includes('로그인 없이'));
 await act(async()=>{root.root.findAllByType('textarea')[0].props.onChange({target:{value:'작은 잎을 보았어요.'}});});
 await act(async()=>button(root,'내 기록 보기').props.onClick());assert.ok(screenText(root).includes('작은 잎을 보았어요.'));assert.ok(screenText(root).includes('살펴봤다는 표시 없이 적은 글'));assert.equal(button(root,'기록 파일 받기').props.disabled,false);assert.ok(!screenText(root).includes('체험 완료'));await act(async()=>root.unmount());});
test('empty summary disables download, observed mark counts only self-report, and reset removes it',async()=>{let root;await act(async()=>root=create(React.createElement(Harness,{})));await act(async()=>button(root,'내 기록 보기').props.onClick());assert.equal(button(root,'기록 파일 받기').props.disabled,true);await act(async()=>button(root,'나무 더 살펴보기').props.onClick());await act(async()=>root.root.findAllByProps({type:'checkbox'})[1].props.onChange({target:{checked:true}}));await act(async()=>button(root,'내 기록 보기').props.onClick());assert.ok(screenText(root).includes('굴참나무'));assert.ok(screenText(root).includes('이름이 맞는지는 확인이 필요해요'));await act(async()=>button(root,'여기 적은 글과 표시 지우기').props.onClick());assert.equal(button(root,'기록 파일 받기').props.disabled,true);await act(async()=>root.unmount());});
test('capture handoff is explicit and the visitor link excludes private URL fields',async()=>{let captured=0,root;await act(async()=>root=create(React.createElement(Harness,{onCapture:()=>captured++})));await act(async()=>button(root,'사진으로 알아보기').props.onClick());assert.equal(captured,1);const link=root.root.findAllByType('input').find(x=>x.props.readOnly);assert.equal(new URL(link.props.value).searchParams.get('token'),null);await act(async()=>root.unmount());});
test('start actions move focus to activities and show a save reminder before photo handoff',async()=>{let root,captured=0,focused=0,scrolled=0;await act(async()=>root=create(React.createElement(Harness,{onCapture:()=>captured++}),{createNodeMock:node=>node.props.className==='visitor-activity-title'?{scrollIntoView(){scrolled++;},focus(){focused++;}}:null}));await act(async()=>button(root,'나무 설명부터 보기').props.onClick());assert.equal(scrolled,1);assert.equal(focused,1);assert.equal(captured,0);await act(async()=>root.root.findAllByType('textarea')[0].props.onChange({target:{value:'작은 잎을 찾았어요.'}}));assert.ok(screenText(root).includes('이미 글을 적었다면 먼저'));await act(async()=>button(root,'사진으로 알아보기').props.onClick());assert.equal(captured,1);assert.equal(root.root.findAllByType('textarea')[0].props.value,'작은 잎을 찾았어요.');await act(async()=>root.unmount());});
