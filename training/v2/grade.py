"""Automated task checks, not a semantic correctness oracle."""
import json
import re
from collections import defaultdict

def assess(raw, row):
    issues=[]
    try:
        output=json.loads(raw)
        if not isinstance(output,dict): raise ValueError()
    except (ValueError,TypeError):
        return {'issues':['invalid JSON'],'output':None}
    expected=row['output']
    if row['task']=='rag':
        if output.get('supported') is not expected['supported']: issues.append('wrong support decision')
        claims=output.get('claims')
        if not isinstance(claims,list): return {'issues':issues+['claims not an array'],'output':output}
        if not expected['supported'] and claims: issues.append('unsupported claims')
        if expected['supported'] and not claims: issues.append('missing claims')
        docs={doc['id']:doc for doc in row['documents']}
        cited=set()
        compact=lambda text:' '.join(str(text).split())
        for claim in claims:
            if not isinstance(claim,dict): issues.append('invalid claim');continue
            doc=docs.get(claim.get('source_id'))
            quote=compact(claim.get('quote',''))
            if not doc or len(quote)<20 or quote not in compact(doc['text']): issues.append('invalid quote')
            else: cited.add(doc['id'])
            if not isinstance(claim.get('text'),str) or not claim['text'].strip(): issues.append('empty claim')
        if not {c['source_id'] for c in expected['claims']}.issubset(cited): issues.append('missing expected source')
        text=' '.join(str(c.get('text','')) for c in claims if isinstance(c,dict))
        for number in re.findall(r'\b\d[\d,.]*\b',' '.join(c['text'] for c in expected['claims'])):
            if number not in text: issues.append('missing expected quantity')
    else:
        if output.get('kind')!=expected['kind']: issues.append('wrong route')
        text=output.get('reply','')
        if expected['kind']!='portfolio' and (not isinstance(text,str) or not text.strip()): issues.append('missing reply')
        if expected['kind']=='portfolio' and text: issues.append('uncited portfolio reply')
        if isinstance(text,str) and re.search(r'\b(rajat|krishnan|preppeer|gridwatch|nextstep|zedworks|flyrank)\b',text,re.I): issues.append('uncited owner facts')
        if not isinstance(text,str): text=''
    for pattern in row.get('checks',{}).get('required',[]):
        if not re.search(pattern,text,re.I): issues.append('required content absent')
    for pattern in row.get('checks',{}).get('forbidden',[]):
        if re.search(pattern,text,re.I): issues.append('forbidden content')
    return {'issues':sorted(set(issues)),'output':output}

def summary(results):
    groups=defaultdict(list)
    for result in results: groups[result['task']].append(result)
    count=len(results)
    passes=sum(not r['issues'] for r in results)
    return {'total':count,'passed':passes,'rate':passes/count if count else 0,
        'critical_failures':sum(bool(r['issues']) and r.get('critical',False) for r in results),
        'by_task':{task:{'total':len(items),'passed':sum(not r['issues'] for r in items)} for task,items in groups.items()},
        'note':'Automated task checks; all generated answers require semantic review before release.'}
