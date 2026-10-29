import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import React from 'react';
import {create,act} from 'react-test-renderer';
import {build} from 'esbuild';
const output=new URL(`.sharing-ui-test-${process.pid}.mjs`,import.meta.url);
const built=await build({absWorkingDir:fileURLToPath(new URL('../',import.meta.url)),entryPoints:['src/SharingPanel.jsx'],bundle:true,platform:'node',format:'esm',write:false,external:['react'],plugins:[{name:'fake-runtime',setup(b){b.onLoad({filter:/[\\/]cloud-runtime\.js$/},()=>({contents:'export const getRuntime=()=>globalThis.__sharingRuntime;',loader:'js'}));}}]});
await fs.writeFile(output,built.outputFiles[0].text);let Panel;try{({default:Panel}=await import(output.href));}finally{await fs.unlink(output);}
const image=n=>'data:image/jpeg;base64,'+Buffer.from([255,216,n,255,217]).toString('base64');
const row={id:'request',name:'갈참나무',centerId:'jangseong',centerName:'국립장성숲체원',publicNote:'공개한 특징',imageData:image(2),additionalImages:[image(3)],selectedPhotoIndexes:[1,2],originalRevision:1,status:'pending'};
function label(v){return typeof v==='string'?v:Array.isArray(v)?v.map(label).join(''):v?.props?label(v.props.children):'';}
function button(root,text){return root.root.findAllByType('button').find(b=>label(b.props.children)===text);}
test('visitors and reviewers see every chosen photo; legacy one-photo posts still open and account changes close review',async()=>{
 let subscriber,reviewed;
 globalThis.document={activeElement:null,body:{style:{}},getElementById:()=>null,addEventListener(){},removeEventListener(){}};
 const node=()=>({focus(){},querySelectorAll:()=>[],setAttribute(){},removeAttribute(){},contains:()=>true});
 globalThis.__sharingRuntime={subscribe:fn=>{subscriber=fn;fn({uid:'reviewer'});return()=>{};},repo:{list:async()=>[]},sharing:{publicPage:async()=>({rows:[{...row,status:'approved'},{...row,id:'legacy',name:'편백나무',additionalImages:undefined}],hasMore:false}),mine:async()=>[],grants:async()=>['jangseong'],pending:async()=>[row],review:async(...args)=>reviewed=args}};
 let root;await act(async()=>{root=create(React.createElement(Panel,{center:{id:'jangseong',name:'국립장성숲체원'},onPanelState:()=>{}}),{createNodeMock:node});await new Promise(resolve=>setImmediate(resolve));});
 const publicButton=name=>root.root.findAllByType('button').find(b=>label(b.props.children).startsWith(name)&&label(b.props.children).includes('공유 사진 보기'));
 await act(async()=>publicButton('갈참나무').props.onClick({currentTarget:node()}));let dialog=root.root.findByProps({role:'dialog'});assert.deepEqual(dialog.findAllByType('img').map(img=>img.props.src),[image(2),image(3)]);
 await act(async()=>button(root,'닫기').props.onClick());await act(async()=>publicButton('편백나무').props.onClick({currentTarget:node()}));assert.equal(root.root.findByProps({role:'dialog'}).findAllByType('img').length,1);await act(async()=>button(root,'닫기').props.onClick());
 await act(async()=>button(root,'갈참나무 · 검토하기').props.onClick({currentTarget:node()}));dialog=root.root.findByProps({role:'dialog'});assert.equal(dialog.findAllByType('img').length,2);
 await act(async()=>dialog.findByType('textarea').props.onChange({target:{value:'사진 두 장의 공개 적합성 확인'}}));await act(async()=>dialog.findByType('form').props.onSubmit({preventDefault(){}}));assert.equal(reviewed[1],row);assert.equal(reviewed[2],'approved');
 await act(async()=>button(root,'갈참나무 · 검토하기').props.onClick({currentTarget:node()}));await act(async()=>subscriber(null));assert.equal(root.root.findAllByProps({role:'dialog'}).length,0);assert.equal(root.root.findAllByType('form').length,0);
 await act(async()=>root.unmount());
});
