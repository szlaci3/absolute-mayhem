export const copy=structuredClone;
export const ground=(x,y)=>(x>=1&&x<=7&&y>=3&&y<=8)||(x>=3&&x<=6&&y===2)||(x>=10&&x<=13&&y>=2&&y<=6);
const idOK=s=>typeof s==='string'&&/^[a-z][a-z0-9_]{0,31}$/.test(s)&&!(s in Object.prototype);
const own=(o,k)=>Object.hasOwn(o,k);
const check=(b,msg)=>{if(!b)throw Error(msg)};
const number=n=>Number.isSafeInteger(n)&&Math.abs(n)<=99999;
const label=s=>typeof s==='string'&&s.trim().length>0&&s.length<=160;
export const kinds=['lamp','prism','bridge','gate','relic','plate','crystal','bell','portal','console'];
export const events=['interact','enter','leave','timer','tick'];
export const guide='Return one JSON object {title,vars,entities,rules,removeRules}. vars is an object of integer initial values (existing values persist). entities is an array of {id,name,kind,x,y,on} where on is boolean, kind one of '+kinds.join(',')+'. Rules upsert by id: {id,name,event,target,conditions,actions}. Events interact/enter/leave target an entity id, timer targets a timer id, tick targets "*", once per simulation second. Conditions are {var,op,value} with eq/ne/lt/lte/gt/gte and integer value. Actions are {op:"set"|"add",id:variable,value:integer}, {op:"light",id:entity,value:boolean}, {op:"timer",id:timer,value:seconds 1..600}, {op:"cancel",id:timer}, {op:"say",value:text}. Arrays conditions and actions required. removeRules is an array of existing rule IDs. Entities at x 1..14,y 1..9. Active bridges are walkable across water. Gates block their tile until lit. Interact with adjacent entities. Same event conditions read pre-event state. Use grounded positions for interactables. Keep unrelated rules. Represent unsupported requests as {"unsupported":"reason"}.';
const ent=(id,name,kind,x,y,on=false)=>({id,name,kind,x,y,on});
const rule=(id,name,event,target,conditions,actions)=>({id,name,event,target,conditions,actions});
const say=value=>({op:'say',value}), light=(id,value=true)=>({op:'light',id,value}), set=(id,value)=>({op:'set',id,value}), eq=(v,value)=>({var:v,op:'eq',value});
export function initial(){
 const entities=[ent('beacon','Tide lantern','lamp',3,7),ent('lens','Meridian lens','prism',6,3),ent('span_a','West lightspan','bridge',8,5),ent('span_b','East lightspan','bridge',9,5),ent('orrery','Celestial orrery','relic',12,4)];
 const rules=[rule('ignite','Ignite the tide lantern','interact','beacon',[eq('flame',0)],[set('flame',1),light('beacon'),say('Lantern lit. Align the meridian lens on the north terrace.')]),rule('align','Focus the lightspan','interact','lens',[eq('flame',1),eq('aligned',0)],[set('aligned',1),light('lens'),light('span_a'),light('span_b'),say('The lightspan holds. Cross east to wake the orrery.')]),rule('dark','A lens needs light','interact','lens',[eq('flame',0)],[say('The lens is dark. Find the amber tide lantern.')]),rule('awaken','Wake the orrery','interact','orrery',[eq('aligned',1),eq('awake',0)],[set('awake',1),light('orrery'),say('Meridian restored. The stars turn above the water again.')])];
 return {version:1,player:{x:3,y:5},vars:{flame:0,aligned:0,awake:0},entities:Object.fromEntries(entities.map(e=>[e.id,e])),rules:Object.fromEntries(rules.map(r=>[r.id,r])),timers:{},time:0,revision:0,message:'Find the tide lantern on the south terrace.'};
}
export function applyPatch(current,p){
 check(p&&typeof p==='object','Expected a world patch.');
 if(p.unsupported)throw Error('Missing engine capability: '+String(p.unsupported).slice(0,200));
 check(label(p.title)&&p.vars&&Object.getPrototypeOf(p.vars)===Object.prototype&&Array.isArray(p.entities)&&Array.isArray(p.rules)&&Array.isArray(p.removeRules),'Invalid patch: provide a title, vars, entities, rules and removeRules.');
 check(Object.keys(p).every(k=>['title','vars','entities','rules','removeRules'].includes(k)),'Unknown patch field.');
 check(p.entities.length+p.rules.length+p.removeRules.length+Object.keys(p.vars).length>0,'The patch has no changes.');
 const w=copy(current);
 for(const [k,v] of Object.entries(p.vars)){check(idOK(k)&&number(v),'Invalid state variable.');if(!own(w.vars,k))w.vars[k]=v}
 const ids=new Set();
 for(const e of p.entities){check(e&&idOK(e.id)&&!ids.has(e.id)&&label(e.name)&&kinds.includes(e.kind)&&Number.isInteger(e.x)&&e.x>=1&&e.x<=14&&Number.isInteger(e.y)&&e.y>=1&&e.y<=9&&typeof e.on==='boolean','Invalid or duplicate world object.');ids.add(e.id);const old=w.entities[e.id];w.entities[e.id]={...e,on:old?.kind===e.kind?old.on:e.on}}
 for(const k of p.removeRules){check(idOK(k)&&own(w.rules,k),'Cannot remove an unknown rule.');delete w.rules[k]}
 ids.clear();
 for(const r of p.rules){check(r&&idOK(r.id)&&!ids.has(r.id)&&label(r.name)&&events.includes(r.event)&&Array.isArray(r.conditions)&&Array.isArray(r.actions)&&r.actions.length>0&&r.actions.length<=24&&r.conditions.length<=16,'Invalid or duplicate rule.');ids.add(r.id);w.rules[r.id]=r}
 for(const r of Object.values(w.rules)){
 check(r.event==='timer'?idOK(r.target):r.event==='tick'?r.target==='*':idOK(r.target)&&own(w.entities,r.target),'Rule refers to a missing event target.');
 for(const c of r.conditions)check(c&&own(w.vars,c.var)&&['eq','ne','lt','lte','gt','gte'].includes(c.op)&&number(c.value),'Invalid rule condition.');
 for(const a of r.actions){check(a&&({set:own(w.vars,a.id)&&number(a.value),add:own(w.vars,a.id)&&number(a.value),light:own(w.entities,a.id)&&typeof a.value==='boolean',timer:idOK(a.id)&&number(a.value)&&a.value>=1&&a.value<=600,cancel:idOK(a.id),say:label(a.value)})[a.op]===true,'Unsupported or invalid action: '+a?.op)}
 }
 check(Object.keys(w.rules).length<=96&&Object.keys(w.entities).length<=80&&Object.keys(w.vars).length<=128,'World capacity reached.');
 w.revision++;return w
}
export function emit(w,event,target){
 const fired=Object.values(w.rules).filter(r=>r.event===event&&r.target===target&&r.conditions.every(c=>{const n=w.vars[c.var],v=c.value;return {eq:n===v,ne:n!==v,lt:n<v,lte:n<=v,gt:n>v,gte:n>=v}[c.op]}));
 const actions=fired.flatMap(r=>r.actions);
 if(fired.length){w.trace??=[];w.trace.push({time:w.time,event,target,rules:fired.map(r=>r.id)});w.trace=w.trace.slice(-12)}
 for(const a of actions){if(a.op==='set')w.vars[a.id]=a.value;if(a.op==='add')w.vars[a.id]=Math.max(-99999,Math.min(99999,w.vars[a.id]+a.value));if(a.op==='light')w.entities[a.id].on=a.value;if(a.op==='timer')w.timers[a.id]=w.time+a.value;if(a.op==='cancel')delete w.timers[a.id];if(a.op==='say')w.message=a.value}
 return actions.length
}
export const at=(w,x,y)=>Object.values(w.entities).filter(e=>e.x===x&&e.y===y);
export const walkable=(w,x,y)=>(ground(x,y)||at(w,x,y).some(e=>e.kind==='bridge'&&e.on))&&!at(w,x,y).some(e=>e.kind==='gate'&&!e.on);
export function move(w,dx,dy){if(Math.abs(dx)+Math.abs(dy)!==1)return false;const {x,y}=w.player;if(!walkable(w,x+dx,y+dy))return false;for(const e of at(w,x,y))emit(w,'leave',e.id);w.player={x:x+dx,y:y+dy};for(const e of at(w,x+dx,y+dy))emit(w,'enter',e.id);return true}
export function tick(w){w.time++;for(const [id,t] of Object.entries(w.timers))if(t<=w.time&&w.timers[id]===t){delete w.timers[id];emit(w,'timer',id)}emit(w,'tick','*')}
export function interact(w,id){const e=w.entities[id];if(!e||Math.abs(w.player.x-e.x)+Math.abs(w.player.y-e.y)>1)return false;if(!emit(w,'interact',id))w.message=e.name+' is quiet.';return true}
