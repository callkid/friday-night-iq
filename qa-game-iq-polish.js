const assert=require('assert');
const fs=require('fs');
const S=require('./game-iq-search.js');
const F=require('./game-iq-facets.js');
const P=require('./game-iq-pro.js');
const E={fieldAbs:(side,y)=>side==='OPP'?100-Number(y):side==='50'?50:Number(y),success:p=>Number(p.yards)>=Number(p.distance)/2,isFirstDownResult:p=>Number(p.yards)>=Number(p.distance),officialNetYards:p=>Number(p.yards)||0};
const plays=[
 {number:1,down:1,distance:10,fieldSide:'OWN',yardLine:25,playType:'Run',yards:5,front:'4',coverage:'Cover 3',postCoverage:'Same as pre-snap',pressure:'None'},
 {number:2,down:1,distance:12,fieldSide:'OWN',yardLine:30,playType:'Pass',yards:8,front:'3',coverage:'Cover 1',postCoverage:'Cover 1',pressure:'5M'},
 {number:3,down:1,distance:3,fieldSide:'OWN',yardLine:38,playType:'Run',yards:4,front:'5',coverage:'Cover 2',postCoverage:'Same as pre-snap',pressure:'5M'},
 {number:4,down:2,distance:10,fieldSide:'OWN',yardLine:42,playType:'Pass',yards:6,front:'4',coverage:'Cover 3',postCoverage:'Cover 3',pressure:'None'}
];
assert.equal(S.firstDownSituation(1,10),'Ten');
assert.equal(S.firstDownSituation(1,11),'Long');
assert.equal(S.firstDownSituation(1,3),'Short');
assert.equal(S.filterPlays(E,plays,[{key:'firstDownSituation',value:'Ten'}]).length,1);
assert.equal(S.filterPlays(E,plays,[{key:'firstDownSituation',value:'Long'}]).length,1);
const labels=S.downDistanceRows(E,plays).map(x=>x.label);
assert(labels.includes('1st & 10'),'Coach shortcuts must include 1st & 10');
assert(labels.includes('1st & Long'),'Coach shortcuts must include 1st & Long');
assert(!labels.includes('1st Down & Long'));
assert.equal(F.valueFor(E,plays[0],'firstDownSituation'),'Ten');
assert.equal(P.valueFor(E,plays[0],'firstDownSituation'),'Ten');
assert.equal(P.display('firstDownSituation','Ten'),'1st & 10');
assert.equal(P.display('firstDownSituation','Long'),'1st & Long');
const polish=fs.readFileSync('game-iq-polish.js','utf8');
assert(polish.includes('SAVED VIEWS'));
assert(polish.includes('Save for quick access'));
assert(!polish.includes('MutationObserver'));
assert(!fs.existsSync('game-iq-firstdown-ui.js'));
console.log('First-down native integration and Saved Views QA passed');
