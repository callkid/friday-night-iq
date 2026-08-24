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
  'Delay of Game':{team:'Offense',status:'Accepted',distance:5,effect:'REPEAT',timing:'DEAD'}
};
function cloneRule(type){var r=RULES[type];return r?Object.assign({},r):null;}
function normalizePlay(p,allowOverride){
  if(!p||!p.penalty)return p;
  var r=RULES[p.penalty.type];
  if(!r||p.penalty.status!=='Accepted'||allowOverride)return p;
  p.penalty.team=r.team;
  p.penalty.status=r.status;
  p.penalty.distance=r.distance;
  p.penalty.effect=r.effect;
  p.penalty.timing=r.timing;
  p.penalty.yards=(r.team==='Offense'?-1:1)*r.distance;
  return p;
}
function install(A,root){
  if(!A||!root.document||A.__penaltyHardening)return A;A.__penaltyHardening=true;
  var d=root.document,applying=false,override=false;
  function $(id){return d.getElementById(id);}
  function fire(el,type){if(el)el.dispatchEvent(new Event(type||'change',{bubbles:true}));}
  function rule(){return cloneRule($('penType')&&$('penType').value);}
  function setVal(id,v){var el=$(id);if(!el)return;el.value=String(v);}
  function applyRule(){
    var r=rule();if(!r)return;
    applying=true;override=false;
    setVal('penTeam',r.team);setVal('penStatus',r.status);setVal('penDistance',r.distance);setVal('penEffect',r.effect);setVal('penTiming',r.timing);setVal('penNetOverride','');
    applying=false;
    if(A.syncPenaltyNet)A.syncPenaltyNet();
    var box=$('penaltyAutoSummary');if(box)box.textContent='Auto rule: '+r.distance+' yards • '+(r.team==='Offense'?'against us':'on defense')+' • repeat '+(A.readSituation?A.ord(A.readSituation().down).toLowerCase():'the')+' down.';
  }
  var type=$('penType');if(type)type.addEventListener('change',function(){setTimeout(applyRule,0);});
  ['penTeam','penTiming','penDistance','penEffect','penNetOverride'].forEach(function(id){var el=$(id);if(!el)return;el.addEventListener('change',function(){if(!applying&&rule())override=true;});el.addEventListener('input',function(){if(!applying&&rule())override=true;});});
  var oldBuild=A.buildPlay;if(oldBuild)A.buildPlay=function(){var p=oldBuild.apply(A,arguments);return normalizePlay(p,override);};
  A.penaltyRuleFor=cloneRule;A.penaltyRuleOverride=function(){return override;};
  return A;
}
return{RULES:RULES,ruleFor:cloneRule,normalizePlay:normalizePlay,install:install};
});
