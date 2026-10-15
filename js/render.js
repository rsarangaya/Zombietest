function drawStairs(px,py,down){
 ctx.fillStyle='#0a0706';ctx.fillRect(px+1,py+1,30,30);
 for(let i=0;i<6;i++){const sh=down?1-i*.15:.3+i*.12,col=mix(G.reg.f,'#ffffff',.25*sh);
  ctx.fillStyle=col;ctx.fillRect(px+3+(down?i:0),py+3+i*4,26-(down?i*2:0),3);
  ctx.fillStyle=dark(col,.5);ctx.fillRect(px+3+(down?i:0),py+6+i*4,26-(down?i*2:0),1)}
 ctx.fillStyle=down?'#000':G.reg.acc;ctx.globalAlpha=.8;
 ctx.beginPath();if(down){ctx.moveTo(px+16,py+29);ctx.lineTo(px+10,py+22);ctx.lineTo(px+22,py+22)}else{ctx.moveTo(px+16,py+4);ctx.lineTo(px+10,py+11);ctx.lineTo(px+22,py+11)}ctx.fill();ctx.globalAlpha=1;
 ctx.strokeStyle=dark(G.reg.w,.2);ctx.lineWidth=2;ctx.strokeRect(px+1,py+1,30,30)}
// ew = passage runs east-west (walls to the north/south), so the door slab spans north-south and its frame hugs those walls
function drawDoor(open,px,py,ew){
 const R=(x,y,w,h)=>ew?ctx.fillRect(px+x,py+y,w,h):ctx.fillRect(px+y,py+x,h,w); // author in east-west space, mirror for north-south
 if(!open){ctx.fillStyle='#2a1a0e';R(12,0,8,32);for(let k=0;k<4;k++){ctx.fillStyle=k%2?'#5a3a20':'#6a4628';R(13,2+k*7,6,6)}
  ctx.fillStyle='#2a2a30';R(12,6,8,3);R(12,22,8,3);ctx.fillStyle='#c8a030';R(15,22,3,3)}
 else{ctx.fillStyle='#3a2410';R(10,0,12,3);R(10,29,12,3);ctx.fillStyle='#5a3a20';R(10,0,12,1);R(10,29,12,1)}}
function drawDecor(d,px,py,x,y){
 const seedr=seeded(x*131+y*17);
 if(d===1){ctx.fillStyle='#4a0e0e';for(let k=0;k<7;k++)ctx.fillRect(px+4+Math.floor(seedr()*20),py+6+Math.floor(seedr()*18),2*(1+Math.floor(seedr()*4)),2*(1+Math.floor(seedr()*3)));ctx.fillStyle='#6a1414';ctx.fillRect(px+12,py+12,6,4);ctx.fillStyle='rgba(255,120,120,.25)';ctx.fillRect(px+13,py+12,2,2)}
 else if(d===2){ctx.fillStyle=G.reg.acc+'88';for(let k=0;k<9;k++)ctx.fillRect(px+Math.floor(seedr()*14)*2,py+Math.floor(seedr()*14)*2,3,3)}
 else if(d===3){ctx.fillStyle='#c8c2a8';ctx.fillRect(px+8,py+16,16,2);ctx.fillRect(px+6,py+14,4,4);ctx.fillRect(px+22,py+18,4,4);ctx.fillRect(px+14,py+8,8,6);ctx.fillStyle='#1a1410';ctx.fillRect(px+16,py+10,2,2);ctx.fillRect(px+20,py+10,2,2);ctx.fillStyle='#8a8470';ctx.fillRect(px+14,py+13,8,1)}
 else if(d===4){ctx.fillStyle='#10262a';ctx.fillRect(px+4,py+8,24,16);ctx.fillRect(px+8,py+6,16,20);const w=Math.sin(tick/20+x+y);ctx.fillStyle='#2a5e5a';ctx.fillRect(px+8+Math.round(w*2),py+11,6,1);ctx.fillRect(px+16-Math.round(w*2),py+18,5,1)}
 else if(d===5){ctx.fillStyle='#2a2420';ctx.fillRect(px+8,py+18,6,4);ctx.fillRect(px+16,py+14,8,6);ctx.fillRect(px+12,py+22,4,3);ctx.fillStyle='#4a423a';ctx.fillRect(px+8,py+18,6,1);ctx.fillRect(px+16,py+14,8,1)}}
function draw(){
 const p=G.p,s=stat(),tx=mkTex(G.regIdx);ctx.save();ctx.fillStyle='#000';ctx.fillRect(0,0,480,480);
 ctx.translate(240,240);ctx.scale(zoom,zoom);ctx.translate(-240,-240);
 if(G.shake>0&&settings.shake&&!settings.reduceMotion)ctx.translate((Math.random()-.5)*G.shake,(Math.random()-.5)*G.shake);
 // camera is snapped to whole pixels so tiles and sprites never shimmer against each other
 const cxp=Math.round(G.cx*T),cyp=Math.round(G.cy*T),ox=cxp/T,oy=cyp/T,ix=Math.floor(ox-Math.max(0,(15/zoom-15)/2)),iy=Math.floor(oy-Math.max(0,(15/zoom-15)/2));
 const wx=x=>Math.round(x*T)-cxp,wy=y=>Math.round(y*T)-cyp;
 if(!G.fogA){G.fogA=new Float32Array(W*H);for(let y=0;y<H;y++)for(let x=0;x<W;x++)G.fogA[y*W+x]=G.vis[y][x]?0:.6}
 const fogK=1-Math.exp(-frameDt/110);
 for(let j=0;j<=Math.ceil(Math.max(15,15/zoom));j++)for(let i=0;i<=Math.ceil(Math.max(15,15/zoom));i++){
  const x=ix+i,y=iy+j;if(x<0||y<0||x>=W||y>=H||!G.seen[y][x])continue;const t=G.map[y][x],px=wx(x),py=wy(y),v=(x*7+y*13)%4;
  if(t===0){const below=y+1<H&&G.map[y+1][x]!==0;ctx.drawImage(below?tx.wall[v]:tx.top[v&1],px,py)}
  else{ctx.drawImage(tx.floor[v],px,py);if(G.decor[y][x])drawDecor(G.decor[y][x],px,py,x,y);
   if(t===2||t===5)drawDoor(t===5,px,py,G.map[y-1][x]===0&&G.map[y+1][x]===0);
   if(x===G.sD.x&&y===G.sD.y)drawStairs(px,py,true);if(x===G.sU.x&&y===G.sU.y)drawStairs(px,py,false)}
  // remembered-but-not-visible tiles dim and brighten smoothly instead of popping
  const fi=y*W+x,fa=G.fogA[fi]+((G.vis[y][x]?0:.6)-G.fogA[fi])*fogK;G.fogA[fi]=fa;
  if(fa>.01){ctx.fillStyle='rgba(4,2,8,'+fa.toFixed(3)+')';ctx.fillRect(px,py,T,T)}}
 for(const t of G.torches){if(t.x<ox-1||t.y<oy-1||t.x>=ox+VW+1||t.y>=oy+VH+1||!G.seen[t.y][t.x])continue;const px=wx(t.x),py=wy(t.y),f=Math.floor(tick/5+t.x)%3;
  ctx.fillStyle='#2a1a10';ctx.fillRect(px+14,py+14,4,10);ctx.fillStyle='#555';ctx.fillRect(px+12,py+12,8,3);
  ctx.fillStyle='#e85a10';ctx.fillRect(px+13,py+5+f,6,8-f);ctx.fillStyle='#ffb030';ctx.fillRect(px+14,py+7+f,4,6-f);ctx.fillStyle='#fff0a0';ctx.fillRect(px+15,py+10,2,3)}
 const piles=new Map();for(const it of G.items){if(!G.vis[it.y][it.x])continue;const k=it.y*W+it.x;(piles.get(k)||piles.set(k,[]).get(k)).push(it)}
 for(const pile of piles.values()){
  pile.forEach((it,n)=>{const ox2=n===0?0:(n%2?5:-5),oy2=n===0?0:2,px=wx(it.x)+ox2,py=wy(it.y)+oy2;
   ctx.fillStyle='rgba(0,0,0,.45)';ctx.beginPath();ctx.ellipse(px+16,py+27,10,4,0,0,6.3);ctx.fill();
   ctx.drawImage(itIcon(it.it),px,py-2+Math.round(Math.sin(tick/14+it.x+n)*1.5),T,T)});
  const top=pile[0],px=wx(top.x),py=wy(top.y);
  ctx.fillStyle='rgba(255,230,140,'+(.5+.5*Math.sin(tick/9+top.y))+')';ctx.fillRect(px+25,py+3,2,2);
  if(pile.length>1){ctx.fillStyle='#000';ctx.fillRect(px+19,py+19,12,10);ctx.fillStyle='#fc6';ctx.font='bold 10px monospace';ctx.textAlign='center';ctx.fillText('x'+pile.length,px+25,py+27);ctx.textAlign='left'}}
 for(const m of G.mons)if(m.warning&&G.vis[m.y][m.x]){const w=m.warning,px=wx(w.x),py=wy(w.y),pu=.7+.3*Math.sin(tick/4);
 ctx.fillStyle='rgba(255,30,35,'+(.3*pu+.1)+')';ctx.fillRect(px,py,32,32);ctx.strokeStyle='#ff6050';ctx.lineWidth=2;ctx.strokeRect(px+2,py+2,28,28);
 ctx.beginPath();ctx.moveTo(wx(m.x)+16,wy(m.y)+16);ctx.lineTo(px+16,py+16);ctx.setLineDash([4,4]);ctx.stroke();ctx.setLineDash([]);
 }
 for(const f of G.attackFX){const t=1-f.life/f.max,x=wx(f.x)+16,y=wy(f.y)+16,tx=wx(f.tx)+16,ty=wy(f.ty)+16;
 ctx.strokeStyle=f.player?'#d9e0ba':'#ff7040';ctx.fillStyle=ctx.strokeStyle;ctx.lineWidth=3;
 if(f.ranged){ctx.beginPath();ctx.arc(x+(tx-x)*t,y+(ty-y)*t,5,0,Math.PI*2);ctx.fill()}
 else{const a=Math.atan2(ty-y,tx-x);ctx.beginPath();ctx.arc(x,y,18,a-.9+t*.6,a+.2+t*.6);ctx.stroke()}}
 // monsters that just died shrink and fade where they fell
 for(const d of G.dying){const u=Math.min(1,(NOW-d.t0)/280);if(!G.vis[d.y][d.x])continue;const px=wx(d.rx),py=wy(d.ry),sc=1-.25*u;
  ctx.save();ctx.globalAlpha=1-u;ctx.translate(px+16,py+30);ctx.scale(d.fx<0?-sc:sc,sc);ctx.drawImage(S[d.k],-16,-30+u*4,T,T);
  if(u<.5){ctx.globalAlpha=(1-u*2)*.7;ctx.drawImage(flashSprite(S[d.k],'#ffffff'),-16,-30+u*4,T,T)}ctx.restore()}
 const ents=G.mons.filter(m=>m.va>.02).map(m=>({y:m.ry,m})).concat([{y:p.ry,pl:1}]).sort((a,b)=>a.y-b.y);
 for(const e of ents){
  const o=e.pl?p:e.m,px=wx(o.rx),py=wy(o.ry),face=e.pl?o.face:o.fx;
  // lunge toward the target and back, hop while walking, gentle breathing when idle
  const rm=settings.reduceMotion;let lx=0,ly=0;if(o.lg&&rm)o.lg=null;if(o.lg){const u=(NOW-o.lg.t0)/180;if(u>=1)o.lg=null;else{const k=Math.sin(Math.PI*Math.pow(u,.7))*.4*T;lx=o.lg.dx*k;ly=o.lg.dy*k}}
  const hop=o.pr<1&&!rm?Math.sin(o.pr*Math.PI)*2:0,br=rm?0:Math.sin(tick/(e.pl?11:o.alert?9:18)+(o.x*7+o.y*3))*(o.alert||e.pl?.9:.5);
  const fly=!e.pl&&o.k==='crow'?Math.sin(tick/3)*2-3:0;
  let fa=0;if(o.fl){fa=1-(NOW-o.fl.t0)/220;if(fa<=0){o.fl=null;fa=0}}
  const alpha=e.pl?1:Math.min(1,o.va);ctx.globalAlpha=alpha;
  ctx.fillStyle='rgba(0,0,0,.5)';ctx.beginPath();ctx.ellipse(px+16+lx*.5,py+29,(e.pl?10:(o.k==='golem'||o.k==='boss'?13:9))-hop*.5,4,0,0,6.3);ctx.fill();
  ctx.save();if(face<0){ctx.translate(px+T+lx,py+ly);ctx.scale(-1,1)}else ctx.translate(px+lx,py+ly);
  ctx.translate(0,Math.round(-hop-br+fly));
  const img=e.pl?composePlayer(p.eq):S[o.k];ctx.drawImage(img,0,0,T,T);
  if(fa>0){ctx.globalAlpha=alpha*fa*.85;ctx.drawImage(flashSprite(img,e.pl?'#ff4a38':'#ffffff'),0,0,T,T)}
  ctx.restore();ctx.globalAlpha=alpha;
  if(!e.pl&&selItem&&selItem.mon===o){ctx.strokeStyle='#ffd060';ctx.lineWidth=2;ctx.setLineDash([4,3]);ctx.strokeRect(px+2,py+2,28,28);ctx.setLineDash([])}
  if(!e.pl){const m=o;
   if(m.hp<m.max){ctx.fillStyle='#1a0505';ctx.fillRect(px+3,py-1,T-6,4);ctx.fillStyle='#d33';ctx.fillRect(px+4,py,Math.max(0,(T-8)*m.hp/m.max),2)}
   if(m.bleed>0||m.poison>0||m.stun>0||m.burn>0||m.slow>0){ctx.fillStyle=m.stun>0?'#fe6':m.burn>0?'#f93':m.poison>0?'#9c3':m.slow>0?'#8ab':'#c33';ctx.fillRect(px+2,py+4,4,4)}
   if(!m.alert){ctx.fillStyle='#fff';ctx.font='bold 10px monospace';ctx.textAlign='left';ctx.fillText('z',px+T-9,py+8+Math.sin(tick/12)*2)}}
  ctx.globalAlpha=1}
 for(const q of G.parts){ctx.fillStyle=q.c;ctx.globalAlpha=Math.min(1,q.l/10);ctx.fillRect(Math.round(q.x-cxp),Math.round(q.y-cyp),q.s,q.s)}ctx.globalAlpha=1;
 lctx.globalCompositeOperation='source-over';lctx.clearRect(0,0,480,480);lctx.fillStyle='rgba(3,1,6,.94)';lctx.fillRect(0,0,480,480);
 lctx.globalCompositeOperation='destination-out';
 const fl=1+Math.sin(tick/7)*.03+Math.sin(tick/3.1)*.02;
 const light=(cx,cy,r,a)=>{const g=lctx.createRadialGradient(cx,cy,r*.1,cx,cy,r);g.addColorStop(0,`rgba(0,0,0,${a})`);g.addColorStop(.55,`rgba(0,0,0,${a*.6})`);g.addColorStop(1,'rgba(0,0,0,0)');lctx.fillStyle=g;lctx.fillRect(cx-r,cy-r,r*2,r*2)};
 light(wx(p.rx)+16,wy(p.ry)+16,(s.sight*T+24)*fl,1);
 for(const t of G.torches){if(!G.seen[t.y][t.x])continue;light(wx(t.x)+16,wy(t.y)+20,120*(1+Math.sin(tick/5+t.x*3)*.06),.85)}
 // when zoomed out the light canvas no longer covers the view: darken the margin around it too
 ctx.fillStyle='rgba(3,1,6,.94)';ctx.fillRect(-1000,-1000,2480,1000);ctx.fillRect(-1000,480,2480,1000);ctx.fillRect(-1000,0,1000,480);ctx.fillRect(480,0,1000,480);
 ctx.drawImage(lc,0,0);
 ctx.globalCompositeOperation='lighter';
 for(const t of G.torches){if(!G.seen[t.y][t.x])continue;const cx=wx(t.x)+16,cy=wy(t.y)+20,g=ctx.createRadialGradient(cx,cy,4,cx,cy,110);g.addColorStop(0,'rgba(255,120,30,.22)');g.addColorStop(1,'rgba(255,120,30,0)');ctx.fillStyle=g;ctx.fillRect(cx-110,cy-110,220,220)}
 {const cx=wx(p.rx)+16,cy=wy(p.ry)+16,g=ctx.createRadialGradient(cx,cy,4,cx,cy,s.sight*T);g.addColorStop(0,'rgba(120,150,100,.10)');g.addColorStop(1,'rgba(120,150,100,0)');ctx.fillStyle=g;ctx.fillRect(cx-200,cy-200,400,400)}
 ctx.globalCompositeOperation='source-over';
 // floating numbers pop in slightly large, rise with ease-out and fade over the last 40% of their life
 ctx.lineWidth=3;ctx.strokeStyle='#000';ctx.textAlign='center';
 for(const f of G.floaters){const u=1-f.l/(f.max||f.l),rise=1-Math.pow(1-u,2.2),sc=u<.15?1+.4*(1-u/.15):1,px=wx(f.x)+16+(f.jx||0),py=wy(f.y)+6-rise*24;
  ctx.globalAlpha=u<.6?1:Math.max(0,(1-u)/.4);ctx.font='bold '+Math.round(13*sc)+'px monospace';ctx.strokeText(f.t,px,py);ctx.fillStyle=f.c;ctx.fillText(f.t,px,py)}
 ctx.globalAlpha=1;ctx.textAlign='left';
 ctx.restore();
 const g=ctx.createRadialGradient(240,240,170,240,240,350);g.addColorStop(0,'rgba(0,0,0,0)');g.addColorStop(1,'rgba(0,0,0,.6)');ctx.fillStyle=g;ctx.fillRect(0,0,480,480);
 if(p.hp<s.hp*.3){ctx.fillStyle=`rgba(160,0,0,${.12+.08*Math.sin(tick/6)})`;ctx.fillRect(0,0,480,480)}
 if(p.hunger>=75){ctx.strokeStyle=`rgba(120,90,10,${.3+.2*Math.sin(tick/10)})`;ctx.lineWidth=8;ctx.strokeRect(0,0,480,480)}
 const mx=480-W*2-4,my=4;ctx.fillStyle='rgba(0,0,0,.55)';ctx.fillRect(mx-1,my-1,W*2+2,H*2+2);
 for(let y=0;y<H;y++)for(let x=0;x<W;x++)if(G.seen[y][x]){ctx.fillStyle=G.map[y][x]===0?'#2a2a2a':'#6a5a4a';ctx.fillRect(mx+x*2,my+y*2,2,2)}
 ctx.fillStyle='#7f7';ctx.fillRect(mx+p.x*2-1,my+p.y*2-1,4,4);
 if(G.sD.x>=0&&G.seen[G.sD.y][G.sD.x]){ctx.fillStyle='#fc3';ctx.fillRect(mx+G.sD.x*2-1,my+G.sD.y*2-1,4,4)}
 ctx.fillStyle='#6cf';ctx.fillRect(mx+G.sU.x*2-1,my+G.sU.y*2-1,4,4)}
// white/red silhouette of a sprite, used for hit flashes (cached per sprite + colour)
const flashCache=new Map();
function flashSprite(img,col){const key=col;let m=flashCache.get(img);if(!m)flashCache.set(img,m={});
 if(m[key])return m[key];const c=document.createElement('canvas');c.width=img.width;c.height=img.height;const x=c.getContext('2d');
 x.drawImage(img,0,0);x.globalCompositeOperation='source-atop';x.fillStyle=col;x.fillRect(0,0,c.width,c.height);return m[key]=c}
// Linear tween between tiles, like Shattered Pixel Dungeon: every step takes MOVE_MS regardless of frame rate.
// A new target mid-step restarts from the current drawn position, so chained steps flow without stopping.
const MOVE_MS=100;let frameDt=16.7,lastT=0;
function glide(o){
 if(o.rx===undefined){o.rx=o.x;o.ry=o.y;o.pr=1}
 let w=o.tw;
 if(!w||w.x1!==o.x||w.y1!==o.y){
  if(o.rx===o.x&&o.ry===o.y){o.tw=null;o.pr=1;return}
  if(Math.hypot(o.x-o.rx,o.y-o.ry)>2.5){o.rx=o.x;o.ry=o.y;o.tw=null;o.pr=1;return} // teleport / stairs: snap
  w=o.tw={x0:o.rx,y0:o.ry,x1:o.x,y1:o.y,t0:NOW}}
 const u=Math.min(1,(NOW-w.t0)/MOVE_MS);o.rx=w.x0+(w.x1-w.x0)*u;o.ry=w.y0+(w.y1-w.y0)*u;o.pr=u;if(u>=1)o.tw=null}
function loop(){
 const t=performance.now();frameDt=Math.min(50,t-(lastT||t-16.7));lastT=t;NOW=t;const k=frameDt/16.667;tick+=k;
 for(const f of G.attackFX)f.life-=k;G.attackFX=G.attackFX.filter(f=>f.life>0);
 G.dying=G.dying.filter(d=>NOW-d.t0<300);
 if(G.map){const p=G.p;
  glide(p);for(const m of G.mons){glide(m);
   if(m.va===undefined)m.va=G.vis[m.y][m.x]?1:0;m.va+=((G.vis[m.y][m.x]?1:0)-m.va)*(1-Math.exp(-frameDt/90));
   if(m.lhp===undefined)m.lhp=m.hp;if(m.hp<m.lhp)m.fl={t0:NOW};m.lhp=m.hp}
  if(p.lhp===undefined)p.lhp=p.hp;if(p.hp<p.lhp)p.fl={t0:NOW};p.lhp=p.hp;
  // camera eases toward the player; the user's pan offset is added on top (and may overshoot the map edge by a few tiles)
  const bx=Math.max(0,Math.min(W-VW,p.rx-(VW>>1))),by=Math.max(0,Math.min(H-VH,p.ry-(VH>>1)));
  if(G.sbx==null){G.sbx=bx;G.sby=by}else{const a=1-Math.exp(-frameDt/60);G.sbx+=(bx-G.sbx)*a;G.sby+=(by-G.sby)*a}
  G.cx=Math.max(-4,Math.min(W-VW+4,G.sbx+pan.x));G.cy=Math.max(-4,Math.min(H-VH+4,G.sby+pan.y));pan.x=G.cx-G.sbx;pan.y=G.cy-G.sby}
 for(const f of G.floaters){if(!f.max){f.max=f.l;f.jx=Math.random()*10-5}f.l-=k}G.floaters=G.floaters.filter(f=>f.l>0);
 for(const q of G.parts){q.x+=q.vx*k;q.y+=q.vy*k;q.vy+=.12*k;q.l-=k}G.parts=G.parts.filter(q=>q.l>0);
 if(G.shake>0)G.shake*=Math.pow(.85,k);if(G.shake<.3)G.shake=0;
 try{if(G.map)draw()}catch(err){console.error('draw failed',err);ctx.restore()}
 requestAnimationFrame(loop)}
