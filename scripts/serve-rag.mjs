import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import handler from '../api/chat.js';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.pdf': 'application/pdf', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.avif': 'image/avif' };
http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost:4173');
    if (url.pathname === '/api/chat') {
      let body = '';
      for await (const chunk of req) { body += chunk; if (body.length > 16000) { res.writeHead(413).end(); return; } }
      req.body = body ? JSON.parse(body) : {};
      res.status = code => { res.statusCode = code; return res; };
      res.json = value => { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(value)); };
      return await handler(req, res);
    }
    const file = path.resolve(root, `.${decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname)}`);
    if (!file.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
    let content = await fs.readFile(file);
    if (file.endsWith('knowledge.js')) content = Buffer.from(content.toString().replace('https://rajat77a-github-io.vercel.app/api/chat', '/api/chat'));
    res.setHeader('Content-Type', types[path.extname(file)] || 'application/octet-stream');
    res.setHeader('Cache-Control', 'no-store');
    res.end(content);
  } catch { res.writeHead(404).end('Not found'); }
}).listen(4173, '127.0.0.1', () => console.log('Document assistant preview: http://127.0.0.1:4173/#ask-ai'));
