(function(root,factory){
'use strict';
var C=factory();
if(typeof module==='object'&&module.exports){module.exports=C;return;}
if(root.FNIQ)C.install(root.FNIQ,root);
})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';

function known(v){return v!=null&&v!==''&&v!=='NA'&&v!=='Unknown'&&v!=='Unknown / N/A';}
function pct(a,b){return b?Math.round(a/b*100):0;}
function distanceBucket(d){d=Number(d)||10;return d<=3?'Short':d<=7?'Medium':'Long';}
function cleanStatPlays(plays){return(plays||[]).filter(function(p){if(p.playType!=='Run'&&p.playType!=='Pass')return false;if(p.penalty&&p.penalty.status==='Accepted')return false;return true;});}
function resolvedCoverage(p){var post=p&&p.postCoverage;if(known(post))return post==='Same as pre-snap'?(p.coverage||'NA'):post;return p&&p.coverage||'NA';}
function isBlitz(p){return known(p&&p.pressure)&&p.pressure!=='None';}
function chartingHealth(plays){
 var rows=cleanStatPlays(plays),n=rows.length;
 function rate(fn){return pct(rows.filter(fn).length,n);}
 return{plays:n,hash:rate(function(p){return known(p.hash);}),formation:rate(function(p){return known(p.formation);}),personnel:rate(function(p){return known(p.personnel);}),front:rate(function(p){return known(p.front);}),safeties:rate(function(p){return known(p.safeties);}),coverage:rate(function(p){return known(resolvedCoverage(p));}),box:rate(function(p){return known(p.box);}),motion:rate(function(p){return known(p.motion);}),detail:rate(function(p){return known(p.attackDetail);}),conceptFamily:rate(function(p){return known(p.conceptFamily);})};
}
function contextRows(plays,current){
 var rows=cleanStatPlays(plays),s=current||{},down=Number(s.down)||1,bucket=distanceBucket(s.distance),exact=rows.filter(function(p){return Number(p.down)===down&&distanceBucket(p.distance)===bucket;});
 if(exact.length>=4)return{plays:exact,label:(down===1?'1st':down===2?'2nd':down===3?'3rd':'4th')+' & '+bucket,broadened:false};
 var sameDown=rows.filter(function(p){return Number(p.down)===down;});
 if(sameDown.length>=4)return{plays:sameDown,label:(down===1?'1st':down===2?'2nd':down===3?'3rd':'4th')+' down',broadened:true};
 return{plays:rows,label:'all offensive snaps',broadened:true};
}
function successRate(E,rows){return pct(rows.filter(function(p){return E&&E.success?E.success(p):false;}).length,rows.length);}
function bestCall(E,rows){
 var groups={},defs=[['attackDetail','Run / pass detail'],['conceptFamily','Concept family'],['concept','Specific call'],['playType','Play type']];
 defs.forEach(function(def){rows.forEach(function(p){var v=p&&p[def[0]];if(!known(v))return;var key=def[0]+'|'+v;(groups[key]||(groups[key]={key:def[0],label:v,kind:def[1],plays:[]})).plays.push(p);});});
 var out=Object.keys(groups).map(function(k){var g=groups[k],a=g.plays;if(a.length<3)return null;var yards=a.map(function(p){return Number(E&&E.officialNetYards?E.officialNetYards(p):p.yards)||0;}),ypp=yards.reduce(function(s,x){return s+x;},0)/a.length,sr=successRate(E,a);return{key:g.key,label:g.label,kind:g.kind,n:a.length,ypp:ypp,success:sr,score:ypp+sr/20};}).filter(Boolean);
 return out.sort(function(a,b){return b.score-a.score||b.n-a.n;})[0]||null;
}
function tendency(rows,key,fn){var counts={},knownN=0;rows.forEach(function(p){var v=fn?fn(p):p&&p[key];if(!known(v))return;knownN++;counts[v]=(counts[v]||0)+1;});var top=Object.keys(counts).map(function(v){return{value:v,n:counts[v],share:pct(counts[v],knownN),charted:knownN};}).sort(function(a,b){return b.n-a.n;})[0];return top||null;}
function defensiveLean(rows){return{front:tendency(rows,'front'),coverage:tendency(rows,'coverage',resolvedCoverage),blitz:(function(){var knownRows=rows.filter(function(p){return known(p&&p.pressure);}),yes=knownRows.filter(isBlitz).length;return knownRows.length?{value:'Blitz',n:yes,share:pct(yes,knownRows.length),charted:knownRows.length}:null;})()};}
function captureScore(v){
 var checks=[['Hash',known(v.hash)],['Formation',known(v.formation)],['Personnel',known(v.personnel)],['Front',known(v.front)],['Safeties',known(v.safeties)],['Coverage',known(v.coverage)||!!v.coverageTouched],['Box',known(v.box)],['Motion',known(v.motion)||!!v.motionTouched]];
 return{done:checks.filter(function(x){return x[1];}).length,total:checks.length,missing:checks.filter(function(x){return!x[1];}).map(function(x){return x[0];})};
}

function install(A,root){
 if(!A||!root.document||A.__quality24)return A;A.__quality24=true;
 var d=root.document,lastPlayCount=-1;
 function $(id){return d.getElementById(id);}
 function esc(s){return A.esc?A.esc(s):String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
 function fire(el,type){if(el)el.dispatchEvent(new Event(type||'change',{bubbles:true}));}
 function value(id){var e=$(id);return e?e.value:'';}
 function choice(group){var b=d.querySelector('[data-group="'+group+'"] .choice.on');return b?b.dataset.v:'';}
 function injectCss(){if($('quality24Css'))return;var l=d.createElement('link');l.id='quality24Css';l.rel='stylesheet';l.href='quality24.css?v=quality24';d.head.appendChild(l);}
 function makeQuickButton(text,value,cls){var b=d.createElement('button');b.type='button';b.className='q24Quick '+(cls||'');b.textContent=text;b.dataset.value=value;return b;}
 function ensureCoverageQuick(){var select=$('coverage');if(!select||$('q24CoverageQuick'))return;var host=select.parentElement,bar=d.createElement('div');bar.id='q24CoverageQuick';bar.className='q24QuickRow q24CoverageQuick';[['C0','Cover 0'],['C1','Cover 1'],['C2','Cover 2'],['C3','Cover 3'],['C4','Cover 4'],['C6','Cover 6'],['MAN','Man'],['MATCH','Match'],['?','NA']].forEach(function(x){var b=makeQuickButton(x[0],x[1]);b.onclick=function(){select.value=x[1];select.dataset.q24Touched='1';fire(select);syncCoverageQuick();renderCapture();};bar.appendChild(b);});host.insertBefore(bar,select);select.addEventListener('change',function(){select.dataset.q24Touched='1';syncCoverageQuick();renderCapture();});syncCoverageQuick();}
 function syncCoverageQuick(){var select=$('coverage'),bar=$('q24CoverageQuick');if(!select||!bar)return;bar.querySelectorAll('button').forEach(function(b){b.classList.toggle('on',b.dataset.value===select.value);});}
 function recentMotions(){var out=[];(A.state&&A.state.plays||[]).slice().reverse().forEach(function(p){var m=p&&p.motion;if(known(m)&&out.indexOf(m)<0)out.push(m);});return out.slice(0,3);}
 function ensureMotionQuick(){var select=$('motion');if(!select)return;var host=select.parentElement,bar=$('q24MotionQuick');if(!bar){bar=d.createElement('div');bar.id='q24MotionQuick';bar.className='q24QuickRow q24MotionQuick';host.insertBefore(bar,select);select.addEventListener('change',function(){select.dataset.q24Touched='1';syncMotionQuick();renderCapture();});}var vals=recentMotions();bar.innerHTML='';var none=makeQuickButton('NO MOTION','NA','muted');none.onclick=function(){select.value='NA';select.dataset.q24Touched='1';fire(select);syncMotionQuick();renderCapture();};bar.appendChild(none);vals.forEach(function(m){var b=makeQuickButton(m,m);b.onclick=function(){select.value=m;select.dataset.q24Touched='1';fire(select);syncMotionQuick();renderCapture();};bar.appendChild(b);});bar.classList.toggle('hasRecent',vals.length>0);syncMotionQuick();}
 function syncMotionQuick(){var select=$('motion'),bar=$('q24MotionQuick');if(!select||!bar)return;bar.querySelectorAll('button').forEach(function(b){b.classList.toggle('on',b.dataset.value===select.value&&select.dataset.q24Touched==='1');});}
 function ensureHurry(){var snap=d.querySelector('#live .snapright');if(!snap||$('q24Hurry'))return;var b=d.createElement('button');b.id='q24Hurry';b.type='button';b.className='btn smallbtn q24Hurry';b.setAttribute('aria-pressed','false');b.innerHTML='<span>HURRY</span><b>OFF</b>';b.onclick=function(){setHurry(!d.documentElement.classList.contains('fniqHurryUp'));};snap.insertBefore(b,snap.firstChild);d.addEventListener('keydown',function(e){if(e.altKey&&String(e.key).toLowerCase()==='h'){e.preventDefault();setHurry(!d.documentElement.classList.contains('fniqHurryUp'));}});}
 function setHurry(on){d.documentElement.classList.toggle('fniqHurryUp',!!on);var b=$('q24Hurry');if(b){b.setAttribute('aria-pressed',on?'true':'false');var x=b.querySelector('b');if(x)x.textContent=on?'ON':'OFF';}var m=$('q24CaptureMode');if(m)m.textContent=on?'Hurry-up: essentials only':'Normal charting';}
 function ensureCapture(){var card=$('preSnapCard'),head=card&&card.querySelector('.stephead');if(!card||!head||$('q24Capture'))return;var bar=d.createElement('div');bar.id='q24Capture';bar.className='q24Capture';bar.innerHTML='<div><span class="q24CaptureLabel">CHARTING</span><strong id="q24CaptureCount">Look 0/8</strong><small id="q24CaptureMissing">Start with hash, formation and personnel.</small></div><span id="q24CaptureMode" class="q24CaptureMode">Normal charting</span>';head.insertAdjacentElement('afterend',bar);['hash','formation','personnel','coverage','motion'].forEach(function(id){var e=$(id);if(e&&!e.dataset.q24Bound){e.dataset.q24Bound='1';e.addEventListener('change',renderCapture);e.addEventListener('input',renderCapture);}});['front','safeties','box'].forEach(function(g){d.querySelectorAll('[data-group="'+g+'"] .choice').forEach(function(b){if(b.dataset.q24Bound)return;b.dataset.q24Bound='1';b.addEventListener('click',function(){setTimeout(renderCapture,0);});});});renderCapture();}
 function renderCapture(){var box=$('q24Capture');if(!box)return;var s=captureScore({hash:value('hash'),formation:value('formation'),personnel:value('personnel'),front:choice('front'),safeties:choice('safeties'),coverage:value('coverage'),coverageTouched:$('coverage')&&$('coverage').dataset.q24Touched==='1',box:choice('box'),motion:value('motion'),motionTouched:$('motion')&&$('motion').dataset.q24Touched==='1'}),count=$('q24CaptureCount'),missing=$('q24CaptureMissing');if(count)count.textContent='Look '+s.done+'/'+s.total;if(missing)missing.textContent=s.missing.length?'Missing: '+s.missing.slice(0,4).join(', ')+(s.missing.length>4?' +'+(s.missing.length-4):''):'Pre-snap look complete';box.classList.toggle('complete',s.done===s.total);}
 function resetTouchedOnNewPlay(){var n=A.state&&A.state.plays?A.state.plays.length:0;if(lastPlayCount<0){lastPlayCount=n;return;}if(n!==lastPlayCount){lastPlayCount=n;['coverage','motion'].forEach(function(id){var e=$(id);if(e)delete e.dataset.q24Touched;});}}
 function ensureLive(){resetTouchedOnNewPlay();ensureCoverageQuick();ensureMotionQuick();ensureHurry();ensureCapture();syncCoverageQuick();syncMotionQuick();renderCapture();}

 function healthItem(label,val,priority){return'<div class="q24HealthItem '+(val>=80?'good':val<50?'bad':'')+'"><span>'+esc(label)+'</span><b>'+val+'%</b><i style="--q24:'+val+'%"></i>'+(priority?'<small>'+esc(priority)+'</small>':'')+'</div>';}
 function leanText(x,empty){return x?'<strong>'+esc(x.value)+' · '+x.share+'%</strong><span>'+x.charted+' charted snaps</span>':'<strong>'+esc(empty)+'</strong><span>Keep charting this field.</span>';}
 function ensureIQ(){var quick=$('quickGameStats'),iq=$('iq');if(!iq||!quick)return;var card=$('quality24IQ');if(!card){card=d.createElement('section');card.id='quality24IQ';card.className='card quality24IQ';quick.insertAdjacentElement('afterend',card);}renderIQSnapshot();}
 function renderIQSnapshot(){var card=$('quality24IQ');if(!card||!A.state)return;var h=chartingHealth(A.state.plays),ctx=contextRows(A.state.plays,A.state.current),lean=defensiveLean(ctx.plays),call=bestCall(A.E,ctx.plays),sample=ctx.plays.length,confidence=sample>=8?'Higher':sample>=4?'Medium':'Early';var callHtml=call?'<strong>'+esc(call.label)+' · '+call.ypp.toFixed(1)+' YPP</strong><span>'+call.success+'% success · '+call.n+' calls · '+esc(call.kind)+'</span>':'<strong>Too early for a call lean</strong><span>Game IQ waits for at least 3 repeated calls before recommending one.</span>';card.innerHTML='<div class="q24IQHead"><div><div class="eyebrow">HEADSET SNAPSHOT</div><h2 class="section">Fast answer, with the sample attached.</h2><p class="muted">Recommendations stay conservative until the charted evidence is strong enough.</p></div><span class="tinybadge q24Confidence">'+confidence+' · '+sample+'</span></div><div class="q24IQGrid"><div class="q24IQBlock call"><div class="q24Kicker">CALL LEAN</div>'+callHtml+'<small>'+esc(ctx.broadened?'Using '+ctx.label+' because the exact situation is still thin.':'Using '+ctx.label+'.')+'</small></div><div class="q24IQBlock defense"><div class="q24Kicker">DEFENSIVE LEAN</div><div class="q24DefenseLine"><label>Front</label>'+leanText(lean.front,'Front not charted')+'</div><div class="q24DefenseLine"><label>Coverage</label>'+leanText(lean.coverage,'Coverage not charted')+'</div><div class="q24DefenseLine"><label>Blitz</label>'+leanText(lean.blitz,'Blitz not charted')+'</div></div></div><div class="q24Health"><div class="q24HealthHead"><strong>Charting health</strong><span>Low coverage means lower-confidence Game IQ—not a guessed answer.</span></div><div class="q24HealthGrid">'+healthItem('Hash',h.hash,'pre-snap')+healthItem('Formation',h.formation,'pre-snap')+healthItem('Front',h.front,'defense')+healthItem('Safeties',h.safeties,'defense')+healthItem('Coverage',h.coverage,'high value')+healthItem('Box',h.box,'high value')+healthItem('Motion',h.motion,'high value')+healthItem('Run / pass detail',h.detail,'analysis')+'</div></div>';}
 function ensureAll(){ensureLive();ensureIQ();}
 injectCss();ensureAll();
 var oldAll=A.renderAll;if(oldAll&&!A.__quality24AllWrap){A.__quality24AllWrap=true;A.renderAll=function(){var r=oldAll.apply(A,arguments);ensureAll();return r;};}
 var oldIQ=A.renderIQ;if(oldIQ&&!A.__quality24IQWrap){A.__quality24IQWrap=true;A.renderIQ=function(){var r=oldIQ.apply(A,arguments);ensureIQ();return r;};}
 return A;
}

return{known:known,pct:pct,distanceBucket:distanceBucket,cleanStatPlays:cleanStatPlays,resolvedCoverage:resolvedCoverage,isBlitz:isBlitz,chartingHealth:chartingHealth,contextRows:contextRows,bestCall:bestCall,defensiveLean:defensiveLean,captureScore:captureScore,install:install};
});
