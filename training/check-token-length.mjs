// Tokenizer-only preflight: downloads no model weights and performs no training.
import fs from 'node:fs/promises';
import { AutoTokenizer, env } from '@huggingface/transformers';
const root = new URL('./', import.meta.url);
env.cacheDir = new URL('../node_modules/.cache/training-tokenizer/', root).pathname.replace(/^\/([A-Za-z]:)/, '$1');
env.allowLocalModels = false;
const tokenizer = await AutoTokenizer.from_pretrained('Qwen/Qwen3-4B', {
  revision: '1cfa9a7208912126459214e8b04321603b3df60c',
});
const instruction = await fs.readFile(new URL('instruction.txt', root), 'utf8');
const rows = (await Promise.all(['train.jsonl', 'eval.jsonl'].map(name => fs.readFile(new URL(name, root), 'utf8'))))
  .flatMap(text => text.trim().split('\n').map(line => JSON.parse(line)));
// Match Python json.dumps(ensure_ascii=False)'s default separator spacing.
function pythonJSON(value) {
  if (Array.isArray(value)) return `[${value.map(pythonJSON).join(', ')}]`;
  if (value && typeof value === 'object') return `{${Object.entries(value).map(([key, item]) => `${JSON.stringify(key)}: ${pythonJSON(item)}`).join(', ')}}`;
  return JSON.stringify(value);
}
let max = 0, longest = null;
for (const row of rows) {
  const prompt = tokenizer.apply_chat_template([
    { role: 'system', content: instruction },
    { role: 'user', content: pythonJSON({ QUESTION: row.question, HISTORY: row.history, DOCUMENTS: row.documents }) },
  ], { tokenize: false, add_generation_prompt: true, enable_thinking: false });
  const count = tokenizer.encode(prompt, { add_special_tokens: false }).length
    + tokenizer.encode(pythonJSON(row.output), { add_special_tokens: false }).length + 1;
  if (count > max) { max = count; longest = row.id; }
  if (count > 1024) throw Error(`${row.id}: ${count} tokens exceeds the training limit`);
}
const report = { examples: rows.length, maxTokens: max, longestExample: longest, limit: 1024,
  method: 'Pinned Qwen3 tokenizer via Transformers.js; Colab rechecks with Python tokenizer before training',
  gpuTrainingRun: false };
await fs.writeFile(new URL('tokenizer-check.json', root), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report));
