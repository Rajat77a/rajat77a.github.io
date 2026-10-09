import test from 'node:test';
import assert from 'node:assert/strict';
import cases from './questions.mjs';
import index from '../rag/index.js';
import { retrieve, extractiveAnswer } from '../rag/retrieve.js';
import { validateGroundedOutput } from '../rag/grounding.js';

for (const item of cases.filter(item=>!item.abstain)) test(`${item.id}: ${item.question}`,()=>{
  const result=retrieve(item.question,item.history);
  if(item.evidence) assert.ok(result.chunks.some(chunk=>chunk.text.toLowerCase().includes(item.evidence.toLowerCase())));
  if(item.entities) assert.ok(item.entities.every(entity=>result.chunks.some(chunk=>chunk.entity===entity)));
  const fallback=extractiveAnswer(item.question,item.history);
  assert.ok(fallback.sources.length);
  for(const source of fallback.sources) assert.ok(index.chunks.find(chunk=>chunk.id===source.id).text.replace(/\s+/g,' ').includes(source.quote.replace(/\s+/g,' ')));
});
for(const question of ['What accuracy percentage did GridWatch achieve?','How many paying customers does PrepPeer have?','What is NextStep revenue?','Who funded PrepPeer?','What is his date of birth?','Is Rajat a certified penetration tester?']) test(`Missing fact: ${question}`,()=>assert.equal(retrieve(question).chunks.length,0));

test('course attendance does not prove employment at its provider',()=>{
  const source=index.chunks.find(chunk=>chunk.topic==='certifications');
  assert.equal(validateGroundedOutput({claims:[{text:'Rajat worked at Google Cloud.',source_id:source.id,quote:source.text}]},[source]),null);
});
