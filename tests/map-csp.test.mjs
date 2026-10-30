import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const firebase=JSON.parse(await readFile(new URL('../firebase.json',import.meta.url),'utf8'));
const header=firebase.hosting.headers.find(r=>r.source==='**').headers.find(h=>h.key==='Content-Security-Policy').value;
const rules=new Map(header.split(';').map(row=>{const [key,...sources]=row.trim().split(/\s+/);return [key,sources];}));
function allowed(kind,url){const target=new URL(url);return (rules.get(kind)||rules.get('default-src')).some(source=>{
 if(!source.startsWith('https://'))return false;
 const permitted=new URL(source);const host=permitted.hostname.startsWith('*.')?target.hostname.endsWith('.'+permitted.hostname.slice(2)):target.hostname===permitted.hostname;
 return host&&target.protocol===permitted.protocol&&(!permitted.port||target.port===permitted.port)&&(permitted.pathname==='/'||target.pathname.startsWith(permitted.pathname));
});}
test('generated Hosting CSP permits current Kakao SDK dependencies and tile hosts',()=>{
 for(const url of ['https://dapi.kakao.com/v2/maps/sdk.js','https://t1.kakaocdn.net/mapjsapi/js/main/4.5.31/kakao.js','https://t1.kakaocdn.net/mapjsapi/js/libs/services/1.1.5/services.js','https://t1.daumcdn.net/mapjsapi/js/main/legacy/kakao.js'])assert.ok(allowed('script-src',url),url);
 for(const url of ['https://mts.kakaocdn.net/api/v1/tile/example.png','https://t1.kakaocdn.net/mapjsapi/images/marker.png','https://map.kakaocdn.net/map_skyview/example.jpg'])assert.ok(allowed('img-src',url),url);
 assert.ok(allowed('connect-src','https://mts.kakaocdn.net/api/v1/tile/example.png'));
});
test('SDK allowance stays limited to its script path and does not remove other CSP protections',()=>{
 for(const url of ['https://t1.kakaocdn.net/unrelated.js','https://evil.example/mapjsapi/kakao.js','https://t1.kakaocdn.net.evil.example/mapjsapi/kakao.js'])assert.equal(allowed('script-src',url),false,url);
 assert.equal(header.includes("'unsafe-eval'"),false);assert.deepEqual(rules.get('object-src'),["'none'"]);assert.deepEqual(rules.get('frame-ancestors'),["'none'"]);
});
