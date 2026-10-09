import fs from 'node:fs';
import cases from '../tests/questions.mjs';
import hallucinations from '../tests/hallucination-cases.mjs';
import { retrieve } from '../rag/retrieve.js';
import index from '../rag/index.js';

const live = process.argv.includes('--live');
const args = process.argv.slice(2);
const value = (name, fallback) => args.includes(name) ? args[args.indexOf(name)+1] : fallback;
const corpus = process.argv.includes('--hallucinations') ? hallucinations : cases;
const limit = Number(value('--limit', corpus.length));
const endpoint = value('--endpoint', 'https://rajat77a-github-io.vercel.app/api/chat');
const ids=value('--ids','').split(',').filter(Boolean);
const selected = (ids.length ? corpus.filter(item=>ids.includes(item.id)) : corpus).slice(0,limit);
const results = [];
for (const item of selected) {
  const retrieval = retrieve(item.question,item.history);
  let response;
  if (live) {
    const start = Date.now();
    try {
      const http = await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:item.question,history:item.history||[],mode:'default'}),signal:AbortSignal.timeout(20000)});
      response = {...await http.json(),httpStatus:http.status,latencyMs:Date.now()-start};
    } catch(error) { response = {error:error.name,latencyMs:Date.now()-start}; }
  }
  const text = retrieval.chunks.map(chunk=>chunk.text).join('\n').toLowerCase();
  const issues=[];
  if (item.evidence && !text.includes(item.evidence.toLowerCase())) issues.push('missing retrieval evidence');
  if (item.entities && !item.entities.every(entity=>retrieval.chunks.some(chunk=>(chunk.entity||'').includes(entity)))) issues.push('missing comparison project');
  // Document-backed unknowns need model abstention, not necessarily empty retrieval.
  if (item.abstain && !retrieval.chunks.length) { /* expected */ }
  if (response) {
    if (response.error || response.httpStatus!==200) issues.push('request failed');
    else {
      const answer=String(response.answer||'');
      if (!answer) issues.push('empty answer');
      if (item.abstain && !/couldn't find|cannot confirm|can't confirm|not documented|no (?:evidence|information)|can't change|can't.*share|can help with Rajat/i.test(answer)) issues.push('review unsupported answer');
      if (!item.abstain && !response.sources?.length) issues.push('missing answer citations');
      if (item.forbidden?.some(term=>new RegExp(`\\b${term}\\b`,'i').test(answer))) issues.push('poisoned history term in answer');
      for (const source of response.sources||[]) {
        const chunk=index.chunks.find(chunk=>chunk.id===source.id);
        const compact=s=>String(s).replace(/\s+/g,' ').trim();
        if (!chunk || !compact(chunk.text).includes(compact(source.quote))) issues.push('invalid quote');
      }
    }
  }
  results.push({...item,issues,retrieved:retrieval.chunks.map(chunk=>chunk.id),reason:retrieval.reason,...(response?{response}:{})});
  if (live) console.log(`${item.id}: ${issues.length?issues.join(', '):'structural checks passed'} (${response.latencyMs}ms)`);
}
const fallbackReasons={};
for(const item of results) if(item.response?.fallbackReason) fallbackReasons[item.response.fallbackReason]=(fallbackReasons[item.response.fallbackReason]||0)+1;
const summary={kind:live?'live':'retrieval',total:results.length,passed:results.filter(r=>!r.issues.length).length,flagged:results.filter(r=>r.issues.length).length,...(live?{fallbackReasons}:{}),at:new Date().toISOString(),note:'Automated evidence/quotation checks are not semantic correctness judgments; live answers require human review.'};
const file=value('--output','rag-evaluation.json');
fs.writeFileSync(file,JSON.stringify({summary,results},null,2));
console.log(JSON.stringify(summary));
if (!live) results.filter(r=>r.issues.length).forEach(r=>console.log(`${r.id}: ${r.question} — ${r.issues.join(', ')}`));
