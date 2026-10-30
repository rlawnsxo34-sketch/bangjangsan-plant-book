import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,copyFile,writeFile,readFile,readdir,rm,symlink} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {execFileSync} from 'node:child_process';
test('cleanup is preview-only by default, backs up custom old files, and preserves settings and unrelated files',async()=>{
 const root=await mkdtemp(join(tmpdir(),'egmy-cleanup-'));
 try{
  await copyFile(new URL('../cleanup.mjs',import.meta.url),join(root,'cleanup.mjs'));
  await writeFile(join(root,'NAME_SOURCE_SETUP.txt'),'내가 수정한 예전 안내');await writeFile(join(root,'public-config.json'),'내 설정');await writeFile(join(root,'my-photo.jpg'),'사진');
  const run=(...args)=>execFileSync(process.execPath,[join(root,'cleanup.mjs'),...args],{encoding:'utf8'});
  assert.ok(run().includes('아직 지우지 않았어요'));assert.equal(await readFile(join(root,'NAME_SOURCE_SETUP.txt'),'utf8'),'내가 수정한 예전 안내');
  if(process.platform!=='win32')await symlink(join(root,'my-photo.jpg'),join(root,'PLACE_FIRST_SETUP.txt'));
  assert.ok(run('--apply').includes('백업한 뒤 정리'));const dirs=await readdir(join(root,'backup-cleanup'));
  assert.equal(await readFile(join(root,'backup-cleanup',dirs[0],'NAME_SOURCE_SETUP.txt'),'utf8'),'내가 수정한 예전 안내');
  assert.equal(await readFile(join(root,'public-config.json'),'utf8'),'내 설정');assert.equal(await readFile(join(root,'my-photo.jpg'),'utf8'),'사진');if(process.platform!=='win32')assert.equal(await readFile(join(root,'PLACE_FIRST_SETUP.txt'),'utf8'),'사진');
  assert.ok(run('--apply').includes('정리할 이전 파일이 없어요'));
 }finally{await rm(root,{recursive:true,force:true});}
});
