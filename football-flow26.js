(function(root,factory){
'use strict';
var C=factory();
if(typeof module==='object'&&module.exports){module.exports=C;return;}
if(root.FNIQ)C.install(root.FNIQ,root);
})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';

var RULES={
 'False Start':{team:'Offense',status:'Accepted',distance:5,effect:'REPEAT',timing:'DEAD'},
 'Offside':{team:'Defense',status:'Accepted',distance:5,effect:'REPEAT',timing:'DEAD'},
 'Encroachment':{team:'Defense',status:'Accepted',distance:5,effect:'REPEAT',timing:'DEAD'},
 'Delay of Game':{team:'Offense',status:'Accepted',distance:5,effect:'REPEAT',timing:'DEAD'},
 'Holding':{team:'Offense',status:'Accepted',distance:10,effect:'REPEAT',timing:'LIVE'}
};
function num(v,d){var n=Number(v);return Number.isFinite(n)?n:d;}
function fieldAbs(side,yard){if(side==='50')return 50;return side==='OWN'?num(yard,25):100-num(yard,25);}
function standardRule(type){return RULES[type]?Object.assign({},RULES[type]):null;}
function enforcement(start,team,distance,override){
 var ov=override===null||override===''||typeof override==='undefined'?null:Number(override);
 if(ov!==null&&Number.isFinite(ov))return{yards:ov,distance:Math.abs(ov),half:false,override:true};
 var dist=Math.max(0,num(distance,0)),abs=fieldAbs(start.fieldSide,start.yardLine),sign=team==='Offense'?-1:team==='Defense'?1:0;
 if(!sign||!dist)return{yards:0,distance:0,half:false,override:false};
 var goalDistance=team==='Offense'?abs:100-abs,max=Math.max(.5,goalDistance/2),used=Math.min(dist,max);
 return{yards:sign*used,distance:used,half:used<dist,override:false};
}
function normalizePenaltyPlay(p){
 if(!p||!p.penalty)return p;
 var pen=p.penalty;if(pen.status!=='Accepted'){if(pen.status==='Offsetting')pen.yards=0;return p;}
 var x=enforcement(p,pen.team,pen.distance,pen.netOverride);pen.yards=x.yards;pen.enforcedDistance=x.distance;pen.halfDistance=x.half;pen.officialOverride=x.override;return p;
}
function derivedConcept(playType,detail){if(playType==='Run')return'Run';if(playType==='Pass'&&detail==='Screen')return'Screen';return'NA';}
function attackLabel(v){return{'NA':'Unknown','Inside Zone':'Inside Zone','Outside Zone':'Outside Zone','Counter':'Counter','Power':'Power','Draw':'Draw','Screen':'Screen','Short':'Short','Intermediate':'Intermediate','Deep':'Deep'}[v]||String(v||'');}

function install(A,root){
 if(!A||!root.document||A.__footballFlow26)return A;A.__footballFlow26=true;
 var d=root.document,applyingRule=false;
 function $(id){return d.getElementById(id);}
 function fire(el,type){if(el)el.dispatchEvent(new Event(type||'change',{bubbles:true}));}
 function setVal(id,v){var e=$(id);if(e)e.value=String(v);}
 function ord(n){return Number(n)===1?'1st':Number(n)===2?'2nd':Number(n)===3?'3rd':'4th';}
 function fieldText(s){return s.fieldSide==='50'?'50':(s.fieldSide==='OWN'?'Own ':'Opp ')+s.yardLine;}
 function injectCss(){if($('footballFlow26Css'))return;var l=d.createElement('link');l.id='footballFlow26Css';l.rel='stylesheet';l.href='football-flow26.css?v=flow26';d.head.appendChild(l);d.documentElement.classList.add('fniqFootballFlow26');}
 function fillRule(type){
  var r=standardRule(type);if(!r||applyingRule)return;applyingRule=true;
  if($('penType')&&$('penType').value!==type){setVal('penType',type);fire($('penType'));}
  setVal('penTeam',r.team);setVal('penStatus',r.status);setVal('penDistance',r.distance);setVal('penEffect',r.effect);setVal('penTiming',r.timing);setVal('penNetOverride','');
  ['penTeam','penStatus','penDistance','penEffect','penTiming','penNetOverride'].forEach(function(id){fire($(id));});applyingRule=false;setTimeout(syncPenaltySummary,20);
 }
 function syncDerivedConcept(){var cf=$('conceptFamily');if(!cf)return;var ad=$('attackDetail'),v=derivedConcept(A.sel&&A.sel.playType,ad&&ad.value);if(cf.value!==v){cf.value=v;fire(cf);}}
 var oldBuild=A.buildPlay;if(oldBuild&&!A.__footballFlowBuildWrap){A.__footballFlowBuildWrap=true;A.buildPlay=function(){syncDerivedConcept();return normalizePenaltyPlay(oldBuild.apply(A,arguments));};}
 function currentPenaltyPlay(){try{return A.buildPlay?A.buildPlay():null;}catch(e){return null;}}
 function syncPenaltySummary(){
  var box=$('q26PenaltySummary');if(!box)return;var p=currentPenaltyPlay();if(!p||!p.penalty){box.textContent='Choose the foul. The next snap will preview here.';return;}
  var pen=p.penalty;if(pen.status!=='Accepted'){box.textContent=pen.status?pen.status+' — no accepted enforcement applied.':'Choose penalty status.';return;}
  var n=A.E&&A.E.nextSituation?A.E.nextSituation(p):null,y=num(pen.yards,0),why=pen.officialOverride?'official override':pen.halfDistance?'half the distance':'standard enforcement';
  box.textContent='Net '+(y>0?'+':'')+y+' yd • '+why+(n?' → '+ord(n.down)+' & '+n.distance+' • '+fieldText(n):'');if($('penYards'))$('penYards').value=String(y);
 }
 function cancelPenalty(){
  var tag=d.querySelector('.tag[data-tag="Penalty"]');if(tag)tag.classList.remove('on');if(A.sel&&A.sel.playType==='Penalty'&&A.choose)A.choose('playType',null);
  setVal('penType','');setVal('penTeam','');setVal('penStatus','');setVal('penTiming','NA');setVal('penDistance',0);setVal('penEffect','REPEAT');setVal('penNetOverride','');setVal('penYards',0);
  if($('penaltyPanel'))$('penaltyPanel').classList.add('hidden');if(A.renderAll)A.renderAll();if(A.msg)A.msg('Penalty cleared');
 }
 function ensurePenaltyTools(){
  var panel=$('penaltyPanel'),presets=$('speedPenaltyPresets');if(!panel||!presets)return;
  if(!presets.querySelector('[data-pen-quick="Holding"]')){var other=[].slice.call(presets.querySelectorAll('button')).filter(function(b){return b.textContent.trim()==='Other';})[0],b=d.createElement('button');b.type='button';b.dataset.penQuick='Holding';b.textContent='Holding';b.onclick=function(){setVal('penType','Holding');fire($('penType'));};presets.insertBefore(b,other||null);}
  var head=panel.querySelector('.cardhead');if(head&&!$('q26CancelPenalty')){var c=d.createElement('button');c.id='q26CancelPenalty';c.type='button';c.className='btn q26CancelPenalty';c.textContent='Cancel Penalty';c.onclick=cancelPenalty;head.appendChild(c);}
  if(!$('q26PenaltyAdjust')){
   var adjust=d.createElement('div');adjust.id='q26PenaltyAdjust';adjust.className='q26PenaltyAdjust';adjust.innerHTML='<div id="q26PenaltySummary" class="q26PenaltySummary">Choose the foul. The next snap will preview here.</div>';
   var distance=$('penDistance'),override=$('penNetOverride'),dw=distance&&distance.parentElement,ow=override&&override.parentElement;
   if(dw){var dl=dw.querySelector('.label');if(dl)dl.innerHTML='Rule yards <span class="optional">auto half-distance</span>';adjust.appendChild(dw);}
   if(ow){var ol=ow.querySelector('.label');if(ol)ol.innerHTML='Official net change <span class="optional">only if officials enforce differently</span>';override.placeholder='e.g. -7 or +5';override.step='0.5';adjust.appendChild(ow);}
   var adv=$('penaltyAdvanced');if(adv)panel.insertBefore(adjust,adv);else panel.appendChild(adjust);
  }
  var type=$('penType');if(type&&!type.dataset.q26RuleBound){type.dataset.q26RuleBound='1';type.addEventListener('change',function(){if(!applyingRule&&standardRule(type.value))fillRule(type.value);});}
  ['penType','penTeam','penStatus','penDistance','penNetOverride','penEffect','penTiming'].forEach(function(id){var e=$(id);if(e&&!e.dataset.q26PenaltyBound){e.dataset.q26PenaltyBound='1';e.addEventListener('change',function(){setTimeout(syncPenaltySummary,0);});e.addEventListener('input',function(){setTimeout(syncPenaltySummary,0);});}});syncPenaltySummary();
 }
 function ensureSituationModal(){
  if($('q26SituationModal'))return;var m=d.createElement('div');m.id='q26SituationModal';m.className='q26SituationModal hidden';m.innerHTML='<div class="q26SituationBox"><div class="q26SituationHead"><div><span>NEXT SNAP</span><h3>Correct situation</h3></div><button id="q26SituationClose" type="button" class="btn">Cancel</button></div><div class="q26SituationGrid"><label>Quarter<select id="q26Quarter"><option>Q1</option><option>Q2</option><option>Q3</option><option>Q4</option><option>OT</option></select></label><label>Down<select id="q26Down"><option value="1">1st</option><option value="2">2nd</option><option value="3">3rd</option><option value="4">4th</option></select></label><label>Distance<input id="q26Distance" type="number" min="1"></label><label>Side<select id="q26Side"><option value="OWN">Own</option><option value="50">50</option><option value="OPP">Opp</option></select></label><label>Yard line<input id="q26Yard" type="number" min="1" max="49"></label></div><div class="q26SituationActions"><span>Changes the upcoming snap only. Saved plays stay untouched.</span><button id="q26SituationSave" type="button" class="btn primary">Use This Situation</button></div></div>';d.body.appendChild(m);
  $('q26SituationClose').onclick=function(){m.classList.add('hidden');};$('q26Side').onchange=function(){var y=$('q26Yard');y.disabled=this.value==='50';if(this.value==='50')y.value='50';};$('q26SituationSave').onclick=saveSituation;
 }
 function openSituation(){ensureSituationModal();var s=A.state&&A.state.current||{quarter:'Q1',down:1,distance:10,fieldSide:'OWN',yardLine:25};setVal('q26Quarter',s.quarter);setVal('q26Down',s.down);setVal('q26Distance',s.distance);setVal('q26Side',s.fieldSide);setVal('q26Yard',s.yardLine);fire($('q26Side'));$('q26SituationModal').classList.remove('hidden');}
 function saveSituation(){var side=$('q26Side').value,distance=Math.max(1,num($('q26Distance').value,10)),yard=side==='50'?50:num($('q26Yard').value,NaN);if(side!=='50'&&(!Number.isFinite(yard)||yard<1||yard>49)){if(A.msg)A.msg('Enter a yard line from 1 to 49');return;}if(A.setCurrent)A.setCurrent({quarter:$('q26Quarter').value,down:num($('q26Down').value,1),distance:distance,fieldSide:side,yardLine:yard});if(A.hydrateSituation)A.hydrateSituation();$('q26SituationModal').classList.add('hidden');if(A.renderAll)A.renderAll();if(A.msg)A.msg('Next snap corrected');}
 function bindSituationButtons(){ensureSituationModal();['speedSituationEdit','shortSituationEdit'].forEach(function(id){var b=$(id);if(!b)return;b.onclick=openSituation;b.textContent='Edit Situation';b.classList.add('q26SituationEdit');});}
 function pruneMotionQuick(){var bar=$('q24MotionQuick');if(!bar)return;bar.querySelectorAll('button').forEach(function(b){b.style.display=b.dataset.value==='No Motion'?'inline-flex':'none';});bar.classList.add('q26MotionSingle');}
 function refreshAttackLabels(){var bar=$('q24AttackQuick');if(bar)bar.querySelectorAll('button').forEach(function(b){b.textContent=attackLabel(b.dataset.value);});}
 function bindFlowRefresh(){d.querySelectorAll('[data-group="playType"] .choice').forEach(function(b){if(b.dataset.q26FlowBound)return;b.dataset.q26FlowBound='1';b.addEventListener('click',function(){setTimeout(function(){refreshAttackLabels();syncDerivedConcept();syncOutcome();},20);});});var ad=$('attackDetail');if(ad&&!ad.dataset.q26FlowBound){ad.dataset.q26FlowBound='1';ad.addEventListener('change',function(){setTimeout(function(){refreshAttackLabels();syncDerivedConcept();},0);});}}
 function ensureOutcome(){var detail=$('detail');if(!detail||$('q26Outcome'))return;var row=d.createElement('div');row.id='q26Outcome';row.className='q26Outcome';row.innerHTML='<span>Ball security</span><button type="button" data-q26-tag="Fumble">Fumble</button><button type="button" data-q26-tag="Fumble Lost">Fumble Lost</button><small>First downs, explosives, touchdowns and interceptions are derived from what you already chart.</small>';detail.appendChild(row);row.querySelectorAll('[data-q26-tag]').forEach(function(b){b.onclick=function(){var real=d.querySelector('.tag[data-tag="'+b.dataset.q26Tag+'"]');if(real)real.click();syncOutcome();};});syncOutcome();}
 function syncOutcome(){var row=$('q26Outcome');if(!row)return;row.classList.toggle('hidden',!(A.sel&&['Run','Pass'].indexOf(A.sel.playType)>=0));row.querySelectorAll('[data-q26-tag]').forEach(function(b){var real=d.querySelector('.tag[data-tag="'+b.dataset.q26Tag+'"]');b.classList.toggle('on',!!(real&&real.classList.contains('on')));});}
 function simplifyFinish(){var cf=$('conceptFamily');if(cf&&cf.parentElement)cf.parentElement.classList.add('q26RedundantConcept');var tags=d.querySelector('.trackerResultTags');if(tags)tags.classList.add('q26RedundantTags');var head=d.querySelector('#trackerFinishCard .trackerFinishHead');if(head){var s=head.querySelector('span'),strong=head.querySelector('strong'),small=head.querySelector('small');if(s)s.textContent='AFTER THE SNAP';if(strong)strong.textContent='Post-snap detail';if(small)small.textContent='coverage • call • notes';}var concept=$('concept'),lab=concept&&concept.parentElement&&concept.parentElement.querySelector('.label');if(lab)lab.innerHTML='Call / concept <span class="optional">optional</span>';}
 function captureMissing(){var m=[],e=$('hash');if(!e||e.value==='NA')m.push('Hash');e=$('formation');if(!e||e.value==='NA')m.push('Formation');e=$('personnel');if(!e||!e.value.trim())m.push('Personnel');if(!d.querySelector('[data-group="front"] .choice.on'))m.push('Front');if(!d.querySelector('[data-group="safeties"] .choice.on'))m.push('Safeties');e=$('coverage');if(!e||(e.value==='NA'&&e.dataset.q24Touched!=='1'))m.push('Coverage');if(!d.querySelector('[data-group="box"] .choice.on'))m.push('Box');e=$('motion');if(!e||(e.value==='NA'&&e.dataset.q24Touched!=='1'))m.push('Motion');return m;}
 function updateCaptureCopy(){var count=$('q24CaptureCount'),missing=$('q24CaptureMissing'),label=d.querySelector('#q24Capture .q24CaptureLabel');if(!count)return;var m=captureMissing();if(label)label.textContent='PRE-SNAP';count.textContent=m.length?m.length+' field'+(m.length===1?'':'s')+' missing':'Pre-snap complete';if(missing)missing.textContent=m.length?m.join(' • '):'All 8 key fields charted';}
 function bindCaptureRefresh(){['hash','formation','personnel','coverage','motion'].forEach(function(id){var e=$(id);if(e&&!e.dataset.q26CaptureBound){e.dataset.q26CaptureBound='1';e.addEventListener('change',function(){setTimeout(updateCaptureCopy,0);});e.addEventListener('input',function(){setTimeout(updateCaptureCopy,0);});}});['front','safeties','box'].forEach(function(g){d.querySelectorAll('[data-group="'+g+'"] .choice').forEach(function(b){if(b.dataset.q26CaptureBound)return;b.dataset.q26CaptureBound='1';b.addEventListener('click',function(){setTimeout(updateCaptureCopy,0);});});});}
 function simplifyIQ(){d.querySelectorAll('#quality24IQ .q24HealthItem').forEach(function(x){var s=x.querySelector('span');if(s&&s.textContent.trim()==='Concept family')x.remove();});}
 function prepare(){bindSituationButtons();ensurePenaltyTools();pruneMotionQuick();refreshAttackLabels();bindFlowRefresh();ensureOutcome();syncOutcome();syncDerivedConcept();simplifyFinish();bindCaptureRefresh();updateCaptureCopy();simplifyIQ();}
 injectCss();prepare();var oldAll=A.renderAll;if(oldAll&&!A.__footballFlowAllWrap){A.__footballFlowAllWrap=true;A.renderAll=function(){var r=oldAll.apply(A,arguments);prepare();return r;};}var oldIQ=A.renderIQ;if(oldIQ&&!A.__footballFlowIQWrap){A.__footballFlowIQWrap=true;A.renderIQ=function(){var r=oldIQ.apply(A,arguments);simplifyIQ();return r;};}
 A.footballFlow26={rules:RULES,enforcement:enforcement,normalizePenaltyPlay:normalizePenaltyPlay,derivedConcept:derivedConcept,attackLabel:attackLabel,openSituation:openSituation};return A;
}
return{RULES:RULES,standardRule:standardRule,enforcement:enforcement,normalizePenaltyPlay:normalizePenaltyPlay,derivedConcept:derivedConcept,attackLabel:attackLabel,install:install};
});
