const CACHE='adp-fde-mobile-600-v1';
const SCOPE=self.registration.scope;
const HOME=new URL('index.html',SCOPE).href;
const FILES=['./','./index.html','./icon.svg','./manifest.webmanifest'];
self.addEventListener('install',event=>event.waitUntil(
 caches.open(CACHE).then(cache=>cache.addAll(FILES.map(p=>new Request(new URL(p,SCOPE),{cache:'reload'}))))
 .then(()=>self.skipWaiting())
));
self.addEventListener('activate',event=>event.waitUntil(
 caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('adp-fde-mobile-')&&k!==CACHE).map(k=>caches.delete(k))))
 .then(()=>self.clients.claim())
));
self.addEventListener('fetch',event=>{
 const req=event.request;
 const root=new URL(SCOPE);
 const url=new URL(req.url);
 if(req.method!=='GET'||req.mode!=='navigate'||url.origin!==root.origin||
  ![root.pathname,new URL(HOME).pathname].includes(url.pathname))return;
 event.respondWith((async()=>{
  const cache=await caches.open(CACHE).catch(()=>null);
  const fallback=async()=>cache?.match(HOME).catch(()=>null);
  try{
   const result=await fetch(req);
   if(result.ok)event.waitUntil(cache?.put(HOME,result.clone()).catch(()=>{})||Promise.resolve());
   else if(result.status===429||result.status>=500)return (await fallback())||result;
   return result;
  }catch{return (await fallback())||Response.error();}
 })());
});
