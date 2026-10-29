import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {experiencePhotos} from '../src/experience-photos.js';
import {EXPERIENCE} from '../src/experience-data.js';
test('every pilot has leaf and whole reference photos whose local JPEG assets exist',async()=>{
 for(const tree of EXPERIENCE.trees){const photos=experiencePhotos(tree);assert.deepEqual(photos.map(p=>p.label),['잎','전체 모습']);for(const photo of photos){const bytes=await readFile(new URL('../public'+photo.src,import.meta.url));assert.equal(bytes[0],255);assert.equal(bytes[1],216);assert.ok(photo.alt.includes(tree.name));}assert.equal(tree.location,null);assert.equal(tree.reviewed,false);}
});
test('institution photos and explicit opt-out override defaults without mutating the supplied data',()=>{
 const photo={src:'/custom.jpg',alt:'기관 사진',credit:'기관 보유'};const tree={id:'hinoki',photo};assert.deepEqual(experiencePhotos(tree),[{...photo,label:'참고 사진'}]);assert.equal(tree.photo,photo);assert.equal(photo.label,undefined);
 const custom=[{src:'/leaf.jpg',label:'잎',credit:'기관'},{src:'/whole.jpg',label:'전체 모습'}];assert.deepEqual(experiencePhotos({...tree,photos:custom}),custom);assert.deepEqual(experiencePhotos({...tree,photos:[]}),[]);assert.deepEqual(experiencePhotos({id:'unknown'}),[]);
});
