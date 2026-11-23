import {ground,at} from './engine.js';
const W=760,H=420,tw=24,th=10;
export const project=(x,y)=>[315+(x-y)*tw,95+(x+y)*th];
const noise=(a,b)=>{const t=Math.sin(a*127.1+b*311.7)*43758.5453;return t-Math.floor(t)};
export function createScene(canvas){
 canvas.width=W;canvas.height=H;const c=canvas.getContext('2d');c.imageSmoothingEnabled=false;
 const rect=(x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),w,h)};
 const poly=(pts,color)=>{c.fillStyle=color;c.beginPath();pts.forEach(([x,y],i)=>i?c.lineTo(Math.round(x),Math.round(y)):c.moveTo(Math.round(x),Math.round(y)));c.closePath();c.fill()};
 const line=(x,y,a,b,col,size=1)=>{c.strokeStyle=col;c.lineWidth=size;c.beginPath();c.moveTo(x,y);c.lineTo(a,b);c.stroke()};
 const ring=(x,y,rx,ry,col,rot=0,width=1)=>{c.beginPath();c.ellipse(x,y,rx,ry,rot,0,Math.PI*2);c.strokeStyle=col;c.lineWidth=width;c.stroke()};
 const glow=(x,y,r,col)=>{let g=c.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,col);g.addColorStop(1,'transparent');c.fillStyle=g;c.fillRect(x-r,y-r,2*r,2*r)};
 const block=(x,y,a,b,h,top,left,right)=>{poly([[x-a,y],[x,y+b],[x,y+b+h],[x-a,y+h]],left);poly([[x,y+b],[x+a,y],[x+a,y+h],[x,y+b+h]],right);poly([[x-a,y],[x,y-b],[x+a,y],[x,y+b]],top)};
 function pillar(x,y,h,s=1){block(x,y-5*s,10*s,4*s,5*s,'#778776','#334c48','#233c39');block(x,y-h,6*s,2.5*s,h-4*s,'#92a99a','#526d63','#364d47');line(x-4*s,y-h+3,x-4*s,y-6*s,'#819184');block(x,y-h-3*s,9*s,3*s,4*s,'#849689','#586c61','#3c534c')}
 function arch(x,y,h,s){pillar(x-22*s,y,h,s);pillar(x+22*s,y,h,s);for(let i=0;i<13;i++){const a=Math.PI+i*Math.PI/13,b=a+Math.PI/13-.012;poly([[x+29*s*Math.cos(a),y-h+33*s*Math.sin(a)],[x+29*s*Math.cos(b),y-h+33*s*Math.sin(b)],[x+18*s*Math.cos(b),y-h+21*s*Math.sin(b)],[x+18*s*Math.cos(a),y-h+21*s*Math.sin(a)]],['#6b8276','#768d7f','#526e64'][i%3])}}
 function dome(x,y,s){
 for(const off of [-35,-15,15,35])pillar(x+off*s,y-Math.abs(off)*.10*s,34*s,.75*s);
 block(x,y-35*s,46*s,12*s,5*s,'#889183','#45584e','#30483f');
 for(let i=0;i<12;i++){const a=-Math.PI/2+i*Math.PI/12,b=a+Math.PI/12;const px=u=>x+Math.sin(u)*44*s;poly([[x,y-91*s],[px(a)*.45+x*.55,y-82*s],[px(a)*.83+x*.17,y-66*s],[px(a),y-43*s+Math.cos(a)*8*s],[px(b),y-43*s+Math.cos(b)*8*s],[px(b)*.83+x*.17,y-66*s],[px(b)*.45+x*.55,y-82*s]],['#536f63','#658579','#577c71','#477166','#3f685f','#477367','#3e635b','#345a53','#32534c','#294b47','#2b4c45','#29443f'][i]);line(px(a),y-43*s+Math.cos(a)*8*s,px(a)*.83+x*.17,y-66*s,'#8c9272')}
 rect(x-1,y-109*s,2,18*s,'#c9a06a');ring(x,y-98*s,5*s,5*s,'#ba9b68');rect(x-2,y-111*s,4,3,'#f4bf80')
 }
 const base=document.createElement('canvas');base.width=W;base.height=H;
 function landscape(){
 const g=c.createLinearGradient(0,0,0,H);g.addColorStop(0,'#102622');g.addColorStop(.36,'#213e37');g.addColorStop(.6,'#183b35');g.addColorStop(1,'#0c2424');c.fillStyle=g;c.fillRect(0,0,W,H);
 glow(390,128,230,'#81966f48');
 // The observatory's setting moon and survey constellation.
 glow(555,62,62,'#f5ce9738');c.fillStyle='#d9c9a4';c.beginPath();c.arc(555,57,16,0,Math.PI*2);c.fill();c.fillStyle='#253e35';c.beginPath();c.arc(561,52,15,0,Math.PI*2);c.fill();
 const stars=[[80,62],[106,49],[127,65],[145,41],[177,50]];stars.forEach(([x,y],i)=>{if(i)line(...stars[i-1],x,y,'#a9b49944');rect(x-1,y-1,2,2,'#d9d3ae')});
 for(let i=0;i<100;i++){const x=noise(i,4)*W,y=noise(i,9)*130;rect(x,y,1,1,'#91a58b')}
 for(let i=0;i<44;i++){const x=i*20+noise(i,1)*14,y=125+noise(i,3)*30,h=20+noise(i,2)*72;rect(x,y-h,5+noise(i,5)*14,h,'#1c3430');if(i%4===0){poly([[x-8,y-h],[x+6,y-h-18],[x+20,y-h]],'#203a33');rect(x+5,y-h-27,2,10,'#31483a')}}
 for(let i=0;i<2800;i++){let x=noise(i,1)*W,y=137+noise(i,3)*(H-137);rect(x,y,1+noise(i,6)*15,1,['#45685a55','#51796366','#69877444','#122c2990'][i%4])}
 for(const [x,y,h,s] of [[74,185,29,.6],[652,193,42,.7],[590,152,28,.55],[116,300,18,.75],[665,255,21,.65]]){arch(x,y,h,s);ring(x,y+4,33*s,5*s,'#75958155')}
 for(let i=0;i<38;i++){const x=noise(i,72)*W,y=160+noise(i,76)*250;if(x>174&&x<580&&y<320)continue;block(x,y,4+noise(i,9)*11,4,4,'#51695b','#253f37','#203b34');if(i%4===0)pillar(x,y,8+noise(i,84)*18,.65)}
 for(let sum=0;sum<29;sum++)for(let x=0;x<15;x++){let y=sum-x;if(!ground(x,y))continue;let [a,b]=project(x,y);let n=noise(x,y);block(a,b,tw,th,17,['#819083','#78887b','#748477','#869385','#708477'][Math.floor(n*5)],'#465c50','#304c43');
 if(!ground(x+1,y)){line(a,b+th+4,a+tw,b+4,'#667662');rect(a+2,b+th+5,2,8,'#324a40')}
 if(!ground(x,y+1)){line(a-tw,b+4,a,b+th+4,'#76816c');rect(a-14,b+10,2,9,'#30473f')}
 for(let j=0;j<18;j++){const u=noise(x*33+j,y),v=noise(y*23+j,x+3);rect(a+(u-v)*21,b+(u+v-1)*8,1+noise(j,x)*4,1,j%3?'#425f4e55':'#c0c2a66a')}
 if(n>.64){line(a-8,b-4,a-3,b-1,'#506856');line(a-3,b-1,a-6,b+1,'#506856')}
 }
 // Terraced pavilion and broken colonnade.
 let [a,b]=project(3,2);block(a,b-2,43,14,7,'#8b9987','#596c5d','#42594f');dome(a,b-7,.96);
 for(const [x,y,h] of [[1,4,29],[1,6,14],[1,8,32],[4,8,8],[7,8,17],[10,2,28],[13,6,22]]){let [a,b]=project(x,y);pillar(a,b,h,.9)}
 ;[a,b]=project(12,2);arch(a,b,30,.78);
 for(const [x,y] of [[2,8],[6,8],[11,6],[1,5],[10,3],[5,2]]){const [a,b]=project(x,y);for(let i=0;i<12;i++){let s=noise(i,x)*20-10;line(a+s,b,a+s+noise(i,y)*7-4,b-4-noise(i,8)*10,'#435f46',2)}}
 base.getContext('2d').drawImage(canvas,0,0)
 }
 landscape();
 function object(e,t,near){
 let [x,y]=project(e.x,e.y);let col=e.on?'#ffdc8a':'#d4a063';
 if(e.kind==='bridge'){if(e.on){block(x,y,tw,th,5,'#abb787','#727b57','#525f46');line(x-20,y,x,y+8,'#ebd798');line(x,y+8,x+20,y,'#ebd798')}else{ring(x,y+12,9,3,'#7caa8850')}return}
 if(e.kind==='lamp'){block(x,y-3,10,4,4,'#a99c7d','#536453','#445748');rect(x-2,y-21,4,18,'#a38c5b');block(x,y-21,7,3,3,'#edbd7b','#b68952','#806841');rect(x-4,y-32,8,11,'#ffcc70');rect(x-2,y-31,3,9,'#ffefaf');poly([[x-7,y-32],[x,y-39],[x+7,y-32]],'#a88859');glow(x,y-26,e.on?36:20,'#ffbd5a70')}
 else if(e.kind==='relic'){block(x,y-3,19,8,5,'#a8a182','#655e4d','#4d5144');block(x,y-9,12,5,7,'#9f9169','#7c7256','#585e49');rect(x-2,y-25,4,16,'#bd9c60');for(let i=0;i<3;i++)ring(x,y-30,16-i,6+i,col,(i-1)*.8+(e.on?t*.0004:0),2);rect(x-3,y-33,6,6,'#edcb87');if(e.on)glow(x,y-30,45,'#ffd97566')}
 else if(e.kind==='gate'){pillar(x-8,y,16,.55);pillar(x+8,y,16,.55);if(!e.on)for(let k=-6;k<=6;k+=4)rect(x+k,y-17,2,17,'#b59c72')}
 else if(e.kind==='plate'){block(x,y-2,14,5,3,e.on?'#cab776':'#948d78','#696d59','#45574b');ring(x,y-2,6,2,'#dfc48a')}
 else if(e.kind==='bell'){block(x,y-3,10,4,4,'#a9a187','#68705c','#425949');rect(x-6,y-24,2,20,'#7d7560');rect(x-6,y-24,15,2,'#c6b288');poly([[x+2,y-21],[x+6,y-21],[x+9,y-12],[x-1,y-12]],e.on?'#ffdc87':'#c1a267');rect(x+3,y-12,2,3,'#b4a47c')}
 else {block(x,y-4,10,5,5,'#9b9e88','#657561','#465f51');poly([[x,y-29],[x+6,y-17],[x,y-8],[x-6,y-17]],e.kind==='prism'?'#b3d5ba':'#f5aa77');poly([[x,y-29],[x+6,y-17],[x,y-8]],'#668d7c');ring(x,y-17,11,4,'#ccab70',-.5);if(e.on)glow(x,y-18,25,'#d1f3ab70')}
 if(near){rect(x-2,y-46,4,4,'#f8eaca')}
 }
 function beam(a,b,t){const [x,y]=project(a.x,a.y),[u,v]=project(b.x,b.y);line(x,y-22,u,v-18,'#f3db9466',2);for(let i=0;i<5;i++){const f=(i/5+t*.00015)%1;rect(x+(u-x)*f,y-22+(v-y+4)*f,2,1,'#fff1b1')}}
 function player(p){let [x,y]=project(p.x,p.y);ring(x,y+1,9,3,'#ccdfba');rect(x-5,y-6,4,7,'#2a372f');rect(x+2,y-5,3,6,'#29352f');poly([[x-5,y-19],[x+4,y-19],[x+8,y-5],[x-8,y-6]],'#dc815a');rect(x-5,y-19,4,10,'#f1ad78');rect(x-4,y-26,8,8,'#dcc9a1');rect(x-5,y-28,9,4,'#403e34');rect(x-7,y-25,13,2,'#776147');rect(x+1,y-24,2,2,'#544536');line(x+8,y-12,x+8,y-1,'#bd9a68',2)}
 return {draw(w,t,hover){c.drawImage(base,0,0);for(let i=0;i<70;i++){const x=noise(i,11)*W,y=165+noise(i,13)*244;if(x>150&&x<620&&y<320)continue;rect(x+Math.sin(t*.0006+i)*4,y,4,1,'#9bb39a55')}
 if(hover){const [x,y]=project(hover.x,hover.y);poly([[x-tw,y],[x,y-th],[x+tw,y],[x,y+th]],'#e4e8be35')}
 if(w.vars.aligned)beam(w.entities.beacon,w.entities.lens,t);if(w.vars.awake){beam(w.entities.lens,w.entities.orrery,t);for(let i=0;i<38;i++){const [x,y]=project(12,4);const h=(i*7+t*.025)%155;rect(x+Math.sin(i*8+h*.022)*(6+h*.26),y-28-h,2,2,'#ffe9ab99')}}
 const items=[...Object.values(w.entities),{...w.player,avatar:true}].sort((a,b)=>a.x+a.y-b.x-b.y);for(const e of items)e.avatar?player(e):object(e,t,Math.abs(w.player.x-e.x)+Math.abs(w.player.y-e.y)<=1);
 const shade=c.createRadialGradient(W/2,H/2,115,W/2,H/2,460);shade.addColorStop(0,'transparent');shade.addColorStop(1,'#03130f98');c.fillStyle=shade;c.fillRect(0,0,W,H)},
 tile(clientX,clientY){const r=canvas.getBoundingClientRect(),px=(clientX-r.left)*W/r.width,py=(clientY-r.top)*H/r.height;const x=Math.round(((px-315)/tw+(py-95)/th)/2),y=Math.round(((py-95)/th-(px-315)/tw)/2);return {x,y}}}
}
