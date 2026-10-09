import test from 'node:test';
import assert from 'node:assert/strict';
import index from '../rag/index.js';
import {validateGroundedOutput} from '../rag/grounding.js';
const find=predicate=>index.chunks.find(predicate);
const cert=find(c=>c.topic==='certifications');
const summary=find(c=>c.topic==='overview');
const grid=find(c=>c.entity==='GridWatch'&&c.kind==='resume');
const bitcoin=find(c=>c.entity==='Bitcoin Sentiment Analysis'&&c.section==='Overview');
const fly=find(c=>c.entity?.includes('FlyRank'));
const freelance=find(c=>c.entity?.includes('Freelance'));
const tests=[
 [cert,'He did not work for IBM, but joined Anthropic as an employee.'],
 [cert,'He never worked at Microsoft; he worked at Google Cloud.'],
 [cert,'He is not only an engineer at Google Cloud but also a researcher.'],
 [summary,"I'm Rajat, and I build AI products."],
 [summary,"I've won the King of the Hill competition."],
 [summary,'Rajat has 14 employees.'],
 [summary,'Rajat serves 14 customers.'],
 [grid,'GridWatch uses 30 years of meter data.'],
 [grid,'GridWatch uses 30 months of meter data.'],
 [grid,'GridWatch collected 30 accounts.'],
 [bitcoin,'The Bitcoin analysis includes 32 trades.'],
 [bitcoin,'The Bitcoin analysis covers 211,218 accounts.'],
 [fly,'Rajat currently works at FlyRank AI.'],
 [fly,'FlyRank is his current job.'],
 [fly,'The FlyRank internship is ongoing.'],
 [summary,'Rajat earns a salary of 2026 dollars.'],
];
for(const [source,text] of tests)test(`Reject semantic trap: ${text}`,()=>assert.equal(validateGroundedOutput({claims:[{text,source_id:source.id,quote:source.text}]},[source]),null));
for(const [source,text] of [[grid,'GridWatch uses 30 days of simulated meter data.'],[bitcoin,'The Bitcoin analysis includes 32 accounts.'],[bitcoin,'The Bitcoin analysis covers 211,218 trades.'],[freelance,'Rajat currently works as a freelance AI content developer.'],[fly,'FlyRank is not his current job; his internship ended in August 2026.'],[cert,'These are certificates, not proof of employment at Google Cloud.']])test(`Retain semantic control: ${text}`,()=>assert.ok(validateGroundedOutput({claims:[{text,source_id:source.id,quote:source.text}]},[source])));
