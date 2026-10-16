const KEYS={ArrowUp:[0,-1],ArrowDown:[0,1],ArrowLeft:[-1,0],ArrowRight:[1,0],w:[0,-1],s:[0,1],a:[-1,0],d:[1,0],q:[-1,-1],e:[1,-1],z:[-1,1],c:[1,1],' ':[0,0],'.':[0,0],7:[-1,-1],8:[0,-1],9:[1,-1],4:[-1,0],6:[1,0],1:[-1,1],2:[0,1],3:[1,1],5:[0,0]};
const keyDir=key=>Object.prototype.hasOwnProperty.call(KEYS,key)?KEYS[key]:Object.prototype.hasOwnProperty.call(KEYS,key.toLowerCase())?KEYS[key.toLowerCase()]:null;
const $=id=>document.getElementById(id);
const closeTopWindow=()=>{ // Esc: close the top-most window; with none open, open the menu
 if($('console').style.display==='flex')return closeConsole();
 if($('logModal').style.display==='flex'){$('logModal').style.display='none';return}
 if(packIsOpen()){closePack();return}
 if(selItem&&selItem.mon){selItem=null;ui();return}
 if($('menu').style.display!=='flex')openMenu()};
const anyWindowOpen=()=>packIsOpen()||$('logModal').style.display==='flex'||$('console').style.display==='flex'||$('menu').style.display==='flex';
addEventListener('keydown',e=>{
 if(!e.key||e.ctrlKey||e.metaKey||e.altKey)return;
 if(e.key==='`'){e.preventDefault();con.modal.style.display==='flex'?closeConsole():openConsole();return}
 if(e.key==='Escape'){closeTopWindow();return}
 const l=e.key.toLowerCase();
 // Shift+1..9 fire the nth quick button (abilities first, then consumables)
 if(e.shiftKey&&/^Digit[1-9]$/.test(e.code||'')){e.preventDefault();const f=hudActions[+e.code.slice(5)-1];if(f&&!anyWindowOpen())f();return}
 if(l==='l'){e.preventDefault();openLog();return}
 if(l==='i'||l==='b'){e.preventDefault();packIsOpen()?closePack():openPack();return}
 if(anyWindowOpen())return; // the rest only applies to the bare map
 if(l==='g'){e.preventDefault();openPack();return}
 if(e.key==='>'){e.preventDefault();goStairs(G.sD);return}
 if(e.key==='<'){e.preventDefault();goStairs(G.sU);return}
 const k=keyDir(e.key);
 if(!k){if(l==='r'){e.preventDefault();startRest()}else if(l==='x'){e.preventDefault();scentAct()}return}
 e.preventDefault();
 if(e.shiftKey&&e.key.startsWith('Arrow')){pan.x+=k[0]*2;pan.y+=k[1]*2;return}
 stopTravel();playerAct(k[0],k[1])});

// screen -> tile (the canvas is CSS-sized CW x CH; G.cx/G.cy is the tile at screen centre)
function screenTile(clientX,clientY){const r=cv.getBoundingClientRect(),ccx=Math.round(CW/2),ccy=Math.round(CH/2);
 const sx=(clientX-r.left)*(CW/r.width),sy=(clientY-r.top)*(CH/r.height);
 return {x:Math.floor((((sx-ccx)/zoom)+Math.round(G.cx*T))/T),y:Math.floor((((sy-ccy)/zoom)+Math.round(G.cy*T))/T)}}
const visibleMonAt=(x,y)=>{const m=G.mons.find(m=>m.x===x&&m.y===y);return m&&G.vis[y]&&G.vis[y][x]?m:null};
function inspectAt(clientX,clientY){const {x,y}=screenTile(clientX,clientY),m=visibleMonAt(x,y);
 if(m){selItem={mon:m};ui();return true}return false}
const pointers=new Map(),DRAG_PX=10,LONG_MS=450;let pinched=false,pinchDist=0,pinchZoom=1,dragging=false,longTimer=null,longFired=false;
const clampZoom=z=>Math.max(.6,Math.min(3,z));
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
 if(dragging){const r=cv.getBoundingClientRect(),k=(CW/r.width)/zoom/T;pan.x-=(e.clientX-a.x)*k;pan.y-=(e.clientY-a.y)*k}
 a.x=e.clientX;a.y=e.clientY});
cv.addEventListener('pointerup',e=>{clearTimeout(longTimer);const a=pointers.get(e.pointerId);pointers.delete(e.pointerId);
 if(a&&!pinched&&!dragging&&!longFired&&!paused&&!G.over&&e.button!==2){const {x,y}=screenTile(e.clientX,e.clientY),p=G.p;stopTravel();
  if(selItem&&selItem.mon)selItem=null; // tapping elsewhere dismisses the inspect card
  const adj=Math.max(Math.abs(x-p.x),Math.abs(y-p.y))===1;
  if(adj)playerAct(x-p.x,y-p.y);
  else if(visibleMonAt(x,y)){selItem={mon:visibleMonAt(x,y)};ui()} // distant monster: inspect instead of walking at it
  else if(walk(x,y)&&G.seen[y][x])startTravel(x,y);
  else ui()}
 if(!pointers.size){pinched=false;pinchDist=0;dragging=false;cv.classList.remove('drag')}});
cv.addEventListener('pointercancel',e=>{clearTimeout(longTimer);pointers.delete(e.pointerId);if(!pointers.size){pinched=false;dragging=false;cv.classList.remove('drag')}});

const goStairs=s=>{if(s.x<0)msg('There is no way further down. Find The Surgeon.','warn');else if(G.seen[s.y][s.x])startTravel(s.x,s.y);else msg('You have not found that staircase yet.','warn')};
const confirmNew=()=>{if(confirm('Abandon this run?'))newGame()};
$('bDown').onclick=()=>goStairs(G.sD);
$('bUp').onclick=()=>goStairs(G.sU);
$('bMenu').onclick=openMenu;
$('bView').onclick=()=>{zoom=ZOOM_DEFAULT;pan.x=pan.y=0};
$('bWait').onclick=()=>{stopTravel();playerAct(0,0)};
$('bRest').onclick=startRest;
$('bScent').onclick=scentAct;
$('bPack').onclick=openPack;
$('bGround').onclick=openPack;
$('packClose').onclick=closePack;
$('pack').addEventListener('pointerdown',e=>{if(e.target===$('pack'))closePack()}); // tap outside the window to close it
$('bLog').onclick=openLog;
$('logClose').onclick=()=>{$('logModal').style.display='none'};
$('mResume').onclick=resumeRun;
$('mNew').onclick=confirmNew;
$('bRise').onclick=()=>newGame();
$('mCopy').onclick=copySummary;$('oCopy').onclick=copySummary;
$('mDebug').onclick=openConsole;$('conClose').onclick=closeConsole;
bindSettings();applySettings();

// The canvas always fills the screen; its backing store follows the window size (and device pixel ratio).
const wrap=$('mapwrap');
function fitScreen(){resizeCanvas(wrap.clientWidth,wrap.clientHeight)}
let centerShown=false;
function syncCenterBtn(){const off=Math.abs(pan.x)+Math.abs(pan.y)>.4||Math.abs(zoom-ZOOM_DEFAULT)>.05;if(off!==centerShown){centerShown=off;$('bView').style.display=off?'':'none'}}
setInterval(syncCenterBtn,250);
new ResizeObserver(fitScreen).observe(wrap);addEventListener('resize',fitScreen);fitScreen();
newGame();openMenu();loop();
