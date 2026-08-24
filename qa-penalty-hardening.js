const E=require('./game-engine.js');
const P=require('./penalty-hardening.js');
function assert(x,m){if(!x)throw new Error(m)}
function next(play,override){return E.nextSituation(P.normalizePlay(JSON.parse(JSON.stringify(play)),!!override))}
let p={quarter:'Q2',down:2,distance:2,fieldSide:'OWN',yardLine:25,drive:2,playType:'Penalty',yards:0,tags:[],penalty:{type:'False Start',team:'Offense',status:'Accepted',distance:5,effect:'COUNT',timing:'DEAD',yards:-5}};
let n=next(p,false);
assert(n.down===2&&n.distance===7&&n.fieldSide==='OWN'&&n.yardLine===20,'False Start from 2nd & 2 must become 2nd & 7, not 3rd & 7');
assert(P.normalizePlay(JSON.parse(JSON.stringify(p)),false).penalty.effect==='REPEAT','False Start must force repeat down');
p={quarter:'Q1',down:1,distance:10,fieldSide:'OWN',yardLine:30,drive:1,playType:'Penalty',yards:0,tags:[],penalty:{type:'Delay of Game',team:'Offense',status:'Accepted',distance:5,effect:'COUNT',timing:'DEAD',yards:-5}};
n=next(p,false);assert(n.down===1&&n.distance===15&&n.yardLine===25,'Delay of Game must repeat 1st down and add five to distance');
p={quarter:'Q3',down:3,distance:4,fieldSide:'OWN',yardLine:30,drive:4,playType:'Penalty',yards:0,tags:[],penalty:{type:'Offside',team:'Defense',status:'Accepted',distance:5,effect:'COUNT',timing:'DEAD',yards:5}};
n=next(p,false);assert(n.down===1&&n.fieldSide==='OWN'&&n.yardLine===35,'Defensive Offside crossing the line to gain must award a first down');
p={quarter:'Q2',down:2,distance:7,fieldSide:'OWN',yardLine:40,drive:2,playType:'Penalty',yards:0,tags:[],penalty:{type:'Encroachment',team:'Defense',status:'Accepted',distance:5,effect:'COUNT',timing:'DEAD',yards:5}};
n=next(p,false);assert(n.down===2&&n.distance===2&&n.yardLine===45,'Encroachment must repeat down with five-yard enforcement');
p={quarter:'Q2',down:2,distance:2,fieldSide:'OWN',yardLine:25,drive:2,playType:'Penalty',yards:0,tags:[],penalty:{type:'False Start',team:'Offense',status:'Accepted',distance:5,effect:'COUNT',timing:'DEAD',yards:-5}};
n=next(p,true);assert(n.down===3&&n.distance===7,'Advanced official override must remain possible');
assert(P.ruleFor('False Start').effect==='REPEAT'&&P.ruleFor('Delay of Game').distance===5,'preset contract missing');
console.log('Penalty hardening regression tests passed');
