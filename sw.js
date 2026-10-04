// Trolley Launch service worker: always fetch the newest game when online, fall back to the saved copy offline.
const C='trolley-launch-v10';
const FILES=['./','index.html','manifest.json','icon-192.png','icon-512.png'];
self.addEventListener('install',e=>{ self.skipWaiting(); e.waitUntil(caches.open(C).then(c=>c.addAll(FILES)).catch(()=>{})); });
self.addEventListener('activate',e=>{ e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==C).map(x=>caches.delete(x)))).then(()=>self.clients.claim())); });
self.addEventListener('fetch',e=>{
  const r=e.request; if(r.method!=='GET') return;
  const page=r.mode==='navigate'||r.destination==='document';
  if(page){ // network first for the game itself
    e.respondWith(fetch(r,{cache:'no-store'}).then(res=>{ const cp=res.clone(); caches.open(C).then(c=>c.put(r,cp)); return res; })
      .catch(()=>caches.match(r).then(m=>m||caches.match('index.html'))));
    return;
  }
  // everything else: use the saved copy, refresh it in the background
  e.respondWith(caches.match(r).then(m=>{ const f=fetch(r).then(res=>{ if(res&&res.ok){ const cp=res.clone(); caches.open(C).then(c=>c.put(r,cp)); } return res; }).catch(()=>m); return m||f; }));
});
