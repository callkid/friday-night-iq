(function(root){
'use strict';
var d=root.document,A=root.FNIQ;if(!d||!A||A.__boxUx25)return;A.__boxUx25=true;
function sheet(id,href){if(d.getElementById(id))return;var l=d.createElement('link');l.id=id;l.rel='stylesheet';l.href=href;d.head.appendChild(l);}
function inject(){sheet('boxUx25Css','box-ux25.css?v=boxux25');sheet('boxUx25WideCss','box-ux25-wide.css?v=boxux25wide');}
d.documentElement.classList.add('fniqBoxUx25');
inject();
})(window);
