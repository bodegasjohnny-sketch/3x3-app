/* 3x3 · Pages: Projects, Project (pipeline), Connections, Onboarding. Uses ic()/esc() from intake.js. */
(function(){
const fmtT = iso => { try { return new Date(iso).toLocaleString([], {month:'short', day:'numeric', hour:'numeric', minute:'2-digit'}); } catch(e){ return iso; } };
const chip = (s, extra='') => { const [t, c] = M3.STATUS[s] || [s, 'mute']; return `<span class="schip ${c}" ${extra}><i></i>${t}</span>`; };
const CONN_STATUS = {connected:['Connected','grn'], missing:['Missing','red'], relogin:['Needs re-login','amber'], pending:['Needs you','warn']};
const cchip = s => { const [t, c] = CONN_STATUS[s] || CONN_STATUS.missing; return `<span class="schip ${c}"><i></i>${t}</span>`; };
const draftI = () => Intake.snapshot();
const stageNames = ks => ks.map(k => M3.stage(k).s);
const pageHead = (eb, title, sub, right='') => `<div class="sh"><div class="grow"><div class="eb">${eb}</div><h1>${title}</h1><p>${sub}</p></div>${right}</div>`;

/* ================= PROJECTS ================= */
function projects(){
  const list = Store.listProjects(), d = Store.getDraft();
  return pageHead('Projects', 'Your videos', 'Each project is one locked intake plus one topic, run through the pipeline by your Grok Bot worker.',
    `<div class="row" style="gap:8px"><a class="btn ghost" href="#/intake/${(d&&d.step)||1}">${ic('edit')}Continue intake</a><button class="btn pri" data-x="newintake">${ic('plus')}New intake</button></div>`) +
  (list.length ? `<div class="grid g3">${list.map(p => { const pr = Pipeline.progress(p), cur = Pipeline.current(p), ws = M3.warnings(p.intake, Store.getConnections());
    return `<a class="card pcard" href="#/project/${p.id}"><div class="pthumb" style="background:${p.labels.styleBg}"></div>
      <div class="pbody"><div class="no">${esc(p.labels.goalName)} · ${esc(p.intake.dur)}s · ${esc(p.intake.aspect)}</div><h3>${esc(p.topic)}</h3><p>${esc(p.brand)} · ${esc(p.labels.styleName)}</p>
      <div class="bar" style="margin:10px 0 8px"><i style="width:${pr.pct}%"></i></div>
      <div class="row" style="justify-content:space-between;gap:8px;flex-wrap:wrap">${cur ? `<span class="muted">${M3.stage(cur).n}</span>${chip(Pipeline.eff(p, cur))}` : `<span class="muted">All steps complete</span>${chip('done')}`}</div>
      ${ws.length ? `<div class="pwarn">${ic('warn')}${ws.length} missing connection${ws.length>1?'s':''}</div>` : ''}
      <div class="muted" style="margin-top:6px;font-size:11.5px">Created ${fmtT(p.created_at)}</div></div></a>`; }).join('')}</div>`
  : `<div class="empty"><div class="ico" style="margin:0 auto 12px">${ic('film')}</div><h3>No projects yet</h3><p>Finish an intake, lock it, pick a topic, and your first project appears here.</p><a class="btn pri" href="#/intake/1" style="margin-top:14px">Start intake ${ic('ar')}</a></div>`);
}

/* ================= PROJECT ================= */
function stillTile(p, f, canSwap, swapping){
  const bg = p.labels.styleBg; const hue = (f.seed % 60) - 30, br = 0.85 + (f.seed % 30)/100;
  return `<div class="still ${swapping?'busy':''}"><div class="sv" style="background:${bg};filter:hue-rotate(${hue}deg) brightness(${br.toFixed(2)})"></div>
    <div class="sl"><b>Shot ${f.i+1}</b>${f.v>1?`<span class="badge cyan">v${f.v}</span>`:''}</div>
    ${canSwap?`<button class="swap" data-x="swap" data-id="${p.id}" data-i="${f.i}" title="Generate a new version of this still">${ic('refresh')}Swap</button>`:''}</div>`;
}
function artifact(p, k){
  const st = p.stages[k], o = st.output; if (!o) return '';
  const e = Pipeline.eff(p, k), busy = st.status === 'running';
  switch(k){
    case 'rules': return `<div class="art"><div class="kv"><span>Rule set</span><b>v${o.rule_set_version}</b></div><div class="kv"><span>Intake hash</span><b class="mono">${o.intake_hash}</b></div><div class="kv"><span>Approval gates</span><b>${o.gates.join(' → ')}</b></div>
      <details><summary>View compiled rules JSON</summary><pre class="json">${esc(JSON.stringify(p.rules, null, 2))}</pre></details></div>`;
    case 'script': { const edit = e === 'awaiting' && !busy, disc = ((p.rules.safety || {}).disclaimer || {}).text, hits = M3.scriptBanned(o.beats, p.rules), bd = M3.scriptBidi(o), ph = M3.scriptPlaceholders(o).filter(b => !bd.includes(b)), dh = st.draftEdits || [];
      return `<div class="art"><div class="row" style="gap:8px;margin-bottom:8px;flex-wrap:wrap"><span class="badge mute">Draft ${o.draft}</span><span class="badge mute">≈${o.words} words · ${o.beats.length} beats</span>${o.edits&&o.edits.length?`<span class="badge cyan">${o.edits.length} edit${o.edits.length>1?'s':''} by you (logged)</span>`:''}<span class="badge warn">Simulated draft. The real worker writes the lines.</span></div>
      ${disc?`<div class="infobox" style="margin:0 0 8px">${ic('lock')}<div><b>Disclaimer (locked, first frame + description):</b> ${esc(disc)} <span class="muted">Exempt from the banned-word check.</span></div></div>`:''}
      ${edit?`<p class="muted" style="margin:0 0 6px">You can edit any line before you approve. Edits are logged with the before and after text.</p>`:''}
      <ol class="beatlist">${o.beats.map((b, i) => `<li><b>${esc(b.b)}</b>${edit?`<textarea class="inp beatedit${ph.includes(b)?' tpl':''}" id="beat-${p.id}-${i}" data-beat="${i}" maxlength="400" rows="2" aria-label="Script line ${esc(b.b)}">${esc(b.line)}</textarea>`:`<span>${esc(b.line)}</span>`}${b.src?`<small>${ic('link')}${esc(b.src)}</small>`:''}</li>`).join('')}</ol>
      ${edit?`<div class="row" style="gap:8px;margin-top:8px"><button class="btn sm" data-x="savescript" data-id="${p.id}">${ic('check')}Save edits</button></div>`:''}
      <p class="${hits.length?'errbox':'muted'}" style="margin-top:8px">${hits.length?`${ic('warn')}Banned words in the script: <b>${hits.map(esc).join(', ')}</b>. Edit the lines or regenerate before approving.`:`${ic('check')} Banned-word check: clear (the locked disclaimer is exempt).`}</p>
      ${bd.length?`<p class="errbox bidibox" style="margin-top:6px">${ic('warn')}<b>${bd.length} line${bd.length>1?'s contain':' contains'} hidden text-direction characters</b> (${bd.map(b=>esc(b.b)).join(', ')}). These invisible override or isolate characters (U+202A–202E, U+2066–2069) can make text display differently from what is checked, so they're refused. Retype ${bd.length>1?'those lines':'that line'} by hand instead of pasting, then Save edits. Approve stays off until then.</p>`:''}
      ${ph.length?`<p class="errbox phbox" style="margin-top:6px">${ic('warn')}<b>${ph.length} line${ph.length>1?'s are':' is'} still placeholder text</b> (${ph.map(b=>`${esc(b.b)}: ${esc(M3.PLACEHOLDER_WHY[M3.placeholderWhy(o, b)])}`).join(', ')}). Rewrite ${ph.length>1?'them':'it'} in your own words and Save edits. Approve stays off until then. The hook needs at least ${M3.MIN_LINE_WORDS} real words and the other lines ${M3.MIN_ITEM_WORDS} (numbers and amounts like ₱500 or 20% count), a real rewrite keeps no more than half of a template's word pairs (reordered template words don't count), and lines with hidden text-direction characters are refused; spacing, case, punctuation, digits for letters or lookalike letters don't count either. This browser check is advisory: the server re-checks every line before publishing.</p>`:''}
      ${dh.length?`<details class="drafthist" style="margin-top:8px"><summary>Earlier drafts: ${dh.reduce((a, d) => a + d.edits.length, 0)} edit${dh.reduce((a, d) => a + d.edits.length, 0)===1?'':'s'} kept from ${dh.length} draft${dh.length>1?'s':''}</summary><ul class="olist">${dh.map(d => d.edits.map(x => `<li>Draft ${d.draft} · ${esc(x.beat)}: <s>${esc(x.from)}</s> → ${esc(x.to)}</li>`).join('')).join('')}</ul></details>`:''}</div>`; }
    case 'voice': { const gate = e === 'awaiting' && !busy, L = o.lines || [];
      return `<div class="art"><div class="row" style="gap:14px;align-items:center;flex-wrap:wrap"><div class="ico">${ic('mic')}</div><div class="wave on" style="display:flex;flex:1;min-width:140px">${Array.from({length:40},(_,j)=>`<i style="--h:${20+Math.abs(Math.sin(j*1.3))*75}%;--d:${(j%7)*-0.13}s;--s:.7"></i>`).join('')}</div>
      <div class="muted">${esc(p.labels.voiceName||'Voice')} · take ${o.take||1} · ${o.seconds}s · ${(o.chars||0).toLocaleString()} chars (from the approved script)</div></div>
      ${(() => { const [lo, hi] = M3.voWindow(p.intake.dur), inw = M3.voInWindow(o.seconds, p.intake.dur), ov = Pipeline.voOverridden(st);
        return inw ? `<p class="muted volen ok" style="margin:8px 0 0">${ic('check')} Length ${o.seconds}s is inside the ${lo}–${hi}s window for a ${p.intake.dur}s video.</p>`
          : `<div class="errbox volen" style="margin-top:8px">${ic('warn')}<div><b>Length ${o.seconds}s is outside the ${lo}–${hi}s window</b> for a ${p.intake.dur}s video (spec: ±${M3.VO_TOL}s, checked on VO length). ${o.seconds < lo ? 'Lengthen the script lines' : 'Shorten the script lines'} and regenerate, or override if you really want this length.
            ${gate?`<label class="ack ${ov?'on':''}" style="margin-top:6px"><input type="checkbox" data-x="vooverride" data-id="${p.id}" ${ov?'checked':''}><span>Approve this ${o.seconds}s take anyway (logged; applies to this take only)</span></label>`:ov?' <b>Overridden by you.</b>':''}</div></div>`; })()}
      <p class="muted" style="margin:8px 0 6px">${ic('info')} Voice gate: play each line, redo a line or the whole take, then approve. <b>Browser voice sample</b>, not the ElevenLabs voice: the simulator has no vo.mp3. ${App.canSpeak()?'':'<b>Audio playback isn\'t available in this browser.</b>'}</p>
      <ol class="beatlist vlines">${L.map((l, i) => `<li><b>${esc(l.line_id)} · ${esc(l.beat||'')}</b><span>${esc(l.text)}</span><small class="mono">${l.start.toFixed(2)}–${l.end.toFixed(2)}s${l.v>1?` · take v${l.v}`:''}</small>
        <div class="row" style="gap:6px;margin-top:4px"><button class="btn sm ghost" data-x="sayline" data-id="${p.id}" data-i="${i}" aria-label="Play line ${esc(l.line_id)}">${ic('play')}Play</button>${gate?`<button class="btn sm ghost" data-x="redoline" data-id="${p.id}" data-i="${i}" aria-label="Redo line ${esc(l.line_id)}">${ic('refresh')}Redo line</button>`:''}</div></li>`).join('')}</ol></div>`; }
    case 'stills': { const canSwap = !busy && st.status !== 'idle';
      return `<div class="art"><p class="muted" style="margin-bottom:8px">${o.frames.length} stills · ${esc(p.labels.styleName)}. Swap any one: it gets a new version, and anything already approved after Stills will need re-approval.</p>
      <div class="stills">${o.frames.map(f => stillTile(p, f, canSwap, busy && st.jobId && Store.getJob(st.jobId) && Store.getJob(st.jobId).payload.swap === f.i)).join('')}</div></div>`; }
    case 'video': return `<div class="art"><div class="stills">${o.clips.map(c => { const f = (p.stages.stills.output||{frames:[]}).frames[c.i] || {seed:1};
      return `<div class="still clip"><div class="sv" style="background:${p.labels.styleBg};filter:hue-rotate(${(f.seed%60)-30}deg)"></div><span class="pl">${ic('play')}</span><div class="sl"><b>Clip ${c.i+1}</b><small>${c.s}s · ${esc(c.move)}</small></div></div>`; }).join('')}</div>
      ${e==='stale'?`<p class="stalemsg">${ic('warn')}These clips were made from older stills. Regenerate to use the current storyboard.</p>`:''}</div>`;
    case 'final': return `<div class="art finalart"><div class="phone mini9"><div class="scene" style="background:${p.labels.styleBg}"></div>${p.rules.ai_disclosure.on_screen_tag?'<div class="paitag">AI-generated</div>':''}<div class="fstack"><div class="pcap">${esc(p.topic.split(' ').slice(0,5).join(' '))}…${p.rules.affiliate_disclosure?`<span class="paff">${esc(p.rules.affiliate_disclosure.text)}</span>`:''}</div>
      ${((p.rules.safety||{}).disclaimer||{}).text?`<div class="pdisc fdisc">${esc(p.rules.safety.disclaimer.text)}</div>`:''}</div></div>
      <div style="flex:1;min-width:200px"><div class="kv"><span>File</span><b>${esc(o.file)}</b></div><div class="kv"><span>Target length</span><b>${o.target_seconds??o.seconds}s · ${esc(o.aspect)}</b></div><div class="kv"><span>Loudness target</span><b>${o.target_lufs??o.lufs} LUFS · ≤ ${o.target_true_peak??o.true_peak} dBTP</b></div><p class="muted tgtnote" style="margin:4px 0">${ic('info')} Targets, not measured values: the simulator renders nothing. The real worker measures the file and reports it here.</p>
      <div class="kv cliprev"><span>Clip preview</span><b>${((p.stages.video.output||{}).clips||[]).length} clips · review them in Video above (part of this Master gate)</b></div>${(() => { const vo = p.stages.voice && p.stages.voice.output; if (!vo || p.intake.vo === false) return ''; const [lo, hi] = M3.voWindow(p.intake.dur), inw = M3.voInWindow(vo.seconds, p.intake.dur);
        return `<div class="kv volenfinal"><span>VO length (actual)</span><b>${vo.seconds}s ${inw?`<span class="badge green">in ${lo}–${hi}s window</span>`:`<span class="badge warn">outside ${lo}–${hi}s${Pipeline.voOverridden(p.stages.voice)?' · overridden by you':''}</span>`}</b></div>`; })()}<div class="kv"><span>Captions</span><b>${esc(p.intake.capStyle)} · ${esc(p.intake.capPos)}</b></div><div class="kv"><span>Music / SFX</span><b>${esc(p.intake.music)} · ${esc(p.intake.sfx)}</b></div>
      <div class="lbl">Labels burned in / applied</div><div class="chips">${o.labels.map(l => `<span class="badge vio">${esc(l)}</span>`).join('')}</div></div></div>`;
    case 'publish': return o.downloaded ? `<div class="art"><b>${ic('dl')} Downloaded</b> <span class="muted">(test build: project manifest JSON; the real build delivers the MP4)</span></div>`
      : `<div class="art"><b>${ic('check')} Sent to 3x3's publish-broker</b> <span class="muted">(server-side, official APIs, simulated: nothing was posted)</span>
        <div class="pubres">${(o.results||[]).map(r => `<div class="kv"><span>${PLATN[r.plat]}</span><b>${esc(r.mode)} · ${esc(r.account||'')}${r.plat==='tt'&&p.intake.dur<=60?` · <span class="badge warn">${esc(M3.REACH_ONLY)}</span>`:''}${r.kids?' · <span class="badge cyan">Made for Kids</span>':''}</b></div>`).join('')}</div>
        ${M3.isAlcohol(p.intake)?`<div class="infobox" style="margin-top:8px">${ic('lock')}<div>Alcohol bundle: never auto-published, each post confirmed per platform, no affiliate or retailer links, disclaimer on screen: “${esc(((p.rules.safety||{}).disclaimer||{}).text||'')}”.</div></div>`:''}</div>`;
  }
  return '';
}
function stageActions(p, k){
  const st = p.stages[k], e = Pipeline.eff(p, k), sd = M3.stage(k), id = p.id, ready = Pipeline.ready(p, k);
  const fixLinks = ids => ids.map(c => `<a class="btn sm" href="#/connections?focus=${c}">${ic('plug')}Connect ${esc(M3.conn(c).n)}</a>`).join('');
  if (e === 'running') return `<div class="sact"><span class="spin"></span><span class="muted">${k==='publish'?'3x3\'s publish-broker is posting through the official APIs (simulated)…':'Your Grok Bot worker is on it (simulated)…'}</span></div>`;
  if (e === 'needs' && st.choice) { const miss = Pipeline.publishMissing(p);
    return `<div class="sact col"><div class="needbox" style="background:rgba(22,199,132,.06);border-color:rgba(22,199,132,.3)">${ic('info')}<div>${esc(M3.publishNote(p, Pipeline.kidsRule(p)))}${p.intake.plat.tt?' '+esc(M3.TIKTOK_NOTE):''}</div></div>${Pipeline.brandMismatch(p).map(m => `<div class="needbox brandwarn">${ic('warn')}<div><b>Account mismatch:</b> ${esc(PLATN[m.plat]||m.plat)} is connected as <b><bdi>${esc(M3.brandShow(m.account))}</bdi></b>${m.flags&&m.flags.length?` (the name contains ${esc(m.flags.join(' and '))})`:''}, but this project's brand is <b><bdi>${esc(m.brand)}</bdi></b>. Check it's the right ${m.plat==='fb'?'Page':m.plat==='yt'?'channel':'account'} before you queue, or <a href="#/connections">reconnect</a>.</div></div>`).join('')}<div class="row" style="gap:8px;flex-wrap:wrap"><button class="btn pri" data-x="download" data-id="${id}">${ic('dl')}Download</button>${Pipeline.publishTargets(p).length?`<button class="btn" data-x="queue" data-id="${id}">${ic('rocket')}Approve & queue for publish</button>`:'<span class="muted">No platforms were chosen in the intake, so this project is download only.</span>'}</div>
      ${Pipeline.ttDirect(p)?`<label class="field" style="max-width:340px"><span>TikTok: who can view this video? (required, no default)</span><select class="inp" id="ttpriv-${id}"><option value="" selected disabled>Choose who can view…</option>${M3.TT_PRIVACY.map(([v,n]) => `<option value="${v}">${n}</option>`).join('')}</select></label>`:''}
      ${miss.length?`<div class="needbox">${ic('warn')}<div>Publishing needs ${miss.map(c => `<b>${esc(M3.conn(c).n)}</b>`).join(', ')} connected in this browser. 3x3's server publishes only through the official APIs (YouTube Data API, Meta Graph, TikTok Content Posting API).<div class="row" style="gap:6px;margin-top:8px;flex-wrap:wrap">${fixLinks(miss)}</div></div></div>`:''}</div>`; }
  if (e === 'needs' && st.capHit) { const h = st.capHit; return `<div class="sact col"><div class="needbox">${ic('dollar')}<div><b>Needs you: daily spend cap reached.</b> Estimated spend today is $${Store.spentToday().toFixed(2)} of your $${h.cap}/day cap, and ${sd.n} costs about $${h.cost.toFixed(2)}. It can run tomorrow (the cap resets at midnight, Asia/Manila). <span class="muted">(Simulated ledger. In production the server and your bot enforce the cap.)</span>
      <div class="row" style="gap:6px;margin-top:8px;flex-wrap:wrap"><button class="btn sm" data-x="retry" data-id="${id}" data-k="${k}">${ic('refresh')}Try again</button><button class="btn sm ghost" data-x="resetspend" data-id="${id}" data-k="${k}">${ic('bolt')}Simulate a new day (test)</button></div></div></div></div>`; }
  if (e === 'needs' && st.ageGate) { const g = st.ageGate, am = M3.ageMin(p.intake.market);
    const badge = x => { const c = g.confirmed[x]; if (!c) return '<span class="badge warn">Waiting for you</span>'; return c.outcome === 'kept_private' ? '<span class="badge mute">Kept private</span>' : `<span class="badge grn">Age-restricted ${fmtT(c.at)}</span>`; };
    const btns = x => { if (g.confirmed[x]) return '';
      const fbChk = x === 'fb' ? `<label class="ack ${g.fbPageChecked?'on':''}" style="margin:0 0 6px"><input type="checkbox" data-x="fbpage" data-id="${id}" ${g.fbPageChecked?'checked':''}><span>I checked the Page's age restriction (legal drinking age or the alcohol option)</span></label>` : '';
      return `<div style="display:grid;gap:6px;justify-items:end">${fbChk}<div class="row" style="gap:6px;flex-wrap:wrap;justify-content:flex-end"><button class="btn sm pri" data-x="ageconfirm" data-id="${id}" data-p="${x}" ${x === 'fb' && !g.fbPageChecked ? 'disabled' : ''}>${ic('check')}${{yt:'18+ set in Studio: age-restricted', tt:'18+ audience set: age-restricted', fb:`Age-restricted: publish (age_min ${am})`, ig:'Minimum age set: age-restricted'}[x]}</button><button class="btn sm ghost" data-x="agekeep" data-id="${id}" data-p="${x}">${ic('lock')}18+ isn't available: keep private / don't post</button></div></div>`; };
    return `<div class="sact col"><div class="needbox">${ic('warn')}<div><b>Needs you: answer for each alcohol post.</b> Nothing is auto-published, and 3x3 never makes alcohol public. Answer "age-restricted" or "keep private / don't post" for every platform. <span class="muted">(Each answer simulates the server call confirm_age_gate(publish_id, platform, file_hash, text_version, outcome).)</span>
      <div class="agebox">${g.plats.map(x => `<div class="agerow"><div><b>${PLATN[x]}</b> ${badge(x)}<small>${esc(M3.ALCOHOL_STEPS[x])}</small></div>${btns(x)}</div>`).join('')}</div></div></div></div>`; }
  if (e === 'needs') return `<div class="sact col"><div class="needbox">${ic('warn')}<div><b>Needs you:</b> ${sd.n} can't run until ${st.missing.map(c => `<b>${esc(M3.connLabelMissing(c, Store.getConnection(c)))}</b>`).join(', ')} ${st.missing.length>1?'are':'is'} connected. It resumes on its own once connected.
      <div class="row" style="gap:6px;margin-top:8px;flex-wrap:wrap">${fixLinks(st.missing)}<button class="btn sm ghost" data-x="force" data-id="${id}" data-k="${k}" title="Test only">${ic('bolt')}Simulate anyway (test)</button></div></div></div></div>`;
  if (e === 'failed') return `<div class="sact col"><div class="errbox">${ic('x')}<span>${esc(st.error||'Failed')}</span></div><div class="row" style="gap:8px"><button class="btn pri" data-x="retry" data-id="${id}" data-k="${k}">${ic('refresh')}Retry</button></div></div>`;
  if (e === 'stale') return `<div class="sact col"><div class="stalebox">${ic('warn')}<div><b>Re-approval needed.</b> Something upstream changed after this was ${st.approval?'approved':'made'} (inputs ${st.inputHash.slice(0,8)} ≠ current ${Pipeline.inputHash(p,k).slice(0,8)}). ${ready?'Regenerate from the updated inputs, then approve again.':'Finish the earlier steps first.'}</div></div>
      ${ready?`<div class="row" style="gap:8px"><button class="btn pri" data-x="regen" data-id="${id}" data-k="${k}">${ic('refresh')}Regenerate from updated inputs</button></div>`:''}</div>`;
  if (e === 'awaiting') return `<div class="sact"><button class="btn pri" data-x="approve" data-id="${id}" data-k="${k}" ${ready&&!(k==='script'&&(M3.scriptBanned(st.output.beats,p.rules).length||M3.scriptPlaceholders(st.output).length))&&!(k==='voice'&&!M3.voInWindow(st.output.seconds,p.intake.dur)&&!Pipeline.voOverridden(st))?'':'disabled'}>${ic('check')}Approve</button><button class="btn ghost" data-x="regen" data-id="${id}" data-k="${k}">${ic('refresh')}Regenerate</button>
      <span class="muted mono" style="font-size:11px">inputs ${st.inputHash.slice(0,8)} · output ${st.output.hash.slice(0,8)}</span></div>`;
  if (e === 'done') return `<div class="sact"><span class="lockline">${ic('lock')}${st.approval&&!st.approval.auto?'Approved':'Completed'} ${st.approval?fmtT(st.approval.at):''} · lock <span class="mono">${st.approval?M3.hash([st.approval.inputHash, st.approval.outputHash]).slice(0,8):''}</span></span>${sd.approval||k==='script'?`<button class="btn sm ghost" data-x="regen" data-id="${id}" data-k="${k}">${ic('refresh')}Regenerate</button>`:''}</div>`;
  if (e === 'idle' && ready && k !== 'rules') return `<div class="sact"><button class="btn" data-x="retry" data-id="${id}" data-k="${k}">${ic('play')}Start</button></div>`;
  if (e === 'skipped') return `<div class="sact"><span class="muted">Voiceover is off in this intake.</span></div>`;
  return '';
}
function project(id){
  const p = Store.getProject(id);
  if (!p) return `<div class="empty"><h3>Project not found</h3><p>It may have been deleted, or it lives in another browser. Data is stored on this device only.</p><a class="btn pri" href="#/projects" style="margin-top:12px">All projects</a></div>`;
  const conns = Store.getConnections(), ws = M3.warnings(p.intake, conns), pr = Pipeline.progress(p);
  const stepper = M3.STAGES.map((s, i) => { const e = Pipeline.eff(p, s.k); const [t, c] = M3.STATUS[e];
    return `<a class="pstep ${c}" href="#stage-${s.k}"><span class="pn">${e==='done'?ic('check'):i+1}</span><span class="pt">${s.s}</span><span class="ps">${t}</span></a>`; }).join('');
  return `<div class="crumbline"><a href="#/projects">${ic('al')}Projects</a></div>` +
  pageHead(`${esc(p.labels.goalName)} · ${esc(p.labels.nicheName)}`, esc(p.topic), `${esc(p.brand)} · ${esc(p.labels.formatName)} · ${p.intake.dur}s · ${esc(p.intake.aspect)} · ${esc(p.labels.styleName)} · ${p.labels.voiceName?esc(p.labels.voiceName)+' voice':'no voiceover'}`,
    `<div class="pring"><b>${pr.pct}%</b><span>${pr.done}/${pr.total} steps</span></div>`) +
  `<div class="chips" style="margin:-8px 0 14px"><span class="badge cyan">${ic('dollar')}Spend cap $${(p.rules.budget||{}).daily_cap_usd||20}/day per user</span><span class="badge mute">Intake v${p.intake.version||1} · read-only</span>${p.intake.plat.tt?(p.intake.dur>60?'<span class="badge grn">TikTok: Creator Rewards eligible</span>':'<span class="badge warn">TikTok: Reach only, not eligible for Creator Rewards</span>'):''}${(p.rules.rule_bundles_applied||[]).map(b=>`<span class="badge vio">${ic('lock')}${esc(b)} bundle</span>`).join('')}${M3.isAlcohol(p.intake)?'<span class="badge warn">Alcohol: uploaded private on every platform</span>':''}</div>` +
  `<div class="pstepper">${stepper}</div>` +
  (ws.length ? `<div class="warnbox"><div class="wh">${ic('warn')}<b>${ws.length} connection${ws.length>1?'s':''} missing for this project</b><span>Those steps stop at "Needs you" until connected.</span></div>${ws.map(w => `<a class="wline" href="#/connections?focus=${w.id}"><span>${esc(w.text)}</span><small>${esc(w.why)}</small><b>Fix ${ic('ar')}</b></a>`).join('')}</div>` : `<div class="okline">${ic('check')}All connections for this project are ready.</div>`) +
  `<div class="stages">${M3.STAGES.map((s, i) => { const st = p.stages[s.k], e = Pipeline.eff(p, s.k), needs = M3.stageNeeds(s.k, p.intake);
    const pubNeeds = s.k === 'publish' ? Pipeline.publishTargets(p).map(t => M3.CONNS.find(c => c.plat === t.plat).id) : [];
    const all = needs.concat(pubNeeds).filter((v,j,a) => a.indexOf(v) === j);
    return `<section class="stage ${e}" id="stage-${s.k}"><div class="shd"><div class="sno">${i+1}</div><div class="ico">${ic(s.icon)}</div><div class="grow"><h3>${s.n} ${s.approval?'<span class="badge mute">approval</span>':''}</h3><p>${s.d}</p>
      <div class="needs">${all.map(c => `<span class="ntag ${M3.isOk(conns[c])?'ok':'no'}">${M3.isOk(conns[c])?ic('check'):ic('x')}${esc(M3.conn(c).n)}</span>`).join('')}</div></div>${chip(e)}</div>
      ${artifact(p, s.k)}${stageActions(p, s.k)}</section>`; }).join('')}</div>
  <div class="grid g2" style="margin-top:18px;align-items:start">
    <div class="panel"><div class="lbl" style="margin-top:0">${ic('list')}Activity</div><div class="log" tabindex="0" role="log" aria-label="Project activity">${(p.log||[]).slice(0,25).map(l => `<div><span>${fmtT(l.at)}</span>${esc(l.text)}</div>`).join('')}</div></div>
    <div class="panel testtools"><div class="lbl" style="margin-top:0">${ic('wand')}Test tools <span class="badge warn" style="text-transform:none;letter-spacing:0">Simulation only</span></div>
      <p class="muted">No real jobs run. A simulator stands in for your Grok Bot worker. Things to try: approve through to Final, then <b>Swap</b> one still. Video and Final switch to <b>Re-approval needed</b>.</p>
      <div class="row" style="gap:8px;flex-wrap:wrap;margin-top:10px"><button class="btn sm ${Sim3x3.failNext?'pri':''}" data-x="failnext">${ic('x')}${Sim3x3.failNext?'Next job will fail ✓':'Make next job fail'}</button>
      <button class="btn sm ${Store.getFlags().tiktok_direct_post_audited?'pri':''}" data-x="ttaudit">${ic('bolt')}${Store.getFlags().tiktok_direct_post_audited?'TikTok audit passed ✓ (simulated)':'Simulate: TikTok audit passed'}</button><button class="btn sm" data-x="speed">${ic('bolt')}Speed ${Sim3x3.speed}×</button><button class="btn sm" data-x="reset" data-id="${p.id}">${ic('refresh')}Reset simulation</button><button class="btn sm danger" data-x="delproject" data-id="${p.id}">${ic('trash')}Delete project</button></div></div>
  </div>`;
}

/* ================= CONNECTIONS ================= */
const PLATN = {yt:'YouTube', fb:'Facebook', tt:'TikTok', ig:'Instagram'};
function workerCard(focus){
  const c = M3.conn('worker'), st = Store.getConnection('worker'), status = st.status || 'missing', W = Pages._w;
  let body = '';
  if (status === 'missing' || status === 'relogin') body = `
    <ol class="wsteps"><li class="on"><b>Step 1.</b> In Grok Bot, create the 3x3 routine from our template. Copy its webhook URL and routine key, and paste them below.</li></ol>
    <label class="field"><span>Routine webhook URL</span><input class="inp" id="w-url" maxlength="300" placeholder="https://… (your 3x3 routine's webhook)" autocomplete="off" spellcheck="false"></label>
    <label class="field"><span>Routine key <em class="testtag">Test mode: fake values starting with test_ only</em></span><input class="inp" id="w-key" type="password" maxlength="46" placeholder="test_routine_1" autocomplete="off" spellcheck="false" aria-describedby="w-keyhelp"></label>
    <p class="muted" id="w-keyhelp" style="margin:-4px 0 10px">We store the key encrypted on our server. After you save, we only show its last 4 characters. <span class="testtag" style="margin:0">Test mode stores nothing real: only the last 4 characters stay in this browser.</span></p>
    <button class="btn pri" data-x="wsave">${ic('check')}Save and continue</button><div class="ferr ${W.err?'on':''}" id="err-worker">${esc(W.err||'')}</div>`;
  else if (status === 'pending') body = `
    <div class="kv"><span>Webhook</span><b class="mono">${esc(st.url||'')}</b></div><div class="kv"><span>Routine key</span><b class="mono">••••${esc(st.last4||'')}</b></div>
    <ol class="wsteps"><li class="done"><b>Step 1.</b> Routine saved.</li><li class="on"><b>Step 2.</b> Here is your 3x3 signing secret. Copy it now and save it in your Grok Bot as a secret named <code>THREEX3_SIGNING_SECRET</code>. We will only show it once.</li></ol>
    ${W.secret ? `<div class="secretbox"><code id="sigsec">${esc(W.secret)}</code><button class="btn sm" data-x="copysecret">${ic('edit')}Copy</button></div><p class="muted" style="font-size:11.5px;margin-top:4px"><span class="testtag" style="margin:0">Test mode</span> This is a fake secret made in your browser. It's never saved: once you leave or reload, it's gone.</p>`
      : `<div class="needbox">${ic('warn')}<div>The signing secret was shown once and can't be shown again. If you didn't save it, <a data-x="rotate" style="color:var(--cyan);cursor:pointer;font-weight:600">rotate the signing secret</a> to get a new one.</div></div>`}
    <label class="ack ${W.saved?'on':''}"><input type="checkbox" data-x="wsaved" ${W.saved?'checked':''}><span>I've saved the signing secret in my Grok Bot.</span></label>
    <div class="row" style="gap:8px;margin-top:10px;flex-wrap:wrap"><button class="btn pri" data-x="wtest" ${W.saved && !W.testing ? '' : 'disabled'}>${W.testing?'<span class="spin"></span>':ic('play')}Send a test job</button>
      <button class="btn sm ghost" data-x="wfailnext" title="Test only">${ic('wand')}${Sim3x3.failNext?'Next test will fail ✓':'Simulate: bot unreachable'}</button><button class="btn sm ghost" data-x="wremove">Start over</button></div>
    ${W.fail ? `<div class="errbox" style="margin-top:10px">${ic('x')}<span>We couldn't reach your bot. Check the webhook URL and routine key, then try again.</span></div>` : ''}`;
  else body = `
    <div class="okline" style="margin:0 0 10px">${ic('check')}Worker connected. Your bot received a signed test job and replied.</div>
    <div class="kv"><span>Webhook</span><b class="mono">${esc(st.url||'')}</b></div><div class="kv"><span>Routine key</span><b class="mono">••••${esc(st.last4||'')}</b></div>
    <div class="kv"><span>Signing secret</span><b class="mono">fingerprint ${esc(st.fp||'')}</b></div><div class="kv"><span>Mode</span><b>webhook · last reply ${st.lastReply?Pages.fmtT(st.lastReply):'—'}</b></div>
    <div class="row" style="gap:8px;margin-top:10px;flex-wrap:wrap"><button class="btn sm ghost" data-x="rotate">${ic('refresh')}Rotate signing secret</button><button class="btn sm danger" data-x="rotate" data-leak="1">${ic('warn')}Rotate now (suspected leak)</button><button class="btn sm ghost" data-x="wremove">Change routine</button></div>
    <p class="muted" style="font-size:12px;margin-top:6px">${ic('info')} Rotating stops all running jobs straight away. Paste the new secret into your bot to continue.</p>`;
  const flag = status !== 'connected';
  const chipS = status === 'pending' ? 'pending' : status;
  return `<section class="ccard wide ${flag?'flag':''} ${focus==='worker'?'focus':''}" id="conn-worker"><div class="chd"><div class="ico" style="--c:${c.c}1f;--cc:${c.c}">${ic(c.icon)}</div><div class="grow"><h3>Connect your Grok Bot</h3><p class="reqtxt">Needed for every AI step</p></div>${cchip(chipS)}</div>
    <p>${esc(c.what)}</p>${body}
    <div class="infobox" style="margin:14px 0 0">${ic('lock')}<div>Your bot keeps three secrets that you add yourself: <code>XAI_API_KEY</code>, <code>ELEVENLABS_API_KEY</code> and <code>THREEX3_SIGNING_SECRET</code>. It never holds your YouTube, Facebook, Instagram or TikTok logins.</div></div></section>`;
}
function botSecretCard(c, focus){
  const st = Store.getConnection(c.id), I = draftI(), req = M3.requirements(I)[c.id], status = st.status || 'missing';
  const statusTxt = req ? `Needed for your current intake · ${stageNames(req.stages).join(', ')}` : 'Not needed for your current intake';
  return `<section class="ccard ${req&&status!=='connected'?'flag':''} ${focus===c.id?'focus':''}" id="conn-${c.id}"><div class="chd"><div class="ico" style="--c:${c.c}1f;--cc:${c.c}">${ic(c.icon)}</div><div class="grow"><h3><code>${c.secret}</code></h3><p class="${req?'reqtxt':'muted'}">${statusTxt}</p></div>${cchip(status)}</div>
    <p>${esc(c.what)}</p>
    <div class="storedin" style="margin-top:8px">${ic('lock')}<div><b>Stored in your Grok Bot, not here.</b> 3x3 never asks for this key. Your bot reports whether it's set.</div></div>
    <details class="howto"><summary>${ic('info')}How to add it in your bot</summary><p>${esc(c.how)}</p></details>
    <div class="simrow"><span class="testtag" style="margin:0">Simulated status</span>${['connected','missing'].map(v => `<button class="btn sm ${status===v?'pri':'ghost'}" data-x="simstatus" data-c="${c.id}" data-v="${v}" aria-pressed="${status===v}">${v==='connected'?'Set in bot':'Missing'}</button>`).join('')}</div></section>`;
}
function socialCard(c, focus){
  const st = Store.getConnection(c.id), I = draftI(), req = M3.requirements(I)[c.id], status = st.status || 'missing';
  const statusTxt = req ? `Needed for your current intake · Publish` : (c.optional ? 'Optional' : 'Not needed for your current intake');
  const label = status === 'connected' ? `Connected as ${esc(st.account||c.acct)} <span class="muted">(simulated)</span>` : status === 'relogin' ? 'Needs sign-in again' : 'Disconnected';
  const cls = status === 'connected' ? 'grn' : status === 'relogin' ? 'amber' : 'red';
  let extra = '';
  if (c.id === 'tiktok') extra = `<div class="needbox" style="margin-top:10px">${ic('info')}<div>${esc(M3.TIKTOK_NOTE)}</div></div>`;
  if (M3.isAlcohol(I) && c.plat && I.plat && I.plat[c.plat]) extra += `<div class="needbox" style="margin-top:10px">${ic('warn')}<div>${esc(M3.ALCOHOL_YT)}</div></div>`;
  return `<section class="ccard ${req&&status!=='connected'?'flag':''} ${focus===c.id?'focus':''}" id="conn-${c.id}"><div class="chd"><div class="ico" style="--c:${c.c}1f;--cc:${c.c}">${ic(c.icon)}</div><div class="grow"><h3>${c.n} ${c.optional?'<span class="badge mute">optional</span>':''}</h3><p class="${req?'reqtxt':'muted'}">${statusTxt}</p></div><span class="schip ${cls}"><i></i>${status==='connected'?'Connected':status==='relogin'?'Needs sign-in again':'Disconnected'}</span></div>
    <div class="kv"><span>Status</span><b>${label}</b></div>
    <div class="kv"><span>Permissions</span><b style="font-weight:500">${esc(c.perms)}</b></div>
    <div class="kv"><span>Publishes via</span><b style="font-weight:500">${esc(c.api)}</b></div>
    <div class="row" style="gap:8px;margin-top:10px;flex-wrap:wrap">${status === 'connected'
      ? `<button class="btn sm ghost" data-x="sdisconnect" data-c="${c.id}">Disconnect</button><button class="btn sm ghost" data-x="sexpire" data-c="${c.id}" title="Test only">${ic('wand')}Simulate: sign-in expired</button>`
      : `<button class="btn pri" data-x="oauth" data-c="${c.id}">${ic('plug')}${status==='relogin'?'Sign in again':esc(c.btn)}</button>`}</div>${extra}</section>`;
}
function stuckCard(){
  const h = Store.getFlags().routine_health || {}, tools = `<div class="row testtools" style="gap:6px;flex-wrap:wrap;margin:0 0 12px"><span class="testtag">Test tools · simulated</span><button class="btn sm ghost" data-x="stucksim">${ic('wand')}${h.stuck_since ? 'Stuck routine shown ✓ (next reason)' : 'Simulate: routine stuck'}</button>${h.stuck_since ? `<button class="btn sm ghost" data-x="stuckback">${ic('refresh')}Simulate: flag came back within 24 h</button><button class="btn sm ghost" data-x="stuckoff">${ic('x')}Clear</button>` : ''}</div>`;
  if (!h.stuck_since) return tools;
  const recopy = h.stuck_reason === 'template_outdated' || h.returned;
  return tools + `<section class="ccard flag" id="conn-stuck" role="alert"><div class="chd"><div class="ico" style="--c:#EA39431f;--cc:#EA3943">${ic('warn')}</div><div class="grow"><h3>Your 3x3 routine isn't picking up jobs</h3><p class="reqtxt">Reason: ${esc(M3.STUCK_REASONS[h.stuck_reason] || h.stuck_reason)} (<code>${esc(h.stuck_reason)}</code>) · since ${fmtT(h.stuck_since)}</p></div><span class="schip no">Stuck</span></div>
    <p>Tell your bot: <b>delete <code>~/.3x3/keyset.v${h.keyset_v || 1}.json</code>, then run the 3x3 check.</b></p>
    ${recopy ? `<div class="needbox" style="margin-top:10px">${ic('warn')}<div><b>That didn't fix it${h.stuck_reason === 'template_outdated' ? ' (your template is out of date)' : ' (the flag came back within 24 hours)'}.</b> Re-copy the routine: in Grok Bot, create the 3x3 routine again from our template, then paste its new webhook URL and routine key in the Worker card below and save the new signing secret in your bot.</div></div>` : ''}
    <div class="row" style="gap:8px;margin-top:10px"><button class="btn sm" data-x="stuckcheck">${ic('refresh')}I did that: check again (simulated)</button></div>
    <p class="muted" style="margin-top:8px">Test mode: this card reads a simulated <code>routine_health.stuck_since</code>. In production it comes from your routine's status ping or the server's unclaimed-jobs check.</p></section>`;
}
function connections(focus){
  const conns = Store.getConnections(), I = draftI(), ws = M3.warnings(I, conns);
  return pageHead('Connections', 'Keys & logins', 'Your Grok Bot does the AI work with your own keys. 3x3\'s server publishes, only what you approve.') +
  (ws.length ? `<div class="warnbox big"><div class="wh">${ic('warn')}<b>${ws.length} required connection${ws.length>1?'s':''} missing for your current intake</b><span>Steps that need them will stop at "Needs you".</span></div>${ws.map(w => `<a class="wline" href="#/connections?focus=${w.id}"><span>${esc(w.text)}</span><small>${esc(w.why)}</small><b>Fix ${ic('ar')}</b></a>`).join('')}</div>`
    : `<div class="okline">${ic('check')}Everything your current intake needs is connected.</div>`) +
  `<div class="infobox">${ic('shield')}<div><b>Test mode.</b> Everything here is simulated and stored on this device only. The routine key field accepts only fake values that start with <code>test_</code>. The signing secret is a fake made in your browser and shown once. Social Connect buttons simulate the official sign-in popup.<br>
    <b>In production</b> the routine key and social logins go to 3x3's server, encrypted (Vault). <b>Planned, not built yet</b> (this test site only simulates it): 3x3's server signs every job it sends to your bot with its own private key (Ed25519), which never leaves the server. Your routine checks that signature against a list of 3x3's public keys, and that list is itself signed by two offline 3x3 root keys (a primary and a backup) built into the template, so a fake job is rejected. Your signing secret (<code>THREEX3_SIGNING_SECRET</code>) is only used the other way: your routine signs its replies to 3x3 with it. Publishing runs on 3x3's server through the official APIs only (YouTube Data API, Meta Graph API, TikTok Content Posting API).</div></div>` +
  `<h2 class="sect">${ic('bolt')}Worker (your Grok Bot)</h2>` + stuckCard() + workerCard(focus) +
  `<div class="cgrid" style="margin-top:12px">${M3.CONNS.filter(c => c.kind === 'botsecret').map(c => botSecretCard(c, focus)).join('')}</div>` +
  `<h2 class="sect">${ic('globe')}Connect where you publish</h2>
   <p class="sectintro">Sign in to each platform here, in this browser, with its official sign-in screen. 3x3 stores the access encrypted on our server and uses it only to publish videos you approve. Your Grok Bot never sees these logins.</p>
   <div class="infobox" style="background:rgba(22,199,132,.06);border-color:rgba(22,199,132,.3)">${ic('info')}<div>${esc(M3.PUBLISH_NOTE)}</div></div>
   <div class="cgrid">${M3.CONNS.filter(c => c.kind === 'oauth').map(c => socialCard(c, focus)).join('')}</div>` + oauthModal();
}
/* simulated sign-in pre-fills the brand you're drafting, so the connected channel/Page matches it unless you change it */
function oauthDefault(c){ const I = window.Intake && Intake.state, nm = I && I.name && I.name !== 'Your brand' ? I.name : '', hd = I && I.handle && I.handle !== '@yourbrand' ? I.handle : '';
  if (c.id === 'facebook') return nm ? nm + ' (Page)' : c.acct; if (c.id === 'youtube') return nm || c.acct; return hd || c.acct; }
function oauthModal(){ const m = Pages._oauth; if (!m) return ''; const c = M3.conn(m.id);
  return `<div class="modalbg" role="dialog" aria-modal="true" aria-labelledby="oauth-t"><div class="modal oauth">
    <div class="ohd"><div class="ico" style="--c:${c.c}1f;--cc:${c.c};margin:0">${ic(c.icon)}</div><div><small>accounts.${c.provider.toLowerCase()}.com · <span class="testtag" style="margin:0">Simulated sign-in popup</span></small><h3 id="oauth-t">Sign in with ${esc(c.provider)}</h3></div></div>
    <p>Choose ${c.id==='facebook'?'a Page':'an account'} to continue to <b>3x3</b></p>
    ${c.id==='facebook'
      ? `<label class="field"><span>Page</span><select class="inp" id="oauth-acct">${[oauthDefault(c), 'Johnny Bodegas (Page)'].filter((v,i,a)=>a.indexOf(v)===i).map(v=>`<option>${esc(v)}</option>`).join('')}</select></label>`
      : `<label class="field"><span>Account</span><input class="inp" id="oauth-acct" maxlength="60" value="${esc(oauthDefault(c))}"></label>`}
    <div class="perm"><b>3x3 wants to:</b><p>${esc(c.perms)}</p></div>
    <p class="muted" style="font-size:12px">Test mode: no real sign-in happens and no password is asked for. In production this is ${esc(c.provider)}'s own consent screen, and the access token goes to 3x3's server, encrypted. Your Grok Bot never sees it.</p>
    <div class="row" style="gap:8px;justify-content:flex-end;margin-top:12px"><button class="btn ghost" data-x="oauthcancel">Cancel</button><button class="btn pri" data-x="oauthallow">${ic('check')}Allow</button></div></div></div>`; }

/* ================= ONBOARDING ================= */
function onboarding(){
  const conns = Store.getConnections(), ob = Store.getOnboarding(), I = draftI(), req = M3.requirements(I);
  const ok = id => M3.isOk(conns[id]); const w = conns.worker || {};
  const socials = ['youtube','facebook','tiktok','instagram'].filter(id => req[id]);
  const testProject = Store.listProjects().some(p => ['done'].includes(Pipeline.eff(p, 'final')));
  const steps = [
    {t:'Create the 3x3 routine in your Grok Bot', done:!!ob.botCreated || !!w.last4, icon:'user',
     body:`<p>Each 3x3 user runs their own Grok Bot. It does the AI work on your own subscription and keys.</p><ol class="olist"><li>Open Grok Bot and create the <b>3x3 routine</b> from our template. The template link comes from Johnny; it isn't public yet.</li><li>Open the routine and copy its <b>webhook URL</b> and <b>routine key</b>.</li></ol>
       <label class="ack ${ob.botCreated?'on':''}" style="margin-top:10px"><input type="checkbox" data-x="obcheck" data-k="botCreated" ${ob.botCreated?'checked':''}><span>I've created the 3x3 routine</span></label>`},
    {t:'Paste the webhook URL and routine key into 3x3', done:!!w.last4, icon:'bolt', link:'worker',
     body:`<p>Go to Connections › Worker and paste both, then click <b>Save and continue</b>. We store the key encrypted on our server and only show its last 4 characters afterwards.</p><p class="muted">Test mode: the key field only accepts fake values that start with <code>test_</code>.</p>`},
    {t:'Add your xAI and ElevenLabs keys to your bot', done:ok('imagine') && (ok('elevenlabs') || !req.elevenlabs), icon:'spark', link:'imagine',
     body:`<p>In Grok Bot, add two secrets yourself: <code>XAI_API_KEY</code> (stills and clips through the official xAI API) and <code>ELEVENLABS_API_KEY</code> (voiceover${req.elevenlabs?'':'; your current intake has voiceover off'}). 3x3 never sees these keys.</p>`},
    {t:'Save the signing secret and send a test job', done:ok('worker'), icon:'shield', link:'worker',
     body:`<p>After you save the routine, 3x3 shows your <b>signing secret once</b>. Save it in your bot as <code>THREEX3_SIGNING_SECRET</code>, tick "I've saved the signing secret in my Grok Bot", then click <b>Send a test job</b>. When your bot replies, Connections shows <b>Worker connected</b>.</p>
       <p class="muted">Your bot keeps just three secrets you add yourself: XAI_API_KEY, ELEVENLABS_API_KEY and THREEX3_SIGNING_SECRET. It never holds your YouTube, Facebook, Instagram or TikTok logins.</p>`},
    {t:'Connect where you publish', done:socials.length ? socials.every(ok) : false, icon:'globe', link:socials.find(s => !ok(s)) || 'youtube',
     body:`<p>Sign in to each platform <b>here, in this browser</b>, on its official sign-in screen. 3x3 stores the access encrypted on our server and uses it only to publish videos you approve. Your Grok Bot never sees these logins.</p>
       <ul class="olist">${['youtube','facebook','tiktok','instagram'].map(id => { const s = conns[id] || {}; return `<li>${esc(M3.conn(id).n)}: ${ok(id)?`<b style="color:var(--green)">connected as ${esc(s.account||'')}</b>`:req[id]?'<b style="color:#ffb1b5">needed for your intake</b>':'not needed for your intake'}</li>`; }).join('')}</ul>${socials.length?'':'<p class="muted">Pick platforms in intake step 8 first.</p>'}
       <p class="muted">${esc(M3.TIKTOK_NOTE)}</p>`},
    {t:'Make a test video', done:testProject, icon:'rocket',
     body:`<p>Run one project end to end: lock an intake, create the project, and approve Script, Stills, Video and Final. Nothing is posted until you approve publishing. <span class="muted">(Simulated in this build.)</span></p><a class="btn sm pri" href="#/intake/1" style="margin-top:8px">${ic('play')}Start an intake</a>`},
  ];
  const n = steps.filter(s => s.done).length, pct = Math.round(n / steps.length * 100);
  return pageHead('Onboarding', 'Set up 3x3 in 6 steps', 'Your Grok Bot does the AI work with your own keys. 3x3 publishes, only what you approve. This checklist updates from Connections.') +
  `<div class="obprog"><div class="row" style="justify-content:space-between"><b>${n} of ${steps.length} done</b><span>${pct}%</span></div><div class="bar" style="height:8px;margin-top:8px"><i style="width:${pct}%"></i></div>
   <div class="obdots">${steps.map((s,i) => `<span class="${s.done?'d':''}">${s.done?ic('check'):i+1}</span>`).join('')}</div></div>
  <div class="oblist">${steps.map((s, i) => `<section class="obstep ${s.done?'done':''}"><div class="obn">${s.done?ic('check'):i+1}</div><div class="grow"><h3>${s.t}</h3>${s.body}${s.link?`<a class="btn sm" style="margin-top:10px" href="#/connections?focus=${s.link}">${ic('plug')}Open in Connections</a>`:''}</div></section>`).join('')}</div>
  <div class="infobox" style="margin-top:18px">${ic('user')}<div><b>Who holds what</b>
    <ul class="olist"><li><b>Your Grok Bot:</b> XAI_API_KEY, ELEVENLABS_API_KEY and THREEX3_SIGNING_SECRET, which you add yourself. It runs the AI steps and never touches your social accounts.</li>
    <li><b>3x3's server (encrypted):</b> your routine key and your social sign-ins. It sends signed jobs to your bot and publishes only videos you approve, through the official APIs.</li>
    <li><b>This browser:</b> where you sign in to YouTube, Facebook, Instagram and TikTok on their official screens. You never type platform passwords into 3x3 or into chat.</li></ul></div></div>`;
}

window.Pages = {projects, project, connections, onboarding, fmtT, _w:{}, _oauth:null};
})();
