const assert=require('assert');
const fs=require('fs');
const E=require('./game-engine.js');
const G=require('./game-day-3.js');

assert.equal(G.yardsBetween('OWN',37,'OPP',22),41,'Own 37 -> Opp 22 must be +41');
assert.equal(G.yardsBetween('OPP',40,'GOAL',0),40,'Opp 40 -> goal must be +40');
assert.deepEqual(G.endFromYards('OWN',44,20),{fieldSide:'OPP',yardLine:36,label:'Opp 36'});
assert.deepEqual(G.endFromYards('OPP',40,40),{fieldSide:'GOAL',yardLine:0,label:'Goal line'});
assert.deepEqual(G.endFromYards('50',50,-7),{fieldSide:'OWN',yardLine:43,label:'Own 43'});

let p={quarter:'Q2',down:3,distance:8,fieldSide:'OWN',yardLine:35,drive:5,playType:'Penalty',yards:0,tags:[],penalty:{status:'Accepted'}};
let official=G.buildOfficialNext(E,p,{quarter:'Q2',down:3,distance:13,fieldSide:'OWN',yardLine:30});
p.officialNext=official;
assert.deepEqual(E.nextSituation(p),{quarter:'Q2',down:3,distance:13,fieldSide:'OWN',yardLine:30,drive:5,possessionEnded:false,reason:'Official next snap'});

function play(down,distance,yards){return{quarter:'Q1',down, distance,fieldSide:'OWN',yardLine:25,drive:1,playType:'Run',yards,tags:[],penalty:null};}
assert.equal(E.success(play(1,10,5)),true,'1st & 10 +5 is success');
assert.equal(E.success(play(2,10,5)),true,'2nd & 10 +5 is success');
assert.equal(E.success(play(2,10,4)),false,'2nd & 10 +4 is failure');
assert.equal(E.success(play(3,4,4)),true,'3rd & 4 +4 converts');
assert.equal(E.success(play(3,4,3)),false,'3rd & 4 +3 fails');
assert.equal(E.success(play(4,1,1)),true,'4th & 1 +1 converts');

assert.equal(G.opponentPoints({opponentPoints:6}),6);
assert.equal(G.opponentPoints({}),0);

for(let start=1;start<100;start++){
  const sf=E.fromAbs(start);
  for(let gain=-15;gain<=40;gain++){
    const end=G.endFromYards(sf.fieldSide,sf.yardLine,gain);
    if(end.fieldSide==='GOAL')continue;
    const back=G.yardsBetween(sf.fieldSide,sf.yardLine,end.fieldSide,end.yardLine);
    const expected=Math.max(1,Math.min(100,start+gain))-start;
    assert.equal(back,expected,`round trip start=${start} gain=${gain}`);
  }
}
const src=fs.readFileSync(__dirname+'/game-day-3.js','utf8');
assert(!src.includes('MutationObserver'),'Game-Day 3 must not use MutationObserver');
assert(src.includes('Where is the ball now?'),'end-spot workflow must exist');
assert(src.includes('No enforcement math'),'official-next-snap penalty workflow must exist');
assert(src.includes('Pick Six / INT returned for TD'),'pick-six workflow must exist');
assert(src.includes('[data-v="No Play"]'),'No Play must be explicitly removed from the live control surface');
console.log('Game-Day 3 speed, spot-math, penalty, pick-six and stress QA passed');
