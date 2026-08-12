const P=require('./game-iq-polish.js');
function assert(x,m){if(!x)throw new Error(m);}
function play(n,o){return Object.assign({number:n,down:1,distance:10,front:'4',coverage:'Cover 3',postCoverage:'Same as pre-snap',pressure:'None',playType:'Run',attackDetail:'Inside Zone',conceptFamily:'Run',concept:'IZ',yards:4,tags:[],penalty:null,fieldSide:'OWN',yardLine:30,scoreBefore:{us:0,them:0}},o||{});}
assert(P.firstDownSituation(1,10)==='Ten','1st and 10 classification wrong');
assert(P.firstDownSituation(1,11)==='Long','1st and long classification wrong');
assert(P.firstDownSituation(1,18)==='Long','deep 1st and long classification wrong');
assert(P.firstDownSituation(1,9)==='Medium','1st and medium classification wrong');
assert(P.firstDownSituation(1,3)==='Short','1st and short classification wrong');
assert(P.firstDownSituation(2,10)===null,'non-first down should not use first-down classifier');
assert(P.situationLabel(1,10)==='1st & 10','1st and 10 label wrong');
assert(P.situationLabel(1,14)==='1st & Long','1st and long label wrong');
assert(P.situationLabel(3,2)==='3rd & Short','third-short label wrong');
const plays=[
 play(1,{distance:10,front:'4'}),play(2,{distance:10,front:'4'}),
 play(3,{distance:12,front:'3'}),play(4,{distance:15,front:'3'}),
 play(5,{distance:9,front:'4'}),play(6,{distance:2,front:'5'}),
 play(7,{down:2,distance:6,front:'4'}),play(8,{down:3,distance:9,front:'3'})
];
assert(P.specialMatches(plays[0],'Ten')&&!P.specialMatches(plays[2],'Ten'),'1st and 10 special match wrong');
assert(P.specialMatches(plays[2],'Long')&&!P.specialMatches(plays[0],'Long'),'1st and long must exclude exact 10');
const fakeA={E:{success:()=>true,isFirstDownResult:()=>false,officialNetYards:p=>p.yards}};
const ten=P.filterPlays(fakeA,plays,[{key:'firstDownSituation',value:'Ten'}]);
const lng=P.filterPlays(fakeA,plays,[{key:'firstDownSituation',value:'Long'}]);
assert(ten.length===2&&ten.every(p=>p.distance===10),'1st and 10 filtered set wrong');
assert(lng.length===2&&lng.every(p=>p.distance>10),'1st and long filtered set wrong');
const groups=P.coachSituationGroups(plays);
const g10=groups.find(g=>g.key==='1|Ten'),gl=groups.find(g=>g.key==='1|Long');
assert(g10&&g10.label==='1st & 10'&&g10.plays.length===2,'coach shortcut 1st and 10 wrong');
assert(gl&&gl.label==='1st & Long'&&gl.plays.length===2,'coach shortcut 1st and long wrong');
console.log('Game IQ situation and Saved Views polish tests passed');
