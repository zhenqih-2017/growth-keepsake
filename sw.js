const CACHE='little-years-v3';
const FILES=['./index.html','./style.css','./app.js','./vendor/three.module.js','./icon.svg','./apple-touch-icon.png','./manifest.webmanifest'];
const absolute=path=>new URL(path,self.registration.scope).href;
async function cacheApp(){
 const cache=await caches.open(CACHE);
 // Validate every response before committing: never cache a login or block page as the app.
 const responses=await Promise.all(FILES.map(async path=>{
  const response=await fetch(new Request(absolute(path),{cache:'reload',credentials:'same-origin'}));
  if(!response.ok||response.redirected)throw Error(`Offline asset unavailable: ${path}`);
  const type=response.headers.get('content-type')||'';
  if(path.endsWith('.js')&&!/(javascript|ecmascript)/i.test(type))throw Error(`Invalid script response: ${path}`);
  if(path.endsWith('.css')&&!type.includes('text/css'))throw Error('Invalid stylesheet response');
  if(path.endsWith('index.html')&&!(await response.clone().text()).includes('name="little-years-app"'))throw Error('App shell was replaced by a platform response');
  return response;
 }));
 await Promise.all(FILES.map((path,i)=>cache.put(absolute(path),responses[i])));
}
self.addEventListener('install',event=>event.waitUntil(cacheApp().then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(self.clients.claim()));
self.addEventListener('message',event=>{
 if(event.data?.type!=='CHECK_OFFLINE')return;
 event.waitUntil((async()=>{const cache=await caches.open(CACHE);const entries=await Promise.all(FILES.map(path=>cache.match(absolute(path))));event.ports[0]?.postMessage({version:CACHE,ready:entries.every(Boolean)});})());
});
self.addEventListener('fetch',event=>{
 const url=new URL(event.request.url),scope=new URL(self.registration.scope);
 if(event.request.method!=='GET'||url.origin!==scope.origin)return;
 const shell=event.request.mode==='navigate'&&(url.pathname===scope.pathname||url.pathname===new URL('index.html',scope).pathname);
 event.respondWith((async()=>{
  const cache=await caches.open(CACHE);
  // Normalize the launch URL, including home-screen launch query strings, to the app shell.
  const cached=await cache.match(shell?absolute('./index.html'):event.request);
  if(cached)return cached;
  return fetch(event.request);
 })());
});
