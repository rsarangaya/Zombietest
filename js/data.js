const SLOTS=['head','torso','armL','armR','legs'];
const SLOTNAME={head:'Head',torso:'Torso',armL:'Left Arm',armR:'Right Arm',legs:'Legs'};
const KINDNAME={head:'Head',torso:'Torso',arm:'Arm',legs:'Legs'};
const TPL=[
{id:'h_crow',kind:'head',n:'Crow Skull',t:1,col:'#4a4a62',spr:'crow',st:{sight:2,hp:2},src:'crow'},
{id:'h_nest',kind:'head',n:'Maggot-Nest Head',t:1,col:'#d0c8a0',spr:'nest',st:{hp:4,steal:1},src:'maggot'},
{id:'h_zeal',kind:'head',n:"Zealot's Skull",t:2,col:'#a02828',spr:'zeal',st:{atk:1,def:1,hp:4},src:'cultist'},
{id:'h_bloat',kind:'head',n:'Bloat Head',t:3,col:'#8a9a50',spr:'bloat',st:{hp:14},fx:'thorns',fxd:'Acid Spit: melee attackers take 1 damage when they hit you',src:'bloat'},
{id:'h_golem',kind:'head',n:'Golem Brow',t:4,col:'#a87a68',spr:'golem',st:{def:4,hp:8},src:'golem'},
{id:'h_mask',kind:'head',n:"Surgeon's Mask",t:5,col:'#d0d8d8',spr:'mask',st:{atk:2,def:2,sight:2,steal:1,hp:4},src:'boss'},
{id:'t_maggot',kind:'torso',n:'Maggot-Riddled Torso',t:1,col:'#c8c0a0',spr:'maggot',st:{hp:10},src:'maggot'},
{id:'t_cloak',kind:'torso',n:'Feather-Cloak Torso',t:2,col:'#3a3a52',spr:'cloak',st:{def:1,hp:2},fx:'dodge',fxd:'Light Fall: 10% chance to dodge any attack',src:'crow'},
{id:'t_rib',kind:'torso',n:'Cultist Ribcage',t:3,col:'#b03030',spr:'rib',st:{def:2,hp:4},fx:'ward',fxd:'Bone Ward: the first hit on each floor is halved',src:'cultist'},
{id:'t_belly',kind:'torso',n:'Bloat Belly',t:4,col:'#8a8a50',spr:'belly',st:{hp:24},fx:'gas',fxd:'Gas Sac: bursts on a hit of 8+, dealing 4 to adjacent enemies (part is lost)',src:'bloat'},
{id:'t_slab',kind:'torso',n:'Golem Slab',t:5,col:'#a87868',spr:'slab',st:{def:4,hp:10},fx:'regen',fxd:'Stitched Hide: +1 HP every 5 turns while hunger is under 75%',src:'golem'},
{id:'a_crow',kind:'arm',n:'Crow Wing-Claw',t:1,col:'#3a3a52',spr:'crow',st:{atk:1},fx:'peck',fxd:'Quick Peck: 15% chance to strike twice',src:'crow'},
{id:'a_hook',kind:'arm',n:'Rusty Hook Arm',t:2,col:'#a8785a',spr:'hook',st:{atk:2},fx:'rend',fxd:'Rend: 25% chance to make the target bleed (4 turns)',src:'cultist'},
{id:'a_scythe',kind:'arm',n:'Bone Scythe Arm',t:3,col:'#d8d0b0',spr:'scythe',st:{atk:2},fx:'sweep',fxd:'Sweep: also hits one adjacent enemy for half damage',src:'cultist'},
{id:'a_fist',kind:'arm',n:'Maggot-Fist',t:3,col:'#d0c8a0',spr:'fist',st:{atk:2},fx:'infest',fxd:'Infest: kills heal 2 extra HP',src:'maggot'},
{id:'a_gfist',kind:'arm',n:'Golem Fist',t:4,col:'#a87868',spr:'gfist',st:{atk:3},fx:'crush',fxd:'Crush: 20% chance to stun the target for a turn',src:'golem'},
{id:'a_saw',kind:'arm',n:'Bonesaw Arm',t:5,col:'#d0d8d8',spr:'saw',st:{atk:6},fx:'brittle',fxd:'Brittle: loses 2 rot per hit',src:'boss'},
{id:'l_crawl',kind:'legs',n:'Maggot Crawlers',t:1,col:'#d0c8a0',spr:'crawl',st:{spd:.10,hp:4},src:'maggot'},
{id:'l_crow',kind:'legs',n:'Crow Legs',t:2,col:'#d0a030',spr:'crow',st:{spd:.20,hp:4},src:'crow'},
{id:'l_stilt',kind:'legs',n:'Stilt Legs',t:3,col:'#8a6a4a',spr:'stilt',st:{spd:.25,sight:1,hp:5},src:'bloat'},
{id:'l_pillar',kind:'legs',n:'Golem Pillars',t:4,col:'#a87868',spr:'pillar',st:{def:3,hp:10},fx:'planted',fxd:'Planted: immune to stun and knockback',src:'golem'},
{id:'l_runner',kind:'legs',n:"Runner's Legs",t:5,col:'#c8c0a0',spr:'runner',st:{spd:.35,def:1,hp:9},fx:'sprint',fxd:'Sprint: the first move after resting 5+ turns is free',src:'boss'}];
// Hidden curses on grafts. Revealed (and applied) the moment a graft is attached; Formaldehyde Brine can cleanse one.
const TAINT={rot:{n:'Rotting',d:'it decays 80% faster'},itch:{n:'Ravenous',d:'it makes you hungrier every turn'},weep:{n:'Weeping',d:'it seeps: -1 HP every 8 turns'}};
const QUAL=[['Withered',.6],['',1],['',1],['Sturdy',1.2],['Pristine',1.5]];
function mkPart(depth,src,forceId){
 const cur=Math.min(5,Math.ceil(depth/4)),tier=cur>1&&R()<.65?cur-1:cur;
 let pool=TPL.filter(t=>t.t===tier);if(src&&R()<.45){const sp=pool.filter(t=>t.src===src);if(sp.length)pool=sp}
 if(forceId)pool=TPL.filter(t=>t.id===forceId);
 const t=pick(pool),q=pick(QUAL),maxdur=Math.round(100*Math.max(1,q[1]));
 return {type:'part',id:t.id,name:(q[0]?q[0]+' ':'')+t.n,kind:t.kind,spr:t.spr,col:t.col,stats:{...t.st},fx:t.fx||'',fxd:t.fxd||'',tier:t.t,taint:depth>=3&&R()<.22?pick(Object.keys(TAINT)):'',known:false,slot:t.kind==='arm'?'armR':t.kind,maxdur,dur:Math.round(100*q[1]),decay:[0,.18,.24,.32,.42,.55][t.t]}}
const CONS={
flask:{n:'Embalming Flask',col:'#b01820',w:30,md:1,stack:1,desc:'Drink: heal 10 + 2 per floor depth.'},
scrap:{n:'Scrap of Flesh',col:'#d86a6a',w:25,md:1,stack:1,desc:'Eat: hunger -20, heal 2.'},
shards:{n:'Bone Shards',col:'#ddd8c0',w:15,md:1,stack:1,desc:'Throw at the nearest enemy (range 5): 2-4 damage.',throw:1,cnt:4},
meat:{n:'Tainted Meat',col:'#78b030',w:12,md:6,stack:1,desc:'Eat: hunger -35. 25% chance of nausea (-3 HP).'},
brine:{n:'Formaldehyde Brine',col:'#4a80b0',w:10,md:4,stack:1,desc:'Restores half the rot (missing durability) of your most decayed attached part and cleanses its taint.'},
pyre:{n:'Pyre Flask',col:'#e86a28',w:9,md:8,stack:1,desc:'Throw (range 5): 3 damage and sets the target ablaze (2 damage a turn for 4 turns).',throw:1},
grease:{n:'Grave Tar',col:'#5a5a78',w:9,md:6,stack:1,desc:'Throw (range 5): slows every enemy in radius 1 for 6 turns.',throw:1},
candle:{n:'Grave Candle',col:'#d8a830',w:8,md:4,stack:1,desc:'Light it: +2 sight for 60 turns.'},
map:{n:'Corpse Map',col:'#b8a070',w:8,md:4,stack:1,desc:'Reveals the layout of this floor.'},
jar:{n:'Putrid Jar',col:'#6a4a3a',w:8,md:6,stack:1,desc:'Throw (range 5): 4 damage in radius 1 plus poison for 5 turns.',throw:1},
rite:{n:'Burial Rite',col:'#b8a070',w:6,md:8,stack:1,desc:'Read: teleport to a random room.'},
serum:{n:'Graft Serum',col:'#78b030',w:0,md:1,stack:1,desc:'Inject: permanently +3 max HP.'},
rites:{n:'Last Rites',col:'#d8a830',w:0,md:12,stack:0,desc:'Passive: if you would die, revive once at 50% HP.'}};
// Starting limbs: weak, but they rot much faster than any found graft (decay 0.6/turn vs 0.18-0.55).
const STARTER={
 armL:{id:'s_armL',kind:'arm',n:'Stitched Left Arm',st:{atk:0}},
 armR:{id:'s_armR',kind:'arm',n:'Stitched Right Arm',st:{atk:1}},
 legs:{id:'s_legs',kind:'legs',n:'Stitched Legs',st:{spd:.05}}};
function mkStarter(slot){const t=STARTER[slot];
 return {type:'part',id:t.id,name:t.n,kind:t.kind,spr:'def',col:'#8e9f7e',stats:{...t.st},fx:'',fxd:'Hastily stitched together. Rots very quickly.',tier:0,slot,maxdur:100,dur:100,decay:.6,taint:'',known:true}}
function mkCons(id,n){return {type:'cons',id,name:CONS[id].n,col:CONS[id].col,count:n||CONS[id].cnt||1}}
function mkLoot(depth,src,partChance){
 if(R()<partChance)return mkPart(depth,src);
 const pool=Object.keys(CONS).filter(k=>CONS[k].w>0&&depth>=CONS[k].md),tot=pool.reduce((a,k)=>a+CONS[k].w,0);let r=R()*tot;
 for(const k of pool){r-=CONS[k].w;if(r<=0)return mkCons(k)}return mkCons('flask')}
// 4 stages of 5 floors each; the last is human (a survivors' research facility)
const STAGE_LEN=5,STAGES=4,MAX_DEPTH=STAGE_LEN*STAGES;
const REG=[{n:'The Cesspits',w:'#46564a',f:'#2c352d',t:'#141a15',acc:'#4a7a4a'},{n:'The Ossuary',w:'#625c4e',f:'#3a362c',t:'#1c1a14',acc:'#c8b878'},{n:'The Crematorium',w:'#6a4234',f:'#3d2820',t:'#20120d',acc:'#e86a28'},{n:'The Facility',w:'#4a5a68',f:'#2a333c',t:'#12171c',acc:'#6ab0d0'}];
const MON={
maggot:{n:'Grave Maggot',hp:6,a:[1,3],spd:1,food:12,xp:3,d:[1,6],drop:.12},
crow:{n:'Carrion Crow',hp:7,a:[2,4],spd:2,food:18,xp:5,d:[2,9],drop:.15,erratic:.3},
cultist:{n:'Hollow Zealot',hp:13,a:[3,6],spd:1,food:35,xp:9,d:[4,14],drop:.20,rng:5},
bloat:{n:'Gore Bloat',hp:15,a:[2,5],spd:.5,food:28,xp:7,d:[5,12],drop:.18,burst:1},
golem:{n:'Flesh Golem',hp:32,a:[5,9],spd:1,food:50,xp:20,d:[9,15],drop:.25},
ghoul:{n:'Ravenous Ghoul',hp:14,a:[3,6],spd:1.5,food:30,xp:11,d:[7,15],drop:.20},
acolyte:{n:'Hex Acolyte',hp:10,a:[2,5],spd:1,food:30,xp:10,d:[11,15],drop:.22,rng:6},
warden:{n:'The Warden',hp:55,a:[5,9],spd:1,food:70,xp:45,d:[99,99],drop:1,mini:1},
// stage-end mini-bosses (floors 10 and 15 join The Warden on floor 5)
matron:{n:'The Matron',hp:90,a:[6,11],spd:.75,food:90,xp:60,d:[99,99],drop:1,mini:1,burst:1},
abomination:{n:'The Abomination',hp:130,a:[9,15],spd:1,food:100,xp:90,d:[99,99],drop:1,mini:1},
// stage 4 is human
guard:{n:'Armed Guard',hp:34,a:[7,11],spd:1,food:60,xp:24,d:[16,20],drop:.25},
rifleman:{n:'Rifleman',hp:22,a:[6,10],spd:1,food:45,xp:22,d:[16,20],drop:.25,rng:6},
scientist:{n:'Mad Scientist',hp:18,a:[5,9],spd:1,food:40,xp:20,d:[16,20],drop:.28,rng:5,erratic:.2},
boss:{n:'The Surgeon',hp:150,a:[9,15],spd:1,food:100,xp:150,d:[99,99],drop:1}};
