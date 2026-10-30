import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import React from 'react';
import {create,act} from 'react-test-renderer';
import {build} from 'esbuild';
import {placeGuidePhoto} from '../src/place-guide-photos.js';
test('place photos require matching institution and description, safe local files, and explicit configuration',()=>{
 const label='숙소동1 부근 난간 근처',photo={src:'/place-guides/lodging-1-railing.jpg',alt:'난간 주변',caption:label,credit:'현장 촬영',location:{lat:35,lng:126}},source={jangseong:{[label]:photo}};
 assert.equal(placeGuidePhoto('jangseong',label),null);
 assert.deepEqual(placeGuidePhoto('jangseong',' '+label.replace(' 부근','  부근')+' ',source),{src:photo.src,alt:photo.alt,caption:photo.caption,credit:photo.credit});
 for(const id of ['other','__proto__'])assert.equal(placeGuidePhoto(id,label,source),null);
 assert.equal(placeGuidePhoto('jangseong','다른 장소',source),null);
 for(const src of ['https://example.com/x.jpg','javascript:alert(1)','/place-guides/../x.jpg','/place-guides/photo.jpg?token=secret','/experience/hinoki-leaf-v29.jpg'])assert.equal(placeGuidePhoto('jangseong',label,{jangseong:{[label]:{...photo,src}}}),null);
});
const out=new URL(`.place-map-test-guide-${process.pid}.mjs`,import.meta.url);
const bundled=await build({absWorkingDir:fileURLToPath(new URL('../',import.meta.url)),entryPoints:['src/PlaceGuidePhoto.jsx'],bundle:true,platform:'node',format:'esm',write:false,external:['react']});
await fs.writeFile(out,bundled.outputFiles[0].text);let Photo;try{({default:Photo}=await import(out.href));}finally{await fs.unlink(out);}
test('unconfigured places stay quiet and failed guide photos retain a readable fallback',async()=>{
 let root;await act(async()=>root=create(React.createElement(Photo,{centerId:'jangseong',label:'장소'})));assert.equal(root.toJSON(),null);
 const resolve=()=>({src:'/place-guides/lodging-1-railing.jpg',alt:'숙소동1 난간 주변',caption:'숙소동1 부근 난간 근처',credit:''});
 await act(async()=>root.update(React.createElement(Photo,{centerId:'jangseong',label:'장소',resolve})));
 assert.equal(root.root.findByType('img').props.alt,'숙소동1 난간 주변');assert.equal(root.root.findAllByType('a').length,0);assert.equal(root.root.findByType('button').props['aria-label'],'장소 사진 크게 보기');
 await act(async()=>root.root.findByType('img').props.onError());assert.equal(root.root.findAllByType('img').length,0);assert.ok(JSON.stringify(root.toJSON()).includes('장소 설명을 참고해주세요'));
 await act(async()=>root.update(React.createElement(Photo,{centerId:'jangseong',label:'다른 장소',resolve:()=>({...resolve(),src:'/place-guides/lodging-2-trail-start.jpg'})})));assert.equal(root.root.findAllByType('img').length,1);
 await act(async()=>root.unmount());
});
