import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {validateGroundedOutput} from '../rag/grounding.js';
import {validateAssistantReply} from '../rag/conversation.js';
const read=name=>fs.readFileSync(new URL(`../training/v2/${name}`,import.meta.url),'utf8');
const splits=Object.fromEntries(['train','validation','test','regression'].map(name=>[name,read(`${name}.jsonl`).trim().split('\n').map(JSON.parse)]));
test('V2 families and questions remain disjoint across splits',()=>{
 const all=Object.values(splits).flat();
 assert.equal(new Set(all.map(row=>row.question.toLowerCase().trim())).size,all.length);
 for(const [name,rows] of Object.entries(splits)) {
  const others=Object.entries(splits).filter(([key])=>key!==name).flatMap(([,items])=>items);
  const families=new Set(others.map(row=>row.family));
  for(const row of rows)assert.ok(!families.has(row.family),row.id);
 }
});
test('V2 targets use the live JSON schemas and exact factual evidence',()=>{
 for(const row of Object.values(splits).flat()) {
  assert.match(row.prompt,/JSON/i,row.id);
  if(row.task==='rag')assert.ok(validateGroundedOutput(row.output,row.documents),row.id);
  else assert.ok(validateAssistantReply(JSON.stringify(row.output)),row.id);
 }
});
test('V2 withheld factual passages never enter training',()=>{
 const trainIds=new Set(splits.train.flatMap(row=>row.documents.map(doc=>doc.id)));
 for(const row of [...splits.validation,...splits.test])for(const doc of row.documents)assert.ok(!trainIds.has(doc.id),row.id);
});
test('V2 notebook is clean and embeds the frozen manifest',()=>{
 const notebook=JSON.parse(read('Rajat_Assistant_V2.ipynb'));
 const fingerprint=JSON.parse(read('manifest.json')).fingerprint;
 assert.ok(notebook.cells.map(cell=>cell.source.join('')).join('\n').includes(fingerprint));
 for(const cell of notebook.cells.filter(cell=>cell.cell_type==='code')){
  assert.equal(cell.execution_count,null);assert.deepEqual(cell.outputs,[]);
 }
});
test('V2 candidate cannot be automatically deployed by a high proxy score',()=>{
 const source=read('train.py');
 assert.match(source,/'human_review_complete':False/);
 assert.match(source,/'deployment_approved':False/);
 assert.match(source,/trained_validation=evaluate\('validation'\);trained_test=evaluate\('test'\)/);
 assert.match(source,/adapter_digest_before/);
 assert.ok(splits.test.some(row=>row.checks.critical));
});
