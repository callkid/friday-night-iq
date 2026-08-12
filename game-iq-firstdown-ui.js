(function(root){
'use strict';
var A=root.FNIQ,d=root.document;if(!A||!d||A.__firstDownUiFix)return;A.__firstDownUiFix=true;
function $(id){return d.getElementById(id);}
function chip(prefix){var out=null;d.querySelectorAll('#iqFilterChips .iqFilterChip span').forEach(function(s){if(!out&&s.textContent.trim().indexOf(prefix)===0)out=s.parentNode;});return out;}
function chipText(prefix){var c=chip(prefix),s=c&&c.querySelector('span');return s?s.textContent.trim().slice(prefix.length):'';}
function removeChip(prefix){var c=chip(prefix);if(c)c.click();}
function facetByTitle(title){var found=null;d.querySelectorAll('#iqFacetBody .facetGroup').forEach(function(g){var s=g.querySelector('summary span');if(!found&&s&&s.textContent.trim()===title)found=g;});return found;}
function count(kind){return(A.state&&A.state.plays||[]).filter(function(p){if(Number(p.down)!==1)return false;var x=Number(p.distance);return kind==='Ten'?x===10:kind==='Long'?x>10:kind==='Medium'?x>=4&&x<10:x<=3;}).length;}
function fireSituation(kind){var input=$('iqSearchInput');if(!input)return;var q=kind==='Ten'?'1st and 10':kind==='Long'?'1st long':kind==='Medium'?'1st medium':'1st short';input.value=q;input.dispatchEvent(new Event('input',{bubbles:true}));input.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',code:'Enter',bubbles:true}));}
function ensureOptions(){var g=facetByTitle('First down situation');if(!g)return;var box=g.querySelector('.facetOptions');if(!box)return;var defs=[['Ten','1st & 10'],['Long','1st & Long'],['Medium','1st & Medium'],['Short','1st & Short']];defs.forEach(function(def){var exists=false;box.querySelectorAll('.facetOption').forEach(function(b){if(b.textContent.indexOf(def[1])>=0)exists=true;});if(exists)return;var b=d.createElement('button');b.type='button';b.className='facetOption firstDownGuaranteed';b.innerHTML='<span><i class="facetCheck"></i>'+def[1]+'</span><b>'+count(def[0])+'</b>';b.onclick=function(){fireSituation(def[0]);};box.appendChild(b);});}
function normalize(){var down=chipText('Down: '),sit=chipText('Situation: '),dist=chipText('Distance: '),distanceFacet=facetByTitle('Distance');var first=down==='1st Down'||sit.indexOf('1st & ')===0;if(distanceFacet)distanceFacet.style.display=first?'none':'';if(!first){ensureOptions();return;}ensureOptions();if(!sit&&dist){var map={Long:'Long',Medium:'Medium',Short:'Short'},kind=map[dist];if(kind){removeChip('Distance: ');setTimeout(function(){fireSituation(kind);},20);}}}
function install(){var iq=$('iq');if(!iq)return;normalize();if(!iq.dataset.firstDownUiObserved){iq.dataset.firstDownUiObserved='1';new MutationObserver(function(){setTimeout(normalize,0);}).observe(iq,{childList:true,subtree:true});}}
install();var old=A.renderIQ;if(old)A.renderIQ=function(){var r=old.apply(A,arguments);setTimeout(install,0);return r;};
})(window);
