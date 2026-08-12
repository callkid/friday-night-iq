from pathlib import Path


def rep(path, old, new):
    p = Path(path)
    s = p.read_text()
    n = s.count(old)
    if n != 1:
        raise SystemExit(f"{path}: expected one match, found {n}: {old[:120]!r}")
    p.write_text(s.replace(old, new, 1))


# game-iq-search.js: native first-down situation dimension.
rep(
    "game-iq-search.js",
    "function distanceBucket(d){d=Number(d)||10;return d<=3?'Short':d<=7?'Medium':'Long';}\nfunction resolvedCoverage",
    "function distanceBucket(d){d=Number(d)||10;return d<=3?'Short':d<=7?'Medium':'Long';}\nfunction firstDownSituation(down,distance){down=Number(down);distance=Number(distance);if(down!==1)return null;if(distance===10)return'Ten';if(distance>10)return'Long';if(distance<=3)return'Short';return'Medium';}\nfunction resolvedCoverage",
)
rep(
    "game-iq-search.js",
    "  down:{label:'Down'},\n  distanceBucket:{label:'Distance'},",
    "  down:{label:'Down'},\n  firstDownSituation:{label:'First down situation'},\n  distanceBucket:{label:'Distance'},",
)
rep(
    "game-iq-search.js",
    "  if(key==='down')return String(p.down);\n  if(key==='distanceBucket')return distanceBucket(p.distance);",
    "  if(key==='down')return String(p.down);\n  if(key==='firstDownSituation')return firstDownSituation(p.down,p.distance);\n  if(key==='distanceBucket')return distanceBucket(p.distance);",
)
rep(
    "game-iq-search.js",
    "  if(key==='down')return value==='1'?'1st Down':value==='2'?'2nd Down':value==='3'?'3rd Down':'4th Down';\n  if(key==='exactDistance')",
    "  if(key==='down')return value==='1'?'1st Down':value==='2'?'2nd Down':value==='3'?'3rd Down':'4th Down';\n  if(key==='firstDownSituation')return value==='Ten'?'1st & 10':value==='Long'?'1st & Long':value==='Short'?'1st & Short':'1st & Medium';\n  if(key==='exactDistance')",
)
rep(
    "game-iq-search.js",
    "  if(key==='distanceBucket'){\n    if(value==='Short')a=a.concat(['short','short yardage','1 3']);",
    "  if(key==='firstDownSituation'){\n    if(value==='Ten')a=a.concat(['1st 10','1st and 10','first and 10','first 10']);\n    if(value==='Long')a=a.concat(['1st long','1st and long','first and long']);\n    if(value==='Medium')a=a.concat(['1st medium','1st and medium']);\n    if(value==='Short')a=a.concat(['1st short','1st and short']);\n  }\n  if(key==='distanceBucket'){\n    if(value==='Short')a=a.concat(['short','short yardage','1 3']);",
)
rep(
    "game-iq-search.js",
    "    down:['1','2','3','4'],\n    distanceBucket:['Short','Medium','Long'],",
    "    down:['1','2','3','4'],\n    firstDownSituation:['Ten','Long','Medium','Short'],\n    distanceBucket:['Short','Medium','Long'],",
)
old_dd = """function downDistanceRows(E,plays,isExplosive){
  var groups={};
  (plays||[]).forEach(function(p){
    var k=String(p.down)+'|'+distanceBucket(p.distance);(groups[k]||(groups[k]=[])).push(p);
  });
  return Object.keys(groups).sort(function(a,b){
    var x=a.split('|'),y=b.split('|');return Number(x[0])-Number(y[0])||['Short','Medium','Long'].indexOf(x[1])-['Short','Medium','Long'].indexOf(y[1]);
  }).map(function(k){
    var a=groups[k],parts=k.split('|'),pressure=a.filter(function(p){return known(p.pressure);});
    return{
      key:k,label:displayValue('down',parts[0])+' & '+parts[1],n:a.length,
      front:topText(groupRows(E,a,'front',isExplosive),3),
      coverage:topText(groupRows(E,a,'coverage',isExplosive),3),
      blitzRate:pct(pressure.filter(isBlitz).length,pressure.length),blitzKnown:pressure.length
    };
  });
}"""
new_dd = """function downDistanceRows(E,plays,isExplosive){
  var groups={};
  (plays||[]).forEach(function(p){
    var down=Number(p.down),bucket=down===1?firstDownSituation(down,p.distance):distanceBucket(p.distance),k=String(down)+'|'+bucket;
    (groups[k]||(groups[k]=[])).push(p);
  });
  var firstOrder=['Ten','Long','Medium','Short'],otherOrder=['Short','Medium','Long'];
  return Object.keys(groups).sort(function(a,b){
    var x=a.split('|'),y=b.split('|'),xd=Number(x[0]),yd=Number(y[0]);
    if(xd!==yd)return xd-yd;
    return (xd===1?firstOrder:otherOrder).indexOf(x[1])-(yd===1?firstOrder:otherOrder).indexOf(y[1]);
  }).map(function(k){
    var a=groups[k],parts=k.split('|'),pressure=a.filter(function(p){return known(p.pressure);}),label=parts[0]==='1'?displayValue('firstDownSituation',parts[1]):displayValue('down',parts[0])+' & '+parts[1];
    return{
      key:k,label:label,n:a.length,
      front:topText(groupRows(E,a,'front',isExplosive),3),
      coverage:topText(groupRows(E,a,'coverage',isExplosive),3),
      blitzRate:pct(pressure.filter(isBlitz).length,pressure.length),blitzKnown:pressure.length
    };
  });
}"""
rep("game-iq-search.js", old_dd, new_dd)
rep(
    "game-iq-search.js",
    "      else{var z=key.split('|');add=cat.filter(function(x){return(x.key==='down'&&x.value===z[0])||(x.key==='distanceBucket'&&x.value===z[1]);});}",
    "      else{var z=key.split('|');if(z[0]==='1')add=cat.filter(function(x){return x.key==='firstDownSituation'&&x.value===z[1];});else add=cat.filter(function(x){return(x.key==='down'&&x.value===z[0])||(x.key==='distanceBucket'&&x.value===z[1]);});}",
)
rep(
    "game-iq-search.js",
    "  distanceBucket:distanceBucket,\n  resolvedCoverage:resolvedCoverage,",
    "  distanceBucket:distanceBucket,\n  firstDownSituation:firstDownSituation,\n  resolvedCoverage:resolvedCoverage,",
)

# game-iq-facets.js: native filter dimension; observer remains scoped only to chips.
rep(
    "game-iq-facets.js",
    "function distanceBucket(d){d=Number(d)||10;return d<=3?'Short':d<=7?'Medium':'Long';}\nfunction fieldZone",
    "function distanceBucket(d){d=Number(d)||10;return d<=3?'Short':d<=7?'Medium':'Long';}\nfunction firstDownSituation(down,distance){down=Number(down);distance=Number(distance);if(down!==1)return null;if(distance===10)return'Ten';if(distance>10)return'Long';if(distance<=3)return'Short';return'Medium';}\nfunction fieldZone",
)
rep(
    "game-iq-facets.js",
    " {key:'down',category:'Down',fixed:['1','2','3','4']},\n {key:'distanceBucket',category:'Distance',fixed:['Short','Medium','Long']},",
    " {key:'down',category:'Down',fixed:['1','2','3','4']},\n {key:'firstDownSituation',category:'First down situation',fixed:['Ten','Long','Medium','Short']},\n {key:'distanceBucket',category:'Distance',fixed:['Short','Medium','Long']},",
)
rep(
    "game-iq-facets.js",
    " if(key==='down')return String(p.down);if(key==='distanceBucket')return distanceBucket(p.distance);",
    " if(key==='down')return String(p.down);if(key==='firstDownSituation')return firstDownSituation(p.down,p.distance);if(key==='distanceBucket')return distanceBucket(p.distance);",
)
rep(
    "game-iq-facets.js",
    "function display(key,v){if(key==='down')return v==='1'?'1st Down':v==='2'?'2nd Down':v==='3'?'3rd Down':'4th Down';if(key==='front')",
    "function display(key,v){if(key==='down')return v==='1'?'1st Down':v==='2'?'2nd Down':v==='3'?'3rd Down':'4th Down';if(key==='firstDownSituation')return v==='Ten'?'1st & 10':v==='Long'?'1st & Long':v==='Short'?'1st & Short':'1st & Medium';if(key==='front')",
)

# game-iq-pro.js: Coach Now, Saved Views and drill-down use the same dimension.
rep(
    "game-iq-pro.js",
    " {key:'down',category:'Down',fixed:['1','2','3','4']},\n {key:'distanceBucket',category:'Distance',fixed:['Short','Medium','Long']},",
    " {key:'down',category:'Down',fixed:['1','2','3','4']},\n {key:'firstDownSituation',category:'First down situation',fixed:['Ten','Long','Medium','Short']},\n {key:'distanceBucket',category:'Distance',fixed:['Short','Medium','Long']},",
)
rep(
    "game-iq-pro.js",
    "function distanceBucket(d){d=Number(d)||10;return d<=3?'Short':d<=7?'Medium':'Long';}\nfunction resolvedCoverage",
    "function distanceBucket(d){d=Number(d)||10;return d<=3?'Short':d<=7?'Medium':'Long';}\nfunction firstDownSituation(down,distance){down=Number(down);distance=Number(distance);if(down!==1)return null;if(distance===10)return'Ten';if(distance>10)return'Long';if(distance<=3)return'Short';return'Medium';}\nfunction resolvedCoverage",
)
rep(
    "game-iq-pro.js",
    " if(key==='down')return String(p.down);if(key==='distanceBucket')return distanceBucket(p.distance);",
    " if(key==='down')return String(p.down);if(key==='firstDownSituation')return firstDownSituation(p.down,p.distance);if(key==='distanceBucket')return distanceBucket(p.distance);",
)
rep(
    "game-iq-pro.js",
    "function display(key,v){if(key==='down')return v==='1'?'1st Down':v==='2'?'2nd Down':v==='3'?'3rd Down':'4th Down';if(key==='front')",
    "function display(key,v){if(key==='down')return v==='1'?'1st Down':v==='2'?'2nd Down':v==='3'?'3rd Down':'4th Down';if(key==='firstDownSituation')return v==='Ten'?'1st & 10':v==='Long'?'1st & Long':v==='Short'?'1st & Short':'1st & Medium';if(key==='front')",
)
old_ad = "function adaptiveContext(E,plays,desired,isExplosive){var mandatory=(desired||[]).filter(function(f){return f.key==='down'||f.key==='distanceBucket';}),optional=(desired||[]).filter(function(f){return f.key!=='down'&&f.key!=='distanceBucket';}),filters=mandatory.concat(optional),rows=filterPlays(E,plays,filters,isExplosive),broadened=false;while(!rows.length&&optional.length){optional.pop();filters=mandatory.concat(optional);rows=filterPlays(E,plays,filters,isExplosive);broadened=true;}if(!rows.length&&mandatory.length>1){filters=mandatory.filter(function(f){return f.key==='down';});rows=filterPlays(E,plays,filters,isExplosive);broadened=true;}if(!rows.length){filters=[];rows=(plays||[]).slice();broadened=true;}return{filters:filters,plays:rows,broadened:broadened};}"
new_ad = "function adaptiveContext(E,plays,desired,isExplosive){var mandatory=(desired||[]).filter(function(f){return f.key==='down'||f.key==='distanceBucket'||f.key==='firstDownSituation';}),optional=(desired||[]).filter(function(f){return f.key!=='down'&&f.key!=='distanceBucket'&&f.key!=='firstDownSituation';}),filters=mandatory.concat(optional),rows=filterPlays(E,plays,filters,isExplosive),broadened=false;while(!rows.length&&optional.length){optional.pop();filters=mandatory.concat(optional);rows=filterPlays(E,plays,filters,isExplosive);broadened=true;}if(!rows.length&&mandatory.some(function(f){return f.key==='firstDownSituation';}))return{filters:mandatory,plays:[],broadened:broadened};if(!rows.length&&mandatory.length>1){filters=mandatory.filter(function(f){return f.key==='down';});rows=filterPlays(E,plays,filters,isExplosive);broadened=true;}if(!rows.length){filters=[];rows=(plays||[]).slice();broadened=true;}return{filters:filters,plays:rows,broadened:broadened};}"
rep("game-iq-pro.js", old_ad, new_ad)
old_cd = " function currentDesired(){var s=A.state.current||{},form=$('formation')&&$('formation').value,hash=$('hash')&&$('hash').value,desired=[{key:'down',value:String(s.down),category:'Down',display:display('down',String(s.down))},{key:'distanceBucket',value:distanceBucket(s.distance),category:'Distance',display:distanceBucket(s.distance)}];if(known(form))desired.push({key:'formation',value:form,category:'Formation',display:form});var zone=fieldZone(A.E,s);if(zone==='Red Zone'||zone==='Goal To Go')desired.push({key:'fieldZone',value:zone,category:'Field zone',display:zone});if(known(hash))desired.push({key:'hash',value:hash,category:'Hash',display:hash});return desired;}"
new_cd = " function currentDesired(){var s=A.state.current||{},form=$('formation')&&$('formation').value,hash=$('hash')&&$('hash').value,desired=Number(s.down)===1?[{key:'firstDownSituation',value:firstDownSituation(s.down,s.distance),category:'First down situation',display:display('firstDownSituation',firstDownSituation(s.down,s.distance))}]:[{key:'down',value:String(s.down),category:'Down',display:display('down',String(s.down))},{key:'distanceBucket',value:distanceBucket(s.distance),category:'Distance',display:distanceBucket(s.distance)}];if(known(form))desired.push({key:'formation',value:form,category:'Formation',display:form});var zone=fieldZone(A.E,s);if(zone==='Red Zone'||zone==='Goal To Go')desired.push({key:'fieldZone',value:zone,category:'Field zone',display:zone});if(known(hash))desired.push({key:'hash',value:hash,category:'Hash',display:hash});return desired;}"
rep("game-iq-pro.js", old_cd, new_cd)
old_al = " function actualCurrentLabel(){var s=A.state.current||{},parts=[(A.ord?A.ord(s.down):s.down)+' & '+distanceBucket(s.distance)],form=$('formation')&&$('formation').value,hash=$('hash')&&$('hash').value;if(known(form))parts.push(form);if(known(hash))parts.push(hash+' Hash');return parts.join(' · ');}"
new_al = " function actualCurrentLabel(){var s=A.state.current||{},base=Number(s.down)===1?display('firstDownSituation',firstDownSituation(s.down,s.distance)):(A.ord?A.ord(s.down):s.down)+' & '+distanceBucket(s.distance),parts=[base],form=$('formation')&&$('formation').value,hash=$('hash')&&$('hash').value;if(known(form))parts.push(form);if(known(hash))parts.push(hash+' Hash');return parts.join(' · ');}"
rep("game-iq-pro.js", old_al, new_al)
rep(
    "game-iq-pro.js",
    "return{DEFS:DEFS,known:known,distanceBucket:distanceBucket,resolvedCoverage:resolvedCoverage,",
    "return{DEFS:DEFS,known:known,distanceBucket:distanceBucket,firstDownSituation:firstDownSituation,resolvedCoverage:resolvedCoverage,",
)

# Replace observer-heavy polish with event-driven Saved Views presentation only.
Path("game-iq-polish.js").write_text(
    """(function(root){
'use strict';
var A=root.FNIQ,d=root.document;if(!A||!d||A.__gameIQPolish)return;A.__gameIQPolish=true;
function $(id){return d.getElementById(id);}
function ensureSavedCard(){
  var coach=$('coachNowCard'),pins=$('iqPins');if(!coach||!pins)return;
  var card=$('iqSavedViewsCard');
  if(!card){card=d.createElement('div');card.id='iqSavedViewsCard';card.className='card iqSavedViewsCard';card.innerHTML='<div class="cardhead"><div><div class="eyebrow">SAVED VIEWS</div><h2 class="section">Questions you want one tap away</h2><p class="muted">These are bookmarks, not the current situation. Save a Game IQ question and jump back to it later.</p></div></div><div id="iqSavedViewsHome"></div>';coach.insertAdjacentElement('afterend',card);}
  var home=$('iqSavedViewsHome');if(home&&pins.parentNode!==home)home.appendChild(pins);
  var foot=coach.querySelector('.coachNowFoot');if(foot)foot.classList.add('savedMoved');
  var pin=$('pinIQView');if(pin){pin.textContent='Save for quick access';pin.setAttribute('aria-label','Save this Game IQ question for quick access');if(!pin.dataset.savedViewsWired){pin.dataset.savedViewsWired='1';pin.addEventListener('click',function(){setTimeout(refresh,0);});}}
  var lab=pins.querySelector('.pinLabel');if(lab)lab.textContent='Saved views';
  if(!pins.dataset.savedViewsWired){pins.dataset.savedViewsWired='1';pins.addEventListener('click',function(){setTimeout(refresh,0);});}
}
function refresh(){ensureSavedCard();}
refresh();
var oldIQ=A.renderIQ;if(oldIQ)A.renderIQ=function(){var r=oldIQ.apply(A,arguments);refresh();return r;};
var oldAll=A.renderAll;if(oldAll)A.renderAll=function(){var r=oldAll.apply(A,arguments);refresh();return r;};
})(window);
"""
)

# Remove broad-observer first-down patch and bump release.
p = Path("game-iq-firstdown-ui.js")
if p.exists():
    p.unlink()
rep("app.js", "'game-iq-polish.js','game-iq-firstdown-ui.js','export.js'", "'game-iq-polish.js','export.js'")
rep("app.js", "?v=safety14", "?v=safety15")
rep("index.html", "app.js?v=safety14", "app.js?v=safety15")

# Focused native first-down / Saved Views QA.
Path("qa-game-iq-polish.js").write_text(
    r"""const assert=require('assert');
const fs=require('fs');
const S=require('./game-iq-search.js');
const F=require('./game-iq-facets.js');
const P=require('./game-iq-pro.js');
const E={fieldAbs:(side,y)=>side==='OPP'?100-Number(y):side==='50'?50:Number(y),success:p=>Number(p.yards)>=Number(p.distance)/2,isFirstDownResult:p=>Number(p.yards)>=Number(p.distance),officialNetYards:p=>Number(p.yards)||0};
const plays=[
 {number:1,down:1,distance:10,fieldSide:'OWN',yardLine:25,playType:'Run',yards:5,front:'4',coverage:'Cover 3',postCoverage:'Same as pre-snap',pressure:'None'},
 {number:2,down:1,distance:12,fieldSide:'OWN',yardLine:30,playType:'Pass',yards:8,front:'3',coverage:'Cover 1',postCoverage:'Cover 1',pressure:'5M'},
 {number:3,down:1,distance:3,fieldSide:'OWN',yardLine:38,playType:'Run',yards:4,front:'5',coverage:'Cover 2',postCoverage:'Same as pre-snap',pressure:'5M'},
 {number:4,down:2,distance:10,fieldSide:'OWN',yardLine:42,playType:'Pass',yards:6,front:'4',coverage:'Cover 3',postCoverage:'Cover 3',pressure:'None'}
];
assert.equal(S.firstDownSituation(1,10),'Ten');
assert.equal(S.firstDownSituation(1,11),'Long');
assert.equal(S.firstDownSituation(1,3),'Short');
assert.equal(S.filterPlays(E,plays,[{key:'firstDownSituation',value:'Ten'}]).length,1);
assert.equal(S.filterPlays(E,plays,[{key:'firstDownSituation',value:'Long'}]).length,1);
const labels=S.downDistanceRows(E,plays).map(x=>x.label);
assert(labels.includes('1st & 10'),'Coach shortcuts must include 1st & 10');
assert(labels.includes('1st & Long'),'Coach shortcuts must include 1st & Long');
assert(!labels.includes('1st Down & Long'));
assert.equal(F.valueFor(E,plays[0],'firstDownSituation'),'Ten');
assert.equal(P.valueFor(E,plays[0],'firstDownSituation'),'Ten');
assert.equal(P.display('firstDownSituation','Ten'),'1st & 10');
assert.equal(P.display('firstDownSituation','Long'),'1st & Long');
const polish=fs.readFileSync('game-iq-polish.js','utf8');
assert(polish.includes('SAVED VIEWS'));
assert(polish.includes('Save for quick access'));
assert(!polish.includes('MutationObserver'));
assert(!fs.existsSync('game-iq-firstdown-ui.js'));
console.log('First-down native integration and Saved Views QA passed');
"""
)

# Stress test repeated computation / mutation safety.
Path("qa-game-iq-stability.js").write_text(
    r"""const assert=require('assert');
const fs=require('fs');
const S=require('./game-iq-search.js');
const F=require('./game-iq-facets.js');
const P=require('./game-iq-pro.js');
const E={fieldAbs:(side,y)=>side==='OPP'?100-Number(y):side==='50'?50:Number(y),success:p=>Number(p.yards)>=Number(p.distance)/2,isFirstDownResult:p=>Number(p.yards)>=Number(p.distance),officialNetYards:p=>Number(p.yards)||0};
const fronts=['3','4','5'],covs=['Cover 1','Cover 2','Cover 3','Cover 4'],press=['None','5M','4F'];
const plays=[];
for(let i=0;i<240;i++){
 const down=(i%4)+1;
 const distance=down===1?[10,12,6,3][Math.floor(i/4)%4]:[2,6,10][i%3];
 plays.push({number:i+1,drive:Math.floor(i/8)+1,quarter:'Q'+((Math.floor(i/60)%4)+1),down,distance,fieldSide:i%3===0?'OPP':'OWN',yardLine:20+(i%29),hash:['Left','Middle','Right'][i%3],formation:['Trips Right','Doubles Left','Bunch Right'][i%3],personnel:'11',motion:'NA',front:fronts[i%3],safeties:String(i%3),box:String(5+(i%4)),coverage:covs[i%4],postCoverage:i%2?'Same as pre-snap':covs[(i+1)%4],pressure:press[i%3],playType:i%2?'Pass':'Run',attackDetail:i%2?'Short':'Inside Zone',conceptFamily:i%2?'Short Game':'Run',concept:'NA',direction:['Left','Middle','Right'][i%3],yards:(i%17)-3,tags:[]});
}
const original=JSON.stringify(plays);
const baseline=JSON.stringify(S.downDistanceRows(E,plays));
for(let i=0;i<1000;i++){
 assert.equal(JSON.stringify(S.downDistanceRows(E,plays)),baseline,'Shortcut grouping changed between identical renders');
 const ten=S.filterPlays(E,plays,[{key:'firstDownSituation',value:'Ten'}]);
 const long=S.filterPlays(E,plays,[{key:'firstDownSituation',value:'Long'}]);
 assert(ten.every(p=>p.down===1&&p.distance===10));
 assert(long.every(p=>p.down===1&&p.distance>10));
 const frontDef=F.DEFS.find(d=>d.key==='front');
 const fc=F.facetCounts(E,plays,[{key:'firstDownSituation',value:'Ten'}],frontDef);
 assert(fc.every(x=>Number.isFinite(x.count)));
 const pc=P.filterPlays(E,plays,[{key:'firstDownSituation',value:'Ten'}]);
 assert.equal(pc.length,ten.length);
}
assert.equal(JSON.stringify(plays),original,'Analytics computation mutated play data');
const facetSrc=fs.readFileSync('game-iq-facets.js','utf8');
const proSrc=fs.readFileSync('game-iq-pro.js','utf8');
const polishSrc=fs.readFileSync('game-iq-polish.js','utf8');
assert(!polishSrc.includes('MutationObserver'));
assert((proSrc.match(/MutationObserver/g)||[]).length<=2,'Pro observers unexpectedly multiplied');
assert((facetSrc.match(/MutationObserver/g)||[]).length===1,'Facets should observe only filter chips');
console.log('Game IQ stability stress QA passed: 1000 deterministic recomputation cycles');
"""
)

# QA workflow follows the stable architecture.
qpath = Path(".github/workflows/qa.yml")
q = qpath.read_text()
q = q.replace("          node --check game-iq-firstdown-ui.js\n", "")
q = q.replace("          node --check qa-game-iq-polish.js\n", "          node --check qa-game-iq-polish.js\n          node --check qa-game-iq-stability.js\n")
q = q.replace(
    "      - name: First-down situation and Saved Views tests\n        run: node qa-game-iq-polish.js\n",
    "      - name: First-down situation and Saved Views tests\n        run: node qa-game-iq-polish.js\n      - name: Game IQ stability stress tests\n        run: node qa-game-iq-stability.js\n",
)
q = q.replace(
    '          grep -q "1st & 10" game-iq-polish.js\n          grep -q "1st & Long" game-iq-polish.js\n',
    '          grep -q "1st & 10" game-iq-search.js\n          grep -q "1st & Long" game-iq-search.js\n          grep -q "firstDownSituation" game-iq-facets.js\n          grep -q "firstDownSituation" game-iq-pro.js\n',
)
q = q.replace('          grep -q "1st & 10" game-iq-firstdown-ui.js\n', "")
q = q.replace('          grep -q "1st & Long" game-iq-firstdown-ui.js\n', "")
q = q.replace('          grep -q "distanceFacet.style.display=first?\'none\':\'\'" game-iq-firstdown-ui.js\n', "")
q = q.replace(
    '          grep -q "game-iq-firstdown-ui.js" app.js\n',
    '          ! grep -q "game-iq-firstdown-ui.js" app.js\n          ! grep -q "MutationObserver" game-iq-polish.js\n',
)
q = q.replace('          grep -q "v=safety14" app.js\n', '          grep -q "v=safety15" app.js\n')
q = q.replace('          grep -q "app.js?v=safety14" index.html\n', '          grep -q "app.js?v=safety15" index.html\n')
q = q.replace(" game-iq-polish.js game-iq-firstdown-ui.js export.js", " game-iq-polish.js export.js")
q = q.replace(" qa-game-iq-polish.js qa-destructive-beta.js", " qa-game-iq-polish.js qa-game-iq-stability.js qa-destructive-beta.js")
qpath.write_text(q)

# Remove temporary patch machinery in the final commit.
for tmp in [Path(".github/workflows/game-iq-stability-patch.yml"), Path("tools/stability_patch.py")]:
    if tmp.exists():
        tmp.unlink()
