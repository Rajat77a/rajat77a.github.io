import test from 'node:test';
import assert from 'node:assert/strict';
import cases from './hallucination-cases.mjs';
import {retrieve} from '../rag/retrieve.js';
import handler from '../api/chat.js';

for(const item of cases) test(`${item.id}: ${item.question}`,async()=>{
  if(item.evidence) {
    const r=retrieve(item.question,item.history);
    assert.ok(r.chunks.some(c=>c.text.toLowerCase().includes(item.evidence.toLowerCase())));
    return;
  }
  // No model should be asked to fill these unsupported facts, including outages.
  const previous=globalThis.fetch;
  let called=false,result;
  globalThis.fetch=async()=>{called=true;throw new Error('Model must not supply a fabricated premise');};
  try {
    const response={setHeader(){},status(){return this;},json(value){result=value;return value;}};
    await handler({method:'POST',headers:{},body:{message:item.question,history:item.history||[]}},response);
    assert.equal(called,false);
    assert.equal(result.sources.length,0);
  } finally {globalThis.fetch=previous;}
});
