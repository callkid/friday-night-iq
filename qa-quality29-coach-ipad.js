const assert=require('assert');
const E=require('./game-engine.js');
const Q=require('./quality29-coach-ipad.js');

// Coach-reported goal-line regression: 2nd & goal from the 8, +5 is NOT a touchdown/new drive.
const goalPlay={number:10,drive:3,quarter:'Q3',down:2,distance:8,fieldSide:'OPP',yardLine:8,playType:'Run',yards:5,tags:[]};
const goalNext=E.nextSituation(goalPlay);
assert.equal(goalNext.possessionEnded,false,'2nd & goal from Opp 8 +5 must keep the drive alive');
assert.equal(goalNext.down,3);
assert.equal(goalNext.distance,3);
assert.equal(goalNext.fieldSide,'OPP');
assert.equal(goalNext.yardLine,3);

// A stale possession gate must repair itself if the upcoming situation was explicitly corrected.
const stale={plays:[goalPlay],drive:4,current:{quarter:'Q3',down:3,distance:3,fieldSide:'OPP',yardLine:3},awaitingPossessionStart:true};
assert.equal(Q.repairPossessionGate(stale,E),true,'stale new-drive gate should be repaired');
assert.equal(stale.awaitingPossessionStart,false);
assert.equal(stale.drive,3,'same-drive correction should restore the original drive number');

// A genuinely ended drive must still require a new possession start.
const td={number:11,drive:3,quarter:'Q3',down:3,distance:3,fieldSide:'OPP',yardLine:3,playType:'Run',yards:3,tags:[]};
const tdNext=E.nextSituation(td);
assert.equal(tdNext.possessionEnded,true);
const ended={plays:[td],drive:4,current:{quarter:tdNext.quarter,down:tdNext.down,distance:tdNext.distance,fieldSide:tdNext.fieldSide,yardLine:tdNext.yardLine},awaitingPossessionStart:true};
assert.equal(Q.repairPossessionGate(ended,E),false,'real touchdowns must still hold the new-drive gate');
assert.equal(ended.awaitingPossessionStart,true);

// Score reset is deterministic and does not touch any other state.
const scored={score:{us:27,them:14},plays:[{number:1}],drive:2};
Q.clearScore(scored);
assert.deepEqual(scored.score,{us:0,them:0});
assert.equal(scored.plays.length,1);
assert.equal(scored.drive,2);

// Added quick stats are computed only from saved plays, without schema changes.
const plays=[
 {number:1,drive:1,fieldSide:'OWN',yardLine:25,playType:'Run',tags:[]},
 {number:2,drive:1,fieldSide:'OWN',yardLine:30,playType:'Pass',passResult:'Complete',tags:[]},
 {number:3,drive:2,fieldSide:'OPP',yardLine:40,playType:'Pass',passResult:'Interception',tags:['Turnover']},
 {number:4,drive:3,fieldSide:'OWN',yardLine:20,playType:'Run',tags:['Fumble Lost','Turnover']}
];
const ds=Q.driveStats(E,plays);
assert.equal(ds.drives,3);
assert.equal(ds.turnovers,2);
assert(Math.abs(ds.avgStartAbs-45)<1e-9,'average drive start absolute field position should be 45');
assert.equal(Q.formatField(E,ds.avgStartAbs),'Own 45');

console.log('QUALITY29 COACH/IPAD SOURCE PASS: goal-line continuation, stale-drive repair, true-drive gate, score reset, and added quick stats');
