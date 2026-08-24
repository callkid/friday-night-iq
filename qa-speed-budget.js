const assert=require('assert');
const fs=require('fs');
const S=require('./speed-guard.js');

for(const [name,b] of Object.entries(S.BUDGETS)){
  const sec=S.estimatedSeconds(name);
  assert(sec<30,`${name} exceeds 30-second model: ${sec}s`);
  assert(b.interactions<=18,`${name} interaction count too high: ${b.interactions}`);
}
assert(S.allUnder(30),'Every production capture path must remain under 30 seconds in the conservative interaction model');
assert(S.estimatedSeconds('hurryUp')<=12,'Hurry-up path must stay at or under 12 modeled seconds');
assert(S.estimatedSeconds('normalRun')<=18,'Normal run path must stay at or under 18 modeled seconds');
assert(S.estimatedSeconds('normalPass')<=19.5,'Normal pass path must stay at or under 19.5 modeled seconds');
assert(S.estimatedSeconds('penalty')<=27,'Penalty path must stay at or under 27 modeled seconds');

const gd3=fs.readFileSync(__dirname+'/game-day-3.js','utf8');
const css=fs.readFileSync(__dirname+'/game-day-3.css','utf8');
const guard=fs.readFileSync(__dirname+'/speed-guard.js','utf8');
const state=fs.readFileSync(__dirname+'/state.js','utf8');

assert(gd3.indexOf('gd3HashButtons')<gd3.indexOf('gd3FormationHost'),'Hash must appear before Formation');
assert(gd3.indexOf('gd3FormationHost')<gd3.indexOf('gd3PersonnelHost'),'Formation must appear before Personnel');
assert(gd3.includes('Where is the ball now?'),'Ball-spot-first result entry is required');
assert(gd3.includes('[data-v="No Play"]'),'No Play must be removed from the live surface');
assert(gd3.includes('Optional detail'),'Low-priority detail must remain collapsed/optional');
assert(!gd3.includes('MutationObserver'),'Speed tracker may not use DOM observers');
assert(css.includes('#live aside.sticky{display:none!important}'),'Live side rail must not steal laptop width');
assert(css.includes('.gd3LegacyHidden,.gd3LegacyPenalty{display:none!important}'),'Legacy long-form cards must remain hidden');
assert(css.includes('.gd3Bottom{position:sticky'),'Save controls must remain sticky');
assert(guard.includes("e.altKey&&e.key==='Enter'"),'Alt+Enter fast save must work from any focus state');
assert(guard.includes("enterToSave('gd3EndYard')"),'Enter after end spot must save');
assert(guard.includes("enterToSave('gd3NextYard')"),'Enter after official penalty spot must save');
assert(guard.includes('stopImmediatePropagation'),'Fast save must prevent duplicate legacy shortcut handling');
assert(!guard.includes('MutationObserver'),'Speed guard may not introduce render observers');
assert(state.includes("K='fniq_prod_v1'"),'Production save key must remain unchanged');

for(let i=0;i<5000;i++){
  for(const name of Object.keys(S.BUDGETS))assert(S.estimatedSeconds(name)<30);
}
console.log('Under-30-second interaction budget and live-layout regression QA passed');
