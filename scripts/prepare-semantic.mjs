import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import index from '../rag/index.js';
import { embed, model, revision, modelRoot } from '../rag/embeddings.js';

const files = ['config.json', 'tokenizer.json', 'tokenizer_config.json', 'special_tokens_map.json', 'onnx/model_quantized.onnx'];
for (const file of files) {
  const destination = path.join(modelRoot, model, file);
  try { await fs.access(destination); continue; } catch {}
  const response = await fetch(`https://huggingface.co/${model}/resolve/${revision}/${file}`, { signal: AbortSignal.timeout(180000) });
  if (!response.ok) throw new Error(`Embedding model download failed: ${file}, HTTP ${response.status}`);
  await fs.mkdir(path.dirname(destination), { recursive: true });
  const temporary = destination + '.tmp';
  await fs.writeFile(temporary, Buffer.from(await response.arrayBuffer()));
  await fs.rename(temporary, destination);
  console.log(`Installed ${file}`);
}
const documents = index.chunks.map(chunk => `${chunk.entity || 'Rajat Krishnan'}\n${chunk.section}\n${chunk.text}`);
const vectors = [];
for (let start = 0; start < documents.length; start += 8) vectors.push(...await embed(documents.slice(start, start + 8)));
const fingerprint = crypto.createHash('sha256').update(JSON.stringify(index.chunks)).digest('hex');
await fs.writeFile(new URL('../rag/vectors.json', import.meta.url), JSON.stringify({ model, revision, fingerprint, dimensions: vectors[0].length, passages: index.chunks.map((chunk, i) => ({ id: chunk.id, vector: vectors[i] })) }));
console.log(`Prepared ${vectors.length} document embeddings (${vectors[0].length} dimensions).`);
