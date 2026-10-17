/* 3x3 · SIMULATOR — LOCAL TEST MODE ONLY.
   Pretends to be the user's Grok Bot worker (AI steps) and 3x3's server-side publish-broker (publish jobs). It receives jobs from Store.dispatchJob(), "runs" them on a
   timer, and reports back through Store.updateJob(), the way a real worker callback would.
   Delete this file (and its <script> tag) once SupabaseAdapter + real workers are wired up. */
(function(){
  const T = {}; // timers by job id
  const MOVES = ['slow push-in','gentle pan left','tilt up','parallax drift','rack focus','slow pull-out'];
  const wait = (ms, fn, id) => { T[id] = setTimeout(() => { delete T[id]; fn(); }, ms); };
  const S = {
    failNext:false,
    speed: 1,
    handle(job){
      const id = job.id;
      if (job.status === 'done' || job.status === 'failed' || job.status === 'needs_you') return;
      wait(250/S.speed, () => {
        Store.updateJob(id, {status:'running'});
        const dur = job.kind === 'ping' ? 900 : 1100 + Math.random()*900;
        wait(dur/S.speed, () => {
          if (S.failNext || (job.payload && job.payload.forceFail)) { S.failNext = false;
            Store.updateJob(id, {status:'failed', error:'Simulated failure: worker timed out (test). Retry to run it again.'}); return; }
          Store.updateJob(id, {status:'done', output: job.kind === 'ping' ? {pong:true, worker:'simulated', at:new Date().toISOString()} : S.produce(job)});
        }, id);
      }, id);
    },
    cancel(id, msg){ clearTimeout(T[id]); delete T[id]; Store.updateJob(id, {status:'failed', error:msg || 'Cancelled'}); },
    resume(){ Store.listJobs().filter(j => j.status === 'queued' || j.status === 'running').forEach(j => { Store.updateJob(j.id, {status:'queued'}); S.handle(Object.assign({}, j, {status:'queued'})); }); },
    produce(job){
      const p = job.payload || {}, I = p.intake || {};
      const nShots = Math.max(6, Math.round((I.dur||45)/2.5)), words = Math.round((I.dur||45)*155/60);
      const seed = () => Math.floor(Math.random()*1e6);
      switch(p.stage){
        case 'rules': return {rule_set_version:1, intake_hash:p.intakeHash, gates:I.vo === false ? ['script','stills','final'] : ['script','voice','stills','final'], checks:12};
        case 'script': {
          /* simulated draft: each draft (version) uses a different hook and line pattern, so Regenerate really changes the text */
          const topic = p.topic || 'Your topic', v = (p.version || 1), beats = M3.BEATS[I.format] || M3.BEATS.story;
          const per = Math.round(words / beats.length), t = topic.toLowerCase();
          const HOOK = M3.SCRIPT_HOOKS, ITEM = M3.SCRIPT_ITEMS;   // shared with the placeholder gate (M3.scriptPlaceholders)
          const h = HOOK[(v - 1) % HOOK.length](topic, t), it = b => ITEM[(v - 1) % ITEM.length](b, t);
          return {topic, words, draft:v, variant:((v - 1) % HOOK.length) + 1, per_beat:per, beats: beats.map((b,i) => ({b,
            line: i === 0 ? h : i === beats.length-1 ? (I.cta || 'Follow for more') + (I.goal === 'affiliate' ? ' · link in bio (#ad)' : '') : it(b),
            src: (i === 0 || i === beats.length-1) ? null : 'source URL attached by worker'}))};   // template text: hook + items must be rewritten before Approval 1 (decided from content by M3.scriptPlaceholders)
        }
        case 'voice': {
          /* voice take built from the approved script: one line per beat, timed at ~155 wpm x pace (timings.json is the master clock) */
          const sc = p.script || [], lines = sc.map(b => String(b.line || '')), pace = +I.pace || 1; let t0 = 0.08;
          const L = lines.map((x, i) => { const w = x.split(/\s+/).filter(Boolean).length, d = Math.max(0.6, w / (155 * pace) * 60); const o = {line_id:'L' + (i + 1), beat:sc[i].b, text:x, start:+t0.toFixed(2), end:+(t0 + d).toFixed(2), v:1}; t0 += d + 0.12; return o; });
          return {voice:I.voice, take:(p.version || 1), seconds:+t0.toFixed(1), chars:lines.join(' ').length, lines:L, files:['vo.mp3 (simulated)', 'timings.json (simulated)'], model:'eleven_multilingual_v2 (example)'};
        }
        case 'stills': {
          if (p.swap != null && p.prev) { const f = p.prev.map(x => Object.assign({}, x)); f[p.swap] = {i:p.swap, seed:seed(), v:(p.prev[p.swap].v||1)+1}; return {frames:f, swapped:p.swap}; }
          return {frames: Array.from({length:nShots}, (_,i) => ({i, seed:seed(), v:1}))};
        }
        case 'video': return {clips: Array.from({length:(p.frames||nShots)}, (_,i) => ({i, move:MOVES[i % MOVES.length], s:2.5}))};
        case 'final': return {measured:false, target_seconds:I.dur, target_lufs:-14, target_true_peak:-1, aspect:I.aspect, labels:p.labels||[], file:'final_v'+(p.version||1)+'.mp4 (simulated)'};
        case 'publish': return {results:(p.targets||[]).map(t => ({plat:t.plat, mode:t.mode, account:t.account})), via:'3x3 publish-broker · official APIs (simulated)'};
      }
      return {};
    }
  };
  window.Sim3x3 = S;
})();
