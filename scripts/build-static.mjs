import './prepare-semantic.mjs';
import fs from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const output = new URL('../public/', import.meta.url);
await fs.mkdir(new URL('rag/', output), { recursive: true });
for (const file of ['index.html', 'styles.css', 'script.js', 'knowledge.js', 'hero3d.js', 'rag/index.js', 'rag/retrieve.js']) {
  await fs.copyFile(new URL(file, root), new URL(file, output));
}
await fs.cp(new URL('assets/', root), new URL('assets/', output), { recursive: true });
console.log('Prepared static portfolio assets in public/.');
