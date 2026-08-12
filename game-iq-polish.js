(function(root){
'use strict';
var A=root.FNIQ,d=root.document;if(!A||!d||A.__gameIQPolish)return;A.__gameIQPolish=true;
function $(id){return d.getElementById(id);}
function ensureSavedCard(){
  var coach=$('coachNowCard'),pins=$('iqPins');if(!coach||!pins)return;
  var card=$('iqSavedViewsCard');
  if(!card){card=d.createElement('div');card.id='iqSavedViewsCard';card.className='card iqSavedViewsCard';card.innerHTML='<div class="cardhead"><div><div class="eyebrow">SAVED VIEWS</div><h2 class="section">Questions you want one tap away</h2><p class="muted">These are bookmarks, not the current situation. Save a Game IQ question and jump back to it later.</p></div></div><div id="iqSavedViewsHome"></div>';coach.insertAdjacentElement('afterend',card);}
  var home=$('iqSavedViewsHome');if(home&&pins.parentNode!==home)home.appendChild(pins);
  var foot=coach.querySelector('.coachNowFoot');if(foot)foot.classList.add('savedMoved');
  var pin=$('pinIQView');if(pin){pin.textContent='Save for quick access';pin.setAttribute('aria-label','Save this Game IQ question for quick access');if(!pin.dataset.savedViewsWired){pin.dataset.savedViewsWired='1';pin.addEventListener('click',function(){setTimeout(refresh,0);});}}
  var lab=pins.querySelector('.pinLabel');if(lab)lab.textContent='Saved views';
  if(!pins.dataset.savedViewsWired){pins.dataset.savedViewsWired='1';pins.addEventListener('click',function(){setTimeout(refresh,0);});}
}
function refresh(){ensureSavedCard();}
refresh();
var oldIQ=A.renderIQ;if(oldIQ)A.renderIQ=function(){var r=oldIQ.apply(A,arguments);refresh();return r;};
var oldAll=A.renderAll;if(oldAll)A.renderAll=function(){var r=oldAll.apply(A,arguments);refresh();return r;};
})(window);
