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
      if (r.ai_disclosure && r.ai_disclosure.on_screen_tag) L.push('On-screen "AI-generated" tag'); if (r.affiliate_disclosure) L.push('Affiliate line: ' + r.affiliate_disclosure.text); return L; },
    start(p, k, opts={}){
      p = Store.getProject(p.id); const st = p.stages[k]; const sd = M3.stage(k);
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
      if (k === 'video') payload.frames = (p.stages.stills.output || {frames:[]}).frames.length;
      if (k === 'publish') payload.targets = P.publishTargets(p);
      const job = Store.dispatchJob({kind:'stage', project_id:p.id, stage:k, payload});
      Object.assign(st, {status:'running', jobId:job.id, inputHash:P.inputHash(p, k), approval:null, missing:[], choice:false, error:null, forced:!!(opts.force && miss.length)});
      P.log(p, `${sd.n}: job sent to ${k === 'publish' ? '3x3 publish-broker (server)' : 'your Grok Bot worker'}${opts.swap != null ? ` (swap still #${opts.swap+1})` : ''}${st.forced ? ' (simulated anyway, connection missing)' : ''}`);
    },
    publishTargets(p){ const conns = Store.getConnections(), I = p.intake, alc = M3.isAlcohol(I), kids = (p.rules.rule_bundles_applied||[]).includes('kids') || I.kids;
      return Object.keys(I.plat).filter(x => I.plat[x] && (!kids || x === 'yt')).map(x => {
        const c = M3.CONNS.find(cc => cc.plat === x), acct = (conns[c.id] || {}).account || c.acct;
        let mode = 'public';
        if (alc) mode = M3.ALCOHOL_MODES[x];
        else if (x === 'tt') mode = 'private draft (TikTok audit pending)';
        return {plat:x, mode, account:acct, kids: kids && x === 'yt', reach_only: x === 'tt' && I.dur <= 60}; }); },
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
      if (job.stage === 'publish' && M3.isAlcohol(p.intake)) { st.status = 'needs'; st.ageGate = {plats:(job.output.results || []).map(r => r.plat), ticked:{}};
        P.log(p, 'Uploaded as private drafts on every platform (alcohol bundle). Needs you: set 18+ in each platform app, then confirm'); return; }
      if (sd.approval) { st.status = 'awaiting'; P.log(p, `${sd.n} ready for your approval (output ${st.output.hash.slice(0,8)})`); }
      else { st.status = 'done'; st.approval = {inputHash:st.inputHash, outputHash:st.output.hash, at:now(), auto:true};
        P.log(p, `${sd.n} done`); const n = P.nextKey(p, job.stage); if (n && p.stages[n].status === 'idle') P.start(p, n); }
    },
    approve(id, k){ const p = Store.getProject(id), st = p.stages[k];
      if (P.eff(p, k) !== 'awaiting' || !P.ready(p, k)) return;
      st.status = 'done'; st.approval = {inputHash:st.inputHash, outputHash:st.output.hash, at:now()};
      P.log(p, `${M3.stage(k).n} approved · lock ${M3.hash([st.inputHash, st.output.hash]).slice(0,8)}`);
      const n = P.nextKey(p, k); if (n && p.stages[n].status === 'idle') P.start(p, n);
    },
    ageTick(id, plat, on){ const p = Store.getProject(id), st = p.stages.publish; if (!st.ageGate) return; st.ageGate.ticked[plat] = on ? now() : undefined; Store.saveProject(p); },
    ageConfirm(id){ const p = Store.getProject(id), st = p.stages.publish, g = st.ageGate; if (!g || !g.plats.every(x => g.ticked[x])) return;
      st.status = 'done'; st.approval = {inputHash:st.inputHash, outputHash:st.output.hash, at:now(), age_gate:g.ticked};
      P.log(p, '18+ age gate confirmed by you on ' + g.plats.map(x => x.toUpperCase() + ' ' + new Date(g.ticked[x]).toLocaleTimeString()).join(', ') + '. Publish each video yourself in the platform app'); },
    regenerate(id, k){ const p = Store.getProject(id); P.log(p, `${M3.stage(k).n}: regenerate requested`); P.start(p, k); },
    swap(id, i){ const p = Store.getProject(id); if (!p.stages.stills.output) return; P.start(p, 'stills', {swap:i}); },
    retry(id, k, force){ const p = Store.getProject(id); P.start(p, k, {force:!!force, queue: k === 'publish' && !p.stages.publish.choice}); },
    queue(id, force){ const p = Store.getProject(id); P.start(p, 'publish', {queue:true, force:!!force}); },
    download(id){ const p = Store.getProject(id), st = p.stages.publish;
      const manifest = {app:'3x3', note:'TEST BUILD: simulated. A real run delivers the final MP4; this file is the project manifest.', project:{id:p.id, name:p.name, topic:p.topic},
        rules:p.rules, stages:Object.fromEntries(Object.entries(p.stages).map(([k,s]) => [k, {status:s.status, output_hash:s.output && s.output.hash, approval:s.approval || null}]))};
      const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(manifest, null, 2)], {type:'application/json'}));
      a.download = `3x3-${p.id}-manifest.json`; document.body.appendChild(a); a.click(); a.remove();
      st.output = {downloaded:true, at:now()}; st.output.hash = M3.hash(st.output); st.status = 'done'; st.inputHash = P.inputHash(p, 'publish'); st.choice = false;
      st.approval = {inputHash:st.inputHash, outputHash:st.output.hash, at:now(), auto:true}; P.log(p, 'Downloaded (simulated: manifest JSON instead of MP4)'); },
    reset(id){ const p = Store.getProject(id); M3.STAGES.forEach(s => p.stages[s.k] = {status: p.stages[s.k].status === 'skipped' ? 'skipped' : 'idle', version:0}); p.log = []; P.log(p, 'Simulation reset'); P.start(p, 'rules'); },
    /* a connection just became available: resume any stage that was waiting only on connections */
    recheck(){ Store.listProjects().forEach(p => KEYS().forEach(k => { const st = p.stages[k];
      if (st.status === 'needs' && !st.choice && !st.capHit && !st.ageGate && st.missing && st.missing.length) { const miss = k === 'publish' ? P.publishMissing(p) : P.missing(p, k); if (!miss.length) { P.log(p, `${M3.stage(k).n}: connections ready, resuming`); P.start(p, k, {queue: k === 'publish'}); } } })); },
    progress(p){ const ks = KEYS().filter(k => p.stages[k].status !== 'skipped'); const d = ks.filter(k => P.eff(p, k) === 'done').length; return {done:d, total:ks.length, pct:Math.round(d/ks.length*100)}; },
    current(p){ const ks = KEYS().filter(k => p.stages[k].status !== 'skipped'); return ks.find(k => P.eff(p, k) !== 'done') || null; },
  };
  window.Pipeline = P;
})();
