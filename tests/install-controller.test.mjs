import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createInstallController,installationGuide} from '../src/install-controller.js';
function environment({standalone=false}={}){
 const target=new EventTarget(),media=new EventTarget();media.matches=standalone;
 return Object.assign(target,{navigator:{},matchMedia:()=>media,media});
}
function offer(env,prompt=async()=>({outcome:'accepted'})){
 const event=new Event('beforeinstallprompt',{cancelable:true});event.prompt=prompt;env.dispatchEvent(event);return event;
}
test('an installation offer requires a user call and can only be used once',async()=>{
 const env=environment(),states=[],controller=createInstallController(env,s=>states.push(s));let calls=0;
 const event=offer(env,async()=>{calls++;return {outcome:'accepted'};});
 assert.equal(event.defaultPrevented,true);assert.equal(calls,0);assert.equal(controller.getState().canPrompt,true);
 await controller.install();await controller.install();assert.equal(calls,1);assert.equal(controller.getState().canPrompt,false);
 assert.equal(controller.getState().addedThisSession,false);assert.ok(controller.getState().message.includes('설치 요청'));
 env.dispatchEvent(new Event('appinstalled'));assert.equal(controller.getState().addedThisSession,true);controller.dispose();
});
test('dismissal and prompt failure leave manual instructions available without fake success',async()=>{
 for(const prompt of [async()=>({outcome:'dismissed'}),async()=>{throw new Error('not supported');}]){
  const env=environment(),controller=createInstallController(env);offer(env,prompt);await controller.install();
  assert.equal(controller.getState().addedThisSession,false);assert.equal(controller.getState().installing,false);assert.ok(controller.getState().message.length>0);controller.dispose();
 }
});
test('standalone display mode suppresses the install offer and reacts to mode changes',()=>{
 const env=environment({standalone:true}),controller=createInstallController(env);
 offer(env);assert.equal(controller.getState().canPrompt,false);assert.equal(controller.getState().standalone,true);
 env.media.matches=false;env.media.dispatchEvent(new Event('change'));assert.equal(controller.getState().standalone,false);controller.dispose();
});
test('unmount discards late installation results and removes event listeners',async()=>{
 const env=environment(),states=[];let release;
 const controller=createInstallController(env,s=>states.push(s));offer(env,()=>new Promise(resolve=>{release=resolve;}));
 const pending=controller.install();controller.dispose();const count=states.length;release({outcome:'accepted'});await pending;
 offer(env);env.dispatchEvent(new Event('appinstalled'));assert.equal(states.length,count);
});
test('guides cover iOS, desktop-mode iPad, Android and in-app browsers',()=>{
 assert.equal(installationGuide({userAgent:'iPhone Safari'}).kind,'ios');
 assert.equal(installationGuide({platform:'MacIntel',maxTouchPoints:5}).kind,'ios');
 assert.equal(installationGuide({userAgent:'Android Chrome'}).kind,'android');
 assert.equal(installationGuide({userAgent:'iPhone KAKAOTALK'}).kind,'in-app');
 assert.equal(installationGuide().kind,'other');
});
