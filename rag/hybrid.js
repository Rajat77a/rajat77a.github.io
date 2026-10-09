import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import index from './index.js';
import { retrieve, resolveQuery } from './retrieve.js';
import { embed, model, revision } from './embeddings.js';

const fingerprint = crypto.createHash('sha256').update(JSON.stringify(index.chunks)).digest('hex');
let vectors;
const cache = new Map();

export function similarity(a, b) {
  if (a.length !== b.length || !a.length) throw new Error('Embedding dimensions differ');
  return a.reduce((sum, value, i) => sum + value * b[i], 0);
}

async function scoresFor(query) {
  if (!vectors) {
    const data = JSON.parse(await fs.readFile(new URL('./vectors.json', import.meta.url), 'utf8'));
    if (data.fingerprint !== fingerprint || data.model !== model || data.revision !== revision) throw new Error('Rebuild stale semantic index');
    vectors = data.passages;
  }
  if (cache.has(query)) return cache.get(query);
  const [vector] = await embed([query]);
  const scores = Object.fromEntries(vectors.map(passage => [passage.id, similarity(vector, passage.vector)]));
  if (cache.size >= 128) cache.delete(cache.keys().next().value);
  cache.set(query, scores);
  return scores;
}

export async function retrieveHybrid(question, history = []) {
  const lexical = retrieve(question, history);
  // Explicit privacy, false-premise, unknown-tool and ambiguity decisions remain authoritative.
  if (!['retrieved', 'unrelated'].includes(lexical.reason)) return { ...lexical, method: 'lexical' };
  try {
    const query = resolveQuery(question, history);
    const semantic = await scoresFor(query);
    return { ...retrieve(question, history, 6, { semantic }), method: 'hybrid' };
  } catch {
    return { ...lexical, method: 'lexical', semanticFallback: true };
  }
}
