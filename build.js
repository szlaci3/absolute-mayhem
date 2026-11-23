import {cp,mkdir} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
for(const f of ['server.js','provider.js','public/app.js','public/engine.js','public/scene.js','public/local.js'])execFileSync(process.execPath,['--check',f]);
await mkdir('dist',{recursive:true});await cp('public','dist',{recursive:true});console.log('Built browser client in dist/');
