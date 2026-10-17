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
    case 'script': return `<div class="art"><div class="row" style="gap:8px;margin-bottom:8px;flex-wrap:wrap"><span class="badge mute">Draft ${o.draft}</span><span class="badge mute">≈${o.words} words</span><span class="badge warn">Simulated draft. The real worker writes the lines.</span></div>
      <ol class="beatlist">${o.beats.map(b => `<li><b>${esc(b.b)}</b><span>${esc(b.line)}</span>${b.src?`<small>${ic('link')}${esc(b.src)}</small>`:''}</li>`).join('')}</ol></div>`;
    case 'voice': return `<div class="art row" style="gap:14px;align-items:center;flex-wrap:wrap"><div class="ico">${ic('mic')}</div><div class="wave on" style="display:flex;flex:1;min-width:140px">${Array.from({length:40},(_,j)=>`<i style="--h:${20+Math.abs(Math.sin(j*1.3))*75}%;--d:${(j%7)*-0.13}s;--s:.7"></i>`).join('')}</div>
      <div class="muted">${esc(p.labels.voiceName||'Voice')} · ${o.seconds}s · ~${o.chars.toLocaleString()} chars</div></div>`;
    case 'stills': { const canSwap = !busy && st.status !== 'idle';
      return `<div class="art"><p class="muted" style="margin-bottom:8px">${o.frames.length} stills · ${esc(p.labels.styleName)}. Swap any one: it gets a new version, and anything already approved after Stills will need re-approval.</p>
      <div class="stills">${o.frames.map(f => stillTile(p, f, canSwap, busy && st.jobId && Store.getJob(st.jobId) && Store.getJob(st.jobId).payload.swap === f.i)).join('')}</div></div>`; }
    case 'video': return `<div class="art"><div class="stills">${o.clips.map(c => { const f = (p.stages.stills.output||{frames:[]}).frames[c.i] || {seed:1};
      return `<div class="still clip"><div class="sv" style="background:${p.labels.styleBg};filter:hue-rotate(${(f.seed%60)-30}deg)"></div><span class="pl">${ic('play')}</span><div class="sl"><b>Clip ${c.i+1}</b><small>${c.s}s · ${esc(c.move)}</small></div></div>`; }).join('')}</div>
      ${e==='stale'?`<p class="stalemsg">${ic('warn')}These clips were made from older stills. Regenerate to use the current storyboard.</p>`:''}</div>`;
    case 'final': return `<div class="art finalart"><div class="phone mini9"><div class="scene" style="background:${p.labels.styleBg}"></div>${p.rules.ai_disclosure.on_screen_tag?'<div class="paitag">AI-generated</div>':''}
      <div class="pcap">${esc(p.topic.split(' ').slice(0,5).join(' '))}…${p.rules.affiliate_disclosure?`<span class="paff">${esc(p.rules.affiliate_disclosure.text)}</span>`:''}</div></div>
      <div style="flex:1;min-width:200px"><div class="kv"><span>File</span><b>${esc(o.file)}</b></div><div class="kv"><span>Length</span><b>${o.seconds}s · ${esc(o.aspect)}</b></div><div class="kv"><span>Loudness</span><b>${o.lufs} LUFS · ${o.true_peak} dBTP</b></div>
      <div class="kv"><span>Captions</span><b>${esc(p.intake.capStyle)} · ${esc(p.intake.capPos)}</b></div><div class="kv"><span>Music / SFX</span><b>${esc(p.intake.music)} · ${esc(p.intake.sfx)}</b></div>
      <div class="lbl">Labels burned in / applied</div><div class="chips">${o.labels.map(l => `<span class="badge vio">${esc(l)}</span>`).join('')}</div></div></div>`;
    case 'publish': return o.downloaded ? `<div class="art"><b>${ic('dl')} Downloaded</b> <span class="muted">(test build: project manifest JSON; the real build delivers the MP4)</span></div>`
      : `<div class="art"><b>${ic('check')} Queued for ${o.queued.map(x => ({yt:'YouTube',fb:'Facebook',tt:'TikTok',ig:'Instagram'})[x]).join(', ')}</b> <span class="muted">via official APIs (simulated, nothing was posted)</span></div>`;
  }
  return '';
}
function stageActions(p, k){
  const st = p.stages[k], e = Pipeline.eff(p, k), sd = M3.stage(k), id = p.id, ready = Pipeline.ready(p, k);
  const fixLinks = ids => ids.map(c => `<a class="btn sm" href="#/connections?focus=${c}">${ic('plug')}Connect ${esc(M3.conn(c).n)}</a>`).join('');
  if (e === 'running') return `<div class="sact"><span class="spin"></span><span class="muted">Your Grok Bot worker is on it (simulated)…</span></div>`;
  if (e === 'needs' && st.choice) { const miss = Pipeline.publishMissing(p);
    return `<div class="sact col"><div class="row" style="gap:8px;flex-wrap:wrap"><button class="btn pri" data-x="download" data-id="${id}">${ic('dl')}Download</button><button class="btn" data-x="queue" data-id="${id}">${ic('rocket')}Queue for publish</button></div>
      ${miss.length?`<div class="needbox">${ic('warn')}<div>Queueing needs ${miss.map(c => `<b>${esc(M3.conn(c).n)}</b>`).join(', ')}. Publishing goes only through the official APIs (YouTube Data API, Meta Graph, TikTok Content Posting API).<div class="row" style="gap:6px;margin-top:8px;flex-wrap:wrap">${fixLinks(miss)}</div></div></div>`:''}</div>`; }
  if (e === 'needs') return `<div class="sact col"><div class="needbox">${ic('warn')}<div><b>Needs you:</b> ${sd.n} can't run until ${st.missing.map(c => `<b>${esc(M3.connLabelMissing(c, Store.getConnection(c)))}</b>`).join(', ')} ${st.missing.length>1?'are':'is'} connected. It resumes on its own once connected.
      <div class="row" style="gap:6px;margin-top:8px;flex-wrap:wrap">${fixLinks(st.missing)}<button class="btn sm ghost" data-x="force" data-id="${id}" data-k="${k}" title="Test only">${ic('bolt')}Simulate anyway (test)</button></div></div></div></div>`;
  if (e === 'failed') return `<div class="sact col"><div class="errbox">${ic('x')}<span>${esc(st.error||'Failed')}</span></div><div class="row" style="gap:8px"><button class="btn pri" data-x="retry" data-id="${id}" data-k="${k}">${ic('refresh')}Retry</button></div></div>`;
  if (e === 'stale') return `<div class="sact col"><div class="stalebox">${ic('warn')}<div><b>Re-approval needed.</b> Something upstream changed after this was ${st.approval?'approved':'made'} (inputs ${st.inputHash.slice(0,8)} ≠ current ${Pipeline.inputHash(p,k).slice(0,8)}). ${ready?'Regenerate from the updated inputs, then approve again.':'Finish the earlier steps first.'}</div></div>
      ${ready?`<div class="row" style="gap:8px"><button class="btn pri" data-x="regen" data-id="${id}" data-k="${k}">${ic('refresh')}Regenerate from updated inputs</button></div>`:''}</div>`;
  if (e === 'awaiting') return `<div class="sact"><button class="btn pri" data-x="approve" data-id="${id}" data-k="${k}" ${ready?'':'disabled'}>${ic('check')}Approve</button><button class="btn ghost" data-x="regen" data-id="${id}" data-k="${k}">${ic('refresh')}Regenerate</button>
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
  `<div class="pstepper">${stepper}</div>` +
  (ws.length ? `<div class="warnbox"><div class="wh">${ic('warn')}<b>${ws.length} connection${ws.length>1?'s':''} missing for this project</b><span>Those steps stop at "Needs you" until connected.</span></div>${ws.map(w => `<a class="wline" href="#/connections?focus=${w.id}"><span>${esc(w.text)}</span><small>${esc(w.why)}</small><b>Fix ${ic('ar')}</b></a>`).join('')}</div>` : `<div class="okline">${ic('check')}All connections for this project are ready.</div>`) +
  `<div class="stages">${M3.STAGES.map((s, i) => { const st = p.stages[s.k], e = Pipeline.eff(p, s.k), needs = M3.stageNeeds(s.k, p.intake);
    const pubNeeds = s.k === 'publish' ? M3.CONNS.filter(c => c.plat && p.intake.plat[c.plat]).map(c => c.id) : [];
    const all = needs.concat(pubNeeds).filter((v,j,a) => a.indexOf(v) === j);
    return `<section class="stage ${e}" id="stage-${s.k}"><div class="shd"><div class="sno">${i+1}</div><div class="ico">${ic(s.icon)}</div><div class="grow"><h3>${s.n} ${s.approval?'<span class="badge mute">approval</span>':''}</h3><p>${s.d}</p>
      <div class="needs">${all.map(c => `<span class="ntag ${M3.isOk(conns[c])?'ok':'no'}">${M3.isOk(conns[c])?ic('check'):ic('x')}${esc(M3.conn(c).n)}</span>`).join('')}</div></div>${chip(e)}</div>
      ${artifact(p, s.k)}${stageActions(p, s.k)}</section>`; }).join('')}</div>
  <div class="grid g2" style="margin-top:18px;align-items:start">
    <div class="panel"><div class="lbl" style="margin-top:0">${ic('list')}Activity</div><div class="log">${(p.log||[]).slice(0,25).map(l => `<div><span>${fmtT(l.at)}</span>${esc(l.text)}</div>`).join('')}</div></div>
    <div class="panel testtools"><div class="lbl" style="margin-top:0">${ic('wand')}Test tools <span class="badge warn" style="text-transform:none;letter-spacing:0">Simulation only</span></div>
      <p class="muted">No real jobs run. A simulator stands in for your Grok Bot worker. Things to try: approve through to Final, then <b>Swap</b> one still. Video and Final switch to <b>Re-approval needed</b>.</p>
      <div class="row" style="gap:8px;flex-wrap:wrap;margin-top:10px"><button class="btn sm ${Sim3x3.failNext?'pri':''}" data-x="failnext">${ic('x')}${Sim3x3.failNext?'Next job will fail ✓':'Make next job fail'}</button>
      <button class="btn sm" data-x="speed">${ic('bolt')}Speed ${Sim3x3.speed}×</button><button class="btn sm" data-x="reset" data-id="${p.id}">${ic('refresh')}Reset simulation</button><button class="btn sm danger" data-x="delproject" data-id="${p.id}">${ic('trash')}Delete project</button></div></div>
  </div>`;
}

/* ================= CONNECTIONS ================= */
function secretField(id, field, label, ph){ return `<label class="field"><span>${label} <em class="testtag">Simulated, don't paste real keys</em></span><input class="inp" type="password" autocomplete="off" spellcheck="false" data-f="${id}.${field}" placeholder="${ph}"></label>`; }
function connCard(c, focus){
  const st = Store.getConnection(c.id), I = draftI(), req = M3.requirements(I)[c.id], status = st.status || 'missing';
  const statusTxt = req ? `Needed for your current intake · ${stageNames(req.stages).join(', ')}` : (c.optional ? 'Optional' : 'Not needed for your current intake');
  const used = ({worker:['Every step'], imagine:['Stills','Video'], elevenlabs:['Voiceover'], youtube:['Publish'], facebook:['Publish'], tiktok:['Publish'], instagram:['Publish'], gdrive:['Final (storage)','Publish']})[c.id];
  let body = '';
  const loginFlow = (label) => {
    if (status === 'pending') { const j = st.jobId && Store.getJob(st.jobId);
      if (j && (j.status === 'queued' || j.status === 'running')) return `<div class="sact"><span class="spin"></span><span class="muted">Sending a connect job to your Grok Bot. It will open the ${esc(label)} page in its browser…</span></div>`; }
    if (status === 'pending') return `<div class="needbox">${ic('user')}<div><b>Needs you:</b> your bot opened the ${esc(label)} page in its own browser. Open the Grok Bot app, go to your bot's <b>computer view</b>, and finish signing in there. Don't type passwords into chat. This card stays on "Needs you" until the bot confirms.
      <div class="row" style="gap:6px;margin-top:8px;flex-wrap:wrap"><button class="btn sm pri" data-x="confirm" data-c="${c.id}">${ic('check')}Simulate: bot confirmed login</button><button class="btn sm ghost" data-x="cancel" data-c="${c.id}">Cancel</button></div></div></div>`;
    if (status === 'connected') return `<div class="row" style="gap:8px;flex-wrap:wrap"><button class="btn sm ghost" data-x="disconnect" data-c="${c.id}">Disconnect</button><button class="btn sm ghost" data-x="expire" data-c="${c.id}" title="Test only">${ic('wand')}Simulate session expired</button></div>`;
    return `<button class="btn ${status==='relogin'?'pri':'pri'}" data-x="connect" data-c="${c.id}">${ic('plug')}${status==='relogin'?'Re-login':'Connect'}</button>${M3.isOk(Store.getConnection('worker'))?'':`<span class="muted" style="margin-left:8px;font-size:12px">Connect the Grok Bot worker first: the login runs on your bot.</span>`}`;
  };
  if (c.kind === 'webhook') body = status === 'connected'
    ? `<div class="kv"><span>Webhook</span><b class="mono">${esc(st.url)}</b></div><div class="kv"><span>Secret</span><b class="mono">${esc(st.hint)}</b></div><div class="row" style="gap:8px;margin-top:8px"><button class="btn sm ghost" data-x="disconnect" data-c="${c.id}">Remove</button></div>`
    : `<label class="field"><span>Worker webhook URL</span><input class="inp" data-f="worker.url" placeholder="https://… (from your bot)" autocomplete="off"></label>${secretField('worker','secret','Signing secret','test_secret_1')}<button class="btn pri" data-x="save" data-c="worker">${ic('check')}Save</button><div class="ferr" id="err-worker"></div>`;
  if (c.kind === 'apikey') body = status === 'connected'
    ? `<div class="kv"><span>Key</span><b class="mono">${esc(st.hint)}</b></div><div class="row" style="gap:8px;margin-top:8px"><button class="btn sm ghost" data-x="disconnect" data-c="${c.id}">Remove</button></div>`
    : `${secretField(c.id,'key','API key','test_eleven_1')}<button class="btn pri" data-x="save" data-c="${c.id}">${ic('check')}Save</button><div class="ferr" id="err-${c.id}"></div>`;
  if (c.kind === 'imagine') { const route = st.route || 'api';
    body = `<div class="routes"><label class="route ${route==='api'?'on':''}"><input type="radio" name="imr" data-x="route" data-v="api" ${route==='api'?'checked':''}><div><b>xAI API <span class="badge grn">Recommended at volume</span></b><small>Your bot calls the Grok Imagine API with your xAI key. Billed per generation, with documented rate limits. Best for daily posting.</small></div></label>
      <label class="route ${route==='browser'?'on':''}"><input type="radio" name="imr" data-x="route" data-v="browser" ${route==='browser'?'checked':''}><div><b>SuperGrok browser <span class="badge mute">Low volume</span></b><small>Your bot uses grok.com in its own browser, logged in to your SuperGrok account. Daily generation caps apply. Keep volume personal and follow xAI's Terms of Service; automated bulk use can get an account limited.</small></div></label></div>` +
      (route === 'api' ? (status === 'connected' ? `<div class="kv"><span>xAI key</span><b class="mono">${esc(st.hint)}</b></div><button class="btn sm ghost" data-x="disconnect" data-c="imagine">Remove</button>` : `${secretField('imagine','key','xAI API key','test_xai_1')}<button class="btn pri" data-x="save" data-c="imagine">${ic('check')}Save</button><div class="ferr" id="err-imagine"></div>`)
        : loginFlow('SuperGrok (grok.com) login')); }
  if (c.kind === 'browser' || c.kind === 'connector') body = `${c.api?`<div class="apiline">${ic('rocket')}Publishes through <b>${esc(c.api)}</b>. ${c.kind==='browser'?'The browser login only authorizes the API. Nothing is posted by driving the website.':'The OAuth login only authorizes the API.'}</div>`:''}` + loginFlow(c.kind==='browser' ? `${c.n} login` : `${c.n} authorization`);
  const flag = req && status !== 'connected';
  return `<section class="ccard ${flag?'flag':''} ${focus===c.id?'focus':''}" id="conn-${c.id}"><div class="chd"><div class="ico" style="--c:${c.c}1f;--cc:${c.c}">${ic(c.icon)}</div><div class="grow"><h3>${c.n} ${c.optional?'<span class="badge mute">optional</span>':''}</h3><p class="${req?'reqtxt':'muted'}">${statusTxt}</p></div>${cchip(status)}</div>
    <p>${esc(c.what)}</p><div class="chips" style="margin:8px 0">${used.map(u => `<span class="badge mute">${u}</span>`).join('')}</div><p class="muted" style="font-size:12px;margin-bottom:10px">${esc(c.how)}</p>${body}</section>`;
}
function connections(focus){
  const conns = Store.getConnections(), I = draftI(), ws = M3.warnings(I, conns);
  const missAll = M3.CONNS.filter(c => !c.optional && !M3.isOk(conns[c.id]));
  return pageHead('Connections', 'Keys & logins', 'Everything the automation needs from you. You bring your own accounts, and your own Grok Bot does the work.') +
  (ws.length ? `<div class="warnbox big"><div class="wh">${ic('warn')}<b>${ws.length} required connection${ws.length>1?'s':''} missing for your current intake</b><span>Steps that need them will stop at "Needs you".</span></div>${ws.map(w => `<a class="wline" href="#/connections?focus=${w.id}"><span>${esc(w.text)}</span><small>${esc(w.why)}</small><b>Fix ${ic('ar')}</b></a>`).join('')}</div>`
    : `<div class="okline">${ic('check')}Everything your current intake needs is connected${missAll.length?` (${missAll.length} unused connection${missAll.length>1?'s':''} still missing)`:''}.</div>`) +
  `<div class="infobox">${ic('shield')}<div><b>Test build: nothing here is real.</b> Key fields accept only placeholders that start with <code>test_</code>. Anything that looks like a real key is rejected and never saved. Everything is stored on this device only.<br>
    <b>Production plan:</b> keys live in each user's own Grok Bot secret store, never in this app or the browser. Jobs are signed server-side by a Supabase Edge Function (HMAC-SHA256 + timestamp + nonce) before they reach the worker webhook. Publishing uses only the official APIs (YouTube Data API, Meta Graph API for Pages/Reels and Instagram, TikTok Content Posting API). Browser logins only connect accounts.</div></div>` +
  `<div class="cgrid">${M3.CONNS.map(c => connCard(c, focus)).join('')}</div>`;
}

/* ================= ONBOARDING ================= */
function onboarding(){
  const conns = Store.getConnections(), ob = Store.getOnboarding(), I = draftI(), req = M3.requirements(I);
  const ok = id => M3.isOk(conns[id]);
  const socials = ['youtube','facebook','tiktok','instagram'].filter(id => req[id]);
  const steps = [
    {t:'Get Grok Bot and create your bot from the 3x3 template', done:!!ob.botCreated || ok('worker'), icon:'user',
     body:`<p>Each 3x3 user runs their own Grok Bot. It's your worker, on your subscription and your accounts.</p><ol class="olist"><li>Sign up for Grok Bot in the Grok Bot app.</li><li>Create a new bot from the <b>3x3 template</b>. The template link comes from Johnny (it isn't public yet).</li><li>The template installs the job handler and the step skills (rules, script, voice, stills, video, stitch, publish).</li></ol>
       <label class="ack ${ob.botCreated?'on':''}" style="margin-top:10px"><input type="checkbox" data-x="obcheck" data-k="botCreated" ${ob.botCreated?'checked':''}><span>I've created my bot from the template</span></label>`},
    {t:'Paste the worker webhook into Connections', done:ok('worker'), icon:'bolt', link:'worker',
     body:`<p>In your bot, copy the <b>worker webhook URL</b> and paste it into Connections › Grok Bot worker. This app sends each job there, and the bot reports progress back.</p><p class="muted">In production the signing secret stays in your bot and the server signs each job. In this test build, use a placeholder like <code>test_secret_1</code>.</p>`},
    {t:'Connect Grok Imagine (stills & clips)', done:ok('imagine'), icon:'spark', link:'imagine',
     body:`<p>Pick a route in Connections › Grok Imagine:</p><ul class="olist"><li><b>xAI API (recommended at volume):</b> add your xAI key. In production it's kept in your bot's secret store.</li><li><b>SuperGrok browser (low volume):</b> click Connect and finish the SuperGrok login in your bot's computer view (see "How browser logins work" below). Daily caps and xAI's Terms of Service apply.</li></ul>`},
    {t:'Add your ElevenLabs API key', done:ok('elevenlabs') || req.elevenlabs == null, icon:'mic', link:'elevenlabs',
     body:`<p>The voiceover is made with your own ElevenLabs account. Create an API key in ElevenLabs (Profile › API keys) and store it in your bot. ${req.elevenlabs?'':'<b>Your current intake has voiceover off, so you can skip this.</b>'}</p><p class="muted">Test build: placeholder only, e.g. <code>test_eleven_1</code>.</p>`},
    {t:'Connect your social accounts', done:socials.length ? socials.every(ok) : false, icon:'globe', link:socials.find(s => !ok(s)) || 'youtube',
     body:`<p>Publishing uses the official APIs only: <b>YouTube Data API</b>, <b>Meta Graph API</b> (Facebook Pages/Reels, Instagram) and the <b>TikTok Content Posting API</b>. You log in once to authorize each one.</p>
       <ul class="olist">${['youtube','facebook','tiktok','instagram'].map(id => `<li>${esc(M3.conn(id).n)}: ${ok(id)?'<b style="color:var(--green)">connected</b>':req[id]?'<b style="color:#ffb1b5">needed for your intake</b>':'not needed for your intake'}</li>`).join('')}</ul>${socials.length?'':'<p class="muted">Pick platforms in intake step 8 first.</p>'}`},
    {t:'Run a test job', done:!!ob.testJob, icon:'rocket',
     body:`<p>Sends a small "ping" job to your worker and waits for the reply. If it comes back, the webhook works end to end. <span class="muted">(Simulated in this build.)</span></p>
       <div class="row" style="gap:8px;margin-top:8px;flex-wrap:wrap"><button class="btn pri" data-x="testjob" ${ok('worker')?'':'disabled'}>${ic('play')}Run test job</button>${ok('worker')?'':'<span class="muted">Connect the worker webhook first.</span>'}${ob.testJobStatus?`<span class="schip ${ob.testJobStatus==='done'?'grn':ob.testJobStatus==='failed'?'red':'cyan'}"><i></i>${({queued:'Queued',running:'Running',done:'Bot replied ✓',failed:'Failed'})[ob.testJobStatus]}</span>`:''}</div>`},
  ];
  const n = steps.filter(s => s.done).length, pct = Math.round(n / steps.length * 100);
  return pageHead('Onboarding', 'Set up 3x3 in 6 steps', 'Each user brings their own Grok Bot, SuperGrok or xAI, ElevenLabs and social accounts. This checklist updates from your Connections.') +
  `<div class="obprog"><div class="row" style="justify-content:space-between"><b>${n} of ${steps.length} done</b><span>${pct}%</span></div><div class="bar" style="height:8px;margin-top:8px"><i style="width:${pct}%"></i></div>
   <div class="obdots">${steps.map((s,i) => `<span class="${s.done?'d':''}">${s.done?ic('check'):i+1}</span>`).join('')}</div></div>
  <div class="oblist">${steps.map((s, i) => `<section class="obstep ${s.done?'done':''}"><div class="obn">${s.done?ic('check'):i+1}</div><div class="grow"><h3>${s.t}</h3>${s.body}${s.link?`<a class="btn sm" style="margin-top:10px" href="#/connections?focus=${s.link}">${ic('plug')}Open in Connections</a>`:''}</div></section>`).join('')}</div>
  <div class="infobox" style="margin-top:18px">${ic('user')}<div><b>How browser logins work (honestly)</b>
    <ol class="olist"><li>You click <b>Connect</b> for a browser login (SuperGrok, TikTok…).</li><li>This app sends a "connect" job to <b>your own bot</b>. Your bot opens its own browser at that login page.</li><li>You open the Grok Bot app and finish the login in your bot's <b>computer view</b>. You never type passwords into chat, and this app never sees them.</li>
    <li>Until the bot confirms the session works, the card shows <b>Needs you</b>. Then it switches to <b>Connected</b>. If the session expires later, it shows <b>Needs re-login</b> and any step that needs it waits.</li></ol>
    <p class="muted">For social accounts the login only authorizes the official API. Posting goes through the API, not by clicking around the website.</p></div></div>`;
}

window.Pages = {projects, project, connections, onboarding, fmtT};
})();
