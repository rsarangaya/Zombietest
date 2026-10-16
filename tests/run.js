// Headless tests: run with  node tests/run.js  (no dependencies).
// Loads the game scripts into a vm context with a stubbed canvas/DOM, then checks level generation and game data.
const fs=require('fs'),path=require('path'),vm=require('vm');
const root=path.join(__dirname,'..','js');
const proxy=()=>new Proxy(function(){},{get:(t,k)=>k==='canvas'?proxy():proxy(),set:()=>true,apply:()=>proxy()});
const ctx=vm.createContext({console,Math,Set,Map,Array,Object,JSON,Float32Array,
 document:{createElement:()=>({width:0,height:0,getContext:()=>proxy()}),getElementById:()=>proxy()},
 performance:{now:()=>0},window:{},localStorage:{getItem:()=>null,setItem(){}}});
for(const f of ['util','sprites','data','textures','level','game','abilities'])vm.runInContext(fs.readFileSync(path.join(root,f+'.js'),'utf8'),ctx,{filename:f+'.js'});
const run=code=>vm.runInContext(code,ctx);
let fails=0,checks=0;
const ok=(cond,msg)=>{checks++;if(!cond){fails++;if(fails<=25)console.log('FAIL:',msg)}};

// ---- 1. level generation invariants over many seeds
const MAXD=run('MAX_DEPTH'),STAGE_LEN=run('STAGE_LEN');
const SEEDS=+process.argv[2]||2000;
const gen=run(`(function(seed){
 seedRng(seed);const {m,rooms}=gen();const out={rooms:rooms.length,bad:[],stubs:0,disc:false,doors:0,h:0};
 const fl=(x,y)=>x>=0&&y>=0&&x<W&&y<H&&m[y][x]!==0;
 for(let y=0;y<H;y++)for(let x=0;x<W;x++){out.h=(out.h*31+m[y][x]+1)>>>0}
 for(let y=1;y<H-1;y++)for(let x=1;x<W-1;x++){
  if(m[y][x]===2){out.doors++;const ew=!fl(x,y-1)&&!fl(x,y+1),ns=!fl(x-1,y)&&!fl(x+1,y);
   if(ew===ns)out.bad.push('door '+x+','+y+' has no clean wall flanks');
   else{const a=ew?[x-1,y]:[x,y-1],b=ew?[x+1,y]:[x,y+1];if(!fl(...a)||!fl(...b))out.bad.push('door '+x+','+y+' leads nowhere')}}
  if(m[y][x]===0&&[[0,1],[0,-1],[1,0],[-1,0]].filter(([a,b])=>fl(x+a,y+b)).length>=3)out.stubs++}
 const seen=new Set(),q=[[rooms[0].cx,rooms[0].cy]];seen.add(rooms[0].cy*W+rooms[0].cx);
 for(let i=0;i<q.length;i++){const [x,y]=q[i];for(const [a,b] of [[0,1],[0,-1],[1,0],[-1,0]]){const nx=x+a,ny=y+b;if(fl(nx,ny)&&!seen.has(ny*W+nx)){seen.add(ny*W+nx);q.push([nx,ny])}}}
 out.disc=!rooms.every(r=>seen.has(r.cy*W+r.cx));return out})`);
let totalDoors=0;
for(let s=1;s<=SEEDS;s++){const r=gen(s);totalDoors+=r.doors;
 ok(r.rooms>=2,`seed ${s}: only ${r.rooms} rooms`);ok(!r.disc,`seed ${s}: rooms not all connected`);
 ok(r.stubs===0,`seed ${s}: ${r.stubs} orphaned wall stubs`);for(const b of r.bad)ok(false,`seed ${s}: ${b}`)}
console.log(`generation: ${SEEDS} seeds, ${totalDoors} doors checked`);

// ---- 2. determinism: same seed -> identical level; different seed -> different
ok(gen(1234).h===gen(1234).h,'same seed produced different maps');
ok(gen(1).h!==gen(2).h,'different seeds produced identical maps');

// ---- 3. full level generation for every depth (items, monsters, stairs, mini-boss)
const lvl=run(`(function(seed,d){
 seedRng(seed);G={depth:d,rites:false,levels:{},mons:[],items:[]};genLevel(d);
 const fl=(x,y)=>G.map[y]&&G.map[y][x]!==undefined&&G.map[y][x]!==0,err=[];
 for(const i of G.items)if(!fl(i.x,i.y))err.push('item on wall '+i.x+','+i.y);
 const seenPos=new Set();for(const m of G.mons){if(!fl(m.x,m.y))err.push('monster on wall');const k=m.x+','+m.y;if(seenPos.has(k))err.push('stacked monsters at '+k);seenPos.add(k)}
 if(!fl(G.sU.x,G.sU.y))err.push('up stairs on wall');if(d<10&&!fl(G.sD.x,G.sD.y))err.push('down stairs on wall');
 const r0=G.rooms[0],inWaste=G.items.filter(i=>i.x>=r0.x&&i.x<r0.x+r0.w&&i.y>=r0.y&&i.y<r0.y+r0.h);
 if((d-1)%STAGE_LEN===0&&inWaste.some(i=>i.it.type==='part'&&(i.it.taint||!i.it.known)))err.push('waste room graft is tainted/unknown');
 return {err,mons:G.mons.length,ks:G.mons.map(m=>m.k),items:G.items.length,waste:inWaste.length,sDx:G.sD.x}})`);
for(let d=1;d<=MAXD;d++)for(let s=1;s<=40;s++){const r=lvl(s*7919,d);
 for(const e of r.err)ok(false,`depth ${d} seed ${s*7919}: ${e}`);
 ok(r.mons>0,`depth ${d}: no monsters`);ok(r.items>=3,`depth ${d}: too few items`);
 const mini={5:'warden',10:'matron',15:'abomination'}[d];if(mini)ok(r.ks.includes(mini),`depth ${d} seed ${s*7919}: ${mini} missing`);
 if((d-1)%STAGE_LEN===0)ok(r.waste>=2,`depth ${d} seed ${s*7919}: waste room has ${r.waste} items`);
 if(d>=16)ok(r.ks.filter(k=>['guard','rifleman','scientist','medic'].includes(k)).length>0,`depth ${d} seed ${s*7919}: no humans in the human stage`);
 if(d>=16)ok(r.ks.every(k=>['guard','rifleman','scientist','medic','boss','stalker'].includes(k)),`depth ${d} seed ${s*7919}: non-human monster in the human stage`);
 if(d<16)ok(!r.ks.some(k=>['guard','rifleman','scientist','medic'].includes(k)),`depth ${d}: humans appeared early`);
 ok((d<MAXD)===(r.sDx>=0),`depth ${d}: wrong down-stairs presence`);
 ok(d!==MAXD||r.ks.includes('boss'),`depth ${d} seed ${s*7919}: boss missing`)}
console.log(`levels: depths 1-${MAXD} x 40 seeds checked`);

// ---- 4. data consistency: every template/item/monster has art and valid palette characters
const issues=run(`(function(){const e=[];
 for(const t of TPL){if(!REGION[t.kind]||!REGION[t.kind][t.spr])e.push('missing sprite for '+t.id);
  if(!t.st)e.push('no stats '+t.id)}
 for(const s of Object.values(STARTER))if(!REGION[s.kind].def)e.push('missing starter sprite');
 {const a=mkStarter('legs');if(a.decay<=.55)e.push('starter limbs must rot faster than any graft')}
 for(const id in ABIL){if(!TPL.some(t=>t.id===id))e.push('ability for unknown part '+id);const a=ABIL[id];if(!a.n||!(a.cd>0)||typeof a.run!=='function')e.push('malformed ability '+id)}
 for(const kind of ['head','torso','arm','legs'])if(!TPL.some(t=>t.t===5&&t.kind===kind))e.push('the bargain needs a tier-5 '+kind+' graft')
 for(const k in CONS)if(!CONSPR[k])e.push('missing item icon '+k);
 for(const k in MON){if(!S[k])e.push('missing monster sprite '+k);const ps=TPL.filter(t=>t.src===k);if(ps.length<3&&!MON[k].noParts)e.push('monster '+k+' has only '+ps.length+' own parts');if(!ps.some(t=>t.kind==='legs')&&!['boss'].includes(k)&&!MON[k].noParts)e.push('monster '+k+' drops no legs')}
 for(const k in PART_CHANCE)if(!MON[k])e.push('PART_CHANCE for unknown monster '+k);
 for(const k in MON)if(!MON[k].mini&&k!=='boss'&&!(PART_CHANCE[k]>0))e.push('no part chance for '+k);
 const rows=[...Object.values(CONSPR)];for(const r of Object.values(REGION))for(const v of Object.values(r))rows.push(v);
 for(const r of rows)for(const line of r)for(const ch of line)if(ch!=='.'&&!'abcdefghijklmnopqrstuvwxyz'.includes(ch))e.push('odd sprite char '+ch);
 for(const t of TPL){const p=mkPart(10,null,t.id);if(p.id!==t.id)e.push('mkPart forceId failed '+t.id)}
 for(let d=1;d<=20;d++)for(let i=0;i<40;i++){const p=mkPart(d);if(p.dur>p.maxdur||p.dur<=0)e.push('bad durability');if(d<3&&p.taint)e.push('early taint')}
 return e})()`);
for(const i of issues)ok(false,i);
console.log('data: templates, icons, monsters, durability checked');

// ---- 5. click-to-travel must never route through a staircase (taps beside the stairs used to take them)
const stairsRoute=run(`(function(){
 const mk=()=>Array.from({length:H},()=>new Array(W).fill(1));
 G={map:mk(),seen:Array.from({length:H},()=>new Array(W).fill(true)),p:{x:10,y:10},sU:{x:11,y:9},sD:{x:-1,y:-1},mons:[]};
 const around=pathTo(12,10);                 // two tiles right; the shortest BFS route used to cut through the stairs at (11,9)
 const onto=pathTo(11,9);                    // the stairs themselves are still a valid destination
 G.sU={x:11,y:11};const south=pathTo(12,10); // and the same when the stairs sit on the other diagonal
 return {around:around&&around.map(c=>c.join(',')),onto:onto&&onto.map(c=>c.join(',')),south:south&&south.map(c=>c.join(','))}})()`);
ok(stairsRoute.around&&!stairsRoute.around.includes('11,9'),'travel path cut through the up stairs: '+JSON.stringify(stairsRoute.around));
ok(stairsRoute.onto&&stairsRoute.onto[stairsRoute.onto.length-1]==='11,9','cannot travel onto the stairs when asked');
ok(stairsRoute.south&&!stairsRoute.south.includes('11,11'),'travel path cut through stairs on the south diagonal');
console.log('travel: stairs are only entered on purpose');
// ---- 6. graft variety: slots stay level, and the hidden tiers are sane
const variety=run(`(function(){
 seedRng(31337);G={};const kinds={head:0,torso:0,arm:0,legs:0};let prev='',streak=0,maxStreak=0;const N=6000;
 for(let i=0;i<N;i++){const d=1+Math.floor(R()*20),k=mkPart(d).kind;kinds[k]++;streak=k===prev?streak+1:1;prev=k;if(streak>maxStreak)maxStreak=streak}
 const byDepth={};for(const d of [1,4,8,12,16,20]){G={};const c={head:0,torso:0,arm:0,legs:0};for(let i=0;i<1200;i++)c[mkPart(d).kind]++;byDepth[d]=c}
 const hid={1:0,2:0,3:0,4:0,5:0};for(const t of TPL)hid[t.hid]++;
 const kindsWithSpread=['head','torso','arm','legs'].map(k=>new Set(TPL.filter(t=>t.kind===k).map(t=>t.hid)).size);
 return {kinds,maxStreak,byDepth,hid,kindsWithSpread,N}})()`);
for(const k of ['head','torso','arm','legs'])ok(Math.abs(variety.kinds[k]/variety.N-.25)<.02,`graft slot ${k} is ${(variety.kinds[k]/variety.N*100).toFixed(1)}% of drops (want ~25%)`);
ok(variety.maxStreak<=2,`same graft slot ${variety.maxStreak} times in a row`);
for(const d in variety.byDepth)for(const k in variety.byDepth[d])ok(Math.abs(variety.byDepth[d][k]/1200-.25)<.04,`depth ${d}: ${k} is ${(variety.byDepth[d][k]/12).toFixed(1)}% of drops`);
for(const h in variety.hid)ok(variety.hid[h]>0,`hidden tier ${h} has no grafts`);
variety.kindsWithSpread.forEach((n,i)=>ok(n>=3,`slot ${['head','torso','arm','legs'][i]} only spans ${n} hidden tiers`));
console.log('variety: slots even across '+variety.N+' drops, hidden tiers '+JSON.stringify(variety.hid));
console.log(fails?`\n${fails} of ${checks} checks FAILED`:`\nall ${checks} checks passed`);
process.exit(fails?1:0);
