// Network-first shell: a saved PWA picks up fixes on reload.
const CACHE = 'riskdesk-v2160';
const SHELL = ['/', '/index.html', '/dashboard.css', '/dashboard-core.js', '/fund-rules.js', '/manifest.json', '/icon-192.png', '/icon-512.png', '/apple-touch-icon.png', '/favicon.png'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('riskdesk-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{
  const url=new URL(e.request.url);
  if(e.request.method!=='GET'||url.origin!==self.location.origin||url.pathname.includes('/.netlify/functions/')||/^\/manage(?:\.html|\.js|\.css)?$/.test(url.pathname))return;
  e.respondWith(fetch(e.request).then(async res=>{
    if(res.ok){const c=await caches.open(CACHE);await c.put(e.request,res.clone());}
    return res;
  }).catch(async()=>await caches.match(e.request)||Response.error()));
});
