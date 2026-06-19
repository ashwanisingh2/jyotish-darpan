const C='jyotish-darpan-v2',A=['/','/index.html','/index.css','/enhancements.js','/manifest.webmanifest'];
self.addEventListener('install',e=>{
  self.skipWaiting();
  e.waitUntil(caches.open(C).then(c=>c.addAll(A)));
});
self.addEventListener('activate',e=>{
  e.waitUntil(
    caches.keys().then(k=>Promise.all(k.filter(x=>x!==C).map(x=>caches.delete(x))))
      .then(() => self.clients.claim())
  );
});
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET'||new URL(e.request.url).pathname.startsWith('/api/'))return;
  e.respondWith(
    fetch(e.request)
      .then(r=>{
        const y=r.clone();
        caches.open(C).then(c=>c.put(e.request,y));
        return r;
      })
      .catch(()=>caches.match(e.request).then(x=>x||caches.match('/index.html')))
  );
});
