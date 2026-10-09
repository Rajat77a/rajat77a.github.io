import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import index from '../rag/index.js';
const read = name => fs.readFileSync(new URL(`../training/${name}`, import.meta.url), 'utf8');
const train = read('train.jsonl').trim().split('\n').map(JSON.parse);
const heldout = read('eval.jsonl').trim().split('\n').map(JSON.parse);
const docs = new Map(index.chunks.map(doc => [doc.id, doc]));

test('training evidence matches the current public documents and fingerprint', () => {
  const manifest = JSON.parse(read('manifest.json'));
  assert.equal(manifest.sourceFingerprint, crypto.createHash('sha256').update(JSON.stringify(index.chunks)).digest('hex'));
  for (const row of [...train, ...heldout]) {
    for (const doc of row.documents) assert.equal(doc.text, docs.get(doc.id)?.text, row.id);
    for (const claim of row.output.claims) {
      assert.ok(row.documents.some(doc => doc.id === claim.source_id && doc.text.includes(claim.quote)), row.id);
    }
  }
});

test('checkpoint validation and final tests share no evidence documents or families with training', () => {
  const splits = [train, heldout.filter(row => row.partition === 'validation'), heldout.filter(row => row.partition === 'test')];
  assert.ok(splits.every(rows => rows.length > 0));
  for (let a = 0; a < splits.length; a++) for (let b = a + 1; b < splits.length; b++) {
    const ids = new Set(splits[a].flatMap(row => row.documents.map(doc => doc.id)));
    const families = new Set(splits[a].map(row => row.family));
    for (const row of splits[b]) {
      assert.ok(!families.has(row.family), row.id);
      assert.ok(row.documents.every(doc => !ids.has(doc.id)), row.id);
    }
  }
  const all = [...train, ...heldout];
  assert.equal(new Set(all.map(row => row.question.toLowerCase())).size, all.length);
});

test('behaviour targets include varied clarifications, partial answers and false-premise corrections', () => {
  const types = new Set(train.map(row => row.output.response_type));
  for (const type of ['answer', 'partial', 'clarify', 'missing', 'out_of_scope', 'refuse']) assert.ok(types.has(type));
  assert.ok(new Set(train.filter(row => row.output.response_type === 'missing').map(row => row.output.message)).size >= 5);
  for (const row of [...train, ...heldout]) {
    assert.equal(row.output.supported, ['answer', 'partial'].includes(row.output.response_type));
    assert.equal(row.output.claims.length > 0, row.output.supported);
    if (row.output.response_type === 'answer') assert.equal(row.output.message, null);
    else assert.ok(typeof row.output.message === 'string' && row.output.message.length > 0);
    assert.ok(!JSON.stringify(row.output).toLowerCase().includes('minnal'));
  }
  assert.ok(train.some(row => row.family === 'correct-grid-premise' && row.output.claims[0].text.includes('simulated')));
});

test('poisoned assistant history never becomes evidence for the correct response', () => {
  const row = heldout.find(row => row.family === 'heldout-poisoned-history');
  assert.ok(row.history.some(message => message.role === 'assistant' && message.content.includes('bank accounts')));
  assert.ok(!JSON.stringify(row.output).includes('bank accounts'));
  assert.ok(row.output.claims[0].quote.includes('class-level patterns'));
});

test('published notebook embeds the current reviewed data and has no executed training outputs', () => {
  const notebook = JSON.parse(read('Rajat_Assistant_QLoRA.ipynb'));
  const source = notebook.cells.map(cell => cell.source.join('')).join('\n');
  const manifest = JSON.parse(read('manifest.json'));
  assert.ok(source.includes(manifest.sourceFingerprint));
  assert.ok(source.includes(`${manifest.train} training examples`));
  assert.ok(source.includes('Qwen/Qwen3-4B'));
  for (const cell of notebook.cells.filter(cell => cell.cell_type === 'code')) {
    assert.equal(cell.execution_count, null);
    assert.deepEqual(cell.outputs, []);
  }
});
