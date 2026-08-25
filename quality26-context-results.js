(function(root){
'use strict';
var A=root.FNIQ,d=root.document;if(!A||!d||A.__quality26ContextResults)return;A.__quality26ContextResults=true;
function ensure(){
 var row=d.getElementById('q26Outcome');if(!row)return;
 var label=row.querySelector(':scope > span');if(label)label.textContent='Play results';
 var button=row.querySelector('[data-q26-tag="Penalty"]');
 if(!button){
  button=d.createElement('button');button.type='button';button.dataset.q26Tag='Penalty';button.textContent='Penalty';
  var note=row.querySelector('small');row.insertBefore(button,note||null);
  button.onclick=function(){
   var real=d.querySelector('.tag[data-tag="Penalty"]');if(!real)return;
   real.click();button.classList.toggle('on',real.classList.contains('on'));
  };
 }
 var real=d.querySelector('.tag[data-tag="Penalty"]');button.classList.toggle('on',!!(real&&real.classList.contains('on')));
}
ensure();
var old=A.renderAll;if(old&&!A.__quality26ContextResultsRender){A.__quality26ContextResultsRender=true;A.renderAll=function(){var r=old.apply(A,arguments);ensure();return r;};}
})(window);
