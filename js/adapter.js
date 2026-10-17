/* =====================================================================
   3x3 · DATA ADAPTER  —  >>> THIS IS THE SWAP POINT FOR A REAL BACKEND <<<
   =====================================================================
   Everything the UI reads or writes goes through window.Store (below).
   Today: LocalAdapter keeps it all in this browser's localStorage and
   hands jobs to the in-browser simulator (js/simulator.js), which plays
   the part of the user's Grok Bot worker.

   To go live, write SupabaseAdapter with the SAME methods and set
   window.Store = new SupabaseAdapter(...) at the bottom of this file:

     projects table  : id uuid pk, owner uuid, name text, intake jsonb,
                       rules jsonb, stages jsonb, created_at timestamptz
     jobs table      : id uuid pk, owner uuid, project_id uuid null,
                       kind text ('stage'|'ping'), stage text,
                       payload jsonb, status text ('queued'|'running'|
                       'needs_you'|'done'|'failed'), output jsonb,
                       error text, created_at, updated_at
     connections     : owner uuid, id text, status text, meta jsonb
                       (routine key + social OAuth tokens live in Vault,
                       never in this table or the browser; xAI/ElevenLabs
                       keys live only in the user's Grok Bot)

   Flow in production (architecture v2.3, Option A):
     0. Worker onboarding: routine webhook URL + routine key -> save-routine-key
        (key to Vault, only last 4 shown); signing secret generated server-side,
        shown once, stored by the user in their bot as THREEX3_SIGNING_SECRET.
        Social sign-ins: official OAuth in the user's browser -> tokens to Vault.
     1. dispatchJob() inserts a row in `jobs`.
     2. A Supabase Edge Function (DB webhook on insert) signs the payload
        server-side (HMAC-SHA256 over body + timestamp + nonce, using the
        per-user worker secret) and POSTs it to the user's Grok Bot worker
        webhook. The browser never signs or sees the secret.
     3. The worker calls back (Edge Function endpoint, signature checked)
        to set status/output; the UI gets it through Realtime -> subscribe().
     4. Publish jobs never go to the bot: the server-side publish-broker checks
        the approval hash, bundle rules and quota, then posts via official APIs.
   ===================================================================== */
(function(){
  const NS = '3x3.v1.';
  const KEYS = ['draft','projects','jobs','connections','onboarding','ledger'];
  const read = (k, d) => { try { const v = localStorage.getItem(NS+k); return v ? JSON.parse(v) : d; } catch(e){ return d; } };
  const write = (k, v) => localStorage.setItem(NS+k, JSON.stringify(v));
  const uid = p => p + '_' + Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-4);

  class LocalAdapter {
    constructor(){ this.subs = new Set(); this.mode = 'local-simulated'; }
    /* ---- subscriptions (Supabase: Realtime channel on jobs/projects/connections) ---- */
    subscribe(fn){ this.subs.add(fn); return () => this.subs.delete(fn); }
    emit(evt){ this.subs.forEach(f => { try { f(evt); } catch(e){ console.error(e); } }); }

    /* ---- intake draft (autosaved every change) ---- */
    getDraft(){ return read('draft', null); }
    saveDraft(d){ write('draft', d); }
    clearDraft(){ localStorage.removeItem(NS+'draft'); }

    /* ---- projects ---- */
    listProjects(){ return read('projects', []).sort((a,b) => b.created_at.localeCompare(a.created_at)); }
    getProject(id){ return read('projects', []).find(p => p.id === id) || null; }
    createProject(p){ const all = read('projects', []); p.id = p.id || uid('prj'); p.created_at = new Date().toISOString(); all.push(p); write('projects', all); this.emit({type:'project', id:p.id}); return p; }
    saveProject(p){ const all = read('projects', []); const i = all.findIndex(x => x.id === p.id); if (i < 0) all.push(p); else all[i] = p; write('projects', all); this.emit({type:'project', id:p.id}); return p; }
    deleteProject(id){ write('projects', read('projects', []).filter(p => p.id !== id)); write('jobs', read('jobs', []).filter(j => j.project_id !== id)); this.emit({type:'project', id}); }

    /* ---- connections (status + non-secret meta; test placeholders only) ---- */
    getConnections(){ return read('connections', {}); }
    getConnection(id){ return read('connections', {})[id] || {status:'missing'}; }
    saveConnection(id, c){ const all = read('connections', {}); all[id] = Object.assign({}, all[id], c, {updated_at:new Date().toISOString()}); write('connections', all); this.emit({type:'connection', id}); return all[id]; }

    /* ---- onboarding flags ---- */
    getOnboarding(){ return read('onboarding', {}); }
    setOnboarding(o){ write('onboarding', Object.assign(read('onboarding', {}), o)); this.emit({type:'onboarding'}); }

    /* ---- jobs (Supabase: insert row -> edge fn signs + POSTs to worker webhook) ---- */
    listJobs(filter={}){ return read('jobs', []).filter(j => Object.keys(filter).every(k => j[k] === filter[k])); }
    getJob(id){ return read('jobs', []).find(j => j.id === id) || null; }
    dispatchJob(job){
      const j = Object.assign({id:uid('job'), status:'queued', created_at:new Date().toISOString(), output:null, error:null}, job);
      j.updated_at = j.created_at;
      const all = read('jobs', []); all.push(j); write('jobs', all.slice(-300));
      this.emit({type:'job', job:j});
      if (window.Sim3x3) window.Sim3x3.handle(j);   // LOCAL ONLY: the simulator stands in for the user's bot
      return j;
    }
    /* called by the worker callback (here: by the simulator) */
    updateJob(id, patch){
      const all = read('jobs', []); const j = all.find(x => x.id === id); if (!j) return null;
      Object.assign(j, patch, {updated_at:new Date().toISOString()}); write('jobs', all);
      this.emit({type:'job', job:j}); return j;
    }

    /* ---- spend ledger (LOCAL ONLY demo of the $/day cap; production: server-side ledger table + the user's bot) ---- */
    today(){ return new Date().toLocaleDateString('en-CA', {timeZone:'Asia/Manila'}); }
    spentToday(){ return +((read('ledger', {})[this.today()] || 0)).toFixed(2); }
    addSpend(usd){ const l = read('ledger', {}), d = this.today(); l[d] = +(((l[d] || 0) + usd)).toFixed(2); write('ledger', {[d]: Math.max(0, l[d])}); this.emit({type:'ledger'}); }
    resetSpend(){ write('ledger', {}); this.emit({type:'ledger'}); }

    /* ---- privacy ---- */
    clearAll(){ Object.keys(localStorage).filter(k => k.startsWith(NS)).forEach(k => localStorage.removeItem(k)); this.emit({type:'cleared'}); }
    exportAll(){ const o = {}; KEYS.forEach(k => o[k] = read(k, null)); return o; }
  }

  /* class SupabaseAdapter { ...same interface, backed by supabase-js... } */
  window.Store = new LocalAdapter();
  window.Store.uid = uid;
})();
