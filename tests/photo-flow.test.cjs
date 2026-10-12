const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const sandbox={globalThis:{},AbortController,setTimeout,clearTimeout};
vm.runInNewContext(fs.readFileSync(require('node:path').join(__dirname,'../src/photo-flow.js'),'utf8'),sandbox);
const flow=sandbox.globalThis.plantPhotoFlow;
const file={name:'plant.png',type:'image/png',size:100};
function photoEnv({readFail=false,decodeFail=false,noContext=false,stalled=false,output='data:image/jpeg;base64,AAAA'}={}) {
 let reader,white=false;
 class Reader {constructor(){reader=this;this.readyState=0;} readAsDataURL(){this.readyState=1;if(stalled)return;queueMicrotask(()=>{this.readyState=2;this.result='data:image/png;base64,AAAA';if(readFail)this.onerror?.();else this.onload?.();});}abort(){this.aborted=true;this.readyState=2;this.onabort?.();}}
 class Image {constructor(){this.naturalWidth=2000;this.naturalHeight=1000;}set src(value){if(value)queueMicrotask(()=>decodeFail?this.onerror?.():this.onload?.());}}
 const ctx={fillStyle:'',fillRect(){white=this.fillStyle==='#ffffff'},drawImage(){}};
 return {env:{FileReader:Reader,Image,document:{createElement:()=>({getContext:()=>noContext?null:ctx,toDataURL:()=>output})}},get reader(){return reader},get white(){return white}};
}
test('latest photo invalidates and aborts earlier token',()=>{const tasks=flow.createLatestTask();const a=tasks.begin(),b=tasks.begin();assert.equal(a.isCurrent(),false);assert.equal(a.signal.aborted,true);assert.equal(b.isCurrent(),true);tasks.cancel();assert.equal(b.isCurrent(),false)});
test('photo validation rejects empty, oversized and unsupported files',()=>{for(const f of [{...file,size:0},{...file,size:21*1024*1024},{...file,type:'image/heic',name:'plant.heic'},{...file,type:'image/svg+xml',name:'plant.svg'}])assert.throws(()=>flow.validatePhoto(f));});
test('empty MIME with a supported extension is accepted',()=>assert.doesNotThrow(()=>flow.validatePhoto({...file,type:''})));
test('photo scales the longest dimension to 1000 and paints transparency white',async()=>{const f=photoEnv();const result=await flow.preparePhoto(file,{env:f.env});assert.equal(result.width,1000);assert.equal(result.height,500);assert.equal(f.white,true);assert.equal(f.reader.onload,null);});
test('file read failures reject instead of hanging',async()=>await assert.rejects(flow.preparePhoto(file,{env:photoEnv({readFail:true}).env}),/읽지 못/));
test('image decode failures reject instead of hanging',async()=>await assert.rejects(flow.preparePhoto(file,{env:photoEnv({decodeFail:true}).env}),/열지 못/));
test('missing canvas is reported',async()=>await assert.rejects(flow.preparePhoto(file,{env:photoEnv({noContext:true}).env}),/브라우저/));
test('oversized encoded output is rejected',async()=>await assert.rejects(flow.preparePhoto(file,{env:photoEnv({output:'data:image/jpeg;base64,'+'A'.repeat(900000)}).env}),/크기로 줄이지/));
test('photo timeout rejects and aborts its pending reader',async()=>{const f=photoEnv({stalled:true});await assert.rejects(flow.preparePhoto(file,{env:f.env,timeoutMs:5}),/오래 걸립니다/);assert.equal(f.reader.aborted,true)});
test('cancelled photo rejects promptly and cleans reader handlers',async()=>{const f=photoEnv({stalled:true}),controller=new AbortController();const p=flow.preparePhoto(file,{env:f.env,signal:controller.signal});controller.abort();await assert.rejects(p,{name:'AbortError'});assert.equal(f.reader.aborted,true);assert.equal(f.reader.onload,null)});
test('GPS unsupported and insecure context have useful errors',async()=>{await assert.rejects(flow.readCurrentLocation({env:{navigator:{},isSecureContext:true}}),/지원하지/);await assert.rejects(flow.readCurrentLocation({env:{isSecureContext:false}}),/HTTPS/)});
test('GPS returns valid coordinates and rejects out-of-range values',async()=>{const env={isSecureContext:true,navigator:{geolocation:{getCurrentPosition(ok){ok({coords:{latitude:35,longitude:126}})}}}};const result=await flow.readCurrentLocation({env});assert.equal(result.lat,35);env.navigator.geolocation.getCurrentPosition=ok=>ok({coords:{latitude:91,longitude:126}});await assert.rejects(flow.readCurrentLocation({env}),/유효한/)});
test('permission denied GPS has a distinct message',async()=>{const env={navigator:{geolocation:{getCurrentPosition(ok,fail){fail({code:1})}}}};await assert.rejects(flow.readCurrentLocation({env}),/권한/)});
test('GPS watchdog ends a callback that never returns',async()=>await assert.rejects(flow.readCurrentLocation({env:{navigator:{geolocation:{getCurrentPosition(){}}}},timeoutMs:5}),/초과/));
test('late GPS success after cancellation cannot fulfill the cancelled promise',async()=>{let success;const controller=new AbortController();const p=flow.readCurrentLocation({signal:controller.signal,env:{navigator:{geolocation:{getCurrentPosition(ok){success=ok}}}}});controller.abort();success({coords:{latitude:35,longitude:126}});await assert.rejects(p,{name:'AbortError'});});
