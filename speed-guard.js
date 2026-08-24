(function(root,factory){
'use strict';
var C=factory();
if(typeof module==='object'&&module.exports){module.exports=C;return;}
if(root.FNIQ)C.install(root.FNIQ,root);
})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
var SECONDS_PER_INTERACTION=1.5;
var BUDGETS={
  hurryUp:{interactions:8,description:'Hash + formation + play type + end spot + Enter save'},
  normalRun:{interactions:12,description:'Full critical run path with front/safeties/blitz/post coverage'},
  normalPass:{interactions:13,description:'Full critical pass path including pass result'},
  penalty:{interactions:18,description:'Penalty plus official next down/distance/spot'},
  pickSix:{interactions:10,description:'Pre-snap context + Pass + INT + Pick Six + save'}
};
function estimatedSeconds(name){var b=BUDGETS[name];return b?b.interactions*SECONDS_PER_INTERACTION:Infinity;}
function allUnder(seconds){seconds=Number(seconds)||30;return Object.keys(BUDGETS).every(function(k){return estimatedSeconds(k)<seconds;});}
function install(A,root){
  if(!A||!root.document||A.__speedGuard)return A;A.__speedGuard=true;
  var d=root.document;
  function $(id){return d.getElementById(id);}
  function saveNow(){var b=$('save');if(b&&!b.disabled)b.click();}
  d.addEventListener('keydown',function(e){
    if(e.altKey&&e.key==='Enter'){
      e.preventDefault();e.stopImmediatePropagation();saveNow();
    }
  },true);
  function enterToSave(id){var el=$(id);if(!el||el.dataset.enterSave)return;el.dataset.enterSave='1';el.addEventListener('keydown',function(e){if(e.key==='Enter'&&!e.altKey&&!e.ctrlKey&&!e.metaKey&&!e.shiftKey){e.preventDefault();saveNow();}});}
  enterToSave('gd3EndYard');enterToSave('gd3NextYard');
  function focusYard(sideId,yardId){var s=$(sideId),y=$(yardId);if(!s||!y||s.dataset.speedFocus)return;s.dataset.speedFocus='1';s.addEventListener('change',function(){if((s.value==='OWN'||s.value==='OPP')&&!y.disabled){setTimeout(function(){y.focus();if(y.select)y.select();},0);}});}
  focusYard('gd3EndSide','gd3EndYard');focusYard('gd3NextSide','gd3NextYard');
  var save=$('save');if(save)save.title='Fast save: Alt+Enter anywhere, or press Enter after the end yard line.';
  var hint=d.querySelector('#live .fastbar .hint');if(hint&&hint.textContent.indexOf('Enter after spot saves')<0)hint.textContent='Alt+Enter saves • Enter after spot saves • Alt+L last look • Alt+U unknown';
  var tracker=$('gd3Tracker');if(tracker){tracker.dataset.speedTarget='under-30-seconds';var badge=tracker.querySelector('.gd3Target');if(badge)badge.textContent='≤30 SEC TARGET';}
  return A;
}
return{SECONDS_PER_INTERACTION:SECONDS_PER_INTERACTION,BUDGETS:BUDGETS,estimatedSeconds:estimatedSeconds,allUnder:allUnder,install:install};
});
