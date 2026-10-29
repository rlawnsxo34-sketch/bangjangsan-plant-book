import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import React from 'react';
import {create,act} from 'react-test-renderer';
import {build} from 'esbuild';
const output=new URL(`.place-map-test-${process.pid}.mjs`,import.meta.url);
const built=await build({absWorkingDir:fileURLToPath(new URL('../',import.meta.url)),entryPoints:['src/ObservationPlace.jsx'],bundle:true,platform:'node',format:'esm',write:false,external:['react']});
await fs.writeFile(output,built.outputFiles[0].text);let PlaceMapLink;try{({PlaceMapLink}=await import(output.href));}finally{await fs.unlink(output);}
test('map button is absent until valid coordinates exist, then links to a new external page',async()=>{
 let root;await act(async()=>root=create(React.createElement(PlaceMapLink,{place:{label:'관찰 장소'}})));assert.equal(root.toJSON(),null);
 await act(async()=>root.update(React.createElement(PlaceMapLink,{place:{label:'관찰 장소',coordinates:{lat:35.12345,lng:126.12345}}})));
 const link=root.root.findByType('a');assert.equal(link.props.target,'_blank');assert.equal(link.props.rel,'noopener noreferrer');assert.equal(link.props.referrerPolicy,'no-referrer');assert.ok(link.props.href.endsWith(',35.12345,126.12345'));
 await act(async()=>root.update(React.createElement(PlaceMapLink,{place:{label:'관찰 장소',coordinates:{lat:35}}})));assert.equal(root.toJSON(),null);await act(async()=>root.unmount());
});
