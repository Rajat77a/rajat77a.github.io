import fs from 'node:fs/promises';
import {AutoTokenizer,env} from '@huggingface/transformers';
const root=new URL('./',import.meta.url);
env.cacheDir=new URL('../../node_modules/.cache/training-tokenizer/',root).pathname.replace(/^\/([A-Za-z]:)/,'$1');
const tokenizer=await AutoTokenizer.from_pretrained('Qwen/Qwen3-4B',{revision:'1cfa9a7208912126459214e8b04321603b3df60c'});
const rows=(await Promise.all(['train','validation','test','regression'].map(async name=>(await fs.readFile(new URL(`${name}.jsonl`,root),'utf8')).trim().split('\n').map(JSON.parse)))).flat();
let maxTokens=0,longest;
for(const row of rows){
 const prefix=tokenizer.apply_chat_template([{role:'user',content:row.prompt}],{tokenize:false,add_generation_prompt:true,enable_thinking:false});
 const count=tokenizer.encode(prefix,{add_special_tokens:false}).length+tokenizer.encode(JSON.stringify(row.output),{add_special_tokens:false}).length+1;
 if(count>maxTokens){maxTokens=count;longest=row.id;}
 if(count>3072)throw Error(`Too long: ${row.id}, ${count}`);
}
const report={examples:rows.length,maxTokens,longest,limit:3072,method:'Pinned tokenizer; Python rechecks exact JSON serialization before GPU training.',trainingRun:false};
await fs.writeFile(new URL('tokenizer-check.json',root),JSON.stringify(report,null,2));console.log(JSON.stringify(report));
