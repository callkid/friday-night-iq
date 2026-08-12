(function(root,factory){
'use strict';
var C=factory();
if(typeof module==='object'&&module.exports){module.exports=C;return;}
if(root.FNIQ)C.install(root.FNIQ,root);
})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
function validThreshold(v,fallback){var n=Number(v);return Number.isFinite(n)&&n>0?Math.round(n):fallback;}
function install(A,root){
  if(!A||!root.document||A.__boothFixes)return A;
  A.__boothFixes=true;
  var d=root.document;
  function $(id){return d.getElementById(id);}

  var motion=$('motion');
  if(motion&&motion.tagName==='SELECT'){
    var na=[].find.call(motion.options,function(o){return o.value==='NA';});
    if(na)na.value='';
  }

  var situation=$('situationCard'),toggle=$('situationToggle');
  if(situation&&toggle){
    toggle.onclick=function(){
      var opening=situation.classList.contains('situationCollapsed');
      situation.classList.toggle('situationCollapsed',!opening);
      toggle.textContent=opening?'Collapse':'Edit Situation';
      if(opening)toggle.dataset.manualOpen='1';else delete toggle.dataset.manualOpen;
    };
  }

  var right=$('settingsRight');
  if(right&&!$('chartingSettings')){
    var card=d.createElement('div');card.id='chartingSettings';card.className='card';
    card.innerHTML='<div class="cardhead"><div><h2 class="section">Charting settings</h2><p class="muted">Adjust thresholds without changing previously entered play data.</p></div></div><div class="grid2"><div><label class="label">Explosive run</label><input id="explosiveRunSetting" type="number" min="1" value="12"><div class="muted">12+ yards by default</div></div><div><label class="label">Explosive pass</label><input id="explosivePassSetting" type="number" min="1" value="16"><div class="muted">16+ yards by default</div></div></div>';
    right.insertBefore(card,right.firstChild);
    var run=$('explosiveRunSetting'),pass=$('explosivePassSetting');
    run.value=validThreshold(A.state.settings&&A.state.settings.explosiveRun,12);
    pass.value=validThreshold(A.state.settings&&A.state.settings.explosivePass,16);
    function save(){
      A.state.settings=A.state.settings||{};
      A.state.settings.explosiveRun=validThreshold(run.value,12);
      A.state.settings.explosivePass=validThreshold(pass.value,16);
      run.value=A.state.settings.explosiveRun;pass.value=A.state.settings.explosivePass;
      (A.state.plays||[]).forEach(function(p){if(A.isExplosive){p.tags=Array.isArray(p.tags)?p.tags.filter(function(t){return t!=='Explosive';}):[];if(A.isExplosive(p))p.tags.push('Explosive');}});
      A.save('explosive-thresholds');if(A.renderAll)A.renderAll();if(A.msg)A.msg('Explosive thresholds saved');
    }
    run.onchange=save;pass.onchange=save;
  }
  return A;
}
return{validThreshold:validThreshold,install:install};
});
