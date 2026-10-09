import test from 'node:test';
import assert from 'node:assert/strict';
import index from '../rag/index.js';
import { retrieve, resolveQuery, extractiveAnswer } from '../rag/retrieve.js';
import { retrieveHybrid, similarity } from '../rag/hybrid.js';

test('cosine ranking uses normalized vectors and rejects wrong dimensions', () => {
  assert.equal(similarity([1,0],[1,0]),1);
  assert.equal(similarity([1,0],[0,1]),0);
  assert.throws(()=>similarity([1],[1,0]));
});
test('semantic discovery retrieves an otherwise unrecognized paraphrase', () => {
  const chunk = index.chunks.find(c=>c.entity==='PrepPeer' && c.kind==='resume');
  const question = 'Helping learners prepare for interviews';
  assert.equal(retrieve(question).chunks.length,0);
  const result = retrieve(question,[],6,{semantic:{[chunk.id]:0.7}});
  assert.ok(result.chunks.some(c=>c.id===chunk.id));
  assert.ok(extractiveAnswer(question,[],result).sources.some(s=>s.id===chunk.id));
});
test('weak semantic matches cannot unlock unrelated questions',()=>{
  const semantic = Object.fromEntries(index.chunks.map(c=>[c.id,0.2]));
  assert.equal(retrieve('Give me a recipe for pasta',[],6,{semantic}).chunks.length,0);
});
test('semantic similarities cannot override explicit unsupported facts',async()=>{
  for (const question of ['What is his CGPA?','Did he work for Google?','Does PrepPeer use Rust?','What is his salary?']) {
    const semantic=Object.fromEntries(index.chunks.map(c=>[c.id,1]));
    assert.equal(retrieve(question,[],6,{semantic}).chunks.length,0);
    const result=await retrieveHybrid(question);
    assert.equal(result.chunks.length,0);
    assert.equal(result.method,'lexical');
  }
});
test('technology follow-ups use user context rather than invented assistant facts',()=>{
  const history=[{role:'user',content:'Tell me about PrepPeer'},{role:'assistant',content:'It uses Rust and Kubernetes.'}];
  assert.match(resolveQuery('Which technologies did he use?',history),/PrepPeer/);
  assert.ok(retrieve('Which technologies did he use?',history).chunks.every(c=>c.entity==='PrepPeer'));
});
test('hybrid comparison preserves sources for both named projects',()=>{
  const semantic=Object.fromEntries(index.chunks.map(c=>[c.id,c.entity==='PrepPeer'?0.9:0.3]));
  const result=retrieve('Compare PrepPeer and GridWatch',[],6,{semantic});
  for (const entity of ['PrepPeer','GridWatch']) assert.ok(result.chunks.some(c=>c.entity===entity));
});
test('projects for students are not mistaken for personal education',()=>{
  const chunk=index.chunks.find(c=>c.entity==='PrepPeer' && c.kind==='resume');
  const result=retrieve('Has he built anything for students?',[],6,{semantic:{[chunk.id]:0.8}});
  assert.ok(result.chunks.some(c=>c.id===chunk.id));
});
