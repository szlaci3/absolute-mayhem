import {kinds,ground} from './engine.js';
export const examples=['Add a bell that lights the bridge for 8 seconds','Make the bridge stay lit for 15 seconds','Add a pressure plate that counts footsteps'];
export function localEdit(text,w){
 const s=text.toLowerCase().trim(),p={title:'',vars:{},entities:[],rules:[],removeRules:[]};
 const sentence=eventSentence(text.trim(),w,p);if(sentence)return sentence;
 const time=s.match(/(\d+)\s*(?:seconds?|secs?|s)\b/),duration=time?Number(time[1]):8;
 if(time&&(duration<1||duration>600))throw Error('Timers support 1 to 600 seconds.');
 const bridge=Object.values(w.entities).filter(e=>e.kind==='bridge'),lit=value=>bridge.map(e=>({op:'light',id:e.id,value})),timer='local_span';
 if(/^(?:make|change|extend|keep|set|shorten|increase)/.test(s)&&time&&/bridge|timer|duration/.test(s)&&!s.includes(' that ')){
 const affected=Object.values(w.rules).filter(r=>r.actions.some(a=>a.op==='timer'&&a.id===timer));if(!affected.length)throw Error('Add a timed bridge trigger before changing its duration.');
 p.title='Lightspan duration · '+duration+'s';p.rules=affected.map(r=>({...r,actions:r.actions.map(a=>a.op==='timer'&&a.id===timer?{...a,value:duration}:a)}));return p}
 const kind=kinds.filter(k=>k!=='bridge').find(k=>new RegExp('\\b'+k+'\\b').test(s));
 if(!kind||!/^add |^create |^place /.test(s))throw Error('Local compiler supports adding objects that light the bridge, count visits, or display a message. Freeform edits require a live model.');
 const id=kind+'_'+(w.revision+1),name=kind==='plate'?'Pressure plate':kind[0].toUpperCase()+kind.slice(1);
 let pos=s.match(/\bat\s*\(?(\d+)\s*,\s*(\d+)/);let spot=pos?[+pos[1],+pos[2]]:null;
 if(!spot){let opts=[];for(let x=1;x<14;x++)for(let y=1;y<9;y++)if(ground(x,y)&&!Object.values(w.entities).some(e=>e.x===x&&e.y===y))opts.push([x,y]);opts.sort((a,b)=>Math.abs(a[0]-w.player.x)+Math.abs(a[1]-w.player.y)-Math.abs(b[0]-w.player.x)-Math.abs(b[1]-w.player.y));spot=opts.find(([x,y])=>x!==w.player.x||y!==w.player.y)}
 if(!spot||!ground(...spot))throw Error('Choose a floor tile on either terrace.');
 p.entities.push({id,kind,name,x:spot[0],y:spot[1],on:false});
 if(s.match(/^add (?:a |an )?(?:gate|portal|bell|plate|crystal|console|lamp|relic|prism)(?: at \(?\d+,\s*\d+\)?)?$/)){p.title='Placed '+name;return p}
 const actions=[],event=kind==='plate'||/step|enter|walk over/.test(s)?'enter':'interact';
 if(/count/.test(s)){p.vars[id+'_count']=0;actions.push({op:'add',id:id+'_count',value:1})}
 if(/bridge|lightspan/.test(s)&&/light|open|raise|activate/.test(s)){actions.push(...lit(true));if(time){actions.push({op:'timer',id:timer,value:duration});p.rules.push({id:'local_expire',name:'Lightspan fades',event:'timer',target:timer,conditions:[],actions:[...lit(false),{op:'say',value:'The borrowed light fades.'}]})}}
 const msg=text.match(/(?:say[s]?|display[s]?)\s+["“]([^"”]{1,140})["”]/i);
 if(!actions.length&&!msg)throw Error('Specify what the object does. Try lighting the bridge, counting footsteps, or saying a quoted message.');
 actions.push({op:'light',id,value:true},{op:'say',value:msg?.[1]||name+' activated.'});p.title=name+' on the terrace';p.rules.unshift({id:id+'_trigger',name:name+' response',event,target:id,conditions:[],actions});return p
}
// Explicit event sentences use the same primitives as live provider patches.
function eventSentence(text,w,p){
 const cleaned=text.toLowerCase().replace(/[.!]$/,'');
 const spec=cleaned.match(/^(?:when|whenever|after) (?:i |you |the player )?(step on|enter|leave|ring|use|touch|interact with|activate) (.+?)(?:,| then )\s*(.+)$/);
 if(!spec)return null;
 function objects(words){
 const key=words.replace(/^(?:the|a|an|both|all) /,'').trim().replace(/s$/,'');
 const list=Object.values(w.entities);
 const exact=list.find(e=>[e.name.toLowerCase(),e.id].includes(key));if(exact)return [exact];
 const match=list.filter(e=>e.kind===key||e.name.toLowerCase().endsWith(' '+key));
 if(!match.length)throw Error('No object matches "'+words+'". Inspect Objects for names.');return match
 }
 const source=objects(spec[2]);if(source.length!==1)throw Error('Name one trigger object by its ID.');
 const verb=spec[1],event=/step|enter|touch/.test(verb)?'enter':verb==='leave'?'leave':'interact';
 const actions=[],conditions=[];let body=spec[3].trim();
 const cond=body.match(/ only (?:if|when) ([a-z][a-z0-9_]*) (?:is )?(at least |above |below |exactly )?(\d+)$/);
 if(cond){if(!Object.hasOwn(w.vars,cond[1]))throw Error('Unknown state variable '+cond[1]+'.');conditions.push({var:cond[1],op:({'at least ':'gte','above ':'gt','below ':'lt'})[cond[2]]||'eq',value:+cond[3]});body=body.slice(0,cond.index)}
 for(const part of body.split(/\s+and(?: then)?\s+/)){
 const change=part.match(/^(light|open|raise|activate|close|dim|extinguish|lower) (.+?)(?: for (\d+) seconds?)?$/);
 const count=part.match(/^(increment|increase|decrement|decrease|set) ([a-z][a-z0-9_]*)(?: (?:by|to) (-?\d+))?$/);
 const msg=part.match(/^say ["“]([^"”]+)["”]$/);
 if(change){const on=/^(light|open|raise|activate)$/.test(change[1]),targets=objects(change[2]);actions.push(...targets.map(e=>({op:'light',id:e.id,value:on})));
 if(change[3]){const id='expiry_'+(w.revision+1)+'_'+actions.length;actions.push({op:'timer',id,value:+change[3]});p.rules.push({id,name:'Restore '+change[2],event:'timer',target:id,conditions:[],actions:targets.map(e=>({op:'light',id:e.id,value:!on}))})}}
 else if(count){const id=count[2];p.vars[id]=0;actions.push({op:count[1]==='set'?'set':'add',id,value:(count[1].startsWith('de')?-1:1)*Number(count[3]??1)})}
 else if(msg)actions.push({op:'say',value:msg[1]});
 else throw Error('Local event actions support light, open, close, increment, set, and say.')}
 p.title=source[0].name+' · '+event;p.rules.push({id:'event_'+(w.revision+1),name:p.title,event,target:source[0].id,conditions,actions});return p
}
