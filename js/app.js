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
    v.innerHTML = `<div class="page" id="page"><div class="wrap ${changed?'enter':''}">${html}</div></div>`;
    document.title = '3x3 · ' + r.name[0].toUpperCase() + r.name.slice(1);
    App.a11y($('#page'));
    if (changed) { $('#page').scrollTop = 0; window.scrollTo(0, 0);
      const f = r.q.get('focus'); if (f) setTimeout(() => { const el = document.getElementById('conn-' + f); el && el.scrollIntoView({block:'center', behavior:'smooth'}); }, 60);
      const s = location.hash.match(/#stage-(\w+)/); }
    else { $('#page').scrollTop = prevScroll; window.scrollTo(0, prevWin); }
  }
  App.render = route;
  App.a11y = root => { if (!root) return;
    root.querySelectorAll('.tog').forEach(t => { const locked = t.classList.contains('locked'); t.setAttribute('role','switch'); t.setAttribute('aria-checked', String(t.classList.contains('on'))); t.tabIndex = locked ? -1 : 0; if (locked) t.setAttribute('aria-disabled','true');
      if (!t.getAttribute('aria-label')) { const h = t.closest('.trow') && t.closest('.trow').querySelector('h4'); t.setAttribute('aria-label', h ? h.textContent.trim() : 'Toggle'); } });
    root.querySelectorAll('[data-set],[data-act="plat"]').forEach(b => { b.setAttribute('aria-pressed', String(b.classList.contains('sel'))); if (b.tagName !== 'BUTTON') { b.tabIndex = 0; b.setAttribute('role','button'); } });
    root.querySelectorAll('input,select,textarea').forEach(i => { if (i.type === 'hidden' || i.getAttribute('aria-label')) return; const lt = i.labels && [...i.labels].map(l => l.textContent.trim()).join(' ');
      if (!lt) i.setAttribute('aria-label', i.placeholder || (i.dataset.col ? i.dataset.col + ' colour' : i.dataset.hex ? i.dataset.hex + ' colour hex' : i.dataset.in || i.dataset.f || 'input')); });
    root.querySelectorAll('[data-go]:not(button)').forEach(e => { e.tabIndex = 0; e.setAttribute('role','button'); });
    root.querySelectorAll('.stp').forEach(e => e.setAttribute('aria-label', 'Go to step: ' + (e.querySelector('.t') || e).textContent.trim()));
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
      if (j.kind === 'connect') { const id = j.payload.conn, c = Store.getConnection(id); if (c.jobId === j.id) {
        if (j.status === 'done') { Store.saveConnection(id, {status:'connected', hint:'session confirmed by bot', jobId:null}); App.toast(`${M3.conn(id).n} connected`); }
        else if (j.status === 'failed') Store.saveConnection(id, {status:c.prev || 'missing', jobId:null}); } }
      if (j.kind === 'ping') { const ob = Store.getOnboarding(); if (ob.testJobId === j.id) { Store.setOnboarding({testJobStatus:j.status, testJob: ob.testJob || j.status === 'done'}); if (j.status === 'done') App.toast('Test job: your worker replied (simulated)'); } }
    }
    if (evt.type === 'connection') { const c = Store.getConnection(evt.id); if (c.status === 'connected') setTimeout(() => Pipeline.recheck(), 0);
      if (App.route === 'intake' && Intake.state.step === 9) Intake.rerender(); }
    App.soon();
  });

  /* ---------- page actions (data-x) ---------- */
  function fieldVal(k){ const el = document.querySelector(`[data-f="${k}"]`); return el ? el.value : ''; }
  function setErr(id, msg){ const el = document.getElementById('err-' + id); if (el) { el.textContent = msg || ''; el.classList.toggle('on', !!msg); } }
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
      case 'queue': Pipeline.queue(id); return;
      case 'download': Pipeline.download(id); return;
      case 'reset': Pipeline.reset(id); return;
      case 'delproject': if (confirm('Delete this project from this browser?')) { Store.deleteProject(id); const d = Store.getDraft(); if (d && d.projectId === id) { Intake.state.projectId = null; Store.saveDraft(Object.assign(d, {projectId:null})); } location.hash = '#/projects'; } return;
      case 'failnext': Sim3x3.failNext = !Sim3x3.failNext; route(); return;
      case 'speed': Sim3x3.speed = Sim3x3.speed === 1 ? 3 : 1; route(); return;
      case 'save': {
        if (c === 'worker') { const u = M3.checkUrl(fieldVal('worker.url')); if (!u.ok) return setErr(c, u.msg); const s = M3.checkSecret(fieldVal('worker.secret')); if (!s.ok) { if (s.real) document.querySelector('[data-f="worker.secret"]').value = ''; return setErr(c, s.msg); }
          Store.saveConnection('worker', {status:'connected', url:new URL(fieldVal('worker.url').trim()).origin + '/…', hint:s.hint}); App.toast('Worker webhook saved (test mode)'); return; }
        const s = M3.checkSecret(fieldVal(c + '.key')); if (!s.ok) { if (s.real) document.querySelector(`[data-f="${c}.key"]`).value = ''; return setErr(c, s.msg); }
        Store.saveConnection(c, {status:'connected', hint:s.hint}); App.toast(`${M3.conn(c).n} saved (test mode)`); return; }
      case 'route': { const cur = Store.getConnection('imagine'); if ((cur.route || 'api') !== a.dataset.v) Store.saveConnection('imagine', {route:a.dataset.v, status:'missing', hint:null, jobId:null}); return; }
      case 'connect': { if (!M3.isOk(Store.getConnection('worker'))) { App.toast('Connect your Grok Bot worker first: logins run on your bot', 'err'); location.hash = '#/connections?focus=worker'; return; }
        const prev = Store.getConnection(c).status || 'missing'; const j = Store.dispatchJob({kind:'connect', payload:{conn:c}});
        Store.saveConnection(c, {status:'pending', jobId:j.id, prev: prev === 'pending' ? 'missing' : prev}); return; }
      case 'confirm': { const cc = Store.getConnection(c); if (cc.jobId) Sim3x3.confirm(cc.jobId); return; }
      case 'cancel': { const cc = Store.getConnection(c); if (cc.jobId) Sim3x3.cancel(cc.jobId); return; }
      case 'expire': Store.saveConnection(c, {status:'relogin'}); App.toast(`${M3.conn(c).n}: session expired (simulated)`, 'err'); return;
      case 'disconnect': Store.saveConnection(c, {status:'missing', hint:null, url:null, jobId:null}); return;
      case 'obcheck': Store.setOnboarding({[k]: a.checked}); return;
      case 'testjob': { const j = Store.dispatchJob({kind:'ping', payload:{hello:'3x3'}}); Store.setOnboarding({testJobId:j.id, testJobStatus:'queued'}); return; }
    }
  });
  // stage anchor links shouldn't break the router
  document.addEventListener('click', e => { const a = e.target.closest('a[href^="#stage-"]'); if (a) { e.preventDefault(); const el = document.querySelector(a.getAttribute('href')); el && el.scrollIntoView({behavior:'smooth', block:'start'}); } });

  window.addEventListener('hashchange', () => route());
  if (/static=1/.test(location.search)) document.body.classList.add('noanim');
  shell(); Sim3x3.resume(); route();
})();
