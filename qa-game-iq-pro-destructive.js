'use strict';
const assert=require('assert');
const IQ=require('./game-iq-pro.js');
const E={
 fieldAbs:(side,y)=>side==='50'?50:side==='OWN'?Number(y):100-Number(y),
 officialNetYards:p=>Number(p.yards)||0,
 success:p=>(Number(p.yards)||0)>=Math.max(1,Number(p.distance)||10)*(p.down===1?.5:p.down===2?.7:1),
 isFirstDownResult:p=>(Number(p.yards)||0)>=(Number(p.distance)||10)
};
function make(i){
 const drive=Math.floor((i-1)/8)+1;
 const late=drive>=5;
 const third=i%3!==0;
 const short=third?((i%3)+1):6;
 const trips=i%4!==0;
 const left=i%5!==0;
 const blitz=late||i%6===0;
 const cover=late?'Cover 1':(i%2?'Cover 3':'Cover 1');
 const front=trips?'4':'3';
 const pass=i%2===0;
 const counter=!pass&&i%3!==0;
 const yards=counter?8:(pass&&blitz?3:5);
 return{number:i,drive,quarter:drive<=3?'Q1':'Q2',down:third?3:2,distance:short,fieldSide:'OWN',yardLine:35,hash:left?'Left':'Right',formation:trips?'Trips Right':'Doubles Right',personnel:'11',motion:i%7===0?'H-Jet':'',front,safeties:cover==='Cover 1'?'1':'2',box:'6',coverage:cover,postCoverage:'Same as pre-snap',pressure:blitz?'5M':'None',playType:pass?'Pass':'Run',attackDetail:pass?'Short':'Counter',conceptFamily:pass?'Short Game':'Run',concept:pass?'Stick':'Counter',direction:left?'Left':'Right',yards,tags:[]};
}
const plays=Array.from({length:48},(_,i)=>make(i+1));
plays[47].passResult='Interception';plays[47].tags=['Interception','Turnover'];
const chain=[{key:'down',value:'3'},{key:'distanceBucket',value:'Short'},{key:'hash',value:'Left'},{key:'formation',value:'Trips Right'},{key:'blitz',value:'Yes'},{key:'playType',value:'Pass'}];
const exact=IQ.filterPlays(E,plays,chain,()=>false);
assert(exact.length>0,'deep coach question should return matching plays');
exact.forEach(p=>{assert.strictEqual(p.down,3);assert(Number(p.distance)<=3);assert.strictEqual(p.hash,'Left');assert.strictEqual(p.formation,'Trips Right');assert.notStrictEqual(p.pressure,'None');assert.strictEqual(p.playType,'Pass');});
const coverage=IQ.distribution(E,exact,'coverage',()=>false);
assert(coverage.every(r=>r.value!=='Same as pre-snap'),'resolved coverage should never fragment into Same as pre-snap');
assert(coverage.some(r=>r.value==='Cover 1'||r.value==='Cover 3'));
const comparison=IQ.compareDistribution(E,exact,plays,'coverage',()=>false);
assert(comparison.some(r=>r.delta!==0),'deep context should produce a meaningful baseline comparison');
const trends=IQ.trendSignals(E,plays,()=>false);
assert(trends.some(r=>r.label==='Blitz'&&r.delta>0),'late-game blitz change should be detected');
const answers=IQ.bestAnswers(E,exact);
answers.best.concat(answers.worst).forEach(x=>assert(x.n>=2,'offensive recommendations must require repeated evidence'));
const resultRows=IQ.distribution(E,[plays[47]],'result',()=>false);
assert(resultRows.some(r=>r.value==='Interception'),'interception should be recognized as a drilldown result');
assert(resultRows.some(r=>r.value==='Turnover'),'interception should also remain a turnover');
let filters=chain.slice(0,4);
filters=IQ.mergeFilters(filters,[{key:'front',value:'4'}]);
filters=IQ.mergeFilters(filters,[{key:'coverage',value:'Cover 1'}]);
filters=IQ.mergeFilters(filters,[{key:'coverage',value:'Cover 3'}]);
assert.strictEqual(filters.filter(f=>f.key==='coverage').length,1,'drilldown history should never create conflicting same-dimension filters');
assert.strictEqual(filters.find(f=>f.key==='coverage').value,'Cover 3');
const narrowed=IQ.filterPlays(E,plays,filters,()=>false);
assert(narrowed.every(p=>p.front==='4'&&IQ.resolvedCoverage(p)==='Cover 3'));
const suggestions=IQ.suggestDimensions(E,plays,[{key:'down',value:'3'},{key:'distanceBucket',value:'Short'}],()=>false).map(x=>x.key);
assert(suggestions.includes('formation')&&suggestions.includes('hash'),'high-value context splits should be suggested automatically');
console.log('Game IQ 2.0 destructive question-chain simulation passed');
