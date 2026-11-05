/* 도락실 · 오프라인 대비 + 온라인 우선 서비스 워커 (이 폴더 안에서만 동작)
   원리(폴란드 퀴즈와 동일):
   - 설치할 때 앱 전체를 기기에 저장 → 인터넷이 없어도 주소 입력·새로고침·앱 아이콘 실행 모두 동작
   - 인터넷이 되면 '서버 최신본 우선'(최대 4초) → 느리거나 끊기면 저장본으로 즉시 실행
   - 새 빌드를 받으면 화면에 알려 안전한 때(시작 화면)에 자동 새로고침
   - 설치는 절대 실패시키지 않고(파일마다 3번 재시도) 무엇이 저장 안 됐는지 __report.json 에 기록 */
const V='dr-v'+'3780933438ac';
const ASSETS=['./','manifest.webmanifest','icon.svg','icon-192.png','icon-512.png','icon-maskable-512.png'];
const SCOPE=new URL('./',self.location).pathname;
/* 기능별 주소(폴더) → 앱 파라미터 주소. 오프라인에서도 동작해요 */
const ROUTES={admin:'?admin',books:'?admin=books',records:'?admin=rec',settings:'?admin=set',fields:'?admin=fields',cloud:'?admin=cloud',board:'?board',guide:'?guide',repair:'?repair',reset:'?reset','update-app':'?update=app','update-settings':'?update=settings'};
const clean=async res=>(res&&res.redirected)?new Response(await res.blob(),{status:200,statusText:'OK',headers:res.headers}):res;
const build=t=>{const m=/name="pq-build" content="([^"]+)"/.exec(t||'');return m?m[1]:''};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function precache(){
  const rep={v:V,t:Date.now(),ok:[],fail:[]};let c=null;
  try{c=await caches.open(V)}catch(err){rep.fail.push(['caches.open',String((err&&err.message)||err)])}
  if(c){
    for(const a of ASSETS){
      let done=false,last='';
      for(let k=0;k<3&&!done;k++){
        try{const res=await fetch(new Request(a,{cache:'no-store'}));if(!res.ok)throw new Error('HTTP '+res.status);await c.put(a,await clean(res));done=true}
        catch(err){last=String((err&&err.message)||err);await sleep(400*(k+1))}
      }
      if(done)rep.ok.push(a);else rep.fail.push([a,last]);
    }
    try{await c.put('__report.json',new Response(JSON.stringify(rep),{headers:{'Content-Type':'application/json'}}))}catch(_){}
  }
}
self.addEventListener('install',e=>{e.waitUntil((async()=>{await precache();self.skipWaiting()})())});
self.addEventListener('activate',e=>{e.waitUntil((async()=>{
  const ks=await caches.keys();
  await Promise.all(ks.filter(k=>k!==V&&/^dr-/.test(k)).map(k=>caches.delete(k)));
  try{const c=await caches.open(V);if(!(await c.match('__report.json')))await precache()}catch(_){}
  await self.clients.claim();
})())});
const OFFMSG='오프라인 상태이고 이 기기에 저장된 앱이 아직 없어요. 인터넷에 연결해서 한 번만 열어 주세요.';
async function doc(e){
  const c=await caches.open(V);
  const hit=await c.match('./',{ignoreSearch:true});
  const net=fetch(SCOPE,{cache:'no-store'}).then(async res=>{
    if(res&&res.ok){
      const copy=await clean(res.clone());let changed=false;
      try{if(hit){const [x,y]=await Promise.all([hit.clone().text(),copy.clone().text()]);changed=build(x)!==build(y)}}catch(_){}
      await c.put('./',copy);
      if(changed)(await self.clients.matchAll()).forEach(x=>x.postMessage({type:'updated'}));
    }
    return res;
  }).catch(()=>null);
  const first=await Promise.race([net,new Promise(r=>setTimeout(()=>r('t'),4000))]);
  if(first&&first!=='t'&&first.ok)return clean(first);
  if(hit){e.waitUntil(net);return hit}
  const res=first==='t'?await net:first;
  if(res)return clean(res);
  return new Response(OFFMSG,{status:503,headers:{'Content-Type':'text/plain; charset=utf-8'}});
}
async function asset(e,r){
  const c=await caches.open(V);
  const hit=await c.match(r,{ignoreSearch:true});
  const net=fetch(r,{cache:'no-store'}).then(async res=>{if(res&&res.ok&&res.status===200){try{await c.put(r,res.clone())}catch(_){}}return res}).catch(()=>null);
  if(hit){e.waitUntil(net);return hit}
  const res=await net;
  return res||new Response(OFFMSG,{status:503,headers:{'Content-Type':'text/plain; charset=utf-8'}});
}
self.addEventListener('fetch',e=>{
  const r=e.request;if(r.method!=='GET')return;
  const u=new URL(r.url);if(u.origin!==location.origin)return;
  if(!u.pathname.startsWith(SCOPE))return;
  if(u.pathname.endsWith('/version.json')||u.pathname.endsWith('/sw.js'))return;
  if(r.mode==='navigate'){
    const rest=u.pathname.slice(SCOPE.length).replace(/\/+$/,'');
    if(Object.prototype.hasOwnProperty.call(ROUTES,rest)){
      e.respondWith(Response.redirect(SCOPE+ROUTES[rest]+(u.search?'&'+u.search.slice(1):''),302));return;
    }
  }
  const isFile=/\.[a-z0-9]{2,5}$/i.test(u.pathname)&&u.pathname!==SCOPE+'index.html';
  const isDoc=!isFile&&(r.mode==='navigate'||u.pathname===SCOPE||u.pathname===SCOPE+'index.html');
  e.respondWith((isDoc?doc(e):asset(e,r)).catch(()=>fetch(r).catch(()=>new Response(OFFMSG,{status:503,headers:{'Content-Type':'text/plain; charset=utf-8'}}))));
});
