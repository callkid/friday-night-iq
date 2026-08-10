const E=require('./game-engine.js');
function check(name,p,expected){const n=E.nextSituation(p);const got=[n.down,n.distance,n.fieldSide,n.yardLine,!!n.possessionEnded];if(JSON.stringify(got)!==JSON.stringify(expected)){throw new Error(name+' got '+JSON.stringify(got)+' expected '+JSON.stringify(expected));}}
const base={quarter:'Q1',down:1,distance:10,fieldSide:'OWN',yardLine:25,drive:1,tags:[]};
check('run +5',{...base,playType:'Run',yards:5},[2,5,'OWN',30,false]);
check('false start',{...base,playType:'Penalty',yards:0,penalty:{status:'Accepted',yards:-5,effect:'REPEAT'}},[1,15,'OWN',20,false]);
check('live hold net +2',{...base,playType:'Run',yards:12,penalty:{status:'Accepted',yards:2,effect:'COUNT'}},[2,8,'OWN',27,false]);
check('automatic first',{...base,down:2,distance:8,playType:'Pass',yards:0,penalty:{status:'Accepted',yards:5,effect:'AUTO1'}},[1,10,'OWN',30,false]);
check('offsetting',{...base,playType:'Run',yards:20,penalty:{status:'Offsetting',yards:0,effect:'REPEAT'}},[1,10,'OWN',25,false]);
if(!E.success({...base,playType:'Run',yards:5}))throw new Error('1st and 10 +5 should be a success');
console.log('Friday Night IQ smoke tests passed');
