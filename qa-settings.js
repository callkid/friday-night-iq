const S=require('./settings-ui.js');
function assert(x,m){if(!x)throw new Error(m)}
let saves=[];
const A={
  state:{context:{formation:'Trips',personnel:'11'}},
  save:r=>saves.push(r),
  setContext:function(c){if(c&&c.formation!=null)this.state.context.formation=c.formation||'NA';if(c&&c.personnel!=null)this.state.context.personnel=c.personnel||'';this.save('context')},
  applyPlay:function(p){this.state.context={formation:p.formation||'NA',personnel:p.personnel||''};this.save('play');return{down:2}},
  undo:function(){this.state.context={formation:'Trips',personnel:'12'};this.save('undo');return{number:1}}
};
S.installContextRules(A);
assert(A.state.context.formation==='NA','formation should reset on install/migration');
assert(A.state.context.personnel==='11','personnel should survive install');
A.setContext({formation:'Trips',personnel:'12'});
assert(A.state.context.formation==='NA','formation change should not become persistent context');
assert(A.state.context.personnel==='12','personnel change should persist');
A.applyPlay({formation:'Trips',personnel:'21'});
assert(A.state.context.formation==='NA','formation should reset immediately after saved play');
assert(A.state.context.personnel==='21','saved personnel should carry forward');
A.undo();
assert(A.state.context.formation==='NA','undo should not repopulate persistent formation');
assert(A.state.context.personnel==='12','undo should preserve prior personnel context from underlying state');
assert(saves.includes('formation-reset'),'formation reset should be persisted');
console.log('Friday Night IQ settings/carry-forward tests passed');
