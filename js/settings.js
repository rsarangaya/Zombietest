// User preferences only (never any run state). Stored in localStorage when available.
const settings=Object.assign({sound:true,shake:true,reduceMotion:false,hints:true,haptics:true,minimap:true,textSize:1},(()=>{try{return JSON.parse(localStorage.getItem('rd_settings')||'{}')}catch(e){return {}}})());
function saveSettings(){try{localStorage.setItem('rd_settings',JSON.stringify(settings))}catch(e){}}
function applySettings(){
 const z=settings.textSize;for(const id of ['hudTop','hudRight','bottom','inspect','packWin'])document.getElementById(id).style.zoom=z===1?'':z;
 for(const [id,key] of [['sSound','sound'],['sShake','shake'],['sReduce','reduceMotion'],['sHints','hints'],['sHaptic','haptics'],['sMap','minimap']])document.getElementById(id).checked=!!settings[key];
 document.getElementById('sText').value=String(z)}
function bindSettings(){
 for(const [id,key] of [['sSound','sound'],['sShake','shake'],['sReduce','reduceMotion'],['sHints','hints'],['sHaptic','haptics'],['sMap','minimap']])
  document.getElementById(id).onchange=e=>{settings[key]=e.target.checked;saveSettings();applySettings()};
 document.getElementById('sText').onchange=e=>{settings.textSize=parseFloat(e.target.value);saveSettings();applySettings();window.dispatchEvent(new Event('resize'))}}
