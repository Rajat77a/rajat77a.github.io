import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
for (const repo of ['PrepPeer', 'gridwatch', 'NextStep-2', 'university-event-management-system', 'bitcoin-sentiment-analysis', 'ZedWorks-portfolio']) {
  const data = JSON.parse(execFileSync('gh', ['api', `repos/Rajat77a/${repo}/readme`], { encoding: 'utf8' }));
  fs.writeFileSync(path.join(root, 'rag/sources', `${repo}.md`), Buffer.from(data.content, 'base64'));
  fs.writeFileSync(path.join(root, 'rag/sources', `${repo}.meta.json`), JSON.stringify({ html_url: data.html_url, sha: data.sha, path: data.path }, null, 2));
  console.log(`Refreshed ${repo}/${data.path}`);
}
