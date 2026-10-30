import test from 'node:test';
import assert from 'node:assert/strict';
import {createPhotoHistory} from '../src/photo-history.js';
function historyWindow(){
 const stack=[{page:'trees'}],listeners=new Set();let position=0,backs=0,pending=false;
 const win={history:{get state(){return stack[position];},pushState(state){stack.splice(position+1);stack.push(state);position++;},replaceState(state){stack[position]=state;},back(){backs++;pending=true;}},addEventListener:(type,fn)=>{if(type==='popstate')listeners.add(fn);},removeEventListener:(type,fn)=>listeners.delete(fn)};
 return {win,stack,listeners,get backs(){return backs;},get position(){return position;},pop(){assert.ok(pending);pending=false;position--;for(const fn of [...listeners])fn({state:stack[position]});}};
}
test('viewer close requests one same-page Back without putting photo data in history',()=>{
 const env=historyWindow();let closed=0,pending=0;const ctl=createPhotoHistory(env.win,()=>closed++,()=>pending++);
 assert.equal(ctl.supported,true);assert.equal(env.position,1);assert.equal(env.stack[1].page,'trees');assert.deepEqual(Object.keys(env.stack[1]).sort(),['egmyPhotoViewer','page']);
 ctl.close();ctl.close();assert.equal(closed,0);assert.equal(env.backs,1);assert.equal(pending,1);env.pop();assert.equal(closed,1);assert.equal(env.position,0);assert.equal(env.listeners.size,0);ctl.dispose();assert.equal(env.backs,1);
});
test('phone Back closes directly and repeated opening creates only one new entry',()=>{
 const env=historyWindow();let closed=0;const first=createPhotoHistory(env.win,()=>closed++);env.win.history.back();env.pop();first.dispose();assert.equal(closed,1);
 const second=createPhotoHistory(env.win,()=>closed++);assert.equal(env.position,1);env.win.history.back();env.pop();second.dispose();assert.equal(closed,2);assert.equal(env.position,0);
});
test('forced unmount clears only its own marker without navigating a new account or screen',()=>{
 const env=historyWindow();let closed=0;const ctl=createPhotoHistory(env.win,()=>closed++);ctl.dispose();assert.deepEqual(env.win.history.state,{page:'trees'});assert.equal(env.backs,0);assert.equal(env.listeners.size,0);assert.equal(closed,0);
 const other=createPhotoHistory(env.win,()=>closed++);env.win.history.replaceState({page:'new-account'});other.dispose();assert.deepEqual(env.win.history.state,{page:'new-account'});
});
test('unavailable history keeps explicit closing usable without navigating away',()=>{
 for(const win of [{},{history:{state:null,pushState(){throw new Error('denied');},back(){assert.fail('must not go back');}},addEventListener(){},removeEventListener(){}}]){
  let closed=0;const ctl=createPhotoHistory(win,()=>closed++);assert.equal(ctl.supported,false);ctl.close();ctl.close();assert.equal(closed,1);ctl.dispose();
 }
});
