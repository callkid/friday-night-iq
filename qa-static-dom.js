const fs=require('fs');
const assert=require('assert');
const html=fs.readFileSync('index.html','utf8');
const ids=new Set([...html.matchAll(/id="([^"]+)"/g)].map(m=>m[1]));
const refs=new Set();
for(const f of ['ui.js','analytics.js','export.js']){
  const s=fs.readFileSync(f,'utf8');
  for(const m of s.matchAll(/\$\('([^']+)'\)/g))refs.add(m[1]);
  for(const m of s.matchAll(/\$\("([^"]+)"\)/g))refs.add(m[1]);
}
const missing=[...refs].filter(x=>!ids.has(x)).sort();
assert.deepEqual(missing,[],`missing DOM ids: ${missing.join(', ')}`);
console.log('Static DOM references clean');
