import test from 'node:test';
import assert from 'node:assert/strict';
import {requestAssistant} from '../rag/request-assistant.js';
import {generateLocalAdapter} from '../rag/trained-provider.js';
const config={trainedEndpoint:'https://test.trycloudflare.com/api/chat',endpoint:'https://host.example/api/chat',message:'hello',history:[],mode:'short',engine:'trained'};
test('ready laptop answers with trained model provenance',async()=>{
  const calls=[];
  const result=await requestAssistant(config,async(url)=>{
    calls.push(url);
    return {ok:true,json:async()=>url.endsWith('/health')?{ready:true}:{answer:'Hello',engine:'Qwen3 4B · trained V2'}};
  });
  assert.match(result.engine,/trained V2/);assert.equal(calls.length,2);assert.ok(!calls.includes(config.endpoint));
});
test('offline or busy laptop uses hosted assistant rather than dropping the conversation',async()=>{
  for(const problem of ['offline','busy','model-failed']){
    const result=await requestAssistant(config,async(url)=>{
      if(url===config.endpoint)return {ok:true,json:async()=>({answer:'Hosted reply'})};
      if(problem==='offline')throw new Error('Laptop off');
      if(url.endsWith('/health'))return {ok:true,json:async()=>({ready:true})};
      return {ok:problem!=='busy',json:async()=>({answer:'Try again',source:'Service notice'})};
    });
    assert.equal(result.answer,'Hosted reply');assert.equal(result.engine,'Hosted fallback');
  }
});
test('local model transport uses the actual loopback adapter server with thinking disabled',async()=>{
  let observed;
  const text=await generateLocalAdapter('prompt',{},async(url,options)=>{
    observed={url,body:JSON.parse(options.body)};
    return {ok:true,json:async()=>({choices:[{message:{content:'{"kind":"general","reply":"Hi"}'}}]})};
  });
  assert.match(text,/Hi/);assert.equal(observed.url,'http://127.0.0.1:8081/v1/chat/completions');
  assert.equal(observed.body.chat_template_kwargs.enable_thinking,false);
  await assert.rejects(generateLocalAdapter('x',{LLAMA_URL:'http://remote.example:8081'}),/Loopback/);
});
