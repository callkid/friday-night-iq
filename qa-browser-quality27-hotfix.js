const {chromium}=require('playwright');
const assert=require('assert');

async function metric(page){
 return page.locator('#save').evaluate(el=>{const r=el.getBoundingClientRect(),s=getComputedStyle(el),h=getComputedStyle(document.documentElement);return{height:r.height,font:parseFloat(s.fontSize),zoom:h.zoom||'1'};});
}
async function setSize(page,size){
 await page.click('#settingsNav');await page.waitForSelector('#settings.on');await page.click('[data-q27-size="'+size+'"]');await page.click('[data-screen="live"]');await page.waitForSelector('#live.on');await page.waitForTimeout(80);
}
async function situation(page,{down,distance,side,yard}){
 await page.evaluate(({down,distance,side,yard})=>{window.FNIQ.setCurrent({quarter:'Q2',down,distance,fieldSide:side,yardLine:yard});window.FNIQ.hydrateSituation();window.FNIQ.renderAll();},{down,distance,side,yard});
 await page.waitForTimeout(50);
}
(async()=>{
 const browser=await chromium.launch({headless:true});
 const context=await browser.newContext({viewport:{width:1475,height:668}}),page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
 await page.addInitScript(()=>localStorage.clear());
 await page.goto('http://127.0.0.1:8000/?q27hotfix=1',{waitUntil:'networkidle'});
 await page.fill('#team','Q27 Hotfix QA');await page.fill('#opp','Penalty Test');await page.click('#start');await page.waitForSelector('#live.on');
 await page.waitForFunction(()=>document.getElementById('quality27HotfixCss')&&document.getElementById('quality27HotfixCss').sheet);

 // Control size must visibly change real game controls, not merely store a preference/class.
 const standard=await metric(page);
 await setSize(page,'large');const large=await metric(page);
 assert(large.height>=standard.height+1||large.font>=standard.font+1,'Large control size is not visibly larger: standard='+JSON.stringify(standard)+' large='+JSON.stringify(large));
 await setSize(page,'xl');const xl=await metric(page);
 assert(xl.height>=large.height+4||xl.font>=large.font+1.5,'Extra Large control size is not meaningfully larger than Large: '+JSON.stringify({large,xl}));
 assert(xl.zoom==='1'||xl.zoom==='normal','Control sizing must not use page zoom');
 await setSize(page,'standard');const back=await metric(page);
 assert(back.height<xl.height&&back.font<xl.font,'Returning to Standard did not shrink controls again');

 // Accepted Holding must repeat the down through the real Save path.
 await situation(page,{down:2,distance:5,side:'OWN',yard:30});
 await page.click('[data-group="playType"] [data-v="Penalty"]');await page.waitForSelector('#penaltyPanel:not(.hidden)');
 const holding=page.locator('#speedPenaltyPresets button[data-pen-quick="Holding"]');assert(await holding.isVisible(),'Holding quick penalty missing');await holding.click();
 await page.waitForFunction(()=>document.querySelector('#penEffect').value==='REPEAT');
 assert.equal(await page.inputValue('#penEffect'),'REPEAT','Holding should default to Repeat Down');
 await page.click('#save');await page.waitForTimeout(120);
 let out=await page.evaluate(()=>({current:window.FNIQ.state.current,last:window.FNIQ.state.plays.at(-1)}));
 assert.equal(out.last.penalty.effect,'REPEAT','saved Holding lost Repeat Down effect');
 assert.deepStrictEqual([out.current.down,out.current.distance,out.current.fieldSide,out.current.yardLine],[2,15,'OWN',20],'accepted Holding incorrectly consumed the down');

 // A generic accepted live-ball foul on a Run also defaults to repeat down instead of the old forced COUNT behavior.
 await situation(page,{down:3,distance:4,side:'OWN',yard:40});
 await page.click('[data-group="playType"] [data-v="Run"]');await page.click('#q26Outcome [data-q26-tag="Penalty"]');await page.waitForSelector('#penaltyPanel:not(.hidden)');
 await page.selectOption('#penType','Other');await page.waitForTimeout(30);await page.selectOption('#penTeam','Offense');await page.selectOption('#penStatus','Accepted');await page.fill('#penDistance','5');await page.selectOption('#penTiming','LIVE');await page.waitForTimeout(50);
 assert.equal(await page.inputValue('#penEffect'),'REPEAT','generic accepted live-ball foul should default to Repeat Down');
 await page.click('#save');await page.waitForTimeout(120);
 out=await page.evaluate(()=>({current:window.FNIQ.state.current,last:window.FNIQ.state.plays.at(-1)}));
 assert.equal(out.last.penalty.effect,'REPEAT');assert.deepStrictEqual([out.current.down,out.current.distance,out.current.fieldSide,out.current.yardLine],[3,9,'OWN',35],'generic accepted penalty incorrectly consumed the down');

 assert.equal(errors.length,0,'browser errors: '+errors.join(' | '));
 console.log('QUALITY27 HOTFIX BROWSER PASS: Standard/Large/Extra Large visibly resize live controls without zoom, accepted Holding repeats the down, and generic accepted live-ball penalties no longer default to consuming the down');
 await context.close();await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
