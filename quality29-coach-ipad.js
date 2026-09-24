(function(root,factory){
'use strict';
var C=factory();
if(typeof module==='object'&&module.exports){module.exports=C;return;}
if(root.FNIQ)C.install(root.FNIQ,root);
})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
function num(v,d){var n=Number(v);return Number.isFinite(n)?n:d;}
function sameSnap(a,b){return !!a&&!!b&&String(a.quarter)===String(b.quarter)&&Number(a.down)===Number(b.down)&&Number(a.distance)===Number(b.distance)&&String(a.fieldSide)===String(b.fieldSide)&&Number(a.yardLine)===Number(b.yardLine);}
function clearScore(state){state=state||{};state.score={us:0,them:0};return state.score;}
function turnover(p){return !!(p&&((Array.isArray(p.tags)&&(p.tags.indexOf('Turnover')>=0||p.tags.indexOf('Fumble Lost')>=0))||p.passResult==='Interception'));}
function driveStats(E,plays){
  plays=Array.isArray(plays)?plays:[];var first={},turnovers=0;
  plays.forEach(function(p){var d=Number(p.drive)||1;if(!first[d]||num(p.number,999999)<num(first[d].number,999999))first[d]=p;if(turnover(p))turnovers++;});
  var starts=Object.keys(first).map(function(k){var p=first[k];return E.fieldAbs(p.fieldSide,p.yardLine);});
  var avg=starts.length?starts.reduce(function(s,x){return s+x;},0)/starts.length:null;
  return{drives:starts.length,avgStartAbs:avg,turnovers:turnovers};
}
function formatField(E,abs){if(abs==null||!Number.isFinite(Number(abs)))return'—';var a=Math.max(1,Math.min(99,Number(abs))),rounded=Math.round(a*10)/10;if(Math.abs(rounded-50)<.05)return'50';if(rounded<50)return'Own '+(Math.round(rounded*10)/10);return'Opp '+(Math.round((100-rounded)*10)/10);}
function repairPossessionGate(state,E){
  if(!state||!state.awaitingPossessionStart||!Array.isArray(state.plays)||!state.plays.length)return false;
  var last=state.plays[state.plays.length-1],derived=E.nextSituation(last),current=state.current||{};
  if(!derived.possessionEnded||!sameSnap(current,derived)){
    state.awaitingPossessionStart=false;
    if(!derived.possessionEnded||Number(current.down)>1){state.drive=Number(last.drive)||state.drive||1;}
    return true;
  }
  return false;
}
function install(A,root){
  if(!A||!root.document||A.__quality29CoachIpad)return A;A.__quality29CoachIpad=true;var d=root.document;
  function $(id){return d.getElementById(id);}
  function injectCss(){if($('quality29CoachIpadCss'))return;var l=d.createElement('link');l.id='quality29CoachIpadCss';l.rel='stylesheet';l.href='quality29-coach-ipad.css?v=q29coach1';d.head.appendChild(l);}
  function resetScoreIfEmpty(){if(A.state&&Array.isArray(A.state.plays)&&A.state.plays.length===0){clearScore(A.state);A.save('new-game-score-reset');}}
  var oldReset=A.resetGame;if(oldReset)A.resetGame=function(){var r=oldReset.apply(A,arguments);clearScore(A.state);A.save('reset-score');return r;};
  var start=$('start');if(start&&!start.dataset.q29ScoreReset){start.dataset.q29ScoreReset='1';var oldStart=start.onclick;start.onclick=function(e){resetScoreIfEmpty();return oldStart&&oldStart.call(this,e);};}
  var save=$('save');if(save&&!save.dataset.q29PossessionGuard){save.dataset.q29PossessionGuard='1';var oldSave=save.onclick;save.onclick=function(e){if(repairPossessionGate(A.state,A.E)){A.save('repair-possession-gate');if(A.hydrateSituation)A.hydrateSituation();}return oldSave&&oldSave.call(this,e);};}
  function renderExtraStats(){
    var g=$('quickStatsGrid');if(!g)return;g.querySelectorAll('[data-q29-stat]').forEach(function(x){x.remove();});var s=driveStats(A.E,A.state.plays),items=[
      ['avgStart','Avg Drive Start',formatField(A.E,s.avgStartAbs),s.drives?s.drives+' drive'+(s.drives===1?'':'s')+' charted':'no drives yet'],
      ['drives','Drives',String(s.drives),'offensive possessions'],
      ['turnovers','Turnovers',String(s.turnovers),s.turnovers?'protect the ball':'none charted']
    ];
    items.forEach(function(x){var el=d.createElement('div');el.className='quickStat q29QuickStat';el.dataset.q29Stat=x[0];el.innerHTML='<span>'+x[1]+'</span><b>'+x[2]+'</b><small>'+x[3]+'</small>';g.appendChild(el);});
  }
  function makeIpadDock(){
    if($('q29IpadDock'))return;var coarse=root.matchMedia&&root.matchMedia('(pointer: coarse)').matches;if(!coarse||root.innerWidth<700||root.innerWidth>1400)return;
    var dock=d.createElement('div');dock.id='q29IpadDock';dock.className='q29IpadDock';dock.innerHTML='<button type="button" data-q29="situation">Edit Situation</button><button type="button" data-q29="drive">New Drive</button><button type="button" class="primary" data-q29="save">Save Play</button>';d.body.appendChild(dock);
    dock.querySelector('[data-q29="save"]').onclick=function(){var b=$('save');if(b)b.click();};
    dock.querySelector('[data-q29="drive"]').onclick=function(){var b=$('newDrive');if(b)b.click();};
    dock.querySelector('[data-q29="situation"]').onclick=function(){var b=$('speedSituationEdit')||$('shortSituationEdit');if(b)b.click();else{var q=$('quarter');if(q)q.focus();}};
  }
  function syncDock(){var dock=$('q29IpadDock');if(!dock)return;var live=$('live');dock.classList.toggle('hidden',!(live&&live.classList.contains('on')));var s=dock.querySelector('[data-q29="save"]');if(s){var p=A.sel&&A.sel.playType;s.textContent=p?'Save '+p:'Save Play';}}
  injectCss();makeIpadDock();renderExtraStats();syncDock();
  var oldAll=A.renderAll;if(oldAll)A.renderAll=function(){var r=oldAll.apply(A,arguments);renderExtraStats();syncDock();return r;};
  var oldIQ=A.renderIQ;if(oldIQ)A.renderIQ=function(){var r=oldIQ.apply(A,arguments);renderExtraStats();return r;};
  var oldScreen=A.screen;if(oldScreen)A.screen=function(){var r=oldScreen.apply(A,arguments);setTimeout(syncDock,0);return r;};
  root.addEventListener('resize',function(){makeIpadDock();syncDock();});
  return A;
}
return{sameSnap:sameSnap,clearScore:clearScore,driveStats:driveStats,formatField:formatField,repairPossessionGate:repairPossessionGate,install:install};
});
