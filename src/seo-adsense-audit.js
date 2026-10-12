'use strict';
const fs=require('node:fs'),path=require('node:path');
const strip=s=>String(s||'').replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,' ').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,' ').replace(/<[^>]+>/g,' ').replace(/&(?:nbsp|amp|lt|gt|quot);/gi,' ').replace(/\s+/g,' ').trim();
const tag=(s,name)=>{const m=s.match(new RegExp('<'+name+'\\b[^>]*>([\\s\\S]*?)<\\/'+name+'>','i'));return m?strip(m[1]):''};
const attr=(s,name)=>{const m=s.match(new RegExp('\\b'+name+'\\s*=\\s*["\x27]([^"\x27]*)["\x27]','i'));return m?m[1]:''};
function auditHtml(html,file='index.html'){
 const findings=[],add=(category,severity,code,message,confidence='observed')=>findings.push({category,severity,code,message,file,confidence});
 const title=tag(html,'title'),description=attr((html.match(/<meta\b[^>]*name=["']description["'][^>]*>/i)||[])[0]||'','content');
 const canonical=(html.match(/<link\b[^>]*rel=["']canonical["'][^>]*>/i)||[])[0]||'';
 const robots=(html.match(/<meta\b[^>]*name=["']robots["'][^>]*>/i)||[])[0]||'';
 const headings=[...html.matchAll(/<h1\b[^>]*>/gi)].length;
 const body=strip((html.match(/<body\b[^>]*>([\s\S]*?)<\/body>/i)||[])[1]||html);
 const words=body.split(/\s+/).filter(Boolean).length;
 if(!title)add('seo','error','SEO_TITLE_MISSING','Page title missing');
 else if(title.length<20||title.length>65)add('seo','warning','SEO_TITLE_LENGTH','Title length outside suggested 20–65 character review range','heuristic');
 if(!description)add('seo','warning','SEO_META_DESCRIPTION','Missing meta description');
 if(!canonical)add('seo','info','SEO_CANONICAL_REVIEW','Canonical URL not declared; review for this route','heuristic');
 if(headings!==1)add('seo','warning','SEO_H1_COUNT','Expected one clear H1; found '+headings,'heuristic');
 if(/noindex/i.test(robots))add('seo','warning','SEO_NOINDEX','Page declares noindex');
 if(!/\b(?:lang)=["'][a-z]/i.test(html))add('seo','warning','SEO_HTML_LANG','HTML language not declared');
 if(words<150)add('content','warning','CONTENT_REVIEW','Low visible static text ('+words+' words). Dynamic content may not be represented.','heuristic');
 if(/adsbygoogle|ca-pub-\d+/i.test(html)){
   if(/data-ad-client\s*=\s*["']\s*["']/i.test(html))add('adsense','warning','ADSENSE_EMPTY_CLIENT','AdSense client identifier is empty');
   add('adsense','info','ADSENSE_SCRIPT_PRESENT','AdSense integration detected; confirm placement and policy compliance manually','observed');
 }
 if(/(?:click here to support us|click our ads|please click ads)/i.test(body))add('adsense','error','ADSENSE_CLICK_INCENTIVE','Possible prohibited encouragement to click advertisements','heuristic');
 if(/<a\b[^>]*href=["']#["']/i.test(html))add('usability','warning','PLACEHOLDER_NAV','Placeholder navigation link found');
 for(const p of ['privacy','contact','about'])if(!new RegExp(p,'i').test(body))add('trust','info','TRUST_'+p.toUpperCase()+'_REVIEW','Review visibility of '+p+' information; not a universal mandatory page','heuristic');
 return {file,metrics:{titleLength:title.length,wordCount:words,h1Count:headings},findings};
}
function auditProject(root,{maxFiles=2000,maxBytes=2e6}={}){
 const pages=[],errors=[],queue=[root];let visited=0;
 while(queue.length&&visited<maxFiles){const dir=queue.pop();let entries;try{entries=fs.readdirSync(dir,{withFileTypes:true})}catch(e){errors.push(e.message);continue}
 for(const ent of entries){if(visited>=maxFiles)break;if(ent.isSymbolicLink()||['node_modules','.git','dist','.next','build'].includes(ent.name))continue;const f=path.join(dir,ent.name);if(ent.isDirectory()){queue.push(f);continue}visited++;if(!/\.html?$/i.test(ent.name))continue;try{if(fs.statSync(f).size>maxBytes)continue;pages.push(auditHtml(fs.readFileSync(f,'utf8'),path.relative(root,f)))}catch(e){errors.push(String(e.message))}}
 }
 const findings=pages.flatMap(p=>p.findings);return {kind:'heuristic-preflight',pagesScanned:pages.length,findings,errors,disclaimer:'Not a Google approval prediction. Static inspection cannot assess originality, copyright, live indexing, or policy decisions.'};
}
module.exports={auditHtml,auditProject};
