const assert=require('assert');
const fs=require('fs');
const E=require('./game-engine.js');
const F=require('./game-day-fixes.js');

const td={quarter:'Q1',down:1,distance:10,fieldSide:'OPP',yardLine:23,drive:1,playType:'Pass',yards:23,tags:[],passResult:'Complete'};
const next=E.nextSituation(td);
assert.equal(next.reason,'Touchdown','Opp 23 + 23 yards must be a touchdown');
assert.equal(next.possessionEnded,true,'Touchdown must end the drive');
assert.equal(F.touchdownPoints(next),6,'Offensive touchdown must award 6 points');

let pick=F.normalizeInterception({quarter:'Q2',down:2,distance:7,fieldSide:'OWN',yardLine:40,drive:2,playType:'Pass',yards:0,tags:['Interception'],passResult:'Incomplete'});
assert(pick.tags.includes('Interception'),'Interception tag must remain explicit');
assert(pick.tags.includes('Turnover'),'Interception tag must also classify as turnover');
assert.equal(E.nextSituation(pick).reason,'Turnover','Interception tag must end possession');

let passInt=F.normalizeInterception({playType:'Pass',yards:0,tags:[],passResult:'Interception'});
assert(passInt.tags.includes('Interception'),'INT pass result must add explicit Interception tag');
assert(passInt.tags.includes('Turnover'),'INT pass result must add turnover tag');

assert.equal(F.revisedScore(20,0,6),26,'TD should add six');
assert.equal(F.revisedScore(26,6,0),20,'Undo TD should remove six');
assert.equal(F.revisedScore(26,6,6),26,'Editing TD to TD should not double count');
assert.equal(F.scrollTopFor(500,300,80),712,'scroll target should account for current page and sticky header');

const src=fs.readFileSync('game-day-fixes.js','utf8');
assert(src.includes('resultTagsBelow'),'Tags must move below the primary result grid');
assert(src.includes('Blitz / pressure'),'Blitz must occupy the primary result area');
assert(src.includes('setTimeout(scrollToLiveTop,380)'),'Save & Next must force a post-layout scroll');
assert(src.includes("saved.scoreAutoPoints=pts"),'TD points must be reversible for edit/undo');
console.log('Game-day regression fixes passed');
