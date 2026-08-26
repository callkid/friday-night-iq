(function(root,factory){
'use strict';
var C=factory();
if(typeof module==='object'&&module.exports){module.exports=C;return;}
if(root.FNIQ)C.install(root.FNIQ,root);
})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
var REPEAT_TYPES={'False Start':1,'Offside':1,'Encroachment':1,'Delay of Game':1,'Holding':1};
function defaultEffect(pen){
 if(!pen)return'REPEAT';
 var cur=pen.effect||'REPEAT';
 if(pen.status!=='Accepted')return cur;
 if(cur==='AUTO1'||cur==='LOSS')return cur;
 if(pen.timing==='POST')return'COUNT';
 return'REPEAT';
}
function normalizePlay(p,allowManual){
 if(!p||!p.penalty||p.penalty.status!=='Accepted'||allowManual)return p;
 var pen=p.penalty;
 if(pen.effect==='AUTO1'||pen.effect==='LOSS')return p;
 if(REPEAT_TYPES[pen.type]||pen.timing==='DEAD')pen.effect='REPEAT';
 else if(pen.timing==='POST')pen.effect='COUNT';
 else if(!pen.effect)pen.effect='REPEAT';
 return p;
}
function install(A,root){
 if(!A||!root.document||A.__quality27Hotfix)return A;
 A.__quality27Hotfix=true;
 var d=root.document,effectTouched=false;
 function $(id){return d.getElementById(id);}
 function fire(el){if(el)el.dispatchEvent(new Event('change',{bubbles:true}));}
 function injectCss(){
  if(!$('quality27HotfixCss')){var l=d.createElement('link');l.id='quality27HotfixCss';l.rel='stylesheet';l.href='quality27-hotfix.css?v=q27fix1';d.head.appendChild(l);}
  if(!$('quality27DensityCss')){var q=d.createElement('link');q.id='quality27DensityCss';q.rel='stylesheet';q.href='quality27-density.css?v=q28-game-day';d.head.appendChild(q);}
 }
 function resetEffectTouch(){effectTouched=false;}
 function syncRecommendedEffect(){
  var effect=$('penEffect'),status=$('penStatus'),timing=$('penTiming'),type=$('penType');
  if(!effect||!status||!timing||!type||effectTouched)return;
  var next=defaultEffect({type:type.value,status:status.value,timing:timing.value,effect:effect.value});
  if(effect.value!==next){effect.value=next;fire(effect);}
 }
 function bindPenaltyDefaults(){
  var effect=$('penEffect');
  if(effect&&!effect.dataset.q27HotfixBound){
   effect.dataset.q27HotfixBound='1';
   effect.addEventListener('pointerdown',function(){effectTouched=true;});
   effect.addEventListener('keydown',function(){effectTouched=true;});
  }
  ['penType','penStatus','penTiming'].forEach(function(id){var e=$(id);if(e&&!e.dataset.q27HotfixBound){e.dataset.q27HotfixBound='1';e.addEventListener('change',function(){if(id==='penType')resetEffectTouch();setTimeout(syncRecommendedEffect,0);});}});
  setTimeout(syncRecommendedEffect,0);
 }
 injectCss();bindPenaltyDefaults();
 var oldBuild=A.buildPlay;if(oldBuild&&!A.__q27HotfixBuildWrap){A.__q27HotfixBuildWrap=true;A.buildPlay=function(){return normalizePlay(oldBuild.apply(A,arguments),effectTouched);};}
 var oldReset=A.resetEntry;if(oldReset&&!A.__q27HotfixResetWrap){A.__q27HotfixResetWrap=true;A.resetEntry=function(){resetEffectTouch();var r=oldReset.apply(A,arguments);setTimeout(syncRecommendedEffect,0);return r;};}
 var oldRender=A.renderAll;if(oldRender&&!A.__q27HotfixRenderWrap){A.__q27HotfixRenderWrap=true;A.renderAll=function(){var r=oldRender.apply(A,arguments);bindPenaltyDefaults();return r;};}
 return A;
}
return{REPEAT_TYPES:REPEAT_TYPES,defaultEffect:defaultEffect,normalizePlay:normalizePlay,install:install};
});
