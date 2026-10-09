import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const model = 'Xenova/all-MiniLM-L6-v2';
export const revision = '751bff37182d3f1213fa05d7196b954e230abad9';
export const modelRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'models');
let extractor;

export async function embed(texts) {
  if (!extractor) {
    extractor = (async () => {
      const { pipeline, env } = await import('@huggingface/transformers');
      env.localModelPath = modelRoot + path.sep;
      env.allowRemoteModels = false;
      env.allowLocalModels = true;
      env.backends.onnx.wasm.numThreads = 1;
      return pipeline('feature-extraction', model, { dtype: 'q8', device: 'cpu' });
    })().catch(error => { extractor = undefined; throw error; });
  }
  const output = await (await extractor)(texts, { pooling: 'mean', normalize: true });
  return output.tolist();
}
