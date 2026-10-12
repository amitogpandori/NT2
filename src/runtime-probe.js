'use strict';
function runtimeProbe(){
 const findings=[],inventory={buttons:0,links:0,forms:0,images:0,controls:0},ids=new Set();
 const add=(severity,code,el,message,confidence='possible')=>findings.push({severity,code,locator:el?.id?'#'+el.id:el?.tagName?.toLowerCase()||'',message,confidence,page:location.href});
 for(const el of document.querySelectorAll('[id]')){if(ids.has(el.id))add('error','DUPLICATE_ID_RUNTIME',el,'Duplicate id: '+el.id,'confirmed');ids.add(el.id)}
 for(const el of document.querySelectorAll('button,[role="button"],input[type="button"],input[type="submit"]')){
  inventory.buttons++;if(el.disabled||el.getAttribute('aria-disabled')==='true'||getComputedStyle(el).display==='none')continue;
  if(el.matches('[role="button"]')&&el.tabIndex<0)add('warning','KEYBOARD_ACCESS',el,'Custom button is not keyboard reachable','confirmed');
  if(!String(el.innerText||el.value||el.getAttribute('aria-label')||el.title||'').trim())add('warning','BUTTON_NO_NAME',el,'No accessible button name');
  add('info','CLICK_TEST_CANDIDATE',el,'Control requires safe runtime verification','unverified');
 }
 for(const el of document.querySelectorAll('a[href]')){inventory.links++;const h=el.getAttribute('href');if(h==='#')add('warning','PLACEHOLDER_LINK',el,'Placeholder link');if(h?.startsWith('#')&&h.length>1&&!document.getElementById(h.slice(1)))add('warning','MISSING_ANCHOR',el,'Missing anchor: '+h,'confirmed')}
 for(const el of document.querySelectorAll('img')){inventory.images++;if(el.complete&&el.naturalWidth===0)add('error','BROKEN_IMAGE',el,'Image failed to load','confirmed');if(!el.hasAttribute('alt'))add('warning','MISSING_IMAGE_ALT',el,'Missing alt attribute','confirmed')}
 inventory.forms=document.querySelectorAll('form').length;inventory.controls=inventory.buttons+inventory.links+inventory.forms;
 return {url:location.href,title:document.title,capturedAt:new Date().toISOString(),inventory,findings,disclaimer:'Read-only scan. No controls clicked.'};
}
const RUNTIME_PROBE_SOURCE='('+runtimeProbe.toString()+')()';
function normalizeRuntimeResult(r){if(!r||!Array.isArray(r.findings)||!r.inventory)throw Error('Invalid runtime probe result');return {...r,findings:r.findings.slice(0,500)}}
module.exports={runtimeProbe,RUNTIME_PROBE_SOURCE,normalizeRuntimeResult};
