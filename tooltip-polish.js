(function(root){
'use strict';
var A=root.FNIQ,d=root.document;if(!A||!d||A.__tooltipPolish)return;A.__tooltipPolish=true;
var HELP={
 lastLook:'Copies the previous defensive front, safety shell, and box count. It does not copy the previous play result.',
 lastContext:'Copies the previous defensive look plus the prior offensive context when the same look repeats. Formation can still be changed before saving.',
 unknownLook:'Marks the defensive picture as unknown so you can save the play without guessing.',
 clearEntry:'Clears this play’s temporary charting fields while keeping personnel and the current game situation.',
 newDrive:'Starts a new offensive drive at 1st & 10. Set the new starting yard line after using it.',
 qbButton:'Changes the active quarterback used automatically for sacks and scrambles.',
 undo:'Removes the most recent play after confirmation and restores its exact pre-snap situation.'
};
var DELAY=3200;
function wire(){var tip=d.getElementById('helpTooltip');if(!tip)return;Object.keys(HELP).forEach(function(id){var el=d.getElementById(id);if(!el||el.dataset.help3200)return;el.dataset.help3200='1';var timer=null;el.addEventListener('mouseenter',function(){clearTimeout(timer);timer=setTimeout(function(){tip.textContent=HELP[id];tip.classList.add('show');tip.setAttribute('aria-hidden','false');var r=el.getBoundingClientRect(),w=tip.offsetWidth||280,h=tip.offsetHeight||60,left=Math.max(10,Math.min(root.innerWidth-w-10,r.left+r.width/2-w/2)),top=r.bottom+10;if(top+h>root.innerHeight-10)top=Math.max(10,r.top-h-10);tip.style.left=left+'px';tip.style.top=top+'px'},DELAY)});el.addEventListener('mouseleave',function(){clearTimeout(timer)});});}
wire();
})(window);
