(function(root,factory){
'use strict';
var C=factory();
if(typeof module==='object'&&module.exports){module.exports=C;return;}
if(root.FNIQ)C.install(root.FNIQ,root);
})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
function revised(v,remove,add){return Math.max(0,(Number(v)||0)-(Number(remove)||0))+(Number(add)||0);}
function install(A,root){
 if(!A||!root.document||A.__pickSix)return A;A.__pickSix=true;var d=root.document;
 function $(id){return d.getElementById(id)}
 function injectCss(){if($('pickSixCss'))return;var l=d.createElement('link');l.id='pickSixCss';l.rel='stylesheet';l.href='pick-six.css?v=pick22';d.head.appendChild(l)}
 function selected(p){var b=$('pickSixToggle');return !!(p&&p.passResult==='Interception'&&b&&b.classList.contains('on'))}
 function ensure(){var pass=$('passArea'),buttons=$('passButtons');if(!pass||!buttons||$('pickSixToggle'))return;var b=d.createElement('button');b.id='pickSixToggle';b.type='button';b.className='pickSixToggle hidden';b.textContent='Returned for TD • +6 OPP';b.setAttribute('aria-pressed','false');b.onclick=function(){b.classList.toggle('on');b.setAttribute('aria-pressed',b.classList.contains('on')?'true':'false')};buttons.insertAdjacentElement('afterend',b);d.querySelectorAll('[data-pass]').forEach(function(x){x.addEventListener('click',function(){setTimeout(sync,0)})});var sel=$('passResult');if(sel)sel.addEventListener('change',function(){setTimeout(sync,0)});var edit=$('editLast');if(edit)edit.addEventListener('click',function(){setTimeout(function(){var p=A.state.plays[A.state.plays.length-1];if(p&&p.pickSix){b.classList.remove('hidden');b.classList.add('on');b.setAttribute('aria-pressed','true')}},0)})}
 function sync(){var b=$('pickSixToggle');if(!b)return;var isInt=$('passResult')&&$('passResult').value==='Interception'&&A.sel&&A.sel.playType==='Pass';b.classList.toggle('hidden',!isInt);if(!isInt){b.classList.remove('on');b.setAttribute('aria-pressed','false')}}
 injectCss();ensure();A.state.score=A.state.score||{us:0,them:0};
 var oldApply=A.applyPlay;if(oldApply)A.applyPlay=function(p){p.pickSix=selected(p);var before=Number(A.state.score.them)||0,n=oldApply.call(A,p),saved=A.state.plays[A.state.plays.length-1],pts=p.pickSix?6:0;if(pts){A.state.score.them=before+pts;if(saved){saved.pickSix=true;saved.scoreAutoOpponentPoints=pts;saved.scoreAfter={us:Number(A.state.score.us)||0,them:Number(A.state.score.them)||0}}A.save('pick-six-score')}return n};
 var oldReplace=A.replaceLastPlay;if(oldReplace)A.replaceLastPlay=function(p){p.pickSix=selected(p);var old=A.state.plays[A.state.plays.length-1],current=Number(A.state.score.them)||0,remove=Number(old&&old.scoreAutoOpponentPoints)||0;A.state.score.them=revised(current,remove,0);var n=oldReplace.call(A,p);if(!n){A.state.score.them=current;return n}var saved=A.state.plays[A.state.plays.length-1],pts=p.pickSix?6:0;A.state.score.them=revised(A.state.score.them,0,pts);if(saved){saved.pickSix=!!p.pickSix;saved.scoreAutoOpponentPoints=pts;saved.scoreAfter={us:Number(A.state.score.us)||0,them:Number(A.state.score.them)||0}}A.save('edit-pick-six-score');return n};
 var oldUndo=A.undo;if(oldUndo)A.undo=function(){var p=oldUndo.call(A);if(p&&p.scoreAutoOpponentPoints){A.state.score.them=revised(A.state.score.them,p.scoreAutoOpponentPoints,0);A.save('undo-pick-six-score')}return p};
 var oldReset=A.resetEntry;if(oldReset)A.resetEntry=function(){var r=oldReset.apply(A,arguments),b=$('pickSixToggle');if(b){b.classList.add('hidden');b.classList.remove('on');b.setAttribute('aria-pressed','false')}return r};
 var oldRender=A.renderAll;if(oldRender)A.renderAll=function(){var r=oldRender.apply(A,arguments);ensure();sync();return r};
 return A;
}
return{revised:revised,install:install};
});
