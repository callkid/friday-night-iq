const {chromium}=require('playwright');
const assert=require('assert');
(async()=>{
  const browser=await chromium.launch({headless:true});
  const context=await browser.newContext({viewport:{width:1024,height:768},hasTouch:true});
  const page=await context.newPage();
  const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
  await page.addInitScript(()=>localStorage.clear());
  await page.goto('http://127.0.0.1:8000/?q29ipad=1',{waitUntil:'networkidle'});
  await page.fill('#team','iPad QA');await page.fill('#opp','Coach Test');await page.click('#start');await page.waitForSelector('#live.on');

  assert(await page.locator('#q29IpadDock').isVisible(),'iPad action dock must be visible on live game');
  await page.waitForFunction(()=>{const dock=document.querySelector('#q29IpadDock'),b=dock&&dock.querySelector('button'),s=document.querySelector('#situationCard'),snap=document.querySelector('#live .snapbar');return dock&&b&&b.getBoundingClientRect().height>=47&&(!s||getComputedStyle(s).display==='none')&&snap&&snap.dataset.q30Pinned==='1';});
  const flowGeometry=await page.evaluate(()=>{const snap=document.querySelector('#live .snapbar'),situation=document.querySelector('#situationCard'),spacer=document.querySelector('#q30SnapSpacer');const chips=[...document.querySelectorAll('.boxResultCard .yardchips .chip')].filter(e=>{const r=e.getBoundingClientRect();return r.width>0&&r.height>0});const rows=[...new Set(chips.map(e=>Math.round(e.getBoundingClientRect().top)))],sr=situation?situation.getBoundingClientRect():null,r=snap&&snap.getBoundingClientRect();return{situationVisible:!!(situation&&getComputedStyle(situation).display!=='none'&&sr&&sr.width>0&&sr.height>0),snapPosition:snap?getComputedStyle(snap).position:'missing',snapTop:r?r.top:null,snapHeight:r?r.height:0,spacerHeight:spacer?spacer.getBoundingClientRect().height:0,yardRows:rows.length,yardCount:chips.length}});
  assert.equal(flowGeometry.situationVisible,false,'actual inline Situation card should be removed from iPad flow');
  assert.equal(flowGeometry.snapPosition,'fixed','live snap context should begin fixed at the top on iPad');
  assert(flowGeometry.snapTop>=-1&&flowGeometry.snapTop<=1,'snap context should sit at viewport top; top='+flowGeometry.snapTop);
  assert(flowGeometry.snapHeight>=70,'snap context unexpectedly collapsed; height='+flowGeometry.snapHeight);
  assert(flowGeometry.spacerHeight>=flowGeometry.snapHeight-2,'snap spacer must preserve layout under pinned strip');
  assert(flowGeometry.yardCount>=8,'expected all yard quick presets on iPad');
  assert(flowGeometry.yardRows<=2,'yard quick presets should use tablet width instead of a tall stack; rows='+flowGeometry.yardRows);
  await page.screenshot({path:'qa-screenshots/q30-ipad-initial.png',fullPage:true});

  const scrollTarget=await page.evaluate(()=>{document.documentElement.style.scrollBehavior='auto';const target=Math.min(700,document.documentElement.scrollHeight-innerHeight);window.scrollTo(0,target);return{target,max:document.documentElement.scrollHeight-innerHeight}});
  assert(scrollTarget.target>=100,'iPad page is too short to exercise pinned snap behavior; max='+scrollTarget.max);await page.waitForFunction(()=>scrollY>=100);await page.waitForTimeout(80);
  const pinnedSnap=await page.locator('#live .snapbar').evaluate(e=>{const r=e.getBoundingClientRect(),probeX=Math.max(r.left+8,Math.min(r.right-8,r.left+r.width/2)),probeY=Math.max(4,Math.min(12,r.bottom-4)),hit=document.elementFromPoint(probeX,probeY),cs=getComputedStyle(e);return{top:r.top,height:r.height,position:cs.position,hitInside:!!(hit&&(hit===e||e.contains(hit)))}});
  assert(['fixed','sticky'].includes(pinnedSnap.position),'scrolled snap context must remain pinned; position='+pinnedSnap.position);assert(pinnedSnap.top>=-1&&pinnedSnap.top<=1,'pinned snap context should remain at viewport top; top='+pinnedSnap.top);assert(pinnedSnap.height>=70,'pinned snap context unexpectedly collapsed; height='+pinnedSnap.height);assert.equal(pinnedSnap.hitInside,true,'pinned snap context is geometrically present but visually clipped near the viewport top');
  await page.screenshot({path:'qa-screenshots/q30-ipad-scrolled.png',fullPage:false});await page.evaluate(()=>window.scrollTo(0,0));

  const touch=await page.evaluate(()=>['#q29IpadDock [data-q29="situation"]','#q29IpadDock [data-q29="drive"]','#q29IpadDock [data-q29="save"]','[data-group="playType"] [data-v="Run"]','#yards'].map(s=>{const e=document.querySelector(s),r=e.getBoundingClientRect(),cs=getComputedStyle(e);return{s,h:r.height,font:parseFloat(cs.fontSize),visible:r.width>0&&r.height>0}}));
  touch.forEach(x=>{assert(x.visible,'iPad target must be visible '+x.s);assert(x.h>=47,'iPad target too short '+x.s+': '+x.h);if(x.s==='#yards')assert(x.font>=16,'iPad form control must be >=16px to prevent Safari zoom: '+x.s)});

  await page.click('#q29IpadDock [data-q29="situation"]');await page.waitForSelector('#q26SituationModal:not(.hidden)');
  await page.selectOption('#q26Down','2');await page.fill('#q26Distance','8');await page.selectOption('#q26Side','OPP');await page.fill('#q26Yard','8');
  const situationTouch=await page.evaluate(()=>['#q26Down','#q26Distance','#q26Side','#q26Yard','#q26SituationSave'].map(s=>{const e=document.querySelector(s),r=e.getBoundingClientRect(),cs=getComputedStyle(e);return{s,h:r.height,font:parseFloat(cs.fontSize),visible:r.width>0&&r.height>0}}));
  situationTouch.forEach(x=>{assert(x.visible,'Edit Situation control must be visible '+x.s);assert(x.h>=47,'Edit Situation target too short '+x.s+': '+x.h);if(x.s!=='#q26SituationSave')assert(x.font>=16,'Edit Situation form control must be >=16px to prevent Safari zoom: '+x.s)});
  await page.click('#q26SituationSave');await page.waitForFunction(()=>document.querySelector('#headline').textContent.includes('2nd & 8')&&document.querySelector('#fieldline').textContent.includes('Opp 8'));
  await page.click('[data-group="playType"] [data-v="Run"]');await page.fill('#yards','5');await page.screenshot({path:'qa-screenshots/q30-ipad-run-selected.png',fullPage:true});await page.click('#q29IpadDock [data-q29="save"]');await page.waitForFunction(()=>document.querySelector('#headline').textContent.includes('3rd'));
  assert((await page.locator('#headline').textContent()).includes('3rd & 3'),'goal-line +5 should become 3rd & 3');assert((await page.locator('#fieldline').textContent()).includes('Opp 3'),'goal-line +5 should spot at Opp 3');assert(await page.locator('#driveStartModal').evaluate(el=>el.classList.contains('hidden')),'goal-line continuation must not open Start New Drive');

  await page.evaluate(()=>{FNIQ.state.awaitingPossessionStart=true;FNIQ.state.drive=2;FNIQ.save('q29-browser-stale')});await page.click('[data-group="playType"] [data-v="Run"]');await page.fill('#yards','1');const before=await page.evaluate(()=>FNIQ.state.plays.length);await page.click('#q29IpadDock [data-q29="save"]');await page.waitForFunction(n=>FNIQ.state.plays.length===n+1,before);assert.equal(await page.evaluate(()=>FNIQ.state.awaitingPossessionStart),false,'stale possession flag should clear on save');assert.equal(await page.evaluate(()=>FNIQ.state.drive),1,'same-drive stale repair should keep drive number');

  await page.click('[data-screen="iq"]');await page.waitForSelector('#iq.on');for(const key of ['avgStart','drives','turnovers'])assert.equal(await page.locator('[data-q29-stat="'+key+'"]').count(),1,'missing added quick stat '+key);
  const identity=await page.evaluate(()=>{function bg(key){return getComputedStyle(document.querySelector('#quickStatsGrid [data-stat-key="'+key+'"]')).backgroundColor}const passing=document.querySelector('#quickStatsGrid [data-stat-key="passing"]'),before=bg('passing'),rush=bg('rushing'),pen=bg('penalties');passing.classList.remove('good','goodSoft','bad','badSoft');passing.classList.add('bad');return{before,after:bg('passing'),rush,pen}});assert.equal(identity.before,identity.after,'Passing color should be stable regardless of good/bad result tone');assert.notEqual(identity.before,identity.rush,'Passing and Rushing should keep distinct, consistent metric identities');assert.notEqual(identity.pen,identity.before,'Penalty should keep a stable warning identity');const avg=await page.locator('[data-q29-stat="avgStart"] b').textContent();assert(avg.includes('Opp')||avg.includes('Own'),'average drive start should be rendered as a field position');

  await page.evaluate(()=>{FNIQ.state.plays=[];FNIQ.state.score={us:21,them:14};FNIQ.save('q29-score-seed');FNIQ.screen('setup')});await page.click('#start');assert.deepEqual(await page.evaluate(()=>FNIQ.state.score),{us:0,them:0},'Save & Start on an empty game should reset score');
  const dims=await page.evaluate(()=>({w:innerWidth,scrollW:document.documentElement.scrollWidth}));assert(dims.scrollW<=dims.w+2,'iPad layout has horizontal overflow: '+dims.scrollW+' > '+dims.w);assert.equal(errors.length,0,'browser errors: '+errors.join(' | '));
  await context.close();await browser.close();console.log('QUALITY30 IPAD PASS: snap context stays visibly pinned at viewport top with flow spacer, Situation card hidden, compact yard grid, full-size dock/Edit Situation controls, goal-line save, stale-drive repair, score reset, stable quick-stat identities, touch targets and no overflow');
})().catch(e=>{console.error(e);process.exit(1)});
