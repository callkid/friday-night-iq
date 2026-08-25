const {chromium}=require('playwright');
const assert=require('assert');
async function boot(browser,w=1475,h=668){
 const context=await browser.newContext({viewport:{width:w,height:h}}),page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
 await page.addInitScript(()=>localStorage.clear());await page.goto('http://127.0.0.1:8000/?q26=1',{waitUntil:'networkidle'});await page.fill('#team','Booth QA');await page.fill('#opp','Football Test');await page.click('#start');await page.waitForSelector('#live.on');await page.waitForSelector('.fniqFootballFlow26');assert.equal(errors.length,0,'startup errors: '+errors.join(' | '));return{context,page,errors};
}
async function correctSituation(page,{quarter='Q2',down=1,distance=10,side='OPP',yard=47}={}){
 const edit=page.locator('#shortSituationEdit:visible, #speedSituationEdit:visible').first();assert(await edit.isVisible(),'Edit Situation is not visible');await edit.click();await page.waitForSelector('#q26SituationModal:not(.hidden)');
 await page.selectOption('#q26Quarter',quarter);await page.selectOption('#q26Down',String(down));await page.fill('#q26Distance',String(distance));await page.selectOption('#q26Side',side);if(side!=='50')await page.fill('#q26Yard',String(yard));await page.click('#q26SituationSave');await page.waitForSelector('#q26SituationModal.hidden');
 const s=await page.evaluate(()=>window.FNIQ.state.current);assert.equal(s.quarter,quarter);assert.equal(s.down,down);assert.equal(s.distance,distance);assert.equal(s.fieldSide,side);assert.equal(s.yardLine,side==='50'?50:yard);return s;
}
async function choosePenalty(page,name){await page.click('[data-group="playType"] [data-v="Penalty"]');await page.waitForSelector('#penaltyPanel:not(.hidden)');const q=page.locator('#speedPenaltyPresets button[data-pen-quick="'+name+'"]');assert(await q.isVisible(),name+' quick penalty is missing');await q.click();await page.waitForFunction(n=>document.querySelector('#penType').value===n,name);}
async function savePenalty(page){await page.locator('#save').click();await page.waitForTimeout(100);return page.evaluate(()=>({current:window.FNIQ.state.current,last:window.FNIQ.state.plays[window.FNIQ.state.plays.length-1]}));}
(async()=>{
 const browser=await chromium.launch({headless:true});
 const {page,context,errors}=await boot(browser);
 // Edit Situation must be a real correction workflow, not a hidden-card toggle.
 await correctSituation(page,{quarter:'Q2',down:1,distance:10,side:'OPP',yard:47});
 assert((await page.locator('#headline').textContent()).includes('1st & 10'),'headline did not update after situation correction');
 // Motion: one useful shortcut plus the full dropdown, no duplicate recent-motion button row.
 const motionVisible=await page.locator('#q24MotionQuick button:visible').allTextContents();assert.deepStrictEqual(motionVisible.map(x=>x.trim()),['NO MOTION']);assert(await page.locator('#motion').isVisible(),'Motion dropdown must remain available');
 // Run detail uses full football names; no cryptic CTR/PWR/IZ/OZ labels.
 await page.click('[data-group="playType"] [data-v="Run"]');await page.waitForSelector('#q24AttackQuick:not(.hidden)');const attack=await page.locator('#q24AttackQuick button:visible').allTextContents();
 for(const full of ['Inside Zone','Outside Zone','Counter','Power','Draw'])assert(attack.includes(full),'missing full run type label '+full+': '+attack.join(', '));
 for(const bad of ['CTR','PWR','IZ','OZ'])assert(!attack.includes(bad),'cryptic run abbreviation remains: '+bad);
 assert(await page.locator('#q26Outcome').isVisible(),'contextual Run/Pass result controls missing');assert(await page.locator('#q26Outcome [data-q26-tag="Fumble"]').isVisible(),'Fumble control missing');assert(await page.locator('#q26Outcome [data-q26-tag="Fumble Lost"]').isVisible(),'Fumble Lost control missing');
 assert(!(await page.locator('.trackerResultTags').isVisible()),'duplicate Result Tags row must be hidden');assert(!(await page.locator('.q26RedundantConcept').isVisible()),'duplicate Concept Family input must be hidden');
 const capture=(await page.locator('#q24CaptureCount').textContent()).trim();assert(!/Look\s+\d+\/8/i.test(capture),'unclear Look X/8 copy remains: '+capture);assert(/missing|complete/i.test(capture),'capture status is not action-oriented: '+capture);
 // Important booth controls cannot be micro UI at short-laptop size.
 const critical=['#speedHashButtons button','[data-group="front"] .choice','#q24CoverageQuick button:visible','[data-group="box"] .choice','#q24MotionQuick button:visible','[data-group="playType"] .choice','#q24AttackQuick button:visible','#save'];
 for(const sel of critical){const loc=page.locator(sel).first();assert(await loc.isVisible(),'critical control missing '+sel);const m=await loc.evaluate(el=>{const r=el.getBoundingClientRect(),s=getComputedStyle(el);return{h:r.height,font:parseFloat(s.fontSize)}});assert(m.h>=31,'critical target too short '+sel+' '+m.h);assert(m.font>=10.5,'critical text too small '+sel+' '+m.font);}
 // Pre-snap card should end near its last real control instead of stretching into a blank slab.
 const preGap=await page.evaluate(()=>{const card=document.querySelector('#preSnapCard').getBoundingClientRect(),els=['#motion','[data-group="box"]','#q24MotionQuick'].map(s=>document.querySelector(s)).filter(Boolean).filter(e=>getComputedStyle(e).display!=='none').map(e=>e.getBoundingClientRect().bottom);return Math.round(card.bottom-Math.max.apply(null,els));});assert(preGap<=28,'pre-snap internal dead space '+preGap+'px');
 // Cancel must recover immediately from an accidental Penalty click.
 await page.click('[data-group="playType"] [data-v="Penalty"]');await page.waitForSelector('#penaltyPanel:not(.hidden)');assert(await page.locator('#q26CancelPenalty').isVisible(),'Cancel Penalty missing');await page.click('#q26CancelPenalty');await page.waitForSelector('#penaltyPanel.hidden');assert.strictEqual(await page.evaluate(()=>window.FNIQ.sel.playType),null,'Cancel Penalty did not clear play type');
 // Holding default: live-ball 10 yards against offense, down counts, actual saved next snap changes.
 await choosePenalty(page,'Holding');assert.equal(await page.inputValue('#penTeam'),'Offense');assert.equal(await page.inputValue('#penStatus'),'Accepted');assert.equal(await page.inputValue('#penDistance'),'10');assert.equal(await page.inputValue('#penEffect'),'COUNT');assert(await page.locator('#penNetOverride').isVisible(),'official net override is not quick-access');
 await page.waitForFunction(()=>/Net -10 yd/.test(document.querySelector('#q26PenaltySummary').textContent));let out=await savePenalty(page);assert.equal(out.last.penalty.yards,-10);assert.deepStrictEqual([out.current.down,out.current.distance,out.current.fieldSide,out.current.yardLine],[2,20,'OWN',43]);
 // Permanent false-start regression via actual browser Save: 2nd & 2 Own 25 -> 2nd & 7 Own 20.
 await correctSituation(page,{quarter:'Q2',down:2,distance:2,side:'OWN',yard:25});await choosePenalty(page,'False Start');await page.waitForFunction(()=>/2nd & 7/.test(document.querySelector('#q26PenaltySummary').textContent));out=await savePenalty(page);assert.deepStrictEqual([out.current.down,out.current.distance,out.current.fieldSide,out.current.yardLine],[2,7,'OWN',20]);
 // Half the distance is automatic: Holding from Own 8 -> -4 and next down.
 await correctSituation(page,{quarter:'Q2',down:1,distance:10,side:'OWN',yard:8});await choosePenalty(page,'Holding');await page.waitForFunction(()=>/half the distance/i.test(document.querySelector('#q26PenaltySummary').textContent));out=await savePenalty(page);assert.equal(out.last.penalty.yards,-4);assert.equal(out.last.penalty.halfDistance,true);assert.deepStrictEqual([out.current.down,out.current.distance,out.current.fieldSide,out.current.yardLine],[2,14,'OWN',4]);
 // Weird official enforcement can override the standard immediately.
 await correctSituation(page,{quarter:'Q2',down:1,distance:10,side:'OWN',yard:25});await choosePenalty(page,'Holding');await page.fill('#penNetOverride','-7');await page.dispatchEvent('#penNetOverride','input');await page.waitForFunction(()=>/official override/i.test(document.querySelector('#q26PenaltySummary').textContent));out=await savePenalty(page);assert.equal(out.last.penalty.yards,-7);assert.deepStrictEqual([out.current.down,out.current.distance,out.current.fieldSide,out.current.yardLine],[2,17,'OWN',18]);
 assert(Math.abs(await page.evaluate(()=>scrollY))<=2,'football workflow leaves desktop scrolled');assert.equal(errors.length,0,'browser errors: '+errors.join(' | '));
 console.log('QUALITY26 BROWSER PASS: edit situation works, controls are readable, duplicate tracking is removed, holding/half-distance/override/cancel all update the real next snap');await context.close();await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
