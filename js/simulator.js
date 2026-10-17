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
        case 'rules': return {rule_set_version:1, intake_hash:p.intakeHash, gates:['script','stills','video','final'], checks:12};
        case 'script': {
          const topic = p.topic || 'Your topic';
          let beats;
          if (I.format === 'list') beats = ['Hook', '#5', '#4', '#3', '#2', '#1', 'CTA'];
          else if (I.format === 'reveal') beats = ['Tease', 'Question', 'Clue 1', 'Clue 2', 'Build', 'Reveal', 'CTA'];
          else beats = ['Hook', 'Setup', 'Turn', 'Rise', 'Twist', 'Payoff', 'CTA'];
          const per = Math.round(words / beats.length);
          return {topic, words, draft:(p.version||1), beats: beats.map((b,i) => ({b,
            line: i === 0 ? `"${topic}": opening hook (~${per} words) that lands in the first 1.5 seconds.`
                : i === beats.length-1 ? (I.cta || 'Follow for more') + (I.goal === 'affiliate' ? ' · link in bio (#ad)' : '')
                : `${b}: one verifiable point about ${topic.toLowerCase()} (~${per} words).`,
            src: (i === 0 || i === beats.length-1) ? null : 'source URL attached by worker'}))};
        }
        case 'voice': return {voice:I.voice, seconds:I.dur, chars:Math.round(words*5.8), model:'eleven_multilingual_v2 (example)'};
        case 'stills': {
          if (p.swap != null && p.prev) { const f = p.prev.map(x => Object.assign({}, x)); f[p.swap] = {i:p.swap, seed:seed(), v:(p.prev[p.swap].v||1)+1}; return {frames:f, swapped:p.swap}; }
          return {frames: Array.from({length:nShots}, (_,i) => ({i, seed:seed(), v:1}))};
        }
        case 'video': return {clips: Array.from({length:(p.frames||nShots)}, (_,i) => ({i, move:MOVES[i % MOVES.length], s:2.5}))};
        case 'final': return {seconds:I.dur, lufs:-14, true_peak:-1, aspect:I.aspect, labels:p.labels||[], file:'final_v'+(p.version||1)+'.mp4 (simulated)'};
        case 'publish': return {results:(p.targets||[]).map(t => ({plat:t.plat, mode:t.mode, account:t.account})), via:'3x3 publish-broker · official APIs (simulated)'};
      }
      return {};
    }
  };
  window.Sim3x3 = S;
})();
