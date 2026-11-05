import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

function startup({ installed = false, hash = '#stats', fontReady = Promise.resolve() } = {}) {
  let hidden = true, now = 0, seq = 0;
  const timers = new Map(), frames = [];
  const location = {pathname:'/jochem.html',search:'?profiel=jochem',hash};
  const context = vm.createContext({
    window: { matchMedia: () => ({matches:installed}) }, navigator: {}, location,
    history: { replaceState(_,__,url) { location.hash = url.slice(url.indexOf('#')); } },
    document: { documentElement: {classList:{remove() {hidden=false;}}}, fonts: {ready:fontReady} },
    URLSearchParams,
    setTimeout(fn,ms) {const id=++seq;timers.set(id,{fn,at:now+ms});return id;},
    clearTimeout(id) {timers.delete(id);}, requestAnimationFrame(fn) {frames.push(fn);},
  });
  vm.runInContext(readFileSync(new URL('../app-startup.js',import.meta.url),'utf8'),context);
  return {api:context.window.AppStartup,location,hidden:()=>hidden,
    tick(ms) {now+=ms;for(const [id,t] of timers) if(t.at<=now){timers.delete(id);t.fn();}},
    paint() {frames.splice(0).forEach(fn=>fn());},
  };
}

test('installed cold launches begin at Train, while web deep links and activation links remain usable', () => {
  const installed=startup({installed:true});installed.api.start();assert.equal(installed.location.hash,'#train');
  const web=startup();web.api.start();assert.equal(web.location.hash,'#stats');
  const activation=startup({installed:true,hash:'#activate=example'});activation.api.start({profile:true});assert.equal(activation.location.hash,'#activate=example');
});

test('fast verified profile rendering cancels the loading screen before revealing the populated app', async () => {
  const a=startup();a.api.start({profile:true});a.tick(300);assert.equal(a.hidden(),true);
  await a.api.ready();assert.equal(a.hidden(),true);a.paint();assert.equal(a.hidden(),false);
});

test('slow profile authentication can reveal the existing loading screen after a short delay', () => {
  const a=startup();a.api.start({profile:true});a.tick(599);assert.equal(a.hidden(),true);
  a.tick(1);assert.equal(a.hidden(),false);
});

test('a stalled font download never blocks a locally ready schema', async () => {
  const a=startup({fontReady:new Promise(()=>{})});a.api.start();const ready=a.api.ready();
  a.tick(149);assert.equal(a.hidden(),true);a.tick(1);await ready;a.paint();assert.equal(a.hidden(),false);
});
