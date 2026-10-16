function playerAct(dx,dy){
 if(G.over||paused||Math.abs(dx)>1||Math.abs(dy)>1)return;const p=G.p;let acted=false,moved=false,waited=false;
 if(dx===0&&dy===0){acted=true;waited=true}
 else{
  if(dx)p.face=dx;const nx=p.x+dx,ny=p.y+dy,m=monAt(nx,ny);
  if(m){attack(m);acted=true}
  else if(walk(nx,ny)){
   if(nx===G.sD.x&&ny===G.sD.y){stopTravel();changeLevel(1);ui();return}
   if(nx===G.sU.x&&ny===G.sU.y){stopTravel();if(G.depth===1){msg('Rubble seals the way up. There is only down.','warn');return}changeLevel(-1);ui();return}
   p.x=nx;p.y=ny;moved=true;acted=true;sfx('step');if(G.map[ny][nx]===2){G.map[ny][nx]=5;sfx('door')}
   // a lone item is grabbed automatically; a pile is left for the player to pick through (see the ground panel)
   const here=G.items.filter(i=>i.x===nx&&i.y===ny);
   if(here.length===1){const e=here[0],it=e.it;if(addInv(it)){G.items.splice(G.items.indexOf(e),1);msg(`You grab: ${it.name}${it.count>1?' x'+it.count:''}.`,'good');sfx('pickup');stopTravel()}else msg('Backpack full.','warn')}
   else if(here.length>1){stopTravel();msg(`${here.length} items lie here. Tap one to pick it up.`,'info')}}}
 if(acted)endTurn(moved,waited)}
const taintCount=k=>SLOTS.reduce((a,s)=>a+(G.p.eq[s]&&G.p.eq[s].taint===k?1:0),0);
function endTurn(moved,waited){
 const p=G.p;G.turn++;decayParts();for(const k of SLOTS){const e=p.eq[k];if(e&&e.cd>0)e.cd--} // graft ability cooldowns
 const s=stat();p.hunger+=.35+taintCount('itch')*.12;if(p.candle>0)p.candle--;
 if(p.hunger>=100){hurt(1);if(G.turn%3===0)msg('Your hunger gnaws at you.','bad')}
 else if(G.turn%10===0&&p.hp<s.hp&&p.hunger<75)p.hp++;
 if(fx('regen')&&p.hunger<75&&G.turn%5===0&&p.hp<s.hp)p.hp++;
 if(taintCount('weep')&&G.turn%8===0){hurt(1);msg('A weeping graft seeps into your wounds. (-1)','bad')}
 if(p.hp>s.hp)p.hp=s.hp;
 computeFOV();tickDots();if(G.over||paused)return;
 let free=false,slowed=false;
 if(moved){
  if(fx('sprint')&&p.rest>=5){free=true;msg('You sprint!','good')}
  else if(p.burst>0){p.burst--;free=true}
  else if(s.spd>0&&R()<s.spd)free=true;
  else if(s.spd<0&&R()<-s.spd)slowed=true;
  p.rest=0}
 else if(waited)p.rest++;else p.rest=0;
 if(free)G.floaters.push({x:p.x,y:p.y,t:'swift',c:'#8c8',l:20});
 else{monstersAct();
  // dragging yourself on stumps or rotten legs lets the dead close in; they only move, so telegraphed blows stay dodgeable
  if(slowed&&p.hp>0&&!G.over){G.floaters.push({x:p.x,y:p.y,t:'drag',c:'#a86',l:20});monstersAct(true);hintOnce('slow')}}
 if(p.hp<=0)die();
 checkHints();ui()}
function tickDots(){for(const m of [...G.mons]){let d=0,col='#c33';
 if(m.bleed>0){m.bleed--;d++}
 if(m.poison>0){m.poison--;d++;col='#9c3'}
 if(m.burn>0){m.burn--;d+=2;col='#f93'}
 if(d){m.hp-=d;G.floaters.push({x:m.x,y:m.y,t:'-'+d,c:col,l:20});if(m.hp<=0){kill(m);if(G.over)return}}}}function strike(m){
 const s=stat(),p=G.p,dmg=rnd(1,3)+s.atk;
 m.hp-=dmg;m.alert=true;G.floaters.push({x:m.x,y:m.y,t:'-'+dmg,c:'#fc6',l:25});blood(m.x,m.y,6+dmg);G.shake=Math.min(8,2+dmg/2);
 for(const k of ['armL','armR']){const a=p.eq[k];if(!a)continue;if(a.stats.atk)wear(k,a.fx==='brittle'?2:.35);
  if(a&&a.fx==='rend'&&R()<.25){m.bleed=4;G.floaters.push({x:m.x,y:m.y,t:'bleed',c:'#c33',l:20})}
  if(a&&a.fx==='crush'&&R()<.2){m.stun=1;G.floaters.push({x:m.x,y:m.y,t:'stun',c:'#fe6',l:20})}}
 if(s.steal&&G.turn%3===0&&p.hp<s.hp)p.hp=Math.min(s.hp,p.hp+Math.min(1,s.steal));
 return dmg}
function attack(m){
 const p=G.p;if(m.x!==p.x)p.face=Math.sign(m.x-p.x)||p.face;
 if(R()<.1){msg(`You miss the ${m.n}.`);sfx('miss');return}
 sfx('hit');
 lunge(p,m.x,m.y);G.attackFX.push({x:p.x,y:p.y,tx:m.x,ty:m.y,life:16,max:16,ranged:false,player:true});const d=strike(m);if(m.hp>0)msg(`You maul the ${m.n} for ${d}.`);
 const pk=fx('peck');if(m.hp>0&&pk&&R()<.15*pk){msg('Quick peck! You strike again.','good');strike(m)}
 if(fx('sweep')){const o=G.mons.find(o=>o!==m&&o.hp>0&&Math.max(Math.abs(o.x-p.x),Math.abs(o.y-p.y))<=1);
  if(o){const h=Math.max(1,Math.ceil(d/2));o.hp-=h;o.alert=true;G.floaters.push({x:o.x,y:o.y,t:'-'+h,c:'#fc6',l:25});blood(o.x,o.y,5);if(o.hp<=0)kill(o)}}
 if(m.hp<=0&&!m.dead)kill(m)}
function decayParts(){for(const k of SLOTS){const e=G.p.eq[k];if(e)wear(k,(e.decay||.18)*(e.taint==='rot'?1.8:1))}
 for(const it of G.p.inv)if(it.type==='part')it.dur=Math.max(0,it.dur-(it.decay||.18)*.25);
 G.p.hp=Math.min(G.p.hp,stat().hp)}
function wear(k,n){const e=G.p.eq[k];if(!e)return;e.dur-=n;if(e.dur<=0)sfx('detach');
 if(e.dur<=Math.floor(e.maxdur*.2)&&e.dur+n>Math.floor(e.maxdur*.2)&&e.dur>0)msg(`Your ${e.name} is about to fall off!`,'warn');
 if(e.dur<=0){msg(`Your ${e.name} rots away and falls off!`,'bad');G.p.eq[k]=null;G.floaters.push({x:G.p.x,y:G.p.y,t:'DETACHED',c:'#e55',l:30});blood(G.p.x,G.p.y,14,'#6a8a3a')}}
function kill(m){
 if(m.dead)return;m.dead=true;sfx('kill');
 G.dying.push({k:m.k,x:m.x,y:m.y,rx:m.rx===undefined?m.x:m.rx,ry:m.ry===undefined?m.y:m.ry,fx:m.fx,t0:NOW});
 const p=G.p;G.mons=G.mons.filter(x=>x!==m);p.kills++;blood(m.x,m.y,18,m.k==='bloat'?'#78a02a':'#8a1010',2.4);G.decor[m.y][m.x]=1;
 p.hunger=Math.max(0,p.hunger-m.food);const heal=1+fx('infest');p.hp=Math.min(stat().hp,p.hp+heal);
 msg(`You devour the ${m.n}. (+${heal} HP, hunger eased)`,'good');
 if(m.burst){for(let i=0;i<20;i++)blood(m.x,m.y,1,'#9ad030',3);if(Math.max(Math.abs(m.x-p.x),Math.abs(m.y-p.y))<=1){hurt(3);msg('The Gore Bloat bursts in acid! (-3)','bad')}}
 p.xp+=m.xp;while(p.xp>=p.lvl*10){p.xp-=p.lvl*10;p.lvl++;msg(`Your corruption deepens. Level ${p.lvl}! (+3 max HP)`,'info');sfx('level')}
 // two independent drops: one of the monster's own body parts (guaranteed from bosses), and the usual supplies
 if(m.mini||m.k==='boss'||R()<(PART_CHANCE[m.k]||0)){
  const it=mkMonsterPart(m,m.k==='boss'?MAX_DEPTH:m.mini?G.depth+2:G.depth);
  G.items.push({x:m.x,y:m.y,it});msg(`The ${m.n} leaves a body part: ${it.name}.`,'good')}
 if(!m.mini&&m.k!=='boss'&&(G.dropCounts[G.depth]||0)<3&&R()<m.drop){
  G.dropCounts[G.depth]=(G.dropCounts[G.depth]||0)+1;const it=mkLoot(G.depth,m.k,0);
  G.items.push({x:m.x,y:m.y,it});msg(`It left something: ${it.name}.`,'info')}
 if(m.k==='boss')win()}
function hurt(n){const p=G.p;if(G.god)return;p.hp-=n;sfx('hurt');if(settings.haptics&&navigator.vibrate)try{navigator.vibrate(Math.min(70,20+n*6))}catch(e){}G.floaters.push({x:p.x,y:p.y,t:'-'+n,c:'#f44',l:25});blood(p.x,p.y,8,'#6a8a3a');G.shake=Math.min(10,3+n/2);stopTravel()}
function monstersAct(moveOnly){
 const p=G.p,s=stat();
 const D=Array.from({length:H},()=>new Array(W).fill(999));D[p.y][p.x]=0;const q=[[p.x,p.y]];
 for(let i=0;i<q.length;i++){const [x,y]=q[i];if(D[y][x]>=24)continue;
  for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const nx=x+dx,ny=y+dy;if(!walk(nx,ny)||D[ny][nx]!==999)continue;D[ny][nx]=D[y][x]+1;q.push([nx,ny])}}
 for(const m of [...G.mons]){
  if(m.dead)continue;
  if(m.stun>0){m.stun--;m.warning=null;continue}
  if(m.slow>0){m.slow--;if(G.turn%2===0){G.floaters.push({x:m.x,y:m.y,t:'slow',c:'#8ab',l:16});continue}}
  if(moveOnly&&m.warning)continue; // extra move-only pass never resolves a telegraphed attack early
 if(m.warning){const w=m.warning;m.warning=null;
  if(p.x===w.x&&p.y===w.y&&los(m.x,m.y,p.x,p.y)&&Math.max(Math.abs(p.x-m.x),Math.abs(p.y-m.y))<=(w.ranged?m.rng||6:1)){
   if(w.ranged){const rk={rifleman:["bullet","#ffd070"],scientist:["lob","#9ad030"],acolyte:["bolt","#c060ff"],cultist:["bolt","#ffd040"]}[m.k]||["bolt","#ff7040"];addFX(rk[0],{org:m,tgt:p,col:rk[1],life:rk[0]==="bullet"?14:rk[0]==="lob"?24:18})}else G.attackFX.push({x:m.x,y:m.y,tx:w.x,ty:w.y,life:18,max:18,ranged:false});mattack(m,s,w.ranged);
  }else msg(`The ${m.n}'s attack strikes empty stone.`,'info');
  continue;
 }
  m.en+=m.spd;
  while(m.en>=1&&G.p.hp>0&&!m.dead){m.en-=1;
   const sees=G.vis[m.y][m.x];if(sees&&!m.alert){m.alert=true;stopTravel()}
   const cd=Math.max(Math.abs(m.x-p.x),Math.abs(m.y-p.y));
   if(!m.alert){if(R()<.25){const dx=rnd(-1,1),dy=rnd(-1,1);if(walk(m.x+dx,m.y+dy)&&G.map[m.y+dy][m.x+dx]!==2&&!monAt(m.x+dx,m.y+dy)&&!(m.x+dx===p.x&&m.y+dy===p.y)){m.x+=dx;m.y+=dy;if(dx)m.fx=dx}}continue}
   if(m.erratic&&cd>1&&R()<m.erratic){const dx=rnd(-1,1),dy=rnd(-1,1);if(walk(m.x+dx,m.y+dy)&&!monAt(m.x+dx,m.y+dy)&&!(m.x+dx===p.x&&m.y+dy===p.y)){m.x+=dx;m.y+=dy;if(dx)m.fx=dx}continue}
   if(cd<=1){m.fx=Math.sign(p.x-m.x)||m.fx;if(!moveOnly)warnAttack(m,false);break}
   if(m.rng&&sees&&cd<=m.rng&&los(m.x,m.y,p.x,p.y)){if(!moveOnly)warnAttack(m,true);break}
   let best=null,bd=D[m.y][m.x];
   for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){if(!dx&&!dy)continue;const nx=m.x+dx,ny=m.y+dy;
    if(!walk(nx,ny)||monAt(nx,ny)||(nx===p.x&&ny===p.y))continue;
    if(D[ny][nx]<bd){bd=D[ny][nx];best=[nx,ny]}}
   if(best){if(G.map[best[1]][best[0]]===2)G.map[best[1]][best[0]]=5;if(best[0]!==m.x)m.fx=Math.sign(best[0]-m.x);m.x=best[0];m.y=best[1]}}}}
function warnAttack(m,ranged){m.warning={x:G.p.x,y:G.p.y,ranged};stopTravel();sfx('warn');hintOnce('warning');msg(`The ${m.n} prepares ${ranged?'a hex':'a heavy blow'}! Move off the red tile.`,'warn')}
function mattack(m,s,ranged){
 const p=G.p;
 if(!ranged)lunge(m,p.x,p.y);
 if(R()<.15){msg(`The ${m.n} misses you.`);return}
 const dg=fx('dodge');if(dg&&R()<.1*dg){msg(`You sway aside from the ${m.n}.`,'good');return}
 const roll=rnd(m.a[0],m.a[1])+Math.floor(G.depth/4);let d=Math.max(1,Math.ceil(roll*.25),roll-s.def);
 if(fx('ward')&&!G.ward[G.depth]){G.ward[G.depth]=true;d=Math.max(1,Math.ceil(d/2));msg('Your bone ward absorbs half the blow.','info')}
 hurt(d);msg(`${ranged?'A hex from the':'The'} ${m.n} ${ranged?'sears':'rips'} you for ${d}.`,'bad');
 if(ranged)for(let i=0;i<8;i++)G.parts.push({x:m.x*T+16,y:m.y*T+16,vx:(p.x-m.x)*2+R()-.5,vy:(p.y-m.y)*2+R()-.5,l:14,c:'#ffd040',s:2});
 const th=fx('thorns');if(!ranged&&th){m.hp-=th;G.floaters.push({x:m.x,y:m.y,t:'-'+th,c:'#9c3',l:20});if(m.hp<=0)kill(m)}
 if(d>=8&&p.eq.torso&&p.eq.torso.fx==='gas'){msg('Your Bloat Belly bursts!','warn');p.eq.torso=null;for(const o of [...G.mons])if(Math.max(Math.abs(o.x-p.x),Math.abs(o.y-p.y))<=1){o.hp-=4;G.floaters.push({x:o.x,y:o.y,t:'-4',c:'#9c3',l:25});if(o.hp<=0)kill(o)}blood(p.x,p.y,24,'#9ad030',3)}
 const c=['head','torso','legs'].filter(k=>p.eq[k]);if(c.length&&R()<.5)wear(pick(c),.25)}
function die(){const p=G.p,ri=p.inv.findIndex(i=>i.id==='rites');
 if(ri>=0){p.inv.splice(ri,1);selItem=null;p.hp=Math.ceil(stat().hp/2);msg('The Last Rites drag you back from the dark!','good');blood(p.x,p.y,30,'#d8a830',3);ui();return}
 G.over=true;sfx('death');ui();showOver('YOU ARE UNDEAD ... NO MORE',`Slain in ${G.reg.n}, depth ${G.depth}.<br>Level ${p.lvl} · ${p.kills} kills · ${G.turn} turns.`)}
function win(){sfx('win');G.over=true;showOver('THE HUNGER ENDS',`You devoured The Surgeon.<br>Level ${G.p.lvl} · ${G.p.kills} kills · ${G.turn} turns.`)}
function showOver(t,b){document.getElementById('ot').textContent=t;document.getElementById('ob').innerHTML=b;document.getElementById('over').style.display='flex'}
function stopTravel(){travel=null;clearTimeout(travelTimer);stopRest()}
// Rest: wait repeatedly until healed, interrupted by an enemy in view, damage, hunger, or 150 turns.
let resting=false,restTimer=null,restLeft=0;
function stopRest(){resting=false;clearTimeout(restTimer)}
const enemyInView=()=>G.mons.some(m=>G.vis[m.y][m.x]&&(m.alert||Math.max(Math.abs(m.x-G.p.x),Math.abs(m.y-G.p.y))<=5));
function startRest(){
 if(G.over||paused)return;const p=G.p;
 if(enemyInView()){msg('You cannot rest with enemies in view.','warn');return}
 if(p.hp>=stat().hp){msg('You are as whole as the dead get.','info');return}
 if(p.hunger>=75&&!fx('regen')){msg('Too hungry to heal by resting. Eat something.','warn');return}
 resting=true;restLeft=150;restStep()}
function restStep(){
 if(!resting)return;const p=G.p,hp0=p.hp;
 if(G.over||paused||enemyInView()||p.hp>=stat().hp||restLeft--<=0||p.hunger>=75&&!fx('regen')){stopRest();return}
 playerAct(0,0);if(p.hp<hp0||G.over){stopRest();return}
 restTimer=setTimeout(restStep,70)}
// Scent: spend a turn to sense the layout nearby and mark where enemies lurk (even in the dark).
function scentAct(){
 if(G.over||paused)return;stopTravel();
 scentEffects();sfx('use');endTurn(false,true)}
function scentEffects(){const p=G.p;
 for(let y=Math.max(0,p.y-8);y<=Math.min(H-1,p.y+8);y++)for(let x=Math.max(0,p.x-8);x<=Math.min(W-1,p.x+8);x++)if((x-p.x)**2+(y-p.y)**2<=64)G.seen[y][x]=true;
 let n=0;for(const m of G.mons)if(Math.max(Math.abs(m.x-p.x),Math.abs(m.y-p.y))<=10){n++;G.floaters.push({x:m.x,y:m.y,t:'!',c:'#e55',l:70})}
addFX('sonar',{org:G.p,col:'#e55',r:T*8,life:36});
 msg(n?`You sniff the air. ${n} presence${n>1?'s':''} nearby.`:'You sniff the air. Nothing stirs nearby.','info')}
function pathTo(tx,ty){
 const p=G.p,prev=new Map(),key=(x,y)=>y*W+x,q=[[p.x,p.y]];prev.set(key(p.x,p.y),null);
 for(let i=0;i<q.length;i++){const [x,y]=q[i];if(x===tx&&y===ty)break;
  for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const nx=x+dx,ny=y+dy;if((!dx&&!dy)||!walk(nx,ny)||!G.seen[ny][nx]||prev.has(key(nx,ny)))continue;prev.set(key(nx,ny),[x,y]);q.push([nx,ny])}}
 if(!prev.has(key(tx,ty)))return null;const path=[];let c=[tx,ty];while(c&&!(c[0]===p.x&&c[1]===p.y)){path.unshift(c);c=prev.get(key(c[0],c[1]))}return path}
// Travel only stops for real threats: a monster that newly comes into view, or a hunting one within 6 tiles.
// Sleepers you already know about no longer block clicking to move, and the first step always happens.
let travelSeen=new Set();
function startTravel(tx,ty){const path=pathTo(tx,ty);if(!path||!path.length)return;travel=path;travelSeen=new Set(G.mons.filter(m=>G.vis[m.y][m.x]));stepTravel(true)}
function stepTravel(first){
 if(!travel||!travel.length||G.over||paused){stopTravel();return}
 if(first!==true){const p=G.p,threat=G.mons.find(m=>G.vis[m.y][m.x]&&(!travelSeen.has(m)||(m.alert&&Math.max(Math.abs(m.x-p.x),Math.abs(m.y-p.y))<=6)));
  if(threat){stopTravel();msg(`The ${threat.n} ${travelSeen.has(threat)?'closes in':'comes into view'}.`,'warn');return}}
 const n=travel.shift(),p=G.p;playerAct(n[0]-p.x,n[1]-p.y);
 if(travel)travelTimer=setTimeout(stepTravel,MOVE_MS)}
