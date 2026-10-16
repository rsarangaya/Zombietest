function cloneCanvas(c){const n=document.createElement('canvas');n.width=n.height=32;n.getContext('2d').drawImage(c,0,0);return n}
function describe(it){
 if(it.type==='cons')return `<b>${it.name}</b>${it.count>1?' x'+it.count:''}<br>${CONS[it.id].desc}`;
 const st=it.stats,b=[];if(st.atk)b.push(`+${st.atk} ATK`);if(st.def)b.push(`+${st.def} DEF`);if(st.hp)b.push(`+${st.hp} max HP`);if(st.sight)b.push(`+${st.sight} sight`);if(st.steal)b.push(`life-steal ${st.steal}`);if(st.spd)b.push(`+${Math.round(st.spd*100)}% speed (shrinks as it rots)`);
 const ab=ABIL[it.id],abl=ab?`<br><span class="info">Active: <b>${ab.n}</b> (cooldown ${ab.cd}). ${ab.desc}${it.cd>0?' Recharging: '+it.cd+'.':''}</span>`:'';
 const tn=!it.known?'<br><span class="warn">Unexamined: may be tainted.</span>':it.taint?`<br><span class="bad">Tainted (${TAINT[it.taint].n}): ${TAINT[it.taint].d}.</span>`:'';
 return `<b>${it.name}</b> (${KINDNAME[it.kind]})<br>${b.join(', ')||'Just meat.'}${it.fxd?'<br>'+it.fxd:''}${abl}${tn}<br>Rot ${Math.ceil(it.dur)}/${it.maxdur} · Decay ${(it.decay||.18).toFixed(2)}/turn`}
function ui(){
 const p=G.p,s=stat(),set=(id,v,max,txt)=>{const e=document.getElementById(id);e.firstChild.style.width=Math.max(0,Math.min(100,v/max*100))+'%';e.lastChild.textContent=txt};
 set('hp',p.hp,s.hp,`HP ${Math.max(0,p.hp)}/${s.hp}`);set('hu',p.hunger,100,`Hunger ${Math.min(100,Math.floor(p.hunger))}%`);set('xp',p.xp,p.lvl*10,`Lv ${p.lvl}  ATK+${s.atk} DEF+${s.def} SPD${s.spd>=0?'+':''}${Math.round(s.spd*100)}%`);
 document.getElementById('where').textContent=`Stage ${G.regIdx+1} · ${G.reg.n} · Depth ${G.depth}/${MAX_DEPTH}`;
 const sl=document.getElementById('slots');sl.innerHTML='';
 for(const k of SLOTS){const e=p.eq[k],d=document.createElement('div');d.className='slot'+(selItem&&selItem.eq===k?' sel':'');
  d.appendChild(cloneCanvas(e?itIcon(e):ghostIcon(k)));if(!e)d.firstChild.style.opacity=.35;
  d.insertAdjacentHTML('beforeend',`<small>${SLOTNAME[k]}</small><span class="nm">${e?(e.known&&e.taint?'☣ ':'')+(ABIL[e.id]&&!e.cd?'⚡ ':'')+e.name:'— stump —'}</span>`);
  if(e)d.insertAdjacentHTML('beforeend',`<div class="dur"><i style="width:${e.dur/e.maxdur*100}%"></i></div>`);
  d.onclick=()=>{selItem=e?{eq:k,it:e}:null;ui()};sl.appendChild(d)}
 const iv=document.getElementById('inv');iv.innerHTML='';
 p.inv.forEach((it,idx)=>{const d=document.createElement('div');d.className='inv'+(selItem&&selItem.it===it&&selItem.idx===idx?' sel':'');d.appendChild(cloneCanvas(itIcon(it)));d.title=it.name;
  if(it.count>1)d.insertAdjacentHTML('beforeend',`<b>${it.count}</b>`);
  d.onclick=()=>{selItem={idx,it};ui()};iv.appendChild(d)});
 // ground panel: every item on the player's tile, each picked up individually
 const here=G.items.filter(i=>i.x===p.x&&i.y===p.y),gv=document.getElementById('floor');
 if(selItem&&selItem.ground&&!here.includes(selItem.ground))selItem=null;
 if(selItem&&selItem.mon&&(selItem.mon.dead||!G.mons.includes(selItem.mon)||!G.vis[selItem.mon.y][selItem.mon.x]))selItem=null;
 gv.innerHTML='';gv.style.display=document.getElementById('floorH').style.display=here.length?'':'none';
 here.forEach(e=>{const d=document.createElement('div');d.className='inv'+(selItem&&selItem.ground===e?' sel':'');d.appendChild(cloneCanvas(itIcon(e.it)));d.title=e.it.name;
  if(e.it.count>1)d.insertAdjacentHTML('beforeend',`<b>${e.it.count}</b>`);
  d.onclick=()=>{selItem={ground:e,it:e.it};ui()};gv.appendChild(d)});
 document.getElementById('packH').textContent=`BACKPACK (${p.inv.length}/${MAXINV})`;
 detail();renderQuick();renderInspect()}
// ---------- HUD: backpack window, action bar, quick buttons, inspect card ----------
const packEl=()=>document.getElementById('pack');
const packIsOpen=()=>packEl().style.display==='flex';
function openPack(){if(G.over)return;stopTravel();if(selItem&&selItem.mon)selItem=null;packEl().style.display='flex';ui()}
function closePack(){packEl().style.display='none'}
function compareLine(it){ // how a graft in the pack/on the ground stacks up against what's attached to its slot
 if(it.type!=='part')return '';const p=G.p;let slot=it.kind;
 if(it.kind==='arm')slot=!p.eq.armL?'armL':!p.eq.armR?'armR':(p.eq.armL.dur<=p.eq.armR.dur?'armL':'armR');
 const cur=p.eq[slot],d=[];
 for(const k of ['atk','def','hp','sight','steal','spd']){const a=it.stats[k]||0,b=cur?(cur.stats[k]||0):0;if(a!==b){const v=k==='spd'?Math.round((a-b)*100)+'%':a-b;d.push(`<span class="${a>b?'good':'bad'}">${k.toUpperCase()} ${a>b?'+':''}${v}</span>`)}}
 return `<br><small>${cur?'vs '+cur.name:'Slot empty'}: ${d.join(', ')||'no stat change'}</small>`}
// consumables worth a one-tap button, in priority order
const QUICK_ORDER=['flask','scrap','meat','shards','pyre','grease','jar','brine','candle','serum'];
let hudActions=[]; // {run, label} for Shift+1..9
function quickBtn(html,title,cls,onclick){const b=document.createElement('button');b.className='tbtn '+cls;b.innerHTML=html;b.title=title;b.onclick=onclick;return b}
function renderQuick(){
 const q=document.getElementById('quick'),p=G.p;q.innerHTML='';hudActions=[];
 // 1) ready/recharging active abilities of attached grafts
 for(const k of SLOTS){const e=p.eq[k],ab=e&&ABIL[e.id];if(!ab)continue;
  const b=quickBtn('',`${ab.n}: ${ab.desc}`,e.cd>0?'':'ready',()=>useAbility(k));
  b.appendChild(cloneCanvas(itIcon(e)));b.insertAdjacentHTML('beforeend',`<small>${ab.n}</small>`);if(e.cd>0)b.insertAdjacentHTML('beforeend',`<span class="cd">${e.cd}</span>`);
  q.appendChild(b);hudActions.push(()=>useAbility(k))}
 // 2) up to three consumables
 let n=0;for(const id of QUICK_ORDER){if(n>=3)break;const it=p.inv.find(i=>i.id===id);if(!it)continue;n++;
  const act=()=>{if(paused||G.over)return;selItem={idx:p.inv.indexOf(it),it};useCons()};
  const b=quickBtn('',`${CONS[id].n}: ${CONS[id].desc}`,'',act);b.appendChild(cloneCanvas(itIcon(it)));
  b.insertAdjacentHTML('beforeend',`<small>${CONS[id].throw?'Throw':'Use'}</small>${it.count>1?`<span class="cnt">${it.count}</span>`:''}`);q.appendChild(b);hudActions.push(act)}
 // contextual buttons
 const here=G.items.filter(i=>i.x===p.x&&i.y===p.y),bg=document.getElementById('bGround');
 bg.style.display=here.length?'':'none';bg.querySelector('small').textContent=here.length>1?`Ground ${here.length}`:'Ground';
 const seen=s=>s.x>=0&&G.seen[s.y]&&G.seen[s.y][s.x];
 document.getElementById('bDown').style.display=seen(G.sD)?'':'none';
 document.getElementById('bUp').style.display=seen(G.sU)&&G.depth>1?'':'none'}
function renderInspect(){
 const el=document.getElementById('inspect');
 if(selItem&&selItem.mon&&!packIsOpen()){el.innerHTML=`<button class="x" onclick="selItem=null;ui()">✕</button>`+describeMon(selItem.mon);el.style.display='block'}
 else el.style.display='none'}function describeMon(m){
 const bonus=Math.floor(G.depth/4),tr=[];
 if(m.rng)tr.push(`ranged hex (range ${m.rng})`);if(m.burst)tr.push('bursts in acid when killed');if(m.erratic)tr.push('flits erratically');
 if(m.spd>1)tr.push('fast');else if(m.spd<1)tr.push('slow');if(m.mini||m.k==='boss')tr.push(m.k==='boss'?'final boss':'mini-boss');
 const st=[m.bleed>0&&`bleeding ${m.bleed}`,m.poison>0&&`poisoned ${m.poison}`,m.burn>0&&`burning ${m.burn}`,m.slow>0&&`slowed ${m.slow}`,m.stun>0&&'stunned'].filter(Boolean);
 return `<b>${m.n}</b> · HP ${m.hp}/${m.max}<br>Hits for ${m.a[0]+bonus}-${m.a[1]+bonus} (before your defense)<br>${tr.join(', ')||'No special traits.'}${st.length?'<br>Status: '+st.join(', '):''}<br>${m.alert?'Hunting you.':'Asleep or unaware.'}`}
function pickUp(){const s=selItem;if(!s||!s.ground||paused||G.over)return;const e=s.ground,i=G.items.indexOf(e);if(i<0)return;
 if(!addInv(e.it)){msg('Backpack full.','warn');return}
 G.items.splice(i,1);msg(`You grab: ${e.it.name}${e.it.count>1?' x'+e.it.count:''}.`,'good');sfx('pickup');selItem=null;ui()}
function detail(){const el=document.getElementById('detail');
 if(!selItem||!selItem.it){el.innerHTML='Tap an item to inspect it.';return}
 const it=selItem.it;let b='';
 if(selItem.ground)b=`<button onclick="pickUp()">Pick up</button>`;
 else if(selItem.eq){const ab=ABIL[it.id];
  b=`<button onclick="detach('${selItem.eq}')">Detach</button><button onclick="devourEq('${selItem.eq}')">Devour</button>`
   +(ab?`<button onclick="useAbility('${selItem.eq}')"${it.cd>0?' disabled':''}>${ab.n}${it.cd>0?' ('+it.cd+')':''}</button>`:'')}
 else if(it.type==='cons'){if(it.id!=='rites')b+=`<button onclick="useCons()">${CONS[it.id].throw?'Throw':'Use'}</button>`;b+=`<button onclick="dropIt()">Drop</button>`}
 else b=`<button onclick="equip()">Attach</button><button onclick="devour()">Devour</button><button onclick="dropIt()">Drop</button>`;
 el.innerHTML=describe(it)+(selItem.eq?'':compareLine(it))+'<br>'+b}
function equip(){if(paused||G.over)return;const p=G.p,it=selItem.it;if(it.dur<=0){msg('This graft has decomposed.','warn');return}let slot=it.kind;
 if(it.kind==='arm')slot=!p.eq.armL?'armL':!p.eq.armR?'armR':(p.eq.armL.dur<=p.eq.armR.dur?'armL':'armR');
 p.inv.splice(selItem.idx,1);const old=p.eq[slot];p.eq[slot]=it;it.slot=slot;
 if(old)p.inv.push(old);msg(`You stitch on ${it.name}.`,'info');sfx('equip');
 if(ABIL[it.id])hintOnce('ability');
 if(!it.known){it.known=true;if(it.taint){msg(`It writhes! The graft is TAINTED (${TAINT[it.taint].n}): ${TAINT[it.taint].d}.`,'bad');sfx('taint')}}
 selItem=null;afterManage()}
function detach(k){const p=G.p,e=p.eq[k];if(!e)return;if(p.inv.length>=MAXINV){msg('Backpack full.','warn');return}p.eq[k]=null;p.inv.push(e);msg(`You tear off your ${e.name}.`);selItem=null;afterManage()}
function devour(){const p=G.p,it=selItem.it;p.inv.splice(selItem.idx,1);feed(it);selItem=null;afterManage()}
function devourEq(k){const p=G.p,it=p.eq[k];p.eq[k]=null;feed(it);selItem=null;afterManage()}
function feed(it){const p=G.p;p.hunger=Math.max(0,p.hunger-18);p.hp=Math.min(stat().hp,p.hp+4);msg(`You gnaw on ${it.name}. Tastes awful. (+4 HP)`,'good');sfx('eat');
 if(it.taint){hurt(2);msg(`The ${TAINT[it.taint].n.toLowerCase()} taint turns your stomach. (-2)`,'bad')}}
function dropIt(){const p=G.p,it=selItem.it; // dropped items stack on the tile with whatever is already there
 p.inv.splice(selItem.idx,1);G.items.push({x:p.x,y:p.y,it});msg(`You drop ${it.name}.`);selItem=null;afterManage()}
function afterManage(){const s=stat();if(G.p.hp>s.hp)G.p.hp=s.hp;if(G.p.hp<=0){die();return}computeFOV();ui()}
function consume(it){it.count--;if(it.count<=0){const i=G.p.inv.indexOf(it);if(i>=0)G.p.inv.splice(i,1)}}
function nearestTarget(){const p=G.p;let best=null,bd=99;for(const m of G.mons){if(!G.vis[m.y][m.x])continue;const d=Math.max(Math.abs(m.x-p.x),Math.abs(m.y-p.y));if(d<=5&&d<bd&&los(p.x,p.y,m.x,m.y)){bd=d;best=m}}return best}
function useCons(){if(paused||G.over)return;stopTravel();
 const it=selItem.it,p=G.p,s=stat(),id=it.id;
 if(CONS[id].throw){const t=nearestTarget();if(!t){msg('No target in range.','warn');return}
  consume(it);sfx('throw');
  addFX('lob',{org:p,tgt:t,col:id==='shards'?'#ddd8c0':id==='pyre'?'#f93':id==='grease'?'#6a6a98':'#9ad030',life:20,big:id!=='shards',splash:id==='shards'?4:14});
  if(id==='shards'){const d=rnd(2,4);t.hp-=d;t.alert=true;G.floaters.push({x:t.x,y:t.y,t:'-'+d,c:'#fc6',l:25});blood(t.x,t.y,6);msg(`A bone shard hits the ${t.n} for ${d}.`);if(t.hp<=0)kill(t)}
  else if(id==='pyre'){msg(`The Pyre Flask bursts over the ${t.n}!`,'warn');t.hp-=3;t.burn=4;t.alert=true;G.floaters.push({x:t.x,y:t.y,t:'-3',c:'#f93',l:25});blood(t.x,t.y,10,'#f93',2);if(t.hp<=0)kill(t)}
  else if(id==='grease'){msg('Grave Tar splashes out and clings!','warn');for(const o of [...G.mons])if(Math.max(Math.abs(o.x-t.x),Math.abs(o.y-t.y))<=1){o.slow=6;o.alert=true;G.floaters.push({x:o.x,y:o.y,t:'slow',c:'#8ab',l:25});blood(o.x,o.y,8,'#5a5a78',1.5)}}
  else{msg('The Putrid Jar shatters in a green cloud!','warn');for(const o of [...G.mons])if(Math.max(Math.abs(o.x-t.x),Math.abs(o.y-t.y))<=1){o.hp-=4;o.poison=5;o.alert=true;G.floaters.push({x:o.x,y:o.y,t:'-4',c:'#9c3',l:25});blood(o.x,o.y,10,'#9ad030',2);if(o.hp<=0)kill(o)}}
 }else{
  sfx(id==='flask'||id==='serum'||id==='brine'?'drink':id==='rite'?'rite':'use');
  if(id==='flask'){const h=10+2*G.depth;p.hp=Math.min(s.hp,p.hp+h);msg(`You gulp the flask. +${h} HP.`,'good')}
  else if(id==='scrap'){p.hunger=Math.max(0,p.hunger-20);p.hp=Math.min(s.hp,p.hp+2);msg('You tear into the raw scrap.','good')}
  else if(id==='meat'){p.hunger=Math.max(0,p.hunger-35);if(R()<.25){hurt(3);msg('The tainted meat turns your stomach. -3 HP.','bad')}else msg('You choke down the tainted meat.','good')}
  else if(id==='serum'){p.bonusHp+=3;p.hp+=3;msg('Graft Serum burns through you. +3 max HP permanently.','info')}
  else if(id==='brine'){let w=null,wr=2;for(const k of SLOTS){const e=p.eq[k];if(e&&e.dur/e.maxdur<wr){wr=e.dur/e.maxdur;w=e}}
   if(!w){msg('You have nothing attached to preserve.','warn');return}w.dur=Math.min(w.maxdur,w.dur+Math.ceil((w.maxdur-w.dur)/2));msg(`The brine firms up your ${w.name}.`,'good');
   if(w.taint){w.taint='';msg('The taint dissolves in the brine.','good')}}
  else if(id==='candle'){p.candle=60;msg('A pale flame steadies your sight.','info')}
  else if(id==='map'){for(let y=0;y<H;y++)for(let x=0;x<W;x++)G.seen[y][x]=true;msg('The map etches the floor into your memory.','info')}
  else if(id==='rite'){const rs=G.rooms.slice(1);for(let i=0;i<40;i++){const r=pick(rs),x=rnd(r.x,r.x+r.w-1),y=rnd(r.y,r.y+r.h-1);if(G.map[y][x]===1&&!monAt(x,y)&&!(x===G.sD.x&&y===G.sD.y)&&!(x===G.sU.x&&y===G.sU.y)){p.x=x;p.y=y;p.rx=x;p.ry=y;break}}msg('The rite tears you through the dark.','info')}
  consume(it)}
 selItem=null;closePack();computeFOV();endTurn(false,false)}
// Messages float over the map like in Shattered Pixel Dungeon and fade after a few seconds; the 📜 button opens the full history.
const LOG_SHOW=4,LOG_MS=7000;
function renderLog(){const now=performance.now(),el=document.getElementById('log');
 el.innerHTML=G.log.slice(0,LOG_SHOW).filter(l=>now-l.t0<LOG_MS).reverse().map(l=>`<div class="${l.c}">${l.t}</div>`).join('');
 if(document.getElementById('logModal').style.display==='flex')renderLogFull()}
setInterval(()=>{if(G&&G.log&&G.log.length&&G.log[0])renderLog()},700);function renderLogFull(){const h=document.getElementById('logFull');h.innerHTML=G.log.map(l=>`<div class="${l.c}"><small>T${l.turn}</small> ${l.t}</div>`).join('')}
function openLog(){document.getElementById('logModal').style.display='flex';renderLogFull()}
