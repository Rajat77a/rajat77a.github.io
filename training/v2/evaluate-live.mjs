// Evaluates the deployed application separately from the GPU model candidate.
import fs from 'node:fs/promises';
import index from '../../rag/index.js';
const args=process.argv.slice(2), value=(key,fallback)=>args.includes(key)?args[args.indexOf(key)+1]:fallback;
const rows=(await fs.readFile(new URL('test.jsonl',import.meta.url),'utf8')).trim().split('\n').map(JSON.parse).slice(0,Number(value('--limit',55)));
const out=value('--output','live-v2-benchmark.json'), results=[];
const compact=text=>String(text).replace(/\s+/g,' ').trim();
for(const row of rows){
 const started=Date.now();let response,issues=[];
 try {
  const http=await fetch('https://rajat77a-github-io.vercel.app/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:row.question,history:row.history}),signal:AbortSignal.timeout(30000)});
  response=await http.json();
  if(!http.ok||!response.answer)issues.push('request failed');
  if(response.source==='Service notice')issues.push('model service unavailable');
  const text=String(response.answer||'');
  if(row.task==='rag'){
   const ids=new Set((response.sources||[]).map(source=>source.id));
   if(row.output.claims.some(claim=>!ids.has(claim.source_id)))issues.push('missing expected citation');
   for(const source of response.sources||[]){
    const doc=index.chunks.find(doc=>doc.id===source.id);
    if(!doc||!compact(source.quote)||!compact(doc.text).includes(compact(source.quote)))issues.push('invalid source quote');
   }
  } else if(row.output.kind==='portfolio'){
   if(response.source==='General AI')issues.push('owner question on general route');
  } else if(row.output.kind==='clarification'){
   if(response.source!=='Clarification'||!text.includes('?'))issues.push('missing clarification');
  } else if(!['General AI','Conversation'].includes(response.source))issues.push('wrong general route');
  for(const pattern of row.checks.required||[])if(!new RegExp(pattern,'i').test(text))issues.push('required content absent');
  for(const pattern of row.checks.forbidden||[])if(new RegExp(pattern,'i').test(text))issues.push('forbidden content');
 } catch(error){issues.push(`request error: ${error.name}`);}
 results.push({id:row.id,task:row.task,question:row.question,critical:!!row.checks.critical,issues,response,latencyMs:Date.now()-started,semanticReview:null});
 const summary={total:results.length,passed:results.filter(r=>!r.issues.length).length,criticalFailures:results.filter(r=>r.critical&&r.issues.length).length,note:'Live application task checks, not QLoRA training results or a universal accuracy score.'};
 await fs.writeFile(out,JSON.stringify({summary,results},null,2));
 console.log(`${row.id}: ${issues.length?issues.join(', '):'checks passed'}`);
 if(results.length<rows.length)await new Promise(resolve=>setTimeout(resolve,Number(value('--gap-ms',12000))));
}
