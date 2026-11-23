import {initial,guide,applyPatch} from './public/engine.js';
export const models=['gemini-4-hydrogen','gemini-3.5-flash-lite'];
export const status={selected:models[0],actual:null,reason:'',verified:[],attempts:[]};
export class Fault extends Error {constructor(kind,message){super(message);this.kind=kind}}
export async function generate(model,prompt,world,transport=fetch){
 if(!process.env.GEMINI_API_KEY)throw new Fault('credential','Server Gemini credential is missing.');
 let r;try{r=await transport('https://generativelanguage.googleapis.com/v1beta/models/'+model+':generateContent',{method:'POST',headers:{'content-type':'application/json','x-goog-api-key':process.env.GEMINI_API_KEY},signal:AbortSignal.timeout(25000),body:JSON.stringify({systemInstruction:{parts:[{text:guide}]},contents:[{parts:[{text:JSON.stringify({world,request:prompt})}]}],generationConfig:{responseMimeType:'application/json',temperature:0.2}})})}catch{throw new Fault('provider','Google API connection failed.')}
 if(!r.ok)throw new Fault(r.status===429?'quota':[401,403].includes(r.status)?'access':'model/provider','Google API returned HTTP '+r.status+' for '+model+'.');
 let body,patch;try{body=await r.json();patch=JSON.parse(body.candidates[0].content.parts.filter(p=>!p.thought).map(p=>p.text).join(''));applyPatch(world,patch)}catch(e){throw new Fault(patch?.unsupported?'capability':'invalid output',patch?.unsupported?'Missing capability: '+patch.unsupported:'Invalid model patch: '+e.message.slice(0,160))}
 return {patch,model:body.modelVersion||model}
}
export async function probe(model){const w=initial();const r=await generate(model,'Add a bell at (4,5) that says "Tide rising" when interacted with. Return the complete patch object.',w);const changed=applyPatch(w,r.patch);const bell=Object.values(changed.entities).find(e=>e.kind==='bell'&&e.x===4&&e.y===5);if(!bell||!Object.values(changed.rules).some(s=>s.event==='interact'&&s.target===bell.id&&s.actions.some(a=>a.op==='say')))throw new Fault('invalid output','Probe did not implement the requested bell.');return r.model}
export async function select(){for(const m of models){try{const actual=await probe(m);status.verified.push(m);status.actual=actual;return}catch(e){status.attempts.push({model:m,kind:e.kind,reason:e.message});status.reason=status.attempts.map(a=>a.model+': '+a.kind+' — '+a.reason).join(' / ');if(e.kind==='credential')break}}}
