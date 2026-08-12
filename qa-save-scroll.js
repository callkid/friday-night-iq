const C=require('./save-scroll-fix.js');
function eq(name,got,want){if(got!==want)throw new Error(name+' got '+got+' expected '+want);}
eq('pre-snap gets 104px headroom',C.scrollTopFor(600,200,104),696);
eq('scroll never negative',C.scrollTopFor(40,20,104),0);
console.log('Save and Next scroll alignment tests passed');
