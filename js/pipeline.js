/* 3x3 · Pipeline controller. Turns stage actions into jobs (via Store) and job results into stage status.
   Approvals are hash-locked: every stage records the hash of its inputs (rules + upstream outputs).
   If an upstream artifact changes (regenerate / swap a still) the downstream input hash no longer matches,
   so that stage shows "Re-approval needed" and must be regenerated before the pipeline can continue. */
(function(){
  const now = () => new Date().toISOString();
  const KEYS = () => M3.STAGES.map(s => s.k);
  const P = {
    create(intake, rules, topic, labels){
      const stages = {}; KEYS().forEach(k => stages[k] = {status: (k === 'voice' && intake.vo === false) ? 'skipped' : 'idle', version:0});
      const p = Store.createProject({name: `${intake.name} · ${topic}`, brand:intake.name, topic, intake, rules, labels, stages, log:[]});
      P.log(p, 'Project created from locked intake (hash ' + rules.intake_hash + ')');
      P.start(p, 'rules'); return Store.getProject(p.id);
    },
    log(p, text){ p.log = p.log || []; p.log.unshift({at:now(), text}); p.log = p.log.slice(0, 80); Store.saveProject(p); },
    prevKeys(k){ const ks = KEYS(); return ks.slice(0, ks.indexOf(k)); },
    nextKey(p, k){ const ks = KEYS(); for (let i = ks.indexOf(k)+1; i < ks.length; i++) if (p.stages[ks[i]].status !== 'skipped') return ks[i]; return null; },
    inputHash(p, k){ return M3.hash([p.rules.intake_hash].concat(P.prevKeys(k).map(x => (p.stages[x].output && p.stages[x].output.hash) || (p.stages[x].status === 'skipped' ? 'skip' : 'none')))); },
    eff(p, k){ const st = p.stages[k];
      if ((st.status === 'done' || st.status === 'awaiting') && st.inputHash && st.inputHash !== P.inputHash(p, k)) return 'stale';
      return st.status; },
    ready(p, k){ return P.prevKeys(k).every(x => ['done','skipped'].includes(P.eff(p, x))); },
    missing(p, k){ const conns = Store.getConnections(); return M3.stageNeeds(k, p.intake).filter(id => !M3.isOk(conns[id])); },
    labels(p){ const r = p.rules; const L = Object.values((r.ai_disclosure||{}).platforms||{}).filter((v,i,a)=>a.indexOf(v)===i).map(x => 'AI label: ' + x);
      if (r.ai_disclosure && r.ai_disclosure.on_screen_tag) L.push('On-screen "AI-generated" tag'); if (r.affiliate_disclosure) L.push('Affiliate line: ' + r.affiliate_disclosure.text); if (r.ai_disclosure) L.push('AI tools line in description');
      const d = (r.safety || {}).disclaimer; if (d && d.text) L.unshift('Disclaimer (first frame + description): ' + d.text);   // the locked disclaimer is burned in
      return L; },
    start(p, k, opts={}){
      p = Store.getProject(p.id); const st = p.stages[k]; const sd = M3.stage(k);
      /* one active job per step: ignore repeat clicks while a job is queued or running (never charge twice) */
      if (st.status === 'running' && st.jobId) { const j = Store.getJob(st.jobId); if (j && (j.status === 'queued' || j.status === 'running')) return; }
      if (k === 'script' && st.output && (st.output.edits || []).length && !(st.draftEdits || []).some(d => d.hash === st.output.hash))   // keep earlier drafts' edit diffs through Regenerate
        st.draftEdits = (st.draftEdits || []).concat({draft:st.output.draft, hash:st.output.hash, at:now(), edits:st.output.edits}).slice(-20);
      if (k === 'publish' && !opts.queue) { Object.assign(st, {status:'needs', choice:true, missing:[], inputHash:P.inputHash(p, k), error:null}); P.log(p, 'Final approved. Choose Download or Queue for publish'); return; }
      const miss = k === 'publish' ? P.publishMissing(p) : P.missing(p, k);
      if (miss.length && !opts.force) { Object.assign(st, {status:'needs', missing:miss, choice:false, error:null});
        P.log(p, `${sd.n} is waiting: needs ${miss.map(id => M3.conn(id).n).join(', ')}`); return; }
      /* daily spend cap (estimates). Simulated here; in production the server-side ledger and the user's bot enforce it. */
      const cost = opts.swap != null ? 0.07 : M3.stageCost(k, p.intake), cap = Math.min(M3.CAP_MAX, +((p.rules.budget || {}).daily_cap_usd) || M3.CAP_MAX), spent = Store.spentToday();
      if (cost > 0 && spent + cost > cap + 1e-9) { Object.assign(st, {status:'needs', capHit:{cost, cap, spent, day:Store.today()}, missing:[], choice:false, error:null});
        P.log(p, `${sd.n} paused: daily spend cap reached (est. $${spent.toFixed(2)} spent + $${cost.toFixed(2)} > $${cap}/day)`); return; }
      if (cost > 0) Store.addSpend(cost);
      st.cost = cost; st.capHit = null;
      st.version = (st.version || 0) + 1;
      const payload = {stage:k, intake:p.intake, topic:p.topic, intakeHash:p.rules.intake_hash, version:st.version, labels:P.labels(p)};
      if (opts.swap != null) { payload.swap = opts.swap; payload.prev = st.output.frames; }
      if (k === 'voice') payload.script = ((p.stages.script.output || {}).beats || []).map(b => ({b:b.b, line:b.line}));
      if (k === 'video') payload.frames = (p.stages.stills.output || {frames:[]}).frames.length;
      if (k === 'publish') payload.targets = P.publishTargets(p);
      const job = Store.dispatchJob({kind:'stage', project_id:p.id, stage:k, payload});
      Object.assign(st, {status:'running', jobId:job.id, inputHash:P.inputHash(p, k), approval:null, missing:[], choice:false, error:null, forced:!!(opts.force && miss.length)});
      P.log(p, `${sd.n}: job sent to ${k === 'publish' ? '3x3 publish-broker (server)' : 'your Grok Bot worker'}${opts.swap != null ? ` (swap still #${opts.swap+1})` : ''}${st.forced ? ' (simulated anyway, connection missing)' : ''}`);
    },
    publishTargets(p){ const conns = Store.getConnections(), I = p.intake, alc = M3.isAlcohol(I), kids = P.kidsRule(p);
      return Object.keys(I.plat).filter(x => I.plat[x] && (!kids || x === 'yt')).map(x => {
        const c = M3.CONNS.find(cc => cc.plat === x), acct = (conns[c.id] || {}).account || c.acct;
        let mode = 'public';
        if (alc) mode = M3.ALCOHOL_MODES[x];
        else if (x === 'tt') mode = P.ttDirect(p) && p.stages.publish.ttPrivacy ? 'direct post (audited) · privacy ' + p.stages.publish.ttPrivacy : 'uploaded to your TikTok inbox (draft): you post it in the app';
        return {plat:x, mode, account:acct, kids: kids && x === 'yt', reach_only: x === 'tt' && I.dur <= 60}; }); },
    /* connected channel/Page vs this project's brand (simulated name check; production compares the channel/Page id saved with the brand) */
    brandMismatch(p){ const conns = Store.getConnections(), I = p.intake;
      return P.publishTargets(p).filter(t => { const c = M3.CONNS.find(cc => cc.plat === t.plat); return M3.isOk(conns[c.id]) && !M3.brandMatches(t.account, I.name, I.handle); }).map(t => ({plat:t.plat, account:t.account, brand:I.name, flags:M3.brandFlags(t.account)})); },
    /* made-for-kids comes from the compiled, locked rules (rules.safety.made_for_kids), never the raw intake flag */
    kidsRule(p){ return !!(p.rules && p.rules.safety && p.rules.safety.made_for_kids === true); },
    ttDirect(p){ const I = p.intake; return !!Store.getFlags().tiktok_direct_post_audited && !M3.isAlcohol(I) && !!I.plat.tt && !P.kidsRule(p); },
    publishMissing(p){ const conns = Store.getConnections(); const ids = [];
      P.publishTargets(p).forEach(t => ids.push(M3.CONNS.find(c => c.plat === t.plat).id)); if (p.intake.plat.ig && ids.includes('instagram')) ids.push('facebook');
      return ids.filter((v,i,a) => a.indexOf(v) === i && !M3.isOk(conns[v])); },
    onJob(job){
      if (job.kind !== 'stage' || !job.project_id) return;
      const p = Store.getProject(job.project_id); if (!p) return; const st = p.stages[job.stage]; if (!st || st.jobId !== job.id) return;
      const sd = M3.stage(job.stage);
      if (job.status === 'failed') { if (st.status === 'failed') return; if (st.cost) { Store.addSpend(-st.cost); st.cost = 0; } Object.assign(st, {status:'failed', error:job.error}); P.log(p, `${sd.n} failed: ${job.error}`); return; }
      if (job.status !== 'done' || st.status !== 'running') return;
      st.output = Object.assign({}, job.output); st.output.hash = M3.hash(job.output); st.inputHash = P.inputHash(p, job.stage);
      if (job.stage === 'publish' && M3.isAlcohol(p.intake)) { st.status = 'needs'; st.ageGate = {plats:(job.output.results || []).map(r => r.plat), confirmed:{}};
        const pl = st.ageGate.plats, held = ['fb','ig'].filter(x => pl.includes(x)).map(x => x === 'fb' ? 'Facebook' : 'Instagram');
        const parts = [pl.includes('yt') && 'YouTube uploaded private (3x3 leaves it private; visibility is your decision)', pl.includes('tt') && 'TikTok sent to inbox drafts (set 18+ first; visibility is your decision)', held.length && held.join(' and ') + ' held by 3x3 (nothing sent)'].filter(Boolean);
        P.log(p, 'Alcohol bundle: ' + parts.join(', ') + '. Needs you: for each post on each platform, answer age-restricted' + (pl.includes('fb') ? ' (Facebook: check the Page\'s age restriction first)' : '') + ' or 18+ isn\'t available: keep private / don\'t post'); return; }
      if (sd.approval) { st.status = 'awaiting'; P.log(p, `${sd.n} ready for your approval (output ${st.output.hash.slice(0,8)})`); }
      else { st.status = 'done'; st.approval = {inputHash:st.inputHash, outputHash:st.output.hash, at:now(), auto:true};
        P.log(p, `${sd.n} done`); const n = P.nextKey(p, job.stage); if (n && p.stages[n].status === 'idle') P.start(p, n); }
    },
    approve(id, k){ const p = Store.getProject(id), st = p.stages[k];
      if (P.eff(p, k) !== 'awaiting' || !P.ready(p, k)) return;
      if (k === 'script') { const hits = M3.scriptBanned(st.output.beats, p.rules); if (hits.length) { P.log(p, 'Script not approved: it uses banned words (' + hits.join(', ') + '). Edit the lines or regenerate.'); return; }
        const bd = M3.scriptBidi(st.output); if (bd.length) { P.log(p, 'Script not approved: ' + bd.length + ' line' + (bd.length > 1 ? 's contain' : ' contains') + ' hidden text-direction override or isolate characters (' + bd.map(b => b.b).join(', ') + '). Retype ' + (bd.length > 1 ? 'those lines' : 'that line') + ' without them and save, then approve.'); return; }
        const ph = M3.scriptPlaceholders(st.output); if (ph.length) { P.log(p, 'Script not approved: ' + ph.length + ' line' + (ph.length > 1 ? 's are' : ' is') + ' still placeholder template text or too short (' + ph.map(b => b.b + ': ' + M3.PLACEHOLDER_WHY[M3.placeholderWhy(st.output, b)]).join(', ') + '). Write your own lines and save, then approve.'); return; } }
      if (k === 'voice' && !M3.voInWindow(st.output.seconds, p.intake.dur) && !P.voOverridden(st)) { const [lo, hi] = M3.voWindow(p.intake.dur); P.log(p, `Voiceover not approved: ${st.output.seconds}s is outside the ${lo}–${hi}s window for a ${p.intake.dur}s video. Edit the script, redo lines, or tick the length override.`); return; }
      st.status = 'done'; st.approval = {inputHash:st.inputHash, outputHash:st.output.hash, at:now()};
      if (k === 'voice' && P.voOverridden(st) && !M3.voInWindow(st.output.seconds, p.intake.dur)) st.approval.length_override = {seconds:st.output.seconds, window:M3.voWindow(p.intake.dur)};
      P.log(p, `${M3.stage(k).n} approved · lock ${M3.hash([st.inputHash, st.output.hash]).slice(0,8)}`);
      const n = P.nextKey(p, k); if (n && p.stages[n].status === 'idle') P.start(p, n);
    },
    /* Each answer calls the (simulated) RPC confirm_age_gate(publish_id, platform, file_hash, text_version, outcome).
       outcome 'age_restricted' | 'kept_private'. kept_private is final; for Facebook/Instagram it means nothing is ever sent. */
    ageResolved(g, x){ return !!g.confirmed[x]; },
    fbPageCheck(id, on){ const p = Store.getProject(id), g = p.stages.publish.ageGate; if (!g || g.confirmed.fb) return; g.fbPageChecked = on ? now() : null; Store.saveProject(p); },
    confirmAgeGate(id, plat, outcome){ const p = Store.getProject(id), st = p.stages.publish, g = st.ageGate; if (!g || !g.plats.includes(plat) || g.confirmed[plat]) return;
      if (plat === 'fb' && outcome === 'age_restricted' && !g.fbPageChecked) return;   // the Page age restriction is checked BEFORE answering
      const am = M3.ageMin(p.intake.market), call = M3.confirm_age_gate('pub_' + st.jobId + '_' + plat, plat, (p.stages.final.output || {}).hash || null, M3.AGE_GATE_TEXT_VERSION, outcome);
      if (plat === 'fb' && outcome === 'age_restricted') { call.age_min = am; call.page_check_at = g.fbPageChecked; }
      g.confirmed[plat] = call; const r = (st.output.results || []).find(x => x.plat === plat);
      if (r) r.mode = (outcome === 'kept_private' ? M3.ALCOHOL_KEPT[plat] : M3.ALCOHOL_AFTER[plat]).replace('{age}', am);
      P.log(p, `confirm_age_gate (simulated): ${plat.toUpperCase()} → ${outcome}` + (outcome === 'kept_private' ? (['fb','ig'].includes(plat) ? ' · nothing sent' : ' · stays private') : plat === 'fb' ? ` · server published with targeting.age_min=${am}, is_ai_generated=true` : plat === 'ig' ? ' · server published the Reel' : ''));
      P.ageDone(p); },
    ageDone(p){ const st = p.stages.publish, g = st.ageGate;
      if (g.plats.every(x => P.ageResolved(g, x))) { st.status = 'done'; st.approval = {inputHash:st.inputHash, outputHash:st.output.hash, at:now(), age_gate:g.confirmed}; P.log(p, 'Every alcohol post answered'); }
      else Store.saveProject(p); },
    /* Script edits before approval (the architecture lets the user edit; the diff is logged). Only while awaiting approval. */
    editScript(id, lines){ const p = Store.getProject(id), st = p.stages.script; if (P.eff(p, 'script') !== 'awaiting' || !st.output) return [];
      const o = st.output, changed = [], marks = [];   // LRM/RLM/ALM are stripped silently (logged)
      o.beats.forEach((b, i) => { const v0 = typeof lines[i] === 'string' ? lines[i] : null, v = v0 === null ? null : M3.stripMarks(v0).replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, 400); if (v0 !== null && M3.stripMarks(v0) !== v0) marks.push(b.b); if (v && v !== b.line) { changed.push({beat:b.b, from:b.line, to:v}); b.line = v; } });
      if (!changed.length) return changed;
      o.edits = (o.edits || []).concat(changed.map(c => Object.assign({at:now()}, c))); const { hash, ...rest } = o; o.hash = M3.hash(rest);
      P.log(p, `Script edited by you before approval: ${changed.map(c => c.beat).join(', ')} changed (output ${o.hash.slice(0,8)})${marks.length ? `; invisible direction marks (LRM/RLM/ALM) removed from ${marks.join(', ')}` : ''}`); return changed; },
    /* Voice length override: only for this exact take (output hash); a new take needs a new override */
    voOverridden(st){ return !!(st.lenOverride && st.output && st.lenOverride.hash === st.output.hash); },
    setVoOverride(id, on){ const p = Store.getProject(id), st = p.stages.voice; if (P.eff(p, 'voice') !== 'awaiting' || !st.output) return;
      const win = M3.voWindow(p.intake.dur).join('–');
      if (on && M3.voInWindow(st.output.seconds, p.intake.dur)) { st.lenOverride = null; P.log(p, `Voiceover length override not applied: ${st.output.seconds}s is already inside the ${win}s window, so no override is needed`); return; }
      st.lenOverride = on ? {hash:st.output.hash, at:now(), seconds:st.output.seconds} : null;
      P.log(p, on ? `Voiceover length override by you: approving ${st.output.seconds}s outside the ${win}s window` : 'Voiceover length override removed'); },
    /* Voice gate: redo one line (re-stitched and re-timed in production); new output hash, so approval is per take */
    redoLine(id, i){ const p = Store.getProject(id), st = p.stages.voice; if (P.eff(p, 'voice') !== 'awaiting' || !st.output || !st.output.lines || !st.output.lines[i]) return;
      const ln = st.output.lines[i]; ln.v = (ln.v || 1) + 1; const { hash, ...rest } = st.output; st.output.hash = M3.hash(rest);
      P.log(p, `Voiceover: line ${ln.line_id} (${ln.beat}) re-recorded, take v${ln.v} (simulated)`); },
    regenerate(id, k){ const p = Store.getProject(id); P.log(p, `${M3.stage(k).n}: regenerate requested`); P.start(p, k); },
    swap(id, i){ const p = Store.getProject(id); if (!p.stages.stills.output) return; P.start(p, 'stills', {swap:i}); },
    retry(id, k, force){ const p = Store.getProject(id); P.start(p, k, {force:!!force, queue: k === 'publish' && !p.stages.publish.choice}); },
    queue(id, force, ttPrivacy){ const p = Store.getProject(id); if (ttPrivacy) { p.stages.publish.ttPrivacy = ttPrivacy; Store.saveProject(p); } P.start(Store.getProject(id), 'publish', {queue:true, force:!!force}); },
    /* Download: mark Publish done FIRST (non-alcohol), then snapshot the manifest, so the file matches what the page shows */
    download(id){ const p = Store.getProject(id), st = p.stages.publish, alc = M3.isAlcohol(p.intake);
      if (alc) st.downloadedAt = now();
      else { st.output = {downloaded:true, at:now()}; st.output.hash = M3.hash(st.output); st.status = 'done'; st.inputHash = P.inputHash(p, 'publish'); st.choice = false;
        st.approval = {inputHash:st.inputHash, outputHash:st.output.hash, at:now(), auto:true}; }
      const manifest = {app:'3x3', note:'TEST BUILD: simulated. A real run delivers the final MP4; this file is the project manifest.', manifest_at:now(), project:{id:p.id, name:p.name, topic:p.topic},
        publish_note: alc ? 'Alcohol project: Publish stays "needs" until you answer each platform; this manifest was taken before those answers.' : 'Publish marked done by this download.',
        rules:p.rules, stages:Object.fromEntries(Object.entries(p.stages).map(([k,s]) => [k, {status:s.status, output_hash:s.output && s.output.hash, approval:s.approval || null}]))};
      P.lastManifest = manifest;
      const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(manifest, null, 2)], {type:'application/json'}));
      a.download = `3x3-${p.id}-manifest.json`; document.body.appendChild(a); a.click(); a.remove();
      P.log(p, alc ? 'Downloaded (simulated: manifest JSON). Publish stays not done: alcohol posts need your per-platform age answers' : 'Downloaded (simulated: manifest JSON instead of MP4)'); },
    reset(id){ const p = Store.getProject(id); M3.STAGES.forEach(s => p.stages[s.k] = {status: p.stages[s.k].status === 'skipped' ? 'skipped' : 'idle', version:0}); p.log = []; P.log(p, 'Simulation reset'); P.start(p, 'rules'); },
    /* a connection just became available: resume any stage that was waiting only on connections */
    recheck(){ Store.listProjects().forEach(p => KEYS().forEach(k => { const st = p.stages[k];
      if (st.status === 'needs' && !st.choice && !st.capHit && !st.ageGate && st.missing && st.missing.length) { const miss = k === 'publish' ? P.publishMissing(p) : P.missing(p, k); if (!miss.length) { P.log(p, `${M3.stage(k).n}: connections ready, resuming`); P.start(p, k, {queue: k === 'publish'}); } } })); },
    progress(p){ const ks = KEYS().filter(k => p.stages[k].status !== 'skipped'); const d = ks.filter(k => P.eff(p, k) === 'done').length; return {done:d, total:ks.length, pct:Math.round(d/ks.length*100)}; },
    current(p){ const ks = KEYS().filter(k => p.stages[k].status !== 'skipped'); return ks.find(k => P.eff(p, k) !== 'done') || null; },
  };
  window.Pipeline = P;
})();
