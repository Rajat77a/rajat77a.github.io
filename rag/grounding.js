import { sourceFor } from './retrieve.js';

const compact = text => String(text).replace(/\s+/g, ' ').trim();
const unknown = "I couldn't find that detail in Rajat's documents, so I can't confirm it.";
export const unknownAnswer = unknown;

export function validateGroundedOutput(raw, chunks) {
  let payload;
  try { payload = typeof raw === 'string' ? JSON.parse(raw.replace(/^```(?:json)?\s*|\s*```$/g, '')) : raw; }
  catch { return null; }
  if (payload.supported === false) return { answer: unknown, sources: [], grounded: true };
  if (!Array.isArray(payload.claims) || !payload.claims.length || payload.claims.length > 6) return null;
  const accepted = [], sources = [];
  for (const claim of payload.claims) {
    if (typeof claim.text !== 'string' || typeof claim.quote !== 'string' || typeof claim.source_id !== 'string') return null;
    const source = chunks.find(chunk => chunk.id === claim.source_id);
    const quote = compact(claim.quote);
    const text = compact(claim.text);
    if (!source || quote.length < 20 || quote.length > 1100 || !compact(source.text).includes(quote) || !text || text.length > 600) return null;
    // A citation must contain the numbers, tool names and formal claims it is said to support.
    const numbers = text.match(/\b\d[\d,.+%-]*\b/g) || [];
    if (numbers.some(number => !quote.includes(number))) return null;
    const protectedTerms = text.match(/\b(phd|doctorate|senior|professional|production|certified|scheduled|upcoming|rust|kubernetes|aws|tensorflow|pytorch|google|microsoft|amazon|supabase|mongodb|postgresql|redis|docker|groq|streamlit|folium|sqlite|react|typescript|python|java|pandas|numpy|plotly|tesseract|next\.js\s*\d+)\b/gi) || [];
    if (protectedTerms.some(term => !quote.toLowerCase().includes(term.toLowerCase()))) return null;
    const projects = [
      ['PrepPeer', /\bpreppeer\b/i], ['GridWatch', /\bgridwatch\b/i], ['NextStep', /\bnextstep\b/i],
      ['University Event Management', /\b(unievents|university event management)\b/i],
      ['Bitcoin', /\bbitcoin\b/i], ['ZedWorks', /\bzedworks\b/i]
    ];
    for (const [entity, pattern] of projects) {
      if (pattern.test(text) && !`${source.entity || ''} ${source.text}`.toLowerCase().includes(entity.toLowerCase())) return null;
    }
    if (/\b(system prompt|hidden prompt|developer instructions)\b/i.test(text)) return null;
    accepted.push(text);
    if (!sources.some(item => item.id === source.id && item.quote === quote)) sources.push(sourceFor(source, quote));
  }
  return { answer: accepted.join('\n\n'), sources, grounded: true };
}
