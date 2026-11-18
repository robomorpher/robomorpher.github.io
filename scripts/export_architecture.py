"""Export this project's shape-only architecture slide as an animated SVG."""
import sys, zipfile, xml.etree.ElementTree as E
from html import escape
from pathlib import Path
N={'a':'http://schemas.openxmlformats.org/drawingml/2006/main','p':'http://schemas.openxmlformats.org/presentationml/2006/main'}
def color(el,default='none'):
 c=el.find('a:solidFill/a:srgbClr',N) if el is not None else None
 return '#'+c.get('val') if c is not None else default
def num(el,key): return float(el.get(key,'0'))/9525
with zipfile.ZipFile(sys.argv[1]) as z:
 root=E.fromstring(z.read('ppt/slides/slide1.xml'))
 size=E.fromstring(z.read('ppt/presentation.xml')).find('p:sldSz',N)
 W,H=num(size,'cx'),num(size,'cy')
 out=[f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" role="img" aria-labelledby="title"><title id="title">RoboMorpher architecture: MorphGen, tokenizer pretraining, and morphology-aware action prediction</title><rect width="100%" height="100%" fill="white"/>', '<style>.signal{stroke-dasharray:7 25;animation:flow 2.8s linear infinite}@keyframes flow{to{stroke-dashoffset:-64}}@media(prefers-reduced-motion:reduce){.signal{display:none}}</style>']
 for i,s in enumerate(root.find('p:cSld/p:spTree',N)):
  pr=s.find('p:spPr',N)
  if pr is None: continue
  xf=pr.find('a:xfrm',N); off=xf.find('a:off',N); ext=xf.find('a:ext',N)
  x,y,w,h=num(off,'x'),num(off,'y'),num(ext,'cx'),num(ext,'cy')
  ln=pr.find('a:ln',N); stroke=color(ln); sw=num(ln,'w') if ln is not None else 0
  geom=pr.find('a:prstGeom',N).get('prst')
  if geom=='straightConnector1':
   x1,x2=(x+w,x) if xf.get('flipH')=='1' else (x,x+w)
   y1,y2=(y+h,y) if xf.get('flipV')=='1' else (y,y+h)
   marker=f'm{i}'
   out.append(f'<defs><marker id="{marker}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0L10 5L0 10Z" fill="{stroke}"/></marker></defs>')
   arrow=f' marker-end="url(#{marker})"' if ln.find('a:tailEnd',N) is not None else ''
   out.append(f'<path d="M{x1} {y1}L{x2} {y2}" stroke="{stroke}" stroke-width="{sw}"{arrow}/>')
   out.append(f'<path class="signal" style="animation-delay:-{i%7*.4}s" d="M{x1} {y1}L{x2} {y2}" stroke="#b7cdff" stroke-width="{max(1,sw*.65)}"/>')
  else:
   rx=11 if geom=='roundRect' else 0
   out.append(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{rx}" fill="{color(pr)}" stroke="{stroke}" stroke-width="{sw}"/>')
  body=s.find('p:txBody',N)
  if body is None: continue
  paras=body.findall('a:p',N)
  for j,p in enumerate(paras):
   text=''.join(t.text or '' for t in p.findall('.//a:t',N))
   if not text:continue
   rp=p.find('a:r/a:rPr',N)
   if rp is None:rp=p.find('a:pPr/a:defRPr',N)
   sz=float(rp.get('sz','1800'))/100*96/72
   pp=p.find('a:pPr',N); align=pp.get('algn','l') if pp is not None else 'l'
   anchor={'l':'start','ctr':'middle','r':'end'}.get(align,'start');tx=x+({'start':0,'middle':w/2,'end':w}[anchor])
   ty=y+h/2+(j-(len(paras)-1)/2)*sz*1.15
   out.append(f'<text x="{tx}" y="{ty}" dominant-baseline="central" text-anchor="{anchor}" font-family="Arial, sans-serif" font-size="{sz}" font-weight="{700 if rp.get("b")=="1" else 400}" fill="{color(rp,"#252b48")}">{escape(text)}</text>')
 out.append('</svg>')
 Path('assets/architecture-animated.svg').write_text('\n'.join(out))
 print(f'Exported {W:g} × {H:g} architecture SVG')
