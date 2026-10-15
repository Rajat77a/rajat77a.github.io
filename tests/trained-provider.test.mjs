import test from 'node:test';
import assert from 'node:assert/strict';
import {generateTrained} from '../rag/trained-provider.js';

test('trained provider calls the actual adapter endpoint and preserves its output', async()=>{
  let observed;
  const answer=await generateTrained('Document prompt',{HF_SPACE_URL:'https://owner-rajat-v2.hf.space/'},async(url,options)=>{
    observed={url,body:JSON.parse(options.body)};
    return {ok:true,json:async()=>({text:'{"kind":"general","reply":"Hello"}',model:'Qwen/Qwen3-4B',adapter:'rajat-v2'})};
  });
  assert.equal(observed.url,'https://owner-rajat-v2.hf.space/generate');
  assert.deepEqual(observed.body,{prompt:'Document prompt',max_new_tokens:700});
  assert.equal(JSON.parse(answer).reply,'Hello');
});

test('missing and untrusted endpoints fail without a network call',async()=>{
  for(const endpoint of ['', 'http://localhost:8000','https://attacker.example','https://valid.hf.space/other','https://valid.hf.space@evil.example']){
    await assert.rejects(generateTrained('test',{HF_SPACE_URL:endpoint},()=>{throw new Error('Network should not run');}),/not configured/);
  }
});

test('sleeping, busy and incompatible model responses cannot masquerade as the adapter',async()=>{
  const env={HF_SPACE_URL:'https://owner-rajat-v2.hf.space'};
  await assert.rejects(generateTrained('test',env,async()=>({ok:false,status:503})),/unavailable/);
  await assert.rejects(generateTrained('test',env,async()=>({ok:false,status:429})),/rate limited/);
  await assert.rejects(generateTrained('test',env,async()=>({ok:true,json:async()=>({text:'hello',model:'Other',adapter:'rajat-v2'})})),/Unexpected/);
});
