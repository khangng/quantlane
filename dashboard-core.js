/* Shared, deterministic quote selection and USD position sizing. */
(function(root){
  'use strict';
  const finite = v => typeof v === 'number' && Number.isFinite(v);
  const priority = ['E8_1','E8ONE_1','E8SIG_1'];
  function sortAccounts(accounts){
    const rank = a => {const n=priority.indexOf(String(a.alias).toUpperCase());return n<0?priority.length:n;};
    return [...accounts].sort((a,b)=>rank(a)-rank(b));
  }
  function sourceTime(src){
    return finite(src?.ts)&&src.ts>0?src.ts:finite(src?.server_recv)&&src.server_recv>0?src.server_recv:null;
  }
  function snapshotAge(src,now){
    const ts=sourceTime(src);
    if(ts===null || ts>now+60 || (finite(src.server_recv)&&src.server_recv>now+60))return null;
    return Math.max(0,now-ts,finite(src.server_recv)?now-src.server_recv:0);
  }
  function selectQuote(st,symbol,now=Date.now()/1000){
    // Compare timestamps within this account. An abandoned _px blob never wins by name.
    // Keep a usable last price even if the newest message has no quote.
    const saved=st?.lastQuotes?.[symbol];
    const candidates=[{src:st?.data,kind:'EA chính'},{src:st?.px,kind:'Luồng giá phụ'},...(saved?[{...saved,cached:true}]:[])]
      .filter(({src})=>src && (Object.hasOwn(src.quotes||{},symbol)||Object.hasOwn(src.prices||{},symbol)))
      .sort((a,b)=>(sourceTime(b.src)??-Infinity)-(sourceTime(a.src)??-Infinity));
    if(!candidates.length)return {price:null,age:null,fresh:false,verified:false,reason:'Chưa có giá',source:null};
    const priceOf=({src})=>{const q=src.quotes?.[symbol],v=q?q.bid:src.prices?.[symbol];return finite(v)&&v>0?v:null;};
    const selected=candidates.find(c=>priceOf(c)!==null)||candidates[0];
    const {src,kind}=selected, q=src.quotes?.[symbol],price=priceOf(selected);
    const fallback=!!selected.cached || selected!==candidates[0];
    const elapsed=snapshotAge(src,now);
    const verified=!!q && typeof q.stale==='boolean' && finite(q.age_sec) && q.age_sec>=0;
    const age=elapsed===null?null:elapsed+(verified?q.age_sec:0);
    const maxAge=finite(src.max_price_age_sec)&&src.max_price_age_sec>0?src.max_price_age_sec:30;
    const fresh=price!==null && !fallback && st?.ok!==false && age!==null && age<=maxAge && (!q || (verified&&q.stale===false)) && src.status?.broker_connection!=='OFFLINE';
    const reason=price===null?'Chưa có giá':st?.ok===false?'API mất kết nối':src.status?.broker_connection==='OFFLINE'?'MT5 mất kết nối':fallback?'Bản tin mới chưa có giá hợp lệ':elapsed===null?'Thiếu/lệch thời gian':q&&!verified?'Thiếu tuổi tick':!fresh?'Giá quá hạn / ngoài phiên':!verified?'Chỉ có tuổi bản tin':'Đang cập nhật';
    return {price,age,fresh,verified,reason,source:kind,src};
  }
  function rememberQuotes(st){
    const symbols=new Set([...Object.keys(st.data?.prices||{}),...Object.keys(st.data?.quotes||{}),...Object.keys(st.px?.prices||{}),...Object.keys(st.px?.quotes||{})]);
    st.lastQuotes??=Object.create(null);
    for(const symbol of symbols){const q=selectQuote(st,symbol);if(q.price!==null)st.lastQuotes[symbol]={src:q.src,kind:q.source};}
  }
  function calcLot(price,slPct,risk,contract,symbol){
    if(![price,slPct,risk,contract].every(v=>finite(v)&&v>0))return null;
    // USDJPY P/L is in JPY: convert at current USDJPY price before sizing in USD.
    // (price * stop% * 100000) / price = stop% * 100000 USD per lot.
    const conversion=symbol==='USDJPY'?price:1;
    const lossPerLot=price*(slPct/100)*contract/conversion;
    const lots=risk/lossPerLot;
    return finite(lots)&&lots>0?lots:null;
  }
  root.QuantlaneCore=Object.freeze({sortAccounts,sourceTime,snapshotAge,selectQuote,rememberQuotes,calcLot});
})(globalThis);
