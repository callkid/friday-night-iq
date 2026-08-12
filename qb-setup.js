(function(root,factory){
'use strict';
var C=factory();
if(typeof module==='object'&&module.exports){module.exports=C;return;}
if(root.FNIQ)C.install(root.FNIQ,root);
})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
function qbValue(p){return'#'+String(p&&p.number||'').trim()+' '+String(p&&p.name||'').trim();}
function quarterbacks(roster){return(roster||[]).filter(function(p){return String(p&&p.position||'').trim().toUpperCase()==='QB';}).map(function(p){return{value:qbValue(p),number:String(p.number||'').trim(),name:String(p.name||'').trim()};});}
function install(A,root){
  if(!A||!root.document||A.__qbSetup)return A;
  A.__qbSetup=true;
  var d=root.document;
  function $(id){return d.getElementById(id);}
  function injectCss(){if($('qbSetupCss'))return;var l=d.createElement('link');l.id='qbSetupCss';l.rel='stylesheet';l.href='qb-setup.css?v=qb1';d.head.appendChild(l);}
  function hideLiveQB(){var q=$('qbButton'),slot=$('activeQBSlot');if(q)q.classList.add('qbLiveHidden');if(slot)slot.classList.add('qbLiveHidden');}
  function ensureUi(){
    var setup=$('setup');if(!setup||$('setupQB'))return;
    var game=setup.querySelector('.card'),grid=game&&game.querySelector('.grid2');if(!game)return;
    var wrap=d.createElement('div');wrap.id='setupQB';wrap.className='setupQB';
    wrap.innerHTML='<div><label class="label">Starting quarterback</label><select id="setupQBSelect"></select><div id="setupQBHint" class="muted">Used automatically for sacks and scrambles. Change this only if another QB enters.</div></div>';
    if(grid)grid.insertAdjacentElement('afterend',wrap);else game.insertBefore(wrap,game.firstChild);
    $('setupQBSelect').onchange=function(){A.state.activeQB=this.value||null;A.save('active-qb');syncHiddenButton();render();A.msg&&A.msg(A.state.activeQB?'Active QB: '+A.state.activeQB:'Active QB cleared');};
  }
  function syncHiddenButton(){var q=$('qbButton');if(q)q.textContent='Active QB: '+(A.state.activeQB||'N/A');}
  function render(){
    ensureUi();hideLiveQB();var s=$('setupQBSelect');if(!s)return;
    var qs=quarterbacks(A.state.roster),current=A.state.activeQB||'';
    s.innerHTML='';
    if(!qs.length){var no=d.createElement('option');no.value='';no.textContent='No QB on roster — add one in Settings';s.appendChild(no);s.disabled=true;A.state.activeQB=null;syncHiddenButton();return;}
    s.disabled=false;
    qs.forEach(function(q){var o=d.createElement('option');o.value=q.value;o.textContent=q.value;s.appendChild(o);});
    if(!qs.some(function(q){return q.value===current;})){current=qs[0].value;A.state.activeQB=current;A.save('active-qb-default');}
    s.value=current;syncHiddenButton();
    var h=$('setupQBHint');if(h)h.textContent='Active QB: '+current+' • Used automatically for sacks and scrambles.';
  }
  injectCss();ensureUi();hideLiveQB();render();
  var oldSetup=A.renderSetup;if(oldSetup)A.renderSetup=function(){var r=oldSetup.apply(A,arguments);render();return r;};
  var oldScreen=A.screen;if(oldScreen)A.screen=function(id){var r=oldScreen.apply(A,arguments);if(id==='setup')render();return r;};
  d.addEventListener('input',function(e){if(e.target&&e.target.closest&&e.target.closest('#roster'))setTimeout(render,0);});
  d.addEventListener('change',function(e){if(e.target&&e.target.closest&&e.target.closest('#roster'))setTimeout(render,0);});
  var roster=$('roster');if(roster)new MutationObserver(function(){setTimeout(render,0);}).observe(roster,{childList:true,subtree:true});
  return A;
}
return{qbValue:qbValue,quarterbacks:quarterbacks,install:install};
});
