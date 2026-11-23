// Used only by the browser integration check. No requests leave this process.
import {localEdit} from '../public/local.js';
process.env.GEMINI_API_KEY='fixture-placeholder';
globalThis.fetch=async(url,options)=>{
 if(url.endsWith('/interactions'))return new Response(null,{status:429});
 const request=JSON.parse(JSON.parse(options.body).contents[0].parts[0].text);
 const patch=request.request.startsWith('Add a bell at (4,5)')?localEdit('Add a bell at 4,5 that says "Tide rising"',request.world):localEdit(request.request,request.world);
 return Response.json({modelVersion:'TEST FIXTURE · flash-lite',candidates:[{content:{parts:[{text:JSON.stringify(patch)}]}}]})
};
