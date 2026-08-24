const assert=require('assert');
const fs=require('fs');
const E=require('./game-engine.js');
const Q=require('./game-iq-summary.js');
function p(n,down,distance,type,yards,result,extra={}){return Object.assign({number:n,drive:1,quarter:'Q1',down,distance,fieldSide:'OWN',yardLine:25,playType:type,yards,passResult:result||'',tags:[],player:type==='Run'?'#1 RB':'#2 WR',penalty:null},extra);}
const plays=[p(1,1,10,'Run',5),p(2,2,5,'Run',5),p(3,1,10,'Pass',12,'Complete'),p(4,1,10,'Pass',0,'Incomplete'),p(5,3,3,'Run',3),p(6,3,8,'Pass',0,'Incomplete'),p(7,4,1,'Run',1),p(8,1,10,'Pass',20,'Complete'),p(9,1,10,'Run',12),p(10,2,10,'Run',5),p(11,1,10,'Penalty',0,'',{penalty:{type:'False Start',status:'Accepted',timing:'DEAD',team:'Offense',yards:-5,effect:'REPEAT'}})];
const s=Q.summary(E,plays,{explosiveRun:12,explosivePass:16});
assert.equal(s.plays,10,'dead-ball penalty excluded from offensive play count');
assert.equal(s.third.attempts,2);assert.equal(s.third.made,1);assert.equal(s.third.rate,50);
assert.equal(s.fourth.made,1);assert.equal(s.fourth.attempts,1);
assert.equal(s.penalties,1);assert.equal(s.explosives,2);
const d=Q.drilldown(E,plays,{explosiveRun:12,explosivePass:16},'third');
assert.equal(d.title,'3rd Down');assert.equal(d.rows.length,3);assert.equal(d.plays.length,2);
const src=fs.readFileSync(__dirname+'/game-iq-summary.js','utf8');
assert(src.includes('data-stat-key="'),'quick stats must be clickable');
assert(src.includes('Actual plays'),'drilldowns must expose actual plays');
console.log('Quick Game Stats and drill-down QA passed');
