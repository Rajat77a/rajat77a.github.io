export async function requestAssistant({endpoint,trainedEndpoint,message,history,mode},request=fetch){
  const endpoints=[...new Set([trainedEndpoint,endpoint].filter(Boolean))];
  for(const url of endpoints){
    try{
      const isTrained=url===trainedEndpoint;
      if(isTrained){
        const status=await request(new URL('/health',url).href,{signal:AbortSignal.timeout(4000)});
        if(!status.ok || !(await status.json()).ready)continue;
      }
      const response=await request(url,{method:'POST',signal:AbortSignal.timeout(isTrained||url.startsWith('/')?250000:25000),
        headers:{'Content-Type':'application/json'},body:JSON.stringify({message,history,mode})});
      const payload=await response.json();
      if(!response.ok || typeof payload.answer!=='string' || !payload.answer.trim() || (isTrained && payload.source==='Service notice'))continue;
      return payload;
    }catch{ /* Try the hosted model when the laptop is offline or its CPU is busy. */ }
  }
  throw new Error('Assistant unavailable');
}
