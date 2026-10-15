import index from './index.js';
import answers from './quick-answers-data.js';
import {validateGroundedOutput} from './grounding.js';

export const normalizeQuickQuestion = value => String(value).toLowerCase().replaceAll('’',"'").replace(/\s+/g,' ').trim().replace(/[.!?]+$/,'').trim();

export function quickAnswer(question,mode='default',corpus=index.chunks,history=[]){
  if(!['default','short'].includes(mode))return null;
  if(history.length)return null;
  const entry=answers.find(row=>row.questions.some(q=>normalizeQuickQuestion(q)===normalizeQuickQuestion(question)));
  if(!entry)return null;
  const sources=entry.claims.map(claim=>corpus.find(c=>c.id===claim.source_id));
  // A source edit disables the saved answer until the snapshot is reviewed again.
  if(sources.some((source,i)=>!source || source.hash!==entry.claims[i].hash || source.text!==entry.claims[i].quote))return null;
  const result=validateGroundedOutput({supported:true,claims:entry.claims},sources);
  if(!result?.sources.length)return null;
  return {...result,source:'Document answer',engine:'Verified answer',grounded:true,cached:true,retrievalMethod:'reviewed-source-cache',link:null};
}
