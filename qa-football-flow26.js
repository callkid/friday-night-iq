'use strict';
const assert=require('assert');
const E=require('./game-engine.js');
const Q=require('./football-flow26.js');
function play(s,pen){return Object.assign({quarter:'Q2',drive:1,playType:'Penalty',yards:0,tags:[]},s,{penalty:pen});}
function accepted(type,extra){const r=Q.standardRule(type);return Object.assign({type:type,team:r.team,status:r.status,distance:r.distance,effect:r.effect,timing:r.timing,netOverride:null,yards:0},extra||{});}
function next(s,pen){return E.nextSituation(Q.normalizePenaltyPlay(play(s,pen)));}
assert(Q.RULES.Holding,'Holding quick rule missing');
assert.strictEqual(Q.RULES.Holding.team,'Offense');
assert.strictEqual(Q.RULES.Holding.distance,10);
assert.strictEqual(Q.RULES.Holding.timing,'LIVE');
assert.strictEqual(Q.RULES.Holding.effect,'COUNT','Holding is live-ball: the down must count');
assert.strictEqual(Q.attackLabel('Counter'),'Counter');
assert.strictEqual(Q.attackLabel('Power'),'Power');
assert.strictEqual(Q.attackLabel('Inside Zone'),'Inside Zone');
assert.strictEqual(Q.attackLabel('Outside Zone'),'Outside Zone');
assert.strictEqual(Q.derivedConcept('Run','Counter'),'Run');
assert.strictEqual(Q.derivedConcept('Pass','Screen'),'Screen');
assert.strictEqual(Q.derivedConcept('Pass','Deep'),'NA');
// Holding at Opp 47: standard 10 against offense, live-ball down counts.
let pen=accepted('Holding'),p=Q.normalizePenaltyPlay(play({down:1,distance:10,fieldSide:'OPP',yardLine:47},pen));
assert.strictEqual(p.penalty.yards,-10);
let n=E.nextSituation(p);assert.deepStrictEqual([n.down,n.distance,n.fieldSide,n.yardLine],[2,20,'OWN',43]);
// Permanent false-start regression: dead ball, repeat 2nd down.
n=next({down:2,distance:2,fieldSide:'OWN',yardLine:25},accepted('False Start'));
assert.deepStrictEqual([n.down,n.distance,n.fieldSide,n.yardLine],[2,7,'OWN',20]);
// Half the distance at our 8 for offensive holding: -4, then down counts.
p=Q.normalizePenaltyPlay(play({down:1,distance:10,fieldSide:'OWN',yardLine:8},accepted('Holding')));
assert.strictEqual(p.penalty.yards,-4);assert.strictEqual(p.penalty.halfDistance,true);
n=E.nextSituation(p);assert.deepStrictEqual([n.down,n.distance,n.fieldSide,n.yardLine],[2,14,'OWN',4]);
// Half the distance for defensive 5-yard dead-ball foul near opponent goal.
p=Q.normalizePenaltyPlay(play({down:2,distance:4,fieldSide:'OPP',yardLine:6},accepted('Offside')));
assert.strictEqual(p.penalty.yards,3);assert.strictEqual(p.penalty.halfDistance,true);
n=E.nextSituation(p);assert.deepStrictEqual([n.down,n.distance,n.fieldSide,n.yardLine],[1,3,'OPP',3]);
// Official net override is authoritative for weird spot enforcement.
p=Q.normalizePenaltyPlay(play({down:1,distance:10,fieldSide:'OWN',yardLine:25},accepted('Holding',{netOverride:-7})));
assert.strictEqual(p.penalty.yards,-7);assert.strictEqual(p.penalty.officialOverride,true);
n=E.nextSituation(p);assert.deepStrictEqual([n.down,n.distance,n.fieldSide,n.yardLine],[2,17,'OWN',18]);
console.log('QUALITY26 FOOTBALL LOGIC PASS: holding counts down, dead-ball repeats, half-distance and official override enforced');
