import {cp,mkdir} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {vendorFiles} from './browser-vendor.js';
for(const f of ['server.js','provider.js','public/app.js','public/engine.js','public/scene.js','public/observatory.js','public/local.js'])execFileSync(process.execPath,['--check',f]);
await mkdir('dist/vendor', {recursive:true});
await cp('public','dist',{recursive:true});
for (const [name, source] of Object.entries(vendorFiles)) {
 await cp('node_modules/'+source, 'dist/vendor/'+name);
}
console.log('Built browser client in dist/');
