from pathlib import Path

def replace_once(path, old, new):
    p=Path(path); s=p.read_text(); n=s.count(old)
    if n != 1:
        raise SystemExit(f'{path}: expected one match, found {n}')
    p.write_text(s.replace(old,new,1))

# Make the legacy penalty validation see an official net override, so it cannot
# force the tracker back into enforcement math after Game-Day 3 validates the
# official next-snap state.
replace_once('game-day-3.js',
"if($('penDistance'))$('penDistance').value=0;if($('penNetOverride'))$('penNetOverride').value='';if($('penYards'))$('penYards').value=0;if($('penEffect'))$('penEffect').value=$('gd3PenTiming')&&$('gd3PenTiming').value==='DEAD'?'REPEAT':'COUNT';",
"if($('penDistance'))$('penDistance').value=0;var op=null;if($('gd3NextDown')){var ss=A.state.current||{},ns=$('gd3NextSide')&&$('gd3NextSide').value,ny=ns==='50'?50:Number($('gd3NextYard')&&$('gd3NextYard').value);if(ns&&(ns==='50'||(Number.isFinite(ny)&&ny>=1&&ny<=49)))op=Math.round(A.E.fieldAbs(ns,ny)-A.E.fieldAbs(ss.fieldSide,ss.yardLine));}if($('penNetOverride'))$('penNetOverride').value=op==null?'':String(op);if($('penYards'))$('penYards').value=op==null?0:op;if($('penEffect'))$('penEffect').value=$('gd3PenTiming')&&$('gd3PenTiming').value==='DEAD'?'REPEAT':'COUNT';")

# Game-Day 3 is intentionally a fixed control surface. Disable the old
# post-save scroll-to-top behavior when the new tracker is installed.
replace_once('game-day-fixes.js',
"var before=A.state.plays.length,r=old&&old.call(this,e),added=A.state.plays.length>before;if(added){setTimeout(scrollToLiveTop,160);setTimeout(scrollToLiveTop,380);}return r;",
"var before=A.state.plays.length,r=old&&old.call(this,e),added=A.state.plays.length>before;if(added&&!A.__gameDay3){setTimeout(scrollToLiveTop,160);setTimeout(scrollToLiveTop,380);}return r;")

# Root cache busting and stale explanatory copy.
replace_once('index.html','app.js?v=safety15','app.js?v=safety16')
replace_once('index.html','2nd: 70%. 3rd/4th: convert.','2nd: 50%. 3rd/4th: convert.')

# Keep the downloadable backup metadata aligned with the release while
# preserving the exact backup format and storage keys.
replace_once('durability.js',"C.makePayload(A.state,'safety4')","C.makePayload(A.state,'safety16')")

# Remove the hard-coded legacy 15+ explosive definition. The old analysis is
# hidden by Game IQ 3, but it still must agree with configured thresholds.
replace_once('analytics.js',
"metric('Explosives',ps.filter(function(p){return p.tags.indexOf('Explosive')>=0||net(p)>=15}).length,'15+ net yards or tagged')",
"metric('Explosives',ps.filter(function(p){return A.isExplosive?A.isExplosive(p):p.tags.indexOf('Explosive')>=0}).length,'Run '+(Number(A.state.settings&&A.state.settings.explosiveRun)||12)+'+ • Pass '+(Number(A.state.settings&&A.state.settings.explosivePass)||16)+'+')")

print('Game-Day 3 integration patch applied')
