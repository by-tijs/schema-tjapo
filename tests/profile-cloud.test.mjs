import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { webcrypto } from 'node:crypto';
const source = readFileSync(new URL('../profile-cloud.js', import.meta.url), 'utf8');
const uid = '4XLfELa1AoeC4tcqBdW3e4Bz29o1';
const key = `tracker:user:${uid}`;
function fixture({storage = new Map(), remote = null, invitation = ''} = {}) {
  const context = vm.createContext({window:{}, localStorage:{
    getItem:k => storage.get(k) ?? null, setItem:(k,v) => storage.set(k,v),
  }, sessionStorage:{removeItem(){}}, structuredClone, Date, crypto:webcrypto,
    setTimeout:() => 1, clearTimeout(){}, setInterval:() => 1});
  vm.runInContext(source,context);
  let state = {};
  let cloud = remote;
  let reads = 0, writes = 0, signedOut = false;
  const copy = x => structuredClone(x);
  const snap = () => ({exists:()=> Boolean(cloud),data:()=>copy(cloud)});
  const account = new context.window.ProfileAccount({profile:{id:'jochem',uid,email:'jochem@schema-tjapo.invalid'},key,
    legacyKey:'tracker:profile:jochem',invitation,
    getState:()=>state,hasData:s=>Boolean(s.history?.length),onStatus(){},clearPasswords(){},
    onLoad:s=>{state=copy(s);if(account.authenticated)storage.set(key,JSON.stringify(state));}});
  account.auth = {};
  account.db = {};
  account.authApi = {signOut:async()=>{signedOut=true;},
    signInWithEmailAndPassword:async()=>({user:{uid}}),updatePassword:async()=>{}};
  account.dbApi = {doc:(_db,...parts)=>parts.join('/'),
    getDocFromServer:async()=>{reads++;return snap();},
    runTransaction:async(_db,fn)=>fn({get:async()=>{reads++;return snap();},set:(_ref,payload)=>{writes++;cloud=copy(payload);}})};
  return {account,storage,get state(){return state;},set state(s){state=s;storage.set(key,JSON.stringify(s));},
    get remote(){return cloud;},set remote(r){cloud=r;},get reads(){return reads;},get writes(){return writes;},get signedOut(){return signedOut;}};
}
test('A saved workout restores in a fresh authenticated session',async()=>{
 const a=fixture();await a.account.onSession({uid});await a.account.sync();
 a.state={history:[{id:'workout-1',reps:8}]};a.account.queueSave();await a.account.sync();
 const b=fixture({remote:a.remote});await b.account.onSession({uid});
 assert.equal(b.state.history[0].reps,8);assert.equal(b.account.meta.pending,false);
 assert.equal(a.account.ref,`users/${uid}/schemaTjapo/state`);
});
test('Only Jochem’s legacy browser data is migrated; owner data stays untouched',async()=>{
 const owner=JSON.stringify({history:[{id:'owner'}]});
 const legacy=JSON.stringify({history:[{id:'jochem'}]});
 const a=fixture({storage:new Map([['tracker',owner],['tracker:profile:jochem',legacy]])});
 await a.account.onSession({uid});
 assert.equal(a.remote.state.history[0].id,'jochem');
 assert.equal(a.storage.get('tracker'),owner);assert.equal(a.storage.get('tracker:profile:jochem'),legacy);
});
test('The wrong account cannot load or upload this profile',async()=>{
 const a=fixture();await a.account.onSession({uid:'owner'});
 assert.equal(a.signedOut,true);assert.equal(a.account.authenticated,false);
 assert.equal(a.reads,0);assert.equal(a.writes,0);
});
test('New edits during an upload are sent in a later revision',async()=>{
 const a=fixture();await a.account.onSession({uid});await a.account.sync();
 let release; const paused=new Promise(r=>release=r);const tx=a.account.dbApi.runTransaction;
 a.account.dbApi.runTransaction=async(db,fn)=>{await paused;return tx(db,fn);};
 a.state={history:[{reps:7}]};a.account.queueSave();const first=a.account.sync();
 a.state={history:[{reps:9}]};a.account.queueSave();release();await first;
 assert.equal(a.account.meta.pending,true);assert.equal(a.remote.state.history[0].reps,7);
 await a.account.sync();assert.equal(a.remote.state.history[0].reps,9);assert.equal(a.account.meta.pending,false);
});
test('Concurrent device changes stop an overwrite and preserve a recovery copy',async()=>{
 const a=fixture({remote:{revision:1,state:{history:[{reps:5}]}}});await a.account.onSession({uid});
 a.state={history:[{reps:6}]};a.account.queueSave();
 a.remote={revision:2,state:{history:[{reps:8}]}};
 await a.account.sync();assert.equal(a.remote.state.history[0].reps,8);assert.ok(a.account.conflict);
 await a.account.resolveConflict(false);
 assert.equal(a.state.history[0].reps,8);
 assert.equal(JSON.parse(a.storage.get(`${key}:recovery`)).state.history[0].reps,6);
});
test('A delayed cloud response cannot repopulate a logged-out session',async()=>{
 const a=fixture();await a.account.onSession({uid});await a.account.sync();
 let release;a.account.dbApi.getDocFromServer=()=>new Promise(r=>release=r);
 const pending=a.account.sync();await a.account.onSession(null);
 release({exists:()=>true,data:()=>({revision:9,state:{history:[{id:'stale'}]}})});await pending;
 assert.equal(a.account.authenticated,false);assert.equal(a.state.history,undefined);
});
test('Offline writes remain pending and retry after recovery',async()=>{
 const a=fixture();await a.account.onSession({uid});await a.account.sync();
 const original=a.account.dbApi.runTransaction;a.account.dbApi.runTransaction=async()=>{throw new Error('offline');};
 a.state={history:[{reps:10}]};a.account.queueSave();await a.account.sync();
 assert.equal(a.account.meta.pending,true);assert.equal(JSON.parse(a.storage.get(key)).history[0].reps,10);
 a.account.dbApi.runTransaction=original;await a.account.sync();
 assert.equal(a.remote.state.history[0].reps,10);assert.equal(a.account.meta.pending,false);
});
test('Activation validates confirmation and replaces the temporary password only after successful sign-in',async()=>{
 const a=fixture({invitation:'temporary-test-only-token'});const calls=[];
 a.account.authApi.signInWithEmailAndPassword=async(_auth,email,password)=>{calls.push(['login',email,password]);return {user:{uid}};};
 a.account.authApi.updatePassword=async(_user,password)=>{calls.push(['change',password]);};
 await a.account.submit('jochem','short','short');assert.equal(calls.length,0);
 await a.account.submit('jochem','new-test-password','mismatch');assert.equal(calls.length,0);
 await a.account.submit('jochem','new-test-password','new-test-password');
 assert.deepEqual(calls,[['login','jochem@schema-tjapo.invalid','temporary-test-only-token'],['change','new-test-password']]);
 assert.equal(a.account.invitation,'');assert.equal(a.account.authenticated,true);
});

test('Retrying an upload whose acknowledgement was lost does not produce a conflict',async()=>{
 const a=fixture();await a.account.onSession({uid});await a.account.sync();
 const tx=a.account.dbApi.runTransaction;let loseResponse=true;
 a.account.dbApi.runTransaction=async(db,fn)=>{const r=await tx(db,fn);if(loseResponse){loseResponse=false;throw new Error('response lost');}return r;};
 a.state={history:[{reps:11}]};a.account.queueSave();await a.account.sync();
 assert.equal(a.remote.state.history[0].reps,11);assert.equal(a.account.meta.pending,true);
 const revision=a.remote.revision;
 await a.account.sync();
 assert.equal(a.account.conflict,null);assert.equal(a.account.meta.pending,false);assert.equal(a.remote.revision,revision);
});
