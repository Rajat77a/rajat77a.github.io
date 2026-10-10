import test from 'node:test';
import assert from 'node:assert/strict';
import handler from '../api/chat.js';
import { requiresPortfolioEvidence, validateAssistantReply } from '../rag/conversation.js';
import { answerBlocks, renderAnswer } from '../rag/format.js';
import { resolveQuery } from '../rag/retrieve.js';

for (const message of ['Explain RAG in simple terms', 'Help me write a Python function', "I'm bored, can we chat?", 'What is 17 times 23?', 'Suggest an interview study plan', 'What does cybersecurity mean?', 'What is the capital of France?']) {
  test(`open question reaches language understanding: ${message}`, () => assert.equal(requiresPortfolioEvidence(message), false));
}
for (const message of ["What is Rajat's salary?", 'Does he work for Google?', 'Explain RAG and tell me how Rajat used it', 'What stack does PrepPeer use?', 'What are your skills?', 'Tell me about this portfolio', 'List projects', 'What security experience is documented?']) {
  test(`owner evidence boundary: ${message}`, () => assert.equal(requiresPortfolioEvidence(message), true));
}
test('a recent general topic replaces an old portfolio topic', () => {
  const history = [{role:'user', content:'Tell me about GridWatch'}, {role:'user', content:'Explain retrieval augmented generation'}];
  assert.equal(requiresPortfolioEvidence('Make that simpler', history), false);
  assert.equal(requiresPortfolioEvidence('Make that simpler', history.slice(0,1)), true);
  assert.match(resolveQuery('Make that simpler',history.slice(0,1)), /GridWatch/);
});
test('general output accepts numeric answers but rejects owner facts and malformed output', () => {
  assert.equal(validateAssistantReply(JSON.stringify({kind:'general',reply:'17 × 23 = 391.'})).answer,'17 × 23 = 391.');
  for (const reply of ['Rajat is a Google engineer.', 'PrepPeer has 10 million users.', 'I ran your code.']) assert.equal(validateAssistantReply(JSON.stringify({kind:'general',reply})),null);
  assert.equal(validateAssistantReply('not json'),null);
  assert.deepEqual(validateAssistantReply('{"kind":"portfolio"}'),{kind:'portfolio'});
});
test('formatting preserves code and treats markup as text', () => {
  const blocks=answerBlocks('Example:\n```html\n<script>alert(1)</script>\n```');
  assert.equal(blocks[1].type,'code');
  assert.equal(blocks[1].text,'<script>alert(1)</script>');
  const node = tag => ({tag, children:[], appendChild(child){this.children.push(child);}});
  const document = {createElement:node, createTextNode:text=>({text})};
  const container=node('div');
  renderAnswer(container,'**Example** <img src=x onerror=alert(1)>',document);
  assert.equal(container.children[0].tag,'strong');
  assert.equal(container.children[1].text,' <img src=x onerror=alert(1)>');
});
test('general API, clarification, model routing, rate limits and context retention', async () => {
  const original=globalThis.fetch, key=process.env.GROQ_API_KEY, provider=process.env.AI_PROVIDER;
  process.env.GROQ_API_KEY='test-only'; process.env.AI_PROVIDER='groq';
  let output={kind:'general',reply:'RAG retrieves relevant sources before generating an answer.'}, requestBody;
  const call=async(message,history=[])=>{
    let data;
    const res={setHeader(){},status(){return this;},json(value){data=value;return value;}};
    await handler({method:'POST',headers:{},body:{message,history}},res);
    return data;
  };
  try {
    globalThis.fetch=async(_url,options)=>{
      requestBody=JSON.parse(options.body);
      return {ok:true,json:async()=>({choices:[{message:{content:JSON.stringify(output)}}]})};
    };
    const response=await call('Explain RAG',[{role:'user',content:'I am learning AI'}]);
    assert.equal(response.source,'General AI'); assert.equal(response.grounded,false); assert.deepEqual(response.sources,[]);
    assert.equal(requestBody.reasoning_effort,'medium'); assert.match(requestBody.messages[0].content,/I am learning AI/);
    output={kind:'clarification',reply:'Do you want help writing code or understanding the concept?'};
    assert.equal((await call('help with this')).source,'Clarification');
    output={kind:'general',reply:'Rajat works at Google.'};
    assert.equal((await call('Who is the owner?')).source,'Clarification');
    output={kind:'portfolio'};
    assert.notEqual((await call('What is the owner paid?')).source,'General AI');
    globalThis.fetch=async()=>({ok:false,status:429});
    const limited=await call('Explain recursion');
    assert.equal(limited.source,'Service notice'); assert.equal(limited.fallbackReason,'rate_limited');
    assert.equal((await call('What stack does PrepPeer use?')).source,'Source excerpts');
  } finally {
    globalThis.fetch=original;
    if(key===undefined)delete process.env.GROQ_API_KEY;else process.env.GROQ_API_KEY=key;
    if(provider===undefined)delete process.env.AI_PROVIDER;else process.env.AI_PROVIDER=provider;
  }
});
