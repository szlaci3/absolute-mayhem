import {initial,applyPatch,move,walkable,interact,tick,at,copy} from './engine.js';
import {createScene} from './scene.js';
import {examples,localEdit} from './local.js';
const $=id=>document.getElementById(id),key='absolute-mayhem.world.v1';
let w=initial(),undo=[],log=[],tab='rules',hover=null,route=null,busy=false;
try{const s=JSON.parse(localStorage.getItem(key));if(s?.w?.version===1&&s.w.player&&s.w.entities.orrery){w=s.w;undo=s.undo||[];log=s.log||[]}}catch{}
let provider={selected:'antigravity-preview-09-2026',actual:null,reason:'Checking server availability.'};
let online=false;
const scene=createScene($('scene')),safe=s=>String(s);
function save(){try{localStorage.setItem(key,JSON.stringify({w,undo,log}));$('saved').textContent='●  Saved locally'}catch{$('saved').textContent='Save unavailable'}}
function journal(s){log.push(s);log=log.slice(-40)}
let toastId;function notice(s){$('toast').textContent=s;clearTimeout(toastId);toastId=setTimeout(()=>$('toast').textContent='',6000)}
function modal(title,body){$('dialogtitle').textContent=title;$('dialogbody').textContent=body;document.querySelector('dialog').showModal()}
function modelUI(){online=!!provider.actual;$('mode').textContent=online?'Google Gemini · live':'Local compiler · offline';$('model').textContent=online?provider.actual+(provider.verified?.at(-1)!==provider.selected?' · fallback':''):'Requested: '+provider.selected;$('details').title=provider.reason}
async function refresh(){try{provider=await(await fetch('/api/status')).json()}catch{provider.reason='The server endpoint could not be reached.'}modelUI()}refresh();
function drawUI(){
 const stage=w.vars.awake?3:w.vars.aligned?2:w.vars.flame?1:0;
 $('progress').textContent=stage===3?'FIELD OBJECTIVE · COMPLETE':'FIELD OBJECTIVE · 0'+(stage+1)+' / 03';
 $('objective').textContent=['Ignite the tide lantern','Align the meridian lens','Awaken the celestial orrery','The meridian is restored'][stage];$('message').textContent=w.message;
 $('coords').textContent='X '+String(w.player.x).padStart(2,'0')+'  /  Y '+String(w.player.y).padStart(2,'0');
 $('undo').disabled=!undo.length||busy;$('revision').textContent='REV '+String(w.revision).padStart(2,'0');
 const rows=tab==='rules'?Object.values(w.rules).map(r=>[r.name,r.event+' → '+r.target]):tab==='entities'?Object.values(w.entities).map(e=>[e.name,e.kind+' · '+e.x+', '+e.y+(e.on?' · active':'')]):tab==='trace'?(w.trace||[]).slice().reverse().map(t=>[t.event+' · '+t.target,'t='+t.time+' → '+t.rules.join(', ')]):[...Object.entries(w.vars),...Object.entries(w.timers).map(([id,t])=>[id,Math.max(0,t-w.time)+'s remaining'])];
 $('list').replaceChildren(...rows.map(([a,b])=>{const div=document.createElement('div');div.className='row';const title=document.createElement('b'),sub=document.createElement('small');title.textContent=a;sub.textContent=safe(b);div.append(title,sub);if(tab==='rules'){const r=Object.values(w.rules).find(r=>r.name===a);const inspect=document.createElement('button');inspect.className='inspect';inspect.textContent='Inspect rule';inspect.onclick=()=>modal(r.name,JSON.stringify(r,null,2));div.append(inspect)}return div}));
}
function update(){drawUI();save()}
function use(id){const near=Object.values(w.entities).filter(e=>Math.abs(e.x-w.player.x)+Math.abs(e.y-w.player.y)<=1);near.sort((a,b)=>(a.kind==='bridge')-(b.kind==='bridge')||Math.abs(a.x-w.player.x)+Math.abs(a.y-w.player.y)-Math.abs(b.x-w.player.x)-Math.abs(b.y-w.player.y));if(interact(w,id||near[0]?.id)){journal(w.message);update()}else notice('Walk beside an object to interact.')}
function stop(){clearInterval(route);route=null}
window.addEventListener('keydown',e=>{if(e.target.matches('input,textarea')||document.querySelector('dialog').open||e.ctrlKey||e.metaKey)return;
 const d={w:[0,-1],s:[0,1],a:[-1,0],d:[1,0],arrowup:[0,-1],arrowdown:[0,1],arrowleft:[-1,0],arrowright:[1,0]}[e.key.toLowerCase()];if(d){e.preventDefault();stop();if(move(w,...d))update()}if(e.key.toLowerCase()==='e'){stop();use()}});
const cv=$('scene');cv.onpointermove=e=>hover=scene.tile(e.clientX,e.clientY);cv.onpointerleave=()=>hover=null;
cv.onclick=e=>{cv.focus();stop();let dest=scene.tile(e.clientX,e.clientY);
 // Sprite tops sit above their floor tile. Pick their silhouette before testing the floor.
 const r=cv.getBoundingClientRect(),px=(e.clientX-r.left)*760/r.width,py=(e.clientY-r.top)*420/r.height;
 let target=Object.values(w.entities).filter(v=>v.kind!=='bridge').reverse().find(v=>{let x=315+(v.x-v.y)*24,y=95+(v.x+v.y)*10;return Math.abs(px-x)<12&&py<=y+2&&py>=y-35})||at(w,dest.x,dest.y).find(v=>v.kind!=='bridge');if(target)dest=target;
 let queue=[[w.player.x,w.player.y,[]]],seen=new Set(),path=null;
 for(let i=0;i<queue.length;i++){const [x,y,p]=queue[i];if(Math.abs(x-dest.x)+Math.abs(y-dest.y)<=(target?1:0)){path=p;break}for(const [dx,dy] of [[0,-1],[1,0],[0,1],[-1,0]]){const a=x+dx,b=y+dy,k=a+','+b;if(!seen.has(k)&&walkable(w,a,b)){seen.add(k);queue.push([a,b,[...p,[dx,dy]]])}}}
 if(!path){notice('No dry path to that tile.');return}function step(){if(!path.length){stop();if(target)use(target.id);return}if(!move(w,...path.shift()))stop();update()}route=setInterval(step,110);step()};
$('interact').onclick=()=>use();
$('apply').onclick=async()=>{const prompt=$('prompt').value.trim();if(!prompt||busy){if(!prompt)$('prompt').focus();return}busy=true;$('apply').disabled=true;$('apply').textContent='Compiling…';drawUI();let source='Local compiler';try{
 let patch;if(online){const r=await fetch('/api/edit',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({prompt,world:w})}),data=await r.json();if(data.status){provider=data.status;modelUI()}if(!r.ok)throw Error((data.kind||'Provider')+' · '+data.error);patch=data.patch;source=data.model}else patch=localEdit(prompt,w);
 const next=applyPatch(w,patch);stop();undo.push(copy(w));undo=undo.slice(-12);w=next;journal('REV '+w.revision+' · '+source+' · '+prompt+' → '+patch.title);$('prompt').value='';notice('Applied · '+patch.title);update()
 }catch(err){notice(err.message);journal('Rejected · '+source+' · '+err.message);save()}finally{busy=false;$('apply').disabled=false;$('apply').innerHTML='✧ &nbsp; Apply mechanic <span>→</span>';drawUI()}};
$('undo').onclick=()=>{if(!undo.length||busy)return;stop();w=undo.pop();journal('Undo · restored revision '+w.revision);notice('Pre-edit checkpoint restored.');update()};
for(const [i,s] of examples.entries()){const b=document.createElement('button');b.textContent=['A timed bridge bell','Extend the lightspan timer','A footstep-counting plate'][i];b.onclick=()=>{$('prompt').value=s;$('prompt').focus()};$('examples').append(b)}
document.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>{tab=b.dataset.tab;document.querySelectorAll('[data-tab]').forEach(el=>el.classList.toggle('active',el===b));drawUI()});
$('help').onclick=()=>modal('Field controls','WASD or arrow keys move one map tile. E interacts with the closest object. Click a tile to walk there, or click an object to approach and use it.\n\nIn the offline compiler, try: When I ring the bell, increment charge by 1 and open the gate for 5 seconds. Add the bell and gate first. Conditions can end with “only if charge is at least 2”. The State and Events tabs expose counters and triggered rules.\n\nApply mechanic updates the running world. Undo edit restores the complete pre-edit checkpoint. Simulation time advances while this tab is visible.');
$('details').onclick=()=>modal('Model connection','Selected: '+provider.selected+'\nResponding: '+(provider.actual||'None')+'\nFallback: gemini-3.5-flash-lite\n\n'+(provider.reason||'Primary model verified.')+'\n\n'+(online?'World edits are generated server-side.':'Local compiler edits are deterministic and labeled in the journal.'));
$('journal').onclick=()=>modal('Field journal',log.slice().reverse().join('\n\n')||'No interactions or edits recorded yet.');$('close').onclick=()=>document.querySelector('dialog').close();
let last=0;function frame(t){if(t-last>65){scene.draw(w,t,hover);last=t}requestAnimationFrame(frame)}requestAnimationFrame(frame);
setInterval(()=>{if(!document.hidden){tick(w);if(tab==='vars'||Object.values(w.rules).some(r=>r.event==='timer'||r.event==='tick'))drawUI();save()}},1000);update();
