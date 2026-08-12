(function(root,factory){
'use strict';
var C=factory();
if(typeof module==='object'&&module.exports){module.exports=C;return}
if(root.FNIQ)C.install(root.FNIQ,root);
})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
function installContextRules(A){
  if(!A||A.__settingsContextRules)return A;
  A.__settingsContextRules=true;
  A.state.context=A.state.context||{formation:'NA',personnel:''};
  A.state.context.formation='NA';
  var oldSet=A.setContext,oldApply=A.applyPlay,oldUndo=A.undo;
  A.setContext=function(c){c=c||{};return oldSet.call(A,{personnel:c.personnel})};
  A.applyPlay=function(p){var n=oldApply.call(A,p);A.state.context=A.state.context||{};A.state.context.formation='NA';A.save('formation-reset');return n};
  A.undo=function(){var p=oldUndo.call(A);A.state.context=A.state.context||{};A.state.context.formation='NA';A.save('formation-reset');return p};
  A.save('formation-reset-migration');
  return A;
}
function install(A,root){
  installContextRules(A);
  var d=root.document;if(!d)return A;
  function byId(id){return d.getElementById(id)}
  function moveSafety(){var card=byId('gameSafety'),host=byId('settingsSafetyHost');if(card&&host&&card.parentNode!==host)host.appendChild(card)}
  var live=byId('live'),settings=byId('settings');
  if(!settings){
    settings=d.createElement('section');settings.id='settings';settings.className='screen';
    settings.innerHTML='<div class="pagehead"><div><div class="eyebrow">APP SETTINGS</div><h1>Settings</h1><p>Roster, team branding, and game-safety tools live here so pregame and live charting stay clean.</p></div></div><div class="grid2"><div id="settingsLeft"></div><div id="settingsRight"><div id="settingsSafetyHost"></div></div></div>';
    if(live&&live.parentNode)live.parentNode.insertBefore(settings,live);
  }
  var nav=d.querySelector('.nav');
  if(nav&&!byId('settingsNav')){
    var nb=d.createElement('button');nb.id='settingsNav';nb.dataset.screen='settings';nb.textContent='Settings';nb.onclick=function(){A.screen('settings')};
    var liveNav=nav.querySelector('[data-screen="live"]');nav.insertBefore(nb,liveNav||null);
  }
  var brand=byId('brandPrimary');brand=brand&&brand.closest('.card');
  var roster=byId('roster');roster=roster&&roster.closest('.card');
  var left=byId('settingsLeft'),right=byId('settingsRight');
  if(roster&&left)left.appendChild(roster);
  if(brand&&right)right.insertBefore(brand,right.firstChild);
  var setup=byId('setup');
  if(setup){
    var ph=setup.querySelector('.pagehead p');if(ph)ph.textContent='Enter the game details and start charting. Roster, colors, logo, and backup tools are in Settings.';
    var grid=setup.querySelector('.grid2');if(grid){grid.style.gridTemplateColumns='minmax(0,760px)';grid.style.maxWidth='760px'}
    var notice=setup.querySelector('.notice');if(notice)notice.textContent='Game-day setup stays intentionally simple. Your current game still saves automatically on this device.';
    var row=setup.querySelector('.buttonrow');if(row&&!byId('openSettings')){var sb=d.createElement('button');sb.id='openSettings';sb.className='btn';sb.type='button';sb.textContent='Settings';sb.onclick=function(){A.screen('settings')};row.appendChild(sb)}
  }
  var formation=byId('formation');
  if(formation){
    var fLabel=formation.parentNode&&formation.parentNode.querySelector('.optional');if(fLabel)fLabel.textContent='resets each play';
    var card=formation.closest('.card'),desc=card&&card.querySelector('.stephead .muted');if(desc)desc.textContent='What you know before the ball moves. Formation resets after each play; personnel stays until you change it.';
    formation.value='NA';
  }
  var qb=byId('qbButton');
  function fixQB(){if(!qb)return;var t=qb.textContent||'';if(t.indexOf('QB:')===0)qb.textContent='Active QB:'+t.slice(3)}
  if(qb){
    var pre=formation&&formation.closest('.card');
    if(pre&&!byId('activeQBSlot')){var slot=d.createElement('div');slot.id='activeQBSlot';slot.className='contextrow';slot.style.maxWidth='230px';var lab=d.createElement('label');lab.className='label';lab.textContent='Active quarterback';slot.appendChild(lab);slot.appendChild(qb);var rows=pre.querySelectorAll('.contextrow');if(rows.length)rows[0].parentNode.insertBefore(slot,rows[1]||null);else pre.appendChild(slot)}
    fixQB();new MutationObserver(fixQB).observe(qb,{childList:true,subtree:true});
  }
  var clear=byId('clearEntry');if(clear&&!clear.dataset.personnelOnly){clear.dataset.personnelOnly='1';clear.addEventListener('click',function(e){e.preventDefault();e.stopImmediatePropagation();A.resetEntry();A.msg&&A.msg('Entry cleared — personnel kept')},true)}
  if(A.initDurability&&!A.__settingsDurabilityWrapped){
    A.__settingsDurabilityWrapped=true;var oldInit=A.initDurability;
    A.initDurability=function(){return Promise.resolve(oldInit.call(A)).then(function(x){moveSafety();return x})};
  }
  moveSafety();
  return A;
}
return{installContextRules:installContextRules,install:install};
});