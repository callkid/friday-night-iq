(function(root,factory){
'use strict';
var C=factory();
if(typeof module==='object'&&module.exports){module.exports=C;return;}
if(root.FNIQ)C.install(root.FNIQ,root);
})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';

var FORMATIONS=[
  'Doubles Right','Doubles Left','Dallas Right','Dallas Left',
  'Trips Right','Trips Left','Toronto Right','Toronto Left',
  'Stack Right','Stack Left','Bunch Right','Bunch Left'
];
var MOTIONS=[
  'H-Jet','Y-Jet','H-Sprint','Y-Sprint','T-Laser','T-Rifle',
  'H-R2','H-L2','X-R1','X-L1','Z-R1','Z-L1'
];
var CONCEPT_FAMILIES=['Run','RPO','Short Game','Drop Back','Screen','Play Action'];
var RUN_TYPES=['Inside Zone','Outside Zone','Counter','Power','Draw'];

function clone(x){return JSON.parse(JSON.stringify(x));}
function isExplosive(p,settings){
  settings=settings||{};
  var run=Number(settings.explosiveRun)||12;
  var pass=Number(settings.explosivePass)||16;
  var y=Number(p&&p.yards)||0;
  return !!p&&(p.playType==='Run'?y>=run:p.playType==='Pass'?y>=pass:false);
}
function normalizeTags(p,settings){
  p.tags=Array.isArray(p.tags)?p.tags.filter(function(t){return t!=='Explosive';}):[];
  if(isExplosive(p,settings))p.tags.push('Explosive');
  return p;
}
function abbreviation(name,fallback){
  var clean=String(name||'').trim();
  if(!clean)return fallback||'US';
  var parts=clean.split(/\s+/);
  if(parts.length>1)return(parts[0][0]+parts[1][0]+(parts[2]?parts[2][0]:'')).toUpperCase();
  return clean.replace(/[^A-Za-z0-9]/g,'').slice(0,3).toUpperCase()||fallback||'US';
}
function pointsFor(type,result){
  if(result!=='Good')return 0;
  return type==='Field Goal'?3:type==='Extra Point'?1:0;
}

function install(A,root){
  if(!A||!root.document||A.__boothWorkflow)return A;
  A.__boothWorkflow=true;
  var d=root.document;
  function $(id){return d.getElementById(id);}

  A.state.settings=A.state.settings||{};
  if(!Number(A.state.settings.explosiveRun))A.state.settings.explosiveRun=12;
  if(!Number(A.state.settings.explosivePass))A.state.settings.explosivePass=16;
  A.state.score=A.state.score||{us:0,them:0};
  A.state.score.us=Number(A.state.score.us)||0;
  A.state.score.them=Number(A.state.score.them)||0;
  if(!Array.isArray(A.state.specialTeams))A.state.specialTeams=[];
  A.isExplosive=function(p){return isExplosive(p,A.state.settings);};

  function injectCss(){
    if($('boothWorkflowCss'))return;
    var l=d.createElement('link');
    l.id='boothWorkflowCss';l.rel='stylesheet';l.href='booth-workflow.css?v=booth2';
    d.head.appendChild(l);
  }

  function option(value,label){
    var o=d.createElement('option');o.value=value;o.textContent=label||value;return o;
  }
  function setOptions(select,items,includeOther){
    if(!select)return;
    select.innerHTML='';
    select.appendChild(option('NA','N/A'));
    items.forEach(function(x){select.appendChild(option(x));});
    if(includeOther)select.appendChild(option('Other'));
    select.value='NA';
  }

  function setupVocabulary(){
    var formation=$('formation');
    if(formation){
      var old=formation.value;
      setOptions(formation,FORMATIONS,true);
      if([].some.call(formation.options,function(o){return o.value===old;}))formation.value=old;
    }
    var motion=$('motion');
    if(motion&&motion.tagName!=='SELECT'){
      var s=d.createElement('select');s.id='motion';
      setOptions(s,MOTIONS,true);
      motion.parentNode.replaceChild(s,motion);
      motion=s;
    }else if(motion){setOptions(motion,MOTIONS,true);}

    var hash=$('hash'),pre=formation&&formation.closest('.stepcard');
    if(hash&&pre){
      var hashWrap=hash.parentElement;
      var row=formation.closest('.contextrow');
      if(row&&hashWrap&&hashWrap.parentNode!==row){
        row.classList.remove('grid3');row.classList.add('grid4');
        hashWrap.style.maxWidth='';
        row.appendChild(hashWrap);
      }
      var label=hashWrap&&hashWrap.querySelector('.label');
      if(label)label.innerHTML='Hash <span class="optional">pre-snap</span>';
    }

    var concept=$('concept');
    if(concept&&!$('conceptFamily')){
      var row=concept.closest('.contextrow');
      if(row){
        row.classList.remove('grid2');row.classList.add('grid3');
        var wrap=d.createElement('div');
        wrap.innerHTML='<label class="label">Concept family <span class="optional">optional</span></label><select id="conceptFamily"><option value="NA">N/A</option></select>';
        row.insertBefore(wrap,concept.parentElement);
        var cf=$('conceptFamily');
        CONCEPT_FAMILIES.forEach(function(x){cf.appendChild(option(x));});
      }
      var cl=concept.parentElement.querySelector('.label');
      if(cl)cl.innerHTML='Specific concept / call <span class="optional">optional</span>';
    }
  }

  function setRunTypeOptions(){
    var a=$('attackDetail'),lab=$('detailLabel');if(!a||!lab)return;
    if(A.sel.playType==='Run'){
      var prior=a.value;a.innerHTML='';a.appendChild(option('NA','N/A'));
      RUN_TYPES.forEach(function(x){a.appendChild(option(x));});
      if([].some.call(a.options,function(o){return o.value===prior;}))a.value=prior;
      lab.textContent='Run Type';
    }
  }
  var oldChoose=A.choose;
  if(oldChoose)A.choose=function(g,v){var r=oldChoose.call(A,g,v);if(g==='playType')setRunTypeOptions();return r;};
  d.querySelectorAll('[data-group="playType"] .choice').forEach(function(b){
    b.addEventListener('click',function(){setTimeout(setRunTypeOptions,0);});
  });

  function addFumbleTags(){
    var tagwrap=d.querySelector('.tagwrap');if(!tagwrap||$('tagFumble'))return;
    function add(id,text,tag){
      var b=d.createElement('button');b.id=id;b.type='button';b.className='chip tag';b.dataset.tag=tag;b.textContent=text;
      b.addEventListener('click',function(){
        b.classList.toggle('on');
        if(tag==='Fumble Lost'&&b.classList.contains('on'))$('tagFumble').classList.add('on');
        if(tag==='Fumble'&&!b.classList.contains('on'))$('tagFumbleLost').classList.remove('on');
      });
      tagwrap.appendChild(b);
    }
    add('tagFumble','Fumble','Fumble');
    add('tagFumbleLost','Fumble Lost','Fumble Lost');
  }

  function augmentPlay(p,preserveScore){
    if(!p)return p;
    p.conceptFamily=$('conceptFamily')?$('conceptFamily').value||'NA':'NA';
    p.scoreBefore=preserveScore||clone(A.state.score);
    normalizeTags(p,A.state.settings);
    return p;
  }
  var oldApply=A.applyPlay;
  A.applyPlay=function(p){return oldApply.call(A,augmentPlay(p,null));};
  var oldReplace=A.replaceLastPlay;
  if(oldReplace)A.replaceLastPlay=function(p){
    var old=A.state.plays[A.state.plays.length-1];
    return oldReplace.call(A,augmentPlay(p,old&&old.scoreBefore?clone(old.scoreBefore):clone(A.state.score)));
  };

  var changed=false;
  A.state.plays.forEach(function(p){
    var before=(p.tags||[]).indexOf('Explosive')>=0;
    normalizeTags(p,A.state.settings);
    if(before!==((p.tags||[]).indexOf('Explosive')>=0))changed=true;
  });
  if(changed)A.save('explosive-threshold-migration');

  function ensureScoreModal(){
    if($('scoreModal'))return;
    var m=d.createElement('div');m.id='scoreModal';m.className='modal hidden';
    m.innerHTML='<div class="modalbox"><div class="eyebrow">SCOREBOARD</div><h3>Edit score</h3><p class="muted">Use the official scoreboard as the source of truth.</p><div class="grid2"><div><label class="label" id="scoreUsLabel">Our score</label><input id="scoreUsInput" type="number" min="0"></div><div><label class="label" id="scoreThemLabel">Opponent score</label><input id="scoreThemInput" type="number" min="0"></div></div><div class="right" style="margin-top:14px"><button id="scoreCancel" class="btn" type="button">Cancel</button><button id="scoreSave" class="btn primary" type="button">Save Score</button></div></div>';
    d.body.appendChild(m);
    $('scoreCancel').onclick=function(){m.classList.add('hidden');};
    $('scoreSave').onclick=function(){
      A.state.score.us=Math.max(0,Number($('scoreUsInput').value)||0);
      A.state.score.them=Math.max(0,Number($('scoreThemInput').value)||0);
      A.save('score');m.classList.add('hidden');updateScore();A.msg('Score updated');
    };
  }
  function ensureScoreboard(){
    var snap=$('headline')&&$('headline').parentElement;if(!snap||$('scoreMini'))return;
    snap.classList.add('snapSituation');
    var b=d.createElement('button');b.id='scoreMini';b.type='button';b.className='scoreMini';
    b.onclick=function(){ensureScoreModal();$('scoreUsInput').value=A.state.score.us;$('scoreThemInput').value=A.state.score.them;updateScoreLabels();$('scoreModal').classList.remove('hidden');};
    snap.appendChild(b);
  }
  function updateScoreLabels(){
    var us=abbreviation(A.state.setup.team,'US'),them=abbreviation(A.state.setup.opp,'OPP');
    if($('scoreUsLabel'))$('scoreUsLabel').textContent=us+' score';
    if($('scoreThemLabel'))$('scoreThemLabel').textContent=them+' score';
  }
  function updateScore(){
    ensureScoreboard();
    var b=$('scoreMini');if(!b)return;
    var us=abbreviation(A.state.setup.team,'US'),them=abbreviation(A.state.setup.opp,'OPP');
    b.innerHTML='<span>'+us+'</span><strong>'+A.state.score.us+'</strong><em>–</em><strong>'+A.state.score.them+'</strong><span>'+them+'</span><small>Edit</small>';
    updateScoreLabels();
  }

  function ensureSpecialTeams(){
    if($('special'))return;
    var nav=d.querySelector('.nav'),iqNav=nav&&nav.querySelector('[data-screen="iq"]');
    if(nav&&!nav.querySelector('[data-screen="special"]')){
      var nb=d.createElement('button');nb.dataset.screen='special';nb.textContent='Special Teams';nb.onclick=function(){A.screen('special');};nav.insertBefore(nb,iqNav||null);
    }
    var iq=$('iq'),s=d.createElement('section');s.id='special';s.className='screen';
    s.innerHTML='<div class="pagehead"><div><div class="eyebrow">QUICK SCORE EVENT</div><h1>Special Teams</h1><p>Field goals and extra points only. Offensive analytics stay separate.</p></div></div><div class="specialGrid"><div class="card"><h2 class="section">Kick</h2><div class="choices" id="specialType"><button class="choice" data-stype="Field Goal">Field Goal</button><button class="choice" data-stype="Extra Point">Extra Point</button></div><div class="contextrow"><label class="label">Result</label><div class="choices" id="specialResult"><button class="choice" data-sresult="Good">Good</button><button class="choice" data-sresult="Miss">Miss</button><button class="choice" data-sresult="Blocked">Blocked</button></div></div><div class="contextrow"><label class="label">Kick distance <span class="optional">optional</span></label><input id="specialDistance" type="number" min="0" placeholder="yards"></div><button id="logSpecial" class="btn primary full" type="button" style="margin-top:14px">Log Special Teams Event</button></div><div class="card"><div class="cardhead"><h2 class="section">This game</h2><span id="specialCount" class="tinybadge">0 events</span></div><div id="specialLog" class="muted">No special teams events logged.</div></div></div>';
    if(iq&&iq.parentNode)iq.parentNode.insertBefore(s,iq);else d.querySelector('.app').appendChild(s);
    var stype='',sresult='';
    s.querySelectorAll('[data-stype]').forEach(function(b){b.onclick=function(){stype=b.dataset.stype;s.querySelectorAll('[data-stype]').forEach(function(x){x.classList.toggle('on',x===b);});};});
    s.querySelectorAll('[data-sresult]').forEach(function(b){b.onclick=function(){sresult=b.dataset.sresult;s.querySelectorAll('[data-sresult]').forEach(function(x){x.classList.toggle('on',x===b);});};});
    $('logSpecial').onclick=function(){
      if(!stype||!sresult)return A.msg('Choose kick type and result');
      var before=clone(A.state.score),pts=pointsFor(stype,sresult);A.state.score.us+=pts;
      var ev={number:A.state.specialTeams.length+1,type:stype,result:sresult,distance:Number($('specialDistance').value)||null,quarter:A.state.current.quarter,drive:A.state.drive,scoreBefore:before,scoreAfter:clone(A.state.score),createdAt:Date.now()};
      A.state.specialTeams.push(ev);
      if(stype==='Field Goal'){
        var has=A.state.plays.some(function(p){return Number(p.drive)===Number(A.state.drive);});
        if(!A.state.awaitingPossessionStart&&has)A.state.drive++;
        A.state.awaitingPossessionStart=true;
      }
      A.save('special-teams');renderSpecial();updateScore();updateDriveGate();A.renderAll();A.msg(stype+' '+sresult.toLowerCase()+' logged');
      stype='';sresult='';$('specialDistance').value='';s.querySelectorAll('.choice').forEach(function(x){x.classList.remove('on');});
    };
  }
  function renderSpecial(){
    if(!$('specialLog'))return;
    var a=A.state.specialTeams||[];$('specialCount').textContent=a.length+' event'+(a.length===1?'':'s');
    $('specialLog').innerHTML=a.length?a.slice().reverse().map(function(x){return'<div class="specialEvent"><strong>'+x.type+' • '+x.result+'</strong><span>'+x.quarter+(x.distance?' • '+x.distance+' yd':'')+' • score '+x.scoreAfter.us+'–'+x.scoreAfter.them+'</span></div>';}).join(''):'No special teams events logged.';
  }

  var manualSituation=false,lastDrive=A.state.drive;
  function ensureSituationUi(){
    var main=$('live')&&$('live').querySelector('main');if(!main)return;
    var cards=main.querySelectorAll('.stepcard');if(!cards.length)return;
    var situation=cards[0],pre=cards[1];situation.id='situationCard';if(pre)pre.id='preSnapCard';
    var head=situation.querySelector('.stephead');
    if(head&&!$('situationToggle')){
      var b=d.createElement('button');b.id='situationToggle';b.className='btn smallbtn situationToggle';b.type='button';b.textContent='Collapse';
      b.onclick=function(){manualSituation=!situation.classList.contains('situationCollapsed');situation.classList.toggle('situationCollapsed');updateSituation();};
      head.appendChild(b);
      var mini=d.createElement('div');mini.id='situationMini';mini.className='situationMini';head.parentNode.insertBefore(mini,head.nextSibling);
    }
  }
  function situationText(){
    var s=A.state.current;return A.ord(s.down)+' & '+s.distance+' • '+A.fieldText(s)+' • '+s.quarter+($('hash')&&$('hash').value!=='NA'?' • '+$('hash').value+' hash':'');
  }
  function updateSituation(){
    ensureSituationUi();var c=$('situationCard');if(!c)return;
    if(lastDrive!==A.state.drive){manualSituation=false;lastDrive=A.state.drive;}
    var has=A.state.plays.some(function(p){return Number(p.drive)===Number(A.state.drive);});
    var shouldCollapse=A.state.awaitingPossessionStart||has;
    if(!shouldCollapse)manualSituation=false;
    c.classList.toggle('situationCollapsed',shouldCollapse&&!manualSituation);
    if($('situationMini'))$('situationMini').textContent=situationText();
    if($('situationToggle'))$('situationToggle').textContent=c.classList.contains('situationCollapsed')?'Edit Situation':'Collapse';
  }

  function ensureDriveGate(){
    var main=$('live')&&$('live').querySelector('main');if(!main||$('driveGate'))return;
    var bar=main.querySelector('.fastbar'),g=d.createElement('div');g.id='driveGate';g.className='driveGate hidden';
    g.innerHTML='<div><strong>Next offensive drive needs a starting spot.</strong><span>You can use Game IQ, edit plays, or change settings now. Set the spot before logging the next offensive snap.</span></div><button id="driveGateButton" class="btn primary" type="button">Set Start Spot</button>';
    if(bar)bar.insertAdjacentElement('afterend',g);else main.insertBefore(g,main.firstChild);
    $('driveGateButton').onclick=function(){$('newDrive').click();};
  }
  function updateDriveGate(){ensureDriveGate();if($('driveGate'))$('driveGate').classList.toggle('hidden',!A.state.awaitingPossessionStart);}

  function resetExtraFields(){if($('conceptFamily'))$('conceptFamily').value='NA';}
  function scrollToPreSnap(){var p=$('preSnapCard');if(p&&p.scrollIntoView)p.scrollIntoView({behavior:'smooth',block:'start'});}
  function wrapSave(){
    var save=$('save');if(!save||save.dataset.boothWrapped)return;save.dataset.boothWrapped='1';
    var old=save.onclick;
    save.onclick=function(e){
      var before=A.state.plays.length,wasUpdate=/Update Play/i.test(save.textContent||'');
      var r=old&&old.call(this,e);
      setTimeout(function(){
        var added=A.state.plays.length>before;
        if(added){manualSituation=false;resetExtraFields();updateSituation();updateDriveGate();scrollToPreSnap();}
        else if(wasUpdate&&!/Update Play/i.test(save.textContent||'')){resetExtraFields();updateSituation();}
      },100);
      return r;
    };
  }

  function attachExtraResets(){
    if($('clearEntry'))$('clearEntry').addEventListener('click',function(){setTimeout(resetExtraFields,0);});
    if($('editLast'))$('editLast').addEventListener('click',function(){setTimeout(function(){var p=A.state.plays[A.state.plays.length-1];if($('conceptFamily'))$('conceptFamily').value=p&&p.conceptFamily||'NA';setRunTypeOptions();},0);});
    if($('cancelEditLast'))$('cancelEditLast').addEventListener('click',function(){setTimeout(resetExtraFields,0);});
  }

  function addFastHelp(){
    var text={
      lastLook:'Copies only the previous defensive picture so you can chart a repeated look faster.',
      lastContext:'Copies the previous defensive look plus the prior offensive context. Formation can still be changed before Save.',
      unknownLook:'Marks the defensive look unknown instead of forcing a guess.',
      editLast:'Loads the most recent saved play so you can correct it without deleting or adding a play.',
      newDrive:'Starts the next offensive possession. You will be required to enter its starting field position.'
    };
    var tip=$('helpTooltip'),timer=null;
    if(!tip){tip=d.createElement('div');tip.id='helpTooltip';tip.className='helpTooltip';d.body.appendChild(tip);}
    function hide(){if(timer)clearTimeout(timer);timer=null;tip.classList.remove('show');}
    function show(el,t){tip.textContent=t;tip.classList.add('show');var r=el.getBoundingClientRect(),w=tip.offsetWidth||280,h=tip.offsetHeight||60;tip.style.left=Math.max(10,Math.min(root.innerWidth-w-10,r.left+r.width/2-w/2))+'px';var top=r.bottom+10;if(top+h>root.innerHeight-10)top=Math.max(10,r.top-h-10);tip.style.top=top+'px';}
    Object.keys(text).forEach(function(id){var el=$(id);if(!el||el.dataset.help32)return;el.dataset.help32='1';el.addEventListener('mouseenter',function(){if(timer)clearTimeout(timer);timer=setTimeout(function(){show(el,text[id]);},3200);});el.addEventListener('mouseleave',hide);el.addEventListener('mousedown',hide);});
  }

  injectCss();setupVocabulary();addFumbleTags();ensureScoreModal();ensureScoreboard();ensureSpecialTeams();ensureSituationUi();ensureDriveGate();wrapSave();attachExtraResets();addFastHelp();

  var oldRender=A.renderAll;
  if(oldRender)A.renderAll=function(){var r=oldRender.call(A);updateScore();renderSpecial();updateSituation();updateDriveGate();return r;};
  var oldSetup=A.renderSetup;
  if(oldSetup)A.renderSetup=function(){var r=oldSetup.call(A);updateScore();return r;};

  A.save('booth-workflow-migration');
  updateScore();renderSpecial();updateSituation();updateDriveGate();
  return A;
}

return{
  FORMATIONS:FORMATIONS,
  MOTIONS:MOTIONS,
  CONCEPT_FAMILIES:CONCEPT_FAMILIES,
  RUN_TYPES:RUN_TYPES,
  isExplosive:isExplosive,
  normalizeTags:normalizeTags,
  abbreviation:abbreviation,
  pointsFor:pointsFor,
  install:install
};
});
