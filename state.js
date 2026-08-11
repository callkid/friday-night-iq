(function(root){
'use strict';
var E=root.FNIQEngine,K='fniq_prod_v1',RAW=null,PARSE_ERROR=false;
function def(){return{quarter:'Q1',down:1,distance:10,fieldSide:'OWN',yardLine:25}}
function brand(){return{primary:'#62d6c8',secondary:'#829cff',logo:''}}
function context(){return{formation:'NA',personnel:''}}
function gameId(){return Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,9)}
function meta(){var t=Date.now();return{gameId:gameId(),createdAt:t,updatedAt:t}}
function fresh(){return{setup:{team:'',opp:'',date:new Date().toISOString().slice(0,10),season:String(new Date().getFullYear())},branding:brand(),context:context(),roster:[],plays:[],drive:1,activeQB:null,current:def(),awaitingPossessionStart:false,meta:meta()}}
function normalize(s){
  if(!s||typeof s!=='object')s=fresh();
  if(!s.setup)s.setup=fresh().setup;
  if(!s.branding)s.branding=brand();s.branding.primary=s.branding.primary||'#62d6c8';s.branding.secondary=s.branding.secondary||'#829cff';s.branding.logo=s.branding.logo||'';
  if(!Array.isArray(s.roster))s.roster=[];if(!Array.isArray(s.plays))s.plays=[];
  if(!s.context){var lp=s.plays[s.plays.length-1];s.context={formation:lp&&lp.formation||'NA',personnel:lp&&lp.personnel&&lp.personnel!=='NA'?lp.personnel:''}}
  s.context.formation=s.context.formation||'NA';s.context.personnel=s.context.personnel||'';
  if(!s.current){if(s.plays.length){var n=E.nextSituation(s.plays[s.plays.length-1]);s.current={quarter:n.quarter,down:n.down,distance:n.distance,fieldSide:n.fieldSide,yardLine:n.yardLine};s.drive=n.drive||s.drive||1;s.awaitingPossessionStart=!!n.possessionEnded}else s.current=def()}
  s.current=E.normalizeSituation(s.current);s.drive=Number(s.drive)||1;if(typeof s.awaitingPossessionStart!=='boolean')s.awaitingPossessionStart=false;
  if(!s.meta||typeof s.meta!=='object')s.meta=meta();if(!s.meta.gameId)s.meta.gameId=gameId();if(!s.meta.createdAt)s.meta.createdAt=Date.now();if(!s.meta.updatedAt)s.meta.updatedAt=s.meta.createdAt;
  return s;
}
function load(){var s;try{RAW=localStorage.getItem(K);s=RAW?JSON.parse(RAW):fresh()}catch(e){PARSE_ERROR=true;s=fresh()}return normalize(s)}
var A=root.FNIQ=root.FNIQ||{};A.E=E;A.state=load();A.sel={front:null,safeties:null,box:null,playType:null};A.loadStatus={hadPrimary:!!RAW,parseError:PARSE_ERROR};A.primarySaveError=null;
A.normalizeState=normalize;A.defaultSituation=def;
A.save=function(reason){A.state=normalize(A.state);A.state.meta.updatedAt=Date.now();var ok=true;try{localStorage.setItem(K,JSON.stringify(A.state));A.primarySaveError=null}catch(e){ok=false;A.primarySaveError=String(e&&e.message||e)}if(A.durabilityMirror)A.durabilityMirror(reason||'state');return ok};
A.replaceState=function(s,reason){A.state=normalize(JSON.parse(JSON.stringify(s)));A.save(reason||'restore');return A.state};
A.setCurrent=function(s){A.state.current=E.normalizeSituation(s);A.save('situation')};
A.setContext=function(c){A.state.context=A.state.context||context();if(c&&c.formation!=null)A.state.context.formation=c.formation||'NA';if(c&&c.personnel!=null)A.state.context.personnel=c.personnel||'';A.save('context')};
A.applyPlay=function(p){A.state.context={formation:p.formation||'NA',personnel:p.personnel&&p.personnel!=='NA'?p.personnel:''};var n=E.nextSituation(p);p.next={quarter:n.quarter,down:n.down,distance:n.distance,fieldSide:n.fieldSide,yardLine:n.yardLine,drive:n.drive,possessionEnded:n.possessionEnded,reason:n.reason};A.state.current={quarter:n.quarter,down:n.down,distance:n.distance,fieldSide:n.fieldSide,yardLine:n.yardLine};A.state.drive=n.drive||A.state.drive;A.state.awaitingPossessionStart=!!n.possessionEnded;if(n.reason==='Touchdown'&&p.tags.indexOf('Touchdown')<0)p.tags.push('Touchdown');A.state.plays.push(p);A.save('play');if(A.durabilitySnapshot)A.durabilitySnapshot('play');return n};
A.undo=function(){if(!A.state.plays.length)return null;var p=A.state.plays.pop();A.state.current=E.normalizeSituation({quarter:p.quarter,down:p.down,distance:p.distance,fieldSide:p.fieldSide,yardLine:p.yardLine});A.state.drive=p.drive;A.state.awaitingPossessionStart=false;var lp=A.state.plays[A.state.plays.length-1];A.state.context={formation:lp&&lp.formation||'NA',personnel:lp&&lp.personnel&&lp.personnel!=='NA'?lp.personnel:''};A.save('undo');if(A.durabilitySnapshot)A.durabilitySnapshot('undo');return p};
A.resetGame=function(){if(A.durabilitySnapshot&&A.state.plays.length)A.durabilitySnapshot('pre-reset',A.state);A.state.plays=[];A.state.drive=1;A.state.current=def();A.state.context=context();A.state.awaitingPossessionStart=false;A.state.meta=meta();A.save('reset');return A.state};
})(window);
