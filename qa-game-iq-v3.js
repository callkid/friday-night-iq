const assert=require('assert');
const fs=require('fs');
const crypto=require('crypto');
const E=require('./game-engine.js');
const IQ=require('./game-iq-v3.js');
function mk(n,o={}){return Object.assign({number:n,drive:1,quarter:'Q1',down:1,distance:10,fieldSide:'OWN',yardLine:25,front:'3',safeties:'2',box:'NA',formation:'Trips Right',coverage:'NA',postCoverage:'NA',playType:'Run',player:'Unknown / N/A',passResult:'',attackDetail:'NA',yards:5,tags:[],personnel:'11',motion:'NA',pressure:'None',direction:'NA',hash:'Left',concept:'',conceptFamily:'NA',penalty:null},o)}
const plays=[
 mk(1,{down:1,distance:10,yards:5}),mk(2,{down:2,distance:10,yards:5}),mk(3,{down:3,distance:5,yards:5}),mk(4,{down:3,distance:5,yards:4}),
 mk(5,{playType:'Pass',passResult:'Complete',yards:20,formation:'Trips Left'}),mk(6,{playType:'Pass',passResult:'Incomplete',yards:0,formation:'Trips Left'}),mk(7,{playType:'Pass',passResult:'Interception',yards:0,tags:['Interception','Turnover']}),
 mk(8,{down:1,distance:15,yards:7,hash:'Right'}),mk(9,{playType:'Run',yards:12,tags:[]}),mk(10,{playType:'Pass',passResult:'Complete',yards:16})
];
const settings={explosiveRun:12,explosivePass:16};
assert.equal(E.success(plays[1]),true,'2nd-down 50% rule');
assert.equal(IQ.isExplosive(E,plays[8],settings),true,'12+ run explosive');
assert.equal(IQ.isExplosive(E,plays[9],settings),true,'16+ pass explosive');
assert.equal(IQ.isExplosive(E,mk(11,{playType:'Pass',passResult:'Complete',yards:15}),settings),false,'15-yard pass is not explosive');
const s=IQ.gameSummary(E,plays,settings);assert.equal(s.plays,10);assert.equal(s.passing.attempts,4);assert.equal(s.passing.completions,2);assert.equal(s.passing.ints,1);assert.equal(s.third.attempts,2);assert.equal(s.third.made,1);assert.equal(s.third.rate,50);
let f=[];f=IQ.mergeFilter(f,{key:'coverage',value:'Cover 2'});f=IQ.mergeFilter(f,{key:'coverage',value:'Cover 3'});assert.deepEqual(f,[{key:'coverage',value:'Cover 3'}],'same-dimension filters replace instead of conflict');
let cat=IQ.catalog(E,plays,settings),parsed=IQ.parseQuery(cat,'3rd short left hash blitz pass');let map=Object.fromEntries(parsed.map(x=>[x.key,x.value]));assert.equal(map.down,'3');assert.equal(map.distanceBucket,'Short');assert.equal(map.hash,'Left');assert.equal(map.blitz,'Yes');assert.equal(map.playType,'Pass');assert.equal(map.firstDownSituation,undefined,'3rd short must never create a 1st-down filter');
let first10=IQ.filterPlays(E,plays,[{key:'firstDownSituation',value:'Ten'}],settings),firstLong=IQ.filterPlays(E,plays,[{key:'firstDownSituation',value:'Long'}],settings);assert(first10.every(p=>p.down===1&&p.distance===10));assert(firstLong.every(p=>p.down===1&&p.distance>10));
for(let i=0;i<1000;i++){let q=IQ.filterPlays(E,plays,[{key:'down',value:'3'},{key:'distanceBucket',value:'Medium'}],settings);assert.equal(q.length,2);IQ.gameSummary(E,q,settings);IQ.groupRows(E,q,'formation',settings);}
const src=fs.readFileSync(__dirname+'/game-iq-v3.js','utf8');assert(!src.includes('MutationObserver'),'Game IQ 3 must not use MutationObserver');assert(src.includes('A.getIQFilters'),'canonical filter getter must exist');assert(src.includes('A.setIQFilters'),'canonical filter setter must exist');assert(src.includes('1st & 10'),'1st & 10 shortcut must exist');assert(src.includes('One-glance game stats'),'headset-ready summary must exist');
if(process.argv[2]){
 const raw=fs.readFileSync(process.argv[2]),hash=crypto.createHash('sha256').update(raw).digest('hex'),backup=JSON.parse(raw),before=JSON.stringify(backup.state.plays),gs=IQ.gameSummary(E,backup.state.plays,backup.state.settings);
 assert.equal(backup.playCount,70);assert.equal(backup.state.plays.length,70);assert.equal(hash,'92341587263c2d9d097f315b9121ed4acc70141174b67dad0c1187adaaf1de5d','golden file fingerprint changed');
 assert.equal(gs.plays,68);assert.equal(gs.passing.completions,22);assert.equal(gs.passing.attempts,42);assert.equal(gs.passing.yards,238);assert.equal(gs.rushing.carries,26);assert.equal(gs.rushing.yards,35);assert.equal(gs.third.made,10);assert.equal(gs.third.attempts,17);assert.equal(gs.third.rate,59);
 IQ.filterPlays(E,backup.state.plays,[{key:'firstDownSituation',value:'Ten'}],backup.state.settings);IQ.groupRows(E,backup.state.plays,'formation',backup.state.settings);assert.equal(JSON.stringify(backup.state.plays),before,'analysis mutated golden plays');
 console.log('Golden Skyridge game regression passed: 70 plays preserved and analytics stable');
}
console.log('Game IQ 3 canonical filters, stats, success, explosives and 1000-cycle stress QA passed');
