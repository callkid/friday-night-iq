const {chromium}=require('playwright');
const assert=require('assert');
const CASES=[
  {name:'coach-short-laptop',width:1475,height:668,short:true},
  {name:'common-laptop',width:1366,height:768},
  {name:'large-monitor',width:1920,height:1080,monitor:true},
  {name:'large-monitor-2k',width:2560,height:1440,monitor2k:true},
  {name:'narrow-laptop-tablet',width:1024,height:768,narrow:true}
];
function intersects(a,b){return !(a.right<=b.left||a.left>=b.right||a.bottom<=b.top||a.top>=b.bottom)}
async function boot(browser,c){
  const context=await browser.newContext({viewport:{width:c.width,height:c.height}});
  const page=await context.newPage();
  const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
  await page.addInitScript(()=>localStorage.clear());
  await page.goto('http://127.0.0.1:8000/?responsiveqa='+encodeURIComponent(c.name),{waitUntil:'networkidle'});
  await page.fill('#team','Responsive QA');await page.fill('#opp','Test');await page.click('#start');await page.waitForSelector('#live.on');
  await page.click('[data-group="playType"] [data-v="Run"]');await page.fill('#yards','3');await page.click('#save');
  await page.waitForFunction(()=>document.querySelector('#headline').textContent.includes('2nd'));
  await page.waitForTimeout(120);
  assert.equal(errors.length,0,c.name+' browser errors: '+errors.join(' | '));
  return {page,context};
}
(async()=>{
  const browser=await chromium.launch({headless:true});
  for(const c of CASES){
    const {page,context}=await boot(browser,c);
    const metrics=await page.evaluate(()=>({
      innerW:innerWidth,innerH:innerHeight,scrollW:document.documentElement.scrollWidth,scrollH:document.documentElement.scrollHeight,
      app:document.querySelector('.app').getBoundingClientRect(),
      live:document.querySelector('#live .live').getBoundingClientRect(),
      main:document.querySelector('#live main').getBoundingClientRect(),
      aside:document.querySelector('#live aside.sticky').getBoundingClientRect(),
      asideDisplay:getComputedStyle(document.querySelector('#live aside.sticky')).display,
      asideOverflow:getComputedStyle(document.querySelector('#live aside.sticky')).overflowY,
      situation:document.querySelector('#situationCard').getBoundingClientRect(),
      pre:document.querySelector('#preSnapCard').getBoundingClientRect(),
      result:document.querySelector('.boxResultCard').getBoundingClientRect(),
      summary:document.querySelector('.entrysummary').getBoundingClientRect(),
      summaryPosition:getComputedStyle(document.querySelector('.entrysummary')).position,
      mainDisplay:getComputedStyle(document.querySelector('#live main')).display
    }));
    assert(metrics.scrollW<=metrics.innerW+2,c.name+' has horizontal page overflow: '+metrics.scrollW+' > '+metrics.innerW);
    if(c.width>=1181){
      const nextTop=Math.min(metrics.pre.top,metrics.result.top),gap=nextTop-metrics.situation.bottom;
      assert(gap<=20,c.name+' has dead vertical gap after situation: '+Math.round(gap)+'px');
      assert(Math.abs(metrics.pre.top-metrics.result.top)<=8,c.name+' charting cards are vertically misaligned');
    }
    if(c.short){
      assert.equal(metrics.summaryPosition,'static','short laptop Save row must not float over controls');
      assert(metrics.aside.bottom<=metrics.innerH+2,'short laptop sidebar exceeds viewport instead of scrolling independently');
      assert(['auto','scroll'].includes(metrics.asideOverflow),'short laptop sidebar must scroll independently');
      const selectors=['#speedHashButtons','#formation','#personnel','[data-group="front"]','[data-group="safeties"]','#coverage','[data-group="box"]','#motion','[data-group="playType"]','#yards','#speedBlitzQuick','#save'];
      const rects=[];
      for(const s of selectors){const loc=page.locator(s).first();assert(await loc.isVisible(),c.name+' missing primary control '+s);const r=await loc.evaluate(el=>{const x=el.getBoundingClientRect();return{left:x.left,right:x.right,top:x.top,bottom:x.bottom}});rects.push([s,r]);assert(r.top>=-1&&r.bottom<=c.height+2,c.name+' primary control off-screen without scrolling: '+s+' bottom='+Math.round(r.bottom));}
      const sr={left:metrics.summary.left,right:metrics.summary.right,top:metrics.summary.top,bottom:metrics.summary.bottom};
      for(const [s,r] of rects.filter(x=>x[0]!=='#save'))assert(!intersects(sr,r),c.name+' Save row overlaps '+s);
      assert(metrics.scrollH<=metrics.innerH+90,c.name+' still requires excessive main-page scrolling: '+metrics.scrollH+' vs '+metrics.innerH);
    }
    if(c.monitor){assert(metrics.app.width>=1600,'1920 monitor should use extra width; app width was '+Math.round(metrics.app.width));assert(metrics.asideDisplay!=='none','monitor should retain live IQ sidebar')}
    if(c.monitor2k){assert(metrics.app.width>=2000,'2K monitor should expand app canvas; app width was '+Math.round(metrics.app.width));}
    if(c.narrow){assert.equal(metrics.asideDisplay,'none','narrow layout should remove sidebar from charting surface');assert.equal(metrics.mainDisplay,'block','narrow layout should stack charting cards');}
    console.log('RESPONSIVE PASS:',c.name,c.width+'x'+c.height,'scroll='+metrics.scrollW+'x'+metrics.scrollH);
    await context.close();
  }
  await browser.close();
  console.log('RESPONSIVE MATRIX PASS: short laptop, common laptop, 1080p monitor, 2K monitor, narrow layout');
})().catch(e=>{console.error(e);process.exit(1)});
