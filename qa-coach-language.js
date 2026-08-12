const C=require('./coach-language.js');
function eq(name,got,want){if(got!==want)throw new Error(name+' got '+JSON.stringify(got)+' expected '+JSON.stringify(want));}
eq('short situation',C.shortSituation('1st Down & Long'),'1st & Long');
eq('front distribution',C.humanizeDistribution('4 Down 3 (75%) • 3 Down 1 (25%)'),'4 Down 75% • 3 Down 25%');
eq('coverage distribution',C.humanizeDistribution('Cover 3 2 (50%) • Cover 1 1 (25%) • Cover 4 1 (25%)'),'Cover 3 50% • Cover 1 25% • Cover 4 25%');
eq('blitz tendency',C.humanizeTendency('2/4 observations (50%)'),'50%');
eq('single tendency',C.humanizeTendency('4 Down 3/4 (75%)'),'4 Down 75%');
eq('brief',C.humanizeBrief('3rd & Short IQ — 4 observations\n2 run • 2 pass • 6.5 net YPP • 75% success\nBlitz — 3/4 (75%)\nBest repeated answer — Counter • 8.0 YPP • 75% success (n=4)'),'3rd & Short IQ\n6.5 net YPP • 75% success\nBlitz — 75%\nBest repeated answer — Counter • 8.0 YPP • 75% success');
console.log('Human coach-analysis wording tests passed');
