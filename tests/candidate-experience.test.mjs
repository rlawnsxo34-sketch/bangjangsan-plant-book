import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import React from 'react';
import {create,act} from 'react-test-renderer';
import {build} from 'esbuild';
import {experienceForSelection} from '../src/candidate-experience.js';
import {newVisit,visitRows,updateVisit} from '../src/experience-model.js';
const selected=name=>({provider:'plantnet',scientificName:name});
test('only the selected exact scientific species links to the guide; old oak records are not relabeled',()=>{
 for(const [name,id] of [['Chamaecyparis obtusa','hinoki'],['Quercus aliena','galcham-oak'],['Acer palmatum','japanese-maple']])assert.equal(experienceForSelection(selected(name)).id,id);
 for(const name of ['Quercus variabilis','Quercus','Quercus aliena var. pellucida','갈참나무'])assert.equal(experienceForSelection(selected(name)),null);
 assert.equal(experienceForSelection({scientificName:'Quercus aliena'}),null);
 const old={...newVisit('jangseong',1),entries:{'cork-oak':{note:'굴참나무를 보았어요.',observed:true}}};
 assert.equal(visitRows(old).length,0);assert.throws(()=>updateVisit(old,'cork-oak',{observed:true}));
});
const output=new URL(`.candidate-test-${process.pid}.mjs`,import.meta.url);
const built=await build({absWorkingDir:fileURLToPath(new URL('../',import.meta.url)),entryPoints:['src/CandidateExperience.jsx'],bundle:true,platform:'node',format:'esm',write:false,external:['react','@phosphor-icons/react']});
await fs.writeFile(output,built.outputFiles[0].text);let Guide;
try{({default:Guide}=await import(output.href));}finally{await fs.unlink(output);}
function label(value){return typeof value==='string'?value:Array.isArray(value)?value.map(label).join(''):value?.props?label(value.props.children):'';}
function button(root,text){return root.root.findAllByType('button').find(b=>label(b.props.children)===text);}
function Harness({selection=selected('Quercus aliena'),onUseNote=()=>{}}){const[visit,setVisit]=React.useState(()=>newVisit('jangseong',1));return React.createElement(Guide,{selection,visit,onChange:setVisit,onUseNote});}
test('opening a selected guide never marks observed; explicit note transfer and candidate switching remain separate',async()=>{
 let root,copied='',focused=0;
 await act(async()=>root=create(React.createElement(Harness,{onUseNote:note=>copied=note}),{createNodeMock:node=>node.type==='h4'?{focus(){focused++;}}:null}));
 assert.equal(root.root.findAllByType('textarea').length,0);
 await act(async()=>button(root,'살펴보는 방법 보기').props.onClick());assert.equal(focused,1);assert.equal(root.root.findAllByType('img').length,2);assert.ok(JSON.stringify(root.toJSON()).includes('숙소동1 부근 난간 근처'));
 await act(async()=>root.root.findAllByType('img')[0].props.onError());assert.ok(JSON.stringify(root.toJSON()).includes('사진을 불러오지 못했어요'));

 assert.equal(root.root.findByType('input').props.checked,false);assert.equal(button(root,'이 글을 사진 기록에 넣기').props.disabled,true);
 await act(async()=>root.root.findByType('textarea').props.onChange({target:{value:'뒷면이 밝게 보여요.'}}));assert.equal(copied,'');
 await act(async()=>button(root,'이 글을 사진 기록에 넣기').props.onClick());assert.equal(copied,'뒷면이 밝게 보여요.');
 assert.equal(root.root.findByType('input').props.checked,false);
 await act(async()=>root.update(React.createElement(Harness,{selection:selected('Acer palmatum')})));
 assert.equal(root.root.findAllByType('textarea').length,0);
 await act(async()=>button(root,'살펴보는 방법 보기').props.onClick());assert.equal(root.root.findByType('textarea').props.value,'');
 await act(async()=>root.update(React.createElement(Harness,{selection:selected('Quercus aliena')})));
 await act(async()=>button(root,'살펴보는 방법 보기').props.onClick());assert.equal(root.root.findByType('textarea').props.value,'뒷면이 밝게 보여요.');
 await act(async()=>root.update(React.createElement(Harness,{selection:selected('Quercus variabilis')})));
 assert.equal(root.root.findAllByType('button').length,0);assert.ok(JSON.stringify(root.toJSON()).includes('아직 준비 중'));
 await act(async()=>root.unmount());
});
