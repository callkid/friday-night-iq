(function(root,factory){
'use strict';
var C=factory();
if(typeof module==='object'&&module.exports){module.exports=C;return;}
if(root.FNIQ)C.install(root.FNIQ,root);
})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';

function known(v){return v!=null&&v!==''&&v!=='NA'&&v!=='Unknown / N/A';}
function pct(a,b){return b?Math.round(a/b*100):0;}
function avg(a){return a.length?a.reduce(function(s,x){return s+x;},0)/a.length:0;}
function norm(v){return String(v==null?'':v).toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();}
function distanceBucket(d){d=Number(d)||10;return d<=3?'Short':d<=7?'Medium':'Long';}
function firstDownSituation(down,distance){down=Number(down);distance=Number(distance);if(down!==1)return null;if(distance===10)return'Ten';if(distance>10)return'Long';if(distance<=3)return'Short';return'Medium';}
function resolvedCoverage(p){
  var post=p&&p.postCoverage;
  if(known(post))return post==='Same as pre-snap'?(p.coverage||'NA'):post;
  return p&&p.coverage||'NA';
}
function isBlitz(p){return known(p&&p.pressure)&&p.pressure!=='None';}
function statPlays(E,plays){
  return(plays||[]).filter(function(p){
    if(p.playType!=='Run'&&p.playType!=='Pass')return false;
    if(p.penalty&&p.penalty.status==='Accepted'&&p.penalty.timing==='DEAD')return false;
    return true;
  });
}
function schemePlays(E,plays){
  return statPlays(E,plays).filter(function(p){return!(p.penalty&&p.penalty.status==='Accepted');});
}
function isTurnover(p){return(p.tags||[]).indexOf('Turnover')>=0||(p.tags||[]).indexOf('Fumble Lost')>=0||p.passResult==='Interception';}
function fieldZone(E,p){
  var a=E.fieldAbs(p.fieldSide,p.yardLine);
  if(a>=90)return'Goal To Go';
  if(a>=80)return'Red Zone';
  if(a>=60)return'Plus Territory';
  if(a>=40)return'Midfield';
  return'Own Territory';
}
function scoreState(p){
  var s=p&&p.scoreBefore;if(!s)return'Unknown';
  var d=(Number(s.us)||0)-(Number(s.them)||0);
  return d>0?'Leading':d<0?'Trailing':'Tied';
}
function resultFlags(E,p,isExplosive){
  var out=[];
  if(E.success(p))out.push('Success');
  if(E.isFirstDownResult(p))out.push('First Down');
  if((isExplosive&&isExplosive(p))||(p.tags||[]).indexOf('Explosive')>=0)out.push('Explosive');
  if((p.tags||[]).indexOf('Touchdown')>=0)out.push('Touchdown');
  if(isTurnover(p))out.push('Turnover');
  if((p.tags||[]).indexOf('Fumble')>=0)out.push('Fumble');
  if((p.tags||[]).indexOf('Fumble Lost')>=0)out.push('Fumble Lost');
  if(p.penalty)out.push('Penalty');
  return out;
}

var DIMENSIONS={
  quarter:{label:'Quarter'},
  down:{label:'Down'},
  firstDownSituation:{label:'First down situation'},
  distanceBucket:{label:'Distance'},
  exactDistance:{label:'Exact distance'},
  hash:{label:'Hash'},
  fieldZone:{label:'Field zone'},
  formation:{label:'Formation'},
  personnel:{label:'Personnel'},
  motion:{label:'Motion'},
  front:{label:'Front'},
  safeties:{label:'High safeties'},
  box:{label:'Box'},
  preCoverage:{label:'Pre-snap coverage'},
  coverage:{label:'Post-snap coverage'},
  blitz:{label:'Blitz'},
  pressure:{label:'Blitz type'},
  playType:{label:'Play type'},
  runType:{label:'Run Type'},
  passDepth:{label:'Pass depth'},
  conceptFamily:{label:'Concept family'},
  concept:{label:'Specific concept'},
  direction:{label:'Direction'},
  drive:{label:'Drive'},
  scoreState:{label:'Score state'},
  result:{label:'Result'}
};

function valueFor(E,p,key){
  if(key==='quarter')return p.quarter;
  if(key==='down')return String(p.down);
  if(key==='firstDownSituation')return firstDownSituation(p.down,p.distance);
  if(key==='distanceBucket')return distanceBucket(p.distance);
  if(key==='exactDistance')return String(p.distance);
  if(key==='hash')return p.hash;
  if(key==='fieldZone')return fieldZone(E,p);
  if(key==='formation')return p.formation;
  if(key==='personnel')return p.personnel;
  if(key==='motion')return p.motion;
  if(key==='front')return p.front;
  if(key==='safeties')return String(p.safeties);
  if(key==='box')return String(p.box);
  if(key==='preCoverage')return p.coverage;
  if(key==='coverage')return resolvedCoverage(p);
  if(key==='blitz')return isBlitz(p)?'Yes':known(p.pressure)?'No':'Unknown';
  if(key==='pressure')return p.pressure;
  if(key==='playType')return p.playType;
  if(key==='runType')return p.playType==='Run'?p.attackDetail:'NA';
  if(key==='passDepth')return p.playType==='Pass'?p.attackDetail:'NA';
  if(key==='conceptFamily')return p.conceptFamily;
  if(key==='concept')return p.concept;
  if(key==='direction')return p.direction;
  if(key==='drive')return String(p.drive);
  if(key==='scoreState')return scoreState(p);
  return null;
}

function displayValue(key,value){
  if(key==='down')return value==='1'?'1st Down':value==='2'?'2nd Down':value==='3'?'3rd Down':'4th Down';
  if(key==='firstDownSituation')return value==='Ten'?'1st & 10':value==='Long'?'1st & Long':value==='Short'?'1st & Short':'1st & Medium';
  if(key==='exactDistance')return value+' yards to go';
  if(key==='front')return value+' Down';
  if(key==='safeties')return value+' High';
  if(key==='box')return value+' Box';
  if(key==='blitz')return value==='Yes'?'Blitz':'No Blitz';
  if(key==='drive')return'Drive '+value;
  return value;
}

function aliasesFor(key,value){
  var a=[value,displayValue(key,value),DIMENSIONS[key].label+' '+value];
  if(key==='down'){
    if(value==='1')a=a.concat(['1st','first','first down']);
    if(value==='2')a=a.concat(['2nd','second','second down']);
    if(value==='3')a=a.concat(['3rd','third','third down']);
    if(value==='4')a=a.concat(['4th','fourth','fourth down']);
  }
  if(key==='firstDownSituation'){
    if(value==='Ten')a=a.concat(['1st 10','1st and 10','first and 10','first 10']);
    if(value==='Long')a=a.concat(['1st long','1st and long','first and long']);
    if(value==='Medium')a=a.concat(['1st medium','1st and medium']);
    if(value==='Short')a=a.concat(['1st short','1st and short']);
  }
  if(key==='distanceBucket'){
    if(value==='Short')a=a.concat(['short','short yardage','1 3']);
    if(value==='Medium')a=a.concat(['medium','med','4 7']);
    if(value==='Long')a=a.concat(['long','8 plus']);
  }
  if(key==='hash')a.push(value+' hash');
  if(key==='blitz'&&value==='Yes')a=a.concat(['blitz','pressure','blitzing']);
  if(key==='blitz'&&value==='No')a=a.concat(['no blitz','no pressure']);
  if(key==='playType'&&value==='Pass')a=a.concat(['throw','throwing']);
  if(key==='playType'&&value==='Run')a=a.concat(['rush','running']);
  return a.map(norm).filter(Boolean);
}

function distinct(plays,fn){
  var seen={},out=[];
  (plays||[]).forEach(function(p){
    var v=fn(p);if(!known(v)||seen[String(v)])return;
    seen[String(v)]=1;out.push(String(v));
  });
  return out.sort();
}

function buildCatalog(E,plays,isExplosive){
  plays=plays||[];
  var values={
    quarter:['Q1','Q2','Q3','Q4','OT'],
    down:['1','2','3','4'],
    firstDownSituation:['Ten','Long','Medium','Short'],
    distanceBucket:['Short','Medium','Long'],
    exactDistance:distinct(plays,function(p){return String(p.distance);}),
    hash:['Left','Middle','Right'],
    fieldZone:['Own Territory','Midfield','Plus Territory','Red Zone','Goal To Go'],
    formation:distinct(plays,function(p){return p.formation;}),
    personnel:distinct(plays,function(p){return p.personnel;}),
    motion:distinct(plays,function(p){return p.motion;}),
    front:distinct(plays,function(p){return p.front;}),
    safeties:distinct(plays,function(p){return String(p.safeties);}),
    box:distinct(plays,function(p){return String(p.box);}),
    preCoverage:distinct(plays,function(p){return p.coverage;}),
    coverage:distinct(plays,resolvedCoverage),
    blitz:['Yes','No'],
    pressure:distinct(plays,function(p){return p.pressure;}),
    playType:['Run','Pass'],
    runType:distinct(plays,function(p){return p.playType==='Run'?p.attackDetail:'NA';}),
    passDepth:distinct(plays,function(p){return p.playType==='Pass'?p.attackDetail:'NA';}),
    conceptFamily:distinct(plays,function(p){return p.conceptFamily;}),
    concept:distinct(plays,function(p){return p.concept;}),
    direction:['Left','Middle','Right'],
    drive:distinct(plays,function(p){return String(p.drive);}),
    scoreState:['Leading','Tied','Trailing'],
    result:['Success','First Down','Explosive','Touchdown','Turnover','Fumble','Fumble Lost','Penalty']
  };
  var out=[];
  Object.keys(values).forEach(function(key){
    values[key].forEach(function(value){
      if(!known(value))return;
      out.push({
        key:key,
        value:String(value),
        category:DIMENSIONS[key].label,
        display:displayValue(key,String(value)),
        label:DIMENSIONS[key].label+': '+displayValue(key,String(value)),
        aliases:aliasesFor(key,String(value))
      });
    });
  });
  return out;
}

function matchesFilter(E,p,f,isExplosive){
  if(f.key==='result')return resultFlags(E,p,isExplosive).indexOf(f.value)>=0;
  return String(valueFor(E,p,f.key))===String(f.value);
}
function filterPlays(E,plays,filters,isExplosive){
  return(plays||[]).filter(function(p){return(filters||[]).every(function(f){return matchesFilter(E,p,f,isExplosive);});});
}

function suggestionScore(item,q){
  q=norm(q);if(!q)return 0;
  var label=norm(item.label),display=norm(item.display),score=0;
  if(display===q)score+=100;
  if(label.indexOf(q)===0)score+=70;
  if(display.indexOf(q)===0)score+=65;
  if(label.indexOf(q)>=0)score+=40;
  item.aliases.forEach(function(a){if(a===q)score=Math.max(score,90);else if(a.indexOf(q)>=0||q.indexOf(a)>=0)score=Math.max(score,50);});
  var words=q.split(/\s+/).filter(Boolean);
  if(words.length&&words.every(function(w){return label.indexOf(w)>=0||item.aliases.some(function(a){return a.indexOf(w)>=0;});}))score+=25;
  return score;
}
function suggestions(catalog,q,filters,limit){
  var chosen={};(filters||[]).forEach(function(f){chosen[f.key+'|'+f.value]=1;});
  return(catalog||[]).map(function(x){return{x:x,s:suggestionScore(x,q)};}).filter(function(z){return z.s>0&&!chosen[z.x.key+'|'+z.x.value];}).sort(function(a,b){return b.s-a.s||a.x.label.localeCompare(b.x.label);}).slice(0,limit||8).map(function(z){return z.x;});
}

function parseQuery(catalog,q,filters){
  var text=norm(q),tokens=text.split(/\s+/),chosen={},out=[];
  (filters||[]).forEach(function(f){chosen[f.key+'|'+f.value]=1;});
  var ranked=(catalog||[]).map(function(x){
    var best=0;x.aliases.forEach(function(a){
      if(!a)return;
      if(text===a)best=Math.max(best,100+a.length);
      else if((' '+text+' ').indexOf(' '+a+' ')>=0)best=Math.max(best,70+a.length);
      else{
        var aw=a.split(/\s+/);if(aw.length>1&&aw.every(function(w){return tokens.indexOf(w)>=0;}))best=Math.max(best,50+a.length);
      }
    });
    return{x:x,s:best};
  }).filter(function(z){return z.s>0;}).sort(function(a,b){return b.s-a.s;});
  ranked.forEach(function(z){
    var k=z.x.key+'|'+z.x.value;if(chosen[k])return;
    if(out.some(function(x){return x.key===z.x.key;}))return;
    chosen[k]=1;out.push(z.x);
  });
  return out;
}

function summary(E,plays,isExplosive){
  var ps=statPlays(E,plays),runs=ps.filter(function(p){return p.playType==='Run';}),passes=ps.filter(function(p){return p.playType==='Pass';});
  var knownPressure=plays.filter(function(p){return known(p.pressure);});
  return{
    observations:plays.length,
    plays:ps.length,
    ypp:avg(ps.map(E.officialNetYards)),
    success:pct(ps.filter(E.success).length,ps.length),
    runs:runs.length,
    passes:passes.length,
    blitzRate:pct(knownPressure.filter(isBlitz).length,knownPressure.length),
    blitzKnown:knownPressure.length,
    explosives:ps.filter(function(p){return(isExplosive&&isExplosive(p))||(p.tags||[]).indexOf('Explosive')>=0;}).length,
    turnovers:ps.filter(isTurnover).length
  };
}

function groupRows(E,plays,key,isExplosive){
  var groups={};
  (plays||[]).forEach(function(p){
    var vals=[];
    if(key==='result')vals=resultFlags(E,p,isExplosive);
    else vals=[valueFor(E,p,key)];
    vals.forEach(function(v){if(!known(v)||v==='Unknown')return;(groups[String(v)]||(groups[String(v)]=[])).push(p);});
  });
  var total=plays.length;
  return Object.keys(groups).map(function(v){
    var a=groups[v],s=summary(E,a,isExplosive);
    return{value:v,label:displayValue(key,v),n:a.length,share:pct(a.length,total),ypp:s.ypp,success:s.success};
  }).sort(function(a,b){return b.n-a.n||b.ypp-a.ypp;});
}

function topText(rows,limit){
  return(rows||[]).slice(0,limit||3).map(function(r){return r.label+' '+r.n+' ('+r.share+'%)';}).join(' • ')||'No known data';
}
function downDistanceRows(E,plays,isExplosive){
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
}
function formationRows(E,plays,isExplosive){
  var groups={};
  (plays||[]).forEach(function(p){if(known(p.formation))(groups[p.formation]||(groups[p.formation]=[])).push(p);});
  return Object.keys(groups).map(function(f){
    var a=groups[f],pressure=a.filter(function(p){return known(p.pressure);});
    return{
      key:f,label:f,n:a.length,
      front:topText(groupRows(E,a,'front',isExplosive),3),
      coverage:topText(groupRows(E,a,'coverage',isExplosive),3),
      blitzRate:pct(pressure.filter(isBlitz).length,pressure.length),blitzKnown:pressure.length
    };
  }).sort(function(a,b){return b.n-a.n;});
}

var SHOW_MODES=[
  {key:'summary',label:'Summary'},
  {key:'frontCoverage',label:'Front + Coverage'},
  {key:'front',label:'Front'},
  {key:'coverage',label:'Coverage'},
  {key:'pressure',label:'Blitz Type'},
  {key:'formation',label:'Formation'},
  {key:'runType',label:'Run Type'},
  {key:'conceptFamily',label:'Concept Family'},
  {key:'concept',label:'Specific Concept'},
  {key:'result',label:'Results'}
];

function install(A,root){
  if(!A||!root.document||A.__gameIQSearch)return A;
  A.__gameIQSearch=true;
  var d=root.document,filters=[],mode='summary',priority='downDistance';
  function $(id){return d.getElementById(id);}
  function esc(s){return A.esc?A.esc(s):String(s);}

  function injectCss(){
    if($('gameIQSearchCss'))return;
    var l=d.createElement('link');l.id='gameIQSearchCss';l.rel='stylesheet';l.href='game-iq-search.css?v=search2';d.head.appendChild(l);
  }
  function ensureUi(){
    var iq=$('iq');if(!iq||$('iqSearchCard'))return;
    var metrics=$('metrics');
    var priorityCard=d.createElement('div');priorityCard.id='iqPriorityCard';priorityCard.className='card iqPriorityCard';
    priorityCard.innerHTML='<div class="cardhead"><div><h2 class="section">Coach shortcuts</h2><p class="muted">The fastest answers to the two defensive questions your staff cares about most.</p></div><span class="tinybadge">1 TAP</span></div><div class="priorityButtons"><button class="btn primary" data-priority="downDistance">Front + Coverage by Down & Distance</button><button class="btn" data-priority="formation">Front + Coverage by Formation</button></div><div id="iqPriorityResults" class="priorityResults"></div>';
    var search=d.createElement('div');search.id='iqSearchCard';search.className='card iqSearchCard';
    search.innerHTML='<div class="cardhead"><div><h2 class="section">Search Game IQ</h2><p class="muted">Search broad or stack filters until you have the exact football question. Example: 3rd short left hash blitz pass.</p></div><span id="iqSearchCount" class="tinybadge">0 plays</span></div><div class="iqSearchBox"><input id="iqSearchInput" autocomplete="off" placeholder="Search formation, down, hash, blitz, coverage, concept..."><div id="iqSuggestions" class="iqSuggestions hidden"></div></div><div id="iqFilterChips" class="iqFilterChips"></div><div class="showBar"><span>Show me</span><div id="iqShowModes" class="quickcontext"></div></div><div id="iqSearchAnswer" class="iqSearchAnswer"></div>';
    if(metrics&&metrics.parentNode){metrics.parentNode.insertBefore(priorityCard,metrics);metrics.parentNode.insertBefore(search,metrics);}else{iq.insertBefore(search,iq.firstChild);iq.insertBefore(priorityCard,search);}
    priorityCard.querySelectorAll('[data-priority]').forEach(function(b){b.onclick=function(){priority=b.dataset.priority;priorityCard.querySelectorAll('[data-priority]').forEach(function(x){x.classList.toggle('primary',x===b);});renderPriority();};});
    SHOW_MODES.forEach(function(x){var b=d.createElement('button');b.type='button';b.className='contextbtn'+(x.key===mode?' on':'');b.dataset.mode=x.key;b.textContent=x.label;b.onclick=function(){mode=x.key;renderModes();renderSearch();};$('iqShowModes').appendChild(b);});
    var input=$('iqSearchInput');
    input.addEventListener('input',renderSuggestions);
    input.addEventListener('focus',renderSuggestions);
    input.addEventListener('keydown',function(e){
      if(e.key==='Enter'){
        e.preventDefault();var cat=buildCatalog(A.E,A.state.plays,A.isExplosive),parsed=parseQuery(cat,input.value,filters),sug=suggestions(cat,input.value,filters,1);
        if(parsed.length)parsed.forEach(addFilter);else if(sug[0])addFilter(sug[0]);
        input.value='';renderSuggestions();
      }else if(e.key==='Escape')$('iqSuggestions').classList.add('hidden');
    });
    d.addEventListener('click',function(e){if(!search.contains(e.target))$('iqSuggestions').classList.add('hidden');});
  }
  function addFilter(f){
    if(!f||filters.some(function(x){return x.key===f.key&&x.value===f.value;}))return;
    filters.push({key:f.key,value:f.value,category:f.category,display:f.display,label:f.label,aliases:f.aliases||[]});renderFilters();renderSearch();
  }
  function removeFilter(i){filters.splice(i,1);renderFilters();renderSearch();}
  function renderFilters(){
    var box=$('iqFilterChips');if(!box)return;box.innerHTML='';
    filters.forEach(function(f,i){var b=d.createElement('button');b.type='button';b.className='iqFilterChip';b.innerHTML='<span>'+esc(f.label)+'</span><b>×</b>';b.onclick=function(){removeFilter(i);};box.appendChild(b);});
    if(filters.length){var clear=d.createElement('button');clear.type='button';clear.className='iqClear';clear.textContent='Clear all';clear.onclick=function(){filters=[];renderFilters();renderSearch();};box.appendChild(clear);}
  }
  function renderSuggestions(){
    var input=$('iqSearchInput'),box=$('iqSuggestions');if(!input||!box)return;
    var q=input.value.trim();if(!q){box.classList.add('hidden');box.innerHTML='';return;}
    var cat=buildCatalog(A.E,A.state.plays,A.isExplosive),rows=suggestions(cat,q,filters,8);
    if(!rows.length){box.innerHTML='<div class="iqSuggestionEmpty">No matching filter yet. Keep typing or use a coach shortcut.</div>';box.classList.remove('hidden');return;}
    box.innerHTML='';rows.forEach(function(x){var b=d.createElement('button');b.type='button';b.className='iqSuggestion';b.innerHTML='<span>'+esc(x.display)+'</span><small>'+esc(x.category)+'</small>';b.onclick=function(){addFilter(x);input.value='';box.classList.add('hidden');input.focus();};box.appendChild(b);});box.classList.remove('hidden');
  }
  function renderModes(){if(!$('iqShowModes'))return;$('iqShowModes').querySelectorAll('[data-mode]').forEach(function(b){b.classList.toggle('on',b.dataset.mode===mode);});}
  function confidence(n){return n>=8?'HIGHER':n>=4?'MEDIUM':'LOW';}
  function summaryHtml(rows){
    var s=summary(A.E,rows,A.isExplosive),c=confidence(s.plays),front=groupRows(A.E,rows,'front',A.isExplosive),cov=groupRows(A.E,rows,'coverage',A.isExplosive),pressure=groupRows(A.E,rows,'pressure',A.isExplosive);
    return'<div class="searchSummary"><div class="searchKpis"><div><span>Sample</span><b>'+s.plays+'</b><small>'+c+' confidence</small></div><div><span>Net YPP</span><b>'+s.ypp.toFixed(1)+'</b><small>'+s.success+'% success</small></div><div><span>Run / Pass</span><b>'+s.runs+' / '+s.passes+'</b><small>'+s.explosives+' explosives</small></div><div><span>Blitz</span><b>'+(s.blitzKnown?s.blitzRate+'%':'—')+'</b><small>'+s.blitzKnown+' known looks</small></div></div><div class="searchQuick"><div><strong>Front</strong><span>'+esc(topText(front,3))+'</span></div><div><strong>Coverage</strong><span>'+esc(topText(cov,3))+'</span></div><div><strong>Blitz type</strong><span>'+esc(topText(pressure,3))+'</span></div></div></div>';
  }
  function frontCoverageRows(rows){
    var g={};rows.forEach(function(p){var f=known(p.front)?p.front:'Unknown',c=known(resolvedCoverage(p))?resolvedCoverage(p):'Unknown',k=f+'|'+c;(g[k]||(g[k]=[])).push(p);});
    return Object.keys(g).map(function(k){var p=k.split('|'),a=g[k],s=summary(A.E,a,A.isExplosive);return{label:p[0]+' Down + '+p[1],n:a.length,share:pct(a.length,rows.length),ypp:s.ypp,success:s.success};}).sort(function(a,b){return b.n-a.n;});
  }
  function tableHtml(rows,title){
    if(!rows.length)return'<div class="emptyIQ">No plays match this view yet.</div>';
    return'<div class="iqResultTitle">'+esc(title)+'</div><div class="iqResultTable">'+rows.slice(0,18).map(function(r){return'<div class="iqResultRow"><div><strong>'+esc(r.label)+'</strong><span>'+r.n+' play'+(r.n===1?'':'s')+' • '+r.share+'%</span></div><div><b>'+r.ypp.toFixed(1)+' YPP</b><span>'+r.success+'% success</span></div></div>';}).join('')+'</div>';
  }
  function renderSearch(){
    ensureUi();var box=$('iqSearchAnswer');if(!box)return;
    var rows=filterPlays(A.E,A.state.plays,filters,A.isExplosive),count=statPlays(A.E,rows).length;
    $('iqSearchCount').textContent=count+' play'+(count===1?'':'s');
    var title=filters.length?filters.map(function(f){return f.display;}).join(' + '):'All offensive plays';
    if(mode==='summary')box.innerHTML='<div class="iqResultTitle">'+esc(title)+'</div>'+summaryHtml(rows);
    else if(mode==='frontCoverage')box.innerHTML=tableHtml(frontCoverageRows(rows),'Front + Coverage • '+title);
    else box.innerHTML=tableHtml(groupRows(A.E,rows,mode,A.isExplosive),SHOW_MODES.find(function(x){return x.key===mode;}).label+' • '+title);
  }
  function priorityHtml(rows,type){
    if(!rows.length)return'<div class="emptyIQ">Log more known defensive looks to build this shortcut.</div>';
    return rows.map(function(r){
      return'<button class="priorityRow" type="button" data-pkey="'+esc(r.key)+'"><div class="priorityHead"><strong>'+esc(r.label)+'</strong><span>n='+r.n+'</span></div><div><b>Front</b><span>'+esc(r.front)+'</span></div><div><b>Coverage</b><span>'+esc(r.coverage)+'</span></div><div><b>Blitz</b><span>'+(r.blitzKnown?r.blitzRate+'% ('+r.blitzKnown+' known)':'Not charted')+'</span></div></button>';
    }).join('');
  }
  function renderPriority(){
    ensureUi();var box=$('iqPriorityResults');if(!box)return;
    var rows=priority==='formation'?formationRows(A.E,A.state.plays,A.isExplosive):downDistanceRows(A.E,A.state.plays,A.isExplosive);
    box.innerHTML=priorityHtml(rows,priority);
    box.querySelectorAll('[data-pkey]').forEach(function(b){b.onclick=function(){
      var cat=buildCatalog(A.E,A.state.plays,A.isExplosive),key=b.dataset.pkey,add=[];
      if(priority==='formation')add=cat.filter(function(x){return x.key==='formation'&&x.value===key;});
      else{var z=key.split('|');if(z[0]==='1')add=cat.filter(function(x){return x.key==='firstDownSituation'&&x.value===z[1];});else add=cat.filter(function(x){return(x.key==='down'&&x.value===z[0])||(x.key==='distanceBucket'&&x.value===z[1]);});}
      filters=[];add.forEach(addFilter);mode='frontCoverage';renderModes();renderFilters();renderSearch();$('iqSearchCard').scrollIntoView({behavior:'smooth',block:'start'});
    };});
  }
  function fixExplosiveMetric(){
    var metrics=$('metrics');if(!metrics)return;
    [].forEach.call(metrics.querySelectorAll('.metric'),function(m){var s=m.querySelector('.muted');if(s&&s.textContent.trim()==='Explosives'){var b=m.querySelector('b'),ps=statPlays(A.E,A.state.plays);if(b)b.textContent=ps.filter(function(p){return A.isExplosive?A.isExplosive(p):(p.tags||[]).indexOf('Explosive')>=0;}).length;}});
  }

  injectCss();ensureUi();renderFilters();renderSearch();renderPriority();
  var old=A.renderIQ;
  if(old)A.renderIQ=function(){var r=old.call(A);ensureUi();renderPriority();renderSearch();fixExplosiveMetric();return r;};
  return A;
}

return{
  known:known,
  distanceBucket:distanceBucket,
  firstDownSituation:firstDownSituation,
  resolvedCoverage:resolvedCoverage,
  isBlitz:isBlitz,
  fieldZone:fieldZone,
  scoreState:scoreState,
  resultFlags:resultFlags,
  buildCatalog:buildCatalog,
  filterPlays:filterPlays,
  suggestions:suggestions,
  parseQuery:parseQuery,
  summary:summary,
  groupRows:groupRows,
  downDistanceRows:downDistanceRows,
  formationRows:formationRows,
  install:install
};
});
