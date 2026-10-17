/* 3x3 · App shell: router, header, test banner, global actions, job/connection event wiring. */
(function(){
  const $ = s => document.querySelector(s);
  const App = window.App = {route:null};
  const NAV = [['intake','Intake','edit'],['projects','Projects','film'],['connections','Connections','plug'],['onboarding','Onboarding','rocket']];
  const MARK = '<svg viewBox="0 0 24 24" class="m3">' + [0,1,2].map(r => [0,1,2].map(c => `<rect x="${3+c*6.5}" y="${3+r*6.5}" width="5" height="5" rx="1.4"/>`).join('')).join('') + '</svg>';

  function shell(){
    $('#root').innerHTML = `<div class="app">
      <div class="testbar" role="note"><b>TEST MODE · SIMULATED</b><span>No real jobs, keys or posts. Data is stored on this device only.</span><button data-x="cleardata">${ic('trash')}Clear data</button></div>
      <header class="hdr"><a class="logo" href="#/intake"><div class="mk">${MARK}</div><span class="lname">3x3<span class="lsub">Reel Studio</span></span><small>beta</small></a>
        <nav class="tabs" id="tabs"></nav>
        <div class="hdr-r"><span class="saved"><i></i> Autosaved</span><div class="avatar" title="Johnny Bodegas">JB</div></div></header>
      <div id="view" class="view"></div></div><div id="toast" class="toast"></div>`;
  }
  function tabs(){
    const miss = M3.warnings(Intake.snapshot(), Store.getConnections()).length;
    $('#tabs').innerHTML = NAV.map(([k, n, i]) => `<a href="#/${k}" class="tab ${App.route===k || (App.route==='project'&&k==='projects')?'on':''}">${ic(i)}<span>${n}</span>${k==='connections'&&miss?`<em class="nbadge" title="${miss} required connection(s) missing">${miss}</em>`:''}</a>`).join('');
  }
  function parse(){
    const h = location.hash.replace(/^#\/?/, ''); const [path, qs] = h.split('?'); const parts = path.split('/');
    return {name: parts[0] || 'intake', arg: parts[1], q: new URLSearchParams(qs || '')};
  }
  let lastKey = '';
  function route(force){
    const r = parse(); const key = location.hash;
    const known = ['intake','projects','project','connections','onboarding'];
    if (!known.includes(r.name)) { location.hash = '#/intake'; return; }
    const changed = key !== lastKey; lastKey = key;
    const v = $('#view');
    if (r.name === 'intake') {
      if (App.route !== 'intake') { v.className = 'view vintake'; v.innerHTML = Intake.html(); }
      App.route = 'intake'; tabs(); Intake.mount(r.arg ? +r.arg : null); document.title = '3x3 · Intake'; return;
    }
    Intake.unmount();
    const prevScroll = (!changed && $('#page')) ? $('#page').scrollTop : 0, prevWin = (!changed) ? window.scrollY : 0;
    App.route = r.name; tabs(); v.className = 'view vpage';
    let html = '';
    if (r.name === 'projects') html = Pages.projects();
    if (r.name === 'project') html = Pages.project(r.arg);
    if (r.name === 'connections') html = Pages.connections(r.q.get('focus'));
    if (r.name === 'onboarding') html = Pages.onboarding();
    const fk = changed ? null : App.focusKey();
    v.innerHTML = `<div class="page" id="page"><div class="wrap ${changed?'enter':''}">${html}</div></div>`;
    document.title = '3x3 · ' + r.name[0].toUpperCase() + r.name.slice(1);
    App.a11y($('#page'));
    App.refocus(fk);
    if (changed) { $('#page').scrollTop = 0; window.scrollTo(0, 0);
      const f = r.q.get('focus'); if (f) setTimeout(() => { const el = document.getElementById('conn-' + f); el && el.scrollIntoView({block:'center', behavior:'smooth'}); }, 60);
      const s = location.hash.match(/#stage-(\w+)/); }
    else { $('#page').scrollTop = prevScroll; window.scrollTo(0, prevWin); }
  }
  App.render = route;
  /* keep keyboard focus on the same control across re-renders (innerHTML swaps) */
  App.focusKey = () => { const el = document.activeElement; if (!el || el === document.body) return null;
    if (el.id) return '#' + CSS.escape(el.id);
    for (const at of ['data-act','data-set','data-go','data-in','data-hex','data-col','data-x','data-c']) if (el.hasAttribute(at)) {
      let q = `[${at}="${CSS.escape(el.getAttribute(at))}"]`; if (el.dataset.val != null && at !== 'data-val') q += `[data-val="${CSS.escape(el.dataset.val)}"]`; if (el.dataset.c != null && at !== 'data-c') q += `[data-c="${CSS.escape(el.dataset.c)}"]`; return q; }
    return null; };
  App.refocus = k => { if (!k) return; const el = document.querySelector(k); if (el && el !== document.activeElement && !el.disabled) try { el.focus({preventScroll:true}); } catch(e){} };
  App.a11y = root => { if (!root) return;
    root.querySelectorAll('.tog').forEach(t => { const locked = t.classList.contains('locked'); t.setAttribute('role','switch'); t.setAttribute('aria-checked', String(t.classList.contains('on'))); t.tabIndex = locked ? -1 : 0; if (locked) t.setAttribute('aria-disabled','true');
      if (!t.getAttribute('aria-label')) { const h = t.closest('.trow') && t.closest('.trow').querySelector('h4'); t.setAttribute('aria-label', h ? h.textContent.trim() : 'Toggle'); } });
    root.querySelectorAll('[data-set],[data-act="plat"]').forEach(b => { if (b.classList.contains('vcard')) return; const sel = b.classList.contains('sel') || (b.classList.contains('vsel') && !!b.closest('.vcard.sel')); b.setAttribute('aria-pressed', String(sel)); if (b.tagName !== 'BUTTON') { b.tabIndex = 0; b.setAttribute('role','button'); } });
    root.querySelectorAll('input,select,textarea').forEach(i => { if (i.type === 'hidden' || i.getAttribute('aria-label')) return; const lt = i.labels && [...i.labels].map(l => l.textContent.trim()).join(' ');
      if (!lt) i.setAttribute('aria-label', i.placeholder || (i.dataset.col ? i.dataset.col + ' colour' : i.dataset.hex ? i.dataset.hex + ' colour hex' : i.dataset.in || i.dataset.f || 'input')); });
    root.querySelectorAll('[data-go]:not(button)').forEach(e => { e.tabIndex = 0; e.setAttribute('role','button'); });
  };
  document.addEventListener('keydown', e => { if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('[role="switch"],[role="button"]') && e.target.tagName !== 'BUTTON' && e.target.tagName !== 'A') { e.preventDefault(); e.target.click(); } });
  let raf = 0; App.soon = () => { if (raf) return; raf = requestAnimationFrame(() => { raf = 0;
    if (App.route === 'intake') { tabs(); return; }
    const a = document.activeElement; if (a && a.tagName === 'INPUT' && a.closest('#page') && a.type !== 'checkbox' && a.type !== 'radio') { tabs(); return; }
    route(); }); };
  App.toast = (msg, kind) => { const t = $('#toast'); t.textContent = msg; t.className = 'toast show ' + (kind || ''); clearTimeout(App._tt); App._tt = setTimeout(() => t.className = 'toast', 3200); };

  /* ---------- events from Store (jobs, connections, projects) ---------- */
  Store.subscribe(evt => {
    if (evt.type === 'job') { const j = evt.job;
      if (j.kind === 'stage') Pipeline.onJob(j);
      if (j.kind === 'ping') { const W = Pages._w; if (W.testJobId === j.id) {
        if (j.status === 'done') { W.testing = false; W.fail = false; W.secret = null; Store.saveConnection('worker', {status:'connected', lastReply:j.updated_at}); Store.setOnboarding({testJob:true}); App.toast('Worker connected (simulated)'); }
        else if (j.status === 'failed') { W.testing = false; W.fail = true; App.soon(); } } }
    }
    if (evt.type === 'connection') { const c = Store.getConnection(evt.id); if (c.status === 'connected') setTimeout(() => Pipeline.recheck(), 0);
      if (App.route === 'intake' && Intake.state.step === 9) Intake.rerender(); }
    App.soon();
  });

  /* ---------- page actions (data-x) ---------- */
  document.addEventListener('click', e => {
    const a = e.target.closest('[data-x]'); if (!a) return;
    const x = a.dataset.x, id = a.dataset.id, k = a.dataset.k, c = a.dataset.c;
    switch (x) {
      case 'cleardata': if (confirm('Clear all 3x3 data stored in this browser (intake draft, projects, connections, onboarding)? This cannot be undone.')) { Store.clearAll(); Intake.reset(); lastKey=''; App.route=null; location.hash = '#/intake/1'; route(true); App.toast('All local data cleared'); } return;
      case 'newintake': Intake.reset(); Store.clearDraft(); location.hash = '#/intake/1'; return;
      case 'approve': Pipeline.approve(id, k); return;
      case 'regen': Pipeline.regenerate(id, k); return;
      case 'retry': Pipeline.retry(id, k); return;
      case 'force': Pipeline.retry(id, k, true); return;
      case 'swap': Pipeline.swap(id, +a.dataset.i); return;
      case 'queue': { const sel = document.getElementById('ttpriv-' + id); if (sel && !sel.value) { App.toast('Choose who can view the TikTok video first', 'err'); sel.focus(); return; } Pipeline.queue(id, false, sel ? sel.value : null); return; }
      case 'ageconfirm': Pipeline.confirmAgeGate(id, a.dataset.p, 'age_restricted'); return;
      case 'agekeep': Pipeline.confirmAgeGate(id, a.dataset.p, 'kept_private'); return;
      case 'fbpage': Pipeline.fbPageCheck(id, a.checked); return;
      case 'stucksim': { const R = ['keyset_expired','unclaimed_dispatches','template_outdated'], h = Store.getFlags().routine_health || {}; const n = h.stuck_since ? R[(R.indexOf(h.stuck_reason) + 1) % R.length] : R[0];
        Store.setFlag('routine_health', {stuck_since:h.stuck_since || new Date().toISOString(), stuck_reason:n, keyset_v:1, returned:false}); route(); return; }
      case 'stuckback': Store.setFlag('routine_health', Object.assign({}, Store.getFlags().routine_health, {returned:true})); route(); return;
      case 'stuckoff': Store.setFlag('routine_health', {}); route(); return;
      case 'stuckcheck': { const h = Store.getFlags().routine_health || {}; if (h.stuck_reason === 'template_outdated' || h.returned) { App.toast('Still stuck (simulated). Re-copy the routine from the template.', 'err'); return; }
        Store.setFlag('routine_health', {}); App.toast('Routine is picking up jobs again (simulated)'); route(); return; }
      case 'ttaudit': Store.setFlag('tiktok_direct_post_audited', !Store.getFlags().tiktok_direct_post_audited); route(); return;
      case 'resetspend': Store.resetSpend(); App.toast('Simulated: new day, spend reset to $0'); Pipeline.retry(id, k); return;
      case 'download': Pipeline.download(id); return;
      case 'reset': Pipeline.reset(id); return;
      case 'delproject': if (confirm('Delete this project from this browser?')) { Store.deleteProject(id); const d = Store.getDraft(); if (d && d.projectId === id) { Intake.state.projectId = null; Store.saveDraft(Object.assign(d, {projectId:null})); } location.hash = '#/projects'; } return;
      case 'failnext': Sim3x3.failNext = !Sim3x3.failNext; route(); return;
      case 'speed': Sim3x3.speed = Sim3x3.speed === 1 ? 3 : 1; route(); return;
      case 'simstatus': { const v = a.dataset.v;
        Store.saveConnection(c, {status:v, jobId:null, hint:null}); App.toast(`${M3.conn(c).n}: ${({connected:'Set in bot',missing:'Missing'})[v]} (simulated)`, v === 'connected' ? '' : 'err'); return; }
      case 'wsave': { const W = Pages._w, u = M3.checkUrl(document.getElementById('w-url').value), kk = M3.checkKey(document.getElementById('w-key').value);
        if (!u.ok) { W.err = u.msg; route(); return; } if (!kk.ok) { W.err = kk.msg; route(); return; }
        W.err = null; W.secret = M3.fakeSecret(); W.saved = false; W.fail = false;
        Store.saveConnection('worker', {status:'pending', url:u.origin + '/…', last4:kk.last4, fp:M3.hash(W.secret).slice(0,8)}); return; }
      case 'copysecret': { const t = Pages._w.secret; if (t && navigator.clipboard) navigator.clipboard.writeText(t).then(() => App.toast('Copied. Save it in your bot as THREEX3_SIGNING_SECRET'), () => App.toast('Select the text and copy it')); return; }
      case 'wsaved': Pages._w.saved = a.checked; route(); return;
      case 'wtest': { const W = Pages._w; if (!W.saved) return; W.testing = true; W.fail = false; const j = Store.dispatchJob({kind:'ping', payload:{purpose:'test', signed:'simulated (planned: Ed25519 dispatch signature by 3x3 server; reply signed with THREEX3_SIGNING_SECRET)'}}); W.testJobId = j.id; route(); return; }
      case 'wfailnext': Sim3x3.failNext = !Sim3x3.failNext; route(); return;
      case 'wremove': if (confirm('Remove this routine from 3x3? Running jobs stop, and you will paste a webhook URL and routine key again.')) { Pages._w = {}; Store.saveConnection('worker', {status:'missing', url:null, last4:null, fp:null}); } return;
      case 'rotate': { const leak = !!a.dataset.leak;
        if (!confirm((leak ? 'Rotate now (suspected leak)?\n\n' : 'Rotate signing secret?\n\n') + 'This stops all running jobs straight away. Paste the new secret into your bot to continue.')) return;
        Store.listJobs().filter(j => (j.status === 'queued' || j.status === 'running') && !(j.payload && j.payload.stage === 'publish')).forEach(j => Sim3x3.cancel(j.id, 'Stopped: signing secret rotated. Paste the new secret into your bot, then Retry.'));
        const W = Pages._w; W.secret = M3.fakeSecret(); W.saved = false; W.fail = false;
        Store.saveConnection('worker', {status:'pending', fp:M3.hash(W.secret).slice(0,8)}); App.toast(leak ? 'Old secret revoked. Running jobs stopped.' : 'New signing secret created. Running jobs stopped.', 'err'); return; }
      case 'oauth': Pages._oauth = {id:c}; route(); setTimeout(() => { const el = document.getElementById('oauth-acct'); el && el.focus(); }, 30); return;
      case 'oauthcancel': Pages._oauth = null; route(); return;
      case 'oauthallow': { const m = Pages._oauth; if (!m) return; const acct = (document.getElementById('oauth-acct').value || M3.conn(m.id).acct).trim(); Pages._oauth = null;
        Store.saveConnection(m.id, {status:'connected', account:acct}); App.toast(`${M3.conn(m.id).n}: connected as ${acct} (simulated)`); return; }
      case 'sdisconnect': { const cc = M3.conn(c); if (confirm(`3x3 will revoke its access at ${cc.provider === 'Google' && c === 'youtube' ? 'YouTube' : cc.n} and delete the stored login. Videos already posted stay on your account.`)) Store.saveConnection(c, {status:'missing', account:null}); return; }
      case 'sexpire': Store.saveConnection(c, {status:'relogin'}); App.toast(`${M3.conn(c).n}: needs sign-in again (simulated)`, 'err'); return;
      case 'obcheck': Store.setOnboarding({[k]: a.checked}); return;
    }
  });
  // stage anchor links shouldn't break the router
  document.addEventListener('click', e => { const a = e.target.closest('a[href^="#stage-"]'); if (a) { e.preventDefault(); const el = document.querySelector(a.getAttribute('href')); el && el.scrollIntoView({behavior:'smooth', block:'start'}); } });

  window.addEventListener('hashchange', () => route());
  if (/static=1/.test(location.search)) document.body.classList.add('noanim');
  shell(); Sim3x3.resume(); route();
})();
