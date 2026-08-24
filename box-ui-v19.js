(function(root){
'use strict';
var A=root.FNIQ,d=root.document;if(!A||!d||A.__boxUiV19)return;A.__boxUiV19=true;
function $(id){return d.getElementById(id)}
function injectCss(){
 if(!$('boxUiV19Css')){var l=d.createElement('link');l.id='boxUiV19Css';l.rel='stylesheet';l.href='box-ui-v19.css?v=box23';d.head.appendChild(l)}
 if(!$('visualPolishCss')){var v=d.createElement('link');v.id='visualPolishCss';v.rel='stylesheet';v.href='visual-polish.css?v=visual23';d.head.appendChild(v)}
 if(!$('adaptiveLayoutCss')){var a=d.createElement('link');a.id='adaptiveLayoutCss';a.rel='stylesheet';a.href='adaptive-layout.css?v=adaptive23b';d.head.appendChild(a)}
}
function compactPreSnap(){
 var card=$('preSnapCard'),motion=$('motion'),box=d.querySelector('[data-group="box"]'),defGrid=card&&card.querySelector('.speedDefenseGrid');if(!card||!defGrid)return;
 var motionWrap=motion&&motion.parentElement,boxWrap=box&&box.parentElement,row=$('boxSecondaryLookRow');
 if(!row){row=d.createElement('div');row.id='boxSecondaryLookRow';row.className='boxSecondaryLookRow';defGrid.insertAdjacentElement('afterend',row)}
 if(boxWrap&&boxWrap.parentElement!==row)row.appendChild(boxWrap);
 if(motionWrap&&motionWrap.parentElement!==row)row.appendChild(motionWrap);
 if(boxWrap){var bl=boxWrap.querySelector('.label');if(bl)bl.innerHTML='Box <span class="optional">quick count</span>';var na=box.querySelector('.choice.na');if(na)na.remove()}
 if(motionWrap){var ml=motionWrap.querySelector('.label');if(ml)ml.innerHTML='Motion <span class="optional">resets each play</span>'}
 var formation=$('formation'),personnel=$('personnel');
 if(formation){var fl=formation.parentElement&&formation.parentElement.querySelector('.label');if(fl)fl.innerHTML='Formation <span class="optional">resets each play</span>'}
 if(personnel){var pl=personnel.parentElement&&personnel.parentElement.querySelector('.label');if(pl)pl.innerHTML='Personnel <span class="optional">stays until changed</span>'}
 var head=card.querySelector('.stephead .muted');if(head)head.textContent='Hash, formation and personnel first. Formation resets after Save; personnel carries forward.';
 var more=$('speedPreMore');if(more)more.remove();
}
function dockSave(result){
 var summary=d.querySelector('#live .entrysummary');if(!result||!summary)return;
 if(summary.parentElement!==result)result.appendChild(summary);
 summary.classList.add('boxDockedSummary');
}
function shortSituationControl(){
 var snap=$('headline')&&$('headline').closest('.snapbar'),right=snap&&snap.querySelector('.snapright'),original=$('speedSituationEdit');if(!right||!original)return;
 var b=$('shortSituationEdit');
 if(!b){b=d.createElement('button');b.id='shortSituationEdit';b.type='button';b.className='btn smallbtn shortSituationEdit';b.onclick=function(){original.click();setTimeout(sync,0)};right.insertBefore(b,right.firstChild);}
 function sync(){var card=$('situationCard'),open=card&&card.classList.contains('speedSituationOpen');b.textContent=open?'Done':'Edit Situation';b.classList.toggle('on',!!open)}
 sync();
}
function compactMain(){
 var main=$('live')&&$('live').querySelector('main'),play=d.querySelector('[data-group="playType"]');if(!main||!play)return;
 main.classList.add('boxMainGrid');var result=play.closest('.stepcard');if(result)result.classList.add('boxResultCard');
 if($('situationCard'))$('situationCard').classList.add('boxSituationCard');if($('preSnapCard'))$('preSnapCard').classList.add('boxPreSnapCard');
 dockSave(result);shortSituationControl();
}
function inlinePenalty(){
 var panel=$('penaltyPanel'),group=d.querySelector('[data-group="playType"]'),pen=d.querySelector('[data-group="playType"] [data-v="Penalty"]');if(!panel||!group||!pen)return;
 var card=group.closest('.stepcard');if(card&&panel.parentElement!==card)group.insertAdjacentElement('afterend',panel);
 panel.classList.add('boxPenaltyInline');
 var adv=$('penaltyAdvanced');if(adv)adv.open=false;
 if(!pen.dataset.boxInline){pen.dataset.boxInline='1';pen.addEventListener('click',function(){root.requestAnimationFrame(function(){panel.classList.add('boxPenaltyJustOpened')})})}
}
function tightenLabels(){var spot=$('speedSpotCalc');if(spot){var s=spot.querySelector('summary');if(s)s.innerHTML='Need help calculating yards? <span>optional</span>'}var save=$('save');if(save)save.setAttribute('title','Save this play and advance the situation automatically')}
function prepare(){d.documentElement.classList.add('fniqBoxCompact');compactPreSnap();compactMain();inlinePenalty();tightenLabels()}
injectCss();prepare();var old=A.renderAll;if(old&&!A.__boxUiRenderWrap){A.__boxUiRenderWrap=true;A.renderAll=function(){var r=old.apply(A,arguments);prepare();return r}}
})(window);
