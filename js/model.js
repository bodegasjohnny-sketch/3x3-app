/* 3x3 · shared model: connections, pipeline stages, requirement + warning logic, hashing, secret guard. */
(function(){
const M = {};

/* ---------- connections the automation needs ---------- */
M.CONNS = [
  {id:'worker', n:'Grok Bot worker', short:'Grok Bot worker webhook', kind:'webhook', icon:'bolt', c:'#00C2FF',
   what:'Your own Grok Bot, created from the 3x3 template, does the actual work. This app posts each job to its worker webhook; the bot runs it on its own computer and reports back.',
   how:'In your bot: Settings › Webhooks › copy the worker URL. The signing secret stays in your bot\'s secret store in production.'},
  {id:'imagine', n:'Grok Imagine', short:'Grok Imagine access', kind:'imagine', icon:'spark', c:'#8B5CF6',
   what:'Generates every still (storyboard) and turns stills into short clips.',
   how:'Pick a route. xAI API is recommended at volume. The SuperGrok browser route is for low volume.'},
  {id:'elevenlabs', n:'ElevenLabs', short:'ElevenLabs API key', kind:'apikey', icon:'mic', c:'#F5F7FA',
   what:'Generates the voiceover narration from the approved script with your chosen voice.',
   how:'In production the key lives in your Grok Bot secret store, and the bot calls the ElevenLabs API.'},
  {id:'youtube', n:'YouTube', short:'YouTube channel', kind:'connector', icon:'yt', c:'#EA3943', plat:'yt',
   what:'Uploads finished Shorts to your channel.', api:'YouTube Data API v3 (videos.insert), via OAuth',
   how:'Your bot connects YouTube as a connector (Google OAuth consent). The login is only used to authorize the API.'},
  {id:'facebook', n:'Facebook Page', short:'Facebook Page', kind:'connector', icon:'fb', c:'#00C2FF', plat:'fb',
   what:'Publishes Reels to your Facebook Page.', api:'Meta Graph API (Pages / Reels publishing), via OAuth',
   how:'Your bot connects your Page as a connector (Meta OAuth). The login is only used to authorize the API.'},
  {id:'tiktok', n:'TikTok', short:'TikTok login', kind:'browser', icon:'tt', c:'#F5F7FA', plat:'tt',
   what:'Posts videos to your TikTok account.', api:'TikTok Content Posting API, via OAuth (Login Kit)',
   how:'Your bot opens TikTok\'s OAuth/login page in its browser. You sign in there once to authorize the Content Posting API. The bot does not post by clicking around the website.'},
  {id:'instagram', n:'Instagram', short:'Instagram (professional account)', kind:'connector', icon:'ig', c:'#FF6B9A', plat:'ig', optional:true,
   what:'Optional. Cross-posts Reels to an Instagram professional account linked to your Facebook Page.', api:'Meta Graph API (Instagram Content Publishing)',
   how:'Uses the same Meta OAuth as your Facebook Page. The Instagram account must be Business or Creator.'},
  {id:'gdrive', n:'Google Drive', short:'Google Drive', kind:'connector', icon:'up', c:'#16C784', optional:true,
   what:'Optional. Saves each final MP4 and its project files to a Drive folder.', api:'Google Drive API, via OAuth',
   how:'Your bot connects Drive as a connector.'},
];
M.conn = id => M.CONNS.find(c => c.id === id);

/* ---------- pipeline ---------- */
M.STAGES = [
  {k:'rules', s:'Rules',   n:'Rules',              icon:'bolt',   approval:false, needs:['worker'],            d:'Compiles the locked intake into the global rule set every step must follow.'},
  {k:'script', s:'Script',  n:'Script',             icon:'edit',   approval:true,  needs:['worker'],            d:'Drafts the script beat by beat, with a source for every fact. Approval 1.'},
  {k:'voice', s:'Voiceover',   n:'Voiceover',          icon:'mic',    approval:false, needs:['worker','elevenlabs'], d:'ElevenLabs narration of the approved script, using your voice, pace and pronunciations.'},
  {k:'stills', s:'Stills',  n:'Stills / storyboard',icon:'grid',   approval:true,  needs:['worker','imagine'],  d:'One Grok Imagine still per shot in your style. Swap any single still. Approval 2.'},
  {k:'video', s:'Video',   n:'Video from stills',  icon:'film',   approval:true,  needs:['worker','imagine'],  d:'Each approved still becomes a short clip with one camera move. Approval 3.'},
  {k:'final', s:'Final stitch',   n:'Final stitch',       icon:'cc',     approval:true,  needs:['worker'],            d:'Clips, voice, captions, music and SFX mixed to −14 LUFS, with AI and affiliate labels burned in. Approval 4.'},
  {k:'publish', s:'Publish', n:'Download / publish', icon:'up',     approval:false, needs:['worker'],            d:'Download the MP4, or queue it for publishing through the official platform APIs.'},
];
M.stage = k => M.STAGES.find(s => s.k === k);
M.STATUS = {
  idle:    ['Not started','mute'], running:['Running','cyan'], needs:['Needs you','warn'],
  awaiting:['Awaiting approval','vio'], done:['Done','grn'], failed:['Failed','red'],
  stale:   ['Re-approval needed','amber'], skipped:['Skipped','mute']
};

/* which connections an intake needs, and for which steps */
M.requirements = (I) => {
  const r = {};
  const add = (id, stage, why) => { (r[id] = r[id] || {id, stages:[], why:[]}); if (!r[id].stages.includes(stage)) r[id].stages.push(stage); if (why && !r[id].why.includes(why)) r[id].why.push(why); };
  ['rules','script','stills','video','final','publish'].forEach(s => add('worker', s, 'runs every job'));
  if (I.vo !== false) add('elevenlabs', 'voice', 'voiceover is on');
  add('imagine', 'stills', 'stills are generated'); add('imagine', 'video', 'clips are generated from stills');
  const P = I.plat || {};
  if (P.yt) add('youtube', 'publish', 'you picked YouTube Shorts');
  if (P.fb) add('facebook', 'publish', 'you picked Facebook Reels');
  if (P.tt) add('tiktok', 'publish', 'you picked TikTok');
  if (P.ig) { add('instagram', 'publish', 'you picked Instagram Reels'); add('facebook', 'publish', 'Instagram publishing goes through your linked Facebook Page'); }
  return r;
};
M.stageNeeds = (stageKey, I) => {
  const req = M.requirements(I); return Object.values(req).filter(x => x.stages.includes(stageKey)).map(x => x.id);
};
M.isOk = st => st && st.status === 'connected';
M.connLabelMissing = (id, st) => {
  const c = M.conn(id);
  if (id === 'imagine') { const route = (st && st.route) || 'api'; return route === 'api' ? 'an xAI API key (Grok Imagine)' : 'a SuperGrok login'; }
  if (id === 'elevenlabs') return 'an ElevenLabs API key';
  if (id === 'worker') return 'your Grok Bot worker webhook';
  const an = /^[AEIOU]/i.test(c.n) ? 'an' : 'a';
  if (c.kind === 'browser') return `${an} ${c.n} login`;
  return `${an} ${c.n} connection`;
};
/* warnings like "Stills step needs SuperGrok login" for every missing/expired required connection */
M.warnings = (I, conns) => {
  const out = [];
  Object.values(M.requirements(I)).forEach(req => {
    const st = conns[req.id] || {status:'missing'};
    if (M.isOk(st)) return;
    const c = M.conn(req.id);
    const verb = st.status === 'relogin' ? 'needs a re-login for' : st.status === 'pending' ? 'is waiting on you for' : 'needs';
    const label = st.status === 'relogin' || st.status === 'pending' ? c.n : M.connLabelMissing(req.id, st);
    const names = req.stages.map(s => M.stage(s).n.split(' /')[0]);
    out.push({id:req.id, status:st.status || 'missing', stages:req.stages,
      text: (req.id === 'worker' ? 'Every step' : `${names.join(' & ')} step${names.length>1?'s':''}`) + ` ${verb} ${label}`,
      why: req.why.join('; ')});
  });
  return out;
};

/* ---------- secret guard: test placeholders only ---------- */
M.TEST_RE = /^test[_-][A-Za-z0-9_-]{1,32}$/;
M.REAL_RE = /(sk[_-]|xi[_-]|xai[_-]|gh[opsu]_|AIza|EAA[A-Za-z0-9]|ya29\.|whsec_)[A-Za-z0-9_\-]{8,}|[A-Za-z0-9_\-]{32,}/;
M.checkSecret = v => {
  v = (v || '').trim();
  if (!v) return {ok:false, msg:'Enter a placeholder such as test_key_1.'};
  if (M.REAL_RE.test(v) && !M.TEST_RE.test(v)) return {ok:false, real:true, msg:'That looks like a real key, so it was rejected and not saved. This test build only accepts placeholders that start with test_.'};
  if (!M.TEST_RE.test(v)) return {ok:false, msg:'Simulated build: use a placeholder that starts with test_ (letters, digits, _ or -, at most 37 characters).'};
  return {ok:true, hint: v.slice(0, 6) + '…' + v.slice(-2)};
};
M.checkUrl = v => { try { const u = new URL((v||'').trim()); if (u.protocol !== 'https:') return {ok:false, msg:'The webhook URL must start with https://'}; if (/[?&](key|token|secret|sig)=/i.test(u.search)) return {ok:false, msg:'Remove credentials from the URL. Secrets never go in the URL.'}; return {ok:true}; } catch(e){ return {ok:false, msg:'Enter a full https:// URL.'}; } };

/* ---------- hashing (approval locks) ---------- */
M.hash = (obj) => {
  const s = typeof obj === 'string' ? obj : JSON.stringify(obj);
  let h1 = 0x811c9dc5, h2 = 0x01000193 ^ s.length;
  for (let i = 0; i < s.length; i++) { const c = s.charCodeAt(i); h1 = Math.imul(h1 ^ c, 16777619); h2 = Math.imul(h2 ^ c, 2246822507) ^ (h2 >>> 13); }
  return ((h1 >>> 0).toString(16).padStart(8,'0') + (h2 >>> 0).toString(16).padStart(8,'0'));
};

/* ---------- AI disclosure mapping per platform ---------- */
M.AI_DISCLOSURE = {
  yt: {n:'YouTube', label:'Altered or synthetic content', how:'Set "Altered content: Yes" at upload (YouTube Data API: status.containsSyntheticMedia = true).'},
  fb: {n:'Facebook', label:'AI info (Meta)', how:'Apply Meta\'s "AI info" label when publishing the Reel.'},
  ig: {n:'Instagram', label:'AI info (Meta)', how:'Apply Meta\'s "AI info" label when publishing the Reel.'},
  tt: {n:'TikTok', label:'AI-generated content', how:'Turn on the "AI-generated content" disclosure (Content Posting API: is_aigc = true).'},
};
M.CLAIM_NICHES = ['health_nutrition','human_body','finance'];
M.CLAIM_SUBS = ['clinic_education','investing_basics','credit_debt','side_hustles','fitness_gym','real_estate'];
M.needsNoClaims = I => M.CLAIM_NICHES.includes(I.niche) || M.CLAIM_SUBS.includes(I.sub) || /crypto|bitcoin|forex|stock|supplement|weight ?loss/i.test(I.ownTopic || '');
M.BANNED_PRESET = {
  health_nutrition:['cure','treat','prevent','heal','detox','miracle','guaranteed'],
  human_body:['cure','treat','prevent','heal','miracle','guaranteed'],
  finance:['guaranteed returns','risk-free','get rich quick','financial advice','to the moon','double your money'],
  local_business:['guaranteed','best in town','#1 rated'],
};
M.AFFILIATE_LINE = '#ad · I may earn a commission from links in my bio';
M.isAffiliate = I => I.goal === 'affiliate';

window.M3 = M;
})();
