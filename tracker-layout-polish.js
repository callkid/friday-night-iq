(function(root){
'use strict';
var A=root.FNIQ,d=root.document;if(!A||!d||A.__trackerLayoutPolish)return;A.__trackerLayoutPolish=true;
function $(id){return d.getElementById(id)}
function injectCss(){if($('trackerLayoutPolishCss'))return;var l=d.createElement('link');l.id='trackerLayoutPolishCss';l.rel='stylesheet';l.href='tracker-layout-polish.css?v=tracker25';d.head.appendChild(l)}
function moveWrap(id,body,cls,oldRows){var el=$(id),wrap=el&&el.parentElement;if(!wrap||!body)return;var row=wrap.closest('.contextrow');if(row&&oldRows.indexOf(row)<0)oldRows.push(row);wrap.classList.add(cls);if(wrap.parentElement!==body)body.appendChild(wrap)}
function cleanRows(rows){rows.forEach(function(row){if(row&&row.isConnected&&row.children.length===0)row.remove()})}
function ensureFinishCard(){
 var result=d.querySelector('.boxResultCard'),main=result&&result.parentElement;if(!result||!main)return;
 var card=$('trackerFinishCard');
 if(!card){card=d.createElement('section');card.id='trackerFinishCard';card.className='card trackerFinishCard';card.innerHTML='<div class="trackerFinishHead"><div><span>AFTER THE SNAP</span><strong>Finish the picture</strong></div><small>coverage • concept • tags</small></div><div id="trackerFinishBody" class="trackerFinishBody"></div>';result.insertAdjacentElement('afterend',card)}
 var body=$('trackerFinishBody'),oldRows=[];
 moveWrap('postCoverage',body,'trackerPostCoverage',oldRows);
 moveWrap('conceptFamily',body,'trackerConceptFamily',oldRows);
 moveWrap('concept',body,'trackerConcept',oldRows);
 var tags=d.querySelector('.tagwrap'),tagWrap=tags&&tags.parentElement;
 if(tagWrap&&tagWrap!==body&&tagWrap.parentElement!==body){var rg=tagWrap.closest('.resultgrid');tagWrap.classList.add('trackerResultTags');body.appendChild(tagWrap);if(rg&&rg.children.length===1)rg.classList.add('trackerSingleResult')}
 var drawer=[].slice.call(result.querySelectorAll('details.drawer')).filter(function(x){return x.id!=='speedSpotCalc'&&!x.closest('#penaltyPanel')})[0];
 if(drawer&&drawer.parentElement!==body){drawer.classList.add('trackerMoreResult');body.appendChild(drawer)}
 cleanRows(oldRows);result.classList.add('trackerPrimaryResult');card.classList.toggle('hidden',!body.children.length);
}
function prepare(){ensureFinishCard()}
injectCss();prepare();
var old=A.renderAll;if(old&&!A.__trackerLayoutRenderWrap){A.__trackerLayoutRenderWrap=true;A.renderAll=function(){var r=old.apply(A,arguments);prepare();return r}}
})(window);
