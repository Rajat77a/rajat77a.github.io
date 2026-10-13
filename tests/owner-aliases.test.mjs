import test from 'node:test';
import assert from 'node:assert/strict';
import {requiresPortfolioEvidence} from '../rag/conversation.js';
import {retrieve,missingAnswer} from '../rag/retrieve.js';
for(const question of ['What course and institution are listed for the portfolio owner?',"What company pays the person behind this portfolio?",'Is its author a professional penetration tester?',"What is the owner’s bank balance?"]){
 test(`owner alias stays grounded: ${question}`,()=>assert.equal(requiresPortfolioEvidence(question),true));
}
test('book authors and general ownership concepts remain general questions',()=>{
 for(const question of ['Who is the author of Hamlet?','Explain ownership in Rust','What does a company owner do?'])assert.equal(requiresPortfolioEvidence(question),false);
});
test('academic course and institution retrieve degree evidence',()=>{
 const result=retrieve('What course and institution are listed for the portfolio owner?');
 assert.ok(result.chunks.some(chunk=>chunk.id==='resume-10'));
 assert.ok(result.chunks.every(chunk=>chunk.topic==='education'));
});
test('pay, privacy and professional-status gaps get relevant replies',()=>{
 for(const question of ['What company pays the person behind this portfolio?','Is its author a professional penetration tester?','What is the owner’s bank balance?']){
  assert.equal(retrieve(question).chunks.length,0);
  assert.doesNotMatch(missingAnswer(question),/Which skill or project/i);
 }
 assert.match(missingAnswer('Is its author a professional penetration tester?'),/can't confirm that label/);
 assert.match(missingAnswer('What is the owner’s bank balance?'),/don't disclose/);
});
