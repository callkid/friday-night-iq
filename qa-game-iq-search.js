const E=require('./game-engine.js');
const Q=require('./game-iq-search.js');
function assert(x,m){if(!x)throw new Error(m);}
function p(n,o){return Object.assign({number:n,drive:1,quarter:'Q1',down:1,distance:10,fieldSide:'OWN',yardLine:30,hash:'Middle',formation:'Doubles Right',personnel:'11',motion:'NA',front:'4',safeties:'2',box:'6',coverage:'Cover 4',postCoverage:'Cover 4',pressure:'None',playType:'Run',attackDetail:'Inside Zone',conceptFamily:'Run',concept:'IZ',direction:'Right',yards:4,tags:[],penalty:null,scoreBefore:{us:0,them:0}},o||{});}
const plays=[
 p(1,{down:3,distance:2,hash:'Left',formation:'Trips Right',front:'4',coverage:'Cover 1',postCoverage:'Cover 1',pressure:'5M',playType:'Pass',attackDetail:'Short',conceptFamily:'Short Game',concept:'Stick',yards:8}),
 p(2,{down:3,distance:3,hash:'Left',formation:'Trips Right',front:'4',coverage:'Cover 1',postCoverage:'Cloud 3',pressure:'5M',playType:'Pass',attackDetail:'Short',conceptFamily:'Short Game',concept:'Mesh',yards:5}),
 p(3,{down:3,distance:2,hash:'Right',formation:'Trips Right',front:'3',coverage:'Cover 4',postCoverage:'Cover 4',pressure:'None',playType:'Run',attackDetail:'Counter',conceptFamily:'Run',concept:'GT Counter',yards:2}),
 p(4,{down:2,distance:6,hash:'Left',formation:'Doubles Right',front:'4',coverage:'Cover 3',postCoverage:'Cover 3',pressure:'None',playType:'Run',attackDetail:'Inside Zone',conceptFamily:'Run',yards:7}),
 p(5,{down:3,distance:2,hash:'Left',formation:'Trips Right',front:'4',coverage:'Cover 0',postCoverage:'Cover 0',pressure:'6M',playType:'Run',attackDetail:'Power',conceptFamily:'Run',yards:6}),
 p(6,{down:3,distance:9,hash:'Left',formation:'Trips Left',front:'3',coverage:'Cover 4',postCoverage:'Cover 4',pressure:'4M',playType:'Pass',attackDetail:'Deep',conceptFamily:'Drop Back',yards:18})
];
const catalog=Q.buildCatalog(E,plays,x=>x.playType==='Run'?x.yards>=12:x.playType==='Pass'?x.yards>=16:false);
function get(key,value){const x=catalog.find(z=>z.key===key&&z.value===value);assert(x,'missing catalog filter '+key+'='+value);return x;}
const filters=[get('down','3'),get('distanceBucket','Short'),get('hash','Left'),get('blitz','Yes'),get('playType','Pass')];
const rows=Q.filterPlays(E,plays,filters);
assert(rows.length===2&&rows.every(x=>x.number===1||x.number===2),'3rd short left hash blitz pass query wrong');
const fronts=Q.groupRows(E,rows,'front');assert(fronts.length===1&&fronts[0].value==='4'&&fronts[0].n===2,'front answer wrong');
const coverage=Q.groupRows(E,rows,'coverage');assert(coverage.some(x=>x.value==='Cover 1')&&coverage.some(x=>x.value==='Cloud 3'),'coverage answer wrong');
const pressures=Q.groupRows(E,rows,'pressure');assert(pressures.length===1&&pressures[0].value==='5M'&&pressures[0].n===2,'most common blitz answer wrong');
const parsed=Q.parseQuery(catalog,'3rd short left hash blitz pass',[]);
const pk=parsed.map(x=>x.key+'='+x.value);
assert(pk.includes('down=3'),'phrase search missed 3rd down');
assert(pk.includes('distanceBucket=Short'),'phrase search missed short');
assert(pk.includes('hash=Left'),'phrase search missed left hash');
assert(pk.includes('blitz=Yes'),'phrase search missed blitz');
assert(pk.includes('playType=Pass'),'phrase search missed pass');
const dd=Q.downDistanceRows(E,plays);assert(dd.some(x=>x.key==='3|Short'&&x.n===4),'down-distance shortcut wrong');
const fr=Q.formationRows(E,plays);const trips=fr.find(x=>x.key==='Trips Right');assert(trips&&trips.n===4&&trips.front.includes('4 Down'),'formation shortcut wrong');
const tripFilters=[get('formation','Trips Right'),get('blitz','Yes'),get('playType','Run')];
const tripRunBlitz=Q.filterPlays(E,plays,tripFilters);assert(tripRunBlitz.length===1&&tripRunBlitz[0].attackDetail==='Power','formation + blitz + run relation wrong');
console.log('Game IQ search tests passed');
