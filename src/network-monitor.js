'use strict';
function scrub(raw){try{const u=new URL(raw);u.username='';u.password='';u.search='';u.hash='';return u.href}catch{return String(raw||'').split('?')[0].slice(0,200)}}
function createNetworkMonitor({limit=600,onFinding=()=>{}}={}){
 const requests=new Map(),findings=[],seen=new Set();let attached=null,handler=null;
 function record(code,severity,message,url,extra={}){url=scrub(url);const key=[code,url,message].join('|');if(seen.has(key))return;seen.add(key);const f={code,severity,message,url,confidence:'observed',source:'network',...extra};findings.push(f);if(findings.length>limit)findings.shift();onFinding(f)}
 function ingest(method,p={}){
 if(method==='Network.requestWillBeSent'){requests.set(p.requestId,{url:scrub(p.request?.url),type:p.type});if(requests.size>limit)requests.delete(requests.keys().next().value)}
 if(method==='Network.responseReceived'&&p.response?.status>=400)record('HTTP_ERROR',p.response.status>=500?'error':'warning','HTTP '+p.response.status,p.response.url,{status:p.response.status});
 if(method==='Network.loadingFailed'&&!p.canceled)record('NETWORK_FAILED','error',p.errorText||'Request failed',requests.get(p.requestId)?.url,{resourceType:p.type});
 if(method==='Runtime.exceptionThrown'){const e=p.exceptionDetails||{};record('JS_EXCEPTION','error',String(e.exception?.description||e.text||'Uncaught exception').slice(0,1500),e.url,{line:e.lineNumber==null?null:e.lineNumber+1})}
 if(method==='Log.entryAdded'&&p.entry?.level==='error')record('BROWSER_LOG_ERROR','error',String(p.entry.text||'').slice(0,1500),p.entry.url);
 }
 async function stop(){const d=attached;attached=null;if(!d)return;if(handler)d.removeListener('message',handler);handler=null;try{if(d.isAttached())d.detach()}catch{}}
 async function start(w){if(attached)await stop();const d=w.debugger;d.attach('1.3');attached=d;handler=(_e,m,p)=>ingest(m,p);d.on('message',handler);try{for(const m of ['Network.enable','Runtime.enable','Log.enable'])await d.sendCommand(m)}catch(e){await stop();throw e}}
 return {start,stop,ingest,getFindings:()=>findings.map(x=>({...x})),clear:()=>{findings.length=0;requests.clear();seen.clear()}};
}
module.exports={scrub,createNetworkMonitor};
