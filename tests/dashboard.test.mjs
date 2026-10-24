import test from 'node:test';
import assert from 'node:assert/strict';
import '../dashboard-core.js';
const {calcLot,selectQuote,sortAccounts,rememberQuotes}=globalThis.QuantlaneCore;
const now=1800000000;
const snapshot=(ts,price=157.227,extras={})=>({ts,server_recv:ts,max_price_age_sec:30,prices:{USDJPY:price},quotes:{USDJPY:{bid:price,ask:price+.01,age_sec:1,stale:false}},...extras});
test('USDJPY: requested 1280 USD / 0.5% / 100000 = 2.56 lots',()=>{
  assert.equal(calcLot(157.227,.5,1280,100000,'USDJPY'),2.56);
  assert.equal(calcLot(140,.5,1280,100000,'USDJPY'),2.56);
});
test('USD-quoted pairs and configured CFD formulas remain intact',()=>{
  assert.equal(calcLot(1.32403,.5,1280,100000,'GBPUSD').toFixed(2),'1.93');
  assert.equal(calcLot(4284.54,.5,1280,100,'XAUUSD').toFixed(2),'0.60');
  assert.equal(calcLot(30641.25,.5,1280,5,'US100').toFixed(2),'1.67');
});
test('invalid sizing input does not produce a trade size',()=>{
  for(const value of [0,-1,NaN,Infinity,undefined,'1280'])assert.equal(calcLot(157,.5,value,100000,'USDJPY'),null);
  assert.equal(calcLot(157,0,1280,100000,'USDJPY'),null);
  assert.equal(calcLot(157,.5,1280,0,'USDJPY'),null);
});
test('abandoned E8_1_px cannot shadow a new main EA snapshot',()=>{
  const q=selectQuote({data:snapshot(now-3),px:snapshot(now-2190682,140)},'USDJPY',now);
  assert.equal(q.price,157.227);assert.equal(q.source,'EA chính');assert.equal(q.age,4);assert.equal(q.fresh,true);
});
test('active secondary stream can still win when actually newer',()=>{
  const q=selectQuote({data:snapshot(now-15,150),px:snapshot(now-1,151)},'USDJPY',now);
  assert.equal(q.price,151);assert.equal(q.source,'Luồng giá phụ');
});
test('newer stale quote is never replaced with an older apparently fresh quote',()=>{
  const data=snapshot(now-1,157);data.quotes.USDJPY.stale=true;
  const q=selectQuote({data,px:snapshot(now-2,140)},'USDJPY',now);
  assert.equal(q.price,157);assert.equal(q.fresh,false);
});
test('per-symbol selection and missing quote do not borrow another symbol',()=>{
  assert.equal(selectQuote({data:snapshot(now-1)},'EURUSD',now).price,null);
  const data=snapshot(now-1);data.quotes.USDJPY={bid:null,age_sec:-1,stale:true};
  const fallback=selectQuote({data,px:snapshot(now-2)},'USDJPY',now);
  assert.equal(fallback.price,157.227);assert.equal(fallback.fresh,false);
});
test('price expiry includes tick age and elapsing client time',()=>{
  const st={data:snapshot(now-5)};st.data.quotes.USDJPY.age_sec=20;
  assert.equal(selectQuote(st,'USDJPY',now).fresh,true);
  assert.equal(selectQuote(st,'USDJPY',now+6).fresh,false);
});
test('disconnected, old, untimestamped, and future snapshots are not fresh',()=>{
  assert.equal(selectQuote({data:snapshot(now-40)},'USDJPY',now).fresh,false);
  assert.equal(selectQuote({data:snapshot(now-1,157,{status:{broker_connection:'OFFLINE'}})},'USDJPY',now).fresh,false);
  assert.equal(selectQuote({data:snapshot(now+120)},'USDJPY',now).fresh,false);
  assert.equal(selectQuote({px:{prices:{USDJPY:157}}},'USDJPY',now).fresh,false);
});
test('legacy prices remain compatible but cannot claim tick verification',()=>{
  const q=selectQuote({px:{ts:now-2,prices:{USDJPY:157}}},'USDJPY',now);
  assert.equal(q.fresh,true);assert.equal(q.verified,false);assert.equal(q.age,2);
});
test('requested account order applies even to an existing registry; no mutation',()=>{
  const original=['E8SIG_1','E8ONE_1','FTMO_2','E8_1','FTMO_1'].map(alias=>({alias}));
  assert.deepEqual(sortAccounts(original).map(a=>a.alias),['E8_1','E8ONE_1','E8SIG_1','FTMO_2','FTMO_1']);
  assert.equal(original[0].alias,'E8SIG_1');
});

test('stale and API-offline prices still produce the requested position size',()=>{
  for(const st of [{data:snapshot(now-120)},{data:snapshot(now-1),ok:false}]){
    const q=selectQuote(st,'USDJPY',now);
    assert.equal(q.fresh,false);
    assert.equal(calcLot(q.price,.5,1280,100000,'USDJPY'),2.56);
    assert.equal(calcLot(q.price,.5,640,100000,'USDJPY'),1.28);
  }
});
test('remembered quotes survive empty payloads and do not cross accounts or symbols',()=>{
  const a={data:snapshot(now-2),ok:true};rememberQuotes(a);
  a.data=snapshot(now-1);a.data.quotes.USDJPY.bid=null;
  rememberQuotes(a);
  const q=selectQuote(a,'USDJPY',now+10);
  assert.equal(q.price,157.227);assert.equal(q.fresh,false);assert.equal(q.age,13);
  assert.equal(selectQuote(a,'EURUSD',now).price,null);
  assert.equal(selectQuote({data:null,ok:false},'USDJPY',now).price,null);
  a.data=null;a.px=null;a.ok=false;
  assert.equal(selectQuote(a,'USDJPY',now).price,157.227);
  a.data=snapshot(now,159);a.ok=true;rememberQuotes(a);
  assert.equal(selectQuote(a,'USDJPY',now).price,159);
  assert.equal(selectQuote(a,'USDJPY',now).fresh,true);
});
test('out-of-order snapshots cannot overwrite the last received newer price',()=>{
  const a={data:snapshot(now,159),ok:true};rememberQuotes(a);
  a.data=snapshot(now-20,150);rememberQuotes(a);
  assert.equal(selectQuote(a,'USDJPY',now).price,159);
});
