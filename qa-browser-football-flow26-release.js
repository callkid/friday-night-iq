const {chromium}=require('playwright');
const assert=require('assert');
async function boot(browser){
 const context=await browser.newContext({viewport:{width:1475,height:668}}),page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
 await page.addInitScript(()=>localStorage.clear());
 await page.goto('http://127.0.0.1:8000/?q26release=1',{waitUntil:'networkidle'});
 await page.fill('#team','Booth QA');await page.fill('#opp','Football Test');await page.click('#start');
 await page.waitForSelector('#live.on');await page.waitForSelector('.fniqFootballFlow26');
 assert.equal(errors.length,0,'startup errors: '+errors.join(' | '));return{context,page,errors};
}
async function correctSituation(page,{quarter='Q2',down=1,distance=10,side='OPP',yard=47}={}){
 const edit=page.locator('#shortSituationEdit:visible, #speedSituationEdit:visible').first();assert(await edit.isVisible(),'Edit Situation is not visible');
 await edit.click();await page.waitForSelector('#q26SituationModal:not(.hidden)');
 await page.selectOption('#q26Quarter',quarter);await page.selectOption('#q26Down',String(down));await page.fill('#q26Distance',String(distance));await page.selectOption('#q26Side',side);if(side!=='50')await page.fill('#q26Yard',String(yard));
 await page.click('#q26SituationSave');await page.waitForFunction(()=>document.querySelector('#q26SituationModal').classList.contains('hidden'));
 const s=await page.evaluate(()=>window.FNIQ.state.current);assert.equal(s.quarter,quarter);assert.equal(s.down,down);assert.equal(s.distance,distance);assert.equal(s.fieldSide,side);assert.equal(s.yardLine,side==='50'?50:yard);return s;
}
async function choosePenalty(page,name){
 await page.click('[data-group="playType"] [data-v="Penalty"]');await page.waitForSelector('#penaltyPanel:not(.hidden)');
 const q=page.locator('#speedPenaltyPresets button[data-pen-quick="'+name+'"]');assert(await q.isVisible(),name+' quick penalty is missing');await q.click();await page.waitForFunction(n=>document.querySelector('#penType').value===n,name);
}
async function savePenalty(page){await page.locator('#save').click();await page.waitForTimeout(120);return page.evaluate(()=>({current:window.FNIQ.state.current,last:window.FNIQ.state.plays.at(-1)}));}
(async()=>{
 const browser=await chromium.launch({headless:true});const {page,context,errors}=await boot(browser);
 await correctSituation(page,{quarter:'Q2',down:1,distance:10,side:'OPP',yard:47});
 assert((await page.locator('#headline').textContent()).includes('1st & 10'),'headline did not update after situation correction');
 assert.deepStrictEqual((await page.locator('#q27Pins-motion button:visible').allTextContents()).map(x=>x.trim()),['NO MOTION']);assert(await page.locator('#motion').isVisible(),'Motion dropdown missing');
 await page.click('[data-group="playType"] [data-v="Run"]');await page.waitForSelector('#q27Pins-runType:not(.hidden)');
 const attack=await page.locator('#q27Pins-runType button:visible').allTextContents();for(const full of ['Inside Zone','Outside Zone','Counter'])assert(attack.includes(full),'missing default run pin '+full);for(const bad of ['CTR','PWR','IZ','OZ'])assert(!attack.includes(bad),'cryptic run label remains '+bad);assert(await page.locator('#attackDetail').isVisible(),'Run Type dropdown missing');
 for(const tag of ['Fumble','Fumble Lost','Penalty'])assert(await page.locator('#q26Outcome [data-q26-tag="'+tag+'"]').isVisible(),tag+' contextual control missing');
 assert(!(await page.locator('.trackerResultTags').isVisible()),'duplicate Result Tags row must stay hidden');assert(!(await page.locator('.q26RedundantConcept').isVisible()),'duplicate Concept Family input must stay hidden');
 await page.click('#q26Outcome [data-q26-tag="Penalty"]');await page.waitForSelector('#penaltyPanel:not(.hidden)');assert.equal(await page.evaluate(()=>window.FNIQ.sel.playType),'Run','live-ball Penalty changed the underlying play type');assert(await page.locator('.tag[data-tag="Penalty"]').evaluate(el=>el.classList.contains('on')),'Penalty tag was not stored');
 await page.click('#q26CancelPenalty');await page.waitForSelector('#penaltyPanel',{state:'hidden'});assert.equal(await page.evaluate(()=>window.FNIQ.sel.playType),'Run','Cancel Penalty should return to the Run');assert.equal(await page.locator('.tag[data-tag="Penalty"]').evaluate(el=>el.classList.contains('on')),false,'Cancel Penalty left the tag selected');
 await page.click('[data-group="playType"] [data-v="Penalty"]');await page.waitForSelector('#penaltyPanel:not(.hidden)');await page.click('#q26CancelPenalty');await page.waitForSelector('#penaltyPanel',{state:'hidden'});assert.strictEqual(await page.evaluate(()=>window.FNIQ.sel.playType),null,'standalone Cancel Penalty did not clear play type');
 await correctSituation(page,{quarter:'Q2',down:1,distance:10,side:'OPP',yard:47});await choosePenalty(page,'Holding');await page.waitForFunction(()=>document.querySelector('#penEffect').value==='REPEAT');
 assert.equal(await page.inputValue('#penTeam'),'Offense');assert.equal(await page.inputValue('#penStatus'),'Accepted');assert.equal(await page.inputValue('#penDistance'),'10');assert.equal(await page.inputValue('#penEffect'),'REPEAT');assert(await page.locator('#penNetOverride').isVisible(),'official net override missing');
 await page.waitForFunction(()=>/Net -10 yd/.test(document.querySelector('#q26PenaltySummary').textContent));let out=await savePenalty(page);assert.equal(out.last.penalty.yards,-10);assert.deepStrictEqual([out.current.down,out.current.distance,out.current.fieldSide,out.current.yardLine],[1,20,'OWN',43]);
 await correctSituation(page,{quarter:'Q2',down:2,distance:2,side:'OWN',yard:25});await choosePenalty(page,'False Start');await page.waitForFunction(()=>/2nd & 7/.test(document.querySelector('#q26PenaltySummary').textContent));out=await savePenalty(page);assert.deepStrictEqual([out.current.down,out.current.distance,out.current.fieldSide,out.current.yardLine],[2,7,'OWN',20]);
 await correctSituation(page,{quarter:'Q2',down:1,distance:10,side:'OWN',yard:8});await choosePenalty(page,'Holding');await page.waitForFunction(()=>/half the distance/i.test(document.querySelector('#q26PenaltySummary').textContent));out=await savePenalty(page);assert.equal(out.last.penalty.yards,-4);assert.equal(out.last.penalty.halfDistance,true);assert.deepStrictEqual([out.current.down,out.current.distance,out.current.fieldSide,out.current.yardLine],[1,14,'OWN',4]);
 await correctSituation(page,{quarter:'Q2',down:1,distance:10,side:'OWN',yard:25});await choosePenalty(page,'Holding');await page.fill('#penNetOverride','-7');await page.dispatchEvent('#penNetOverride','input');await page.waitForFunction(()=>/official override/i.test(document.querySelector('#q26PenaltySummary').textContent));out=await savePenalty(page);assert.equal(out.last.penalty.yards,-7);assert.deepStrictEqual([out.current.down,out.current.distance,out.current.fieldSide,out.current.yardLine],[1,17,'OWN',18]);
 for(const sel of ['#speedHashButtons button','[data-group="front"] .choice','#q27Pins-coverage button:visible','[data-group="box"] .choice','#q27Pins-motion button:visible','[data-group="playType"] .choice','#save']){const loc=page.locator(sel).first();assert(await loc.isVisible(),'critical control missing '+sel);const m=await loc.evaluate(el=>{const r=el.getBoundingClientRect(),s=getComputedStyle(el);return{h:r.height,font:parseFloat(s.fontSize)}});assert(m.h>=31,'critical target too short '+sel+' '+m.h);assert(m.font>=10.5,'critical text too small '+sel+' '+m.font);}
 assert(Math.abs(await page.evaluate(()=>scrollY))<=2,'football workflow leaves desktop scrolled');assert.equal(errors.length,0,'browser errors: '+errors.join(' | '));
 console.log('QUALITY26 UNDER Q27 PASS: Edit Situation, contextual penalty, accepted Holding repeat-down enforcement, dead-ball repeat, half-distance, override, cancel, readable pinned controls, and short-laptop football workflow all operate on real saved state');
 await context.close();await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
