import fs from 'node:fs/promises';
import { retrieveHybrid } from '../rag/hybrid.js';
const cases = [
  ['Helping learners prepare for interviews', 'PrepPeer'],
  ['Spotting unusual electricity consumption', 'GridWatch'],
  ['Giving parents visibility into progress', 'NextStep.AI'],
  ['Making campus registrations easier', 'University Event Management System'],
  ['Understanding trader behaviour and market mood', 'Bitcoin Sentiment Analysis'],
  ['Creative work for neighbourhood cafes', 'ZedWorks'],
  ['Has he built anything for students?', 'University Event Management System'],
];
const results=[];
for (const [question,entity] of cases) {
  const start=Date.now();
  const result=await retrieveHybrid(question);
  const passed=result.method==='hybrid' && result.chunks.some(c=>(c.entity||'').includes(entity));
  results.push({question,entity,passed,latencyMs:Date.now()-start,...result});
  console.log(JSON.stringify({question,passed,method:result.method,entities:result.chunks.map(c=>c.entity),latencyMs:Date.now()-start}));
}
await fs.writeFile(new URL('../../../semantic-paraphrases.json',import.meta.url),JSON.stringify(results,null,2));
if(results.some(r=>!r.passed)) process.exitCode=1;
