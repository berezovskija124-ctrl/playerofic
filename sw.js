const C='player-v43',IN='share-inbox',F=['./','index.html','manifest.webmanifest','icon-192.png','icon-512.png','icon-180.png','pc-192.png','pc-512.png','pc-180.png'];
self.addEventListener('install',e=>e.waitUntil(caches.open(C).then(c=>c.addAll(F)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==C&&x!==IN).map(x=>caches.delete(x)))).then(()=>self.clients.claim())));
/* «Поделиться» из другого приложения: файлы кладём во входящие, плеер заберёт их при открытии */
async function takeShare(req){
  const home=new URL('./index.html',self.registration.scope);
  try{
    const fd=await req.formData(),fs=fd.getAll('audio').filter(f=>f&&typeof f==='object'&&f.size);
    const c=await caches.open(IN);let i=0;
    for(const f of fs)await c.put(new Request(new URL('./share-inbox/'+Date.now()+'-'+(i++),self.registration.scope).href),new Response(f,{headers:{'content-type':f.type||'application/octet-stream','x-name':encodeURIComponent(f.name||'track')}}));
    home.searchParams.set('shared',String(fs.length));
  }catch(e){}
  return Response.redirect(home.href,303);
}
self.addEventListener('fetch',e=>{const u=new URL(e.request.url);
  if(e.request.method==='POST'&&u.origin===location.origin&&u.pathname.endsWith('/share-target')){e.respondWith(takeShare(e.request));return}
  if(e.request.method!=='GET'||u.origin!==location.origin)return;
  e.respondWith(caches.match(e.request,{ignoreSearch:u.searchParams.has('shared')}).then(r=>{
    const n=fetch(e.request).then(res=>{if(res.ok)caches.open(C).then(c=>c.put(e.request,res.clone()));return res}).catch(()=>r);
    return r||n;}));});
