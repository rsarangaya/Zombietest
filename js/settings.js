// User preferences only (never any run state). Stored in localStorage when available.
const settings=Object.assign({sound:true,shake:true,reduceMotion:false,hints:true,textSize:1},(()=>{try{return JSON.parse(localStorage.getItem('rd_settings')||'{}')}catch(e){return {}}})());
function saveSettings(){try{localStorage.setItem('rd_settings',JSON.stringify(settings))}catch(e){}}
function applySettings(){
 const z=settings.textSize;for(const id of ['side','log'])document.getElementById(id).style.zoom=z===1?'':z;
 document.getElementById('bSound').textContent=settings.sound?'Sound: on':'Sound: off';
 for(const [id,key] of [['sSound','sound'],['sShake','shake'],['sReduce','reduceMotion'],['sHints','hints']])document.getElementById(id).checked=!!settings[key];
 document.getElementById('sText').value=String(z)}
function bindSettings(){
 for(const [id,key] of [['sSound','sound'],['sShake','shake'],['sReduce','reduceMotion'],['sHints','hints']])
  document.getElementById(id).onchange=e=>{settings[key]=e.target.checked;saveSettings();applySettings()};
 document.getElementById('sText').onchange=e=>{settings.textSize=parseFloat(e.target.value);saveSettings();applySettings();window.dispatchEvent(new Event('resize'))};
 document.getElementById('bSound').onclick=()=>{settings.sound=!settings.sound;saveSettings();applySettings();audioInit();sfx('use')}}
