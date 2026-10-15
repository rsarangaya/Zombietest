// Active graft abilities. Select an attached part on your body, then press its ability button.
// Each ability takes a turn and then recharges for `cd` turns. Abilities act on adjacent enemies or the nearest visible one,
// so no targeting step is needed. run() returns false (and spends nothing) when there is nothing to act on.
const adjacentEnemies=()=>{const p=G.p;return G.mons.filter(m=>!m.dead&&Math.max(Math.abs(m.x-p.x),Math.abs(m.y-p.y))<=1)};
const finish=m=>{if(m.hp<=0&&!m.dead)kill(m)};
const needAdj=()=>{const a=adjacentEnemies();if(!a.length)msg('No enemy is adjacent.','warn');return a};
const ABIL={
 a_scythe:{n:'Whirl',cd:8,desc:'Strike every adjacent enemy.',run:()=>{const a=needAdj();if(!a.length)return false;
  lunge(G.p,a[0].x,a[0].y);for(const m of a){strike(m);finish(m)}msg(`You whirl the scythe through ${a.length} enem${a.length>1?'ies':'y'}.`,'good')}},
 a_gfist:{n:'Ground Slam',cd:12,desc:'Stun every adjacent enemy for a turn and hit them for 2.',run:()=>{const a=needAdj();if(!a.length)return false;
  G.shake=8;for(const m of a){m.hp-=2;m.stun=1;m.alert=true;G.floaters.push({x:m.x,y:m.y,t:'stun',c:'#fe6',l:25});blood(m.x,m.y,8);finish(m)}msg('The ground buckles under your fist.','good')}},
 a_saw:{n:'Butcher',cd:10,desc:'Triple-damage strike on one adjacent enemy. Costs 6 rot.',run:(e,k)=>{const a=needAdj();if(!a.length)return false;
  const m=a[0];lunge(G.p,m.x,m.y);const d=strike(m);m.hp-=d*2;G.floaters.push({x:m.x,y:m.y,t:'-'+d*3,c:'#fc6',l:30});wear(k,6);msg(`The bonesaw butchers the ${m.n} for ${d*3}.`,'good');finish(m)}},
 a_hook:{n:'Rend Open',cd:8,desc:'Every adjacent enemy bleeds for 5 turns.',run:()=>{const a=needAdj();if(!a.length)return false;
  for(const m of a){m.bleed=5;m.alert=true;G.floaters.push({x:m.x,y:m.y,t:'bleed',c:'#c33',l:25});blood(m.x,m.y,6)}msg('The hook tears them open.','good')}},
 t_belly:{n:'Vent Gas',cd:12,desc:'Poison every adjacent enemy for 5 turns.',run:()=>{const a=needAdj();if(!a.length)return false;
  for(const m of a){m.poison=5;m.alert=true;G.floaters.push({x:m.x,y:m.y,t:'gas',c:'#9c3',l:25})}blood(G.p.x,G.p.y,16,'#9ad030',2.5);msg('Your belly sighs out a green cloud.','good')}},
 h_bloat:{n:'Acid Spit',cd:8,desc:'Spit at the nearest enemy (range 5) for 4 damage and poison.',run:()=>{const t=nearestTarget();if(!t){msg('No target in range.','warn');return false}
  G.attackFX.push({x:G.p.x,y:G.p.y,tx:t.x,ty:t.y,life:12,max:12,ranged:true,player:true});t.hp-=4;t.poison=5;t.alert=true;
  G.floaters.push({x:t.x,y:t.y,t:'-4',c:'#9c3',l:25});blood(t.x,t.y,8,'#9ad030',2);msg(`You spit acid at the ${t.n}.`,'good');finish(t)}},
 h_crow:{n:'Carrion Call',cd:20,desc:'Sense nearby enemies and the layout, like Scent.',run:()=>{scentEffects()}},
 t_rib:{n:'Bone Ward',cd:25,desc:'Renew your Bone Ward on this floor.',run:()=>{G.ward[G.depth]=false;msg('Your ribs knit a fresh ward.','good')}},
 t_slab:{n:'Stone Skin',cd:30,desc:'Heal 8 HP.',run:()=>{const p=G.p;p.hp=Math.min(stat().hp,p.hp+8);G.floaters.push({x:p.x,y:p.y,t:'+8',c:'#8d6',l:25});msg('Your hide knits itself shut. (+8 HP)','good')}},
 l_runner:{n:'Burst of Speed',cd:20,desc:'Your next 4 moves are free.',run:()=>{G.p.burst=4;msg('Your legs coil. The next steps cost no time.','good')}},
 l_crow:{n:'Skitter',cd:15,desc:'Your next 3 moves are free.',run:()=>{G.p.burst=3;msg('You skitter on hooked feet.','good')}}};
function useAbility(k){
 if(paused||G.over)return;const p=G.p,e=p.eq[k];if(!e)return;const ab=ABIL[e.id];if(!ab)return;
 if(e.cd>0){msg(`${ab.n} is recharging (${e.cd} turns).`,'warn');return}
 stopTravel();
 if(ab.run(e,k)===false)return;
 e.cd=ab.cd+1; // +1: endTurn below ticks cooldowns once immediately
 sfx('use');selItem=null;if(G.over)return;endTurn(false,false)}
