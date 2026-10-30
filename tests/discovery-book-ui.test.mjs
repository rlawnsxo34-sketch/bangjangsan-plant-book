import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import React from 'react';
import {create,act} from 'react-test-renderer';
import {build} from 'esbuild';
const out=new URL(`.routing-test-book-${process.pid}.mjs`,import.meta.url);
const b=await build({absWorkingDir:fileURLToPath(new URL('../',import.meta.url)),entryPoints:['src/DiscoveryBook.jsx'],bundle:true,platform:'node',format:'esm',write:false,external:['react','@phosphor-icons/react']});await fs.writeFile(out,b.outputFiles[0].text);let Book;try{({default:Book}=await import(out.href));}finally{await fs.unlink(out);}
const rows=[{id:'one',name:'이름 모름',centerName:'국립장성숲체원',description:'난간 옆에서 본 잎',createdAt:1},{id:'two',name:'이름 모름',centerName:'다른 숲체원',description:'작은 잎',createdAt:2},{id:'three',name:'편백나무',centerName:'국립장성숲체원',description:'',createdAt:3}];
const label=v=>typeof v==='string'?v:Array.isArray(v)?v.map(label).join(''):v?.props?label(v.props.children):'';
const scopes=root=>root.root.findByProps({'aria-label':'내 도감 기록 고르기'}).findAllByType('button');
test('unnamed records combine with search, open only explicitly and give an escape from empty results',async()=>{
 let root,opened=null;const props={records:rows,disabled:false,onCreate(){},onRecord:row=>opened=row.id};
 await act(async()=>root=create(React.createElement(Book,props)));await act(async()=>scopes(root)[1].props.onClick());assert.equal(root.root.findAllByProps({className:'observation-row'}).length,2);assert.equal(opened,null);
 await act(async()=>root.root.findByProps({type:'search'}).props.onChange({target:{value:'장성'}}));const matching=root.root.findAllByProps({className:'observation-row'});assert.equal(matching.length,1);assert.ok(label(matching[0].props.children).includes('난간 옆에서 본 잎'));
 await act(async()=>matching[0].props.onClick({currentTarget:{}}));assert.equal(opened,'one');
 await act(async()=>root.root.findByProps({type:'search'}).props.onChange({target:{value:'없음'}}));assert.equal(root.root.findAllByProps({className:'observation-row'}).length,0);
 const reset=root.root.findAllByType('button').find(x=>label(x.props.children)==='전체 기록 보기');await act(async()=>reset.props.onClick());assert.equal(scopes(root)[0].props['aria-pressed'],true);assert.equal(root.root.findByProps({type:'search'}).props.value,'');
 await act(async()=>root.unmount());
});
test('renamed records disappear from the active unknown scope and zero does not claim an empty account',async()=>{
 let root;const props={records:[rows[0]],disabled:false,onRecord(){},onCreate(){}};
 await act(async()=>root=create(React.createElement(Book,props)));await act(async()=>scopes(root)[1].props.onClick());
 await act(async()=>root.update(React.createElement(Book,{...props,records:[{...rows[0],name:'갈참나무'}]})));
 assert.equal(scopes(root)[1].props['aria-pressed'],true);assert.equal(root.root.findAllByProps({className:'observation-row'}).length,0);assert.ok(JSON.stringify(root.toJSON()).includes('이름을 바꾼 기록은 전체 기록에서 볼 수 있어요'));assert.ok(!JSON.stringify(root.toJSON()).includes('아직 계정에 저장한 기록이 없습니다'));
 await act(async()=>root.unmount());
});

test('date order and clearing search retain the unnamed selection without opening records',async()=>{
 let root,opened=0;await act(async()=>root=create(React.createElement(Book,{records:rows,disabled:false,onCreate(){},onRecord(){opened++;}})));await act(async()=>scopes(root)[1].props.onClick());
 const names=()=>root.root.findAllByProps({className:'observation-row'}).map(x=>label(x.props.children));assert.ok(names()[0].includes('다른 숲체원'));
 await act(async()=>root.root.findAllByType('select').find(x=>x.props.children.some(c=>c.props.value==='oldest')).props.onChange({target:{value:'oldest'}}));assert.ok(names()[0].includes('국립장성숲체원'));
 await act(async()=>root.root.findByProps({type:'search'}).props.onChange({target:{value:'장성'}}));assert.equal(names().length,1);
 await act(async()=>root.root.findAllByType('button').find(x=>label(x.props.children)==='검색어 지우기').props.onClick());assert.equal(names().length,2);assert.equal(scopes(root)[1].props['aria-pressed'],true);assert.equal(root.root.findAllByType('select').find(x=>x.props.children.some(c=>c.props.value==='oldest')).props.value,'oldest');assert.equal(opened,0);await act(async()=>root.unmount());
});

test('source, search and order compose; empty reset restores every record and source changes never open one',async()=>{
 let root,opened=0;const ai={id:'ai',name:'소나무',centerName:'국립장성숲체원',createdAt:4,aiSelection:{provider:'plantnet',scientificName:'Pinus densiflora'}};
 await act(async()=>root=create(React.createElement(Book,{records:[...rows,ai],disabled:false,onCreate(){},onRecord(){opened++;}})));
 const source=()=>root.root.findAllByType('select').find(x=>x.props.children.some(c=>c.props.value==='ai'));
 const order=()=>root.root.findAllByType('select').find(x=>x.props.children.some(c=>c.props.value==='oldest'));
 await act(async()=>root.root.findAllByType('button').find(x=>label(x.props.children)==='기록 목록').props.onClick());
 await act(async()=>source().props.onChange({target:{value:'other'}}));
 await act(async()=>order().props.onChange({target:{value:'oldest'}}));
 await act(async()=>root.root.findByProps({type:'search'}).props.onChange({target:{value:'장성'}}));
 assert.equal(root.root.findAllByProps({className:'observation-row'}).length,2);
 await act(async()=>root.root.findAllByType('button').find(x=>label(x.props.children)==='검색어 지우기').props.onClick());
 assert.equal(source().props.value,'other');assert.equal(order().props.value,'oldest');assert.equal(root.root.findAllByProps({className:'observation-row'}).length,3);
 await act(async()=>source().props.onChange({target:{value:'ai'}}));assert.equal(root.root.findAllByProps({className:'observation-row'}).length,1);
 await act(async()=>scopes(root)[1].props.onClick());assert.equal(root.root.findAllByProps({className:'observation-row'}).length,0);
 await act(async()=>root.root.findAllByType('button').find(x=>label(x.props.children)==='전체 기록 보기').props.onClick());
 assert.equal(source().props.value,'all');assert.equal(scopes(root)[0].props['aria-pressed'],true);assert.equal(order().props.value,'oldest');assert.equal(root.root.findAllByProps({className:'observation-row'}).length,4);assert.equal(opened,0);
 await act(async()=>root.unmount());
});
