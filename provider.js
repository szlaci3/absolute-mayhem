import {initial,guide,applyPatch} from './public/engine.js';
const antigravity = 'antigravity-preview-09-2026';
const hydrogen = 'gemini-4-hydrogen';
const primary = process.env.GEMINI_PRIMARY_MODEL === hydrogen ? hydrogen : antigravity;
export const models = [primary, 'gemini-3.5-flash-lite'];
export const status={selected:models[0],actual:null,reason:'',verified:[],attempts:[]};
export class Fault extends Error {constructor(kind,message){super(message);this.kind=kind}}
export async function generate(model,prompt,world,transport=fetch){
 if(!process.env.GEMINI_API_KEY)throw new Fault('credential','Server Gemini credential is missing.');
 const isAgent = model === antigravity;
 const data = JSON.stringify({world,request:prompt});
 const endpoint = isAgent ? 'interactions' : 'models/'+model+':generateContent';
 const headers = {'content-type':'application/json','x-goog-api-key':process.env.GEMINI_API_KEY};
 if (isAgent) headers['Api-Revision'] = '2026-05-20';
 const payload = isAgent ? {
   agent: model,
   environment: {type:'remote',network:'disabled'},
   tools: [],
   input: guide + '\nReturn the patch directly as JSON without markdown.\n' + data
 } : {
   systemInstruction:{parts:[{text:guide}]},
   contents:[{parts:[{text:data}]}],
   generationConfig:{responseMimeType:'application/json',temperature:0.2}
 };
 let response;
 try {
   response = await transport('https://generativelanguage.googleapis.com/v1beta/'+endpoint, {
     method:'POST',headers,signal:AbortSignal.timeout(isAgent ? 300000 : 25000),body:JSON.stringify(payload)
   });
 } catch {
   throw new Fault('provider','Google API connection failed.');
 }
 if (!response.ok) {
   const code = response.status;
   const kind = code === 429 ? 'quota' : [401,403].includes(code) ? 'access' : 'model/provider';
   throw new Fault(kind,'Google API returned HTTP '+code+' for '+model+'.');
 }
 let patch;
 try {
   const body = await response.json();
   if (isAgent && body.status !== 'completed') {
     throw new Fault('provider','Agent interaction status: '+(body.status || 'unknown'));
   }
   const parts = isAgent
     ? body.steps.findLast(step => step.type === 'model_output').content.filter(part => part.type === 'text')
     : body.candidates[0].content.parts.filter(part => !part.thought);
   const answer = parts.map(part => part.text).join('').trim();
   const fenced = answer.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
   patch = JSON.parse(fenced ? fenced[1] : answer);
   applyPatch(world,patch);
   return {patch,model:isAgent ? model : body.modelVersion || model};
 } catch (error) {
   if (error instanceof Fault) throw error;
   if (patch?.unsupported) throw new Fault('capability','Missing capability: '+patch.unsupported);
   throw new Fault('invalid output','Invalid model patch: '+error.message.slice(0,160));
 }
}
export async function probe(model){const w=initial();const r=await generate(model,'Add a bell at (4,5) that says "Tide rising" when interacted with. Return the complete patch object.',w);const changed=applyPatch(w,r.patch);const bell=Object.values(changed.entities).find(e=>e.kind==='bell'&&e.x===4&&e.y===5);if(!bell||!Object.values(changed.rules).some(s=>s.event==='interact'&&s.target===bell.id&&s.actions.some(a=>a.op==='say')))throw new Fault('invalid output','Probe did not implement the requested bell.');return r.model}
export async function select(){for(const m of models){try{const actual=await probe(m);status.verified.push(m);status.actual=actual;return}catch(e){status.attempts.push({model:m,kind:e.kind,reason:e.message});status.reason=status.attempts.map(a=>a.model+': '+a.kind+' — '+a.reason).join(' / ');if(e.kind==='credential')break}}}
