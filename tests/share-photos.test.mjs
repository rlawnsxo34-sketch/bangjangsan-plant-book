import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import React from 'react';
import {create,act} from 'react-test-renderer';
import {build} from 'esbuild';
import {selectedPhotos,sharedPhotos,sharedPhotoFields,sameReviewSnapshot} from '../src/share-photos.js';
const image=n=>'data:image/jpeg;base64,'+Buffer.from([255,216,n,255,217]).toString('base64');
const photos=[image(1),image(2),image(3)];
test('explicit photo indexes select only the requested subset and reject malformed selections',()=>{
 assert.deepEqual(selectedPhotos(photos,[1,2]),photos.slice(1));assert.deepEqual(selectedPhotos(photos,[2]),[photos[2]]);
 for(const indexes of [[],[-1],[3],['1'],[1,1],[2,1],[0,1,2,3]])assert.throws(()=>selectedPhotos(photos,indexes));
 assert.deepEqual(sharedPhotoFields(photos.slice(1)),{imageData:photos[1],additionalImages:[photos[2]]});
 assert.deepEqual(sharedPhotos({imageData:photos[0]}),[photos[0]]);assert.throws(()=>sharedPhotos({imageData:photos[0],additionalImages:[1]}));
});
test('review must match the displayed photo set, text, provenance and precise submission timestamp',()=>{
 const row={ownerId:'owner',observationId:'record',centerId:'center',centerName:'숲',name:'갈참나무',publicNote:'공개 글',originalRevision:1,submittedAt:{seconds:1,nanoseconds:1},imageData:photos[1],additionalImages:[photos[2]],selectedPhotoIndexes:[1,2]};
 assert.equal(sameReviewSnapshot(row,{...row}),true);
 for(const patch of [{additionalImages:[photos[0]]},{selectedPhotoIndexes:[0,1]},{publicNote:'다른 글'},{submittedAt:{seconds:1,nanoseconds:2}},{originalRevision:2},{submissionId:'another-request'}])assert.equal(sameReviewSnapshot(row,{...row,...patch}),false);
});
const output=new URL(`.share-composer-test-${process.pid}.mjs`,import.meta.url);
const bundle=await build({absWorkingDir:fileURLToPath(new URL('../',import.meta.url)),entryPoints:['src/ShareComposer.jsx'],bundle:true,platform:'node',format:'esm',write:false,external:['react']});
await fs.writeFile(output,bundle.outputFiles[0].text);let Composer;try{({default:Composer}=await import(output.href));}finally{await fs.unlink(output);}
const center={id:'jangseong',name:'국립장성숲체원'},record={id:'record',name:'갈참나무',centerId:center.id,centerName:center.name,revision:1,description:'이 글은 비공개',location:{lat:35,lng:126},ownerId:'private-owner'};
const noop=()=>{};
function label(v){return typeof v==='string'?v:Array.isArray(v)?v.map(label).join(''):v?.props?label(v.props.children):'';}
function button(root,text){return root.root.findAllByType('button').find(b=>label(b.props.children)===text);}
async function mount(options={}){let root;const props={repo:{album:async()=>({record,photos})},sharing:{submit:async()=>{}},uid:'owner',center,records:[record],onSaved:noop,onBusy:noop,onDirty:noop,...options};await act(async()=>root=create(React.createElement(Composer,props)));return root;}
async function chooseRecord(root,id='record'){await act(async()=>root.root.findByType('select').props.onChange({target:{value:id}}));}
function photoCheckboxes(root){return root.root.findByType('fieldset').findAllByType('input');}
test('no photo or consent is preselected; only the previewed chosen photos and public note reach submit',async()=>{
 let args,saved=0;const root=await mount({sharing:{submit:async(...value)=>args=value},onSaved:()=>saved++});
 await chooseRecord(root);assert.ok(photoCheckboxes(root).every(box=>box.props.checked===false));assert.equal(button(root,'공개 전 확인하기').props.disabled,true);assert.equal(args,undefined);
 await act(async()=>photoCheckboxes(root)[1].props.onChange({target:{checked:true}}));await act(async()=>photoCheckboxes(root)[2].props.onChange({target:{checked:true}}));
 await act(async()=>root.root.findByType('textarea').props.onChange({target:{value:'함께 보여줄 특징'}}));
 await act(async()=>button(root,'공개 전 확인하기').props.onClick());
 const preview=root.root.findByProps({'aria-label':'공유 전 미리보기'});assert.equal(root.root.findAllByProps({'aria-label':'공유할 내용 선택'}).length,0,'preview replaces editor so unselected private photos are not shown');assert.equal(root.root.findAllByType('img').length,2);
 const help=preview.findByType('details');assert.ok(!help.props.open,'resubmission guidance starts collapsed');assert.deepEqual(preview.findAllByType('img').map(img=>img.props.src),photos.slice(1));
 assert.equal(label(preview.props.children).includes('이 글은 비공개'),false);
 await act(async()=>button(root,'사진·글 다시 고르기').props.onClick());assert.equal(root.root.findByType('textarea').props.value,'함께 보여줄 특징');assert.deepEqual(photoCheckboxes(root).map(c=>c.props.checked),[false,true,true]);
 await act(async()=>button(root,'공개 전 확인하기').props.onClick());
 assert.equal(button(root,'공유 신청하기').props.disabled,true);assert.equal(args,undefined);
 const consent=root.root.findByProps({className:'share-consent'}).findByType('input');assert.equal(consent.props.checked,false);
 await act(async()=>consent.props.onChange({target:{checked:true}}));await act(async()=>root.root.findByType('form').props.onSubmit({preventDefault(){}}));
 assert.equal(saved,1);assert.equal(args[3],'함께 보여줄 특징');assert.deepEqual(args[4].indexes,[1,2]);assert.deepEqual(args[4].images,photos.slice(1));assert.equal(args[4].centerName,center.name);assert.ok(args[4].submissionId);assert.equal(args[1].description,undefined);assert.equal(args[1].location,undefined);
 assert.equal(root.root.findAllByProps({'aria-label':'공유 전 미리보기'}).length,0);await act(async()=>root.unmount());
});
test('editing or reloading invalidates the preview and requires selecting photos and consenting again',async()=>{
 const root=await mount();await chooseRecord(root);await act(async()=>photoCheckboxes(root)[0].props.onChange({target:{checked:true}}));await act(async()=>button(root,'공개 전 확인하기').props.onClick());
 await act(async()=>root.root.findByProps({className:'share-consent'}).findByType('input').props.onChange({target:{checked:true}}));
 await act(async()=>button(root,'사진·글 다시 고르기').props.onClick());assert.equal(root.root.findAllByProps({className:'share-consent'}).length,0);assert.deepEqual(photoCheckboxes(root).map(c=>c.props.checked),[true,false,false]);
 await act(async()=>photoCheckboxes(root)[0].props.onChange({target:{checked:false}}));await act(async()=>photoCheckboxes(root)[2].props.onChange({target:{checked:true}}));await act(async()=>button(root,'공개 전 확인하기').props.onClick());
 assert.equal(root.root.findByProps({className:'share-consent'}).findByType('input').props.checked,false);
 await act(async()=>button(root,'사진·글 다시 고르기').props.onClick());assert.deepEqual(photoCheckboxes(root).map(c=>c.props.checked),[false,false,true]);
 await act(async()=>button(root,'사진 다시 불러오기').props.onClick());assert.ok(photoCheckboxes(root).every(box=>!box.props.checked));assert.equal(root.root.findAllByProps({'aria-label':'공유 전 미리보기'}).length,0);await act(async()=>root.unmount());
});
test('a newer record choice and unmount prevent late private photo responses from appearing',async()=>{
 let finish;const other={...record,id:'other',name:'편백나무'};const repo={album:async(_uid,id)=>id==='record'?new Promise(resolve=>finish=resolve):{record:other,photos:[photos[0]]}};
 const root=await mount({repo,records:[record,other]});await chooseRecord(root);await chooseRecord(root,'other');
 await act(async()=>finish({record,photos}));assert.equal(photoCheckboxes(root).length,1);assert.equal(root.root.findByType('select').props.value,'other');
 await chooseRecord(root);await act(async()=>root.unmount());await act(async()=>finish({record,photos}));
});
test('submit failures preserve the exact preview for retry; late success after account unmount is ignored',async()=>{
 let calls=0,saved=0,finish;const root=await mount({sharing:{submit:async()=>{calls++;if(calls===1)throw new Error('연결 오류');return new Promise(resolve=>finish=resolve);}},onSaved:()=>saved++});
 await chooseRecord(root);await act(async()=>photoCheckboxes(root)[1].props.onChange({target:{checked:true}}));await act(async()=>button(root,'공개 전 확인하기').props.onClick());await act(async()=>root.root.findByProps({className:'share-consent'}).findByType('input').props.onChange({target:{checked:true}}));
 await act(async()=>root.root.findByType('form').props.onSubmit({preventDefault(){}}));assert.equal(saved,0);assert.equal(root.root.findAllByProps({'aria-label':'공유 전 미리보기'}).length,1);
 await act(async()=>{root.root.findByType('form').props.onSubmit({preventDefault(){}});});await act(async()=>root.unmount());await act(async()=>finish());assert.equal(saved,0);
});
