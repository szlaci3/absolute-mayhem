import test from 'node:test';
import assert from 'node:assert/strict';
import {applyPatch,initial,move,interact,tick} from '../public/engine.js';
import {examples,localEdit} from '../public/local.js';
import {generate,models} from '../provider.js';
test('transaction rejects missing references after valid changes',()=>{const w=initial(),before=structuredClone(w),p=localEdit(examples[0],w);p.rules[0].target='unknown';assert.throws(()=>applyPatch(w,p));assert.deepEqual(w,before)});
test('composed interaction, timer, follow-up, checkpoint and reload',()=>{let w=initial();w.player.y=6;interact(w,'beacon');const p=localEdit(examples[0],w);w=applyPatch(w,p);const bell=p.entities[0];w.player={x:bell.x,y:bell.y};assert.ok(interact(w,bell.id));assert.ok(w.entities.span_a.on);tick(w);const before=structuredClone(w);w=applyPatch(w,localEdit(examples[1],w));assert.deepEqual(w.player,before.player);assert.deepEqual(w.timers,before.timers);assert.equal(w.vars.flame,1);w=JSON.parse(JSON.stringify(w));while(w.time<8)tick(w);assert.equal(w.entities.span_b.on,false);interact(w,bell.id);assert.equal(w.timers.local_span,w.time+15)});
test('entry action counts footsteps',()=>{let w=initial();const p=localEdit('Add a pressure plate at 4,5 that counts footsteps',w);w=applyPatch(w,p);assert.ok(move(w,1,0));assert.equal(w.vars.plate_1_count,1)});
test('provider fixture classifies HTTP and schema failures; reports returned model',async()=>{const old=process.env.GEMINI_API_KEY;process.env.GEMINI_API_KEY='test-placeholder';try{const w=initial();for(const [code,kind] of [[429,'quota'],[404,'model/provider'],[403,'access']])await assert.rejects(generate(models[0],'test',w,async()=>new Response(null,{status:code})),e=>e.kind===kind);const fixture=p=>async()=>Response.json({modelVersion:'fixture-response',candidates:[{content:{parts:[{text:JSON.stringify(p)}]}}]});await assert.rejects(generate(models[1],'test',w,fixture({})),e=>e.kind==='invalid output');assert.equal((await generate(models[1],'test',w,fixture(localEdit(examples[0],w)))).model,'fixture-response')}finally{if(old===undefined)delete process.env.GEMINI_API_KEY;else process.env.GEMINI_API_KEY=old}});
test('local event language composes counters, gates, conditions and delayed actions',()=>{let w=initial();for(const text of ['Add a bell at 4,5','Add a gate at 5,5','When I ring the bell, increment charge by 1','When I ring the bell, open the gate for 2 seconds only if charge is at least 1'])w=applyPatch(w,localEdit(text,w));interact(w,'bell_1');assert.equal(w.vars.charge,1);assert.equal(w.entities.gate_2.on,false);interact(w,'bell_1');assert.equal(w.entities.gate_2.on,true);tick(w);tick(w);assert.equal(w.entities.gate_2.on,false);assert.equal(w.trace.at(-1).event,'timer')});

test('Antigravity uses the final Interactions output as the world patch', async t => {
 const agent = 'antigravity-preview-09-2026';
 const world = initial();
 const patch = localEdit(examples[0], world);
 const previousKey = process.env.GEMINI_API_KEY;
 process.env.GEMINI_API_KEY = 'fixture-placeholder';
 t.after(() => {
   if (previousKey === undefined) delete process.env.GEMINI_API_KEY;
   else process.env.GEMINI_API_KEY = previousKey;
 });
 const transport = async (url, options) => {
   assert.equal(url, 'https://generativelanguage.googleapis.com/v1beta/interactions');
   const payload = JSON.parse(options.body);
   assert.equal(payload.agent, agent);
   assert.ok(payload.input.includes(examples[0]));
   return Response.json({status:'completed', steps:[
     {type:'thought', summary:[]},
     {type:'model_output', content:[{type:'text', text:'Working on it.'}]},
     {type:'model_output', content:[{type:'text', text:JSON.stringify(patch)}]}
   ]});
 };
 assert.deepEqual(await generate(agent, examples[0], world, transport), {patch, model:agent});
});
