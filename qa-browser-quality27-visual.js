const {chromium}=require('playwright');
const assert=require('assert');
const fs=require('fs');fs.mkdirSync('qa-screenshots',{recursive:true});
const cases=[
 {name:'short-laptop',width:1475,height:668,desktop:true},
 {name:'common-laptop',width:1366,height:768,desktop:true},
 {name:'large-monitor',width:1920,height:1080,desktop:true},
 {name:'tablet',width:1024,height:768,desktop:false},
 {name:'mobile',width:390,height:844,desktop:false}
];
async function assertNoClips(page,label){
 const bad=await page.locator('#live button:visible').evaluateAll(btns=>btns.filter(el=>{const s=getComputedStyle(el);if(s.whiteSpace==='normal')return false;return el.scrollWidth>el.clientWidth+2||el.scrollHeight>el.clientHeight+2;}).map(el=>({text:el.textContent.trim(),id:el.id,cls:el.className,sw:el.scrollWidth,cw:el.clientWidth,sh:el.scrollHeight,ch:el.clientHeight})).slice(0,12));
 assert.equal(bad.length,0,label+' has clipped live buttons: '+JSON.stringify(bad));
}
(async()=>{
 const browser=await chromium.launch({headless:true});
 for(const c of cases){
  const context=await browser.newContext({viewport:{width:c.width,height:c.height}}),page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
  await page.addInitScript(()=>{localStorage.clear();localStorage.setItem('fniq_q27_pins_v1',JSON.stringify({formation:[],motion:[],coverage:['Cover 1','Cover 2','Cover 3'],runType:['Inside Zone','Outside Zone','Counter','Power']}));localStorage.setItem('fniq_q27_control_size_v1','standard');});
  await page.goto('http://127.0.0.1:8000/?q27visual='+c.name,{waitUntil:'networkidle'});await page.fill('#team','Visual QA');await page.fill('#opp',c.name);await page.click('#start');await page.waitForSelector('#live.on');
  assert(await page.locator('#q27Pins-coverage button').count()>=3,c.name+' coverage pins missing');assert(await page.locator('#q27Pins-motion button[data-value="No Motion"]').isVisible(),c.name+' No Motion quick missing');
  await page.screenshot({path:'qa-screenshots/q27-'+c.name+'-tracker.png',fullPage:true});
  await page.click('[data-group="playType"] .choice[data-v="Run"]');await page.waitForSelector('#q27Pins-runType:not(.hidden)');
  assert(await page.locator('#q27Pins-runType button').count()>=3,c.name+' run pins missing');await assertNoClips(page,c.name+' run state');
  await page.fill('#yards','5');await page.dispatchEvent('#yards','input');await page.click('#save');await page.waitForSelector('#q27SavedBar:not(.hidden)');assert(await page.locator('#q27FixLast').isVisible(),c.name+' Fix Last Play missing');assert(await page.locator('#q27UndoLast').isVisible(),c.name+' Undo Last missing');
  const geom=await page.evaluate(()=>({iw:innerWidth,sw:document.documentElement.scrollWidth,bar:document.querySelector('#q27SavedBar').getBoundingClientRect().toJSON()}));assert(geom.sw<=geom.iw+3,c.name+' horizontal overflow '+geom.sw+'/'+geom.iw);assert(geom.bar.left>=-2&&geom.bar.right<=geom.iw+2,c.name+' save confirmation escapes viewport');
  if(c.desktop){const sy=Math.abs(await page.evaluate(()=>scrollY));assert(sy<=2,c.name+' desktop scroll drift after Save: '+sy);}
  await assertNoClips(page,c.name+' saved state');await page.screenshot({path:'qa-screenshots/q27-'+c.name+'-saved.png',fullPage:true});assert.equal(errors.length,0,c.name+' browser errors: '+errors.join(' | '));
  console.log('Q27 VISUAL PASS '+c.name+' '+c.width+'x'+c.height+' scrollWidth='+geom.sw);await context.close();
 }
 await browser.close();console.log('QUALITY27 VISUAL MATRIX PASS: short laptop, common laptop, large monitor, tablet, and mobile retain readable pinned controls and correction access');
})().catch(e=>{console.error(e);process.exit(1)});
