'use strict';
const assert=require('assert');
const IQ=require('./game-iq-pro.js');
const E={
 fieldAbs:(side,y)=>side==='50'?50:side==='OWN'?Number(y):100-Number(y),
 officialNetYards:p=>Number(p.yards)||0,
 success:p=>(Number(p.yards)||0)>=Math.max(1,Number(p.distance)||10)*(p.down===1?.5:p.down===2?.7:1),
 isFirstDownResult:p=>(Number(p.yards)||0)>=(Number(p.distance)||10)
};
function p(n,drive,down,distance,formation,hash,front,cov,pressure,type,detail,yards,conceptFamily,concept){return{number:n,drive,quarter:'Q1',down,distance,fieldSide:'OWN',yardLine:30,formation,hash,front,safeties:cov==='Cover 1'?'1':'2',box:'6',coverage:cov,postCoverage:'Same as pre-snap',pressure,playType:type,attackDetail:detail,yards,conceptFamily:conceptFamily||'NA',concept:concept||'NA',tags:[]};}
const plays=[
 p(1,1,1,3,'Trips Left','Left','4','Cover 1','5M','Run','Counter',8,'Run','Counter'),
 p(2,1,1,3,'Trips Left','Left','4','Cover 1','None','Run','Counter',6,'Run','Counter'),
 p(3,1,3,2,'Trips Left','Left','4','Cover 1','None','Pass','Short',4,'Short Game','Stick'),
 p(4,2,3,3,'Trips Left','Left','4','Cover 3','None','Pass','Short',2,'Short Game','Stick'),
 p(5,2,3,2,'Trips Left','Left','3','Cover 1','None','Run','Power',1,'Run','Power'),
 p(6,3,3,3,'Trips Left','Left','4','Cover 1','5M','Pass','Short',6,'Short Game','Stick'),
 p(7,3,3,2,'Doubles Right','Middle','4','Cover 1','5M','Run','Counter',7,'Run','Counter'),
 p(8,3,2,6,'Doubles Right','Middle','3','Cover 3','5M','Pass','Medium',8,'Drop Back','Mesh'),
 p(9,4,3,2,'Trips Left','Left','4','Cover 1','5M','Run','Counter',9,'Run','Counter'),
 p(10,4,3,1,'Trips Left','Left','4','Cover 1','5M','Run','Counter',10,'Run','Counter'),
 p(11,4,2,9,'Doubles Right','Right','3','Cover 3','5M','Pass','Deep',3,'Drop Back','Mesh'),
 p(12,4,1,6,'Trips Left','Right','4','Cover 1','5M','Run','Inside Zone',5,'Run','Inside Zone')
];
const filters=[{key:'down',value:'3'},{key:'distanceBucket',value:'Short'}];
const subset=IQ.filterPlays(E,plays,filters,()=>false);
assert.strictEqual(subset.length,7,'3rd and short should return seven plays');
const fronts=IQ.compareDistribution(E,subset,plays,'front',()=>false);
assert.strictEqual(fronts[0].label,'4 Down');
assert(fronts[0].share>70,'4 Down should dominate 3rd and short');
assert(Number.isFinite(fronts[0].delta),'baseline delta should be available');
const answers=IQ.bestAnswers(E,plays);
assert(answers.best.some(x=>x.label==='Counter'),'Counter should surface as a repeated offensive answer');
const exact=IQ.adaptiveContext(E,plays,[{key:'down',value:'3'},{key:'distanceBucket',value:'Short'},{key:'formation',value:'Trips Left'},{key:'hash',value:'Left'}],()=>false);
assert.strictEqual(exact.broadened,false,'known current context should stay exact');
assert.strictEqual(exact.plays.length,6,'exact Trips Left + left hash 3rd-short sample should be six');
const broad=IQ.adaptiveContext(E,plays,[{key:'down',value:'3'},{key:'distanceBucket',value:'Short'},{key:'formation',value:'Bunch Right'},{key:'hash',value:'Right'}],()=>false);
assert.strictEqual(broad.broadened,true,'missing exact context should broaden automatically');
assert(broad.plays.length>0,'broadened context should still produce useful data');
const trends=IQ.trendSignals(E,plays,()=>false);
assert(trends.some(x=>x.label==='Blitz'&&x.delta>=50),'recent blitz increase should be detected');
const suggested=IQ.suggestDimensions(E,subset,filters,()=>false);
assert(suggested.some(x=>x.key==='formation'),'formation should be available as a deeper split');
assert(suggested.some(x=>x.key==='blitz'),'blitz should be available as a deeper split');
const merged=IQ.mergeFilters([{key:'front',value:'3'}],[{key:'front',value:'4'},{key:'coverage',value:'Cover 1'}]);
assert.strictEqual(merged.filter(x=>x.key==='front').length,1,'same-category drilldown should replace instead of conflict');
assert.strictEqual(merged.find(x=>x.key==='front').value,'4');
assert.strictEqual(IQ.pinKey([{key:'hash',value:'Left'},{key:'down',value:'3'}]),IQ.pinKey([{key:'down',value:'3'},{key:'hash',value:'Left'}]),'pin identity should ignore filter order');
assert.strictEqual(IQ.deltaText(44),'↑44 vs overall');
assert.strictEqual(IQ.deltaText(-25),'↓25 vs overall');
console.log('Game IQ 2.0 tests passed');
