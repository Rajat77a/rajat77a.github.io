// Parse only fenced code. Everything is rendered through textContent, never HTML.
export function answerBlocks(text) {
  return String(text).split(/(```[^\n]*\n[\s\S]*?```)/g).filter(Boolean).map(part => {
    const code = part.match(/^```([^\n]*)\n([\s\S]*?)```$/);
    return code ? {type:'code', language:code[1].trim().slice(0,30), text:code[2].replace(/\n$/, '')} : {type:'text', text:part};
  });
}

export function renderAnswer(container, text, document) {
  for (const block of answerBlocks(text)) {
    if (block.type === 'code') {
      const pre = document.createElement('pre');
      const code = document.createElement('code');
      code.textContent = block.text;
      pre.appendChild(code);
      container.appendChild(pre);
    } else {
      for (const part of block.text.split(/(\*\*[^*]+\*\*|`[^`\n]+`)/g).filter(Boolean)) {
        const tag = part.startsWith('**') ? 'strong' : part.startsWith('`') ? 'code' : null;
        if (tag) {
          const node = document.createElement(tag);
          node.textContent = part.slice(tag === 'strong' ? 2 : 1, tag === 'strong' ? -2 : -1);
          container.appendChild(node);
        } else container.appendChild(document.createTextNode(part));
      }
    }
  }
}
