import index from './index.js';

const stop = new Set('a an the is are was were be been being am i me my we our you your he him his her it its they their rajat krishnan does do did can could would should has have had about tell explain give show know what which who how why where when of on in at to for with and or from this that these those please more use used using work works'.split(' '));
const normalize = value => String(value).toLowerCase().replace(/nextstep[.·\s-]*ai/g, 'nextstep').replace(/uni[ -]?events/g, 'unievents').replace(/full[ -]?stack/g, 'fullstack').replace(/node\.js/g, 'nodejs').replace(/next\.js/g, 'nextjs');
const words = value => normalize(value).match(/[a-z0-9+#]+/g) || [];
const terms = value => [...new Set(words(value).filter(word => !stop.has(word)))];
const groups = [
  ['skills', 'skill', 'tools', 'tool', 'stack', 'technologies', 'technology', 'languages', 'language'],
  ['education', 'degree', 'college', 'university', 'studying', 'student', 'study', 'school'],
  ['experience', 'internship', 'intern', 'employment', 'job', 'career', 'worked'],
  ['project', 'projects', 'built', 'building', 'products', 'product'],
  ['certification', 'certifications', 'certificate', 'certificates', 'credentials'],
  ['achievement', 'achievements', 'competition', 'contest', 'award', 'awards', 'won', 'winning', 'koth', 'pwn', 'security', 'cybersecurity', 'ctf'],
  ['availability', 'available', 'hire', 'hiring', 'opportunities', 'looking'],
  ['contact', 'email', 'reach', 'linkedin', 'github'],
  ['prompt', 'prompting', 'prompts'],
  ['speak', 'spoken', 'speaks', 'human', 'languages'],
  ['intro', 'introduction', 'introduce', 'summary', 'overview', 'background']
];
const expand = query => [...new Set(terms(query).flatMap(term => [term, ...(groups.find(group => group.includes(term)) || [])]))];
const aliases = [
  ['FlyRank', /\bflyrank\b/], ['PrepPeer', /\bpreppeer\b/], ['GridWatch', /\bgridwatch\b/], ['NextStep.AI', /\bnextstep\b/],
  ['University Event Management System', /\b(unievents|university event|event management)\b/],
  ['Bitcoin Sentiment Analysis', /\b(bitcoin|hyperliquid|fear and greed)\b/], ['ZedWorks', /\bzedworks\b/]
];
const namedEntities = query => aliases.filter(([, pattern]) => pattern.test(normalize(query))).map(([name]) => name);
const topicFor = query => {
  const q = normalize(query);
  if (/\b(cgpa|gpa|salary|passport|aadhaar|home address|girlfriend|boyfriend|backlogs?|attendance|semester|placement eligibility)\b/.test(q)) return 'unknown';
  if (/\b(certifications?|certificates?|credentials)\b/.test(q)) return 'certifications';
  if (/\b(education|degree|college|study|studying|studies|year|school|student|graduate|graduation)\b/.test(q)) return 'education';
  if (/\b(availability|available|hire|hiring|looking|opportunities|roles?|fit)\b/.test(q)) return 'availability';
  if (/\b(experience|internship|intern|job|employment|worked|flyrank|freelance)\b/.test(q)) return 'experience';
  if (/\b(contact|email|reach|linkedin|github|phone)\b/.test(q)) return 'contact';
  if (/\b(won|win|competition|contest|achievement|award|koth|pwn|security|cybersecurity|ctf)\b/.test(q)) return 'achievements';
  if (/\b(skills?|stack|tools?|technolog|languages?|speak|python|java|rust|prompt|prompting|dbms|database)\b/.test(q)) return 'skills';
  if (/\b(projects?|built|products?|building)\b/.test(q)) return 'projects';
  if (/\b(intro|introduction|introduce|summary|overview|background|about|work)\b/.test(q) || /\bwho\b/.test(q) || (/^what\b/.test(q) && /\bdo\b/.test(q))) return 'overview';
  return null;
};
const documents = index.chunks.map(chunk => ({ ...chunk, tokens: words(`${chunk.entity || ''} ${chunk.section} ${chunk.text}`) }));
const averageLength = documents.reduce((sum, doc) => sum + doc.tokens.length, 0) / documents.length;
const frequencies = new Map();
documents.forEach(doc => new Set(doc.tokens).forEach(token => frequencies.set(token, (frequencies.get(token) || 0) + 1)));

export function resolveQuery(question, history = []) {
  if (namedEntities(question).length || !/\b(it|its|that|this|more|why|stack|tools)\b/i.test(question)) return question;
  for (const turn of [...history].reverse()) {
    if (turn.role !== 'user') continue;
    const entities = namedEntities(turn.content);
    if (entities.length === 1) return `${question} ${entities[0]}`;
    if (entities.length > 1) return question; // Do not choose one side of a comparison arbitrarily.
  }
  return question;
}

export function retrieve(question, history = [], limit = 6) {
  const resolved = resolveQuery(question, history);
  const entities = namedEntities(resolved);
  const previousUser = [...history].reverse().find(turn => turn.role === 'user');
  if (!entities.length && /\b(it|its|that|this)\b/i.test(question) && previousUser && namedEntities(previousUser.content).length > 1) return { chunks: [], query: resolved, reason: 'ambiguous' };
  const topic = topicFor(resolved);
  if (topic === 'unknown') return { chunks: [], query: resolved, reason: 'unknown' };
  const queryTerms = expand(resolved);
  if (!topic && !entities.length) return { chunks: [], query: resolved, reason: 'unrelated' };
  let candidates = documents.filter(doc => {
    if (entities.length) return entities.some(entity => normalize(doc.entity || '').includes(normalize(entity))) && ['projects', 'experience'].includes(doc.topic);
    if (topic === 'overview') return ['overview', 'education', 'experience', 'projects', 'achievements'].includes(doc.topic);
    if (topic === 'skills') return ['skills', 'projects'].includes(doc.topic);
    if (topic === 'experience') return doc.topic === 'experience';
    return doc.topic === topic;
  });
  // Named tools/languages/employers in a capability question must occur in its evidence.
  const generic = new Set(groups.flat().concat(['good', 'strong', 'fit', 'now', 'current', 'currently', 'practical', 'familiar', 'comfortable', 'knowledge', 'proficient', 'professional', 'engineering', 'engineer', 'developer', 'ai', 'llm', 'learning', 'model', 'models', 'role', 'roles', 'main', 'key', 'strongest', 'any', 'also', 'yes', 'no', 'list', 'all', 'please', 'really']));
  if (!entities.length && ['skills', 'experience'].includes(topic) && /^(does|do|can|has|is|did)\b/i.test(question)) {
    const specifics = terms(resolved).filter(term => !generic.has(term) && term !== 'flyrank');
    const missing = specifics.filter(term => !candidates.some(doc => doc.tokens.includes(term)));
    if (missing.length) return { chunks: [], query: resolved, reason: 'unsupported', missing };
  }
  const scored = candidates.map(doc => {
    let score = 0;
    for (const token of queryTerms) {
      const tf = doc.tokens.filter(item => item === token).length;
      if (!tf) continue;
      const df = frequencies.get(token) || 0;
      const idf = Math.log(1 + (documents.length - df + .5) / (df + .5));
      score += idf * (tf * 2.2) / (tf + 1.2 * (.25 + .75 * doc.tokens.length / averageLength));
    }
    if (doc.topic === topic) score += 2;
    if (entities.length && doc.kind === 'project') score += 2;
    return { doc, score };
  }).filter(item => item.score > 0).sort((a, b) => b.score - a.score);
  const selected = [];
  if (topic === 'overview' && !entities.length) {
    for (const category of ['overview', 'education', 'experience', 'projects', 'achievements']) {
      const item = scored.find(({ doc }) => doc.topic === category && doc.kind !== 'project');
      if (item) selected.push(item.doc);
    }
  }
  // Each named project gets evidence, even when the other has many matching passages.
  for (const entity of entities) {
    const matching = scored.filter(({ doc }) => normalize(doc.entity || '').includes(normalize(entity))).slice(0, 2);
    matching.forEach(({ doc }) => { if (!selected.includes(doc)) selected.push(doc); });
    if (entities.length > 1) {
      const resume = candidates.find(doc => doc.kind === 'resume' && normalize(doc.entity || '').includes(normalize(entity)));
      if (resume && !selected.includes(resume)) selected.push(resume);
    }
  }
  for (const { doc } of scored) {
    if (selected.length >= limit) break;
    if (!selected.includes(doc)) selected.push(doc);
  }
  return { chunks: selected.map(({ tokens, ...doc }) => doc), query: resolved, reason: selected.length ? 'retrieved' : 'unknown' };
}

export function sourceFor(chunk, quote = '') {
  return { id: chunk.id, title: chunk.title, url: chunk.url, section: chunk.section, quote };
}

export function extractiveAnswer(question, history = []) {
  const result = retrieve(question, history, 6);
  if (!result.chunks.length) return { text: result.reason === 'ambiguous' ? "Which project do you mean? Name one and I can explain it." : result.reason === 'unrelated' ? "I can help with Rajat's work and background. Try asking about a project, his experience, or his resume." : "I couldn't find that detail in Rajat's documents, so I can't confirm it.", source: 'Document answer', sources: [] };
  const entities = namedEntities(result.query);
  const chosen = entities.length > 1
    ? entities.map(entity => {
      const matching = result.chunks.filter(chunk => normalize(chunk.entity || '').includes(normalize(entity)));
      return matching.find(chunk => chunk.section === 'Overview' && chunk.text.length >= 100)
        || matching.find(chunk => chunk.kind === 'resume') || matching[0];
    }).filter(Boolean)
    : result.chunks.slice(0, 2);
  const quotes = chosen.map(chunk => chunk.text.split('\n').filter(Boolean).slice(0, 5).join('\n').slice(0, 650));
  return { text: quotes.join('\n\n'), source: 'Source excerpts', sources: chosen.map((chunk, i) => sourceFor(chunk, quotes[i])) };
}
