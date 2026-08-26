const {chromium}=require('playwright');
const assert=require('assert');
const fs=require('fs');fs.mkdirSync('qa-screenshots',{recursive:true});
const sizes=['standard','large','xl'];
const viewports=[
 {name:'booth-1080p',width:1920,height:1080},
 {name:'workstation',width:1600,height:900},
 {name:'common-laptop',width:1366,height:768}
];
function sizeClass(v){return v==='xl'?'fniqQ27SizeXl':v==='large'?'fniqQ27SizeLarge':'fniqQ27SizeStandard';}
async function measure(page){return page.evaluate(()=>{
 const pick=s=>document.querySelector(s),R=e=>{const r=e.getBoundingClientRect();return{left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height}};
 const pre=R(pick('#preSnapCard')),result=R(pick('.boxResultCard')),finish=R(pick('#trackerFinishCard'));
 const surface={left:Math.min(pre.left,result.left,finish.left),right:Math.max(pre.right,result.right,finish.right),top:Math.min(pre.top,result.top,finish.top),bottom:Math.max(pre.bottom,result.bottom,finish.bottom)};
 const rects=[pre,result,finish],step=8;let total=0,covered=0;
 for(let y=surface.top+step/2;y<surface.bottom;y+=step){for(let x=surface.left+step/2;x<surface.right;x+=step){total++;if(rects.some(r=>x>=r.left&&x<=r.right&&y>=r.top&&y<=r.bottom))covered++;}}
 const motion=[...document.querySelectorAll('#q27Pins-motion .q27PinnedBtn')].filter(e=>getComputedStyle(e).display!=='none').map(R);
 const motionRows=[...new Set(motion.map(r=>Math.round(r.top/4)*4))];
 const run=[...document.querySelectorAll('#q27Pins-runType .q27PinnedBtn')].filter(e=>getComputedStyle(e).display!=='none').map(R);
 const runRows=[...new Set(run.map(r=>Math.round(r.top/4)*4))];
 const clippedRun=[...document.querySelectorAll('#q27Pins-runType .q27PinnedBtn')].filter(e=>getComputedStyle(e).display!=='none'&&(e.scrollWidth>e.clientWidth+1||e.scrollHeight>e.clientHeight+1)).map(e=>e.textContent.trim());
 const spot=document.querySelector('#speedSpotCalc>summary');
 const more=document.querySelector('#trackerFinishCard details.drawer>summary,#trackerFinishCard .trackerMoreResult>summary');
 const font=e=>e?parseFloat(getComputedStyle(e).fontSize)||0:0;
 const doc=document.documentElement;
 return{pre,result,finish,surface,deadRatio:total?(total-covered)/total:1,motionRows:motionRows.length,motionCount:motion.length,runRows:runRows.length,runCount:run.length,clippedRun,spotFont:font(spot),moreFont:font(more),scrollWidth:doc.scrollWidth,innerWidth:innerWidth,scrollHeight:doc.scrollHeight,innerHeight:innerHeight,scrollY:scrollY};
});}
function minDisclosureFont(size,height){if(height<=820)return size==='xl'?13.5:size==='large'?12:11;return size==='xl'?15:size==='large'?13.5:12;}
(async()=>{
 const browser=await chromium.launch({headless:true});
 for(const vp of viewports){
  for(const size of sizes){
   const context=await browser.newContext({viewport:{width:vp.width,height:vp.height}}),page=await context.newPage(),errors=[];
   page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
   await page.addInitScript((mode)=>{
    localStorage.clear();
    localStorage.setItem('fniq_q27_control_size_v1',mode);
    localStorage.setItem('fniq_q27_pins_v1',JSON.stringify({
     formation:['Trips Right','Dallas Right'],
     motion:['H-Jet','T-Laser','Z-L1','Other'],
     coverage:['Cover 1','Cover 2','Cover 3'],
     runType:['Inside Zone','Outside Zone','Counter','Power','Draw']
    }));
   },size);
   await page.goto('http://127.0.0.1:8000/?q28density='+vp.name+'-'+size,{waitUntil:'networkidle'});
   await page.fill('#team','Density QA');await page.fill('#opp',vp.name+' '+size);await page.click('#start');await page.waitForSelector('#live.on');
   await page.waitForSelector('#quality27DensityCss',{state:'attached'});await page.waitForTimeout(150);
   assert(await page.locator('html').evaluate((el,cls)=>el.classList.contains(cls),sizeClass(size)),size+' control-size class missing');
   const geom=await measure(page);
   console.log('Q28 DENSITY INITIAL '+vp.name+' '+size+' '+JSON.stringify(geom));
   assert(geom.deadRatio<=0.10,vp.name+' '+size+' structural dead space '+(geom.deadRatio*100).toFixed(1)+'% exceeds 10%: '+JSON.stringify(geom));
   assert(geom.motionRows<=2,vp.name+' '+size+' motion pins use '+geom.motionRows+' rows instead of <=2');
   assert(geom.scrollWidth<=geom.innerWidth+3,vp.name+' '+size+' horizontal overflow '+geom.scrollWidth+'/'+geom.innerWidth);
   const minFont=minDisclosureFont(size,vp.height);
   assert(geom.spotFont>=minFont,vp.name+' '+size+' yard-help summary too small: '+geom.spotFont+'px < '+minFont+'px');
   assert(geom.moreFont>=minFont,vp.name+' '+size+' more-result summary too small: '+geom.moreFont+'px < '+minFont+'px');
   await page.screenshot({path:'qa-screenshots/q28-density-'+vp.name+'-'+size+'.png',fullPage:true});

   await page.click('[data-group="playType"] [data-v="Run"]');
   await page.waitForSelector('#q27Pins-runType button[data-value="Inside Zone"]',{state:'visible'});await page.waitForTimeout(100);
   const runGeom=await measure(page);
   console.log('Q28 DENSITY RUN '+vp.name+' '+size+' '+JSON.stringify(runGeom));
   await page.screenshot({path:'qa-screenshots/q28-density-'+vp.name+'-'+size+'-run.png',fullPage:true});
   assert(runGeom.deadRatio<=0.10,vp.name+' '+size+' Run-state structural dead space '+(runGeom.deadRatio*100).toFixed(1)+'% exceeds 10%');
   assert(runGeom.runRows<=2,vp.name+' '+size+' Run Type pins use '+runGeom.runRows+' rows after Run');
   assert.deepEqual(runGeom.clippedRun,[],vp.name+' '+size+' clipped Run Type labels: '+JSON.stringify(runGeom.clippedRun));
   assert(runGeom.scrollWidth<=runGeom.innerWidth+3,vp.name+' '+size+' Run reveal horizontal overflow '+runGeom.scrollWidth+'/'+runGeom.innerWidth);
   if(vp.height<=900)assert(runGeom.scrollHeight<=runGeom.innerHeight+2,vp.name+' '+size+' Run reveal adds page scroll '+runGeom.scrollHeight+'/'+runGeom.innerHeight);
   assert.equal(errors.length,0,vp.name+' '+size+' browser errors: '+errors.join(' | '));
   console.log('Q28 DENSITY PASS '+vp.name+' '+size+' initial='+(geom.deadRatio*100).toFixed(1)+'% run='+(runGeom.deadRatio*100).toFixed(1)+'% spotFont='+geom.spotFont+' moreFont='+geom.moreFont);
   await context.close();
  }
 }
 await browser.close();
 console.log('QUALITY28 DENSITY PASS: Standard/Large/Extra Large stay <=10% structural dead space across 1080p, workstation, and common-laptop views; disclosure controls scale with selected size; Run stays readable and overflow-safe.');
})().catch(e=>{console.error(e);process.exit(1)});
