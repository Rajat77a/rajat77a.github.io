import test from 'node:test';
import assert from 'node:assert/strict';
import index from '../rag/index.js';
import {validateGroundedOutput} from '../rag/grounding.js';

const pick=(predicate)=>index.chunks.find(predicate);
const summary=pick(c=>c.topic==='overview');
const certs=pick(c=>c.topic==='certifications');
const grid=pick(c=>c.entity==='GridWatch'&&c.kind==='resume');
const prep=pick(c=>c.entity==='PrepPeer'&&c.section==='Stack');
const next=pick(c=>c.entity==='NextStep.AI'&&c.section==='Tech Stack');
const traps=[
 [summary,'Rajat holds 4 certifications.'],
 [summary,'Rajat holds 1 certification.'],
 [summary,'Rajat has a million paying customers.'],
 [summary,'Rajat worked for IBM.'],
 [certs,'Rajat is an engineer at Google Cloud.'],
 [certs,'Rajat joined Anthropic as an employee.'],
 [certs,'Rajat holds OSCP certification.'],
 [certs,'Rajat holds a CISSP credential.'],
 [grid,'GridWatch was trained on actual consumer meter data.'],
 [grid,'GridWatch uses real-world consumer meter data.'],
 [grid,'GridWatch uses labelled fraud records.'],
 [grid,'GridWatch has perfect accuracy.'],
 [grid,'GridWatch detects every case of theft.'],
 [grid,'GridWatch has production deployment at a utility.'],
 [prep,'PrepPeer uses Rust and Kubernetes.'],
 [prep,'PrepPeer uses Next.js 14.'],
 [next,'NextStep uses React 19.'],
 [next,'NextStep uses PostgreSQL instead of LocalStorage.'],
];
for(const [source,text] of traps) test(`Reject misleading paraphrase: ${text}`,()=>{
  assert.equal(validateGroundedOutput({supported:true,claims:[{text,source_id:source.id,quote:source.text}]},[source]),null);
});
for(const [source,text] of [[grid,'GridWatch uses simulated meter data without labelled fraud records.'],[prep,'PrepPeer uses Next.js 15 and Supabase.'],[next,'NextStep uses React 18 and LocalStorage for its MVP.']]) test(`Retain supported claim: ${text}`,()=>assert.ok(validateGroundedOutput({supported:true,claims:[{text,source_id:source.id,quote:source.text}]},[source])));
