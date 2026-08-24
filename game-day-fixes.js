(function(root,factory){
'use strict';
var C=factory();
if(typeof module==='object'&&module.exports){module.exports=C;return;}
if(root.FNIQ)C.install(root.FNIQ,root);
})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
function cloneScore(s){return{us:Number(s&&s.us)||0,them:Number(s&&s.them)||0};}
function hasTag(p,t){return Array.isArray(p&&p.tags)&&p.tags.indexOf(t)>=0;}
function ensureTag(p,t){p.tags=Array.isArray(p.tags)?p.tags:[];if(p.tags.indexOf(t)<0)p.tags.push(t);}
function normalizeInterception(p){
  if(!p)return p;
  p.tags=Array.isArray(p.tags)?p.tags:[];
  if(p.passResult==='Interception'||hasTag(p,'Interception')){ensureTag(p,'Interception');ensureTag(p,'Turnover');}
  return p;
}
function touchdownPoints(next){return next&&next.reason==='Touchdown'?6:0;}
function revisedScore(currentUs,removePoints,addPoints){return Math.max(0,(Number(currentUs)||0)-(Number(removePoints)||0))+(Number(addPoints)||0);}
function scrollTopFor(rectTop,pageYOffset,headerHeight){return Math.max(0,(Number(pageYOffset)||0)+(Number(rectTop)||0)-(Number(headerHeight)||0)-8);}
function install(A,root){
  if(!A||!root.document||A.__gameDayFixes)return A;A.__gameDayFixes=true;
  var d=root.document;
  function $(id){return d.getElementById(id);}
  function injectCss(){if($('gameDayFixesCss'))return;var l=d.createElement('link');l.id='gameDayFixesCss';l.rel='stylesheet';l.href='game-day-fixes.css?v=gameday1';d.head.appendChild(l);}
  function addInterceptionTag(){
    var wrap=d.querySelector('.tagwrap');if(!wrap||$('tagInterception'))return;
    var b=d.createElement('button');b.id='tagInterception';b.type='button';b.className='chip tag';b.dataset.tag='Interception';b.textContent='Interception';
    b.onclick=function(){
      b.classList.toggle('on');
      if(b.classList.contains('on')){
        var turnover=d.querySelector('.tag[data-tag="Turnover"]');if(turnover)turnover.classList.add('on');
        if(A.sel&&A.sel.playType==='Pass'){var intBtn=d.querySelector('[data-pass="Interception"]');if(intBtn)intBtn.click();}
      }
      if(A.renderLiveIntelligence)A.renderLiveIntelligence();
    };
    wrap.appendChild(b);
  }
  function rearrangeResultArea(){
    var grid=d.querySelector('.resultgrid'),pressure=$('pressure'),tags=d.querySelector('.tagwrap');if(!grid||!pressure||!tags)return;
    var tagHost=tags.parentElement,pressureHost=pressure.parentElement,oldPressureRow=pressureHost.parentElement;
    if(!$('resultTagsBelow')){
      var down=d.createElement('div');down.id='resultTagsBelow';down.className='resultTagsBelow';
      var post=$('postCoverage'),postRow=post&&post.closest('.contextrow');
      if(postRow)postRow.insertAdjacentElement('afterend',down);else grid.insertAdjacentElement('afterend',down);
      down.appendChild(tagHost);
    }
    pressureHost.classList.add('postSnapBlitz');
    var lab=pressureHost.querySelector('.label');if(lab)lab.innerHTML='Blitz / pressure <span class="optional">post-snap • Unknown ≠ None</span>';
    if(pressureHost.parentElement!==grid)grid.appendChild(pressureHost);
    if(oldPressureRow&&oldPressureRow!==grid){oldPressureRow.classList.add('coverageOnlyRow');if(oldPressureRow.children.length===1)oldPressureRow.style.gridTemplateColumns='1fr';}
    addInterceptionTag();
  }
  A.state.score=cloneScore(A.state.score);
  var oldApply=A.applyPlay;
  A.applyPlay=function(p){
    p=normalizeInterception(p);
    var before=Number(A.state.score.us)||0,n=oldApply.call(A,p),saved=A.state.plays[A.state.plays.length-1],pts=touchdownPoints(n);
    if(saved){saved.scoreAutoPoints=pts;saved.scoreAfter=cloneScore(A.state.score);}
    if(pts){A.state.score.us=before+pts;if(saved)saved.scoreAfter=cloneScore(A.state.score);A.save('touchdown-score');}
    return n;
  };
  var oldReplace=A.replaceLastPlay;
  if(oldReplace)A.replaceLastPlay=function(p){
    if(!A.state.plays.length)return oldReplace.call(A,normalizeInterception(p));
    var old=A.state.plays[A.state.plays.length-1],current=Number(A.state.score.us)||0,remove=Number(old.scoreAutoPoints)||0;
    A.state.score.us=revisedScore(current,remove,0);
    var n=oldReplace.call(A,normalizeInterception(p));
    if(!n){A.state.score.us=current;return n;}
    var saved=A.state.plays[A.state.plays.length-1],pts=touchdownPoints(n);A.state.score.us=revisedScore(A.state.score.us,0,pts);
    if(saved){saved.scoreAutoPoints=pts;saved.scoreAfter=cloneScore(A.state.score);}
    A.save('edit-last-score');return n;
  };
  var oldUndo=A.undo;
  if(oldUndo)A.undo=function(){var p=oldUndo.call(A);if(p&&p.scoreAutoPoints){A.state.score.us=revisedScore(A.state.score.us,p.scoreAutoPoints,0);A.save('undo-score');}return p;};
  function scrollToLiveTop(){
    var live=$('live'),target=live&&live.querySelector('main');if(!target||!target.getBoundingClientRect)return;
    var topbar=d.querySelector('.top'),h=topbar&&topbar.getBoundingClientRect?topbar.getBoundingClientRect().height:72;
    var y=scrollTopFor(target.getBoundingClientRect().top,root.pageYOffset||d.documentElement.scrollTop||0,h);
    if(root.scrollTo)root.scrollTo(0,y);
  }
  function installSaveScroll(){
    var save=$('save');if(!save||save.dataset.gameDayScroll)return;save.dataset.gameDayScroll='1';var old=save.onclick;
    save.onclick=function(e){var before=A.state.plays.length,r=old&&old.call(this,e),added=A.state.plays.length>before;if(added&&!A.__gameDay3&&!A.__noAutoScroll){setTimeout(scrollToLiveTop,160);setTimeout(scrollToLiveTop,380);}return r;};
  }
  injectCss();rearrangeResultArea();installSaveScroll();
  var oldRender=A.renderAll;if(oldRender)A.renderAll=function(){var r=oldRender.apply(A,arguments);rearrangeResultArea();return r;};
  return A;
}
return{cloneScore:cloneScore,normalizeInterception:normalizeInterception,touchdownPoints:touchdownPoints,revisedScore:revisedScore,scrollTopFor:scrollTopFor,install:install};
});
