import {select,status} from './provider.js';
await select();console.log(JSON.stringify(status,null,2));if(!status.actual)process.exitCode=1;
