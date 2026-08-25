const {chromium}=require('playwright');
const assert=require('assert');
const CASES=[
  {name:'coach-short-laptop',width:1475,height:668,short:true},
  {name:'common-laptop',width:1366,height:768},
  {name:'large-monitor',width:1920,height:1080,monitor:true},
  {name:'large-monitor-2k',width:2560,height:1440,monitor2k:true},
  {name:'narrow-laptop-tablet',width:1024,height:768,narrow:true},
  {name:'tablet-portrait',width:768,height:1024,narrow:true,touch:true},
  {name:'mobile-portrait',width:390,height:844,narrow:true,touch:true,mobile:true},
  {name:'mobile-landscape',width:844,height:390,narrow:true,touch:true,mobile:true}
];
function intersects(a,b){return !(a.right<=b.left||a.left>=b.right||a.bottom<=b.top||a.top>=b.bottom)}
async function boot(browser,c){
  const context=await browser.newContext({viewport:{width:c.width,height:c.height},hasTouch:!!c.touch});
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
    const metrics=await page.evaluate(()=>{
      function rect(sel){const el=document.querySelector(sel);return el?el.getBoundingClientRect():null}
      function shown(sel){const el=document.querySelector(sel);return el&&getComputedStyle(el).display!=='none'}
      return{
      innerW:innerWidth,innerH:innerHeight,scrollW:document.documentElement.scrollWidth,scrollH:document.documentElement.scrollHeight,
      app:rect('.app'),snap:rect('#live .snapbar'),live:rect('#live .live'),main:rect('#live main'),
      fastbar:rect('#live .fastbar'),fastbarDisplay:shown('#live .fastbar')?'shown':'none',
      driveGate:rect('#driveGate'),driveGateDisplay:shown('#driveGate')&&!document.querySelector('#driveGate').classList.contains('hidden')?'shown':'none',
      aside:rect('#live aside.sticky'),asideDisplay:getComputedStyle(document.querySelector('#live aside.sticky')).display,
      situation:rect('#situationCard'),situationDisplay:getComputedStyle(document.querySelector('#situationCard')).display,
      pre:rect('#preSnapCard'),result:rect('.boxResultCard'),summary:rect('.entrysummary'),
      summaryPosition:getComputedStyle(document.querySelector('.entrysummary')).position,
      savePosition:getComputedStyle(document.querySelector('#save')).position,
      mainDisplay:getComputedStyle(document.querySelector('#live main')).display
    }});
    assert(metrics.scrollW<=metrics.innerW+2,c.name+' has horizontal page overflow: '+metrics.scrollW+' > '+metrics.innerW);
    if(c.width>=1181){
      const nextTop=Math.min(metrics.pre.top,metrics.result.top);
      const anchors=[metrics.snap.bottom];
      if(metrics.fastbarDisplay==='shown'&&metrics.fastbar)anchors.push(metrics.fastbar.bottom);
      if(metrics.driveGateDisplay==='shown'&&metrics.driveGate)anchors.push(metrics.driveGate.bottom);
      if(metrics.situationDisplay!=='none'&&metrics.situation)anchors.push(metrics.situation.bottom);
      const anchor=Math.max.apply(Math,anchors),gap=nextTop-anchor;
      assert(gap<=20,c.name+' has dead vertical gap after the last real control before charting cards: '+Math.round(gap)+'px');
      assert(Math.abs(metrics.pre.top-metrics.result.top)<=8,c.name+' charting cards are vertically misaligned');
    }
    if(c.short){
      assert.equal(metrics.summaryPosition,'static','short laptop Save row must not float over controls');
      assert.equal(metrics.asideDisplay,'none','short laptop should devote the surface to charting; Game IQ stays available in its tab');
      assert(await page.locator('#shortSituationEdit').isVisible(),'short laptop needs an Edit Situation control in the snap bar');
      assert.equal(metrics.situationDisplay,'none','collapsed duplicate Situation card should disappear on the short laptop');
      const selectors=['#speedHashButtons','#formation','#personnel','[data-group="front"]','[data-group="safeties"]','#coverage','[data-group="box"]','#motion','[data-group="playType"]','#yards','#speedBlitzQuick','#save','#q24Hurry','#q24Capture'];
      const rects=[];
      for(const s of selectors){const loc=page.locator(s).first();assert(await loc.isVisible(),c.name+' missing primary control '+s);const r=await loc.evaluate(el=>{const x=el.getBoundingClientRect();return{left:x.left,right:x.right,top:x.top,bottom:x.bottom}});rects.push([s,r]);assert(r.top>=-1&&r.bottom<=c.height+2,c.name+' primary control off-screen without scrolling: '+s+' bottom='+Math.round(r.bottom));}
      const sr={left:metrics.summary.left,right:metrics.summary.right,top:metrics.summary.top,bottom:metrics.summary.bottom};
      for(const [s,r] of rects.filter(x=>x[0]!=='#save'))assert(!intersects(sr,r),c.name+' Save row overlaps '+s);
      assert(metrics.scrollH<=metrics.innerH+90,c.name+' still requires excessive main-page scrolling: '+metrics.scrollH+' vs '+metrics.innerH);
    }
    if(c.monitor){assert(metrics.app.width>=1600,'1920 monitor should use extra width; app width was '+Math.round(metrics.app.width));assert(metrics.asideDisplay!=='none','monitor should retain live IQ sidebar')}
    if(c.monitor2k){assert(metrics.app.width>=2000,'2K monitor should expand app canvas; app width was '+Math.round(metrics.app.width));}
    if(c.narrow){assert.equal(metrics.asideDisplay,'none','narrow layout should remove sidebar from charting surface');assert.equal(metrics.mainDisplay,'block','narrow layout should stack charting cards');assert.notEqual(metrics.savePosition,'fixed','narrow/mobile Save must never become a fixed overlay');}
    if(c.mobile){
      for(const s of ['#speedHashButtons','#formation','#personnel','#q24CoverageQuick','[data-group="box"]','#motion','[data-group="playType"]','#yards','#save']){
        const loc=page.locator(s).first();assert(await loc.count(),c.name+' missing mobile control '+s);const r=await loc.evaluate(el=>{const x=el.getBoundingClientRect();return{left:x.left,right:x.right}});assert(r.left>=-2&&r.right<=c.width+2,c.name+' control exceeds mobile width: '+s+' '+Math.round(r.left)+'..'+Math.round(r.right));
      }
    }
    console.log('RESPONSIVE PASS:',c.name,c.width+'x'+c.height,'scroll='+metrics.scrollW+'x'+metrics.scrollH);
    await context.close();
  }
  await browser.close();
  console.log('RESPONSIVE MATRIX PASS: short laptop, common laptop, 1080p, 2K, narrow, tablet, mobile portrait and landscape');
})().catch(e=>{console.error(e);process.exit(1)});
