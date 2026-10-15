// First-floor tutorial: short contextual hints, each shown once per page load.
const HINTS={
 start:'Arrows / WASD / tap to move. Bump into monsters to attack. You are always hungry; kills ease it.',
 item:'Walk over an item to grab it. Tap items in your pack to inspect, use or attach them.',
 part:'Grafts: pick a part in your pack and press Attach. Every attached part rots (Rot bar) and falls off at zero.',
 monster:'A monster is in view. Tap it from a distance (or right-click / long-press) to inspect it.',
 warning:'A red tile shows where a monster will strike next turn. Step off it, or stun the attacker!',
 hunger:'Above 75% hunger you stop healing. Kill things, or eat Scrap of Flesh and Tainted Meat.',
 starter:'Your stitched-on limbs are weak and rot fast (see the Rot bars). Grab the grafts lying in this waste room!',
 stairs:'Stairs found. "Travel down" walks you there. Deeper floors are deadlier.',
 slow:'Stumps and rotten legs make you slow: enemies get extra steps. Attach healthy legs!',
 stump:'You have no legs. Find leg grafts (Maggot Crawlers, Crow Legs...) or the dead will outpace you.',
 taint:'Unexamined grafts may be tainted. Formaldehyde Brine cleanses a taint.'};
const hintShown=new Set();let hintTimer=null;
function showHint(t){const el=document.getElementById('hint');el.textContent=t;el.style.opacity=1;clearTimeout(hintTimer);hintTimer=setTimeout(()=>{el.style.opacity=0},7000)}
function hintOnce(k){if(!settings.hints||hintShown.has(k)||!HINTS[k])return;hintShown.add(k);showHint(HINTS[k])}
function checkHints(){
 const p=G.p;
 if(p.hp<stat().hp*.3&&G.turn%2===0)sfx('heart');
 if(G.turn===2&&G.depth===1)hintOnce('starter');
 if(G.mons.some(m=>G.vis[m.y][m.x]))hintOnce('monster');
 if(G.items.some(i=>G.vis[i.y][i.x]))hintOnce('item');
 if(p.inv.some(i=>i.type==='part'&&!i.known))hintOnce('part');
 if(p.hunger>=50)hintOnce('hunger');
 if(G.seen[G.sD.y]&&G.sD.x>=0&&G.seen[G.sD.y][G.sD.x])hintOnce('stairs');
 if(!p.eq.legs&&G.turn>4)hintOnce('stump');
 if(G.depth>=3&&p.inv.some(i=>i.type==='part'&&!i.known))hintOnce('taint')}
