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
  const touch=await page.evaluate(()=>{
    const sels=['#q29IpadDock [data-q29="situation"]','#q29IpadDock [data-q29="drive"]','#q29IpadDock [data-q29="save"]','[data-group="playType"] [data-v="Run"]','#yards'];
    return sels.map(s=>{const e=document.querySelector(s),r=e.getBoundingClientRect(),cs=getComputedStyle(e);return{s,h:r.height,font:parseFloat(cs.fontSize),visible:r.width>0&&r.height>0}});
  });
  touch.forEach(x=>{assert(x.visible,'iPad target must be visible '+x.s);assert(x.h>=47,'iPad target too short '+x.s+': '+x.h);if(x.s==='#yards')assert(x.font>=16,'iPad form control must be >=16px to prevent Safari zoom: '+x.s);});

  // Coach-reported goal-line path: 2nd & goal from Opp 8, +5 must save and continue the drive.
  await page.selectOption('#down','2');await page.fill('#distance','8');await page.selectOption('#side','OPP');await page.fill('#yard','8');
  await page.click('[data-group="playType"] [data-v="Run"]');await page.fill('#yards','5');await page.click('#q29IpadDock [data-q29="save"]');
  await page.waitForFunction(()=>document.querySelector('#headline').textContent.includes('3rd'));
  assert((await page.locator('#headline').textContent()).includes('3rd & 3'),'goal-line +5 should become 3rd & 3');
  assert((await page.locator('#fieldline').textContent()).includes('Opp 3'),'goal-line +5 should spot at Opp 3');
  assert(await page.locator('#driveStartModal').evaluate(el=>el.classList.contains('hidden')),'goal-line continuation must not open Start New Drive');

  // Stale possession flag should self-repair when the actual next snap is still the same drive.
  await page.evaluate(()=>{FNIQ.state.awaitingPossessionStart=true;FNIQ.state.drive=2;FNIQ.save('q29-browser-stale');});
  await page.click('[data-group="playType"] [data-v="Run"]');await page.fill('#yards','1');const before=await page.evaluate(()=>FNIQ.state.plays.length);await page.click('#q29IpadDock [data-q29="save"]');
  await page.waitForFunction(n=>FNIQ.state.plays.length===n+1,before);
  assert.equal(await page.evaluate(()=>FNIQ.state.awaitingPossessionStart),false,'stale possession flag should clear on save');
  assert.equal(await page.evaluate(()=>FNIQ.state.drive),1,'same-drive stale repair should keep drive number');

  // Quick Game Stats: stable metric identities + new coach-requested stats.
  await page.click('[data-screen="iq"]');await page.waitForSelector('#iq.on');
  for(const key of ['avgStart','drives','turnovers'])assert.equal(await page.locator('[data-q29-stat="'+key+'"]').count(),1,'missing added quick stat '+key);
  const identity=await page.evaluate(()=>{
    function bg(key){return getComputedStyle(document.querySelector('#quickStatsGrid [data-stat-key="'+key+'"]')).backgroundColor;}
    const passing=document.querySelector('#quickStatsGrid [data-stat-key="passing"]'),before=bg('passing'),rush=bg('rushing'),pen=bg('penalties');
    passing.classList.remove('good','goodSoft','bad','badSoft');passing.classList.add('bad');const after=bg('passing');
    return{before,after,rush,pen};
  });
  assert.equal(identity.before,identity.after,'Passing color should be stable regardless of good/bad result tone');
  assert.notEqual(identity.before,identity.rush,'Passing and Rushing should keep distinct, consistent metric identities');
  assert.notEqual(identity.pen,identity.before,'Penalty should keep a stable warning identity');
  assert((await page.locator('[data-q29-stat="avgStart"] b').textContent()).includes('Opp')||(await page.locator('[data-q29-stat="avgStart"] b').textContent()).includes('Own'),'average drive start should be rendered as a field position');

  // Empty-game Save & Start resets score without touching an in-progress game.
  await page.evaluate(()=>{FNIQ.state.plays=[];FNIQ.state.score={us:21,them:14};FNIQ.save('q29-score-seed');FNIQ.screen('setup');});
  await page.click('#start');
  assert.deepEqual(await page.evaluate(()=>FNIQ.state.score),{us:0,them:0},'Save & Start on an empty game should reset score');

  const dims=await page.evaluate(()=>({w:innerWidth,scrollW:document.documentElement.scrollWidth}));
  assert(dims.scrollW<=dims.w+2,'iPad layout has horizontal overflow: '+dims.scrollW+' > '+dims.w);
  assert.equal(errors.length,0,'browser errors: '+errors.join(' | '));
  await context.close();await browser.close();
  console.log('QUALITY29 IPAD PASS: goal-line save, stale-drive repair, score reset, stable quick-stat identities, visible touch targets and no horizontal overflow');
})().catch(e=>{console.error(e);process.exit(1)});
