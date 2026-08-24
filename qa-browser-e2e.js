const { chromium }=require('playwright');
const assert=require('assert');
(async()=>{
  const browser=await chromium.launch({headless:true});
  const page=await browser.newPage({viewport:{width:1440,height:1000}});
  const errors=[];
  page.on('pageerror',e=>errors.push('pageerror: '+e.message));
  page.on('console',m=>{if(m.type()==='error')errors.push('console: '+m.text());});
  await page.addInitScript(()=>{localStorage.clear();});
  await page.goto('http://127.0.0.1:8000/?boxqa=1',{waitUntil:'networkidle'});
  await page.waitForSelector('#start');
  await page.fill('#team','Box QA');await page.fill('#opp','Test Defense');
  await page.click('#start');
  await page.waitForSelector('#live.on');
  await page.waitForSelector('#speedPreSnap');
  await page.waitForFunction(()=>getComputedStyle(document.querySelector('#situationCard .grid4')).display==='none');
  assert.equal(await page.locator('#down').isVisible(),false,'normal workflow must not require down input');
  assert(await page.locator('#speedHashButtons').isVisible(),'hash quick buttons visible');
  assert(await page.locator('#formation').isVisible(),'formation visible');
  assert(await page.locator('#personnel').isVisible(),'personnel visible');
  assert.equal(await page.locator('[data-group="playType"] [data-v="No Play"]').count(),0,'No Play removed');

  await page.click('#speedHashButtons button[data-value="Left"]');
  await page.click('[data-group="front"] [data-v="4"]');
  await page.click('[data-group="safeties"] [data-v="2"]');
  await page.click('[data-group="playType"] [data-v="Run"]');
  await page.fill('#yards','5');
  await page.click('#save');
  await page.waitForFunction(()=>document.querySelector('#headline').textContent.includes('2nd & 5'));
  assert.equal(await page.inputValue('#down'),'2');assert.equal(await page.inputValue('#distance'),'5');

  await page.click('[data-group="playType"] [data-v="Penalty"]');
  await page.waitForSelector('#penaltyPanel:not(.hidden)');
  await page.click('#speedPenaltyPresets button[data-pen-quick="False Start"]');
  assert.equal(await page.inputValue('#penTeam'),'Offense');
  assert.equal(await page.inputValue('#penStatus'),'Accepted');
  assert.equal(await page.inputValue('#penDistance'),'5');
  assert.equal(await page.inputValue('#penTiming'),'DEAD');
  assert.equal(await page.inputValue('#penEffect'),'REPEAT');
  await page.click('#save');
  await page.waitForFunction(()=>document.querySelector('#headline').textContent.includes('2nd & 10'));
  assert.equal(await page.inputValue('#down'),'2');assert.equal(await page.inputValue('#distance'),'10');

  await page.click('[data-group="playType"] [data-v="Pass"]');
  const completeBg=await page.locator('[data-pass="Complete"]').evaluate(el=>getComputedStyle(el).backgroundColor);
  const incompleteBg=await page.locator('[data-pass="Incomplete"]').evaluate(el=>getComputedStyle(el).backgroundColor);
  assert.notEqual(completeBg,incompleteBg,'complete/incomplete must be semantically color-coded before a result click');
  assert(await page.locator('[data-pass="Incomplete"]').evaluate(el=>el.classList.contains('semanticBad')),'incomplete pre-colored red');

  await page.click('[data-group="playType"] [data-v="Run"]');
  await page.locator('#speedSpotCalc summary').click();
  await page.selectOption('#speedEndSide','OPP');await page.fill('#speedEndYard','30');await page.click('#speedUseSpot');
  assert.equal(await page.inputValue('#yards'),'45','optional spot calculator should fill yards only');
  assert.equal(await page.inputValue('#down'),'2','spot calculator must not alter situation');

  await page.click('.nav button[data-screen="iq"]');
  await page.waitForSelector('#iq.on #quickGameStats');
  assert(await page.locator('#quickStatsGrid [data-stat-key="third"]').isVisible(),'3rd-down quick stat visible');
  await page.click('#quickStatsGrid [data-stat-key="third"]');
  await page.waitForFunction(()=>document.querySelector('#quickStatDetail h3')&&document.querySelector('#quickStatDetail h3').textContent==='3rd Down');
  assert(await page.locator('#quickStatDetail').isVisible(),'quick stat drilldown opens');

  await page.waitForSelector('#iqFacetBody');
  const playTypeGroup=page.locator('#iqFacetBody .facetGroup').filter({hasText:'Play type'});
  const runFilter=playTypeGroup.locator('.facetOption').filter({hasText:'Run'}).first();
  assert(await runFilter.isVisible(),'Run facet option visible');
  await runFilter.click();
  await page.waitForFunction(()=>Array.from(document.querySelectorAll('#iqFilterChips .iqFilterChip span')).some(s=>s.textContent.includes('Play type: Run')));
  assert(await page.locator('#iqFilterChips').getByText('Play type: Run',{exact:false}).count()>0,'facet click must create active filter chip');

  assert.equal(errors.length,0,'Browser errors: '+errors.join(' | '));
  console.log('BOX E2E PASS: automatic situation, false-start preset, optional spot math, semantic colors, quick-stat drilldown, live filter click');
  await browser.close();
})().catch(async e=>{console.error(e);process.exit(1);});
