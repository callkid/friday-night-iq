const assert=require('assert');
const fs=require('fs');
const S=require('./game-iq-search.js');
const F=require('./game-iq-facets.js');
const P=require('./game-iq-pro.js');
const E={fieldAbs:(side,y)=>side==='OPP'?100-Number(y):side==='50'?50:Number(y),success:p=>Number(p.yards)>=Number(p.distance)/2,isFirstDownResult:p=>Number(p.yards)>=Number(p.distance),officialNetYards:p=>Number(p.yards)||0};
const fronts=['3','4','5'],covs=['Cover 1','Cover 2','Cover 3','Cover 4'],press=['None','5M','4F'];
const plays=[];
for(let i=0;i<240;i++){
 const down=(i%4)+1;
 const distance=down===1?[10,12,6,3][Math.floor(i/4)%4]:[2,6,10][i%3];
 plays.push({number:i+1,drive:Math.floor(i/8)+1,quarter:'Q'+((Math.floor(i/60)%4)+1),down,distance,fieldSide:i%3===0?'OPP':'OWN',yardLine:20+(i%29),hash:['Left','Middle','Right'][i%3],formation:['Trips Right','Doubles Left','Bunch Right'][i%3],personnel:'11',motion:'NA',front:fronts[i%3],safeties:String(i%3),box:String(5+(i%4)),coverage:covs[i%4],postCoverage:i%2?'Same as pre-snap':covs[(i+1)%4],pressure:press[i%3],playType:i%2?'Pass':'Run',attackDetail:i%2?'Short':'Inside Zone',conceptFamily:i%2?'Short Game':'Run',concept:'NA',direction:['Left','Middle','Right'][i%3],yards:(i%17)-3,tags:[]});
}
const original=JSON.stringify(plays);
const baseline=JSON.stringify(S.downDistanceRows(E,plays));
for(let i=0;i<1000;i++){
 assert.equal(JSON.stringify(S.downDistanceRows(E,plays)),baseline,'Shortcut grouping changed between identical renders');
 const ten=S.filterPlays(E,plays,[{key:'firstDownSituation',value:'Ten'}]);
 const long=S.filterPlays(E,plays,[{key:'firstDownSituation',value:'Long'}]);
 assert(ten.every(p=>p.down===1&&p.distance===10));
 assert(long.every(p=>p.down===1&&p.distance>10));
 const frontDef=F.DEFS.find(d=>d.key==='front');
 const fc=F.facetCounts(E,plays,[{key:'firstDownSituation',value:'Ten'}],frontDef);
 assert(fc.every(x=>Number.isFinite(x.count)));
 const pc=P.filterPlays(E,plays,[{key:'firstDownSituation',value:'Ten'}]);
 assert.equal(pc.length,ten.length);
}
assert.equal(JSON.stringify(plays),original,'Analytics computation mutated play data');
const facetSrc=fs.readFileSync('game-iq-facets.js','utf8');
const proSrc=fs.readFileSync('game-iq-pro.js','utf8');
const polishSrc=fs.readFileSync('game-iq-polish.js','utf8');
assert(!polishSrc.includes('MutationObserver'));
assert((proSrc.match(/MutationObserver/g)||[]).length<=2,'Pro observers unexpectedly multiplied');
assert((facetSrc.match(/MutationObserver/g)||[]).length===1,'Facets should observe only filter chips');
console.log('Game IQ stability stress QA passed: 1000 deterministic recomputation cycles');
