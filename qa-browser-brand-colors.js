const {chromium}=require('playwright');
const assert=require('assert');
const fs=require('fs');
fs.mkdirSync('qa-screenshots',{recursive:true});
const ACCENTS=[
 {name:'orange',a:'#d47a23',a2:'#ea9a3d'},
 {name:'red',a:'#b3261e',a2:'#d94b42'},
 {name:'blue',a:'#2457a7',a2:'#4778c6'},
 {name:'green',a:'#2f6f4e',a2:'#4f8e6c'},
 {name:'purple',a:'#68439a',a2:'#8864b5'},
 {name:'gold',a:'#b47a00',a2:'#d79a19'},
 {name:'dark',a:'#263746',a2:'#43586a'}
];
const VIEWPORTS=[{name:'short',width:1475,height:668},{name:'wide',width:2048,height:1159}];
const CASES=ACCENTS.flatMap(accent=>VIEWPORTS.map(view=>({...accent,...view,name:accent.name+'-'+view.name})));
function rgb(s){const m=String(s).match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);return m?[+m[1],+m[2],+m[3]]:null}
function lum(c){c=c.map(v=>{v/=255;return v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4)});return .2126*c[0]+.7152*c[1]+.0722*c[2]}
function contrast(a,b){const x=lum(a),y=lum(b);return(Math.max(x,y)+.05)/(Math.min(x,y)+.05)}
async function style(page,sel){return page.locator(sel).first().evaluate(el=>{const s=getComputedStyle(el),r=el.getBoundingClientRect();return{font:parseFloat(s.fontSize),h:r.height,color:s.color,bg:s.backgroundColor,border:s.borderColor,shadow:s.boxShadow}})}
(async()=>{const browser=await chromium.launch({headless:true});for(const c of CASES){const context=await browser.newContext({viewport:{width:c.width,height:c.height}}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});await page.addInitScript(()=>localStorage.clear());await page.goto('http://127.0.0.1:8000/?accentqa='+c.name,{waitUntil:'networkidle'});await page.fill('#team','Accent Matrix QA');await page.fill('#opp','Color Test');await page.click('#start');await page.waitForSelector('#live.on');await page.waitForSelector('#trackerFinishCard');await page.waitForSelector('#q27Pins-coverage button[data-value="Cover 3"]',{state:'visible'});await page.evaluate(({a,a2})=>{document.documentElement.setAttribute('data-theme','light');document.documentElement.style.setProperty('--a',a);document.documentElement.style.setProperty('--a2',a2);},{a:c.a,a2:c.a2});await page.waitForTimeout(80);
 const quick=await style(page,'#q27Pins-coverage button[data-value="Cover 3"]');assert(quick.font>=(c.height<=700?10.8:11.4),c.name+' coach-pin font failed: '+quick.font);assert(quick.h>=(c.height<=700?31:34),c.name+' coach-pin target failed: '+quick.h);assert(await page.locator('#coverage').isVisible(),c.name+' full Coverage dropdown must remain visible beside coach pins');
 const blitz=await style(page,'#speedBlitzQuick .danger'),bbg=rgb(blitz.bg),bfg=rgb(blitz.color);assert(bbg&&bfg&&contrast(bbg,bfg)>=4.5,c.name+' unselected Blitz contrast failed');assert(Math.max(...bbg)-Math.min(...bbg)<=20,c.name+' unselected Blitz became accent/warning colored: '+blitz.bg);
 await page.screenshot({path:'qa-screenshots/accent-'+c.name+'-initial.png',fullPage:true});await page.click('#q27Pins-coverage button[data-value="Cover 3"]');await page.waitForTimeout(30);const selected=await style(page,'#q27Pins-coverage button[data-value="Cover 3"]'),sbg=rgb(selected.bg),sfg=rgb(selected.color);assert(sbg&&sfg&&contrast(sbg,sfg)>=4.5,c.name+' selected Coverage pin contrast failed');assert(selected.border!=='rgb(201, 211, 223)',c.name+' selected Coverage pin did not communicate state');assert(selected.shadow!=='none',c.name+' selected Coverage pin lost its state indicator');await page.screenshot({path:'qa-screenshots/accent-'+c.name+'-selected.png',fullPage:true});assert((await page.evaluate(()=>document.documentElement.scrollHeight))<=c.height+2,c.name+' accent case added page scroll');assert.equal(errors.length,0,c.name+' browser errors: '+errors.join(' | '));console.log('ACCENT PASS:',c.name,'font='+quick.font,'target='+Math.round(quick.h),'blitzContrast='+contrast(bbg,bfg).toFixed(2));await context.close();}await browser.close();console.log('ACCENT MATRIX QA PASS: Quality27 coach pins stay readable and selected-state contrast remains clear across orange/red/blue/green/purple/gold/dark accents on short and wide press-box layouts');})().catch(e=>{console.error(e);process.exit(1)});
