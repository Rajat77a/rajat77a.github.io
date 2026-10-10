import index from './index.js';
import { socialFallback } from './conversation.js';

const stop = new Set('a an the is are was were be been being am i me my we our you your he him his her it its they their rajat krishnan does do did can could would should has have had about tell explain give show know what which who how why where when of on in at to for with and or from this that these those please more use used using work works'.split(' '));
const normalize = value => String(value).toLowerCase().replace(/nextstep[.·\s-]*ai/g, 'nextstep').replace(/uni[ -]?events/g, 'unievents').replace(/full[ -]?stack/g, 'fullstack').replace(/node\.js/g, 'nodejs').replace(/next\.js/g, 'nextjs').replace(/\b(databases|apis|internships|prompts|models|courses)\b/g, word => word.slice(0,-1));
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
  ['Bitcoin Sentiment Analysis', /\b(bitcoin|hyperliquid|fear and greed)\b/], ['ZedWorks', /\b(zedworks|ignitewithoutcaffeine)\b/]
];
const namedEntities = query => aliases.filter(([, pattern]) => pattern.test(normalize(query))).map(([name]) => name);
const topicFor = query => {
  const q = normalize(query);
  if (/\b(age|birthday|cgpa|gpa|salary|passport|aadhaar|home address|girlfriend|boyfriend|backlogs?|attendance|semester|placement eligibility|date of birth|how old|bank balance|leetcode|revenue|paying customers|funded|accuracy percentage|certified penetration tester|professional pentester)\b/.test(q)) return 'unknown';
  if (/\b(certifications?|certificates?|credentials?|courses?|coursework|badge|forage|nasscom|dubai future foundation|ai ethics)\b/.test(q)) return 'certifications';
  if (/\b(stack|database|programming languages|backend tools)\b/.test(q)) return 'skills';
  if (/\b(build|built|create|created|develop|developed|made|projects?|products?)\b/.test(q) && /\b(students?|learners?|parents?|campus)\b/.test(q)) return 'projects';
  if (/\b(education|degree|college|study|studying|studies|year|school|student|graduate|graduation)\b/.test(q)) return 'education';
  if (/\b(availability|available|hire|hiring|looking|opportunities|roles?|fit)\b/.test(q) || /\bopen\b.*\binternship\b/.test(q)) return 'availability';
  if (/\b(contact|email|reach|linkedin|github|phone|based|live|lives|location)\b/.test(q)) return 'contact';
  if (/\b(won|win|competition|contest|achievement|award|koth|pwn|security|cybersecurity|ctf)\b/.test(q)) return 'achievements';
  if (/\b(experience|internship|intern|job|employment|flyrank|freelance|clients?|cafes|short.form videos)\b/.test(q) || /\bwork(?:ed|s)? (at|for)\b/.test(q) || /\b(compare|evaluate)\b.*\b(responses|model)\b/.test(q)) return 'experience';
  if (/\b(skills?|stack|tools?|technolog|languages?|speak|python|java|rust|prompt|prompting|dbms|database|typescript|javascript|mongodb|sqlite|n8n|canva|jwt|rest api|coding|code|generative ai|model|interested|hobbies|interests|german|french|arabic|tamil|hindi)\b/.test(q)) return 'skills';
  if (/\bcontent creation\b/.test(q)) return 'experience';
  if (/\b(projects?|built|products?|building)\b/.test(q)) return 'projects';
  if (/\b(intro|introduction|introduce|summary|summarize|overview|background|about|work|bio|focus)\b/.test(q) || /\bwho\b/.test(q) || (/^what\b/.test(q) && /\bdo\b/.test(q))) return 'overview';
  return null;
};
const documents = index.chunks.map(chunk => ({ ...chunk, tokens: words(`${chunk.entity || ''} ${chunk.section} ${chunk.text}`) }));
const averageLength = documents.reduce((sum, doc) => sum + doc.tokens.length, 0) / documents.length;
const frequencies = new Map();
documents.forEach(doc => new Set(doc.tokens).forEach(token => frequencies.set(token, (frequencies.get(token) || 0) + 1)));

const refersBack = question => /\b(it|its|that|this|these|those|them|there|more|why|stack|tools)\b|^\s*(which|what) technologies\b|^\s*how (does|did) (he|rajat) (build|implement)\b/i.test(question);
const topicAnchors = [
  ['cybersecurity', /\b(cybersecurity|security|koth|pwn|ctf)\b/i],
  ['prompt engineering', /\b(prompt(?:ing)?|llm)\b/i],
  ['backend tools', /\b(backend|databases?|jwt|rest api)\b/i],
  ['content creation', /\b(content creation|creative|design|videos?)\b/i],
  ['education', /\b(education|degree|studying|college|school)\b/i],
  ['certifications', /\b(certifications?|certificates?|credentials?)\b/i],
  ['programming languages', /\b(programming|python|javascript|typescript|java)\b/i]
];

export function resolveQuery(question, history = []) {
  if (/^(?:please )?(?:make (?:it|that|this) (?:simpler|shorter)|explain (?:it|that|this) (?:more simply|again)|shorter|simpler|continue)[.!?]*$/i.test(question.trim())) {
    const previous = [...history].reverse().find(turn => turn.role === 'user');
    if (previous) return `${question} (follow-up to: ${previous.content})`;
  }
  if (namedEntities(question).length || topicFor(question) === 'unknown' || !refersBack(question)) return question;
  for (const turn of [...history].reverse()) {
    if (turn.role !== 'user') continue;
    const entities = namedEntities(turn.content);
    if (entities.length === 1) return `${question} ${entities[0]}`;
    if (entities.length > 1) return question; // Do not choose one side of a comparison arbitrarily.
    if (topicFor(turn.content) === 'unknown') return question;
    const anchor = topicAnchors.find(([, pattern]) => pattern.test(turn.content));
    if (anchor) return `${question} (about Rajat's ${anchor[0]})`;
    // Follow-ups can form a chain, but a new standalone topic ends the old context.
    if (!refersBack(turn.content)) return question;
  }
  return question;
}

export function retrieve(question, history = [], limit = 6, { semantic } = {}) {
  const resolved = resolveQuery(question, history);
  const entities = namedEntities(resolved);
  const previousUser = [...history].reverse().find(turn => turn.role === 'user');
  if (!entities.length && /\b(it|its|that|this|these|those|them)\b/i.test(question) && previousUser && namedEntities(previousUser.content).length > 1) return { chunks: [], query: resolved, reason: 'ambiguous' };
  const inferredTopic = topicFor(resolved);
  const topic = inferredTopic !== 'unknown' && entities.length && /^(what is|who (?:is|are)|tell me (?:about|more)|explain)\b/i.test(question) ? 'overview' : inferredTopic;
  if (topic === 'unknown') return { chunks: [], query: resolved, reason: 'unknown' };
  if (/\b(oscp|ceh|cissp|phd|doctorate|drop out|dropped out|employee id|medical diagnoses|credit card)\b/i.test(question) || /\bwho\b.*\b(?:his|rajat'?s) parents\b/i.test(question)) return { chunks: [], query: resolved, reason: 'unknown' };
  if (/\bprofessional\b.*\b(penetration|pentest)\b/i.test(question)) return { chunks: [], query: resolved, reason: 'unknown' };
  if (entities.length && /\b(funding|uptime|patent|security audit|perfect accuracy)\b/i.test(question)) return { chunks: [], query: resolved, reason: 'unknown' };
  const queryTerms = expand(resolved);
  const skillApplication = topic === 'skills' && /\b(where|when|how|examples?)\b.*\b(use|used|apply|applied|skills?|tools?)\b/i.test(question);
  const semanticDiscovery = !topic && !entities.length && semantic;
  if (!topic && !entities.length && !semantic) return { chunks: [], query: resolved, reason: 'unrelated' };
  let candidates = documents.filter(doc => {
    if (semanticDiscovery) return (semantic[doc.id] || 0) >= 0.36 && ['projects', 'experience', 'achievements', 'education', 'skills'].includes(doc.topic);
    if (entities.length) return entities.some(entity => normalize(doc.entity || '').includes(normalize(entity))) && ['projects', 'experience'].includes(doc.topic);
    if (topic === 'overview') return ['overview', 'education', 'experience', 'projects', 'achievements'].includes(doc.topic);
    if (topic === 'skills') return ['skills', 'projects', ...(skillApplication ? ['experience'] : [])].includes(doc.topic);
    if (topic === 'experience') return doc.topic === 'experience';
    if (topic === 'certifications') return doc.topic === topic || doc.topic === 'overview';
    return doc.topic === topic;
  });
  const employer = question.match(/\b(?:work(?:ed|s)?|employed|interned|job|role|position|internship)\s+(?:at|for|with)\s+([\w.-]+)/i)?.[1];
  const serviceAudience = new Set(['cafes', 'clients', 'local', 'neighbourhood', 'neighborhood', 'nearby']);
  if (employer && !serviceAudience.has(employer.toLowerCase()) && !candidates.some(doc => doc.topic === 'experience' && normalize(doc.entity || '').includes(normalize(employer)))) return { chunks: [], query: resolved, reason: 'unsupported' };
  const requestedTools = normalize(question).match(/\b(rust|kubernetes|postgresql|firebase|tensorflow|pytorch|aws|redis|docker|oscp|ceh|cissp)\b/g) || [];
  if (requestedTools.some(tool => !candidates.some(doc => doc.tokens.includes(tool)))) return { chunks: [], query: resolved, reason: 'unsupported' };
  const requestedVersions = [...normalize(question).matchAll(/\b(nextjs|react|python|express)\s+(\d+(?:\.\d+)*)\b/g)];
  if (requestedVersions.some(([,tool,version]) => !candidates.some(doc => new RegExp(`\\b${tool}\\s+${version.replaceAll('.','\\.')}\\b`).test(normalize(doc.text))))) return { chunks: [], query: resolved, reason: 'unsupported' };
  // Named tools/languages/employers in a capability question must occur in its evidence.
  const generic = new Set(groups.flat().concat(['good', 'strong', 'fit', 'now', 'current', 'currently', 'practical', 'familiar', 'comfortable', 'knowledge', 'proficient', 'professional', 'engineering', 'engineer', 'developer', 'ai', 'llm', 'learning', 'model', 'models', 'role', 'roles', 'main', 'key', 'strongest', 'any', 'also', 'yes', 'no', 'list', 'all', 'please', 'really', 'code', 'build', 'websites', 'during', 'done', 'coding', 'made', 'creation']));
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
    if (skillApplication && doc.topic === 'experience') score += 5;
    if (entities.length && doc.kind === 'project') score += 2;
    if (entities.length && topic === 'skills' && /stack|architecture|file structure|tools.*skills/i.test(doc.section)) score += 8;
    if (entities.length && topic === 'overview' && (doc.section === 'Overview' && doc.text.length > 100 || doc.kind === 'resume')) score += 6;
    if (/\bresume\b/i.test(question) && doc.kind === 'resume') score += 8;
    if (semantic) score += Math.max(0, (semantic[doc.id] || 0) - 0.25) * 8;
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
    if (entities.length) {
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

export function missingAnswer(question) {
  if (/\b(age|birthday|date of birth|how old)\b/i.test(question)) return "Rajat's documents don't list his age or date of birth, so I can't give you a reliable age.";
  if (/\b(cgpa|gpa|grades?)\b/i.test(question)) return "His education is documented, but his grades or CGPA aren't listed in the sources I have.";
  if (/\b(salary|paid|pay|earnings|income)\b/i.test(question)) return "I don't have documented pay or income figures for Rajat.";
  if (/\b(oscp|ceh|cissp|certified penetration tester|professional pentester)\b/i.test(question)) return "I don't have a source confirming that security credential. You can ask about his documented competition experience instead.";
  if (/\b(these|those|it|its|that|this|them|there)\b/i.test(question)) return "Which skill or project are you referring to? I need that context to answer accurately.";
  return "The sources I have don't establish that detail. Could you narrow the question to a particular project, skill or role?";
}

function relevantExcerpt(chunk, query) {
  const lines = chunk.text.split('\n');
  if (chunk.topic === 'skills') {
    const section = /\b(human|speak|spoken|arabic|tamil|hindi|malayalam)\b/i.test(query) ? 'Human Lang.'
      : /\b(hobbies|interested|interests|soccer)\b/i.test(query) ? 'Interests'
      : /\b(backend|database|jwt|rest api|mongodb|sqlite)\b/i.test(query) ? 'Web / Backend'
      : /\b(coding|assistants|n8n|cursor|codex)\b/i.test(query) ? 'AI Coding'
      : /\b(generative|midjourney|runway|canva)\b/i.test(query) ? 'Generative AI'
      : /\b(programming|data analysis|visualisation|python|java|typescript|languages)\b/i.test(query) ? 'Languages' : null;
    if (section) {
      const start = lines.indexOf(section);
      if (start >= 0) return lines.slice(start,start+2).join('\n');
    }
  }
  const queryTerms = expand(query);
  let best = 0, bestScore = -1;
  for (let start = 0; start < lines.length; start++) {
    const tokens = words(lines.slice(start,start+5).join('\n'));
    const score = queryTerms.reduce((sum,term) => sum + (tokens.includes(term) ? Math.log(1 + documents.length / (frequencies.get(term) || 1)) : 0),0);
    if (score > bestScore) { best=start; bestScore=score; }
  }
  // Keep the excerpt contiguous and verbatim; never manufacture a supporting quote.
  // Short passages can retain the complete context without cutting off the answer.
  if (chunk.text.length <= 650) return chunk.text;
  return lines.slice(best,best+5).join('\n').trim().slice(0,650);
}

export function extractiveAnswer(question, history = [], retrieval) {
  const social = socialFallback(question, history);
  if (social) return social;
  const result = retrieval || retrieve(question, history, 6);
  if (!result.chunks.length) return { text: result.reason === 'ambiguous' ? "Which project do you mean? Name one and I can explain it." : result.reason === 'unrelated' ? "I can help with Rajat's work and background. Try asking about a project, his experience, or his resume." : missingAnswer(question), source: 'Document answer', sources: [] };
  const entities = namedEntities(result.query);
  const chosen = entities.length > 1
    ? entities.map(entity => {
      const matching = result.chunks.filter(chunk => normalize(chunk.entity || '').includes(normalize(entity)));
      return matching.find(chunk => chunk.section === 'Overview' && chunk.text.length >= 100)
        || matching.find(chunk => chunk.kind === 'resume') || matching[0];
    }).filter(Boolean)
    : entities.length === 1 ? result.chunks.slice(0, 3) : result.chunks.slice(0, 2);
  const quotes = chosen.map(chunk => relevantExcerpt(chunk,result.query));
  return { text: quotes.join('\n\n'), source: 'Source excerpts', sources: chosen.map((chunk, i) => sourceFor(chunk, quotes[i])) };
}
