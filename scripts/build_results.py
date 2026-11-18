"""Render results.json into HTML so results also work offline and without JavaScript."""
import json,re
from pathlib import Path
from html import escape as e
root=Path(__file__).resolve().parent.parent
data=json.loads((root/'results.json').read_text())
order=['StarVLA (EE)','Angle+M','256-bin','FAST','StarVLA (joint)','Angle','RoboMorpher']
def score(v, values, ref=False):
 best=max(values); joint=max(values[1:]); classes='result-score'
 if not ref and joint>0 and v==joint: classes+=' is-joint-best'
 if best>0 and v==best: classes+=' is-column-max'
 return f'<span class="{classes}">{v:.2f}</span>'
def rows(key=None):
 ds=[data[key]] if key else list(data.values())
 methods=[{m['name']:m for m in d['methods']} for d in ds]
 vals=[[methods[0][n]['tasks'][i] for n in order] for i in range(len(ds[0]['tasks']))] if key else []
 vals += [[m[n]['mean'] for n in order] for m in methods]
 out=[]
 for j,name in enumerate(order):
  if j in (0,1): out.append(f'<tr class="control-group"><th scope="rowgroup" colspan="{len(vals)+1}">{"End-effector reference" if j==0 else "Joint-space control"}</th></tr>')
  cls='method-ours' if name=='RoboMorpher' else 'method-reference' if j==0 else ''
  out.append(f'<tr class="{cls}" data-method="{e(name)}"><th class="method-column" scope="row">{e("VLA + RoboMorpher" if name=="RoboMorpher" else name)}</th>')
  for i,v in enumerate(vals):out.append(f'<td class="{"mean-column" if key and i==len(vals)-1 else ""}">{score(v[j],v,j==0)}</td>')
  out.append('</tr>')
 return ''.join(out)
setups={'os':('Dual-arm · opposite-side',[(12,2),(12,19)]),'ss':('Dual-arm · same-side',[(7,19),(17,19)]),'single':('Single-arm',[(12,19)])}
def icon(setup):
 return '<svg class="setup-icon" viewBox="0 0 24 22" aria-hidden="true"><rect x="4" y="6" width="16" height="9" rx="1.6" fill="none" stroke="currentColor" stroke-width="1.2" opacity=".5"/>'+''.join(f'<circle cx="{x}" cy="{y}" r="1.8" fill="currentColor"/>' for x,y in setups[setup][1])+'</svg>'
def table(key):
 d=data[key]; count=len(d['tasks'])+2
 cols='<colgroup><col style="width:var(--results-method-width)">'+ '<col style="width:70px">'*(count-1)+'</colgroup>'
 if key=='embodi':
  head='<tr><th rowspan="2" scope="col" class="method-column">Method</th>'
  for task in ['lift','pick','push','stack']:
   head+=f'<th scope="colgroup" colspan="{sum(t.startswith(task) for t in d["tasks"])}">{task.title()}</th>'
  head+='<th rowspan="2" scope="col" class="mean-column">Mean</th></tr><tr class="configuration-header">'
  for t in d['tasks']:
   setup=t.split()[-1].split('_')[-1];label=t.split()[0].split('_')[0].title()+' · '+setups[setup][0]
   head+=f'<th scope="col" aria-label="{label}" title="{label}">{icon(setup)}</th>'
  head+='</tr>'
 else:
  headers=['Method']+[t.capitalize() for t in d['tasks']]+['Mean']
  head='<tr>'+''.join(f'<th scope="col">{e(t)}</th>' for t in headers)+'</tr>'
 return f'<table class="comparison-table task-comparison-table {"embodi-comparison-table" if key=="embodi" else ""}" style="min-width:calc(var(--results-method-width) + {(count-1)*70}px)">{cols}<caption class="sr-only">Per-task success rates (%) on {"RoboTwin 2.0" if key=="robotwin" else "EmbodiBench"}</caption><thead>'+head+'</thead><tbody>'+rows(key)+'</tbody></table>'
p=root/'index.html';html=p.read_text()
html=re.sub(r'<tbody id="results-reference">.*?</tbody><tbody id="results-table">.*?</tbody>', '<tbody id="results-reference"></tbody><tbody id="results-table">'+rows()+'</tbody>',html,flags=re.S)
for key,ident in [('robotwin','robotwin-results-table'),('embodi','embodi-results-table')]:
 pattern=r'(<div[^>]*id="'+ident+r'"[^>]*>).*?(</div>)'
 html=re.sub(pattern,lambda m:m[1]+table(key)+m[2],html,flags=re.S)
legend=''.join(f'<span class="setup-legend-item">{icon(k)}{setups[k][0]}</span>' for k in ['os','ss','single'])
html=re.sub(r'(<div[^>]*id="embodi-setup-legend"[^>]*>).*?(</div>)',lambda m:m[1]+legend+m[2],html,flags=re.S)
p.write_text(html)
print('Rendered 3 results tables, 21 method rows.')
