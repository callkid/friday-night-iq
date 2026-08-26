const {chromium}=require('playwright');
const assert=require('assert');
const CASES=[
  {name:'coach-short',width:1475,height:668,maxScroll:2,short:true},
  {name:'common-laptop',width:1366,height:768,maxScroll:2},
  {name:'screenshot-workstation',width:1660,height:900,maxScroll:2,wide:true},
  {name:'coach-1080p',width:1920,height:1080,maxScroll:2,wide:true}
];
function rectInViewport(r,h){return r.top>=-1&&r.bottom<=h+2}
async function visibleRect(page,selector,label){const loc=page.locator(selector).first();assert(await loc.isVisible(),label+' not visible: '+selector);const r=await loc.evaluate(el=>{const x=el.getBoundingClientRect();return{left:x.left,right:x.right,top:x.top,bottom:x.bottom,width:x.width,height:x.height}});assert(rectInViewport(r,await page.evaluate(()=>innerHeight)),label+' requires scroll: '+selector+' bottom='+Math.round(r.bottom));return r}
async function clickVisible(page,selector,label){await visibleRect(page,selector,label);await page.click(selector);assert(Math.abs(await page.evaluate(()=>scrollY))<=2,label+' caused page scroll')}
async function boot(browser,c){const context=await browser.newContext({viewport:{width:c.width,height:c.height}});const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});await page.addInitScript(()=>localStorage.clear());await page.goto('http://127.0.0.1:8000/?trackerqa='+c.name,{waitUntil:'networkidle'});await page.fill('#team','Tracker QA');await page.fill('#opp','Box Test');await page.click('#start');await page.waitForSelector('#live.on');await page.waitForSelector('#trackerFinishCard');assert.equal(errors.length,0,c.name+' startup errors: '+errors.join(' | '));return{page,context,errors}}
(async()=>{
 const browser=await chromium.launch({headless:true});
 for(const c of CASES){
  const {page,context,errors}=await boot(browser,c);
  const m=await page.evaluate(()=>{function r(s){const e=document.querySelector(s),x=e&&e.getBoundingClientRect();return x?{left:x.left,right:x.right,top:x.top,bottom:x.bottom,width:x.width,height:x.height}:null}const sit=document.querySelector('#situationCard'),main=document.querySelector('#live main');const children=[].slice.call(main.children).filter(e=>getComputedStyle(e).display!=='none').map(e=>{const x=e.getBoundingClientRect();return{id:e.id||'',cls:e.className||'',top:Math.round(x.top),bottom:Math.round(x.bottom),height:Math.round(x.height)}});return{innerH:innerHeight,scrollH:document.documentElement.scrollHeight,bodyH:document.body.scrollHeight,snap:r('#live .snapbar'),live:r('#live .live'),main:r('#live main'),aside:r('#live aside.sticky'),pre:r('#preSnapCard'),result:r('.boxResultCard'),finish:r('#trackerFinishCard'),safety:r('.safetyrow'),situation:r('#situationCard'),situationDisplay:sit?getComputedStyle(sit).display:'none',children};});
  console.log('TRACKER GEOMETRY',c.name,JSON.stringify(m));
  assert(m.pre&&m.result&&m.finish,c.name+' missing packed tracker geometry');
  assert(Math.abs(m.pre.top-m.result.top)<=8,c.name+' pre-snap/result tops drifted by '+Math.round(Math.abs(m.pre.top-m.result.top))+'px');
  const primaryBottom=Math.max(m.pre.bottom,m.result.bottom),deadGap=m.finish.top-primaryBottom;
  assert(deadGap<=18,c.name+' DEAD SPACE FAIL: '+Math.round(deadGap)+'px empty below primary charting before post-snap detail');
  assert(deadGap>=-3,c.name+' post-snap detail overlaps primary charting by '+Math.round(-deadGap)+'px');
  assert(Math.abs(m.finish.left-m.pre.left)<=4,c.name+' post-snap card no longer starts with the left charting edge');
  assert(Math.abs(m.finish.right-m.result.right)<=4,c.name+' DEAD LOWER-RIGHT FAIL: post-snap detail does not reach the right charting edge');
  assert(m.finish.width>=m.main.width-8,c.name+' DEAD LOWER-RIGHT FAIL: post-snap detail uses only '+Math.round(m.finish.width)+'px of '+Math.round(m.main.width)+'px main width');
  if(m.safety){const safetyGap=m.safety.top-m.finish.bottom;assert(safetyGap<=20,c.name+' DEAD SPACE FAIL: '+Math.round(safetyGap)+'px before Undo row');}
  if(c.wide&&m.situationDisplay!=='none')assert(m.situation.width>=m.main.width-12,c.name+' Situation should use the full main width instead of leaving a blank right cell');
  if(m.aside&&m.aside.width>0)assert(m.aside.bottom<=m.innerH-2,c.name+' IQ sidebar extends below the viewport instead of scrolling internally: '+Math.round(m.aside.bottom)+'px > '+m.innerH+'px');
  assert(m.scrollH<=m.innerH+c.maxScroll,c.name+' SCROLL FAIL: page '+m.scrollH+'px vs viewport '+m.innerH+'px');

  for(const [s,label] of [['#speedHashButtons','hash'],['#formation','formation'],['#personnel','personnel'],['[data-group="front"]','front'],['[data-group="safeties"]','safeties'],['#q27Pins-coverage','pinned initial coverage'],['#coverage','full initial coverage'],['[data-group="box"]','box'],['#q27Pins-motion','pinned motion'],['#motion','full motion'],['[data-group="playType"]','play type'],['#yards','yards'],['#speedBlitzQuick','blitz'],['#speedCoverageQuick','post-snap coverage'],['#save','save']])await visibleRect(page,s,c.name+' '+label);
  assert(!(await page.locator('.q26RedundantConcept').isVisible()),c.name+' duplicate Concept Family should not be live-charting UI');
  assert(!(await page.locator('.trackerResultTags').isVisible()),c.name+' duplicate Result Tags should not be live-charting UI');

  await clickVisible(page,'#speedHashButtons button[data-value="Left"]',c.name+' hash');
  await page.selectOption('#formation','Doubles Right');assert(Math.abs(await page.evaluate(()=>scrollY))<=2,c.name+' formation caused scroll');
  await page.fill('#personnel','11');
  await clickVisible(page,'[data-group="front"] [data-v="4"]',c.name+' front');
  await clickVisible(page,'[data-group="safeties"] [data-v="2"]',c.name+' safeties');
  await clickVisible(page,'#q27Pins-coverage button[data-value="Cover 3"]',c.name+' initial coverage');
  await clickVisible(page,'[data-group="box"] [data-v="6"]',c.name+' box');
  await clickVisible(page,'#q27Pins-motion button[data-value="No Motion"]',c.name+' no motion');
  await clickVisible(page,'[data-group="playType"] [data-v="Run"]',c.name+' run');
  await page.waitForSelector('#q27Pins-runType button[data-value="Inside Zone"]',{state:'visible'});
  await clickVisible(page,'#q27Pins-runType button[data-value="Inside Zone"]',c.name+' run type');
  assert(await page.locator('#attackDetail').isVisible(),c.name+' full Run Type dropdown must remain available');
  assert(await page.locator('#q26Outcome').isVisible(),c.name+' contextual result controls are missing after Run');
  await page.fill('#yards','6');assert(Math.abs(await page.evaluate(()=>scrollY))<=2,c.name+' yards caused scroll');
  await clickVisible(page,'#speedBlitzQuick button[data-value="None"]',c.name+' no blitz');
  await clickVisible(page,'#speedCoverageQuick button[data-value="Same as pre-snap"]',c.name+' post coverage');
  await clickVisible(page,'#save',c.name+' save');
  await page.waitForFunction(()=>document.querySelector('#headline').textContent.includes('2nd'));
  assert.equal(await page.inputValue('#formation'),'NA',c.name+' formation must reset after Save');
  assert.equal(await page.inputValue('#personnel'),'11',c.name+' personnel must carry after Save');
  assert.notEqual(await page.inputValue('#motion'),'No Motion',c.name+' motion must reset after Save');
  assert(Math.abs(await page.evaluate(()=>scrollY))<=2,c.name+' Save left tracker scrolled away from next snap');

  if(c.short){
    await clickVisible(page,'[data-group="playType"] [data-v="Penalty"]',c.name+' penalty');
    await page.waitForSelector('#penaltyPanel:not(.hidden)');
    const pen=await page.locator('#penaltyPanel').evaluate(el=>{const r=el.getBoundingClientRect();return{top:r.top,bottom:r.bottom,h:innerHeight}});assert(pen.top>=0&&pen.bottom<=pen.h,c.name+' penalty controls leave viewport');
    await page.waitForFunction(()=>document.querySelector('#save').parentElement&&document.querySelector('#save').parentElement.id==='trackerPenaltySaveDock');
    await visibleRect(page,'#save',c.name+' penalty Save');
    await clickVisible(page,'#speedPenaltyPresets button[data-pen-quick="False Start"]',c.name+' false start');
    await page.waitForFunction(()=>document.querySelector('#penaltyPreview').textContent.includes('2nd & 9'));
    await clickVisible(page,'#save',c.name+' save false start');
    await page.waitForFunction(()=>document.querySelector('#headline').textContent.includes('2nd & 9'));
    await page.waitForFunction(()=>document.querySelector('#save').parentElement&&document.querySelector('#save').parentElement.id!=='trackerPenaltySaveDock');
    assert(Math.abs(await page.evaluate(()=>scrollY))<=2,c.name+' penalty workflow moved page');
  }

  assert.equal(errors.length,0,c.name+' browser errors: '+errors.join(' | '));
  console.log('TRACKER WORKFLOW PASS:',c.name,c.width+'x'+c.height,'deadGap='+Math.round(deadGap)+' finishWidth='+Math.round(m.finish.width)+'/'+Math.round(m.main.width)+' scroll='+m.scrollH+'x'+m.innerH);
  await context.close();
 }
 await browser.close();
 console.log('TRACKER QA PASS: dead lower-right space is a failure, post-snap detail spans both columns, coach-pinned shortcuts retain their full dropdown sources, normal run path stays in one viewport, desktop page scroll is zero, penalty Save stays reachable, and duplicate live tracking is removed');
})().catch(e=>{console.error(e);process.exit(1)});
