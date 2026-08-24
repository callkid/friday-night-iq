(function(root){
'use strict';
var A=root.FNIQ,d=root.document;if(!A||!d||A.__boxUiV19)return;A.__boxUiV19=true;
function $(id){return d.getElementById(id)}
function injectCss(){if($('boxUiV19Css'))return;var l=d.createElement('link');l.id='boxUiV19Css';l.rel='stylesheet';l.href='box-ui-v19.css?v=box21';d.head.appendChild(l)}
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
function compactMain(){
 var main=$('live')&&$('live').querySelector('main'),play=d.querySelector('[data-group="playType"]');if(!main||!play)return;
 main.classList.add('boxMainGrid');var result=play.closest('.stepcard');if(result)result.classList.add('boxResultCard');
 if($('situationCard'))$('situationCard').classList.add('boxSituationCard');if($('preSnapCard'))$('preSnapCard').classList.add('boxPreSnapCard');
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
injectCss();prepare();
})(window);
