(function(root,factory){
'use strict';
var C=factory();
if(typeof module==='object'&&module.exports){module.exports=C;return}
if(root.FNIQ)C.install(root.FNIQ,root);
})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
var THEME_KEY='fniq_theme_v1';
function normalizeTheme(v){return v==='light'?'light':'dark'}
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
  function ensureEnhancementCss(){if(byId('uiEnhancementCss'))return;var l=d.createElement('link');l.id='uiEnhancementCss';l.rel='stylesheet';l.href='ui-enhancements.css?v=ui3';d.head.appendChild(l)}
  function storedTheme(){try{return normalizeTheme(root.localStorage.getItem(THEME_KEY))}catch(e){return'dark'}}
  function applyTheme(mode){mode=normalizeTheme(mode);d.documentElement.setAttribute('data-theme',mode);d.documentElement.style.colorScheme=mode;var meta=d.querySelector('meta[name="theme-color"]');if(meta)meta.setAttribute('content',mode==='light'?'#f5f7fb':'#07111f');var t=byId('themeToggle'),label=byId('themeModeLabel');if(t)t.checked=mode==='dark';if(label)label.textContent=mode==='dark'?'Dark mode':'Light mode';return mode}
  function saveTheme(mode){mode=applyTheme(mode);try{root.localStorage.setItem(THEME_KEY,mode)}catch(e){}return mode}
  function moveSafety(){var card=byId('gameSafety'),host=byId('settingsSafetyHost');if(card&&host&&card.parentNode!==host)host.appendChild(card)}
  function addAppearance(right){if(!right||byId('appearanceSettings'))return;var c=d.createElement('div');c.id='appearanceSettings';c.className='card';c.innerHTML='<div class="cardhead"><div><h2 class="section">Appearance</h2><p class="muted">Choose the display that is easiest to read in your booth.</p></div></div><div class="themeRow"><div><strong id="themeModeLabel">Dark mode</strong><div class="muted">Toggle between light and dark. Saved on this device.</div></div><label class="themeSwitch" aria-label="Toggle dark mode"><input id="themeToggle" type="checkbox"><span class="themeSlider"></span></label></div>';right.insertBefore(c,right.firstChild);var t=byId('themeToggle');t.checked=storedTheme()==='dark';t.onchange=function(){saveTheme(this.checked?'dark':'light')};applyTheme(storedTheme())}
  function addQuickSave(){var snap=d.querySelector('.snapright'),play=byId('playNum');if(!snap||byId('quickSaveTop'))return;var b=d.createElement('button');b.id='quickSaveTop';b.type='button';b.className='btn primary quickSaveTop';b.textContent='Quick Save';b.onclick=function(){var save=byId('save');if(save)save.click()};snap.insertBefore(b,play||null)}
  function addHelp(){
    var help={
      lastLook:'Copies the previous defensive front, safety shell, and box count. It does not copy the previous play result.',
      lastContext:'Copies the previous defensive look plus the prior offensive context when the same look repeats. Formation can still be changed before saving.',
      unknownLook:'Marks the defensive picture as unknown so you can save the play without guessing.',
      clearEntry:'Clears this play’s temporary charting fields while keeping personnel and the current game situation.',
      newDrive:'Starts a new offensive drive at 1st & 10. Set the new starting yard line after using it.',
      qbButton:'Changes the active quarterback used automatically for sacks and scrambles.',
      undo:'Removes the most recent play after confirmation and restores its exact pre-snap situation.'
    },tip=byId('helpTooltip');
    if(!tip){tip=d.createElement('div');tip.id='helpTooltip';tip.className='helpTooltip';tip.setAttribute('role','tooltip');tip.setAttribute('aria-hidden','true');d.body.appendChild(tip)}
    var timer=null,active=null;
    function hide(){if(timer){clearTimeout(timer);timer=null}active=null;tip.classList.remove('show');tip.setAttribute('aria-hidden','true')}
    function show(el,text){active=el;tip.textContent=text;tip.classList.add('show');tip.setAttribute('aria-hidden','false');var r=el.getBoundingClientRect(),w=tip.offsetWidth||280,h=tip.offsetHeight||60,left=Math.max(10,Math.min(root.innerWidth-w-10,r.left+r.width/2-w/2)),top=r.bottom+10;if(top+h>root.innerHeight-10)top=Math.max(10,r.top-h-10);tip.style.left=left+'px';tip.style.top=top+'px'}
    Object.keys(help).forEach(function(id){var el=byId(id);if(!el||el.dataset.helpBound)return;el.dataset.helpBound='1';el.addEventListener('mouseenter',function(){hide();timer=setTimeout(function(){show(el,help[id])},5000)});el.addEventListener('mouseleave',hide);el.addEventListener('mousedown',hide)});
    if(!tip.dataset.globalBound){tip.dataset.globalBound='1';root.addEventListener('scroll',hide,true);root.addEventListener('resize',hide)}
  }
  ensureEnhancementCss();applyTheme(storedTheme());
  var live=byId('live'),settings=byId('settings');
  if(!settings){
    settings=d.createElement('section');settings.id='settings';settings.className='screen';
    settings.innerHTML='<div class="pagehead"><div><div class="eyebrow">APP SETTINGS</div><h1>Settings</h1><p>Roster, appearance, team branding, and game-safety tools live here so pregame and live charting stay clean.</p></div></div><div class="grid2"><div id="settingsLeft"></div><div id="settingsRight"><div id="settingsSafetyHost"></div></div></div>';
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
  addAppearance(right);
  var setup=byId('setup');
  if(setup){
    var ph=setup.querySelector('.pagehead p');if(ph)ph.textContent='Enter the game details and start charting. Roster, appearance, colors, logo, and backup tools are in Settings.';
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
  addQuickSave();addHelp();
  if(A.initDurability&&!A.__settingsDurabilityWrapped){
    A.__settingsDurabilityWrapped=true;var oldInit=A.initDurability;
    A.initDurability=function(){return Promise.resolve(oldInit.call(A)).then(function(x){moveSafety();addHelp();return x})};
  }
  moveSafety();
  return A;
}
return{normalizeTheme:normalizeTheme,installContextRules:installContextRules,install:install};
});