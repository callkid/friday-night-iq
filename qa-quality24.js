const assert=require('assert');
const Q=require('./quality24.js');
const E={
  officialNetYards:p=>Number(p.yards)||0,
  success:p=>Number(p.yards)>=Math.ceil((Number(p.distance)||10)*.5)
};
function p(n,extra={}){return Object.assign({number:n,playType:'Run',down:1,distance:10,yards:5,hash:'Left',formation:'Doubles Right',personnel:'11',front:'4',safeties:'2',coverage:'Cover 3',postCoverage:'Same as pre-snap',pressure:'None',box:'6',motion:'NA',attackDetail:'Inside Zone',conceptFamily:'Run',concept:'NA'},extra);}

assert.equal(Q.distanceBucket(3),'Short');
assert.equal(Q.distanceBucket(7),'Medium');
assert.equal(Q.distanceBucket(8),'Long');
assert.equal(Q.resolvedCoverage(p(1)),'Cover 3');
assert.equal(Q.isBlitz(p(1,{pressure:'5M'})),true);
assert.equal(Q.isBlitz(p(1,{pressure:'None'})),false);

const health=Q.chartingHealth([
  p(1,{motion:'H-Jet'}),
  p(2,{coverage:'NA',postCoverage:'NA',box:'NA',motion:'NA'}),
  p(3,{playType:'Penalty',penalty:{status:'Accepted'}})
]);
assert.equal(health.plays,2);
assert.equal(health.front,100);
assert.equal(health.coverage,50);
assert.equal(health.box,50);
assert.equal(health.motion,50);

let ctx=Q.contextRows([p(1),p(2),p(3),p(4),p(5,{down:2,distance:5})],{down:1,distance:10});
assert.equal(ctx.broadened,false);
assert.equal(ctx.plays.length,4);
ctx=Q.contextRows([p(1),p(2),p(3),p(4,{distance:4}),p(5,{down:2,distance:5})],{down:1,distance:2});
assert.equal(ctx.broadened,true);
assert.equal(ctx.label,'1st down');

assert.equal(Q.bestCall(E,[p(1),p(2)]),null,'two-play sample must never become a recommendation');
const best=Q.bestCall(E,[p(1,{yards:6}),p(2,{yards:7}),p(3,{yards:8}),p(4,{attackDetail:'Power',yards:2}),p(5,{attackDetail:'Power',yards:2}),p(6,{attackDetail:'Power',yards:2})]);
assert(best);
assert.equal(best.label,'Inside Zone');
assert.equal(best.n,3);
assert(best.ypp>6.9);

const lean=Q.defensiveLean([
 p(1,{front:'4',coverage:'Cover 3',pressure:'None'}),
 p(2,{front:'4',coverage:'Cover 3',pressure:'5M'}),
 p(3,{front:'3',coverage:'Cover 2',pressure:'None'}),
 p(4,{front:'4',coverage:'Cover 3',pressure:'5M'})
]);
assert.equal(lean.front.value,'4');
assert.equal(lean.front.share,75);
assert.equal(lean.coverage.value,'Cover 3');
assert.equal(lean.coverage.share,75);
assert.equal(lean.blitz.share,50);

let cap=Q.captureScore({hash:'Left',formation:'Doubles Right',personnel:'11',front:'4',safeties:'2',coverage:'Cover 3',box:'6',motion:'H-Jet'});
assert.deepEqual(cap,{done:8,total:8,missing:[]});
cap=Q.captureScore({hash:'Left',formation:'NA',personnel:'11',front:'4',safeties:'2',coverage:'NA',coverageTouched:true,box:'6',motion:'NA',motionTouched:true});
assert.equal(cap.done,7);
assert.deepEqual(cap.missing,['Formation']);

console.log('QUALITY24 PASS: conservative recommendations, context fallback, defensive tendencies, charting health, capture completeness');
