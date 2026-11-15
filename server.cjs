'use strict';
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { WebSocketServer, WebSocket } = require('ws');

// Node owns Monopoly rules and all four mini-game simulations.
const {MiniGame,TYPES}=require('./mini-engine.cjs');
const sessions=new Map();const {BoardEngine}=require('./board-engine.cjs');const boards=new Map();
function publish(p,data){docs.set(p,{data,updated:Date.now()});const payload=JSON.stringify({p,d:data});for(const client of wss.clients)if(client.paths.has(p))send(client,payload)}
function board(p){if(!boards.has(p))boards.set(p,new BoardEngine());return boards.get(p)}
const publicRoot=path.join(__dirname,'public');
const docs = new Map();
const TTL = 24 * 60 * 60 * 1000;
const MAX_DOCS = 2000;
const server = http.createServer((req, res) => {
  const pathname = new URL(req.url, 'http://localhost').pathname;
  if (pathname === '/healthz') {
    res.writeHead(200, { 'Content-Type': 'text/plain' }); return res.end('ok');
  }
  let file;try{const relative=decodeURIComponent(pathname==='/'?'/index.html':pathname);if(relative.split('/').some(p=>p.startsWith('.')))throw Error();file=path.resolve(publicRoot,'.'+relative);if(!file.startsWith(publicRoot+path.sep))throw Error()}catch{res.writeHead(404);return res.end('Not found')}
  fs.readFile(file,(error,data)=>{if(error){res.writeHead(404);return res.end('Not found')}const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.mp3':'audio/mpeg','.svg':'image/svg+xml','.json':'application/json'};res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(data)});
});
const wss = new WebSocketServer({ server, maxPayload: 512 * 1024, perMessageDeflate: false });
function send(ws, data) {
  if (ws.readyState !== WebSocket.OPEN) return;
  if (ws.bufferedAmount > 2 * 1024 * 1024) return ws.close(1013, 'Slow connection');
  ws.send(typeof data==='string'?data:JSON.stringify(data));
}
function validObject(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return false;
  return !JSON.stringify(data).match(/"(?:__proto__|constructor|prototype)"\s*:/);
}
wss.on('connection', ws => {
  ws.paths = new Set(); ws.alive = true; ws.windowAt = Date.now(); ws.count = 0;
  ws.on('error', () => {});
  ws.on('pong', () => { ws.alive = true; });
  ws.on('message', raw => {
    try {
      if (Date.now() - ws.windowAt > 1000) { ws.windowAt = Date.now(); ws.count = 0; }
      if (++ws.count > 150) return ws.close(1008, 'Too many messages');
      const m = JSON.parse(raw.toString());if(m?.t==='ping'){send(ws,{t:'pong',at:m.at});return}
      if(m?.t?.startsWith('mini:')){miniMessage(ws,m);return}
      if (!m || typeof m.p !== 'string' || !/^(games|cfg)\/[A-Z0-9]{4}$/.test(m.p)) return;
      if(m.t==='unsub'){ws.paths.delete(m.p);return}
      if (m.t === 'sub') {
        if (ws.paths.size >= 16 && !ws.paths.has(m.p)) return;
        ws.paths.add(m.p); const row = docs.get(m.p);
        send(ws, { p: m.p, d: row?.data || null }); return;
      }
      if (!['set', 'upd'].includes(m.t) || !ws.paths.has(m.p) || !validObject(m.d)) return;
      const old = docs.get(m.p);
      if(old?.data.serverAuthority&&m.p.startsWith('games/')&&m.t==='upd'){
        let current=old.data;
        const member=current.seats.some(s=>s.uid===m.uid&&!s.kicked);
        for(const [key,value] of Object.entries(m.d)){
          if(/^command[0-5]$/.test(key)&&value?.uid===m.uid&&member){current=board(m.p).command(current,value)}
          else if(/^presence[0-5]$/.test(key)&&member&&current.seats[+key.slice(8)]?.uid===m.uid){current={...current,[key]:{uid:m.uid,at:Date.now()}}}
          else if(current.mode==='lobby'&&key==='seats'&&Array.isArray(value)){
            const existing=current.seats.findIndex(s=>s.uid===m.uid);
            if(existing<0&&current.seats.length<6){
              const candidate=value.find(s=>s.uid===m.uid);
              if(candidate){const used=new Set(current.seats.map(s=>s.c)),colors=['#ef5350','#42a5f5','#66bb6a','#ffca28','#ab47bc','#ff7043'];current={...current,seats:[...current.seats,{uid:m.uid,n:String(candidate.n).slice(0,14),m:current.seats[0].m,c:colors.find(c=>!used.has(c)),sh:'circle',face:'smile'}]}}
            }else if(existing>=0){current={...current,seats:current.seats.map(s=>{const wanted=value.find(v=>v.uid===s.uid);if(!wanted)return s;const next={...s};if(m.uid===current.host)next.m=Math.max(0,Math.min(1000000,Math.round(+wanted.m)||0));if(s.uid===m.uid){if(typeof wanted.c==='string'&&/^#[0-9a-f]{6}$/i.test(wanted.c))next.c=wanted.c;if(typeof wanted.sh==='string')next.sh=wanted.sh}return next})}}
          }else if(current.mode==='lobby'&&m.uid===current.host&&key==='partySettings'){current={...current,partySettings:value}}
        }
        publish(m.p,current);return;
      }
      if(m.p.startsWith('cfg/')){const game=docs.get('games/'+m.p.slice(4))?.data;if(!game||m.uid!==game.host)return;if(!Number.isInteger(m.d.lvl)||m.d.lvl<1||m.d.lvl>10||!Number.isInteger(m.d.sec)||m.d.sec<0||m.d.sec>90)return;m.d={lvl:m.d.lvl,sec:m.d.sec}}
      // A new room cannot overwrite a room already using the same code.
      if (m.t === 'set' && m.p.startsWith('games/') && old){send(ws,{t:'room:error',p:m.p,message:'Otaq kodu artıq istifadə olunur. Yenidən otaq yaradın.'});return;}
      if (!old && m.t === 'upd') return;
      if (!old && docs.size >= MAX_DOCS) return;
      if(old&&m.p.startsWith('games/')){
        if(m.d.host&&m.d.host!==old.data.host){const hi=old.data.seats?.findIndex(s=>s.uid===old.data.host),pr=old.data['presence'+hi];if(!pr||Date.now()-pr.at<30000||m.uid!==m.d.host)delete m.d.host;}
        // Once passed, a seat cannot re-enter the same auction via a stale update.
        if(old.data.au&&(!Object.hasOwn(m.d,'au')||m.d.au?.id===old.data.au.id))for(let i=0;i<6;i++)if(old.data['ap'+i]===1&&Object.hasOwn(m.d,'ap'+i))m.d['ap'+i]=1;
      }
      let data = m.t === 'upd' ? { ...old.data, ...m.d } : m.d;
      if(!old&&m.p.startsWith('games/')&&Array.isArray(data.seats)&&data.mode==='lobby')data={...data,serverAuthority:true};
      if (Buffer.byteLength(JSON.stringify(data)) > 512 * 1024) return;
      docs.set(m.p, { data, updated: Date.now() });
      for (const client of wss.clients) if (client.paths.has(m.p)) send(client, { p: m.p, d: data });
    } catch { /* Ignore malformed messages without stopping other rooms. */ }
  });
});
function miniMessage(ws,m){
 if(!/^[A-Z0-9]{4}$/.test(m.room||'')||typeof m.uid!=='string'||typeof m.id!=='string')return;
 const doc=docs.get('games/'+m.room)?.data;if(!doc||!Array.isArray(doc.seats)||!doc.mini||doc.mini.id!==m.id)return;
 const seat=doc.seats.findIndex(s=>s.uid===m.uid&&!s.kicked);if(seat<0)return;
 const key=m.room+'/'+m.id;let row=sessions.get(key);
 if(m.t==='mini:create'&&!row){if(doc.host!==m.uid||!TYPES[doc.mini.type])return;const seats=doc.mini.participants.map(i=>({id:i,uid:doc.seats[i]?.uid,name:doc.seats[i]?.n,color:doc['P'+i]?.c,face:doc['P'+i]?.face})).filter(s=>s.uid);if(seats.length<2||seats.length>6)return;row={game:new MiniGame(doc.mini,seats),created:Date.now(),room:m.room};sessions.set(key,row)}
 if(!row)return;ws.miniKey=key;ws.miniUid=m.uid;
 if(m.t==='mini:ready')row.game.setReady(m.uid);
 if(m.t==='mini:input')row.game.input(m.uid,m.input||{});
 if(m.t==='mini:forfeit'&&doc.host===m.uid){const p=row.game.players.find(p=>p.uid===m.target);if(p&&doc.seats[p.id]?.kicked){p.inv=0;row.game.damage(p,99,'forfeit');row.game.setReady(p.uid)}}
 if(m.t!=='mini:input')send(ws,{t:'mini:state',room:m.room,state:row.game.snapshot()});
}
let broadcastTick=0,lastSimulation=performance.now(),simulationDebt=0;const simulation=setInterval(()=>{const now=performance.now();simulationDebt+=Math.min(.25,(now-lastSimulation)/1000);lastSimulation=now;const steps=Math.min(8,Math.floor(simulationDebt*30));simulationDebt-=steps/30;
 if(broadcastTick%3===0)for(const [p,row] of docs){if(!p.startsWith('games/')||!row.data.serverAuthority)continue;let d=row.data;if(d.mode!=='play')continue;const hostIndex=d.seats.findIndex(s=>s.uid===d.host),presence=d['presence'+hostIndex];if(presence&&Date.now()-presence.at>30000){const replacement=d.seats.find((s,i)=>!s.kicked&&d['presence'+i]&&Date.now()-d['presence'+i].at<12000);if(replacement&&replacement.uid!==d.host){d={...d,host:replacement.uid};publish(p,d)}}const mini=d.mini&&sessions.get(p.slice(6)+'/'+d.mini.id)?.game;const next=board(p).tick(d,docs.get('cfg/'+p.slice(6))?.data,mini?.snapshot());if(next!==d)publish(p,next);if(next.mini&&!sessions.has(p.slice(6)+'/'+next.mini.id)){const seats=next.mini.participants.map(i=>({id:i,uid:next.seats[i].uid,name:next.seats[i].n,color:next['P'+i].c,face:next['P'+i].face}));sessions.set(p.slice(6)+'/'+next.mini.id,{game:new MiniGame(next.mini,seats),created:Date.now(),room:p.slice(6)})}}
 for(const [key,row] of sessions){const doc=docs.get('games/'+row.room)?.data;if(!doc?.mini||doc.mini.id!==row.game.id){if(Date.now()-row.created>120000)sessions.delete(key);continue}
 for(const p of row.game.players)if(doc.seats[p.id]?.kicked){if(!p.dead){p.inv=0;row.game.damage(p,99,'forfeit')}row.game.setReady(p.uid)}
 for(let step=0;step<steps;step++)row.game.update(1/30);if(broadcastTick%2===0){const payload=JSON.stringify({t:'mini:state',room:row.room,state:row.game.snapshot()});for(const client of wss.clients)if(client.miniKey===key)send(client,payload)}
 }broadcastTick++;
},1000/30);
const heartbeat = setInterval(() => {
  for (const ws of wss.clients) {
    if (!ws.alive) { ws.terminate(); continue; }
    ws.alive = false; ws.ping();
  }
  for (const [key, row] of docs) {
    if (Date.now() - row.updated > TTL && ![...wss.clients].some(ws => ws.paths.has(key))) {docs.delete(key);boards.delete(key);}
  }
}, 30000);
const cliPortIndex=process.argv.indexOf('--port');
const port = Number(process.env.PORT || (cliPortIndex>=0?process.argv[cliPortIndex+1]:null) || 3000);
server.listen(port, '0.0.0.0', () => console.log(`Monopoli listening on ${server.address().port}`));
function shutdown() {
  clearInterval(heartbeat);clearInterval(simulation);
  for (const ws of wss.clients) ws.close(1001, 'Server restarting');
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(0), 5000).unref();
}
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
