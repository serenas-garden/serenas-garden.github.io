"""Check every place in travels-data.js against the baked map: each pin must
fall inside its own country, or within a few km of its (simplified) coast.
Also prints the closest pairs of places, which set how far the globe zooms.

  python3 tools/verify_places.py assets/globe-geo.js assets/travels-data.js
"""
import json, math, re, sys
src = open(sys.argv[1]).read()
G = json.loads(src[src.index('window.GLOBE_GEO = ')+19:].rstrip().rstrip(';'))
arcs=[]
for a in G['arcs']:
    x,y=a[0],a[1]; pts=[(x/100,y/100)]
    for i in range(2,len(a),2):
        x+=a[i]; y+=a[i+1]; pts.append((x/100,y/100))
    arcs.append(pts)
def ring(refs):
    out=[]
    for r in refs:
        p = arcs[r] if r>=0 else arcs[~r][::-1]
        out.extend(p if not out else p[1:])
    return out
def pip(pt, poly):
    x,y=pt; inside=False
    for i in range(len(poly)):
        x1,y1=poly[i]; x2,y2=poly[(i+1)%len(poly)]
        if (y1>y)!=(y2>y):
            xi = x1+(y-y1)*(x2-x1)/(y2-y1)
            if x<xi: inside = not inside
    return inside
def hav(a,b):
    (lo1,la1),(lo2,la2)=a,b
    p1,p2=math.radians(la1),math.radians(la2); dl=math.radians(lo2-lo1)
    h=math.sin((p2-p1)/2)**2+math.cos(p1)*math.cos(p2)*math.sin(dl/2)**2
    return 2*6371*math.asin(math.sqrt(h))
def seg_dist(p, a, b):
    # approx km distance from p to segment ab, in local equirectangular plane
    k=math.cos(math.radians(p[1]))
    ax,ay=(a[0]-p[0])*k*111.2,(a[1]-p[1])*111.2
    bx,by=(b[0]-p[0])*k*111.2,(b[1]-p[1])*111.2
    dx,dy=bx-ax,by-ay; L=dx*dx+dy*dy
    t=0 if L==0 else max(0,min(1,-(ax*dx+ay*dy)/L))
    return math.hypot(ax+t*dx, ay+t*dy)
countries={}
for c in G['countries']:
    countries[c['n']] = [[ring(r) for r in poly] for poly in c['p']]
def contains(name, pt):
    for poly in countries[name]:
        if pip(pt, poly[0]) and not any(pip(pt,h) for h in poly[1:]): return True
    return False
def nearest(pt):
    best=(1e9,None)
    for n,polys in countries.items():
        for poly in polys:
            for r in poly:
                for i in range(len(r)-1):
                    d=seg_dist(pt,r[i],r[i+1])
                    if d<best[0]: best=(d,n)
    return best

# read travels-data.js
t = open(sys.argv[2]).read()
geo_of = dict(re.findall(r'(\w\w): \{ name: "[^"]+",\s+geo: (?:"([^"]+)"|null)', t))
geo_of = {k:(v or None) for k,v in re.findall(r'(\w\w): \{ name: "[^"]+",\s*geo: (null|"[^"]+")', t)}
geo_of = {k:(None if v=='null' else v.strip('"')) for k,v in geo_of.items()}
places = re.findall(r'id: "([^"]+)", name: "([^"]+)", where: "([^"]+)", country: "(\w\w)",\s*lat: ([-\d.]+), lon: ([-\d.]+)', t)
print(len(places), 'places;', len(set(p[3] for p in places)), 'countries')
ok=True
for pid,name,where,cc,lat,lon in places:
    pt=(float(lon),float(lat)); g=geo_of[cc]
    ins = [n for n in countries if contains(n, pt)]
    d,nn = nearest(pt)
    status = 'IN '+','.join(ins) if ins else 'sea, %.1f km from %s' % (d, nn)
    good = (g in ins) if g else True
    if not ins and g and nn==g and d<12: good=True
    if not good: ok=False
    print(('OK  ' if good else 'BAD ')+'%-18s %-9s %8.4f %9.4f  %s' % (name, cc, float(lat), float(lon), status))
# min pairwise distances
ps=[(p[1],(float(p[5]),float(p[4]))) for p in places]
pairs=sorted((hav(a[1],b[1]),a[0],b[0]) for i,a in enumerate(ps) for b in ps[i+1:])
print('closest pairs:', [(round(d),a,b) for d,a,b in pairs[:6]])
print('ALL OK' if ok else 'PROBLEMS')
