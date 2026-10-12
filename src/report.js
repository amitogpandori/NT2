'use strict';
function mergeReports({staticReport,runtimePages=[],capturedErrors=[],project='' }={}){
 const issues=[];
 for(const i of staticReport?.issues||[])issues.push({...i,source:'static'});
 for(const p of runtimePages)for(const i of p.findings||[])issues.push({...i,source:'runtime',file:i.page||p.url,line:null});
 for(const e of capturedErrors)issues.push({severity:e.severity||'error',code:e.code||'RUNTIME_ERROR',message:e.message||'',file:e.url||'',line:e.line||null,source:'browser',confidence:'observed'});
 const unique=new Map();for(const i of issues)unique.set([i.source,i.code,i.file,i.locator,i.line,i.message].join('|'),i);
 const a=[...unique.values()];
 return {schemaVersion:1,project,scannedAt:new Date().toISOString(),inventory:{files:staticReport?.inventory?.files||0,pages:runtimePages.length,controls:runtimePages.reduce((n,p)=>n+(p.inventory?.controls||0),0)},summary:{total:a.length,errors:a.filter(x=>x.severity==='error').length,warnings:a.filter(x=>x.severity==='warning').length,unverified:a.filter(x=>x.confidence==='unverified').length},issues:a,limitations:['No automatic destructive clicks','Dynamic wiring requires controlled interaction tests']};
}
const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function toHtml(r){const rows=r.issues.map(i=>'<tr><td>'+escape(i.severity)+'</td><td>'+escape(i.code)+'</td><td>'+escape(i.file||i.page)+'</td><td>'+escape(i.message)+'</td></tr>').join('');return '<!doctype html><meta charset="utf-8"><title>AppLab Report</title><h1>AppLab Diagnostic Report</h1><p>Issues: '+r.issues.length+'</p><table border="1"><tr><th>Severity</th><th>Code</th><th>Location</th><th>Finding</th></tr>'+rows+'</table>'}
function toJson(r){return JSON.stringify(r,null,2)}
module.exports={mergeReports,toHtml,toJson};
