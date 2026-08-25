const {chromium}=require('playwright');
const assert=require('assert');
(async()=>{
  const browser=await chromium.launch({headless:true});
  const page=await browser.newPage({viewport:{width:1475,height:668}});
  const errors=[];page.on('pageerror',e=>errors.push('pageerror: '+e.message));page.on('console',m=>{if(m.type()==='error')errors.push('console: '+m.text())});
  await page.addInitScript(()=>localStorage.clear());
  await page.goto('http://127.0.0.1:8000/?quality24qa=1',{waitUntil:'networkidle'});
  await page.fill('#team','Quality24 QA');await page.fill('#opp','Test Defense');await page.click('#start');
  await page.waitForSelector('#live.on');await page.waitForSelector('#q24CoverageQuick');await page.waitForSelector('#q24Hurry');await page.waitForSelector('#q24Capture');await page.waitForSelector('#q24AttackQuick',{state:'attached'});
  assert(await page.locator('#q24CoverageQuick button[data-value="Cover 3"]').isVisible(),'pre-snap coverage quick buttons missing');
  assert(await page.locator('#q24MotionQuick button[data-value="No Motion"]').isVisible(),'explicit No Motion quick button missing');
  assert(await page.locator('#q24Hurry').isVisible(),'Hurry-up toggle missing');
  assert.equal(await page.locator('#q24ConceptQuick').isVisible(),false,'Quality26 must not ask Concept Family again');
  assert.equal(await page.locator('#q24AttackQuick').isVisible(),false,'Run/Pass detail shortcuts must stay hidden until play type is chosen');
  assert.equal(await page.locator('#motion option[value="No Motion"]').count(),1,'explicit No Motion option missing from saved field');

  await page.click('#speedHashButtons button[data-value="Left"]');
  await page.selectOption('#formation','Doubles Right');await page.fill('#personnel','11');
  await page.click('[data-group="front"] [data-v="4"]');await page.click('[data-group="safeties"] [data-v="2"]');
  await page.click('#q24CoverageQuick button[data-value="Cover 3"]');assert.equal(await page.inputValue('#coverage'),'Cover 3');
  await page.click('[data-group="box"] [data-v="6"]');
  await page.click('#q24MotionQuick button[data-value="No Motion"]');assert.equal(await page.inputValue('#motion'),'No Motion','No Motion must be stored explicitly, not as N/A');
  await page.selectOption('#motion','H-Jet');
  await page.waitForFunction(()=>/complete/i.test(document.querySelector('#q24CaptureCount').textContent));
  assert((await page.locator('#q24Capture').getAttribute('class')).includes('complete'),'capture strip should turn complete');
  assert(!/Look\s+\d+\/8/i.test(await page.locator('#q24CaptureCount').textContent()),'Quality26 must use action-oriented capture copy');

  await page.click('#q24Hurry');assert(await page.locator('html').evaluate(el=>el.classList.contains('fniqHurryUp')),'hurry-up class not enabled');
  for(const s of ['#speedHashButtons','#formation','#personnel','[data-group="front"]','[data-group="safeties"]','#q24CoverageQuick','[data-group="box"]','#motion','[data-group="playType"]','#yards','#save'])assert(await page.locator(s).first().isVisible(),'hurry-up hid essential '+s);
  await page.click('[data-group="playType"] [data-v="Run"]');assert.equal(await page.locator('#detail').isVisible(),false,'hurry-up should hide secondary play detail');
  const saveRect=await page.locator('#save').evaluate(el=>{const r=el.getBoundingClientRect();return{top:r.top,bottom:r.bottom,h:innerHeight}});assert(saveRect.top>=0&&saveRect.bottom<=saveRect.h+2,'Save must remain visible in hurry-up mode');
  await page.click('#q24Hurry');assert.equal(await page.locator('html').evaluate(el=>el.classList.contains('fniqHurryUp')),false);

  await page.click('[data-group="playType"] [data-v="Pass"]');await page.waitForSelector('#detail:not(.hidden)');await page.waitForSelector('#q24AttackQuick button[data-value="Deep"]',{state:'visible'});
  await page.click('#q24AttackQuick button[data-value="Deep"]');assert.equal(await page.inputValue('#attackDetail'),'Deep','Pass Depth quick button must update attackDetail');
  await page.click('[data-group="playType"] [data-v="Run"]');await page.waitForSelector('#q24AttackQuick button[data-value="Inside Zone"]',{state:'visible'});
  await page.click('#q24AttackQuick button[data-value="Inside Zone"]');assert.equal(await page.inputValue('#attackDetail'),'Inside Zone','Run Type quick button must update attackDetail');
  assert.equal((await page.locator('#q24AttackQuick button[data-value="Inside Zone"]').textContent()).trim(),'Inside Zone','Run Type must use full football wording');
  await page.fill('#yards','6');await page.click('#save');
  await page.waitForFunction(()=>document.querySelector('#headline').textContent.includes('2nd'));
  assert.equal(await page.inputValue('#formation'),'NA','quality24 must preserve formation reset');assert.equal(await page.inputValue('#personnel'),'11','quality24 must preserve personnel carry');
  assert.notEqual(await page.inputValue('#motion'),'H-Jet','quality24 must preserve motion reset');
  await page.waitForFunction(()=>Array.from(document.querySelectorAll('#q24MotionQuick button')).some(b=>b.dataset.value==='H-Jet'));
  assert.equal(await page.locator('#q24MotionQuick button[data-value="H-Jet"]').isVisible(),false,'recent Motion duplicates must stay hidden when the dropdown already contains them');
  assert(await page.locator('#motion').isVisible(),'Motion dropdown must remain visible');

  for(const yards of ['6','7']){
    await page.selectOption('#formation','Doubles Right');
    await page.click('[data-group="playType"] [data-v="Run"]');
    await page.waitForSelector('#q24AttackQuick button[data-value="Inside Zone"]',{state:'visible'});await page.click('#q24AttackQuick button[data-value="Inside Zone"]');
    await page.fill('#yards',yards);await page.click('#save');await page.waitForTimeout(80);
  }
  const saved=await page.evaluate(()=>window.FNIQ.state.plays.slice(-3).map(p=>({detail:p.attackDetail,family:p.conceptFamily})));
  saved.forEach(p=>{assert.equal(p.detail,'Inside Zone');assert.equal(p.family,'Run','Run concept family should be derived silently rather than double-entered');});
  await page.click('.nav button[data-screen="iq"]');await page.waitForSelector('#iq.on #quickGameStats');await page.waitForSelector('#quality24IQ');
  const order=await page.evaluate(()=>{const q=document.querySelector('#quickGameStats'),h=document.querySelector('#quality24IQ');return q.compareDocumentPosition(h)&Node.DOCUMENT_POSITION_FOLLOWING});assert(order,'Quick Game Stats must stay before headset snapshot');
  const snap=await page.locator('#quality24IQ').innerText();assert(snap.includes('HEADSET SNAPSHOT'));assert(snap.includes('Inside Zone'),'3 repeated calls should produce a conservative call lean');assert(snap.includes('Charting health'));assert(snap.includes('Coverage'));assert(!snap.includes('Concept family'),'Game IQ should not punish a field the live tracker intentionally derives/removes');assert(snap.includes('Run / pass detail'),'Run/pass detail capture health must be visible');

  const overflow=await page.evaluate(()=>({sw:document.documentElement.scrollWidth,iw:innerWidth}));assert(overflow.sw<=overflow.iw+2,'quality24 introduced horizontal overflow');
  assert.equal(errors.length,0,'Browser errors: '+errors.join(' | '));
  console.log('QUALITY24/26 BROWSER PASS: quick coverage, explicit No Motion, full-word run/pass detail, action-oriented capture status, hurry-up essentials, no duplicate concept/motion entry, derived family data, conservative headset snapshot, no overflow');
  await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
