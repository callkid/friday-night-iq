(function(root,factory){
'use strict';
var C=factory();
if(typeof module==='object'&&module.exports){module.exports=C;return;}
if(root.FNIQ)C.install(root.FNIQ,root);
})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
function shortSituation(text){
  return String(text||'').replace(/\b(1st|2nd|3rd|4th) Down\s*&\s*/g,'$1 & ');
}
function humanizeDistribution(text){
  return String(text||'').split(' • ').map(function(part){
    return part.replace(/\s+\d+\s+\((\d+%)\)\s*$/,' $1');
  }).join(' • ');
}
function humanizeTendency(text){
  text=String(text||'');
  var m=text.match(/^\d+\/\d+\s+observations?\s+\((\d+%)\)$/i);
  if(m)return m[1];
  text=text.replace(/\s+\d+\/\d+\s+\((\d+%)\)\s*$/,' $1');
  return text;
}
function humanizeBrief(text){
  return String(text||'').split('\n').map(function(line){
    line=line.replace(/\s+—\s+\d+\s+observations?\s*$/,'');
    line=line.replace(/^\d+\s+run\s+•\s+\d+\s+pass\s+•\s+/,'');
    line=line.replace(/Blitz\s+—\s+\d+\/\d+\s+\((\d+%)\)/,'Blitz — $1');
    line=line.replace(/\s+\(n=\d+\)\s*$/,'');
    return line;
  }).join('\n');
}
function cleanPriority(d){
  var box=d.getElementById('iqPriorityResults');if(!box)return;
  box.querySelectorAll('.priorityRow').forEach(function(row){
    var head=row.querySelector('.priorityHead strong');if(head)head.textContent=shortSituation(head.textContent);
    var sample=row.querySelector('.priorityHead span');if(sample)sample.remove();
    row.querySelectorAll('div').forEach(function(div){
      var b=div.querySelector(':scope > b'),s=div.querySelector(':scope > span');if(!b||!s)return;
      if(b.textContent.trim()==='Front'||b.textContent.trim()==='Coverage')s.textContent=humanizeDistribution(s.textContent);
      if(b.textContent.trim()==='Blitz')s.textContent=s.textContent.replace(/^(\d+%)\s+\(\d+\s+known\)$/,'$1');
    });
  });
}
function cleanTendencies(d){
  ['liveTendencies','tendenciesIQ'].forEach(function(id){
    var box=d.getElementById(id);if(!box)return;
    box.querySelectorAll('.tendencyline').forEach(function(row){var spans=row.querySelectorAll('span');if(spans[0])spans[0].textContent=humanizeTendency(spans[0].textContent);});
  });
}
function cleanBriefs(d){
  ['quickIQText','quickBriefText'].forEach(function(id){var x=d.getElementById(id);if(x)x.textContent=humanizeBrief(x.textContent);});
}
function cleanActions(d){
  d.querySelectorAll('#actions .action').forEach(function(card){var ms=card.querySelectorAll('.muted');if(!ms.length)return;var x=ms[ms.length-1];x.textContent=x.textContent.replace(/\s+•\s+\d+\s+plays?\s*$/,'');});
}
function install(A,root){
  if(!A||!root.document||A.__coachLanguage)return A;A.__coachLanguage=true;var d=root.document;
  function clean(){cleanPriority(d);cleanTendencies(d);cleanBriefs(d);cleanActions(d);}
  var oldIQ=A.renderIQ;if(oldIQ)A.renderIQ=function(){var r=oldIQ.apply(A,arguments);clean();return r;};
  var oldLive=A.renderLiveIntelligence;if(oldLive)A.renderLiveIntelligence=function(){var r=oldLive.apply(A,arguments);clean();return r;};
  d.addEventListener('click',function(e){if(e.target&&e.target.closest&&e.target.closest('#briefButtons,#quickContextButtons,#iqPriorityCard'))setTimeout(clean,0);});
  clean();
  return A;
}
return{shortSituation:shortSituation,humanizeDistribution:humanizeDistribution,humanizeTendency:humanizeTendency,humanizeBrief:humanizeBrief,install:install};
});
