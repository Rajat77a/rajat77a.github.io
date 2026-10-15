// This endpoint serves the Qwen base plus the trained V2 adapter.
export async function generateTrained(prompt, environment = process.env, request = fetch) {
  const base = String(environment.HF_SPACE_URL || '').replace(/\/$/, '');
  if (!/^https:\/\/[a-z0-9]+(?:-[a-z0-9]+)*\.hf\.space$/.test(base)) {
    throw new Error('Trained model endpoint not configured');
  }
  const response = await request(`${base}/generate`, {
    method: 'POST', signal: AbortSignal.timeout(220000),
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, max_new_tokens: 700 })
  });
  if (!response.ok) throw new Error(response.status === 429 ? 'Model rate limited' : 'Trained model unavailable');
  const result = await response.json();
  if (result.model !== 'Qwen/Qwen3-4B' || result.adapter !== 'rajat-v2' || typeof result.text !== 'string') {
    throw new Error('Unexpected trained model response');
  }
  return result.text;
}

export async function generateLocalAdapter(prompt, environment = process.env, request = fetch) {
  const base = environment.LLAMA_URL || 'http://127.0.0.1:8081';
  if (!/^http:\/\/127\.0\.0\.1:\d+$/.test(base)) throw new Error('Loopback inference URL required');
  const response = await request(`${base}/v1/chat/completions`, {
    method: 'POST', signal: AbortSignal.timeout(220000),
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify({model:'rajat-assistant-v2',messages:[{role:'user',content:prompt}],
      temperature:0, max_tokens:700, stream:false, reasoning_effort:'none', response_format:{type:'json_object'},
      chat_template_kwargs:{enable_thinking:false}})
  });
  if (!response.ok) throw new Error(response.status===429 ? 'Model rate limited' : 'Local trained model unavailable');
  const output=(await response.json()).choices?.[0]?.message?.content;
  if (typeof output!=='string') throw new Error('Invalid local inference response');
  return output;
}
