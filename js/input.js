const KEYS={ArrowUp:[0,-1],ArrowDown:[0,1],ArrowLeft:[-1,0],ArrowRight:[1,0],w:[0,-1],s:[0,1],a:[-1,0],d:[1,0],q:[-1,-1],e:[1,-1],z:[-1,1],c:[1,1],' ':[0,0],'.':[0,0],7:[-1,-1],8:[0,-1],9:[1,-1],4:[-1,0],6:[1,0],1:[-1,1],2:[0,1],3:[1,1],5:[0,0]};
const keyDir=key=>Object.prototype.hasOwnProperty.call(KEYS,key)?KEYS[key]:Object.prototype.hasOwnProperty.call(KEYS,key.toLowerCase())?KEYS[key.toLowerCase()]:null;
addEventListener('keydown',e=>{
 if(!e.key||e.ctrlKey||e.metaKey||e.altKey)return;
 if(e.key==='`'){e.preventDefault();con.modal.style.display==='flex'?closeConsole():openConsole();return}
 if(e.key==='Escape'){for(const id of ['logModal'])document.getElementById(id).style.display='none';return}
 const k=keyDir(e.key);
 if(!k){const l=e.key.toLowerCase();if(l==='r'){e.preventDefault();startRest()}else if(l==='x'){e.preventDefault();scentAct()}return}
 e.preventDefault();
 if(e.shiftKey&&e.key.startsWith('Arrow')){pan.x+=k[0]*2;pan.y+=k[1]*2;return}
 stopTravel();playerAct(k[0],k[1])});

function screenTile(clientX,clientY){const r=cv.getBoundingClientRect();return {x:Math.floor(G.cx+(((clientX-r.left)/r.width*480-240)/zoom+240)/T),y:Math.floor(G.cy+(((clientY-r.top)/r.height*480-240)/zoom+240)/T)}}
const visibleMonAt=(x,y)=>{const m=G.mons.find(m=>m.x===x&&m.y===y);return m&&G.vis[y][x]?m:null};
function inspectAt(clientX,clientY){const {x,y}=screenTile(clientX,clientY),m=visibleMonAt(x,y);
 if(m){selItem={mon:m};ui();return true}return false}
const pointers=new Map(),DRAG_PX=10,LONG_MS=450;let pinched=false,pinchDist=0,pinchZoom=1,dragging=false,longTimer=null,longFired=false;
const clampZoom=z=>Math.max(.65,Math.min(2.5,z));
cv.addEventListener('wheel',e=>{e.preventDefault();stopTravel();zoom=clampZoom(zoom*Math.exp(-e.deltaY*.0015))},{passive:false});
cv.addEventListener('contextmenu',e=>{e.preventDefault();if(!paused&&!G.over)inspectAt(e.clientX,e.clientY)});
cv.addEventListener('pointerdown',e=>{if(paused||G.over)return;if(e.button===2)return;e.preventDefault();cv.setPointerCapture(e.pointerId);
 pointers.set(e.pointerId,{x:e.clientX,y:e.clientY,startX:e.clientX,startY:e.clientY});
 longFired=false;clearTimeout(longTimer);
 if(pointers.size===1&&e.pointerType!=='mouse')longTimer=setTimeout(()=>{if(pointers.size===1&&!dragging&&!pinched){longFired=inspectAt(e.clientX,e.clientY)}},LONG_MS);
 if(pointers.size===2){pinched=true;clearTimeout(longTimer);stopTravel();const [a,b]=[...pointers.values()];pinchDist=Math.hypot(a.x-b.x,a.y-b.y);pinchZoom=zoom}});
cv.addEventListener('pointermove',e=>{const a=pointers.get(e.pointerId);if(!a)return;
 if(pointers.size===2){a.x=e.clientX;a.y=e.clientY;const [p1,p2]=[...pointers.values()];if(pinchDist>0)zoom=clampZoom(pinchZoom*Math.hypot(p1.x-p2.x,p1.y-p2.y)/pinchDist);return}
 if(pinched)return;
 if(!dragging&&Math.hypot(e.clientX-a.startX,e.clientY-a.startY)>DRAG_PX){dragging=true;clearTimeout(longTimer);stopTravel();cv.classList.add('drag')}
 if(dragging){const r=cv.getBoundingClientRect(),k=480/r.width/zoom/T;pan.x-=(e.clientX-a.x)*k;pan.y-=(e.clientY-a.y)*k}
 a.x=e.clientX;a.y=e.clientY});
cv.addEventListener('pointerup',e=>{clearTimeout(longTimer);const a=pointers.get(e.pointerId);pointers.delete(e.pointerId);
 if(a&&!pinched&&!dragging&&!longFired&&!paused&&!G.over&&e.button!==2){const {x,y}=screenTile(e.clientX,e.clientY),p=G.p;stopTravel();
  const adj=Math.max(Math.abs(x-p.x),Math.abs(y-p.y))===1;
  if(adj)playerAct(x-p.x,y-p.y);
  else if(visibleMonAt(x,y)){selItem={mon:visibleMonAt(x,y)};ui()} // distant monster: inspect instead of walking at it
  else if(walk(x,y)&&G.seen[y][x])startTravel(x,y)}
 if(!pointers.size){pinched=false;pinchDist=0;dragging=false;cv.classList.remove('drag')}});
cv.addEventListener('pointercancel',e=>{clearTimeout(longTimer);pointers.delete(e.pointerId);if(!pointers.size){pinched=false;dragging=false;cv.classList.remove('drag')}});

const goStairs=s=>{if(s.x<0)msg('There is no way further down. Find The Surgeon.','warn');else if(G.seen[s.y][s.x])startTravel(s.x,s.y);else msg('You have not found that staircase yet.','warn')};
const confirmNew=()=>{if(confirm('Abandon this run?'))newGame()};
const $=id=>document.getElementById(id);
$('bDown').onclick=()=>goStairs(G.sD);
$('bUp').onclick=()=>goStairs(G.sU);
$('bNew').onclick=confirmNew;
$('bMenu').onclick=openMenu;
$('bView').onclick=()=>{zoom=1;pan.x=pan.y=0};
$('bWait').onclick=()=>{stopTravel();playerAct(0,0)};
$('bRest').onclick=startRest;
$('bScent').onclick=scentAct;
$('bLog').onclick=openLog;$('log').onclick=openLog;
$('logClose').onclick=()=>{$('logModal').style.display='none'};
$('mResume').onclick=resumeRun;
$('mNew').onclick=confirmNew;
$('bRise').onclick=()=>newGame();
$('mCopy').onclick=copySummary;$('oCopy').onclick=copySummary;
$('mDebug').onclick=openConsole;$('conClose').onclick=closeConsole;
bindSettings();applySettings();

// The map is sized in JS to the largest square that fits its flex slot, so the page never needs to scroll.
const wrap=$('mapwrap');
function fitScreen(){const w=wrap.clientWidth,h=wrap.clientHeight,s=Math.max(120,Math.floor(Math.min(w,h)));
 cv.style.width=cv.style.height=s+'px';cv.style.left=Math.floor((w-s)/2)+'px';cv.style.top=Math.floor((h-s)/2)+'px'}
new ResizeObserver(fitScreen).observe(wrap);addEventListener('resize',fitScreen);fitScreen();
newGame();openMenu();loop();
