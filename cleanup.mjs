import {lstat,realpath,readFile,mkdir,copyFile,unlink} from 'node:fs/promises';
import {dirname,resolve,relative,isAbsolute,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {randomUUID} from 'node:crypto';
const root=await realpath(dirname(fileURLToPath(import.meta.url)));
const obsolete=[
  "BRAND_AND_SEARCH_SETUP.txt",
  "LOGIN_HANDOFF_SETUP.txt",
  "MAP_LOAD_FIX.txt",
  "MAP_OBSERVATION_SETUP.txt",
  "PLACE_FIRST_SETUP.txt",
  "PLACE_MAP_SETUP.txt",
  "RECORD_ORDER_SETUP.txt",
  "SIMPLE_START_SETUP.txt",
  "TREE_PHOTO_SETUP.txt",
  "TREE_PLACE_SETUP.txt",
  "UNNAMED_RECORDS_SETUP.txt",
  "VISITOR_DISCOVERY_SETUP.txt",
  "NAME_SOURCE_SETUP.txt",
  "CANDIDATE_NEXT_SETUP.txt",
  "assets-source/README.txt",
  "assets-source/egmy-original.png",
  "assets-source/icon-frame.svg",
  "assets-source/share-frame.svg",
  "docs/card-example-v21.png",
  "public/brand/egmy-horizontal-v19.png",
  "public/brand/egmy-share-v15.png",
  "public/icons/egmy-32-v15.png",
  "public/icons/egmy-180-v15.png",
  "public/icons/egmy-192-v15.png",
  "public/icons/egmy-512-v15.png",
  "dist/brand/egmy-horizontal-v19.png",
  "dist/brand/egmy-share-v15.png",
  "dist/icons/egmy-32-v15.png",
  "dist/icons/egmy-180-v15.png",
  "dist/icons/egmy-192-v15.png",
  "dist/icons/egmy-512-v15.png"
];
const apply=process.argv.includes('--apply'),found=[];
for(const name of obsolete){
 const path=resolve(root,name);
 try{
  const stat=await lstat(path);if(!stat.isFile()||stat.isSymbolicLink())continue;
  const actual=await realpath(path),rel=relative(root,actual);if(rel.startsWith('..')||isAbsolute(rel))continue;
  found.push({name,path,bytes:await readFile(path)});
 }catch(e){if(e.code!=='ENOENT')throw e;}
}
if(!found.length){console.log('정리할 이전 파일이 없어요.');}
else if(!apply){console.log('정리 대상 '+found.length+'개 (아직 지우지 않았어요):');for(const row of found)console.log(row.name);console.log('백업 후 정리하려면 npm run cleanup -- --apply 를 실행하세요.');}
else{
 const backup=join(root,'backup-cleanup',new Date().toISOString().replace(/[:.]/g,'-')+'-'+randomUUID().slice(0,8));
 // Back up every target before removing any file. Unlisted files are never touched.
 for(const row of found){const dest=join(backup,row.name);await mkdir(dirname(dest),{recursive:true});await copyFile(row.path,dest);if(!(await readFile(dest)).equals(row.bytes))throw new Error('백업을 확인하지 못했어요. 원본은 지우지 않았어요.');}
 for(const row of found){const actual=await realpath(row.path),rel=relative(root,actual);if(rel.startsWith('..')||isAbsolute(rel)||(await lstat(row.path)).isSymbolicLink()||!(await readFile(row.path)).equals(row.bytes))throw new Error('파일이 바뀌어 정리를 멈췄어요. 백업과 남은 원본을 확인해주세요.');await unlink(row.path);}
 console.log(found.length+'개 파일을 백업한 뒤 정리했어요.');console.log('백업 위치: '+relative(root,backup));
}
