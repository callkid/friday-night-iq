const {chromium}=require('playwright');
const assert=require('assert');
const fs=require('fs');fs.mkdirSync('qa-screenshots',{recursive:true});
const sizes=['standard','large','xl'];
function sizeClass(v){return v==='xl'?'fniqQ27SizeXl':v==='large'?'fniqQ27SizeLarge':'fniqQ27SizeStandard';}
async function measure(page){return page.evaluate(()=>{
 const pick=s=>document.querySelector(s),R=e=>{const r=e.getBoundingClientRect();return{left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height}};
 const pre=R(pick('#preSnapCard')),result=R(pick('.boxResultCard')),finish=R(pick('#trackerFinishCard'));
 const surface={left:Math.min(pre.left,result.left),right:Math.max(pre.right,result.right),top:Math.min(pre.top,result.top),bottom:Math.max(pre.bottom,result.bottom,finish.bottom)};
 const rects=[pre,result,finish],step=8;let total=0,covered=0;
 for(let y=surface.top+step/2;y<surface.bottom;y+=step){for(let x=surface.left+step/2;x<surface.right;x+=step){total++;if(rects.some(r=>x>=r.left&&x<=r.right&&y>=r.top&&y<=r.bottom))covered++;}}
 const motion=[...document.querySelectorAll('#q27Pins-motion .q27PinnedBtn')].filter(e=>getComputedStyle(e).display!=='none').map(R);
 const motionRows=[...new Set(motion.map(r=>Math.round(r.top/4)*4))];
 const run=[...document.querySelectorAll('#q27Pins-runType .q27PinnedBtn')].filter(e=>getComputedStyle(e).display!=='none').map(R);
 const runRows=[...new Set(run.map(r=>Math.round(r.top/4)*4))];
 const clippedRun=[...document.querySelectorAll('#q27Pins-runType .q27PinnedBtn')].filter(e=>getComputedStyle(e).display!=='none'&&(e.scrollWidth>e.clientWidth+1||e.scrollHeight>e.clientHeight+1)).map(e=>e.textContent.trim());
 const doc=document.documentElement;
 return{pre,result,finish,surface,deadRatio:total?(total-covered)/total:1,motionRows:motionRows.length,motionCount:motion.length,runRows:runRows.length,runCount:run.length,clippedRun,scrollWidth:doc.scrollWidth,innerWidth:innerWidth,scrollHeight:doc.scrollHeight,innerHeight:innerHeight,scrollY:scrollY};
});}
(async()=>{
 const browser=await chromium.launch({headless:true});
 for(const size of sizes){
  const context=await browser.newContext({viewport:{width:1600,height:900}}),page=await context.newPage(),errors=[];
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
  await page.goto('http://127.0.0.1:8000/?q27density='+size,{waitUntil:'networkidle'});
  await page.fill('#team','Density QA');await page.fill('#opp',size);await page.click('#start');await page.waitForSelector('#live.on');
  await page.waitForSelector('#quality27DensityCss',{state:'attached'});await page.waitForTimeout(120);
  assert(await page.locator('html').evaluate((el,cls)=>el.classList.contains(cls),sizeClass(size)),size+' control-size class missing');
  const geom=await measure(page);
  console.log('Q27 DENSITY INITIAL '+size+' '+JSON.stringify(geom));
  assert(geom.finish.left>=geom.result.left-3,size+' Post-snap did not pack into the result column: '+JSON.stringify(geom));
  assert(geom.finish.top>=geom.result.bottom-4,size+' Post-snap overlaps What happened: '+JSON.stringify(geom));
  assert(geom.finish.top<=geom.pre.bottom+12,size+' still leaves a large right-column hole: '+JSON.stringify(geom));
  assert(geom.deadRatio<=0.15,size+' structural dead space '+(geom.deadRatio*100).toFixed(1)+'% exceeds 15%: '+JSON.stringify(geom));
  assert(geom.motionRows<=2,size+' motion pins use '+geom.motionRows+' rows instead of <=2');
  assert(geom.scrollWidth<=geom.innerWidth+3,size+' horizontal overflow '+geom.scrollWidth+'/'+geom.innerWidth);
  await page.screenshot({path:'qa-screenshots/q27-density-'+size+'-1600x900.png',fullPage:true});

  await page.click('[data-group="playType"] [data-v="Run"]');
  await page.waitForSelector('#q27Pins-runType button[data-value="Inside Zone"]',{state:'visible'});await page.waitForTimeout(80);
  const runGeom=await measure(page);
  console.log('Q27 DENSITY RUN '+size+' '+JSON.stringify(runGeom));
  await page.screenshot({path:'qa-screenshots/q27-density-'+size+'-run-1600x900.png',fullPage:true});
  assert(runGeom.runRows<=2,size+' Run Type pins use '+runGeom.runRows+' rows after Run');
  assert.deepEqual(runGeom.clippedRun,[],size+' clipped Run Type labels: '+JSON.stringify(runGeom.clippedRun));
  assert(runGeom.scrollWidth<=runGeom.innerWidth+3,size+' Run reveal horizontal overflow '+runGeom.scrollWidth+'/'+runGeom.innerWidth);
  assert(runGeom.scrollHeight<=runGeom.innerHeight+2,size+' Run reveal adds page scroll '+runGeom.scrollHeight+'/'+runGeom.innerHeight);
  assert(runGeom.deadRatio<=0.15,size+' Run-state structural dead space '+(runGeom.deadRatio*100).toFixed(1)+'% exceeds 15%');

  assert.equal(errors.length,0,size+' browser errors: '+errors.join(' | '));
  console.log('Q27 DENSITY PASS '+size+' initial='+(geom.deadRatio*100).toFixed(1)+'% run='+(runGeom.deadRatio*100).toFixed(1)+'% motionRows='+geom.motionRows+' runRows='+runGeom.runRows+' scroll='+runGeom.scrollHeight+'/'+runGeom.innerHeight);
  await context.close();
 }
 await browser.close();
 console.log('QUALITY27 DENSITY PASS: Standard/Large/Extra Large initial and five-pin Run states stay <=15% structural dead space, Run stays no-scroll, and pinned football labels remain readable');
})().catch(e=>{console.error(e);process.exit(1)});
