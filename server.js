import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {generate,models,select,status,probe} from './provider.js';
import {vendorFiles} from './browser-vendor.js';
const root=fileURLToPath(new URL(process.env.NODE_ENV==='production'?'./dist/':'./public/',import.meta.url));
const files={'/':'index.html','/app.js':'app.js','/engine.js':'engine.js','/scene.js':'scene.js','/local.js':'local.js','/style.css':'style.css'};
files['/observatory.js']='observatory.js';
for (const [name, source] of Object.entries(vendorFiles)) {
 files['/vendor/'+name] = process.env.NODE_ENV==='production' ? 'vendor/'+name : '../node_modules/'+source;
}
const ready=select();let busy=false,hits=[];
http.createServer(async(req,res)=>{
 const json=(code,v)=>{res.writeHead(code,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(v))};
 try{const path=req.url.split('?')[0];
 if(path==='/api/status'){await ready;return json(200,status)}
 if(path==='/api/edit'&&req.method==='POST'){
 if(req.headers.origin&&new URL(req.headers.origin).host!==req.headers.host)return json(403,{error:'Cross-origin edit denied.'});
 if(req.headers['content-type']!=='application/json')return json(415,{error:'Expected JSON.'});
 let body='';for await(const chunk of req){body+=chunk;if(body.length>100000)return json(413,{error:'Request too large.'})}
 const {prompt,world}=JSON.parse(body);if(typeof prompt!=='string'||prompt.length>1000||!prompt.trim()||!world?.entities)return json(400,{error:'Invalid edit request.'});
 await ready;if(!status.actual)return json(503,{kind:status.attempts.at(-1)?.kind,error:status.reason});
 hits=hits.filter(t=>Date.now()-t<3600000);if(busy||hits.length>=30)return json(429,{kind:'quota',error:'Studio edit limit reached. Try again later.'});
 busy=true;hits.push(Date.now());try{let m=status.verified.at(-1);let result;try{result=await generate(m,prompt,world)}catch(e){if(m!==models[0]||!['quota','model/provider','provider','access','invalid output'].includes(e.kind))throw e;status.reason=m+': '+e.kind+' — '+e.message;await probe(models[1]);status.verified.push(models[1]);result=await generate(models[1],prompt,world)}status.actual=result.model;return json(200,{...result,status})}catch(e){return json(422,{kind:e.kind,error:e.message,status})}finally{busy=false}}
 if(req.method!=='GET'||!Object.hasOwn(files,path)){res.writeHead(404);return res.end()}
 const name=files[path];res.writeHead(200,{'Content-Type':name.endsWith('.js')?'text/javascript':name.endsWith('.css')?'text/css':'text/html','X-Content-Type-Options':'nosniff'});res.end(await readFile(root+name))
 }catch{if(!res.headersSent)json(400,{error:'Unreadable request.'});else res.end()}
}).listen(Number(process.env.PORT||3000),process.env.HOST||'127.0.0.1',()=>console.log('Absolute Mayhem server started.'));
