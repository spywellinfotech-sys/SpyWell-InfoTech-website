/* Network-first: app files always fresh when online, cached copy only as offline fallback. Supabase calls are never cached. */
var C="lk-web-1";
self.addEventListener("install",function(){self.skipWaiting()});
self.addEventListener("activate",function(e){e.waitUntil(caches.keys().then(function(k){return Promise.all(k.filter(function(x){return x!==C}).map(function(x){return caches.delete(x)}))}).then(function(){return self.clients.claim()}))});
self.addEventListener("fetch",function(e){var r=e.request,u=new URL(r.url);
 if(r.method!=="GET"||u.origin!==location.origin)return;
 e.respondWith(fetch(r).then(function(res){var c=res.clone();caches.open(C).then(function(x){x.put(r,c)});return res}).catch(function(){return caches.match(r)}))});
