import { sourceFor } from './retrieve.js';

const compact = text => String(text).replace(/\s+/g, ' ').trim();
const escape = text => text.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
const negated = text => /\b(not|never|no|isn't|wasn't|didn't|doesn't)\b/i.test(text.replace(/\bnot only\b/gi,''));
const unknown = "I couldn't find that detail in Rajat's documents, so I can't confirm it.";
export const unknownAnswer = unknown;

export function hasQuantityConflict(question, chunks) {
  const pairs = [...question.matchAll(/\b(\d[\d,.]*)[\s-]+(days?|years?|months?|trades?|accounts?)\b/gi)];
  return pairs.some(([,number,unit]) => {
    const known = chunks.map(chunk => compact(chunk.text)).join(' ');
    const exact = new RegExp(`(?<![\\d.])${escape(number)}[\\s-]+${unit.replace(/s$/i,'')}s?\\b`,'i');
    const another = new RegExp(`(?<![\\d.])${escape(number)}[\\s-]+(?:days?|years?|months?|trades?|accounts?)\\b`,'i');
    return !exact.test(known) && another.test(known);
  });
}

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
    if (/\bI (?:am|have|won|built|hold|worked|study)\b|\bI['’](?:m|ve)\b/i.test(text)) return null;
    for (const clause of text.split(/;|\b(?:but|however|while|whereas)\b/i)) {
      const employers = [...clause.matchAll(/\b(?:worked|works|employed|engineer|intern|employee)\s+(?:at|for)\s+([\w.-]+)|\bjoined\s+([\w.-]+)/gi)];
      for (const employer of employers) {
        if (negated(clause)) continue;
        const company = (employer[1] || employer[2]).toLowerCase();
        if (source.topic !== 'experience' || !(source.entity || '').toLowerCase().includes(company)) return null;
      }
      if (source.topic === 'experience' && /\b(current|currently|ongoing)\b/i.test(clause) && !negated(clause) && !/\bpresent\b/i.test(source.text)) {
        const range = source.text.match(/\b([A-Za-z]+)\s+to\s+([A-Za-z]+)\s+(\d{4})\b/);
        const months = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];
        const month = range ? months.indexOf(range[2].slice(0,3).toLowerCase()) : -1;
        if (month >= 0 && Date.UTC(Number(range[3]),month+1,1) <= Date.now()) return null;
      }
    }
    // Provider coursework and certificates cannot substantiate an employment claim.
    if (source.topic === 'certifications' && /\b(worked|employed|intern(?:ed)?|employee|job)\b.{0,25}\b(at|for|with)\b/i.test(text) && !/\b(not|never|no|isn't|wasn't|didn't)\b/i.test(text)) return null;
    // A citation must contain the numbers, tool names and formal claims it is said to support.
    const numbers = text.match(/\b\d[\d,.+%-]*\b/g) || [];
    if (numbers.some(number => !new RegExp(`(?<![\\d.])${number.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}(?![\\d.])`).test(quote))) return null;
    const amounts = [...text.matchAll(/\b(\d[\d,.]*)(?:\+)?[\s-]+(days?|years?|months?|trades?|accounts?|certifications?|employees?|customers?|users?|students?|dimensions?|dollars?)\b/gi)];
    for (const [,number,unit] of amounts) {
      const singular = unit.toLowerCase().replace(/s$/,'');
      const equivalent = ['user','student'].includes(singular) ? '(?:user|student)s?' : `${singular}s?`;
      if (!new RegExp(`(?<![\\d.])${escape(number)}\\+?[\\s-]+${equivalent}\\b`,'i').test(quote)) return null;
    }
    const protectedTerms = text.match(/\b(phd|doctorate|senior|professional|production|certified|scheduled|upcoming|oscp|ceh|cissp|paying|million|billion|actual|real.world|perfect accuracy|every case|all theft|rust|kubernetes|aws|tensorflow|pytorch|google|microsoft|amazon|supabase|mongodb|postgresql|redis|docker|groq|streamlit|folium|sqlite|react|typescript|python|java|pandas|numpy|plotly|tesseract|next\.js\s*\d+)\b/gi) || [];
    if (protectedTerms.some(term => !quote.toLowerCase().includes(term.toLowerCase()))) return null;
    if (/\bno label(?:l)?ed fraud records\b/i.test(quote) && /\blabel(?:l)?ed fraud records\b/i.test(text) && !/\b(no|without|not|unlabelled|unlabeled)\b/i.test(text)) return null;
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
