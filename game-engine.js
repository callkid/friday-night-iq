(function(root,factory){
  var api=factory();
  if(typeof module==='object'&&module.exports) module.exports=api;
  root.FNIQEngine=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  function num(v,d){var n=Number(v);return Number.isFinite(n)?n:d}
  function clamp(n,a,b){return Math.max(a,Math.min(b,n))}
  function fieldAbs(side,y){if(side==='50')return 50;return side==='OWN'?num(y,25):100-num(y,25)}
  function fromAbs(a){a=clamp(Math.round(a),1,99);if(a===50)return{fieldSide:'50',yardLine:50};if(a<50)return{fieldSide:'OWN',yardLine:a};return{fieldSide:'OPP',yardLine:100-a}}
  function normalizeSituation(s){s=s||{};var side=s.fieldSide||'OWN';var y=side==='50'?50:clamp(num(s.yardLine,25),1,49);return{quarter:s.quarter||'Q1',down:clamp(num(s.down,1),1,4),distance:Math.max(1,num(s.distance,10)),fieldSide:side,yardLine:y}}
  function tags(p){return Array.isArray(p.tags)?p.tags:[]}
  function hasTag(p,t){return tags(p).indexOf(t)>=0}
  function isTurnover(p){return hasTag(p,'Turnover')||p.passResult==='Interception'}
  function penaltyStatus(p){return p&&p.penalty&&p.penalty.status?p.penalty.status:''}
  function officialNetYards(p){var st=penaltyStatus(p);if(st==='Accepted')return num(p.penalty.yards,0);if(st==='Offsetting')return 0;if(st==='Declined')return p.playType==='Penalty'?0:num(p.yards,0);return p.playType==='Penalty'?0:num(p.yards,0)}
  function lineToGainAbs(p){var start=fieldAbs(p.fieldSide,p.yardLine);return Math.min(100,start+Math.max(1,num(p.distance,10)))}
  function distanceFromLine(line,newAbs){return Math.max(1,Math.round(line-newAbs))}
  function sameSituation(p){return{quarter:p.quarter,down:p.down,distance:p.distance,fieldSide:p.fieldSide,yardLine:p.yardLine,drive:p.drive,possessionEnded:false,reason:''}}
  function endedSituation(p,endAbs,reason){var f=fromAbs(endAbs);return{quarter:p.quarter,down:1,distance:10,fieldSide:f.fieldSide,yardLine:f.yardLine,drive:num(p.drive,1)+1,possessionEnded:true,reason:reason}}
  function firstDownAt(p,end,reason){var f=fromAbs(end);return{quarter:p.quarter,down:1,distance:Math.max(1,Math.min(10,Math.round(100-end))),fieldSide:f.fieldSide,yardLine:f.yardLine,drive:p.drive,possessionEnded:false,reason:reason||'First down'}}
  function normalNext(p){
    if(p.playType==='No Play'||p.playType==='Penalty')return sameSituation(p);
    var start=fieldAbs(p.fieldSide,p.yardLine), line=lineToGainAbs(p), gain=num(p.yards,0), end=start+gain;
    if(end>=100&&!isTurnover(p))return endedSituation(p,99,'Touchdown');
    if(end<=0)return endedSituation(p,1,'Safety');
    if(isTurnover(p))return endedSituation(p,end,'Turnover');
    var first=hasTag(p,'First Down')||end>=line;
    if(p.down===4&&!first)return endedSituation(p,end,'Turnover on downs');
    var f=fromAbs(end);
    if(first)return firstDownAt(p,end,'First down');
    return{quarter:p.quarter,down:Math.min(4,p.down+1),distance:distanceFromLine(line,end),fieldSide:f.fieldSide,yardLine:f.yardLine,drive:p.drive,possessionEnded:false,reason:''};
  }
  function penaltyNext(p){
    var pen=p.penalty||{},status=pen.status||'';
    if(!status)return p.playType==='Penalty'?sameSituation(p):normalNext(p);
    if(status==='Declined')return p.playType==='Penalty'?sameSituation(p):normalNext(p);
    if(status==='Offsetting')return sameSituation(p);
    if(status!=='Accepted')return p.playType==='Penalty'?sameSituation(p):normalNext(p);
    var start=fieldAbs(p.fieldSide,p.yardLine),line=lineToGainAbs(p),end=start+num(pen.yards,0),f=fromAbs(end),effect=pen.effect||'REPEAT';
    if(end>=100)return endedSituation(p,99,'Touchdown');
    if(end<=0)return endedSituation(p,1,'Safety');
    if(effect==='AUTO1')return firstDownAt(p,end,'Automatic first down');
    if(effect==='REPEAT'){
      if(end>=line)return firstDownAt(p,end,'First down by penalty');
      return{quarter:p.quarter,down:p.down,distance:distanceFromLine(line,end),fieldSide:f.fieldSide,yardLine:f.yardLine,drive:p.drive,possessionEnded:false,reason:'Repeat down'};
    }
    if(effect==='COUNT'){
      var got=end>=line;
      if(got)return firstDownAt(p,end,'First down');
      if(p.down===4)return endedSituation(p,end,'Turnover on downs');
      return{quarter:p.quarter,down:p.down+1,distance:distanceFromLine(line,end),fieldSide:f.fieldSide,yardLine:f.yardLine,drive:p.drive,possessionEnded:false,reason:'Count play'};
    }
    if(effect==='LOSS'){
      if(end>=line&&pen.team==='Defense')return firstDownAt(p,end,'First down by penalty');
      if(p.down===4)return endedSituation(p,end,'Loss of down');
      return{quarter:p.quarter,down:Math.min(4,p.down+1),distance:distanceFromLine(line,end),fieldSide:f.fieldSide,yardLine:f.yardLine,drive:p.drive,possessionEnded:false,reason:'Loss of down'};
    }
    return sameSituation(p);
  }
  function nextSituation(p){
    p=Object.assign({quarter:'Q1',down:1,distance:10,fieldSide:'OWN',yardLine:25,drive:1,playType:'No Play',yards:0,tags:[]},p||{});
    return p.penalty?penaltyNext(p):normalNext(p);
  }
  function isFirstDownResult(p){var n=nextSituation(p);return !n.possessionEnded&&n.down===1&&!(p.down===1&&n.distance===p.distance&&n.fieldSide===p.fieldSide&&n.yardLine===p.yardLine)}
  function success(p){
    if(!p||!['Run','Pass'].includes(p.playType))return false;
    var st=penaltyStatus(p);if(st==='Offsetting')return false;
    var y=officialNetYards(p),need=p.down===1?.5:p.down===2?.7:1;
    if(p.penalty&&st==='Accepted'&&p.penalty.effect==='AUTO1')return true;
    return y>=Math.max(1,num(p.distance,10))*need;
  }
  return{fieldAbs:fieldAbs,fromAbs:fromAbs,normalizeSituation:normalizeSituation,nextSituation:nextSituation,officialNetYards:officialNetYards,isFirstDownResult:isFirstDownResult,success:success};
});