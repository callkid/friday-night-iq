const {chromium}=require('playwright');
const assert=require('assert');
(async()=>{
 const browser=await chromium.launch({headless:true});
 const context=await browser.newContext({viewport:{width:1475,height:668}}),page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
 await page.addInitScript(()=>localStorage.clear());
 await page.goto('http://127.0.0.1:8000/?q27=1',{waitUntil:'networkidle'});
 await page.fill('#team','Quality27 QA');await page.fill('#opp','Tracker Test');await page.click('#start');await page.waitForSelector('#live.on');await page.waitForSelector('#q27SavedBar',{state:'attached'});
 assert(await page.locator('html').evaluate(el=>el.classList.contains('fniqQ27SizeStandard')),'Standard control size should be default');
 // Settings: size preference and coach-defined pins save outside football state.
 await page.click('#settingsNav');await page.waitForSelector('#settings.on');await page.waitForSelector('#q27Settings');
 await page.click('[data-q27-size="large"]');
 assert.equal(await page.evaluate(()=>localStorage.getItem('fniq_q27_control_size_v1')),'large');
 assert(await page.locator('html').evaluate(el=>el.classList.contains('fniqQ27SizeLarge')),'Large size class missing');
 const formationGroup=page.locator('.q27PinGroup').filter({hasText:'Formation'}),formationOption=formationGroup.locator('.q27PinOption').first();assert(await formationOption.count(),'Formation pin choices missing');const formationName=(await formationOption.textContent()).trim();await formationOption.click();
 const runGroup=page.locator('.q27PinGroup').filter({hasText:'Run Type'});const power=runGroup.locator('.q27PinOption',{hasText:'Power'});if((await power.getAttribute('aria-pressed'))!=='true')await power.click();
 const savedPins=JSON.parse(await page.evaluate(()=>localStorage.getItem('fniq_q27_pins_v1')));assert(savedPins.formation.includes(formationName),'Formation pin did not persist');assert(savedPins.runType.includes('Power'),'Run Type pin did not persist');
 await page.click('[data-screen="live"]');await page.waitForSelector('#live.on');
 const fp=page.locator('#q27Pins-formation button',{hasText:formationName});assert(await fp.isVisible(),'Pinned Formation is not visible in tracker');await fp.click();assert.equal(await page.inputValue('#formation'),formationName,'Pinned Formation did not update dropdown');
 // Large controls must be meaningfully larger without browser zoom.
 const fm=await fp.evaluate(el=>{const r=el.getBoundingClientRect(),s=getComputedStyle(el);return{h:r.height,font:parseFloat(s.fontSize),zoom:getComputedStyle(document.documentElement).zoom||'1'}});assert(fm.h>=34,'Large pinned target too short: '+fm.h);assert(fm.font>=11,'Large pinned text too small: '+fm.font);assert(fm.zoom==='1'||fm.zoom==='normal','Control size must not use page zoom');
 // Missing-field status is actionable, not just copy.
 assert(await page.locator('#q24CaptureMissing .q27MissingBtn').count()>0,'Actionable missing field buttons missing');const personnelMissing=page.locator('#q24CaptureMissing .q27MissingBtn',{hasText:'PERSONNEL'});assert(await personnelMissing.isVisible(),'PERSONNEL missing action absent');await personnelMissing.click();assert.equal(await page.evaluate(()=>document.activeElement&&document.activeElement.id),'personnel','Missing-field action did not focus Personnel');
 // Complete all eight pre-snap fields and require a clear completion state.
 await page.click('#speedHashButtons button[data-value="Left"]');await page.fill('#personnel','11');await page.click('[data-group="front"] .choice[data-v="4"]');await page.click('[data-group="safeties"] .choice[data-v="2"]');
 const c3=page.locator('#q27Pins-coverage button[data-value="Cover 3"]');if(await c3.count())await c3.click();else await page.selectOption('#coverage','Cover 3');
 await page.click('[data-group="box"] .choice[data-v="6"]');await page.click('#q27Pins-motion button[data-value="No Motion"]');
 await page.waitForFunction(()=>document.querySelector('#q24CaptureCount').textContent.includes('PRE-SNAP COMPLETE'));
 assert.equal((await page.locator('#q24CaptureMissing').textContent()).trim(),'All 8 key fields charted');
 // Run Type pin stays contextual and the full dropdown remains visible as source of truth.
 await page.click('[data-group="playType"] .choice[data-v="Run"]');await page.waitForSelector('#q27Pins-runType:not(.hidden)');const pwr=page.locator('#q27Pins-runType button[data-value="Power"]');assert(await pwr.isVisible(),'Pinned Power quick button missing');assert(await page.locator('#attackDetail').isVisible(),'Full Run Type dropdown must remain visible');await pwr.click();assert.equal(await page.inputValue('#attackDetail'),'Power');
 await page.fill('#yards','5');await page.dispatchEvent('#yards','input');await page.click('#save');await page.waitForSelector('#q27SavedBar:not(.hidden)');
 assert((await page.locator('#q27SavedTitle').textContent()).includes('PLAY 1 SAVED'),'Saved confirmation missing play number');assert((await page.locator('#q27SavedResult').textContent()).includes('+5 yd'),'Saved confirmation missing result yards');assert((await page.locator('#q27SavedNext').textContent()).includes('2nd & 5'),'Saved confirmation missing calculated next situation');assert(await page.locator('#q27FixLast').isVisible(),'Fix Last Play is not obvious');assert(await page.locator('#q27UndoLast').isVisible(),'Undo Last is not obvious');
 const football=await page.evaluate(()=>({current:window.FNIQ.state.current,last:window.FNIQ.state.plays.at(-1),prod:localStorage.getItem('fniq_prod_v1')!==null,pins:localStorage.getItem('fniq_q27_pins_v1')!==null,size:localStorage.getItem('fniq_q27_control_size_v1')!==null}));assert.deepStrictEqual([football.current.down,football.current.distance],[2,5]);assert.equal(football.last.playType,'Run');assert.equal(football.last.attackDetail,'Power');assert(football.prod,'existing production storage key missing');assert(football.pins&&football.size,'Quality27 preferences must use separate keys');
 // Fix Last Play must enter the existing nondestructive edit flow, not delete the play first.
 await page.click('#q27FixLast');await page.waitForSelector('#cancelEditLast:not(.hidden)');assert((await page.locator('#save').textContent()).includes('Update Play 1'),'Fix Last Play did not enter edit mode');assert.equal(await page.evaluate(()=>window.FNIQ.state.plays.length),1,'Fix Last Play removed the saved play before correction');await page.click('#cancelEditLast');assert.equal(await page.evaluate(()=>window.FNIQ.state.plays.length),1,'Canceling Fix Last Play changed saved history');
 // Preferences survive a reload while football state remains intact.
 await page.reload({waitUntil:'networkidle'});await page.waitForSelector('#q27Settings');assert(await page.locator('html').evaluate(el=>el.classList.contains('fniqQ27SizeLarge')),'Control size did not survive reload');await page.click('[data-screen="live"]');await page.waitForSelector('#live.on');assert(await page.locator('#q27Pins-formation button',{hasText:formationName}).isVisible(),'Formation pin did not survive reload');assert.equal((await page.evaluate(()=>window.FNIQ.state.plays.length)),1,'Quality27 preferences disturbed saved plays');
 assert.equal(errors.length,0,'browser errors: '+errors.join(' | '));console.log('QUALITY27 BROWSER PASS: coach pins, responsive control size, actionable missing fields, visible source dropdowns, and nondestructive just-saved correction access work without changing football state semantics');
 await context.close();await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
