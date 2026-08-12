const Q=require('./qb-setup.js');
const F=require('./game-iq-facets.js');
const E=require('./game-engine.js');
function assert(x,m){if(!x)throw new Error(m);}
const roster=[{number:'2',name:'Mason Smith',position:'QB'},{number:'7',name:'Ty Jones',position:'WR'},{number:'12',name:'Luke Hall',position:'qb'}];
const q=Q.quarterbacks(roster);
assert(q.length===2,'QB list should include only QB positions');
assert(q[0].value==='#2 Mason Smith','QB should display number + name');
assert(q[1].value==='#12 Luke Hall','QB position matching should be case-insensitive');
const plays=[
 {down:3,distance:2,fieldSide:'OWN',yardLine:30,formation:'Trips Right',front:'4',coverage:'Cover 1',postCoverage:'Cover 1',pressure:'5M',hash:'Left',playType:'Pass',attackDetail:'Short',safeties:'1',box:'6',personnel:'11',motion:'H-Jet',conceptFamily:'Short Game',concept:'Stick',direction:'Right',drive:1,quarter:'Q1',yards:7,tags:[]},
 {down:3,distance:2,fieldSide:'OWN',yardLine:40,formation:'Trips Right',front:'4',coverage:'Cover 3',postCoverage:'Cloud 3',pressure:'None',hash:'Right',playType:'Run',attackDetail:'Inside Zone',safeties:'2',box:'6',personnel:'11',motion:'NA',conceptFamily:'Run',concept:'Inside Zone',direction:'Left',drive:1,quarter:'Q1',yards:4,tags:[]},
 {down:2,distance:6,fieldSide:'OPP',yardLine:35,formation:'Bunch Left',front:'3',coverage:'Cover 2',postCoverage:'Cover 2',pressure:'5M',hash:'Left',playType:'Pass',attackDetail:'Intermediate',safeties:'2',box:'5',personnel:'10',motion:'Y-Jet',conceptFamily:'Drop Back',concept:'Mesh',direction:'Middle',drive:2,quarter:'Q2',yards:18,tags:['Explosive']}
];
const down=F.DEFS.find(x=>x.key==='down'),hash=F.DEFS.find(x=>x.key==='hash'),front=F.DEFS.find(x=>x.key==='front');
let counts=F.facetCounts(E,plays,[],down,p=>p.tags.includes('Explosive'));
assert(counts.find(x=>x.value==='3').count===2,'3rd-down facet count should be 2');
counts=F.facetCounts(E,plays,[{key:'down',value:'3'}],hash,p=>p.tags.includes('Explosive'));
assert(counts.find(x=>x.value==='Left').count===1&&counts.find(x=>x.value==='Right').count===1,'hash counts should respond to active down filter');
counts=F.facetCounts(E,plays,[{key:'down',value:'3'},{key:'hash',value:'Left'}],front,p=>p.tags.includes('Explosive'));
assert(counts.find(x=>x.value==='4').count===1,'front count should honor stacked filters');
const filtered=F.filterPlays(E,plays,[{key:'down',value:'3'},{key:'hash',value:'Left'},{key:'blitz',value:'Yes'},{key:'playType',value:'Pass'}],p=>p.tags.includes('Explosive'));
assert(filtered.length===1&&filtered[0].formation==='Trips Right','deep faceted query should isolate correct play');
console.log('Setup QB and Game IQ facet tests passed');
