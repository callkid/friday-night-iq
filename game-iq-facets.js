(function(root,factory){
'use strict';
var C=factory();
if(typeof module==='object'&&module.exports){module.exports=C;return;}
if(root.FNIQ)C.install(root.FNIQ,root);
})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
function known(v){return v!=null&&v!==''&&v!=='NA'&&v!=='Unknown'&&v!=='Unknown / N/A';}
function resolvedCoverage(p){var x=p&&p.postCoverage;if(known(x))return x==='Same as pre-snap'?(p.coverage||'NA'):x;return p&&p.coverage||'NA';}
function isBlitz(p){return known(p&&p.pressure)&&p.pressure!=='None';}
function distanceBucket(d){d=Number(d)||10;return d<=3?'Short':d<=7?'Medium':'Long';}
function firstDownSituation(down,distance){down=Number(down);distance=Number(distance);if(down!==1)return null;if(distance===10)return'Ten';if(distance>10)return'Long';if(distance<=3)return'Short';return'Medium';}
function fieldZone(E,p){var a=E.fieldAbs(p.fieldSide,p.yardLine);return a>=90?'Goal To Go':a>=80?'Red Zone':a>=60?'Plus Territory':a>=40?'Midfield':'Own Territory';}
function scoreState(p){var s=p&&p.scoreBefore;if(!s)return'Unknown';var d=(Number(s.us)||0)-(Number(s.them)||0);return d>0?'Leading':d<0?'Trailing':'Tied';}
function resultFlags(E,p,isExplosive){var a=[];if(E.success(p))a.push('Success');if(E.isFirstDownResult(p))a.push('First Down');if((isExplosive&&isExplosive(p))||(p.tags||[]).indexOf('Explosive')>=0)a.push('Explosive');if((p.tags||[]).indexOf('Touchdown')>=0)a.push('Touchdown');if((p.tags||[]).indexOf('Turnover')>=0||p.passResult==='Interception'||(p.tags||[]).indexOf('Fumble Lost')>=0)a.push('Turnover');if((p.tags||[]).indexOf('Fumble')>=0)a.push('Fumble');if((p.tags||[]).indexOf('Fumble Lost')>=0)a.push('Fumble Lost');if(p.penalty)a.push('Penalty');return a;}
var DEFS=[
 {key:'down',category:'Down',fixed:['1','2','3','4']},
 {key:'firstDownSituation',category:'First down situation',fixed:['Ten','Long','Medium','Short']},
 {key:'distanceBucket',category:'Distance',fixed:['Short','Medium','Long']},
 {key:'formation',category:'Formation'},
 {key:'front',category:'Front'},
 {key:'coverage',category:'Post-snap coverage'},
 {key:'blitz',category:'Blitz',fixed:['Yes','No']},
 {key:'hash',category:'Hash',fixed:['Left','Middle','Right']},
 {key:'pressure',category:'Blitz type'},
 {key:'preCoverage',category:'Pre-snap coverage'},
 {key:'safeties',category:'High safeties'},
 {key:'box',category:'Box'},
 {key:'personnel',category:'Personnel'},
 {key:'motion',category:'Motion'},
 {key:'playType',category:'Play type',fixed:['Run','Pass']},
 {key:'runType',category:'Run Type'},
 {key:'passDepth',category:'Pass depth'},
 {key:'conceptFamily',category:'Concept family'},
 {key:'concept',category:'Specific concept'},
 {key:'direction',category:'Direction',fixed:['Left','Middle','Right']},
 {key:'fieldZone',category:'Field zone',fixed:['Own Territory','Midfield','Plus Territory','Red Zone','Goal To Go']},
 {key:'quarter',category:'Quarter',fixed:['Q1','Q2','Q3','Q4','OT']},
 {key:'exactDistance',category:'Exact distance'},
 {key:'drive',category:'Drive'},
 {key:'scoreState',category:'Score state',fixed:['Leading','Tied','Trailing']},
 {key:'result',category:'Result',fixed:['Success','First Down','Explosive','Touchdown','Turnover','Fumble','Fumble Lost','Penalty']}
];
function valueFor(E,p,key){
 if(key==='down')return String(p.down);if(key==='firstDownSituation')return firstDownSituation(p.down,p.distance);if(key==='distanceBucket')return distanceBucket(p.distance);if(key==='formation')return p.formation;if(key==='front')return p.front;if(key==='coverage')return resolvedCoverage(p);if(key==='blitz')return isBlitz(p)?'Yes':known(p.pressure)?'No':'Unknown';if(key==='hash')return p.hash;if(key==='pressure')return p.pressure;if(key==='preCoverage')return p.coverage;if(key==='safeties')return String(p.safeties);if(key==='box')return String(p.box);if(key==='personnel')return p.personnel;if(key==='motion')return p.motion;if(key==='playType')return p.playType;if(key==='runType')return p.playType==='Run'?p.attackDetail:'NA';if(key==='passDepth')return p.playType==='Pass'?p.attackDetail:'NA';if(key==='conceptFamily')return p.conceptFamily;if(key==='concept')return p.concept;if(key==='direction')return p.direction;if(key==='fieldZone')return fieldZone(E,p);if(key==='quarter')return p.quarter;if(key==='exactDistance')return String(p.distance);if(key==='drive')return String(p.drive);if(key==='scoreState')return scoreState(p);return null;
}
function display(key,v){if(key==='down')return v==='1'?'1st Down':v==='2'?'2nd Down':v==='3'?'3rd Down':'4th Down';if(key==='firstDownSituation')return v==='Ten'?'1st & 10':v==='Long'?'1st & Long':v==='Short'?'1st & Short':'1st & Medium';if(key==='front')return v+' Down';if(key==='coverage'||key==='preCoverage')return v;if(key==='blitz')return v==='Yes'?'Blitz':'No Blitz';if(key==='safeties')return v+' High';if(key==='box')return v+' Box';if(key==='exactDistance')return v+' yards to go';if(key==='drive')return'Drive '+v;return v;}
function valuesFor(E,plays,def){if(def.fixed)return def.fixed.slice();var seen={},out=[];(plays||[]).forEach(function(p){var v=valueFor(E,p,def.key);if(!known(v)||seen[String(v)])return;seen[String(v)]=1;out.push(String(v));});if(def.key==='exactDistance'||def.key==='drive'||def.key==='safeties'||def.key==='box'||def.key==='front')out.sort(function(a,b){return Number(a)-Number(b);});else out.sort();return out;}
function matches(E,p,f,isExplosive){if(f.key==='result')return resultFlags(E,p,isExplosive).indexOf(f.value)>=0;return String(valueFor(E,p,f.key))===String(f.value);}
function filterPlays(E,plays,filters,isExplosive){return(plays||[]).filter(function(p){return(filters||[]).every(function(f){return matches(E,p,f,isExplosive);});});}
function facetCounts(E,plays,filters,def,isExplosive){var base=(filters||[]).filter(function(f){return f.key!==def.key;}),rows=filterPlays(E,plays,base,isExplosive);return valuesFor(E,plays,def).map(function(v){return{value:v,display:display(def.key,v),count:rows.filter(function(p){return matches(E,p,{key:def.key,value:v},isExplosive);}).length};});}
function install(A,root){
 if(!A||!root.document||A.__gameIQFacets)return A;A.__gameIQFacets=true;var d=root.document,opened=root.innerWidth>900;
 function $(id){return d.getElementById(id);}function esc(s){return A.esc?A.esc(s):String(s);}
 function injectCss(){if($('gameIQFacetsCss'))return;var l=d.createElement('link');l.id='gameIQFacetsCss';l.rel='stylesheet';l.href='game-iq-facets.css?v=facets1';d.head.appendChild(l);}
 function currentFilters(){var map={},out=[];d.querySelectorAll('#iqFilterChips .iqFilterChip span').forEach(function(s){map[s.textContent.trim()]=1;});DEFS.forEach(function(def){valuesFor(A.E,A.state.plays,def).forEach(function(v){var label=def.category+': '+display(def.key,v);if(map[label])out.push({key:def.key,value:v,category:def.category,display:display(def.key,v),label:label});});});return out;}
 function removeCategory(category){var found=false;d.querySelectorAll('#iqFilterChips .iqFilterChip').forEach(function(b){var s=b.querySelector('span');if(!found&&s&&s.textContent.trim().indexOf(category+': ')===0){found=true;b.click();}});return found;}
 function apply(def,v){var active=currentFilters().find(function(f){return f.key===def.key;});if(active&&active.value===v){removeCategory(def.category);setTimeout(render,0);return;}if(active)removeCategory(def.category);setTimeout(function(){var input=$('iqSearchInput');if(!input)return;input.value=def.category+': '+display(def.key,v);input.dispatchEvent(new Event('input',{bubbles:true}));input.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',code:'Enter',bubbles:true}));setTimeout(render,0);},active?15:0);}
 function ensureUi(){var search=$('iqSearchCard');if(!search||$('iqFacetLayout'))return;var parent=search.parentNode,layout=d.createElement('div');layout.id='iqFacetLayout';layout.className='iqFacetLayout';parent.insertBefore(layout,search);var card=d.createElement('div');card.id='iqFacetCard';card.className='card iqFacetCard'+(opened?' facetOpen':'');card.innerHTML='<div class="facetHead"><div><h2 class="section">Browse filters</h2><p>Car-shopping style drill-down. Counts update as you narrow the question.</p></div><button id="facetToggle" class="btn smallbtn" type="button"></button></div><div id="iqFacetBody" class="iqFacetBody"></div>';layout.appendChild(card);layout.appendChild(search);$('facetToggle').onclick=function(){opened=!opened;card.classList.toggle('facetOpen',opened);updateToggle();};updateToggle();var chips=$('iqFilterChips');if(chips&&!chips.dataset.facetObserved){chips.dataset.facetObserved='1';new MutationObserver(function(){render();}).observe(chips,{childList:true,subtree:true});}}
 function updateToggle(){var b=$('facetToggle');if(b)b.textContent=opened?'Hide':'Browse Filters';}
 function render(){ensureUi();var body=$('iqFacetBody');if(!body)return;var active=currentFilters();body.innerHTML='';DEFS.forEach(function(def,i){var counts=facetCounts(A.E,A.state.plays,active,def,A.isExplosive),selected=active.find(function(f){return f.key===def.key;}),usable=counts.filter(function(x){return x.count>0||(selected&&selected.value===x.value);});if(!usable.length)return;var det=d.createElement('details');det.className='facetGroup';if(i<6)det.open=true;var total=usable.reduce(function(s,x){return s+x.count;},0);det.innerHTML='<summary><span>'+esc(def.category)+'</span><small>'+(selected?'1 selected':usable.length+' options')+'</small></summary><div class="facetOptions"></div>';var opts=det.querySelector('.facetOptions');usable.slice(0,18).forEach(function(x){var on=selected&&selected.value===x.value,b=d.createElement('button');b.type='button';b.className='facetOption'+(on?' on':'');b.innerHTML='<span><i class="facetCheck">'+(on?'✓':'')+'</i>'+esc(x.display)+'</span><b>'+x.count+'</b>';b.onclick=function(){apply(def,x.value);};opts.appendChild(b);});body.appendChild(det);});if(!body.children.length)body.innerHTML='<div class="facetEmpty">Log a few plays to populate filters.</div>';}
 injectCss();ensureUi();render();var old=A.renderIQ;if(old)A.renderIQ=function(){var r=old.apply(A,arguments);ensureUi();render();return r;};
 return A;
}
return{DEFS:DEFS,valueFor:valueFor,display:display,valuesFor:valuesFor,filterPlays:filterPlays,facetCounts:facetCounts,install:install};
});
