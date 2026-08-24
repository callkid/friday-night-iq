const { chromium }=require('playwright');
const assert=require('assert');
function rgb(s){const m=String(s).match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);return m?[+m[1],+m[2],+m[3]]:[0,0,0]}
function lum(c){const a=c.map(v=>{v/=255;return v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4)});return .2126*a[0]+.7152*a[1]+.0722*a[2]}
function contrast(a,b){const x=lum(rgb(a)),y=lum(rgb(b)),hi=Math.max(x,y),lo=Math.min(x,y);return(hi+.05)/(lo+.05)}
(async()=>{
  const browser=await chromium.launch({headless:true});
  const page=await browser.newPage({viewport:{width:1440,height:1000}});
  const errors=[];
  page.on('pageerror',e=>errors.push('pageerror: '+e.message));
  page.on('console',m=>{if(m.type()==='error')errors.push('console: '+m.text())});
  await page.addInitScript(()=>{localStorage.clear()});
  await page.goto('http://127.0.0.1:8000/?boxqa=1',{waitUntil:'networkidle'});
  await page.waitForSelector('#start');
  await page.fill('#team','Box QA');await page.fill('#opp','Test Defense');
  await page.click('#start');
  await page.waitForSelector('#live.on');await page.waitForSelector('#speedPreSnap');await page.waitForSelector('#boxSecondaryLookRow');
  await page.waitForFunction(()=>getComputedStyle(document.querySelector('#situationCard .grid4')).display==='none');
  assert.equal(await page.locator('#down').isVisible(),false,'normal workflow must not require down input');
  assert(await page.locator('#speedHashButtons').isVisible(),'hash quick buttons visible');
  assert(await page.locator('#formation').isVisible(),'formation visible');assert(await page.locator('#personnel').isVisible(),'personnel visible');
  assert(await page.locator('#motion').isVisible(),'motion remains visible in compact workflow');assert(await page.locator('[data-group="box"]').isVisible(),'box remains visible in compact workflow');
  assert.equal(await page.locator('[data-group="box"] .choice.na').count(),0,'box N/A does not waste a slot');
  assert.equal(await page.locator('[data-group="playType"] [data-v="No Play"]').count(),0,'No Play removed');
  assert((await page.locator('#formation').locator('xpath=..').innerText()).toLowerCase().includes('resets each play'),'formation label must say it resets each play');
  const forms=await page.locator('#formation option').allTextContents();assert(forms.includes('Doubles Right')&&forms.includes('Bunch Left'),'Skyridge formation vocabulary missing');
  const motions=await page.locator('#motion option').allTextContents();assert(motions.includes('H-Jet')&&motions.includes('T-Laser')&&motions.includes('Z-L1'),'Skyridge motion vocabulary missing');
  assert(await page.locator('#tagFumble').count()===1&&await page.locator('#tagFumbleLost').count()===1,'Fumble result tags missing');
  for(const sel of ['#speedHashButtons','#formation','#personnel','.speedDefenseGrid','#boxSecondaryLookRow','[data-group="playType"]','#yards','#save']){
    const loc=page.locator(sel).first();if(await loc.isVisible()){const r=await loc.evaluate(el=>{const x=el.getBoundingClientRect();return{top:x.top,bottom:x.bottom,h:innerHeight}});assert(r.top>=0&&r.bottom<=r.h+2,'primary tracker control off-screen without scrolling: '+sel)}
  }

  await page.click('#speedHashButtons button[data-value="Left"]');
  await page.selectOption('#formation','Doubles Right');await page.fill('#personnel','11');await page.selectOption('#motion','H-Jet');
  await page.click('[data-group="front"] [data-v="4"]');await page.click('[data-group="safeties"] [data-v="2"]');await page.click('[data-group="box"] [data-v="6"]');
  await page.click('[data-group="playType"] [data-v="Run"]');
  const runTypes=await page.locator('#attackDetail option').allTextContents();assert(['Inside Zone','Outside Zone','Counter','Power','Draw'].every(x=>runTypes.includes(x)),'Run Type vocabulary regressed');
  await page.fill('#yards','8');await page.click('#save');
  await page.waitForFunction(()=>document.querySelector('#headline').textContent.includes('2nd & 2'));
  assert.equal(await page.inputValue('#down'),'2');assert.equal(await page.inputValue('#distance'),'2');
  assert.equal(await page.inputValue('#formation'),'NA','formation must reset after every saved play');
  assert.equal(await page.inputValue('#personnel'),'11','personnel must persist after save');
  assert.equal(await page.inputValue('#motion'),'','motion must reset after save');

  const penaltyBtn=page.locator('[data-group="playType"] [data-v="Penalty"]');const beforeScroll=await page.evaluate(()=>window.scrollY);await penaltyBtn.click();await page.waitForSelector('#penaltyPanel:not(.hidden)');
  const afterScroll=await page.evaluate(()=>window.scrollY);assert.equal(afterScroll,beforeScroll,'clicking Penalty must not move the page');
  const penRect=await page.locator('#penaltyPanel').evaluate(el=>{const r=el.getBoundingClientRect();return{top:r.top,bottom:r.bottom,h:innerHeight,parent:el.parentElement&&el.parentElement.className}});
  assert(penRect.top>=0&&penRect.bottom<=penRect.h,'common Penalty controls must appear immediately inside the viewport');assert((penRect.parent||'').includes('stepcard'),'Penalty panel must remain owned by What happened');
  await page.click('#speedPenaltyPresets button[data-pen-quick="False Start"]');
  assert.equal(await page.inputValue('#penTeam'),'Offense');assert.equal(await page.inputValue('#penStatus'),'Accepted');assert.equal(await page.inputValue('#penDistance'),'5');assert.equal(await page.inputValue('#penTiming'),'DEAD');assert.equal(await page.inputValue('#penEffect'),'REPEAT');
  await page.waitForFunction(()=>document.querySelector('#penaltyPreview').textContent.includes('2nd & 7'));
  assert(!(await page.locator('#penaltyPreview').innerText()).includes('3rd & 7'),'False Start preview must never advance 2nd & 2 to 3rd & 7');
  await page.click('#save');await page.waitForFunction(()=>document.querySelector('#headline').textContent.includes('2nd & 7'));
  assert.equal(await page.inputValue('#down'),'2');assert.equal(await page.inputValue('#distance'),'7');

  await page.click('[data-group="playType"] [data-v="Pass"]');
  const completeBg=await page.locator('[data-pass="Complete"]').evaluate(el=>getComputedStyle(el).backgroundColor),incompleteBg=await page.locator('[data-pass="Incomplete"]').evaluate(el=>getComputedStyle(el).backgroundColor);
  assert.notEqual(completeBg,incompleteBg,'complete/incomplete must be semantically color-coded before click');assert(await page.locator('[data-pass="Incomplete"]').evaluate(el=>el.classList.contains('semanticBad')),'incomplete pre-colored red');
  await page.click('[data-group="playType"] [data-v="Run"]');await page.locator('#speedSpotCalc summary').click();await page.selectOption('#speedEndSide','OPP');await page.fill('#speedEndYard','30');await page.click('#speedUseSpot');
  assert.equal(await page.inputValue('#yards'),'50','optional spot calculator should fill yards only from Own 20 to Opp 30');assert.equal(await page.inputValue('#down'),'2','spot calculator must not alter situation');

  await page.click('.nav button[data-screen="iq"]');await page.waitForSelector('#iq.on #quickGameStats');
  assert(await page.locator('#quickStatsGrid [data-stat-key="third"]').isVisible(),'3rd-down quick stat visible');
  const passBg=await page.locator('#quickStatsGrid [data-stat-key="passing"]').evaluate(el=>getComputedStyle(el).backgroundColor),rushBg=await page.locator('#quickStatsGrid [data-stat-key="rushing"]').evaluate(el=>getComputedStyle(el).backgroundColor),penBg=await page.locator('#quickStatsGrid [data-stat-key="penalties"]').evaluate(el=>getComputedStyle(el).backgroundColor);
  assert.notEqual(passBg,rushBg,'Passing and Rushing must be visually distinct before click');assert.notEqual(penBg,passBg,'Penalty card must carry its own warning color before click');
  assert((await page.locator('#metrics').innerText()).includes('Run 12+')&&(await page.locator('#metrics').innerText()).includes('Pass 16+'),'More Analysis must honor 12+/16+ explosive thresholds');
  assert(await page.getByText('1st & 10',{exact:true}).count()>0,'Coach Shortcuts must keep a distinct 1st & 10');
  await page.click('#quickStatsGrid [data-stat-key="third"]');await page.waitForFunction(()=>document.querySelector('#quickStatDetail h3')&&document.querySelector('#quickStatDetail h3').textContent==='3rd Down');assert(await page.locator('#quickStatDetail').isVisible(),'quick stat drilldown opens');
  await page.waitForSelector('#iqFacetBody');const playTypeGroup=page.locator('#iqFacetBody .facetGroup').filter({hasText:'Play type'}).first();assert.equal(await playTypeGroup.count(),1,'Play type facet group exists');if(!(await playTypeGroup.evaluate(el=>el.open)))await playTypeGroup.locator('summary').click();const runFilter=playTypeGroup.locator('.facetOption').filter({hasText:'Run'}).first();await runFilter.waitFor({state:'visible'});await runFilter.click();await page.waitForFunction(()=>Array.from(document.querySelectorAll('#iqFilterChips .iqFilterChip span')).some(s=>s.textContent.includes('Play type: Run')));assert(await page.locator('#iqFilterChips').getByText('Play type: Run',{exact:false}).count()>0,'facet click must create active filter chip');

  await page.click('.nav button[data-screen="settings"]');await page.waitForSelector('#themeToggle');if(await page.locator('#themeToggle').isChecked())await page.locator('#themeToggle').click();await page.waitForFunction(()=>document.documentElement.getAttribute('data-theme')==='light');
  await page.click('.nav button[data-screen="live"]');await page.click('[data-group="playType"] [data-v="Penalty"]');await page.waitForSelector('#penaltyPanel:not(.hidden)');
  const lightPenalty=await page.locator('#penaltyPanel').evaluate(el=>({bg:getComputedStyle(el).backgroundColor,fg:getComputedStyle(el).color}));assert(lum(rgb(lightPenalty.bg))>.7,'Penalty overlay must use a light surface in light mode');assert(contrast(lightPenalty.fg,lightPenalty.bg)>=4.5,'Penalty overlay text must remain readable in light mode');
  await page.click('.nav button[data-screen="iq"]');const lightStat=await page.locator('#quickStatsGrid [data-stat-key="passing"]').evaluate(el=>({bg:getComputedStyle(el).backgroundColor,fg:getComputedStyle(el.querySelector('b')).color}));assert(contrast(lightStat.fg,lightStat.bg)>=3,'Quick Game Stats values must remain readable in light mode');

  assert.equal(errors.length,0,'Browser errors: '+errors.join(' | '));
  console.log('BOX E2E PASS: compact primary controls, formation reset/personnel carry, 2nd&2 false-start -> 2nd&7, no-scroll penalty, vocab, semantic colors, light mode, quick-stat drilldown, 1st&10, live filter click');
  await browser.close();
})().catch(async e=>{console.error(e);process.exit(1)});
