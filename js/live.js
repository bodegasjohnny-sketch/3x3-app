/* 3x3 · Live worker connection (Connections > Worker). Real backend: Supabase Auth + Edge Function save-routine-key.
   Secrets: the routine key is typed into a password field, sent once over TLS and cleared; the signing secret is returned
   once, shown once, and dropped from memory when you confirm. Neither is written to localStorage or sessionStorage.
   The session access token lives in memory and sessionStorage (this tab only). Config: js/live-config.js (public values). */
(function(){
  const C = window.THREEX3_LIVE || {}, L = {sess:null, st:null, err:'', busy:false, secret:'', mode:'in'};
  try { L.sess = JSON.parse(sessionStorage.getItem('3x3.live.sess') || 'null'); } catch(e) {}
  const H = t => Object.assign({'Content-Type':'application/json', apikey:C.publishableKey}, t ? {Authorization:'Bearer ' + t} : {});
  const keep = s => { L.sess = s; s ? sessionStorage.setItem('3x3.live.sess', JSON.stringify({access_token:s.access_token, refresh_token:s.refresh_token, expires_at:s.expires_at, email:s.email})) : sessionStorage.removeItem('3x3.live.sess'); };
  const rr = () => { if (window.App && App.route === 'connections') App.render(); };
  async function auth(path, body){
    const r = await fetch(C.url + '/auth/v1/' + path, {method:'POST', headers:H(), body:JSON.stringify(body)}); const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(j.msg || j.error_description || j.message || 'Sign-in failed.'); return j; }
  async function token(){
    if (!L.sess) return null;
    if (L.sess.expires_at && L.sess.expires_at * 1000 < Date.now() + 60000) {
      try { const j = await auth('token?grant_type=refresh_token', {refresh_token:L.sess.refresh_token}); keep({...j, email:L.sess.email}); } catch(e) { keep(null); return null; } }
    return L.sess.access_token; }
  async function fn(body){
    const t = await token(); if (!t) throw new Error('Sign in first.');
    const r = await fetch(C.url + '/functions/v1/save-routine-key', {method:'POST', headers:H(t), body:JSON.stringify(body)});
    const j = await r.json().catch(() => ({})); if (r.status === 401) { keep(null); } if (!r.ok) throw new Error(j.error || ('Server error ' + r.status)); return j; }
  async function run(f){ L.busy = true; L.err = ''; rr(); try { await f(); } catch(e) { L.err = e.message || String(e); } L.busy = false; rr(); }
  const val = id => (document.getElementById(id) || {}).value || '';
  const syncStore = st => { if (!window.Store) return;
    if (st && st.status !== 'missing') Store.saveConnection('worker', {status:'connected', live:true, last4:st.routine_key_hint, url:st.webhook_origin || '', key_id:st.key_id});
    else if (Store.getConnection('worker').live) Store.saveConnection('worker', {status:'missing', live:true, last4:'', url:'', key_id:''}); };
  const A = {
    async signin(){ const e = val('lv-email').trim(), p = val('lv-pass'); await run(async () => { const j = await auth('token?grant_type=password', {email:e, password:p}); keep({...j, email:e}); await A.status(true); }); },
    async signup(){ const e = val('lv-email').trim(), p = val('lv-pass'); await run(async () => { if (p.length < 10) throw new Error('Use a password of at least 10 characters.');
      const j = await auth('signup', {email:e, password:p}); if (j.access_token) { keep({...j, email:e}); await A.status(true); } else L.err = 'Check your email and confirm the account, then sign in.'; }); },
    signout(){ keep(null); L.st = null; L.secret = ''; rr(); },
    async status(inner){ const f = async () => { L.st = await fn({action:'status'}); syncStore(L.st); }; inner ? await f() : await run(f); },
    async save(){ const url = val('lv-url'), key = val('lv-key'); const k = document.getElementById('lv-key'); if (k) k.value = ''; await run(async () => {
      const chk = window.M3 ? M3.checkUrl(url) : {ok:true}; if (!chk.ok) throw new Error(chk.msg);
      const j = await fn({webhook_url:url.trim(), routine_key:key}); L.secret = j.signing_secret; L.st = j; syncStore(j); }); },
    secretSaved(){ L.secret = ''; rr(); },
    async remove(){ if (!confirm('Disconnect your Grok Bot? Its key is retired straight away.')) return; await run(async () => { L.st = await fn({action:'remove'}); syncStore(L.st); }); },
    copy(){ navigator.clipboard && navigator.clipboard.writeText(L.secret); },
  };
  document.addEventListener('click', e => { const b = e.target.closest('[data-live]'); if (!b) return; e.preventDefault(); const f = A[b.dataset.live]; f && f(); });
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function card(focus){
    if (!C.url || !C.publishableKey) return '<section class="ccard wide flag" id="conn-worker"><p>Live backend not configured (js/live-config.js).</p></section>';
    const st = L.st, on = !!L.sess, dis = L.busy ? 'disabled' : '';
    if (on && !st && !L.busy && !L.err) setTimeout(() => A.status(), 0);
    let body;
    if (!on) body = `<p class="muted">Sign in to your 3x3 account to connect your Grok Bot. This talks to the real 3x3 server (test project).</p>
      <label class="field"><span>Email</span><input class="inp" id="lv-email" type="email" autocomplete="username"></label>
      <label class="field"><span>Password</span><input class="inp" id="lv-pass" type="password" autocomplete="current-password"></label>
      <div class="row" style="gap:8px"><button class="btn pri" data-live="signin" ${dis}>Sign in</button><button class="btn ghost" data-live="signup" ${dis}>Create account</button></div>`;
    else if (L.secret) body = `<ol class="wsteps"><li class="done"><b>Step 1.</b> Routine saved (key ••••${esc(st.routine_key_hint)}).</li><li class="on"><b>Step 2.</b> Copy your 3x3 signing secret now and save it in your Grok Bot as a secret named <code>THREEX3_SIGNING_SECRET</code>. It is shown once and never again.</li></ol>
      <div class="secretbox"><code id="lv-secret">${esc(L.secret)}</code><button class="btn sm" data-live="copy">Copy</button></div>
      <button class="btn pri" data-live="secretSaved" style="margin-top:10px">I've saved it in my Grok Bot</button>`;
    else if (st && st.status !== 'missing') body = `<div class="okline" style="margin:0 0 10px">Routine saved on the 3x3 server. Signed test job: not available yet (dispatch-job is not deployed), so the connection is untested.</div>
      <div class="kv"><span>Key id</span><b class="mono">${esc(st.key_id)}</b></div><div class="kv"><span>Routine key</span><b class="mono">••••${esc(st.routine_key_hint)}</b></div>
      <div class="row" style="gap:8px;margin-top:10px;flex-wrap:wrap"><button class="btn sm ghost" data-live="save" style="display:none"></button><button class="btn sm danger" data-live="remove" ${dis}>Disconnect</button><button class="btn sm ghost" data-live="signout">Sign out</button></div>
      <p class="muted" style="font-size:12px;margin-top:8px">To rotate, paste the routine details again below; the old key is retired and a new signing secret is shown once.</p>${form()}`;
    else body = form();
    function form(){ return on ? `<label class="field"><span>Routine webhook URL</span><input class="inp" id="lv-url" maxlength="300" placeholder="https://… (your 3x3 routine's webhook)" autocomplete="off" spellcheck="false"></label>
      <label class="field"><span>Routine key</span><input class="inp" id="lv-key" type="password" maxlength="512" autocomplete="off" spellcheck="false"></label>
      <p class="muted" style="margin:-4px 0 10px">Sent once over HTTPS to the server and stored in Supabase Vault. Only its last 4 characters are kept for display.</p>
      <button class="btn pri" data-live="save" ${dis}>Save and get signing secret</button> <button class="btn sm ghost" data-live="signout">Sign out (${esc(L.sess.email||'')})</button>` : ''; }
    const chip = L.secret || (st && st.status !== 'missing') ? '<span class="schip warn"><i></i>Saved, untested</span>' : '<span class="schip red"><i></i>Missing</span>';
    return `<section class="ccard wide ${focus==='worker'?'focus':''}" id="conn-worker"><div class="chd"><div class="grow"><h3>Connect your Grok Bot <span class="badge cyan">Live</span></h3><p class="reqtxt">Needed for every AI step</p></div>${chip}</div>
      ${body}${L.busy?'<p class="muted"><span class="spin"></span> Working…</p>':''}${L.err?`<div class="errbox" style="margin-top:10px"><span>${esc(L.err)}</span></div>`:''}
      <div class="infobox" style="margin:14px 0 0"><div>Your bot keeps three secrets that you add yourself: <code>XAI_API_KEY</code>, <code>ELEVENLABS_API_KEY</code> and <code>THREEX3_SIGNING_SECRET</code>. 3x3 never sees the first two.</div></div></section>`;
  }
  window.Live3x3 = {card, _state:L};
})();
