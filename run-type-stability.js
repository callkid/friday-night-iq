(function(root){
'use strict';
var A=root.FNIQ,d=root.document;if(!A||!d||A.__runTypeStability)return;A.__runTypeStability=true;
var RUN_TYPES=['Inside Zone','Outside Zone','Counter','Power','Draw'];
function option(value,label){var o=d.createElement('option');o.value=value;o.textContent=label||value;return o}
function sync(){var a=d.getElementById('attackDetail'),lab=d.getElementById('detailLabel');if(!a||!lab||!A.sel||A.sel.playType!=='Run')return;var prior=a.value;a.innerHTML='';a.appendChild(option('NA','N/A'));RUN_TYPES.forEach(function(x){a.appendChild(option(x))});if([].some.call(a.options,function(o){return o.value===prior}))a.value=prior;else a.value='NA';lab.textContent='Run Type'}
d.querySelectorAll('[data-group="playType"] .choice').forEach(function(b){b.addEventListener('click',sync)});
var oldChoose=A.choose;if(oldChoose&&!oldChoose.__runTypeStable){var wrapped=function(g,v){var r=oldChoose.call(A,g,v);if(g==='playType')sync();return r};wrapped.__runTypeStable=true;A.choose=wrapped}
A.syncRunTypeOptions=sync;
})(window);
