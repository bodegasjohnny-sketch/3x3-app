/* 3x3 · shared model: connections, pipeline stages, requirement + warning logic, hashing, secret guard. */
(function(){
const M = {};

/* ---------- connections the automation needs ---------- */
M.CONNS = [
  {id:'worker', group:'bot', n:'Grok Bot worker', short:'Grok Bot routine', kind:'worker', icon:'bolt', c:'#00C2FF',
   what:'3x3 sends work to a routine in your own Grok Bot. Your bot runs the AI steps with your own xAI and ElevenLabs keys. 3x3 never sees those keys.',
   how:'In Grok Bot, create the 3x3 routine from our template. Copy its webhook URL and routine key, and paste them in Connections › Worker.'},
  {id:'imagine', group:'bot', n:'XAI_API_KEY (in your bot)', short:'xAI API key in your bot', kind:'botsecret', secret:'XAI_API_KEY', icon:'spark', c:'#8B5CF6',
   what:'Your bot uses your xAI key for every still and clip (Grok Imagine through the official xAI API, the only generation route in 3x3).',
   how:'Create a key at console.x.ai. In Grok Bot, add it as a secret named XAI_API_KEY. Never paste it into 3x3.'},
  {id:'elevenlabs', group:'bot', n:'ELEVENLABS_API_KEY (in your bot)', short:'ElevenLabs key in your bot', kind:'botsecret', secret:'ELEVENLABS_API_KEY', icon:'mic', c:'#F5F7FA',
   what:'Your bot uses your ElevenLabs key to make the voiceover from the approved script.',
   how:'In ElevenLabs open Profile › API keys and create a key. In Grok Bot, add it as a secret named ELEVENLABS_API_KEY. Never paste it into 3x3.'},
  {id:'youtube', group:'social', n:'YouTube', btn:'Connect YouTube', kind:'oauth', icon:'yt', c:'#EA3943', plat:'yt', provider:'Google', acct:'Healthy Bites PH',
   perms:'Upload videos, and read your channel name.', api:'YouTube Data API v3 (videos.insert)'},
  {id:'facebook', group:'social', n:'Facebook Page', btn:'Connect Facebook Page', kind:'oauth', icon:'fb', c:'#00C2FF', plat:'fb', provider:'Facebook', acct:'Healthy Bites PH (Page)',
   perms:'Choose a Page and publish Reels to it.', api:'Meta Graph API (Page Reels publishing)'},
  {id:'instagram', group:'social', n:'Instagram', btn:'Connect Instagram', kind:'oauth', icon:'ig', c:'#FF6B9A', plat:'ig', optional:true, provider:'Instagram', acct:'@healthybitesph',
   perms:'Publish Reels to your professional account.', api:'Instagram Graph API (Reels content publishing)'},
  {id:'tiktok', group:'social', n:'TikTok', btn:'Connect TikTok', kind:'oauth', icon:'tt', c:'#F5F7FA', plat:'tt', provider:'TikTok', acct:'@healthybitesph',
   perms:'Read your basic profile and post videos.', api:'TikTok Content Posting API'},
  {id:'gdrive', group:'social', n:'Google Drive', btn:'Connect Google Drive', kind:'oauth', icon:'up', c:'#16C784', optional:true, later:true, provider:'Google', acct:'johnny@…',
   perms:'Coming later. Not part of the current architecture and not required: final videos download from 3x3.', api:'Not available yet'},
];
M.SOCIAL_STATUS = {connected:'Connected as', relogin:'Needs sign-in again', missing:'Disconnected'};
M.PUBLISH_NOTE = 'Nothing is posted until you approve it. Alcohol-history videos are always uploaded as private: you set the 18+ age limit in the platform\'s app and publish them yourself. Kids videos go to YouTube only, marked Made for Kids.';
M.TIKTOK_NOTE = 'Until TikTok approves 3x3, TikTok posts are private drafts, or you can download the video and post it yourself. Videos under 1 minute are marked \'Reach only: not eligible for Creator Rewards\'.';
M.REACH_ONLY = 'Reach only: not eligible for Creator Rewards';
M.conn = id => M.CONNS.find(c => c.id === id);

/* ---------- pipeline ---------- */
M.STAGES = [
  {k:'rules', s:'Rules',   n:'Rules',              icon:'bolt',   approval:false, needs:['worker'],            d:'Compiles the locked intake into the global rule set every step must follow.'},
  {k:'script', s:'Script',  n:'Script',             icon:'edit',   approval:true,  needs:['worker'],            d:'Drafts the script beat by beat, with a source for every fact. Approval 1.'},
  {k:'voice', s:'Voiceover',   n:'Voiceover',          icon:'mic',    approval:false, needs:['worker','elevenlabs'], d:'ElevenLabs narration of the approved script, using your voice, pace and pronunciations.'},
  {k:'stills', s:'Stills',  n:'Stills / storyboard',icon:'grid',   approval:true,  needs:['worker','imagine'],  d:'One Grok Imagine still per shot in your style. Swap any single still. Approval 2.'},
  {k:'video', s:'Video',   n:'Video from stills',  icon:'film',   approval:true,  needs:['worker','imagine'],  d:'Each approved still becomes a short clip with one camera move. Approval 3.'},
  {k:'final', s:'Final stitch',   n:'Final stitch',       icon:'cc',     approval:true,  needs:['worker'],            d:'Clips, voice, captions, music and SFX mixed to −14 LUFS, with AI and affiliate labels burned in. Approval 4.'},
  {k:'publish', s:'Publish', n:'Download / publish', icon:'up',     approval:false, needs:[],                    d:'Download the MP4, or approve publishing. 3x3\'s server posts it through the official platform APIs. Your bot never touches your social accounts.'},
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
  ['rules','script','stills','video','final'].forEach(s => add('worker', s, 'runs every AI step'));
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
  if (id === 'imagine') return 'XAI_API_KEY in your Grok Bot';
  if (id === 'elevenlabs') return 'ELEVENLABS_API_KEY in your Grok Bot';
  if (id === 'worker') return 'your Grok Bot worker (routine)';
  const an = /^[AEIOU]/i.test(c.n) ? 'an' : 'a';
  return `${an} ${c.n} sign-in`;
};
/* warnings like "Stills step needs an xAI API key" for every missing/expired required connection */
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
      text: (req.id === 'worker' ? 'Every AI step' : `${names.join(' & ')} step${names.length>1?'s':''}`) + ` ${verb} ${label}`,
      why: req.why.join('; ')});
  });
  return out;
};

/* Routine key guard (TEST MODE): only fake values starting with test_ are accepted; nothing real is stored.
   Production: the routine key goes straight to Vault via the save-routine-key Edge Function. */
M.TEST_RE = /^test[_-][A-Za-z0-9_-]{1,40}$/;
M.REAL_RE = /(sk[_-]|xi[_-]|xai[_-]|gh[opsu]_|AIza|EAA[A-Za-z0-9]|ya29\.|whsec_)[A-Za-z0-9_\-]{8,}|[A-Za-z0-9_\-]{32,}/;
M.checkKey = v => { v = (v || '').trim();
  if (!v) return {ok:false, msg:'Paste the routine key from your Grok Bot routine.'};
  if (!M.TEST_RE.test(v) && M.REAL_RE.test(v)) return {ok:false, real:true, msg:'Test mode: that looks like a real key, so it was rejected and not stored. Use a fake value that starts with test_.'};
  if (!M.TEST_RE.test(v)) return {ok:false, msg:'Test mode: the routine key field only accepts fake values that start with test_ (for example test_routine_1).'};
  return {ok:true, last4: v.slice(-4)}; };
M.checkUrl = v => { try { const u = new URL((v||'').trim()); if (u.protocol !== 'https:') return {ok:false, msg:'The webhook URL must start with https://'}; if (/[?&](key|token|secret|sig)=/i.test(u.search)) return {ok:false, msg:'Remove credentials from the URL. The routine key goes in its own field.'}; return {ok:true, origin:u.origin}; } catch(e){ return {ok:false, msg:'Enter the full https:// webhook URL of your 3x3 routine.'}; } };
M.fakeSecret = () => 'test_sig_' + Array.from(crypto.getRandomValues(new Uint8Array(16)), b => b.toString(16).padStart(2,'0')).join('');
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
M.ALCOHOL_SUBS = ['liquor_history'];
M.isAlcohol = I => M.ALCOHOL_SUBS.includes(I.sub) || /liquor|alcohol|wine|beer|cocktail|whisk(e)?y|rum|gin|vodka/i.test(I.ownTopic || '');
M.ALCOHOL_YT = 'Alcohol-history videos are always uploaded as private: you set the 18+ age limit in the platform\'s app and publish them yourself. This applies on every platform (YouTube private, Facebook unpublished, TikTok private, Instagram blocked until you confirm the account\'s minimum age).';
M.AFFILIATE_LINE = '#ad · I may earn a commission from links in my bio';
M.isAffiliate = I => I.goal === 'affiliate';

window.M3 = M;
})();
