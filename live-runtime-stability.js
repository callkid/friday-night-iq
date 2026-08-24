(function(root){
'use strict';
var A=root.FNIQ;if(!A||!root.document||A.__liveRuntimeStability)return;A.__liveRuntimeStability=true;
/* game-day-fixes uses this compatibility flag only to skip its duplicate two-step auto-scroll. Booth Workflow keeps the single return-to-pre-snap movement. */
A.__gameDay3=true;
root.document.addEventListener('keydown',function(e){
  if(!e.altKey||e.key!=='Enter')return;
  var live=root.document.getElementById('live');if(!live||!live.classList.contains('on'))return;
  var save=root.document.getElementById('save');if(!save)return;
  e.preventDefault();e.stopImmediatePropagation();save.click();
},true);
})(window);
