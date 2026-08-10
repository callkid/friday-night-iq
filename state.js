(function(root){
'use strict';
var E=root.FNIQEngine,K='fniq_prod_v1';
function def(){return{quarter:'Q1',down:1,distance:10,fieldSide:'OWN',yardLine:25}}
function fresh(){return{setup:{team:'',opp:'',date:new Date().toISOString().slice(0,10),season:String(new Date().getFullYear())},roster:[],plays:[],drive:1,activeQB:null,current:def(),awaitingPossessionStart:false}}
function load(){var s;try{s=JSON.parse(localStorage.getItem(K))||fresh()}catch(e){s=fresh()}if(!s.setup)s.setup=fresh().setup;if(!Array.isArray(s.roster))s.roster=[];if(!Array.isArray(s.plays))s.plays=[];if(!s.current){if(s.plays.length){var n=E.nextSituation(s.plays[s.plays.length-1]);s.current={quarter:n.quarter,down:n.down,distance:n.distance,fieldSide:n.fieldSide,yardLine:n.yardLine};s.drive=n.drive||s.drive||1;s.awaitingPossessionStart=!!n.possessionEnded}else s.current=def()}s.current=E.normalizeSituation(s.current);s.drive=Number(s.drive)||1;if(typeof s.awaitingPossessionStart!=='boolean')s.awaitingPossessionStart=false;return s}
var A=root.FNIQ=root.FNIQ||{};A.E=E;A.state=load();A.sel={front:null,safeties:null,box:null,playType:null};
A.save=function(){localStorage.setItem(K,JSON.stringify(A.state))};
A.defaultSituation=def;
A.setCurrent=function(s){A.state.current=E.normalizeSituation(s);A.save()};
A.applyPlay=function(p){var n=E.nextSituation(p);p.next={quarter:n.quarter,down:n.down,distance:n.distance,fieldSide:n.fieldSide,yardLine:n.yardLine,drive:n.drive,possessionEnded:n.possessionEnded,reason:n.reason};A.state.current={quarter:n.quarter,down:n.down,distance:n.distance,fieldSide:n.fieldSide,yardLine:n.yardLine};A.state.drive=n.drive||A.state.drive;A.state.awaitingPossessionStart=!!n.possessionEnded;if(n.reason==='Touchdown'&&p.tags.indexOf('Touchdown')<0)p.tags.push('Touchdown');A.state.plays.push(p);A.save();return n};
A.undo=function(){if(!A.state.plays.length)return null;var p=A.state.plays.pop();A.state.current=E.normalizeSituation({quarter:p.quarter,down:p.down,distance:p.distance,fieldSide:p.fieldSide,yardLine:p.yardLine});A.state.drive=p.drive;A.state.awaitingPossessionStart=false;A.save();return p};
A.resetGame=function(){A.state.plays=[];A.state.drive=1;A.state.current=def();A.state.awaitingPossessionStart=false;A.save()};
})(window);