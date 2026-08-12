(function(root,factory){
'use strict';
var C=factory();
if(typeof module==='object'&&module.exports){module.exports=C;return;}
if(root.FNIQ)C.install(root.FNIQ,root);
})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
function scrollTopFor(rectTop,pageYOffset,offset){return Math.max(0,(Number(pageYOffset)||0)+(Number(rectTop)||0)-(Number(offset)||0));}
function install(A,root){
  if(!A||!root.document||A.__saveScrollFix)return A;A.__saveScrollFix=true;
  var d=root.document,save=d.getElementById('save');if(!save)return A;
  save.addEventListener('click',function(){
    var before=A.state.plays.length;
    setTimeout(function(){
      if(A.state.plays.length<=before)return;
      var p=d.getElementById('preSnapCard');if(!p||!p.getBoundingClientRect)return;
      var top=scrollTopFor(p.getBoundingClientRect().top,root.pageYOffset||d.documentElement.scrollTop||0,104);
      if(root.scrollTo)root.scrollTo({top:top,behavior:'smooth'});
    },220);
  },true);
  return A;
}
return{scrollTopFor:scrollTopFor,install:install};
});
