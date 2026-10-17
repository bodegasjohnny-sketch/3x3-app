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
];
M.SOCIAL_STATUS = {connected:'Connected as', relogin:'Needs sign-in again', missing:'Disconnected'};
M.PUBLISH_NOTE = 'Nothing is posted until you approve it. Alcohol-history videos are never auto-published and never made public by 3x3: you answer for each post on each platform (YouTube is uploaded private and stays private, TikTok goes to your inbox drafts, Facebook and Instagram are held until you answer). You can always keep a post private / not post it. Kids videos go to YouTube only, marked Made for Kids.';
M.TIKTOK_NOTE = 'Until TikTok\'s audit of 3x3 passes, every TikTok post is uploaded to your TikTok inbox as a draft: open the notification in the TikTok app, finish it and post it yourself (or download the video and post it). After the audit, non-alcohol videos can post directly with the privacy you pick (there is no default). Videos under 1 minute are marked \'Reach only: not eligible for Creator Rewards\'.';
M.TT_PRIVACY = [['PUBLIC_TO_EVERYONE','Everyone'],['MUTUAL_FOLLOW_FRIENDS','Friends (mutual followers)'],['FOLLOWER_OF_CREATOR','Followers'],['SELF_ONLY','Only me']];
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
M.TEST_RE = /^test_[A-Za-z0-9_]{1,40}$/;
M.REAL_RE = /(sk[_-]|xi[_-]|xai[_-]|gh[opsu]_|AIza|EAA[A-Za-z0-9]|ya29\.|whsec_)[A-Za-z0-9_\-]{8,}|[A-Za-z0-9_\-]{32,}/;
M.checkKey = v => { v = (v || '').trim();
  if (!v) return {ok:false, msg:'Paste the routine key from your Grok Bot routine.'};
  if (!M.TEST_RE.test(v) && M.REAL_RE.test(v)) return {ok:false, real:true, msg:'Test mode: that looks like a real key, so it was rejected and not stored. Use a fake value that starts with test_.'};
  if (!M.TEST_RE.test(v)) return {ok:false, msg:'Test mode: the routine key field only accepts fake values that start with test_ (for example test_routine_1).'};
  return {ok:true, last4: v.slice(-4)}; };
M.checkUrl = v => { try { const u = new URL((v||'').trim()); if (u.protocol !== 'https:') return {ok:false, msg:'The webhook URL must start with https://'}; if (u.username || u.password || /@/.test((v||'').split('/')[2] || '')) return {ok:false, msg:'Remove the user name or password from the URL (user:pass@). The routine key goes in its own field.'}; if ((v||'').length > 300) return {ok:false, msg:'That URL is too long.'}; if (/[?&](key|token|secret|sig)=/i.test(u.search)) return {ok:false, msg:'Remove credentials from the URL. The routine key goes in its own field.'}; return {ok:true, origin:u.origin}; } catch(e){ return {ok:false, msg:'Enter the full https:// webhook URL of your 3x3 routine.'}; } };
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
/* ---------- custom-topic screening (word boundaries, so 'beginner', 'engine', 'drum', 'livestock' don't match) ---------- */
/* Terms per bundle. Single words get plural forms (s, es, y→ies) automatically; matching is whole-word on normalised text. */
M.TOPIC_TERMS = {
  crypto: ['crypto','cryptocurrency','cryptocurrencies','bitcoin','btc','ethereum','eth','ether','altcoin','memecoin','shitcoin','stablecoin','airdrop','presale','nft','defi','web3',
    'blockchain','token sale','ico','doge','dogecoin','shib','shiba inu','solana','sol','xrp','cardano','litecoin','binance','coinbase','tether','usdt','satoshi','hodl','rug pull','pump and dump','to the moon','moonshot','crypto mining'],
  finance: ['invest','investing','investment','investor','stock','forex','day trading','trading','passive income','loan','credit card','debt','mortgage','retirement','dividend','get rich','options trading'],
  health: ['supplement','weight loss','diet','cure','cured','vitamin','disease','detox','immunity','immune','cancer','diabetes','keto','medicine','symptom','fat burner'],
  alcohol: ['liquor','liqueur','alcohol','alcoholic','wine','winery','beer','brewery','brewing','cocktail','whisky','whiskey','bourbon','scotch','rum','gin','vodka','tequila','mezcal','brandy',
    'cognac','soju','lambanog','moonshine','absinthe','mead','cider','lager','ale','champagne','prosecco','sherry','baijiu','shochu','grappa','ouzo','raki','pisco','cachaca','schnapps',
    'hooch','booze','distillery','distilled spirits','bartender','mixology','hangover','drunk','pub crawl','happy hour'],
  true_crime: ['murder','murdered','serial killer','true crime','homicide','kidnapping','kidnapped','assassination','massacre','cold case'],
  kids: ['for kids','for children','toddler','preschool','preschooler','nursery rhyme','kindergarten'],
};
/* distinctive terms also matched on the fully collapsed text (no spaces or separators), to catch "c r y p t o", "cryp-to", "w.h.i.s.k.y" */
M.TOPIC_COLLAPSED = {crypto:['crypto','bitcoin','ethereum','dogecoin','solana','airdrop','presale','memecoin','altcoin','stablecoin','blockchain'],
  alcohol:['whisky','whiskey','whiskies','liquor','alcohol','vodka','tequila','bourbon','moonshine','cocktail','brandy','cognac','absinthe','champagne','schnapps','liqueur'],
  true_crime:['serialkiller','truecrime','murder'], health:[], finance:[], kids:[]};
M.TOPIC_PATTERNS = {crypto:[/(^|[^a-z0-9])\d{2,}x(?![a-z0-9]{2})/]};
const CONF = {'а':'a','е':'e','о':'o','р':'p','с':'c','у':'y','х':'x','к':'k','м':'m','т':'t','в':'b','н':'h','і':'i','ї':'i','ј':'j','ѕ':'s','ԁ':'d','ɡ':'g','ӏ':'l','ո':'n','ս':'u',
  'α':'a','ο':'o','ρ':'p','ν':'v','τ':'t','ι':'i','κ':'k','ε':'e','υ':'u','χ':'x','β':'b','η':'n','ⅰ':'i','ı':'i','ℓ':'l'};
const LEET = {'0':'o','1':'i','3':'e','4':'a','5':'s','7':'t','@':'a','$':'s','!':'i','|':'l'};
M.fold = t => String(t || '').normalize('NFKC').toLowerCase().replace(/./gu, ch => CONF[ch] || ch).normalize('NFD').replace(/\p{M}+/gu, '')
  .replace(/(?<=[\p{L}\p{N}])[-._·•'’*]+(?=[\p{L}\p{N}])/gu, '')            // cryp-to, w.h.i.s.k.y
  .replace(/(?:(?<![\p{L}\p{N}])[\p{L}\p{N}$@](?:\s+|[-._·•]+)){2,}[\p{L}\p{N}$@](?![\p{L}\p{N}])/gu, m => m.replace(/[\s\-._·•]+/gu, ''));  // c r y p t o, 1 0 0 x
M.leet = t => t.replace(/[\p{L}\p{N}$@!|]+/gu, w => /\p{L}/u.test(w) && !/^\d+x$/.test(w) ? w.replace(/[013457@$!|]/g, c => LEET[c]) : w);
M.topicVariants = t => { const a = M.fold(t), b = M.leet(a), b2 = b.replace(/i/g, 'l'); return {words:[a, b, b2], collapsed:[a, b, b2].map(x => x.replace(/[^\p{L}\p{N}]+/gu, '').replace(/cryptograph\w*/g, ''))}; };
const esc_ = w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const plural = w => { const e = esc_(w).replace(/\s+/g, '\\s+'); if (/\s/.test(w)) return e + '(?:s|es)?'; if (/y$/.test(w)) return e.slice(0, -1) + '(?:y|ys|ies)'; return e + '(?:s|es)?'; };
M.termRe = terms => new RegExp('(?:^|[^\\p{L}\\p{N}])(?:' + terms.map(plural).join('|') + ')(?![\\p{L}\\p{N}])', 'iu');
M.TOPIC_RE = Object.fromEntries(Object.entries(M.TOPIC_TERMS).map(([k, v]) => [k, M.termRe(v)]));
M.IMPLIES = {crypto:['finance','crypto']};
M.topicText = I => (I && I.topic === -1 ? (I.ownTopic || '') : '');
M.topicBundles = text => { const out = [], V = M.topicVariants(text);
  Object.keys(M.TOPIC_TERMS).forEach(b => { const hit = V.words.some(w => M.TOPIC_RE[b].test(w) || (M.TOPIC_PATTERNS[b] || []).some(r => r.test(w)))
      || V.collapsed.some(c => (M.TOPIC_COLLAPSED[b] || []).some(t => c.includes(t)));
    if (hit) (M.IMPLIES[b] || [b]).forEach(x => out.includes(x) || out.push(x)); });
  return out; };
M.wordRe = w => M.termRe([w]);
M.bannedHits = (text, words) => { const V = M.topicVariants(text);
  return (words || []).filter(w => { if (!w) return false; const re = M.termRe([w.toLowerCase()]); const cw = M.fold(w).replace(/[^\p{L}\p{N}]+/gu, '');
    return V.words.some(x => re.test(x)) || ((cw.length >= 6 || (/\d/.test(cw) && cw.length >= 3)) && V.collapsed.some(c => c.includes(cw))); }); };
M.needsNoClaims = I => M.CLAIM_NICHES.includes(I.niche) || M.CLAIM_SUBS.includes(I.sub) || M.topicBundles(M.topicText(I)).some(b => ['crypto','finance','health'].includes(b));
M.BANNED_PRESET = {
  health_nutrition:['cure','treat','prevent','heal','detox','miracle','guaranteed'],
  human_body:['cure','treat','prevent','heal','miracle','guaranteed'],
  finance:['guaranteed returns','risk-free','get rich quick','financial advice','to the moon','double your money'],
  local_business:['guaranteed','best in town','#1 rated'],
};
M.ALCOHOL_SUBS = ['liquor_history'];
M.isAlcohol = I => M.ALCOHOL_SUBS.includes(I.sub) || M.topicBundles(M.topicText(I)).includes('alcohol');
/* Target market -> legal drinking age. Facebook age_min only takes 13/15/18/21/25, so 19 or 20 rounds up to 21. */
M.MARKETS = [['PH','Philippines',18],['US','United States',21],['CA','Canada (most provinces)',19],['KR','South Korea',19],['JP','Japan',20],['TH','Thailand',20],['GB','United Kingdom',18],['AU','Australia',18],['SG','Singapore',18],['OTHER','Other (18)',18]];
M.drinkingAge = m => ((M.MARKETS.find(x => x[0] === m) || M.MARKETS[0])[2]);
M.ageMin = m => { const a = M.drinkingAge(m); return m === 'US' || a >= 19 ? 21 : 18; };
M.ALCOHOL_YT = 'Alcohol-history videos are never auto-published and never made public by 3x3. You answer for every post on every platform: "age-restricted" or "keep private / don\'t post". YouTube: uploaded private; set 18+ in YouTube Studio; it stays private (3x3 never makes alcohol public). TikTok: uploaded to your TikTok inbox as a draft; set Audience controls 18+ before you post it in the app, or keep it as Only me / delete the draft (3x3 never direct-posts alcohol). Facebook: first check the Page\'s own age restriction, then answer; only then does the 3x3 server publish it with the age minimum (18, or 21 for the US and markets with a drinking age of 19 or 20) and the AI-generated flag. Instagram: confirm the account minimum age, then the 3x3 server publishes it. "Keep private" on Facebook or Instagram means nothing is sent. No affiliate or retailer links, and the alcohol disclaimer is always on.';
M.ALCOHOL_MODES = {yt:'uploaded private (privacyStatus=private)', tt:'uploaded to your TikTok inbox (draft)', fb:'held by 3x3: nothing sent until you answer', ig:'held by 3x3: nothing sent until you answer'};
M.ALCOHOL_AFTER = {yt:'age-restricted: 18+ set in YouTube Studio; it stays private (3x3 never makes alcohol public)', tt:'age-restricted: 18+ audience set by you in the TikTok app', fb:'published by the 3x3 server (simulated) · targeting.age_min={age} · is_ai_generated=true · Page age restriction checked by you', ig:'published by the 3x3 server (simulated) · account minimum age confirmed by you'};
M.ALCOHOL_KEPT = {yt:'kept private: stays Private, never made public', tt:'kept private: Only me or not posted (draft deleted)', fb:'kept private: nothing sent to Facebook', ig:'kept private: nothing sent to Instagram'};
M.PRIVATE_RULE = 'If 18+ isn\'t available or you can\'t confirm it was applied, answer "Keep private / don\'t post".';
(() => { const ms = ((((window.RS_DATA || {}).bundles || {}).alcohol || {}).publishing || {}).manual_steps || {};
  M.ALCOHOL_STEPS = {
    yt: 'Set 18+ in YouTube Studio (Content → the video → Details → Show more → Age restriction → "Yes, restrict my video to viewers over 18" → Save; leave "made for kids" = No). It stays private: 3x3 never makes alcohol public. ' + M.PRIVATE_RULE,
    tt: ms.tiktok || ('Open the TikTok inbox notification → finish editing → More options → Audience controls → 18+ only → Post. ' + M.PRIVATE_RULE),
    fb: ms.facebook_reels || 'Check the Page\'s age restriction first (Page settings → age restriction), then answer. Only then does the 3x3 server publish the Reel with targeting.age_min. If you can\'t set or confirm it, keep private and nothing is sent.',
    ig: (ms.instagram_reels || 'Settings → Account → Minimum age (alcohol) set to the legal drinking age, then confirm this post.') + ' If you can\'t confirm it, keep private and nothing is sent.'}; })();
/* Simulated server RPC (production: supabase.rpc('confirm_age_gate', …)): single-use, per post and per platform. outcome = 'age_restricted' | 'kept_private' */
M.confirm_age_gate = (publish_id, platform, file_hash, text_version, outcome) => {
  if (!['age_restricted','kept_private'].includes(outcome)) throw new Error('confirm_age_gate: bad outcome');
  return {rpc:'confirm_age_gate', args:[publish_id, platform, file_hash, text_version, outcome], publish_id, platform, file_hash, text_version, outcome, state:'age_gate_confirmed', final:outcome === 'kept_private', at:new Date().toISOString(), simulated:true}; };
/* stuck routine (routine_health.stuck_since) */
M.STUCK_REASONS = {keyset_expired:'its key list expired', keyset_fetch_failed:'it couldn\'t download the key list', keyset_bad_signature:'the key list signature didn\'t check out', keyset_jump_too_large:'the key list jumped too far ahead', template_outdated:'your routine template is out of date', unclaimed_dispatches:'3 or more jobs in the last 24 hours weren\'t picked up within 15 minutes'};
/* ---------- spend cap (estimates; the real ledger lives server-side / in the user's bot) ---------- */
M.CAP_MAX = 20;
M.stageCost = (k, I) => { const n = Math.round((I.dur || 45) / 2.5), ch = Math.round((I.dur || 45) * 155 / 60 * 5.8);
  return ({rules:0, script:0.02, voice: I.vo === false ? 0 : +(ch * 0.0003).toFixed(2), stills:+(n * 0.07).toFixed(2), video:+(n * 0.3).toFixed(2), final:0.05, publish:0})[k] || 0; };
M.videoCost = I => +['script','voice','stills','video','final'].reduce((a, k) => a + M.stageCost(k, I), 0).toFixed(2);
M.AFFILIATE_LINE = '#ad · I may earn a commission from links in my bio';
M.isAffiliate = I => I.goal === 'affiliate';

window.M3 = M;
})();
