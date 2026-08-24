const {chromium}=require('playwright');
const assert=require('assert');
(async()=>{
  const browser=await chromium.launch({headless:true});
  const page=await browser.newPage({viewport:{width:1475,height:668}});
  const errors=[];page.on('pageerror',e=>errors.push('pageerror: '+e.message));page.on('console',m=>{if(m.type()==='error')errors.push('console: '+m.text())});
  await page.addInitScript(()=>localStorage.clear());
  await page.goto('http://127.0.0.1:8000/?quality24qa=1',{waitUntil:'networkidle'});
  await page.fill('#team','Quality24 QA');await page.fill('#opp','Test Defense');await page.click('#start');
  await page.waitForSelector('#live.on');await page.waitForSelector('#q24CoverageQuick');await page.waitForSelector('#q24Hurry');await page.waitForSelector('#q24Capture');
  assert(await page.locator('#q24CoverageQuick button[data-value="Cover 3"]').isVisible(),'pre-snap coverage quick buttons missing');
  assert(await page.locator('#q24MotionQuick button[data-value="NA"]').isVisible(),'No Motion quick button missing');
  assert(await page.locator('#q24Hurry').isVisible(),'Hurry-up toggle missing');

  await page.click('#speedHashButtons button[data-value="Left"]');
  await page.selectOption('#formation','Doubles Right');await page.fill('#personnel','11');
  await page.click('[data-group="front"] [data-v="4"]');await page.click('[data-group="safeties"] [data-v="2"]');
  await page.click('#q24CoverageQuick button[data-value="Cover 3"]');assert.equal(await page.inputValue('#coverage'),'Cover 3');
  await page.click('[data-group="box"] [data-v="6"]');await page.selectOption('#motion','H-Jet');
  await page.waitForFunction(()=>document.querySelector('#q24CaptureCount').textContent.includes('8/8'));
  assert((await page.locator('#q24Capture').getAttribute('class')).includes('complete'),'capture strip should turn complete');

  await page.click('#q24Hurry');assert(await page.locator('html').evaluate(el=>el.classList.contains('fniqHurryUp')),'hurry-up class not enabled');
  for(const s of ['#speedHashButtons','#formation','#personnel','[data-group="front"]','[data-group="safeties"]','#q24CoverageQuick','[data-group="box"]','#motion','[data-group="playType"]','#yards','#save'])assert(await page.locator(s).first().isVisible(),'hurry-up hid essential '+s);
  await page.click('[data-group="playType"] [data-v="Run"]');assert.equal(await page.locator('#detail').isVisible(),false,'hurry-up should hide secondary play detail');
  const saveRect=await page.locator('#save').evaluate(el=>{const r=el.getBoundingClientRect();return{top:r.top,bottom:r.bottom,h:innerHeight}});assert(saveRect.top>=0&&saveRect.bottom<=saveRect.h+2,'Save must remain visible in hurry-up mode');
  await page.click('#q24Hurry');assert.equal(await page.locator('html').evaluate(el=>el.classList.contains('fniqHurryUp')),false);
  await page.waitForSelector('#detail:not(.hidden)');await page.selectOption('#attackDetail','Inside Zone');await page.fill('#yards','6');await page.click('#save');
  await page.waitForFunction(()=>document.querySelector('#headline').textContent.includes('2nd'));
  assert.equal(await page.inputValue('#formation'),'NA','quality24 must preserve formation reset');assert.equal(await page.inputValue('#personnel'),'11','quality24 must preserve personnel carry');
  await page.waitForFunction(()=>Array.from(document.querySelectorAll('#q24MotionQuick button')).some(b=>b.dataset.value==='H-Jet'));
  await page.click('#q24MotionQuick button[data-value="H-Jet"]');assert.equal(await page.inputValue('#motion'),'H-Jet','recent motion shortcut must refill motion');

  for(const yards of ['6','7']){
    await page.selectOption('#formation','Doubles Right');
    await page.click('[data-group="playType"] [data-v="Run"]');
    await page.waitForSelector('#detail:not(.hidden)');await page.selectOption('#attackDetail','Inside Zone');await page.fill('#yards',yards);await page.click('#save');
    await page.waitForTimeout(80);
  }
  await page.click('.nav button[data-screen="iq"]');await page.waitForSelector('#iq.on #quickGameStats');await page.waitForSelector('#quality24IQ');
  const order=await page.evaluate(()=>{const q=document.querySelector('#quickGameStats'),h=document.querySelector('#quality24IQ');return q.compareDocumentPosition(h)&Node.DOCUMENT_POSITION_FOLLOWING});assert(order,'Quick Game Stats must stay before headset snapshot');
  const snap=await page.locator('#quality24IQ').innerText();assert(snap.includes('HEADSET SNAPSHOT'));assert(snap.includes('Inside Zone'),'3 repeated calls should produce a conservative call lean');assert(snap.includes('Charting health'));assert(snap.includes('Coverage'));

  const overflow=await page.evaluate(()=>({sw:document.documentElement.scrollWidth,iw:innerWidth}));assert(overflow.sw<=overflow.iw+2,'quality24 introduced horizontal overflow');
  assert.equal(errors.length,0,'Browser errors: '+errors.join(' | '));
  console.log('QUALITY24 BROWSER PASS: quick coverage, capture completeness, hurry-up essentials, recent motion, reset/carry behavior, conservative headset snapshot, no overflow');
  await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
