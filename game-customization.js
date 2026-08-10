(function(root){'use strict';
function $(id){return document.getElementById(id)}
var A=root.FNIQ;if(!A)return;
function fire(el){['input','change'].forEach(function(t){el.dispatchEvent(new Event(t,{bubbles:true}))})}

(function setupBlitz(){var old=$('pressure');if(!old||old.tagName==='SELECT')return;var s=document.createElement('select');s.id='pressure';['None','4B','4M','4F','5B','5M','5F','50','5MB','5MF','6M','GM','GO','Other'].forEach(function(v){var o=document.createElement('option');o.value=v;o.textContent=v;s.appendChild(o)});old.parentNode.replaceChild(s,old)})();

(function setupPenaltyDistance(){var net=$('penYards');if(!net||$('penDistance'))return;net.type='hidden';var label=net.parentNode.querySelector('label');if(label)label.textContent='Enforced distance';var d=document.createElement('input');d.id='penDistance';d.type='number';d.min='0';d.step='1';d.value=Math.abs(Number(net.value)||0);d.placeholder='5, 10, 15...';net.parentNode.appendChild(d);var help=document.createElement('div');help.className='muted';help.style.marginTop='5px';help.textContent='Enter a positive distance. Offense moves backward; defense moves forward. Adjust to match the officials\' actual marked-off result.';net.parentNode.appendChild(help);
 function sync(){var n=Math.abs(Number(d.value)||0),team=$('penTeam').value;net.value=team==='Offense'?-n:team==='Defense'?n:n;fire(net)}
 d.addEventListener('input',sync);d.addEventListener('change',sync);$('penTeam').addEventListener('change',sync);A.syncPenaltyDistance=sync;
})();

var presets={
 'False Start':{team:'Offense',status:'Accepted',yards:5,effect:'REPEAT'},
 'Offside':{team:'Defense',status:'Accepted',yards:5,effect:'REPEAT'},
 'Encroachment':{team:'Defense',status:'Accepted',yards:5,effect:'REPEAT'},
 'Delay of Game':{team:'Offense',status:'Accepted',yards:5,effect:'REPEAT'},
 'Illegal Formation':{team:'Offense',status:'Accepted',yards:5,effect:'REPEAT'},
 'Illegal Motion':{team:'Offense',status:'Accepted',yards:5,effect:'REPEAT'},
 'Holding':{team:'Offense',status:'Accepted',yards:10,effect:'REPEAT'}
};
function applyPreset(){var p=presets[$('penType').value];if(!p)return;$('penTeam').value=p.team;$('penStatus').value=p.status;$('penEffect').value=p.effect;if($('penDistance'))$('penDistance').value=p.yards;if(A.syncPenaltyDistance)A.syncPenaltyDistance();fire($('penTeam'));fire($('penStatus'));fire($('penEffect'));if(A.msg)A.msg($('penType').value+' default loaded — confirm official result')}
$('penType').addEventListener('change',applyPreset);

function resetCustom(){if($('pressure'))$('pressure').value='None';if($('penDistance'))$('penDistance').value=0;if(A.syncPenaltyDistance)A.syncPenaltyDistance()}
var originalInit=A.initUI;A.initUI=function(){if(originalInit)originalInit();resetCustom()};
var originalSave=$('save').onclick;$('save').onclick=function(e){var panel=!$('penaltyPanel').classList.contains('hidden'),accepted=$('penStatus').value==='Accepted',dist=$('penDistance')?Math.abs(Number($('penDistance').value)||0):Math.abs(Number($('penYards').value)||0);if(panel&&accepted&&dist===0){if(A.msg)A.msg('Accepted penalty: enter the enforced distance');return}var r=originalSave&&originalSave.call(this,e);resetCustom();return r};
if($('clearEntry'))$('clearEntry').addEventListener('click',function(){resetCustom()});
if($('mYes'))$('mYes').addEventListener('click',function(){setTimeout(resetCustom,0)});
})(window);