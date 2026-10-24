import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
// Exercise the real endpoint body with a fake Blob transport; no production access.
function endpoint(entries,fail=false){
  const calls=[];
  const source=readFileSync(new URL('../netlify/functions/data.js',import.meta.url),'utf8')
    .replace(/^import .*;$/gm,'').replace('export default','globalThis.handler =');
  const context=vm.createContext({URL,Response,JSON,Promise,
    getStore:options=>{calls.push(options);return {get:async key=>{if(fail)throw Error('unavailable');return entries[key]??null;}};},
    loadRegistry:async()=>({data:{revision:7,accounts:[{alias:'E8_1',status:'active'},{alias:'E8ONE_1',status:'archived'},{alias:'E8SIG_1',status:'hidden'}]}}),
    publicAccount:a=>({...a,key:a.alias.toLowerCase()})});
  vm.runInContext(source,context);
  return {handle:context.handler,calls};
}
test('data endpoint reads strong snapshots, preserves old _px for compatible clients, hides hidden accounts',async()=>{
  const {handle,calls}=endpoint({e8_1:{ts:100,prices:{USDJPY:157}},e8_1_px:{ts:1,prices:{USDJPY:140}}});
  const res=await handle(new Request('https://example.test/.netlify/functions/data'));
  assert.equal(res.status,200);assert.equal(res.headers.get('cache-control'),'no-store, max-age=0');
  const data=await res.json();assert.equal(data.e8_1.prices.USDJPY,157);assert.equal(data.e8_1_px.ts,1);
  assert.equal(Object.hasOwn(data,'e8sig_1'),false);assert.equal(data.e8one_1,null);
  assert.equal(calls[0].name,'riskdesk');assert.equal(calls[0].consistency,'strong');
});
test('single-account reads and invalid aliases retain API contract',async()=>{
  const {handle}=endpoint({e8_1:{ts:100}});
  assert.equal((await handle(new Request('https://example.test/?acct=E8_1'))).status,200);
  assert.equal((await handle(new Request('https://example.test/?acct=e8sig_1'))).status,400);
});
test('read failure is returned as an error rather than stale success',async()=>{
  const {handle}=endpoint({},true);
  const res=await handle(new Request('https://example.test/'));
  assert.equal(res.status,500);assert.equal((await res.json()).error,'read_failed');
});
