(function(root,factory){
'use strict';
var C=factory();
if(typeof module==='object'&&module.exports){module.exports=C;return;}
if(root.FNIQ)C.install(root.FNIQ,root);
})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';

function known(v){return v!=null&&v!==''&&v!=='NA'&&v!=='Unknown'&&v!=='Unknown / N/A';}
function pct(a,b){return b?Math.round(a/b*100):0;}
function avg(a){return a&&a.length?a.reduce(function(s,x){return s+x;},0)/a.length:0;}
function bucket(d){d=Number(d)||10;return d<=3?'Short':d<=7?'Medium':'Long';}
function firstDownSituation(down,distance){
  down=Number(down);distance=Number(distance);
  if(down!==1)return null;
  if(distance===10)return'Ten';
  if(distance>10)return'Long';
  if(distance<=3)return'Short';
  return'Medium';
}
function situationLabel(down,distance){
  down=Number(down);distance=Number(distance);
  if(down===1){
    var x=firstDownSituation(down,distance);
    return x==='Ten'?'1st & 10':x==='Long'?'1st & Long':x==='Short'?'1st & Short':'1st & Medium';
  }
  var ord=down===2?'2nd':down===3?'3rd':down===4?'4th':String(down)+'th';
  return ord+' & '+bucket(distance);
}
function specialMatches(p,value){
  if(Number(p&&p.down)!==1)return false;
  var d=Number(p.distance);
  if(value==='Ten')return d===10;
  if(value==='Long')return d>10;
  if(value==='Short')return d<=3;
  if(value==='Medium')return d>=4&&d<10;
  return false;
}
function resolvedCoverage(p){
  var x=p&&p.postCoverage;
  if(known(x))return x==='Same as pre-snap'?(p.coverage||'NA'):x;
  return p&&p.coverage||'NA';
}
function isBlitz(p){return known(p&&p.pressure)&&p.pressure!=='None';}
function fieldAbs(p){
  if(!p)return 0;
  if(p.fieldSide==='50')return 50;
  var y=Number(p.yardLine)||0;
  return p.fieldSide==='OPP'?100-y:y;
}
function fieldZone(p){var a=fieldAbs(p);return a>=90?'Goal To Go':a>=80?'Red Zone':a>=60?'Plus Territory':a>=40?'Midfield':'Own Territory';}
function scoreState(p){var s=p&&p.scoreBefore;if(!s)return'Unknown';var d=(Number(s.us)||0)-(Number(s.them)||0);return d>0?'Leading':d<0?'Trailing':'Tied';}
function hasTag(p,t){return Array.isArray(p&&p.tags)&&p.tags.indexOf(t)>=0;}
function isExplosive(A,p){
  if(A&&A.isExplosive)return A.isExplosive(p);
  if(p.playType==='Run')return Number(p.yards)>=12;
  if(p.playType==='Pass')return Number(p.yards)>=16;
  return false;
}
function resultFlags(A,p){
  var a=[];
  if(A&&A.E&&A.E.success&&A.E.success(p))a.push('Success');
  if(A&&A.E&&A.E.isFirstDownResult&&A.E.isFirstDownResult(p))a.push('First Down');
  if(isExplosive(A,p)||hasTag(p,'Explosive'))a.push('Explosive');
  if(hasTag(p,'Touchdown'))a.push('Touchdown');
  if(hasTag(p,'Turnover')||p.passResult==='Interception'||hasTag(p,'Fumble Lost'))a.push('Turnover');
  if(p.passResult==='Interception'||hasTag(p,'Interception'))a.push('Interception');
  if(hasTag(p,'Fumble'))a.push('Fumble');
  if(hasTag(p,'Fumble Lost'))a.push('Fumble Lost');
  if(p.penalty)a.push('Penalty');
  return a;
}
var CAT_TO_KEY={
  'Down':'down','Distance':'distanceBucket','Exact distance':'exactDistance','Hash':'hash','Field zone':'fieldZone',
  'Formation':'formation','Personnel':'personnel','Motion':'motion','Front':'front','High safeties':'safeties','Box':'box',
  'Pre-snap coverage':'preCoverage','Post-snap coverage':'coverage','Blitz':'blitz','Blitz type':'pressure','Play type':'playType',
  'Run Type':'runType','Pass depth':'passDepth','Concept family':'conceptFamily','Specific concept':'concept','Direction':'direction',
  'Drive':'drive','Score state':'scoreState','Result':'result','Quarter':'quarter'
};
function undisp(key,v){
  if(key==='down')return /^1st/.test(v)?'1':/^2nd/.test(v)?'2':/^3rd/.test(v)?'3':'4';
  if(key==='front')return String(v).replace(/\s*Down$/,'');
  if(key==='safeties')return String(v).replace(/\s*High$/,'');
  if(key==='box')return String(v).replace(/\s*Box$/,'');
  if(key==='exactDistance')return String(v).replace(/\s*yards to go$/,'');
  if(key==='drive')return String(v).replace(/^Drive\s+/,'');
  if(key==='blitz')return v==='Blitz'?'Yes':v==='No Blitz'?'No':v;
  return v;
}
function valueFor(p,key){
  if(key==='down')return String(p.down);
  if(key==='distanceBucket')return bucket(p.distance);
  if(key==='exactDistance')return String(p.distance);
  if(key==='hash')return p.hash;
  if(key==='fieldZone')return fieldZone(p);
  if(key==='formation')return p.formation;
  if(key==='personnel')return p.personnel;
  if(key==='motion')return p.motion;
  if(key==='front')return String(p.front);
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
  if(key==='quarter')return p.quarter;
  if(key==='drive')return String(p.drive);
  if(key==='scoreState')return scoreState(p);
  return null;
}
function matchesFilter(A,p,f){
  if(f.key==='firstDownSituation')return specialMatches(p,f.value);
  if(f.key==='result')return resultFlags(A,p).indexOf(f.value)>=0;
  return String(valueFor(p,f.key))===String(f.value);
}
function filterPlays(A,plays,filters){return(plays||[]).filter(function(p){return(filters||[]).every(function(f){return matchesFilter(A,p,f);});});}
function readDomFilters(d){
  var out=[];
  d.querySelectorAll('#iqFilterChips .iqFilterChip span').forEach(function(s){
    var txt=s.textContent.trim();
    if(txt.indexOf('Situation: ')===0){
      var sv=txt.slice(11),val=sv==='1st & 10'?'Ten':sv==='1st & Long'?'Long':sv==='1st & Short'?'Short':sv==='1st & Medium'?'Medium':null;
      if(val)out.push({key:'firstDownSituation',value:val,category:'Situation',display:sv,label:'Situation: '+sv});
      return;
    }
    var i=txt.indexOf(': ');if(i<0)return;
    var cat=txt.slice(0,i),disp=txt.slice(i+2),key=CAT_TO_KEY[cat];if(!key)return;
    out.push({key:key,value:undisp(key,disp),category:cat,display:disp,label:txt});
  });
  return out;
}
function officialYards(A,p){return A&&A.E&&A.E.officialNetYards?Number(A.E.officialNetYards(p))||0:Number(p.yards)||0;}
function statPlays(plays){return(plays||[]).filter(function(p){if(p.playType!=='Run'&&p.playType!=='Pass')return false;if(p.penalty&&p.penalty.status==='Accepted'&&p.penalty.timing==='DEAD')return false;return true;});}
function summary(A,plays){var s=statPlays(plays);return{n:s.length,ypp:avg(s.map(function(p){return officialYards(A,p);})),success:pct(s.filter(function(p){return A&&A.E&&A.E.success?A.E.success(p):false;}).length,s.length)};}
function distribution(plays,key){
  var g={},den=0;
  (plays||[]).forEach(function(p){var v=valueFor(p,key);if(!known(v)||v==='Unknown')return;(g[String(v)]||(g[String(v)]=[])).push(p);den++;});
  return Object.keys(g).map(function(v){return{value:v,n:g[v].length,share:pct(g[v].length,den)};}).sort(function(a,b){return b.n-a.n;});
}
function labelValue(key,v){
  if(key==='front')return v+' Down';
  if(key==='safeties')return v+' High';
  if(key==='box')return v+' Box';
  if(key==='blitz')return v==='Yes'?'Blitz':'No Blitz';
  return v;
}
function humanDist(plays,key,limit){
  var r=distribution(plays,key).slice(0,limit||3);
  return r.length?r.map(function(x){return labelValue(key,x.value)+' '+x.share+'%';}).join(' • '):'Not charted';
}
function bestAnswer(A,plays){
  var sp=statPlays(plays),defs=['playType','runType','conceptFamily','concept'],c=[];
  defs.forEach(function(key){
    var g={};sp.forEach(function(p){var v=valueFor(p,key);if(!known(v))return;(g[v]||(g[v]=[])).push(p);});
    Object.keys(g).forEach(function(v){var a=g[v];if(a.length<2)return;var sy=summary(A,a);c.push({label:labelValue(key,v),n:a.length,ypp:sy.ypp,success:sy.success,score:sy.ypp*.65+sy.success*.035});});
  });
  return c.sort(function(a,b){return b.score-a.score||b.n-a.n;})[0]||null;
}
function strongestDelta(plays,all){
  var c=[];
  ['front','coverage','blitz'].forEach(function(key){
    var sub=distribution(plays,key),base=distribution(all,key),bm={};base.forEach(function(x){bm[x.value]=x.share;});
    sub.forEach(function(x){var d=x.share-(bm[x.value]||0);if(Math.abs(d)>=20)c.push({label:key==='blitz'?'Blitz':labelValue(key,x.value),share:x.share,delta:d});});
  });
  return c.sort(function(a,b){return Math.abs(b.delta)-Math.abs(a.delta);})[0]||null;
}
function confidence(n){return n>=8?'Higher':n>=4?'Medium':'Low';}
function coachSituationGroups(plays){
  var g={};
  (plays||[]).forEach(function(p){
    var k,l,sort;
    if(Number(p.down)===1){
      var f=firstDownSituation(p.down,p.distance);k='1|'+f;l=situationLabel(1,p.distance);sort=f==='Ten'?10:f==='Long'?11:f==='Medium'?12:13;
    }else{
      var b=bucket(p.distance);k=String(p.down)+'|'+b;l=situationLabel(p.down,p.distance);sort=Number(p.down)*10+(b==='Short'?1:b==='Medium'?2:3);
    }
    if(!g[k])g[k]={key:k,label:l,plays:[],sort:sort};
    g[k].plays.push(p);
  });
  return Object.keys(g).map(function(k){return g[k];}).sort(function(a,b){return a.sort-b.sort;});
}

function install(A,root){
  if(!A||!root.document||A.__gameIQPolish)return A;
  A.__gameIQPolish=true;
  var d=root.document,special=null,patching=false,savedTimer=0;
  function $(id){return d.getElementById(id);}
  function esc(s){return A.esc?A.esc(s):String(s==null?'':s);}
  function injectCss(){if($('gameIQPolishCss'))return;var l=d.createElement('link');l.id='gameIQPolishCss';l.rel='stylesheet';l.href='game-iq-polish.css?v=polish1';d.head.appendChild(l);}
  function ensureSavedCard(){
    var coach=$('coachNowCard'),pins=$('iqPins');if(!coach||!pins)return;
    var card=$('iqSavedViewsCard');
    if(!card){
      card=d.createElement('div');card.id='iqSavedViewsCard';card.className='card iqSavedViewsCard';
      card.innerHTML='<div class="cardhead"><div><div class="eyebrow">SAVED VIEWS</div><h2 class="section">Questions you want one tap away</h2><p class="muted">These are bookmarks, not the current situation. Save a Game IQ question and jump back to it later.</p></div></div><div id="iqSavedViewsHome"></div>';
      coach.insertAdjacentElement('afterend',card);
    }
    var home=$('iqSavedViewsHome');if(home&&pins.parentNode!==home)home.appendChild(pins);
    var foot=coach.querySelector('.coachNowFoot');if(foot)foot.classList.add('savedMoved');
    var b=$('pinIQView');
    if(b&&!b.dataset.polished){
      b.dataset.polished='1';b.textContent='Save for quick access';b.setAttribute('aria-label','Save this Game IQ question for quick access');
      b.onclick=null;
      b.addEventListener('click',saveCurrentView);
    }
  }
  function saveCurrentView(){
    var fs=readDomFilters(d);if(!fs.length)return A.msg&&A.msg('Add a filter before saving this view');
    A.state.settings=A.state.settings||{};var arr=Array.isArray(A.state.settings.iqPins)?A.state.settings.iqPins:(A.state.settings.iqPins=[]);
    var key=fs.map(function(f){return f.key+'='+f.value;}).sort().join('|');
    if(arr.some(function(p){return p.key===key;}))return A.msg&&A.msg('That Saved View already exists');
    var name=fs.map(function(f){return f.display;}).join(' + ');
    arr.push({key:key,name:name,filters:fs.map(function(f){return{key:f.key,value:f.value,category:f.category,display:f.display};})});
    if(arr.length>8)arr.shift();
    if(A.save)A.save('iq-saved-view');
    renderSavedViews();
    var b=$('pinIQView');if(b){b.textContent='Saved ✓';clearTimeout(savedTimer);savedTimer=setTimeout(function(){if(b)b.textContent='Save for quick access';},1400);}
    if(A.msg)A.msg('Saved for quick access');
  }
  function renderSavedViews(){
    ensureSavedCard();var box=$('iqPins');if(!box)return;
    A.state.settings=A.state.settings||{};var arr=Array.isArray(A.state.settings.iqPins)?A.state.settings.iqPins:[];
    var sig=arr.map(function(v){return v.key+'@'+v.name;}).join('||');if(box.dataset.polishSig===sig)return;box.dataset.polishSig=sig;
    box.innerHTML='';
    if(!arr.length){box.innerHTML='<span class="savedEmpty">No saved views yet.</span>';return;}
    arr.forEach(function(view,i){
      var b=d.createElement('button');b.className='iqPin savedViewBtn';b.type='button';
      b.innerHTML='<span>'+esc(view.name)+'</span><b aria-label="Remove saved view">×</b>';
      b.onclick=function(e){
        if(e.target&&e.target.tagName==='B'){e.stopPropagation();arr.splice(i,1);if(A.save)A.save('iq-remove-saved-view');renderSavedViews();return;}
        loadSavedView(view);
      };
      box.appendChild(b);
    });
  }
  function clearNormalFilters(){var c=$('iqClear');if(c)c.click();else d.querySelectorAll('#iqFilterChips .iqFilterChip').forEach(function(x){if(!x.dataset.situationPolish)x.click();});}
  function fireFilter(f){
    var input=$('iqSearchInput');if(!input)return;
    var label=(f.category||'')+': '+(f.display||f.value);input.value=label;
    input.dispatchEvent(new Event('input',{bubbles:true}));
    input.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',code:'Enter',bubbles:true}));
  }
  function loadSavedView(view){
    special=null;clearNormalFilters();
    var fs=(view.filters||[]).slice(),sp=fs.find(function(f){return f.key==='firstDownSituation';});
    if(sp)special=sp.value;
    fs=fs.filter(function(f){return f.key!=='firstDownSituation';});
    var i=0;function next(){if(i>=fs.length){setTimeout(function(){syncSpecialChip();renderSpecialSearch();var s=$('iqSearchCard');if(s&&s.scrollIntoView)s.scrollIntoView({behavior:'smooth',block:'start'});},80);return;}fireFilter(fs[i++]);setTimeout(next,35);}setTimeout(next,20);
  }
  function syncSpecialChip(){
    var box=$('iqFilterChips');if(!box)return;
    var old=box.querySelector('.situationPolishChip');
    if(!special){if(old)old.remove();return;}
    var disp=special==='Ten'?'1st & 10':special==='Long'?'1st & Long':special==='Short'?'1st & Short':'1st & Medium';
    if(old){var s=old.querySelector('span');if(s)s.textContent='Situation: '+disp;return;}
    var b=d.createElement('button');b.type='button';b.className='iqFilterChip situationPolishChip';b.dataset.situationPolish='1';b.innerHTML='<span>Situation: '+disp+'</span><b>×</b>';
    b.onclick=function(){special=null;b.remove();renderSpecialSearch();};
    var clear=box.querySelector('.iqClear');box.insertBefore(b,clear||box.firstChild);
  }
  function currentMode(){var b=d.querySelector('#iqShowModes [data-mode].on');return b&&b.dataset.mode||'summary';}
  function filtersWithoutSpecial(){return readDomFilters(d).filter(function(f){return f.key!=='firstDownSituation';});}
  function renderSpecialSearch(){
    if(!special)return;
    var box=$('iqSearchAnswer');if(!box||patching)return;
    var fs=filtersWithoutSpecial().concat([{key:'firstDownSituation',value:special,category:'Situation'}]);
    var rows=filterPlays(A,A.state.plays,fs),mode=currentMode(),count=statPlays(rows).length,sig=special+'|'+mode+'|'+fs.map(function(f){return f.key+'='+f.value;}).join('|')+'|'+rows.map(function(p){return p.number;}).join(','),existing=box.firstElementChild;
    if(existing&&existing.dataset&&existing.dataset.specialSig===sig)return;patching=true;
    var title=fs.map(function(f){if(f.key==='firstDownSituation')return situationLabel(1,special==='Ten'?10:special==='Long'?11:special==='Short'?3:6);return f.display||f.value;}).join(' + ');
    if($('iqSearchCount'))$('iqSearchCount').textContent=count+' play'+(count===1?'':'s');
    if(mode==='summary'){
      var sy=summary(A,rows),pressure=rows.filter(function(p){return known(p.pressure);}),br=pct(pressure.filter(isBlitz).length,pressure.length);
      box.innerHTML='<div data-special-view="1" data-special-sig="'+esc(sig)+'"><div class="iqResultTitle">'+esc(title)+'</div><div class="searchSummary"><div class="searchKpis"><div><span>Sample</span><b>'+sy.n+'</b><small>'+confidence(sy.n).toUpperCase()+' confidence</small></div><div><span>Net YPP</span><b>'+sy.ypp.toFixed(1)+'</b><small>'+sy.success+'% success</small></div><div><span>Front</span><b>'+esc(humanDist(rows,'front',1))+'</b></div><div><span>Blitz</span><b>'+(pressure.length?br+'%':'—')+'</b></div></div><div class="searchQuick"><div><strong>Front</strong><span>'+esc(humanDist(rows,'front',3))+'</span></div><div><strong>Coverage</strong><span>'+esc(humanDist(rows,'coverage',3))+'</span></div><div><strong>Blitz type</strong><span>'+esc(humanDist(rows,'pressure',3))+'</span></div></div></div></div>';
    }else{
      var key=mode==='frontCoverage'?null:mode,g={};
      if(mode==='frontCoverage'){
        rows.forEach(function(p){var f=known(p.front)?p.front:'Unknown',c=known(resolvedCoverage(p))?resolvedCoverage(p):'Unknown',k=f+'|'+c;(g[k]||(g[k]=[])).push(p);});
      }else rows.forEach(function(p){var v=mode==='result'?resultFlags(A,p):[valueFor(p,key)];if(!Array.isArray(v))v=[v];v.forEach(function(x){if(!known(x)||x==='Unknown')return;(g[String(x)]||(g[String(x)]=[])).push(p);});});
      var total=rows.length,html=Object.keys(g).map(function(k){var a=g[k],sy=summary(A,a),lab=mode==='frontCoverage'?k.split('|')[0]+' Down + '+k.split('|')[1]:labelValue(key,k);return'<div class="iqResultRow"><div><strong>'+esc(lab)+'</strong><span>'+pct(a.length,total)+'%</span></div><div><b>'+sy.ypp.toFixed(1)+' YPP</b><span>'+sy.success+'% success</span></div></div>';}).join('');
      box.innerHTML='<div data-special-view="1" data-special-sig="'+esc(sig)+'"><div class="iqResultTitle">'+esc((mode==='frontCoverage'?'Front + Coverage':mode)+' • '+title)+'</div><div class="iqResultTable">'+(html||'<div class="emptyIQ">No plays match this view yet.</div>')+'</div></div>';
    }
    syncSpecialChip();patching=false;
  }
  function renderFirstDownFacet(){
    var body=$('iqFacetBody');if(!body)return;
    var old=body.querySelector('.firstDownFacet');
    var normal=filtersWithoutSpecial(),base=filterPlays(A,A.state.plays,normal),opts=[
      {v:'Ten',l:'1st & 10'},{v:'Long',l:'1st & Long'},{v:'Medium',l:'1st & Medium'},{v:'Short',l:'1st & Short'}
    ].map(function(x){x.count=base.filter(function(p){return specialMatches(p,x.v);}).length;return x;}).filter(function(x){return x.count>0||x.v===special;});
    if(!opts.length){if(old)old.remove();return;}
    var facetSig=(special||'')+'|'+opts.map(function(x){return x.v+':'+x.count;}).join(',');if(old&&old.dataset.polishSig===facetSig)return;if(old)old.remove();
    var det=d.createElement('details');det.dataset.polishSig=facetSig;det.className='facetGroup firstDownFacet';det.open=true;
    det.innerHTML='<summary><span>First down situation</span><small>'+(special?'1 selected':opts.length+' options')+'</small></summary><div class="facetOptions"></div>';
    var o=det.querySelector('.facetOptions');opts.forEach(function(x){var b=d.createElement('button');b.type='button';b.className='facetOption'+(special===x.v?' on':'');b.innerHTML='<span><i class="facetCheck">'+(special===x.v?'✓':'')+'</i>'+x.l+'</span><b>'+x.count+'</b>';b.onclick=function(){special=special===x.v?null:x.v;syncSpecialChip();renderSpecialSearch();renderFirstDownFacet();};o.appendChild(b);});
    body.insertBefore(det,body.firstChild);
  }
  function openSituation(value){
    special=value;clearNormalFilters();setTimeout(function(){syncSpecialChip();renderSpecialSearch();renderFirstDownFacet();var s=$('iqSearchCard');if(s&&s.scrollIntoView)s.scrollIntoView({behavior:'smooth',block:'start'});},50);
  }
  function renderPriority(){
    var box=$('iqPriorityResults'),btn=d.querySelector('#iqPriorityCard [data-priority="downDistance"]');if(!box||!btn||!btn.classList.contains('primary'))return;
    var groups=coachSituationGroups(A.state.plays),sig=groups.map(function(g){return g.key+':'+g.plays.map(function(p){return p.number;}).join(',');}).join('|');if(box.dataset.polishSig===sig)return;box.dataset.polishSig=sig;
    box.innerHTML=groups.map(function(g){
      var pressure=g.plays.filter(function(p){return known(p.pressure);}),br=pct(pressure.filter(isBlitz).length,pressure.length);
      return'<button class="priorityRow polishPriorityRow" type="button" data-sit="'+esc(g.key)+'"><div class="priorityHead"><strong>'+esc(g.label)+'</strong></div><div><b>Front</b><span>'+esc(humanDist(g.plays,'front',3))+'</span></div><div><b>Coverage</b><span>'+esc(humanDist(g.plays,'coverage',3))+'</span></div><div><b>Blitz</b><span>'+(pressure.length?br+'%':'Not charted')+'</span></div></button>';
    }).join('');
    box.querySelectorAll('[data-sit]').forEach(function(b){b.onclick=function(){var z=b.dataset.sit.split('|');if(z[0]==='1')openSituation(z[1]);else{special=null;clearNormalFilters();setTimeout(function(){fireFilter({category:'Down',display:z[0]==='2'?'2nd Down':z[0]==='3'?'3rd Down':'4th Down'});setTimeout(function(){fireFilter({category:'Distance',display:z[1]});},35);},20);}};});
  }
  function renderCoachNowForFirstDown(){
    var s=A.state.current||{};if(Number(s.down)!==1)return;
    var grid=$('coachNowGrid');if(!grid)return;
    var sit=firstDownSituation(1,s.distance),filters=[{key:'firstDownSituation',value:sit}],form=$('formation')&&$('formation').value,hash=$('hash')&&$('hash').value;
    if(known(form))filters.push({key:'formation',value:form});
    if(known(hash))filters.push({key:'hash',value:hash});
    var rows=filterPlays(A,A.state.plays,filters),broadened=false;
    if(!rows.length&&filters.length>1){filters=[{key:'firstDownSituation',value:sit}];rows=filterPlays(A,A.state.plays,filters);broadened=true;}
    var coachSig=String(s.distance)+'|'+(form||'')+'|'+(hash||'')+'|'+rows.map(function(p){return p.number;}).join(',');if(grid.dataset.polishSig===coachSig)return;grid.dataset.polishSig=coachSig;
    var pressure=rows.filter(function(p){return known(p.pressure);}),br=pct(pressure.filter(isBlitz).length,pressure.length),best=bestAnswer(A,rows),delta=strongestDelta(rows,A.state.plays),parts=[situationLabel(1,s.distance)];
    if(known(form))parts.push(form);if(known(hash))parts.push(hash+' Hash');
    var work=best?'<strong>'+esc(best.label)+' · '+best.ypp.toFixed(1)+' YPP</strong><span>'+best.success+'% success · '+confidence(best.n)+' confidence</span>':'<strong>No repeated answer yet</strong><span>Needs at least two comparable offensive calls.</span>';
    var watch=delta?'<strong>'+esc(delta.label)+' '+delta.share+'%</strong><span>'+(delta.delta>0?'↑':'↓')+Math.abs(delta.delta)+' vs overall</span>':'<strong>No strong shift yet</strong><span>Keep charting; Game IQ is watching for meaningful change.</span>';
    grid.innerHTML='<div class="coachNowBlock current"><div class="coachKicker">CURRENT SITUATION</div><h3>'+esc(parts.join(' · '))+'</h3><div class="coachDefense"><label>Front</label><span><b>'+esc(humanDist(rows,'front',2))+'</b></span><label>Coverage</label><span><b>'+esc(humanDist(rows,'coverage',2))+'</b></span><label>Blitz</label><span><b>'+(pressure.length?br+'%':'Not charted')+'</b></span></div><small>'+(broadened?'Broadened to all '+esc(situationLabel(1,s.distance))+' plays · ':'')+confidence(rows.length)+' confidence</small></div><div class="coachNowBlock"><div class="coachKicker">WHAT\'S WORKING</div>'+work+'</div><div class="coachNowBlock"><div class="coachKicker">WATCH THIS</div>'+watch+'</div>';
    if($('coachNowConfidence'))$('coachNowConfidence').textContent=rows.length?confidence(rows.length)+' confidence':'Waiting';
  }
  function interceptSearch(){
    var input=$('iqSearchInput');if(!input||input.dataset.situationPolish)return;input.dataset.situationPolish='1';
    input.addEventListener('keydown',function(e){
      if(e.key!=='Enter')return;var q=input.value.toLowerCase().replace(/[^a-z0-9]+/g,' ').trim(),m=null,rest=q;
      if(/\b(1st|first)\s+(and\s+)?10\b/.test(q)){m='Ten';rest=q.replace(/\b(1st|first)\s+(and\s+)?10\b/g,'').trim();}
      else if(/\b(1st|first)\s+(and\s+)?long\b/.test(q)){m='Long';rest=q.replace(/\b(1st|first)\s+(and\s+)?long\b/g,'').trim();}
      if(!m)return;
      e.preventDefault();e.stopImmediatePropagation();special=m;input.value='';syncSpecialChip();renderSpecialSearch();
      if(rest){setTimeout(function(){input.value=rest;input.dispatchEvent(new Event('input',{bubbles:true}));input.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',code:'Enter',bubbles:true}));},20);}
    },true);
  }
  function installObservers(){
    var iq=$('iq');if(!iq||iq.dataset.iqPolishObserved)return;iq.dataset.iqPolishObserved='1';
    new MutationObserver(function(){
      if(patching)return;
      setTimeout(function(){ensureSavedCard();renderSavedViews();renderPriority();renderCoachNowForFirstDown();interceptSearch();renderFirstDownFacet();syncSpecialChip();if(special)renderSpecialSearch();},0);
    }).observe(iq,{childList:true,subtree:true});
  }
  function refresh(){ensureSavedCard();renderSavedViews();renderPriority();renderCoachNowForFirstDown();interceptSearch();renderFirstDownFacet();syncSpecialChip();if(special)renderSpecialSearch();installObservers();}
  injectCss();refresh();
  var oldIQ=A.renderIQ;if(oldIQ)A.renderIQ=function(){var r=oldIQ.apply(A,arguments);setTimeout(refresh,0);return r;};
  var oldAll=A.renderAll;if(oldAll)A.renderAll=function(){var r=oldAll.apply(A,arguments);setTimeout(refresh,0);return r;};
  return A;
}
return{firstDownSituation:firstDownSituation,situationLabel:situationLabel,specialMatches:specialMatches,coachSituationGroups:coachSituationGroups,filterPlays:filterPlays,install:install};
});
