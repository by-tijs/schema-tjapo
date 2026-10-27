import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

function chartFixture() {
  const events = {}, documentEvents = {};
  const node = () => ({ hidden: true, style: {}, offsetWidth: 220, innerHTML: '' });
  let capture = null;
  const canvas = { addEventListener: (name, handler) => { events[name] = handler; },
    setPointerCapture: id => { capture = id; }, hasPointerCapture: id => capture === id,
    releasePointerCapture: () => { capture = null; },
    getBoundingClientRect: () => ({left: 20, width: 300}) };
  const tooltip = node(), line = node(), marker = node();
  const context = vm.createContext({URLSearchParams, location: {search: ''}, window: {},
    localStorage: {getItem: () => null}, document: {addEventListener: (name, handler) => { documentEvents[name] = handler; }},
    canvas, tooltip, line, marker });
  vm.runInContext(readFileSync(new URL('../app.js',import.meta.url),'utf8'),context);
  const run = code => vm.runInContext(code,context);
  run(`els.chartCanvas=canvas; els.chartTooltip=tooltip; els.chartCrosshair=line; els.chartMarker=marker;
    chartInteraction={points:[{date:'2026-10-01',value:80.1,label:'Daggewicht'}, {date:'2026-10-02',value:79.8,label:'Daggewicht'}, {date:'2026-10-03',value:79.5,label:'Daggewicht'}],
      positions:[{x:46,y:60},{x:164,y:100},{x:282,y:140}],metric:{value:BODYWEIGHT_METRIC,label:'Lichaamsgewicht'},width:300,top:18,plotHeight:240,selectedIndex:null,pointerId:null};
    installChartInteraction();`);
  return {events,documentEvents,canvas,tooltip,line,marker,run};
}

test('Touch selects and scrubs the closest point, preserves the value on release, and dismisses outside', () => {
  const a=chartFixture();
  a.events.pointerdown({pointerType:'touch',pointerId:7,clientX:66});
  a.events.focus();
  assert.match(a.tooltip.innerHTML,/80,1 kg/); // focus must not jump to the last point
  a.events.pointermove({pointerType:'touch',pointerId:7,clientX:184});
  assert.match(a.tooltip.innerHTML,/79,8 kg/);
  a.events.pointerup({pointerType:'touch',pointerId:7,clientX:302});
  assert.match(a.tooltip.innerHTML,/79,5 kg/);
  assert.equal(a.tooltip.hidden,false);
  assert.ok(parseFloat(a.tooltip.style.left) + a.tooltip.offsetWidth <= 288);
  a.documentEvents.pointerdown({target:{}});
  assert.equal(a.tooltip.hidden,true);
  assert.equal(a.marker.hidden,true);
});

test('Mouse hover, keyboard navigation and scroll cancellation work without empty-chart errors', () => {
  const a=chartFixture();
  a.events.pointermove({pointerType:'mouse',clientX:184});
  assert.match(a.tooltip.innerHTML,/79,8 kg/);
  a.events.pointerleave({pointerType:'mouse'});
  assert.equal(a.tooltip.hidden,true);
  a.events.focus();
  let prevented=0;
  a.events.keydown({key:'ArrowLeft',preventDefault(){prevented++;}});
  assert.match(a.tooltip.innerHTML,/79,8 kg/);
  a.events.keydown({key:'Home',preventDefault(){prevented++;}});
  assert.match(a.tooltip.innerHTML,/80,1 kg/);
  assert.equal(prevented,2);
  a.events.pointercancel();
  assert.equal(a.tooltip.hidden,true);
  a.run('chartInteraction = null');
  a.events.pointermove({pointerType:'touch',pointerId:7,clientX:90});
  a.events.keydown({key:'ArrowLeft'});
});

test('A single point and chart edges resolve consistently, and running metrics keep their units', () => {
  const a=chartFixture();
  assert.equal(a.run('nearestChartPointIndex(-99, chartInteraction.positions)'),0);
  assert.equal(a.run('nearestChartPointIndex(900, chartInteraction.positions)'),2);
  assert.equal(a.run('nearestChartPointIndex(900, [{x:150}])'),0);
  assert.equal(a.run('nearestChartPointIndex(10, [])'),-1);
  assert.equal(a.run('chartPointDescription({date:"2026-10-01",value:1500,label:"Hardlopen"},{value:RUN_5K_METRIC,label:"5K schatting"}).value'),'25:00');
  assert.equal(a.run('chartPointDescription({date:"2026-10-01",value:112.5},{value:STRENGTH_INDEX_METRIC,label:"Strength index"}).value'),'112,5%');
});
