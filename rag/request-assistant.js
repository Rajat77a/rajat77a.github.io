import { quickAnswer } from './quick-answers.js';

export async function requestAssistant({endpoint,trainedEndpoint,message,history,mode,engine='fast'},request=fetch){
  const cached=engine==='fast' ? quickAnswer(message,mode,undefined,history) : null;
  if(cached)return cached;
  const endpoints=[...new Set((engine==='trained'?[trainedEndpoint,endpoint]:[endpoint]).filter(Boolean))];
  for(const url of endpoints){
    try{
      const isTrained=url===trainedEndpoint;
      if(isTrained){
        const status=await request(new URL('/health',url).href,{signal:AbortSignal.timeout(4000)});
        const health=status.ok?await status.json():null;
        if(!health?.ready || health.busy)continue;
      }
      const response=await request(url,{method:'POST',signal:AbortSignal.timeout(isTrained||url.startsWith('/')?250000:25000),
        headers:{'Content-Type':'application/json'},body:JSON.stringify({message,history,mode})});
      const payload=await response.json();
      if(!response.ok || typeof payload.answer!=='string' || !payload.answer.trim() || (isTrained && payload.source==='Service notice'))continue;
      return {...payload,...(engine==='trained' && !isTrained ? {engine:'Hosted fallback'} : {})};
    }catch{ /* Try the hosted model when the laptop is offline or its CPU is busy. */ }
  }
  throw new Error('Assistant unavailable');
}
