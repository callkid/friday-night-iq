(function(root){
'use strict';
var A=root.FNIQ;if(!A||!A.$)return;var $=A.$,E=A.E;
function q(v){return'"'+String(v==null?'':v).replace(/"/g,'""')+'"';}
function resolvedCoverage(p){var post=p.postCoverage;if(post&&post!=='NA')return post==='Same as pre-snap'?(p.coverage||'NA'):post;return p.coverage||'NA';}
function safeName(){return(A.state.setup.team||'team').replace(/[^a-z0-9]+/gi,'-')+'-vs-'+(A.state.setup.opp||'opponent').replace(/[^a-z0-9]+/gi,'-');}
function download(name,text){var blob=new Blob([text],{type:'text/csv;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(function(){URL.revokeObjectURL(url);},1200);}
function has(p,t){return(p.tags||[]).indexOf(t)>=0;}
var btn=$('export');if(!btn)return;
btn.onclick=function(){
  var h=['Play','Drive','Quarter','Down','Distance','FieldSide','YardLine','Hash','Formation','Personnel','Motion','Front','Safeties','Box','PreSnapCoverage','PostSnapCoverage','ResolvedCoverage','Blitz','PlayType','Player','PassResult','RunTypeOrPassDepth','ConceptFamily','SpecificConcept','Direction','RawYards','NetYards','AutoExplosive','Fumble','FumbleLost','ScoreUsBefore','ScoreOpponentBefore','PenaltyType','PenaltyTiming','PenaltyTeam','PenaltyPlayer','PenaltyStatus','PenaltyDistance','PenaltyNetChange','PenaltyEffect','Tags','Notes','NextDown','NextDistance','NextFieldSide','NextYardLine','PossessionEnded'];
  var rows=A.state.plays.map(function(p){
    var x=p.penalty||{},n=p.next||E.nextSituation(p),s=p.scoreBefore||{};
    return[p.number,p.drive,p.quarter,p.down,p.distance,p.fieldSide,p.yardLine,p.hash,p.formation,p.personnel,p.motion,p.front,p.safeties,p.box,p.coverage,p.postCoverage,resolvedCoverage(p),p.pressure,p.playType,p.player,p.passResult,p.attackDetail,p.conceptFamily||'NA',p.concept,p.direction,p.yards,E.officialNetYards(p),A.isExplosive?A.isExplosive(p):has(p,'Explosive'),has(p,'Fumble'),has(p,'Fumble Lost'),s.us,s.them,x.type,x.timing,x.team,x.player,x.status,x.distance,x.yards,x.effect,(p.tags||[]).join('|'),p.notes,n.down,n.distance,n.fieldSide,n.yardLine,n.possessionEnded].map(q).join(',');
  });
  download(safeName()+'-fniq.csv','\ufeff'+[h.map(q).join(',')].concat(rows).join('\r\n'));
  A.msg('Exported '+A.state.plays.length+' plays with Game IQ fields');
};
})(window);
