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
  {id:'youtube', group:'social', n:'YouTube', btn:'Connect YouTube', kind:'oauth', icon:'yt', c:'#EA3943', plat:'yt', provider:'Google', acct:'Your YouTube channel',
   perms:'Upload videos, and read your channel name.', api:'YouTube Data API v3 (videos.insert)'},
  {id:'facebook', group:'social', n:'Facebook Page', btn:'Connect Facebook Page', kind:'oauth', icon:'fb', c:'#00C2FF', plat:'fb', provider:'Facebook', acct:'Your Facebook Page',
   perms:'Choose a Page and publish Reels to it.', api:'Meta Graph API (Page Reels publishing)'},
  {id:'instagram', group:'social', n:'Instagram', btn:'Connect Instagram', kind:'oauth', icon:'ig', c:'#FF6B9A', plat:'ig', optional:true, provider:'Instagram', acct:'@your_instagram',
   perms:'Publish Reels to your professional account.', api:'Instagram Graph API (Reels content publishing)'},
  {id:'tiktok', group:'social', n:'TikTok', btn:'Connect TikTok', kind:'oauth', icon:'tt', c:'#F5F7FA', plat:'tt', provider:'TikTok', acct:'@your_tiktok',
   perms:'Read your basic profile and post videos.', api:'TikTok Content Posting API'},
];
M.SOCIAL_STATUS = {connected:'Connected as', relogin:'Needs sign-in again', missing:'Disconnected'};
M.PUBLISH_NOTE = 'Nothing is posted until you approve it. Alcohol-history videos are never auto-published and never made public by 3x3: you answer for each post on each platform (YouTube is uploaded private and 3x3 leaves it private, TikTok goes to your inbox drafts, Facebook and Instagram are held until you answer). You can always keep a post private / not post it. Kids videos go to YouTube only, marked Made for Kids.';
M.TIKTOK_NOTE = 'Until TikTok\'s audit of 3x3 passes, every TikTok post is uploaded to your TikTok inbox as a draft: open the notification in the TikTok app, finish it and post it yourself (or download the video and post it). After the audit, non-alcohol videos can post directly with the privacy you pick (there is no default). Videos under 1 minute are marked \'Reach only: not eligible for Creator Rewards\'.';
M.TT_PRIVACY = [['PUBLIC_TO_EVERYONE','Everyone'],['MUTUAL_FOLLOW_FRIENDS','Friends (mutual followers)'],['FOLLOWER_OF_CREATOR','Followers'],['SELF_ONLY','Only me']];
M.REACH_ONLY = 'Reach only: not eligible for Creator Rewards';
M.conn = id => M.CONNS.find(c => c.id === id);

/* ---------- pipeline ---------- */
M.STAGES = [
  {k:'rules', s:'Rules',   n:'Rules',              icon:'bolt',   approval:false, needs:['worker'],            d:'Compiles the locked intake into the global rule set every step must follow.'},
  {k:'script', s:'Script',  n:'Script',             icon:'edit',   approval:true,  needs:['worker'],            d:'Drafts the script beat by beat, with a source for every fact. You can edit the lines before you approve; edits are logged. Approval 1.'},
  {k:'voice', s:'Voiceover',   n:'Voiceover',          icon:'mic',    approval:true, needs:['worker','elevenlabs'], d:'ElevenLabs narration of the approved script (vo.mp3 + timings.json), using your voice, pace and pronunciations. Voice gate: play it, redo a line or the whole take, then approve. Approval 2.'},
  {k:'stills', s:'Stills',  n:'Stills / storyboard',icon:'grid',   approval:true,  needs:['worker','imagine'],  d:'One Grok Imagine still per shot in your style. Storyboard gate: swap any single still, then approve. Approval 3.'},
  {k:'video', s:'Video',   n:'Video from stills',  icon:'film',   approval:false, needs:['worker','imagine'],  d:'Each approved still becomes a short clip with one camera move. No separate gate: you preview the clips inside the Master gate (MASTER_PACK §3.6).'},
  {k:'final', s:'Final',   n:'Final stitch (Master gate)',       icon:'cc',     approval:true,  needs:['worker'],            d:'Clips, voice, captions, music and SFX mixed to a −14 LUFS target, with the locked disclaimer, AI labels and affiliate line burned in. Master gate: preview the clips and the render, then approve. Approval 4.'},
  {k:'publish', s:'Publish', n:'Download / publish', icon:'up',     approval:false, needs:[],                    d:'Download the MP4, or approve publishing. 3x3\'s server posts it through the official platform APIs. Your bot never touches your social accounts.'},
];
M.stage = k => M.STAGES.find(s => s.k === k);
/* beat skeleton per format: shared by the intake (step 3 numbers) and the simulated script */
M.BEATS = {list:['Hook','#5','#4','#3','#2','#1','CTA'], story:['Hook','Setup','Turn','Rise','Twist','Payoff','CTA'], reveal:['Tease','Question','Clue 1','Clue 2','Build','Reveal','CTA']};
M.BEAT_LABEL = {list:'Hook + 5 items + CTA', story:'Hook, 5 story beats, CTA', reveal:'Tease, 5 build beats, CTA'};
/* Publish note: only the parts that apply to this project (alcohol / kids) */
M.publishNote = (p, kids) => { const I = (p && p.intake) || {}, t = ['Nothing is posted until you approve it, and you can always keep a post private or not post it.'];
  if (M.isAlcohol(I)) t.push('Alcohol-history videos are never auto-published and never made public by 3x3: you answer for each post on each platform (YouTube is uploaded private and 3x3 leaves it private, TikTok goes to your inbox drafts, Facebook and Instagram are held until you answer).');
  if (kids) t.push('Kids videos go to YouTube only, marked Made for Kids.');
  return t.join(' '); };
/* Banned-word lint for script text. The locked disclaimer is exempt, so a banned 'financial advice' never trips on the forced 'Not financial advice.'
   Only a WHOLE STANDALONE disclaimer sentence is exempt: it must start the line or follow a sentence end (. ! ?), and end the line or be
   followed by a sentence end. 'Crypto is high risk-free' or 'Not financial advice, just buy' are NOT stripped, so the rest is still checked. */
M.discSentences = d => { d = String(d || '').trim(); if (!d) return [];
  return [...new Set([d.replace(/[.!?]+$/, '')].concat(d.split(/(?<=[.!?])\s+/).map(x => x.trim().replace(/[.!?]+$/, '')).filter(x => x.length >= 8)))]; };
M.stripDisclaimer = (text, disclaimer) => { let t = String(text || '');
  M.discSentences(disclaimer).sort((a, b) => b.length - a.length).forEach(x => {
    const re = new RegExp('((?:^|[.!?]["\u201D\u2019)\\]]*\\s+)\\s*["\u201C\u2018(\\[]*)' + x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+') + '[.!?]*(?=["\u201D\u2019)\\]]*(?:\\s|$))', 'gim');
    for (let i = 0; i < 4; i++) { const o = t; t = t.replace(re, '$1 . '); if (t === o) break; } });
  return t; };
/* A second pass removes disclaimer sentences anywhere (as before) and can only ADD hits for words the disclaimer itself doesn't contain,
   so splices like 'guaranteed reNot financial adviceturns' are still caught. */
M.lintBanned = (text, banned, disclaimer) => { const B = banned || [], hits = M.bannedHits(M.stripDisclaimer(text, disclaimer), B);
  let t = String(text || ''); M.discSentences(disclaimer).forEach(x => { t = t.replace(new RegExp(x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), ' '); });
  const inDisc = new Set(M.bannedHits(String(disclaimer || ''), B));
  return B.filter(w => hits.includes(w) || (!inDisc.has(w) && M.bannedHits(t, [w]).length)); };
/* ---------- script placeholder gate ----------
   Simulated drafts use these template patterns (one per Regenerate draft, cycling). A hook or item line (not the CTA) is a placeholder when:
   (1) it has fewer than M.MIN_LINE_WORDS real words (punctuation, emoji, single letters, numbers, stop-words, keyboard mash like 'asdf'
       don't count), or it is lorem-ipsum filler; or
   (2) it still matches ANY template variant (any draft, any beat): more than half of the template's word PAIRS (bigrams, with the topic
       slot as one token) survive, OR at least 2/3 of the template's words are present while the line adds at most 2 words of its own
       (catches reordering and filler between words).
   Text is normalised first: HTML entities, NFKC, zero-width/format/bidi chars stripped, the full Unicode confusables table
   (js/confusables.js, from confusables.txt) plus Greek/Cyrillic maps, digit/leet swaps (0->o 1->i 3->e 4->a 5->s 7->t @ $ ! |),
   1/I/l treated alike, accents and punctuation dropped, lower-cased. Stop-words are ignored; the user's topic written in full counts as
   the topic slot, so a topic that contains a template's words never disables that template. Decided from the saved text on every render,
   save and Approve, never from a flag. The production server must re-run this same check before accepting Approval 1. */
M.SCRIPT_HOOKS = [(T, t) => `"${T}": the version most people never hear.`, (T, t) => `Stop scrolling: ${t}, in under a minute.`, (T, t) => `Most people get this wrong: ${t}.`, (T, t) => `${T}? Here's what actually holds up.`, (T, t) => `You've been told the opposite. ${T}, explained.`];
M.SCRIPT_ITEMS = [(b, t) => `${b}: one verifiable point about ${t}, with a plain-words example.`, (b, t) => `${b}: a specific, sourced fact on ${t} (one idea, one number at most).`, (b, t) => `${b}: a quick, checkable tip about ${t}, source shown on screen.`, (b, t) => `${b}: the common myth about ${t}, and what the source actually says.`, (b, t) => `${b}: one practical step for ${t} you can try today.`];
M.scriptTemplates = (topic, labels) => { const T = topic || 'Your topic', t = T.toLowerCase(), L = labels || [];
  return M.SCRIPT_HOOKS.map(f => f(T, t)).concat(...M.SCRIPT_ITEMS.map(f => L.map(b => f(b, t)))); };
M.normLine = x => M.leet(M.fold(M.decodeEntities(String(x || '')).replace(/[\p{Cf}\u00AD\u034F\u115F\u1160\u3164]/gu, ''))).replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
const STOPW = new Set('a an the and or of to in on at for with by is are be it its this that you your yours we our i my me as so do does not no'.split(' '));
M.lineTokens = x => M.normLine(x).split(' ').filter(w => w && !STOPW.has(w));
M.PLACEHOLDER_SHARE = 0.5;      // more than this share of a template's word pairs = still the template
M.PLACEHOLDER_WORDS = 2 / 3;    // ... or this share of its words with at most PLACEHOLDER_NOVEL words of your own
M.PLACEHOLDER_NOVEL = 2;
M.MIN_LINE_WORDS = 3;
const LOREM = new Set('lorem ipsum dolor amet consectetur consectetuer adipiscing adipisicing elit eiusmod tempor incididunt labore dolore aliqua veniam nostrud exercitation ullamco laboris aliquip commodo consequat duis aute irure reprehenderit voluptate cillum fugiat nulla pariatur excepteur occaecat cupidatat proident deserunt mollit laborum'.split(' '));
const KEYROWS = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm', 'poiuytrewq', 'lkjhgfdsa', 'mnbvcxz'];
const isMash = w => w.length >= 3 && KEYROWS.some(r => r.includes(w));
const GAP = '\u0000', TMARK = 'qqtopicqq', LMARK = 'qqlabelqq', ilk = w => w.replace(/l/g, 'i');
/* words that count as real: letters, 2+ chars, not a stop-word, not lorem/keyboard mash, Latin words need a vowel */
M.realWords = line => [...new Set(M.normLine(line).split(' ').filter(w => w && /\p{L}/u.test(w) && [...w].length >= 2 && !STOPW.has(w) && !LOREM.has(w) && !isMash(w) && (!/^[a-z]+$/.test(w) || /[aeiouy]/.test(w))))];
M.isLorem = line => { const w = M.normLine(line).split(' '); return w.some(x => x === 'lorem' || x === 'ipsum') || w.filter(x => LOREM.has(x)).length >= 2; };
/* content stream: stop-words and bare numbers dropped, keys with l->i; the topic (written in full) and the template topic/label slots become GAP */
const stream = (text, topicKeys, labelKeys) => { let a = M.lineTokens(text).filter(w => !/^\p{N}+$/u.test(w)).map(w => (w === TMARK || w === LMARK) ? GAP : ilk(w));
  if (labelKeys && labelKeys.size) { let i = 0; while (i < a.length && i < 3 && labelKeys.has(a[i])) a[i++] = GAP; }
  const n = topicKeys.length; if (n) for (let i = 0; i + n <= a.length; i++) if (topicKeys.every((k, j) => a[i + j] === k)) { a.splice(i, n, GAP); }
  return a.filter((w, i) => !(w === GAP && a[i - 1] === GAP)); };
const bigrams = a => { const s = new Set(); for (let i = 0; i + 1 < a.length; i++) if (!(a[i] === GAP && a[i + 1] === GAP)) s.add(a[i] + ' ' + a[i + 1]); return s; };
const skel = str => stream(String(str).replace(LMARK, ''), [], null);   // the item's label slot is dropped; the topic slot stays as one token
M.TEMPLATE_SKELETONS = () => M.SCRIPT_HOOKS.map(f => f(TMARK, TMARK)).concat(M.SCRIPT_ITEMS.map(f => f(LMARK, TMARK)));
const cmp = (line, skStr, topic, labels) => {
  const tk = M.lineTokens(topic).filter(w => !/^\p{N}+$/u.test(w)).map(ilk), lk = new Set((labels || []).flatMap(b => M.lineTokens(b)).filter(w => !/^\p{N}+$/u.test(w)).map(ilk));
  const L = stream(line, tk, lk), S = skel(skStr), sw = new Set(S.filter(w => w !== GAP)), lw = new Set(L.filter(w => w !== GAP)), tset = new Set(tk);
  const SB = bigrams(S), LB = bigrams(L), bi = SB.size ? [...SB].filter(x => LB.has(x)).length / SB.size : 0;
  const ws = sw.size ? [...sw].filter(w => lw.has(w)).length / sw.size : 0, novel = [...lw].filter(w => !sw.has(w) && !tset.has(w) && !lk.has(w)).length;
  return {bigram:bi, words:ws, novel, hit:bi > M.PLACEHOLDER_SHARE || (ws >= M.PLACEHOLDER_WORDS - 1e-9 && novel <= M.PLACEHOLDER_NOVEL)}; };
/* full verdict for one line: {placeholder, why: 'too-short' | 'lorem' | 'template' | '', share} */
M.placeholderCheck = (line, topic, labels, templates) => {
  if (M.isLorem(line)) return {placeholder:true, why:'lorem', share:1};
  if (M.realWords(line).length < M.MIN_LINE_WORDS) return {placeholder:true, why:'too-short', share:1};
  const T = topic || 'Your topic', sks = templates ? templates.map(x => String(x).split(T).join(TMARK).split(T.toLowerCase()).join(TMARK)) : M.TEMPLATE_SKELETONS();
  let best = 0, hit = false; sks.forEach(sk => { const r = cmp(line, sk, T, labels); if (r.hit) hit = true; best = Math.max(best, r.hit ? 1 : r.bigram); });
  return {placeholder:hit, why:hit ? 'template' : '', share:best}; };
/* 0..1 score against the given (rendered) templates or the built-in ones; > PLACEHOLDER_SHARE means placeholder (1 when the word rule trips) */
M.templateShare = (line, templates, topic) => { const T = topic || 'Your topic'; let best = 0;
  (templates && templates.length ? templates.map(x => String(x).split(T).join(TMARK).split(T.toLowerCase()).join(TMARK)) : M.TEMPLATE_SKELETONS()).forEach(sk => { const r = cmp(line, sk, T, []); best = Math.max(best, r.hit ? 1 : r.bigram); });
  return best; };
M.PLACEHOLDER_WHY = {lorem:'lorem ipsum filler', 'too-short':'needs ' + M.MIN_LINE_WORDS + '+ real words', template:'template text'};
/* hook + item lines (not the CTA, which is your own text) that are still placeholders */
M.scriptPlaceholders = o => { const B = (o && o.beats) || [], labels = B.map(b => b.b);
  return B.filter((b, i) => i < B.length - 1).filter(b => M.placeholderCheck(b.line, o.topic, labels).placeholder); };
M.placeholderWhy = (o, b) => M.placeholderCheck(b.line, o && o.topic, ((o && o.beats) || []).map(x => x.b)).why;
/* connected channel/Page vs the project's brand: exact match after normalising (NFKC, format chars stripped, case, '(Page)', '@',
   punctuation, spaces). Lookalike letters are NOT folded here, so "Money Minute PН" with a Cyrillic Н is a mismatch. Anything else
   warns. Production compares the channel/Page ID saved with the brand instead of names. */
const BIDI_RE = /[\u061C\u200E\u200F\u202A-\u202E\u2066-\u2069]/u;
/* combining marks (Mo\u0335ney) and bidi/RTL override characters are KEPT in the key, so they never match a plain brand */
M.brandKey = v => String(v || '').normalize('NFKC').replace(/[\p{Cf}\u00AD]/gu, c => BIDI_RE.test(c) ? c : '').toLowerCase().replace(/\(page\)/g, '').replace(/^\s*@/, '').replace(/[^\p{L}\p{N}\p{M}\u061C\u200E\u200F\u202A-\u202E\u2066-\u2069]+/gu, '');
/* what the mismatch card shows: bidi controls removed (so 'PH' can't display as 'HP') plus a note of what was hidden */
M.brandFlags = v => { const s = String(v || '').normalize('NFKC'), f = []; if (BIDI_RE.test(s)) f.push('hidden text-direction (bidi/RTL override) characters'); if (/\p{M}/u.test(s.replace(BIDI_RE, ''))) f.push('combining marks over letters'); return f; };
M.brandShow = v => String(v || '').replace(new RegExp(BIDI_RE.source, 'gu'), '');
M.brandMatches = (account, brand, handle) => { const a = M.brandKey(account); if (!a) return false; return [brand, handle].map(M.brandKey).filter(Boolean).some(b => a === b); };
/* Voice gate length window: spec format tolerance ±3 s around the target, checked on VO length */
M.VO_TOL = 3;
M.voWindow = dur => [Math.max(1, (+dur || 45) - M.VO_TOL), (+dur || 45) + M.VO_TOL];
M.voInWindow = (sec, dur) => { const [lo, hi] = M.voWindow(dur); return sec >= lo && sec <= hi; };
M.scriptBanned = (beats, rules) => { const sf = (rules && rules.safety) || {}; return M.lintBanned((beats || []).map(b => b.line).join('\n'), sf.banned_words, sf.disclaimer && sf.disclaimer.text); };
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
    const names = req.stages.map(s => M.stage(s).s);   // short names: 'Publish' (not 'Download') needs the sign-ins
    const pl = req.id !== 'worker' && names.length > 1;   // "Stills & Video steps need", "Every AI step needs"
    const verb = st.status === 'relogin' ? (pl ? 'need' : 'needs') + ' a re-login for' : st.status === 'pending' ? (pl ? 'are' : 'is') + ' waiting on you for' : (pl ? 'need' : 'needs');
    const label = st.status === 'relogin' || st.status === 'pending' ? c.n : M.connLabelMissing(req.id, st);
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
    'blockchain','token sale','ico','dogecoin','shib','shiba inu','solana','sol','xrp','cardano','litecoin','binance','coinbase','tether','usdt','satoshi','hodl','rug pull','pump and dump','to the moon','moonshot','crypto mining'],
  finance: ['invest','investing','investment','investor','stock','forex','day trading','trading','passive income','loan','credit card','debt','mortgage','retirement','dividend','get rich','options trading'],
  health: ['supplement','weight loss','diet','cure','cured','vitamin','disease','detox','immunity','immune','cancer','diabetes','keto','medicine','symptom','fat burner'],
  alcohol: ['liquor','liqueur','alcohol','alcoholic','wine','winery','beer','brewery','brewing','cocktail','whisky','whiskey','bourbon','scotch','rum','gin','vodka','tequila','mezcal','brandy',
    'cognac','soju','lambanog','moonshine','absinthe','mead','cider','lager','ale','champagne','prosecco','sherry','baijiu','shochu','grappa','ouzo','raki','pisco','cachaca','schnapps',
    'hooch','booze','distillery','distilled spirits','spirits','hard seltzer','bartender','mixology','hangover','drunk','pub crawl','happy hour'],
  true_crime: ['murder','murdered','serial killer','true crime','homicide','kidnapping','kidnapped','assassination','massacre','cold case'],
  kids: ['for kids','for children','toddler','preschool','preschooler','nursery rhyme','kindergarten'],
};
/* distinctive terms also matched on the fully collapsed text (no spaces or separators), to catch "c r y p t o", "cryp-to", "w.h.i.s.k.y" */
M.TOPIC_COLLAPSED = {crypto:['crypto','bitcoin','ethereum','dogecoin','solana','airdrop','presale','memecoin','altcoin','stablecoin','blockchain'],
  alcohol:['whisky','whiskey','whiskies','liquor','alcohol','vodka','tequila','bourbon','moonshine','cocktail','brandy','cognac','absinthe','champagne','schnapps','liqueur','hardseltzer'],
  true_crime:['serialkiller','truecrime','murder'], health:[], finance:[], kids:[]};
M.TOPIC_PATTERNS = {};
/* Bare 'doge' and Nx multipliers (10x, 100X, 1000x, 1 0 0 x, 1OOx) flag as crypto UNLESS a clear non-crypto context is present
   (Doge's Palace / Venice; zoom, lens, camera, microscope…). A strong crypto word (coin, token, to the moon…) flags even then. */
M.DOGE_RE = /(?:^|[^\p{L}\p{N}])doges?(?![\p{L}\p{N}])/u;
M.NX_RE = /(?:^|[^\p{L}\p{N}])[1-9][0-9o]+x(?![\p{L}\p{N}]{2})/u;
const DOGE_NOT = ['palace','palazzo','venice','venetian','venezia','genoa','genoese','republic','ducal','basilica','dandolo','doge of venice','doges of venice'];
const NX_NOT = ['zoom','lens','magnification','magnify','magnifying','microscope','camera','optical','telephoto','objective','eyepiece','binocular','telescope','loupe','macro','slow motion','slowmo','playback','speed','scope','sensor'];
const CRYPTO_STRONG = ['coin','token','wallet','hodl','pump','to the moon','airdrop','presale','shib','memecoin','altcoin','leverage'];
/* phrases removed before matching: common non-alcohol 'spirits', place names, myths, hobby 'trading' */
M.TOPIC_EXCLUDE = [/(?<![\p{L}\p{N}])(?:high|low|good|evil|ancestral|nature|forest|water|guardian|animal|ghostly|restless|kindred|free|holy|team|school|lifted|raised|ancient|wandering|household|malevolent|benevolent|dark|lost)\s+spirits(?![\p{L}\p{N}])/gu,
  /(?<![\p{L}\p{N}])(?:lake\s+mead|mead\s+lake)(?![\p{L}\p{N}])/gu, /(?<![\p{L}\p{N}])cider\s+press(?:es|ing)?(?![\p{L}\p{N}])/gu,
  /(?<![\p{L}\p{N}])trading\s+(?:cards?|posts?|routes?|ships?|compan(?:y|ies))(?![\p{L}\p{N}])/gu, /(?<![\p{L}\p{N}])(?:kidnapping|abduction)\s+of\s+persephone(?![\p{L}\p{N}])/gu];
/* Greek and Cyrillic capitals that look like Latin capitals; mapped before lower-casing (Ν must read as n, not v) */
const CAPCONF = {'Α':'a','Β':'b','Ε':'e','Ζ':'z','Η':'h','Ι':'i','Κ':'k','Μ':'m','Ν':'n','Ο':'o','Ρ':'p','Τ':'t','Υ':'y','Χ':'x','Ϲ':'c','І':'i','Ј':'j','Ѕ':'s','Ԁ':'d'};
const CONF = {'а':'a','е':'e','о':'o','р':'p','с':'c','у':'y','х':'x','к':'k','м':'m','т':'t','в':'b','н':'h','і':'i','ї':'i','ј':'j','ѕ':'s','ԁ':'d','ɡ':'g','ӏ':'l','ո':'n','ս':'u',
  'α':'a','ο':'o','ρ':'p','ν':'v','τ':'t','ι':'i','κ':'k','ε':'e','υ':'u','χ':'x','β':'b','η':'n','ⅰ':'i','ı':'i','ℓ':'l'};
const LEET = {'0':'o','1':'i','3':'e','4':'a','5':'s','7':'t','@':'a','$':'s','!':'i','|':'l'};
/* full Unicode confusables table (js/confusables.js, generated from confusables.txt by tools/build_confusables.py), after the maps above */
const CONFX = (typeof window !== 'undefined' && window.CONFUSABLES_ASCII) || {};
M.CONFX_SIZE = Object.keys(CONFX).length;
M.fold = t => String(t || '').normalize('NFKC').replace(/[\u0370-\u03FF\u0400-\u052F]/gu, ch => CAPCONF[ch] || ch).toLowerCase().replace(/./gu, ch => CONF[ch] || ch).replace(/[^\x00-\x7F]/gu, ch => CONFX[ch] || ch).normalize('NFD').replace(/\p{M}+/gu, '')
  .replace(/(?<=[\p{L}\p{N}])[-._·•'’*]+(?=[\p{L}\p{N}])/gu, '')            // cryp-to, w.h.i.s.k.y
  .replace(/(?:(?<![\p{L}\p{N}])[\p{L}\p{N}$@](?:\s+|[-._·•]+)){2,}[\p{L}\p{N}$@](?![\p{L}\p{N}])/gu, m => m.replace(/[\s\-._·•]+/gu, ''));  // c r y p t o, 1 0 0 x
M.leet = t => t.replace(/[\p{L}\p{N}$@!|]+/gu, w => /\p{L}/u.test(w) && !/^\d+x$/.test(w) ? w.replace(/[013457@$!|]/g, c => LEET[c]) : w);
/* decode HTML entities typed as text (&#99; &#x63; &amp; &eacute; …), up to 3 layers deep, before any matching */
const NAMED = {amp:'&', lt:'<', gt:'>', quot:'"', apos:"'", nbsp:' ', shy:'', zwj:'', zwnj:'', hyphen:'-', dash:'-', period:'.', comma:',', colon:':', sol:'/', num:'#'};
let entEl = null;
const named = (m, n) => { if (Object.prototype.hasOwnProperty.call(NAMED, n.toLowerCase())) return NAMED[n.toLowerCase()];
  try { if (typeof document !== 'undefined') { entEl = entEl || document.createElement('textarea'); entEl.innerHTML = '&' + n + ';'; if (entEl.value !== m) return entEl.value; } } catch (e) {}
  return m; };
const cp = (n, m) => (n > 0 && n <= 0x10FFFF ? String.fromCodePoint(n) : m);
M.decodeEntities = t => { let s = String(t || '');
  for (let i = 0; i < 3; i++) { const o = s;
    s = s.replace(/(?:%[0-9a-f]{2})+/gi, m => { try { return decodeURIComponent(m); } catch (e) { return m; } })   // %63rypto
      .replace(/&#x([0-9a-f]{1,6});?/gi, (m, h) => cp(parseInt(h, 16), m)).replace(/&#(\d{1,7});?/g, (m, d) => cp(parseInt(d, 10), m)).replace(/&([a-z][a-z0-9]{1,31});/gi, named);
    if (s === o) break; }
  return s; };
/* 1, I, l and | look alike: the 'il' variant maps every l to i (after leet maps 1 to i) and is matched against terms mapped the same way, so 11quor / I1quor / Iiquor read as liquor */
const IL = x => x.replace(/l/g, 'i');
const excl = x => M.TOPIC_EXCLUDE.reduce((s, r) => s.replace(r, ' '), x);
M.topicVariants = t => { const d = M.decodeEntities(t), a = excl(M.fold(d)), b = excl(M.leet(a));   // i/l lookalikes are handled by the il variant below (4+ letter terms only, so 'Soi' never reads as 'sol')
  const words = [a, b], col = x => x.replace(/[^\p{L}\p{N}]+/gu, '').replace(/cryptograph\w*/g, '');
  return {words, collapsed:words.map(col), il:[IL(b)], ilCollapsed:col(IL(b))}; };
/* banned words only: also split at hyphens, so a banned 'cure' matches 'cure-all' (topic screening doesn't split: Sol-gel, wine-dark, Ale-xander stay clean) */
M.bannedVariants = t => { const V = M.topicVariants(t), d = M.decodeEntities(t), h = M.fold(d.replace(/[-\u2010-\u2015]+/g, ' ')), hl = M.leet(h);
  return Object.assign({}, V, {words:V.words.concat([h, hl]), il:V.il.concat([IL(hl)])}); };
const esc_ = w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const plural = w => { const e = esc_(w).replace(/\s+/g, '\\s+'); if (/\s/.test(w)) return e + '(?:s|es)?'; if (/y$/.test(w)) return e.slice(0, -1) + '(?:y|ys|ies)'; return e + '(?:s|es)?'; };
M.termRe = terms => new RegExp('(?:^|[^\\p{L}\\p{N}])(?:' + terms.map(plural).join('|') + ')(?![\\p{L}\\p{N}])', 'iu');
M.TOPIC_RE = Object.fromEntries(Object.entries(M.TOPIC_TERMS).map(([k, v]) => [k, M.termRe(v)]));
/* the 1/I/l variant only for terms of 4+ letters that contain an l (so 'sol' never matches 'Soi', 'ale' never matches 'aie') */
M.TOPIC_RE_IL = Object.fromEntries(Object.entries(M.TOPIC_TERMS).map(([k, v]) => { const t = v.filter(w => w.length >= 4 && w.includes('l')).map(IL); return [k, t.length ? M.termRe(t) : /(?!)/]; }));
const DOGE_NOT_RE = M.termRe(DOGE_NOT), NX_NOT_RE = M.termRe(NX_NOT), STRONG_RE = M.termRe(CRYPTO_STRONG);
M.IMPLIES = {crypto:['finance','crypto']};
M.topicText = I => (I && I.topic === -1 ? (I.ownTopic || '') : '');
M.topicBundles = text => { const out = [], V = M.topicVariants(text);
  const any = r => V.words.some(w => r.test(w)), strong = any(STRONG_RE);
  const ambiguous = (any(M.DOGE_RE) && (!any(DOGE_NOT_RE) || strong)) || (any(M.NX_RE) && (!any(NX_NOT_RE) || strong));
  Object.keys(M.TOPIC_TERMS).forEach(b => { const hit = V.words.some(w => M.TOPIC_RE[b].test(w) || (M.TOPIC_PATTERNS[b] || []).some(r => r.test(w)))
      || V.il.some(w => M.TOPIC_RE_IL[b].test(w))
      || V.collapsed.some(c => (M.TOPIC_COLLAPSED[b] || []).some(t => c.includes(t)))
      || (M.TOPIC_COLLAPSED[b] || []).some(t => t.length >= 4 && t.includes('l') && V.ilCollapsed.includes(IL(t)))
      || (b === 'crypto' && ambiguous);
    if (hit) (M.IMPLIES[b] || [b]).forEach(x => out.includes(x) || out.push(x)); });
  return out; };
M.wordRe = w => M.termRe([w]);
M.bannedHits = (text, words) => { const V = M.bannedVariants(text);
  return (words || []).filter(w => { if (!w) return false; const re = M.termRe([w.toLowerCase()]); const cw = M.fold(w).replace(/[^\p{L}\p{N}]+/gu, '');
    const lw = w.toLowerCase(), reIl = lw.length >= 4 && lw.includes('l') ? M.termRe([IL(lw)]) : null;
    return V.words.some(x => re.test(x)) || (reIl && V.il.some(x => reIl.test(x))) || ((cw.length >= 6 || (/\d/.test(cw) && cw.length >= 3)) && V.collapsed.some(c => c.includes(cw))); }); };
M.needsNoClaims = I => M.CLAIM_NICHES.includes(I.niche) || M.CLAIM_SUBS.includes(I.sub) || M.topicBundles(M.topicText(I)).some(b => ['crypto','finance','health'].includes(b));
M.BANNED_PRESET = {
  health_nutrition:['cure','treat','prevent','heal','detox','miracle','guaranteed'],
  human_body:['cure','treat','prevent','heal','miracle','guaranteed'],
  finance:['guaranteed returns','risk-free','get rich quick','to the moon','double your money'],   // 'financial advice' removed: not in the spec's finance list (it is a compliance area, and the forced NFA disclaimer contains it)
  local_business:['guaranteed','best in town','#1 rated'],
};
M.ALCOHOL_SUBS = ['liquor_history'];
M.isAlcohol = I => M.ALCOHOL_SUBS.includes(I.sub) || M.topicBundles(M.topicText(I)).includes('alcohol');
/* Target market -> legal drinking age. Facebook age_min only takes 13/15/18/21/25, so 19 or 20 rounds up to 21. */
M.MARKETS = [['PH','Philippines',18],['US','United States',21],['CA','Canada (most provinces)',19],['KR','South Korea',19],['JP','Japan',20],['TH','Thailand',20],['GB','United Kingdom',18],['AU','Australia',18],['SG','Singapore',18],['OTHER','Other (18)',18]];
M.drinkingAge = m => ((M.MARKETS.find(x => x[0] === m) || M.MARKETS[0])[2]);
M.ageMin = m => { const a = M.drinkingAge(m); return m === 'US' || a >= 19 ? 21 : 18; };
M.ALCOHOL_YT = 'Alcohol-history videos are never auto-published and never made public by 3x3. You answer for every post on every platform: "age-restricted" or "keep private / don\'t post". YouTube: uploaded private; set 18+ in YouTube Studio; 3x3 leaves it private; visibility is your decision. TikTok: uploaded to your TikTok inbox as a draft; set Audience controls 18+ first, then choose the visibility yourself and post it in the app. If 18+ isn\'t available, keep the draft unposted or delete it (3x3 never direct-posts alcohol). Facebook: first check the Page\'s own age restriction, then answer; only then does the 3x3 server publish it with the age minimum (18, or 21 for the US and markets with a drinking age of 19 or 20) and the AI-generated flag. Instagram: confirm the account minimum age, then the 3x3 server publishes it. "Keep private" on Facebook or Instagram means nothing is sent. No affiliate or retailer links, and the alcohol disclaimer is always on.';
M.ALCOHOL_MODES = {yt:'uploaded private (privacyStatus=private)', tt:'uploaded to your TikTok inbox (draft)', fb:'held by 3x3: nothing sent until you answer', ig:'held by 3x3: nothing sent until you answer'};
M.ALCOHOL_AFTER = {yt:'age-restricted: 18+ set in YouTube Studio; 3x3 leaves it private; visibility is your decision', tt:'age-restricted: 18+ audience set first by you in the TikTok app; visibility is your decision', fb:'published by the 3x3 server (simulated) · targeting.age_min={age} · is_ai_generated=true · Page age restriction checked by you', ig:'published by the 3x3 server (simulated) · account minimum age confirmed by you'};
M.ALCOHOL_KEPT = {yt:'kept private: stays Private, never made public', tt:'kept private: draft left unposted or deleted by you', fb:'kept private: nothing sent to Facebook', ig:'kept private: nothing sent to Instagram'};
M.PRIVATE_RULE = 'If 18+ isn\'t available or you can\'t confirm it was applied, answer "Keep private / don\'t post".';
(() => { const ms = ((((window.RS_DATA || {}).bundles || {}).alcohol || {}).publishing || {}).manual_steps || {};
  M.ALCOHOL_STEPS = {
    yt: 'Set 18+ in YouTube Studio (Content → the video → Details → Show more → Age restriction → "Yes, restrict my video to viewers over 18" → Save; leave "made for kids" = No). 3x3 leaves it private; visibility is your decision. ' + M.PRIVATE_RULE,
    tt: ms.tiktok || 'Open the TikTok inbox notification → finish editing → More options → Audience controls → 18+ only. Once 18+ is set, who can view the post is your choice; then post and answer "age-restricted". If 18+ isn\'t offered or you can\'t confirm it was applied, don\'t post the draft (or delete it) and answer "keep private".',
    fb: ms.facebook_reels || 'Check the Page\'s age restriction first (Page settings → age restriction), then answer. Only then does the 3x3 server publish the Reel with targeting.age_min. If you can\'t set or confirm it, keep private and nothing is sent.',
    ig: (ms.instagram_reels || 'Settings → Account → Minimum age (alcohol) set to the legal drinking age, then confirm this post.') + ' If you can\'t confirm it, keep private and nothing is sent.'}; })();
/* Simulated server RPC (production: supabase.rpc('confirm_age_gate', …)): single-use, per post and per platform. outcome = 'age_restricted' | 'kept_private' */
/* Must equal app_flags.age_gate_text_version (architecture v2.8, migration M4 seed); the server refuses a stale text_version */
M.AGE_GATE_TEXT_VERSION = 'agt_2026_10_v1';
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
