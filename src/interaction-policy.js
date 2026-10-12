'use strict';
const RISK=/\b(delete|remove|erase|destroy|wipe|format|purchase|buy|pay|checkout|order|transfer|send|submit|sign[ -]?out|log[ -]?out|unsubscribe|cancel subscription|reset|publish|deploy|upload|install|grant|authorize|revoke|invite)\b/i;
const SENSITIVE=/\b(password|token|secret|credit.?card|payment|bank|otp|2fa|ssn|passport)\b/i;
function classifyControl(c={}){
 const tag=String(c.tag||'').toLowerCase(),type=String(c.type||'').toLowerCase(),label=[c.text,c.ariaLabel,c.title,c.id,c.href,c.action].filter(Boolean).join(' ').slice(0,1000);
 if(c.disabled||c.hidden)return {safe:false,reason:'Not interactable'};
 if(SENSITIVE.test(label)||['password','file','hidden'].includes(type))return {safe:false,reason:'Sensitive control'};
 if(RISK.test(label)||['submit','reset'].includes(type))return {safe:false,reason:'Potentially state-changing action'};
 if(c.external)return {safe:false,reason:'External destination'};
 if(tag==='a'&&/^(mailto:|tel:|javascript:)/i.test(String(c.href||'')))return {safe:false,reason:'Non-navigation link'};
 if(tag==='a'&&c.href)return {safe:true,reason:'Navigation candidate; verify same origin and consent'};
 return {safe:false,reason:'Unknown side effects; do not auto-click'};
}
module.exports={classifyControl};
