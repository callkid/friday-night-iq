const E=require('./game-engine.js'),R=require('./analytics-relations.js');
function assert(x,m){if(!x)throw new Error(m)}
function p(i,formation,type,yards,pressure){return{number:i,drive:1,quarter:'Q1',down:1,distance:10,fieldSide:'OWN',yardLine:25,formation,playType:type,yards,pressure,front:'4',safeties:'2',box:'6',coverage:'Cover 4',postCoverage:'NA',attackDetail:type==='Run'?'Inside':'Short',concept:'',tags:[],penalty:null}}
const plays=[
 p(1,'Trips','Run',10,'5M'),p(2,'Trips','Run',8,'4B'),p(3,'Trips','Run',3,'None'),p(4,'Trips','Run',3,'None'),
 p(5,'Trips','Pass',5,'None'),p(6,'Trips','Pass',5,'None'),p(7,'2x2','Run',2,'None'),p(8,'2x2','Pass',2,'None')
];
const rows=R.relatedRows(E,plays,'Trips',x=>x.formation==='Trips');
for(const label of ['Trips','Trips vs Blitz','Trips Run','Trips Run vs Blitz','Trips Pass'])assert(rows.some(r=>r.label===label),label+' split missing');
const rb=rows.find(r=>r.label==='Trips Run vs Blitz');assert(rb.n===2&&rb.ypp===9,'Trips Run vs Blitz math wrong');
const edges=R.buildEdges(E,plays),edge=edges.find(x=>x.label==='Trips Run vs Blitz');assert(edge,'early Trips Run vs Blitz edge missing');assert(edge.confidence==='LOW','two-play edge should be LOW confidence');
console.log('Friday Night IQ relational analytics tests passed');
