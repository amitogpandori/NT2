'use strict';
const fs=require('node:fs'),path=require('node:path');
function scanProject(root,{maxFiles=5000,maxBytes=2097152}={}){
 const issues=[],inventory={files:0,html:0,scripts:0,links:0,buttons:0},files=[];
 const ignored=new Set(['node_modules','.git','dist','build','.next','.cache']);
 const add=(severity,code,file,line,message,confidence='possible')=>issues.push({severity,code,file,line,message,confidence});
 const rel=p=>path.relative(root,p).replace(/\\/g,'/');
 const line=(s,i)=>s.slice(0,i).split('\n').length;
 function walk(dir,depth=0){if(depth>16||files.length>=maxFiles)return;for(const e of fs.readdirSync(dir,{withFileTypes:true})){if(ignored.has(e.name)||e.isSymbolicLink())continue;const p=path.join(dir,e.name);if(e.isDirectory())walk(p,depth+1);else if(/\.(html?|[cm]?js|css|json)$/i.test(e.name)&&fs.statSync(p).size<=maxBytes)files.push(p);if(files.length>=maxFiles)break}}
 walk(root);inventory.files=files.length;
 const htmlFiles=files.filter(f=>/\.html?$/i.test(f));
 for(const f of files){
  const s=fs.readFileSync(f,'utf8');
  if(/\.[cm]?js$/i.test(f)){inventory.scripts++;continue}
  if(!/\.html?$/i.test(f))continue;inventory.html++;
  const ids=new Set();
  for(const m of s.matchAll(/\bid\s*=\s*["']([^"']+)["']/gi)){if(ids.has(m[1]))add('error','DUPLICATE_ID',rel(f),line(s,m.index),'Duplicate ID: '+m[1],'confirmed');ids.add(m[1])}
  for(const m of s.matchAll(/<(a|script|link|img|form)\b[^>]*?\b(href|src|action)\s*=\s*["']([^"']+)["'][^>]*>/gi)){
   const target=m[3];if(m[1].toLowerCase()==='a')inventory.links++;
   if(!target||/^(https?:|mailto:|tel:|data:|javascript:|#|\/\/)/i.test(target))continue;
   let resolved;try{const clean=decodeURIComponent(target.split(/[?#]/)[0]);resolved=clean.startsWith('/')?path.resolve(root,'.'+clean):path.resolve(path.dirname(f),clean)}catch{continue}
   if(!resolved.startsWith(path.resolve(root)+path.sep)||(!fs.existsSync(resolved)&&!fs.existsSync(path.join(resolved,'index.html'))))add('warning','BROKEN_RESOURCE',rel(f),line(s,m.index),'Missing local target: '+target,'possible');
  }
  for(const m of s.matchAll(/<button\b([^>]*)>/gi)){inventory.buttons++;if(!/\bdisabled\b/i.test(m[1]))add('info','BUTTON_REQUIRES_RUNTIME_CHECK',rel(f),line(s,m.index),'Button needs runtime verification','unverified')}
 }
 return {version:'0.4-dev',scannedAt:new Date().toISOString(),inventory,issues,limits:{maxFiles,maxBytes}};
}
module.exports={scanProject};
