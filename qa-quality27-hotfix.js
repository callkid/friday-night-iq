'use strict';
const assert=require('assert');
const H=require('./quality27-hotfix.js');

assert.strictEqual(H.defaultEffect({status:'Accepted',timing:'DEAD',effect:'COUNT'}),'REPEAT','accepted dead-ball foul must repeat the down by default');
assert.strictEqual(H.defaultEffect({status:'Accepted',timing:'LIVE',effect:'COUNT'}),'REPEAT','accepted live-ball foul defaults to repeat down unless a specific rule overrides it');
assert.strictEqual(H.defaultEffect({status:'Accepted',timing:'POST',effect:'REPEAT'}),'COUNT','post-play foul defaults to count the completed snap');
assert.strictEqual(H.defaultEffect({status:'Accepted',timing:'LIVE',effect:'AUTO1'}),'AUTO1','automatic-first-down override must survive');
assert.strictEqual(H.defaultEffect({status:'Accepted',timing:'LIVE',effect:'LOSS'}),'LOSS','loss-of-down override must survive');

let p={playType:'Penalty',penalty:{type:'Holding',status:'Accepted',timing:'LIVE',effect:'COUNT'}};
H.normalizePlay(p,false);
assert.strictEqual(p.penalty.effect,'REPEAT','accepted holding must repeat the down by default');

p={playType:'Penalty',penalty:{type:'False Start',status:'Accepted',timing:'DEAD',effect:'COUNT'}};
H.normalizePlay(p,false);
assert.strictEqual(p.penalty.effect,'REPEAT','false start must repeat the down');

p={playType:'Penalty',penalty:{type:'Holding',status:'Accepted',timing:'LIVE',effect:'COUNT'}};
H.normalizePlay(p,true);
assert.strictEqual(p.penalty.effect,'COUNT','an explicit advanced down-effect override must be preserved');

console.log('QUALITY27 HOTFIX SOURCE PASS: accepted holding/dead-ball penalties default to repeat down, post-play defaults count, and explicit advanced effects remain available');
