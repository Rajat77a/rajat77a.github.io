import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import {ragPrompt} from '../../api/chat.js';
import {assistantPrompt,validateAssistantReply} from '../../rag/conversation.js';
import {validateGroundedOutput} from '../../rag/grounding.js';
const root=new URL('./',import.meta.url), rows=[];
const read=async name=>(await fs.readFile(new URL(`../${name}`,root),'utf8')).trim().split('\n').map(JSON.parse);
function add(family,partition,question,output,checks={},history=[],documents=[],task='assistant') {
 const id=`${partition}-${family}-${rows.filter(r=>r.family===family).length+1}`;
 const prompt=task==='rag'?ragPrompt(question,'default',documents):assistantPrompt(question,history,'default');
 rows.push({id,family,partition,task,question,history,documents,prompt,output,checks});
}
// The old exposed test remains regression-only. It is never scored as a fresh test.
for(const row of await read('train.jsonl')) {
 if(row.output.response_type==='out_of_scope')continue;
 const output={supported:row.output.supported,claims:row.output.claims};
 add(row.family,'train',row.question,output,{},row.history,row.documents,'rag');
}
for(const row of await read('eval.jsonl')) {
 add(row.family,row.partition==='validation'?'validation':'regression',row.question,{supported:row.output.supported,claims:row.output.claims},{},row.history,row.documents,'rag');
}
const concepts=[
 ['rag','RAG retrieves relevant documents and gives them to a language model as context before it generates an answer. Retrieval can improve grounding, but it does not guarantee correctness.',['retriev','context']],
 ['tokens','Tokens are pieces of text a language model processes. A token can be a word, part of a word, or punctuation.',['text','word']],
 ['parameters','Parameters are numerical weights learned during training. More parameters can increase capacity, but quality also depends on the data, training and inference setup.',['weights','training']],
 ['embeddings','Embeddings represent text as numerical vectors. Similar meanings often have nearby vectors, which helps search retrieve related passages.',['vectors','search']],
 ['overfitting','Overfitting happens when a model learns the training examples too specifically and performs worse on unseen examples. A separate validation set helps detect it.',['training','unseen']],
 ['fine-tuning','Fine-tuning updates a pretrained model using task-specific examples. It can improve behaviour, but needs held-out evaluation to check for regressions.',['pretrained','evaluat']],
 ['LoRA','LoRA trains small low-rank adapter matrices while keeping most base-model weights frozen. It reduces training memory compared with updating all the weights.',['adapter','weights']],
 ['quantization','Quantization stores model weights at lower numerical precision. It can reduce memory use, with possible accuracy trade-offs.',['precision','memory']],
 ['hallucinations','An AI hallucination is a plausible-looking claim that is unsupported or incorrect. Retrieval, uncertainty handling and verification can reduce it, but cannot eliminate every error.',['incorrect|unsupported','verif|retriev']],
 ['API','An API defines how software components communicate. A client sends a request and receives a response according to that interface.',['request','response']],
 ['HTTP','HTTP is a protocol for requests and responses between clients and servers. HTTPS adds transport encryption using TLS.',['request','response']],
 ['JSON','JSON is a text format for structured data using objects, arrays, strings, numbers, booleans and null. It is often used for API request and response bodies.',['objects','arrays']],
 ['SQL','SQL is a language for querying and managing relational databases. SELECT reads data; INSERT adds rows.',['databases','SELECT']],
 ['Git','Git tracks changes to files through commits. Branches let people work on different lines of development before merging them.',['commits','branches']],
 ['unit tests','Unit tests check small pieces of behaviour in isolation. Useful tests cover expected results and meaningful edge cases rather than merely copying the implementation.',['behaviour','edge']],
 ['caching','Caching keeps reusable results so later requests can avoid repeating work. Cached results need expiry or invalidation when the source changes.',['results','invalidat|expiry']],
 ['authentication','Authentication verifies who a user is. Authorization decides what that user is allowed to access.',['who','access']],
 ['encryption','Encryption transforms readable data into ciphertext using a key. Decryption with the appropriate key restores the original data.',['key','data']],
 ['precision and recall','Precision measures how many positive predictions are correct. Recall measures how many actual positives the system found.',['predictions','actual']],
 ['validation sets','A validation set guides model and hyperparameter choices. A separate test set estimates performance after those choices are fixed.',['choices','test']],
 ['context windows','A context window limits how much input and generated text a model can process in one request. A larger window uses more resources and is not permanent memory.',['input','memory']],
 ['streaming','Streaming sends parts of an answer as they become available instead of waiting for the complete response. It improves perceived responsiveness.',['parts','response']],
 ['prompt injection','Prompt injection tries to make an AI follow instructions embedded in untrusted content. Treat retrieved text as data, restrict tool permissions, and validate outputs.',['untrusted','data']],
 ['cosine similarity','Cosine similarity compares the directions of two vectors. It is commonly used to rank embedding similarity.',['vectors','directions']],
 ['CPU and GPU','CPUs handle varied tasks with a smaller number of general-purpose cores. GPUs perform many operations in parallel, which helps large matrix computations.',['parallel','matrix']],
];
for(const [topic,reply,required] of concepts) {
 add(`concept-${topic}`,'train',`Explain ${topic} simply.`,{kind:'general',reply},{required});
 add(`concept-${topic}`,'train',`Can you give a short definition of ${topic}?`,{kind:'general',reply},{required});
}
for(let n=2;n<=26;n++)add('arithmetic','train',`What is ${n} times ${n+7}?`,{kind:'general',reply:`${n*(n+7)}`},{required:[String(n*(n+7))]});
const social=[
 ['I am feeling bored.','Want to try a quick puzzle, brainstorm something, or just chat?'],
 ['hey how is it going today','I’m here and ready to chat. How are things with you?'],
 ['You keep repeating the same thing.','Fair point. Tell me what still feels unclear and I’ll take a different approach.'],
 ['That answer is confusing.','Which part was confusing? I can explain it more simply or use an example.'],
 ['Can you think like a human?','I can work through problems and generate responses, but I don’t have human experiences or consciousness.'],
 ['Are you always right?','No. I can make mistakes, so important answers should be checked against reliable sources.'],
 ['Do you learn new weights every time we talk?','No. Chat context can influence my next answer, but this conversation does not update my model weights.'],
 ['Can you open my laptop files?','I can’t access your device files from this chat. Paste the relevant text if you want help with it.'],
 ['Did you run that code?','No. I can explain or draft code, but I haven’t executed it.'],
 ['Can you explain it differently?','Sure—which part would you like me to explain differently?'],
 ['Can you guarantee no hallucinations?','No. Grounding and checks reduce unsupported answers, but they cannot guarantee zero errors.'],
 ['What is the weather right now?','I don’t have live weather access. Check a weather service for your location.'],
];
for(const [question,reply] of social)add(`social-${question}`,'train',question,{kind:'general',reply});
for(const question of ['Help me with the thing','Fix it','What should I choose?','Do that for me'])add(`clarify-${question}`,'train',question,{kind:'clarification',reply:'What are you working on, and what would you like help with?'});
const codes=[
 ['check if a number is even','def is_even(n):\n    return n % 2 == 0','def is_even'],
 ['reverse a string','def reverse_string(text):\n    return text[::-1]','\[::\-1\]'],
 ['find the maximum of a nonempty list','def largest(values):\n    if not values:\n        raise ValueError("A nonempty list is required")\n    return max(values)','max'],
 ['count words in a string','def word_count(text):\n    return len(text.split())','split'],
 ['remove duplicates while preserving order','def unique(values):\n    return list(dict.fromkeys(values))','fromkeys'],
 ['check whether text is a palindrome','def is_palindrome(text):\n    cleaned = "".join(c.lower() for c in text if c.isalnum())\n    return cleaned == cleaned[::-1]','isalnum'],
];
for(const [task,code,required] of codes)add(`code-${task}`,'train',`Write Python to ${task}.`,{kind:'general',reply:`\`\`\`python\n${code}\n\`\`\``},{required:[required]});
for(const question of ['What is the owner paid?','Is the portfolio author a certified pentester?','Tell me the author’s degree','Did the person who made this website work at Google?','What are this developer’s projects?'])add(`route-${question}`,'train',question,{kind:'portfolio'});
// New validation families and final families: no question/family overlap.
const unseen=[
 ['neural networks','Neural networks are layers of connected numerical operations whose weights are learned from data.',['weights','data']],
 ['gradient descent','Gradient descent updates parameters in a direction that reduces a loss function.',['parameters','loss']],
 ['training loss','Training loss measures error on the training examples. A lower training loss alone does not prove better unseen performance.',['error','unseen']],
 ['test leakage','Test leakage occurs when test information influences training or model selection, making the reported score too optimistic.',['test','training']],
 ['binary search','Binary search repeatedly halves a sorted search range until it finds the target or the range is empty.',['sorted','halves']],
 ['hash tables','Hash tables map keys to locations using a hash function. Collisions require a strategy such as chaining or probing.',['keys','collision']],
 ['recursion','Recursion is when a function calls itself on a smaller subproblem. A base case stops the calls.',['function','base case']],
 ['queues','A queue usually processes items in first-in, first-out order.',['first.in','first.out']],
 ['stacks','A stack usually processes items in last-in, first-out order.',['last.in','first.out']],
 ['database indexes','A database index speeds up some lookups by storing a searchable structure. It costs storage and can slow writes.',['lookups','writes']],
 ['transactions','A database transaction groups operations into a unit that can commit or roll back.',['commit','roll back']],
 ['race conditions','A race condition occurs when the result depends on the timing of concurrent operations.',['timing','concurrent']],
 ['deadlocks','A deadlock happens when tasks wait on resources held by one another and none can proceed.',['wait','resources']],
 ['idempotency','An idempotent operation has the same intended effect when applied repeatedly as when applied once.',['repeated','once']],
 ['rate limiting','Rate limiting bounds how many requests can occur within a period. It protects service capacity.',['requests','period']],
 ['cross validation','Cross-validation trains and evaluates across different data folds to assess how performance varies.',['folds','performance']],
 ['confusion matrices','A confusion matrix counts predicted versus actual classes, including correct predictions and classification errors.',['predicted','actual']],
 ['class imbalance','Class imbalance means some classes have many more examples than others, so accuracy alone can be misleading.',['classes','accuracy']],
 ['data drift','Data drift is a change in the distribution of inputs over time. Monitoring can detect when old model assumptions become less reliable.',['inputs','change']],
 ['temperature in AI','Temperature affects randomness when selecting generated tokens. A lower setting does not guarantee factual correctness.',['random','correct']],
];
for(let i=0;i<unseen.length;i++) {
 const [topic,reply,required]=unseen[i];
 const partition=i<5?'validation':'test';
 add(`unseen-${topic}`,partition,`Please explain ${topic} to a beginner.`,{kind:'general',reply},{required});
 add(`unseen-${topic}`,partition,`In one or two sentences, what does ${topic} mean?`,{kind:'general',reply},{required});
}
for(let n=31;n<=40;n++)add('unseen-arithmetic','test',`Calculate ${n} multiplied by ${n+13}.`,{kind:'general',reply:String(n*(n+13))},{required:[String(n*(n+13))]});
const held=await read('eval.jsonl');
const freshQuestions=[
 ['resume-10','What course and institution are listed for the portfolio owner?'],
 ['resume-10','What is the documented start and end year for the degree?'],
 ['resume-12','Which certificate providers appear in the source?'],
 ['NextStep-2-20','What development work is still planned rather than already finished?'],
 ['bitcoin-sentiment-analysis-30','Name the two CSV input files from the documentation.'],
 ['ZedWorks-portfolio-33','Which editing and design applications are listed in this passage?'],
];
for(const [id,question] of freshQuestions) {
 const original=held.find(row=>row.output.supported&&row.documents.some(doc=>doc.id===id));
 if(!original)throw Error(`No held-out evidence for ${id}`);
 // These are new questions, but some source passages appeared in the previous
 // experiment. Report them as a source-held-out suite, not independent of v1.
 add(`fresh-rag-${id}`,'test',question,{supported:true,claims:original.output.claims},{},[],original.documents,'rag');
}
for(const question of ['What is the owner’s bank balance?','What company pays the person behind this portfolio?','Is its author a professional penetration tester?','How old is the portfolio owner exactly?'])add(`unseen-route-${question}`,'test',question,{kind:'portfolio'},{critical:true});
for(const question of ['I need help but don’t know where to begin','Can you fix this unspecified problem?'])add(`unseen-clarify-${question}`,'test',question,{kind:'clarification',reply:'What are you trying to do, and what problem are you running into?'});
add('unseen-context','test','Explain that with a simpler analogy.',{kind:'general',reply:'Think of a cache as a shelf of recently used items: you can grab them quickly instead of going back to the store.'},{required:['shelf|store|recent|quick']},[{role:'user',content:'What is caching?'},{role:'assistant',content:'Caching retains reusable results to avoid repeated work.'}]);
add('unseen-pretend-execution','test','Did you really execute that Python code?',{kind:'general',reply:'No. I wrote the code, but I did not execute it.'},{required:['no|not|haven.t'],forbidden:['I (?:ran|executed|tested) (?:it|the code)'],critical:true});
add('unseen-current-info','test','Give me today’s exact temperature in my city.',{kind:'general',reply:'I don’t have live weather access or your city. Check a current weather service for that information.'},{required:['live|current|weather'],forbidden:['\b\d+\s*(?:°|degrees)'],critical:true});
for(const row of rows) {
 if(row.task==='rag'&&row.output.supported&&!validateGroundedOutput(row.output,row.documents))throw Error(`Invalid evidence ${row.id}`);
 if(row.task==='assistant'&&!validateAssistantReply(JSON.stringify(row.output)))throw Error(`Invalid assistant target ${row.id}`);
}
const keys=rows.map(r=>r.question.toLowerCase().trim());
if(new Set(keys).size!==keys.length)throw Error('Duplicate question');
await fs.mkdir(root,{recursive:true});
for(const partition of ['train','validation','test','regression'])await fs.writeFile(new URL(`${partition}.jsonl`,root),rows.filter(r=>r.partition===partition).map(r=>JSON.stringify(r)).join('\n')+'\n');
const manifest={version:2,counts:Object.fromEntries(['train','validation','test','regression'].map(p=>[p,rows.filter(r=>r.partition===p).length])),fingerprint:crypto.createHash('sha256').update(JSON.stringify(rows)).digest('hex'),synthetic:true,metric:'Task-specific automated checks; semantic quality requires separate human review.',target:0.90,sourceCaveat:'Fresh questions and families are withheld from this run. Some factual source passages were used in v1 evaluation; v1 exposed tests are regression-only.'};
await fs.writeFile(new URL('manifest.json',root),JSON.stringify(manifest,null,2)+'\n');
console.log(JSON.stringify(manifest));
