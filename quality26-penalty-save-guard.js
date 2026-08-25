(function(root,factory){
'use strict';
var C=factory();
if(typeof module==='object'&&module.exports){module.exports=C;return;}
if(root.FNIQ)C.install(root.FNIQ);
})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
function num(v,d){var n=Number(v);return Number.isFinite(n)?n:d;}
function fieldAbs(p){if(p.fieldSide==='50')return 50;return p.fieldSide==='OWN'?num(p.yardLine,25):100-num(p.yardLine,25);}
function normalize(p){
 if(!p||!p.penalty||p.penalty.status!=='Accepted')return p;
 var pen=p.penalty,override=pen.netOverride===null||pen.netOverride===''||typeof pen.netOverride==='undefined'?null:Number(pen.netOverride);
 if(override!==null&&Number.isFinite(override)){pen.yards=override;pen.enforcedDistance=Math.abs(override);pen.halfDistance=false;pen.officialOverride=true;return p;}
 var dist=Math.max(0,num(pen.distance,0)),sign=pen.team==='Offense'?-1:pen.team==='Defense'?1:0;if(!sign||!dist){pen.yards=0;pen.enforcedDistance=0;pen.halfDistance=false;pen.officialOverride=false;return p;}
 var abs=fieldAbs(p),goalDistance=pen.team==='Offense'?abs:100-abs,used=Math.min(dist,Math.max(.5,goalDistance/2));
 pen.yards=sign*used;pen.enforcedDistance=used;pen.halfDistance=used<dist;pen.officialOverride=false;return p;
}
function install(A){
 if(!A||A.__quality26PenaltySaveGuard)return A;A.__quality26PenaltySaveGuard=true;
 var oldApply=A.applyPlay;if(oldApply)A.applyPlay=function(p){return oldApply.call(A,normalize(p));};
 var oldReplace=A.replaceLastPlay;if(oldReplace)A.replaceLastPlay=function(p){return oldReplace.call(A,normalize(p));};
 return A;
}
return{normalize:normalize,install:install};
});
