const fs=require('fs');
const vm=require('vm');
const E=require('./game-engine.js');
const B=require('./booth-workflow.js');
const Q=require('./game-iq-search.js');
const D=require('./durability.js');
function assert(x,m){if(!x)throw new Error(m);}
function loadState(store){
  const localStorage={getItem:k=>Object.prototype.hasOwnProperty.call(store,k)?store[k]:null,setItem:(k,v)=>{store[k]=String(v)}};
  const box={window:null,FNIQEngine:E,localStorage,Date,Math,console};box.window=box;vm.createContext(box);vm.runInContext(fs.readFileSync('state.js','utf8'),box);return box.FNIQ;
}
function play(A,o){
  const c=A.state.current;
  const p=Object.assign({number:A.state.plays.length+1,drive:A.state.drive,quarter:c.quarter,down:c.down,distance:c.distance,fieldSide:c.fieldSide,yardLine:c.yardLine,hash:'Middle',formation:'Doubles Right',personnel:'11',motion:'NA',front:'4',safeties:'2',box:'6',coverage:'Cover 4',postCoverage:'Cover 4',pressure:'None',playType:'Run',player:'#1 RB',passResult:'',attackDetail:'Inside Zone',conceptFamily:'Run',concept:'IZ',direction:'Right',yards:4,tags:[],notes:'',penalty:null,scoreBefore:{us:0,them:0}},o||{});
  B.normalizeTags(p,{explosiveRun:12,explosivePass:16});A.applyPlay(p);return p;
}
function startDrive(A,side,y){A.state.awaitingPossessionStart=false;A.state.current={quarter:A.state.current.quarter,down:1,distance:10,fieldSide:side,yardLine:y};A.save('qa-drive-start');}
const store={},A=loadState(store),snapshots=[];A.durabilityMirror=()=>{};A.durabilitySnapshot=(reason,state)=>snapshots.push({reason,count:(state||A.state).plays.length});
// Series 1: establish 3rd-short/left/blitz/pass data, then interception.
play(A,{yards:6,formation:'Trips Right',hash:'Left'});
play(A,{yards:2,formation:'Trips Right',hash:'Left'});
play(A,{down:A.state.current.down,distance:A.state.current.distance,formation:'Trips Right',hash:'Left',pressure:'5M',front:'4',postCoverage:'Cover 1',playType:'Pass',passResult:'Complete',attackDetail:'Short',conceptFamily:'Short Game',concept:'Stick',yards:5});
play(A,{formation:'Trips Right',hash:'Left',pressure:'5M',front:'4',postCoverage:'Cloud 3',playType:'Pass',passResult:'Complete',attackDetail:'Short',conceptFamily:'Short Game',concept:'Mesh',yards:8});
play(A,{formation:'Trips Right',hash:'Right',pressure:'None',playType:'Run',attackDetail:'Counter',yards:3});
play(A,{playType:'Pass',passResult:'Interception',attackDetail:'Intermediate',conceptFamily:'Drop Back',concept:'Y Cross',yards:0,tags:['Turnover']});
assert(A.state.awaitingPossessionStart===true,'interception should require next drive start');
const afterInt=A.state.plays.length;assert(afterInt===6,'series 1 play count wrong');
// The app must remain usable while awaiting start; state and analytics still exist.
assert(Q.summary(E,A.state.plays).plays===6,'analytics unavailable while awaiting drive start');
startDrive(A,'OWN',22);
assert(A.state.current.yardLine===22&&A.state.current.down===1,'drive 2 start spot wrong');
// Series 2: lost fumble.
play(A,{formation:'Doubles Left',hash:'Right',yards:5});
play(A,{formation:'Doubles Left',hash:'Right',playType:'Pass',passResult:'Complete',attackDetail:'Short',conceptFamily:'RPO',concept:'Glance',yards:7});
play(A,{formation:'Doubles Left',hash:'Left',playType:'Run',attackDetail:'Outside Zone',yards:4,tags:['Fumble','Fumble Lost']});
assert(A.state.awaitingPossessionStart===true&&A.state.plays.at(-1).next.reason==='Turnover','lost fumble did not end series');
startDrive(A,'OWN',35);
// Series 3: defensive offsides on 3rd & 2 must convert.
play(A,{yards:5,formation:'Bunch Right'});
play(A,{yards:3,formation:'Bunch Right'});
A.state.current.down=3;A.state.current.distance=2;A.save('qa-force-3rd2');
const off=play(A,{playType:'Penalty',yards:0,formation:'Bunch Right',penalty:{type:'Offside',timing:'DEAD',team:'Defense',status:'Accepted',distance:5,yards:5,effect:'REPEAT'}});
assert(off.next.down===1&&off.next.reason==='First down by penalty','3rd & 2 offsides regression');
play(A,{formation:'Bunch Right',playType:'Run',attackDetail:'Power',pressure:'6M',yards:13});
assert(A.state.plays.at(-1).tags.includes('Explosive'),'13-yard run not auto explosive');
play(A,{formation:'Bunch Right',playType:'Pass',passResult:'Incomplete',attackDetail:'Deep',conceptFamily:'Play Action',yards:0});
play(A,{formation:'Bunch Right',playType:'Pass',passResult:'Interception',attackDetail:'Deep',conceptFamily:'Drop Back',yards:0,tags:['Turnover']});
assert(A.state.awaitingPossessionStart,'series 3 should end on interception');
startDrive(A,'OPP',48);
// Series 4: crossing midfield and an explosive pass.
play(A,{formation:'Dallas Right',hash:'Left',yards:4});
play(A,{formation:'Dallas Right',hash:'Left',playType:'Pass',passResult:'Complete',attackDetail:'Intermediate',conceptFamily:'Drop Back',concept:'Dig',yards:17});
assert(A.state.plays.at(-1).tags.includes('Explosive'),'17-yard pass not auto explosive');
play(A,{formation:'Dallas Right',hash:'Middle',playType:'Run',attackDetail:'Inside Zone',yards:6});
play(A,{formation:'Dallas Right',hash:'Middle',playType:'Run',attackDetail:'Power',pressure:'5M',yards:4});
play(A,{formation:'Dallas Right',hash:'Left',playType:'Pass',passResult:'Incomplete',attackDetail:'Short',conceptFamily:'Short Game',yards:0});
play(A,{formation:'Dallas Right',hash:'Left',playType:'Run',attackDetail:'Counter',yards:2,tags:['Turnover']});
if(!A.state.awaitingPossessionStart){A.state.awaitingPossessionStart=true;A.state.drive++;A.save('qa-series-end');}
startDrive(A,'OWN',18);
// Series 5: enough variety for multi-dimensional search.
const forms=['Trips Right','Trips Right','Toronto Left','Trips Right','Stack Right','Trips Right','Bunch Left','Trips Right','Doubles Right','Trips Right'];
for(let i=0;i<10;i++){
  const pass=i%2===1,blitz=i%3!==2,left=i%4!==3;
  play(A,{formation:forms[i],hash:left?'Left':'Right',front:i%4===0?'3':'4',safeties:i%3===0?'1':'2',box:i%3===0?'7':'6',pressure:blitz?(i%2?'5M':'4F'):'None',postCoverage:i%3===0?'Cover 1':i%3===1?'Cloud 3':'Cover 4',playType:pass?'Pass':'Run',passResult:pass?'Complete':'',attackDetail:pass?'Short':i%4===0?'Counter':'Inside Zone',conceptFamily:pass?'Short Game':'Run',concept:pass?'Stick':'IZ',yards:pass?6+i:3+i});
  if(A.state.awaitingPossessionStart)startDrive(A,'OWN',25);
}
assert(A.state.plays.length>=30,'destructive simulation did not reach 30 plays');
assert(JSON.parse(store.fniq_prod_v1).plays.length===A.state.plays.length,'posted primary state lost plays');
// Edit last must replace, not append, and recompute the next situation.
const beforeEdit=A.state.plays.length,last=Object.assign({},A.state.plays.at(-1),{yards:1,postCoverage:'Cover 0',pressure:'6M'});last.tags=(last.tags||[]).slice();
const oldNumber=A.state.plays.at(-1).number;A.replaceLastPlay(last);
assert(A.state.plays.length===beforeEdit,'edit last appended a play');
assert(A.state.plays.at(-1).number===oldNumber&&A.state.plays.at(-1).postCoverage==='Cover 0','edit last did not replace fields');
assert(snapshots.some(x=>x.reason==='edit-last'),'edit last recovery snapshot missing');
// Search the exact headset-style question.
const cat=Q.buildCatalog(E,A.state.plays,p=>B.isExplosive(p,{explosiveRun:12,explosivePass:16}));
function f(key,val){const x=cat.find(z=>z.key===key&&z.value===val);assert(x,'missing search dimension '+key+' '+val);return x;}
const deep=Q.filterPlays(E,A.state.plays,[f('down','3'),f('distanceBucket','Short'),f('hash','Left'),f('blitz','Yes')],p=>B.isExplosive(p,{explosiveRun:12,explosivePass:16}));
assert(Array.isArray(deep),'deep query failed');
const frontRows=Q.groupRows(E,deep,'front');const covRows=Q.groupRows(E,deep,'coverage');const blitzRows=Q.groupRows(E,deep,'pressure');
assert(frontRows.length||deep.length===0,'front grouping failed');assert(covRows.length||deep.length===0,'coverage grouping failed');assert(blitzRows.length||deep.length===0,'blitz grouping failed');
const phrase=Q.parseQuery(cat,'3rd short left hash blitz pass',[]).map(x=>x.key);
['down','distanceBucket','hash','blitz','playType'].forEach(k=>assert(phrase.includes(k),'phrase parser missed '+k));
// Backup/restore round-trip must preserve new fields.
A.state.score={us:21,them:14};A.state.specialTeams=[{number:1,type:'Extra Point',result:'Good',scoreAfter:{us:21,them:14}}];A.save('qa-score');
const payload=D.makePayload(A.state,'destructive');const restored=D.parsePayload(JSON.stringify(payload)).state;
assert(restored.plays.length===A.state.plays.length,'backup roundtrip lost plays');
assert(restored.score.us===21&&restored.specialTeams.length===1,'backup roundtrip lost scoreboard or special teams');
assert(restored.plays.some(x=>x.conceptFamily==='Short Game'),'backup roundtrip lost concept family');
assert(restored.plays.some(x=>(x.tags||[]).includes('Fumble Lost')),'backup roundtrip lost fumble tag');
console.log('Second destructive beta QA passed with '+A.state.plays.length+' plays across five series');
