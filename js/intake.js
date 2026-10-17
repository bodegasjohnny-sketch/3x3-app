/* 3x3 · Intake (from the approved Reel Studio mockup). Taxonomy/styles from data.js (research pack); voices are example data.
   State autosaves to Store (js/adapter.js) on every change. */
const P = {
  dollar:'<path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>',
  yt:'<rect x="2" y="5" width="20" height="14" rx="4"/><path d="m10 9 5 3-5 3z"/>',
  fb:'<path d="M15 3h-2a4 4 0 0 0-4 4v3H7v4h2v7h4v-7h3l1-4h-4V7a1 1 0 0 1 1-1h2z"/>',
  tt:'<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>',
  pin:'<path d="M12 21s-7-6.5-7-12a7 7 0 0 1 14 0c0 5.5-7 12-7 12z"/><circle cx="12" cy="9" r="2.5"/>',
  pkg:'<path d="M21 8 12 3 3 8v8l9 5 9-5z"/><path d="m3 8 9 5 9-5M12 13v8"/>',
  heart:'<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8z"/>',
  leaf:'<path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.5 19 2c1 2 2 4.2 2 8 0 5.5-4.8 10-10 10Z"/><path d="M2 21c0-3 1.9-5.4 5.1-6"/>',
  paw:'<circle cx="11" cy="4" r="2"/><circle cx="18" cy="8" r="2"/><circle cx="20" cy="16" r="2"/><path d="M9 10a5 5 0 0 1 5 5v3.5a3.5 3.5 0 0 1-6.84 1.05Q6.52 17.48 4.46 16.84A3.5 3.5 0 0 1 5.5 10Z"/>',
  book:'<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V2H6.5A2.5 2.5 0 0 0 4 4.5z"/><path d="M12 6v7M9.5 8.5h5"/>',
  atom:'<circle cx="12" cy="12" r="1.5"/><ellipse cx="12" cy="12" rx="10" ry="4"/><ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(60 12 12)"/><ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(120 12 12)"/>',
  hist:'<path d="M3 22h18M6 18v-7M10 18v-7M14 18v-7M18 18v-7M12 2l9 5H3z"/>',
  chart:'<path d="M3 3v18h18"/><path d="m7 15 4-4 3 3 6-6"/>',
  cpu:'<rect x="5" y="5" width="14" height="14" rx="2"/><rect x="9" y="9" width="6" height="6"/><path d="M9 1v4M15 1v4M9 19v4M15 19v4M1 9h4M1 15h4M19 9h4M19 15h4"/>',
  check:'<path d="M20 6 9 17l-5-5"/>',
  lock:'<rect x="4" y="11" width="16" height="10" rx="2"/><path class="shk" d="M8 11V7a4 4 0 0 1 8 0v4"/>',
  info:'<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>',
  up:'<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m17 8-5-5-5 5M12 3v12"/>',
  cr:'<path d="m9 18 6-6-6-6"/>', al:'<path d="M19 12H5M12 19l-7-7 7-7"/>', ar:'<path d="M5 12h14M12 5l7 7-7 7"/>',
  x:'<path d="M18 6 6 18M6 6l12 12"/>', plus:'<path d="M12 5v14M5 12h14"/>',
  spark:'<path d="M12 3l1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2z"/>',
  edit:'<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
  shield:'<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
  list:'<path d="M10 6h11M10 12h11M10 18h11M4 6h1v4M4 10h2M6 18H4c0-1 2-2 2-3s-1-1.5-2-1"/>',
  story:'<path d="M2 12h3l3-8 4 16 3-8h7"/>', eye:'<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  ig:'<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r=".6"/>',
  mic:'<rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 10a7 7 0 0 0 14 0M12 17v5"/>',
  palette:'<circle cx="13.5" cy="6.5" r="1"/><circle cx="17.5" cy="10.5" r="1"/><circle cx="8.5" cy="7.5" r="1"/><circle cx="6.5" cy="12.5" r="1"/><path d="M12 2a10 10 0 0 0 0 20c.9 0 1.7-.8 1.7-1.7 0-.4-.2-.8-.4-1.1-.3-.3-.4-.7-.4-1.1 0-.9.8-1.7 1.7-1.7h2A5.6 5.6 0 0 0 22 11c0-5-4.5-9-10-9z"/>',
  target:'<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
  grid:'<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
  film:'<rect x="2" y="3" width="20" height="18" rx="2"/><path d="M7 3v18M17 3v18M2 8h5M2 16h5M17 8h5M17 16h5"/>',
  wand:'<path d="m15 4 5 5L9 20l-5-5zM14 2v2M20 8h2M18 4l1.5-1.5"/>',
  cc:'<rect x="2" y="5" width="20" height="14" rx="3"/><path d="M10 10.5a2 2 0 1 0 0 3M17 10.5a2 2 0 1 0 0 3"/>',
  music:'<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>',
  globe:'<circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20"/>',
  play:'<path d="M7 4v16l13-8z"/>', pause:'<rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/>',
  cart:'<circle cx="9" cy="20" r="1.5"/><circle cx="18" cy="20" r="1.5"/><path d="M2 3h3l2.7 12.4a2 2 0 0 0 2 1.6h8.6a2 2 0 0 0 2-1.6L22 7H6"/>',
  food:'<path d="M3 2v7a3 3 0 0 0 6 0V2M6 2v20M18 22V2c-3 2-4 5-4 9h4"/>',
  home:'<path d="m3 10 9-7 9 7v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/>',
  search:'<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>',
  bolt:'<path d="M13 2 3 14h9l-1 8 10-12h-9z"/>',
  warn:'<path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/>',
  link:'<path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/>',
  dl:'<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5M12 15V3"/>',
  trash:'<path d="M3 6h18M8 6V4h8v2M6 6l1 15h10l1-15"/>',
  refresh:'<path d="M21 12a9 9 0 1 1-3-6.7L21 8"/><path d="M21 3v5h-5"/>',
  kid:'<circle cx="12" cy="7" r="4"/><path d="M5 21a7 7 0 0 1 14 0"/>',
  user:'<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  plug:'<path d="M9 2v6M15 2v6M6 8h12v4a6 6 0 0 1-12 0zM12 18v4"/>',
  rocket:'<path d="M4.5 16.5c-1.5 1.3-2 5-2 5s3.7-.5 5-2c.7-.8.7-2.1-.1-2.9a2.2 2.2 0 0 0-2.9-.1z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.9A12.9 12.9 0 0 1 22 2c0 2.7-.8 7.5-6 11a22.4 22.4 0 0 1-4 2z"/>',
};
const ic = (n,c='') => `<svg class="i ${c}" viewBox="0 0 24 24">${P[n]||''}</svg>`;
const esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

/* ---------- data (example) ---------- */
const PIPE = ['Intake','Rules','Script','Voice','Stills','Video','Final','Publish'];
const STEPS = [
  {k:'goal',t:'Goal',i:'target'},{k:'niche',t:'Niche',i:'grid'},{k:'format',t:'Format & duration',i:'film'},
  {k:'style',t:'Style',i:'wand'},{k:'voice',t:'Voice',i:'mic'},{k:'brand',t:'Brand',i:'palette'},
  {k:'captions',t:'Captions & audio',i:'cc'},{k:'safety',t:'Safety & platforms',i:'shield'},{k:'review',t:'Review & lock',i:'lock'}];
let GOALS = [
  {id:'affiliate',n:'Affiliate commissions',d:'Drive clicks to product links and earn per sale.',i:'dollar',c:'#16C784'},
  {id:'youtube',n:'YouTube monetization',d:'Grow Shorts views toward YPP revenue share.',i:'yt',c:'#EA3943'},
  {id:'facebook',n:'Facebook monetization',d:'Original Reels tuned for retention and payouts.',i:'fb',c:'#00C2FF'},
  {id:'tiktok',n:'TikTok Creator Rewards',d:'Rewards need 1 min+ videos; durations adapt.',i:'tt',c:'#F5F7FA'},
  {id:'local',n:'Brand awareness / local leads',d:'Put a local business in front of nearby buyers.',i:'pin',c:'#FFB020'},
  {id:'digital',n:'Sell a digital product',d:'Funnel viewers to an ebook, course or template.',i:'pkg',c:'#8B5CF6'},
  {id:'faith',n:'Faith / community',d:'Share encouragement and grow a community.',i:'heart',c:'#FF6B9A'}];
let GOAL_TIP = {
  facebook:['Optimises for 3-second hold and 45–60s watch-through','Original visuals only (no reposted clips)','Soft CTA: follow / comment, no link-outs'],
  youtube:['Optimises for swipe-away rate and loops','Hook in first 1.5s','End-loop into first frame'],
  affiliate:['CTA points to link in bio / pinned comment','Product shown by shot 3','Disclosure caption added'],
  tiktok:['Creator Rewards needs videos over 1 minute','Durations will be forced to 60s+','Trending audio optional'],
  local:['Location + offer in first 3s','Lower-third with address','CTA: message / call'],
  digital:['Problem → solution → product reveal','CTA to landing page','Lead magnet mention'],
  faith:['Gentle pacing, warm voice','Verse reference on screen','CTA: share with someone'] };
let NICHES = [
  {id:'health',n:'Health & Food',i:'leaf',c:'#16C784',best:['facebook','youtube','affiliate'],subs:[['healthy','Healthy Foods'],['anatomy','Anatomy & Body'],['disease','Diseases']]},
  {id:'animals',n:'Animals & Pets',i:'paw',c:'#FFB020',best:['facebook','tiktok'],subs:[['dogs','Dog Breeds'],['cats','Cat Breeds']]},
  {id:'faith',n:'Faith',i:'book',c:'#FF6B9A',best:['faith','facebook'],subs:[['verses','Bible Verses'],['devos','Devotionals']]},
  {id:'science',n:'Science & Nature',i:'atom',c:'#00C2FF',best:['youtube','tiktok'],subs:[['elements','Elements & Metals'],['space','Space']]},
  {id:'history',n:'History & Culture',i:'hist',c:'#E8A657',best:['youtube','affiliate'],subs:[['liquor','Liquor History'],['empires','Ancient Empires']]},
  {id:'money',n:'Money & Business',i:'chart',c:'#16C784',best:['affiliate','digital'],subs:[]},
  {id:'tech',n:'Tech & AI',i:'cpu',c:'#8B5CF6',best:['affiliate','digital','youtube'],subs:[]}];
const FORMATS = [
  {id:'list',n:'List countdown',d:'Hook → #5 to #1 → CTA. Numbered beats.',i:'list',beats:[3,5,5,5,5,5,4],k:[0,6]},
  {id:'story',n:'7-beat story',d:'Hook, setup, turn, rise, twist, payoff, CTA.',i:'story',beats:[3,4,5,6,7,8,3],k:[0,5]},
  {id:'reveal',n:'Reveal',d:'Tease a question, build curiosity, big reveal.',i:'eye',beats:[3,4,4,5,6,8,3],k:[5]}];
const ASPECTS = [{id:'9:16',w:26,h:46,d:'Shorts · Reels · TikTok'},{id:'1:1',w:42,h:42,d:'Feed posts'},{id:'16:9',w:62,h:35,d:'YouTube long / web'}];
let STYLES = [
  {id:'photoreal',n:'Photoreal macro',bg:'radial-gradient(circle at 55% 50%,#6b4423 0 8%,transparent 9%),radial-gradient(ellipse 30% 40% at 55% 50%,#e3ee9a,#9cc244 70%,transparent 72%),radial-gradient(ellipse 36% 47% at 55% 50%,#2f5016 95%,transparent 97%),linear-gradient(150deg,#4a3420,#120c06)',
   sfx:'extreme macro photography, 100mm lens, shallow depth of field, soft window light, glistening natural texture, true-to-life colour, 8k detail, no text',
   mo:'Slow push-in 3–5% per shot with gentle parallax. One move per shot, no whip pans.',cap:'Bold sans, white with highlight-word pop, soft shadow, lower-third safe zone.'},
  {id:'cinematic',n:'Cinematic',bg:'linear-gradient(#000 0 14%,transparent 14% 86%,#000 86%),radial-gradient(circle at 70% 45%,#ffb36b,transparent 35%),linear-gradient(120deg,#0b3c4a,#164e5c 50%,#a85a2a)',
   sfx:'cinematic film still, anamorphic framing, teal-and-orange grade, volumetric light, subtle 35mm grain',mo:'Slow dolly or rack focus, 1 move per shot.',cap:'Clean sans, letterbox-safe, soft fade-in.'},
  {id:'editorial_collage',n:'Editorial collage',bg:'linear-gradient(8deg,transparent 40%,#f2c94c 40% 47%,transparent 47%),linear-gradient(-12deg,transparent 55%,rgba(30,30,30,.75) 55% 75%,transparent 75%),repeating-radial-gradient(circle at 30% 40%,#c9b99a 0 1px,transparent 1px 4px),#e8dcc4',
   sfx:'editorial collage, torn paper edges, halftone cut-outs, archival photos, highlighter marks',mo:'Stop-motion jitter at 12fps; elements slide in from edges.',cap:'Marker highlight on key word, boxed labels.'},
  {id:'papercut',n:'Papercut',bg:'radial-gradient(ellipse 80% 40% at 50% 110%,#2f6b4f 60%,transparent 61%),radial-gradient(ellipse 70% 40% at 20% 100%,#4b9a6e 60%,transparent 61%),radial-gradient(ellipse 80% 45% at 80% 95%,#7cc49a 60%,transparent 61%),linear-gradient(#ffd9a8,#f6a77a)',
   sfx:'layered paper-cut diorama, soft shadows between layers, matte cardstock texture',mo:'Layer parallax with gentle sway.',cap:'Rounded font on a paper tag.'},
  {id:'stick',n:'Stickman',bg:'#f4f4f0',svg:'<svg viewBox="0 0 100 60" style="position:absolute;inset:0;width:100%;height:100%" fill="none" stroke="#111" stroke-width="2.2" stroke-linecap="round"><circle cx="40" cy="16" r="6"/><path d="M40 22v16M40 27l-9 6M40 27l10-4M40 38l-7 12M40 38l7 12"/><path d="M58 50h24M70 50V32l8 6" stroke="#EA3943"/></svg>',
   sfx:'minimal stick-figure illustration, black line on white, simple props, expressive poses',mo:'Pose-to-pose snaps, 2–3 frames.',cap:'Hand-lettered, black on white.'},
  {id:'white',n:'Whiteboard doodle',bg:'#fbfbf8',svg:'<svg viewBox="0 0 100 60" style="position:absolute;inset:0;width:100%;height:100%" fill="none" stroke-width="2" stroke-linecap="round"><path d="M14 40c8-18 18-18 26 0s18 18 26 0" stroke="#2563eb"/><circle cx="78" cy="20" r="8" stroke="#EA3943"/><path d="M14 50h40" stroke="#111"/></svg>',
   sfx:'whiteboard marker doodle, hand-drawn line art, blue and red accents, white background',mo:'Draw-on reveal; hand-wipe transitions.',cap:'Marker font, underline key word.'},
  {id:'clay',n:'3D clay',bg:'radial-gradient(circle at 35% 55%,#ff9db0 0 16%,transparent 17%),radial-gradient(circle at 65% 45%,#8fd3ff 0 20%,transparent 21%),radial-gradient(circle at 50% 75%,#ffe08a 0 12%,transparent 13%),linear-gradient(#f3e9ff,#d9c8f5)',
   sfx:'3D claymation render, soft studio light, plasticine texture, pastel palette, miniature set',mo:'Bouncy squash-and-stretch at 12fps.',cap:'Chunky rounded type in pastel pills.'},
  {id:'anime',n:'Anime',bg:'radial-gradient(circle at 75% 35%,#fff6c8 0 9%,transparent 10%),linear-gradient(transparent 62%,#2b5d8a 62% 72%,#1b3a5a 72%),linear-gradient(#5aa9f0,#ffc4a8)',
   sfx:'anime key visual, cel shading, vibrant sky, detailed painted background, soft rim light',mo:'Slow pan across still; speed lines on beats.',cap:'Bold outlined type with impact pop.'},
  {id:'kinetic',n:'Kinetic typography',bg:'#0d0d0d',svg:'<div style="position:absolute;inset:0;display:grid;place-items:center;font:900 24px Poppins;color:#fff;letter-spacing:-1px;line-height:.9;text-align:center">EAT<br><span style="color:#16C784">THIS</span></div>',
   sfx:'typographic poster, bold sans-serif, high contrast, minimal shapes, strict grid',mo:'Words hit on the beat: scale, slide, mask reveals.',cap:'Captions are the visual: full-screen type.'}];
let STYLE_REC = {health:['photoreal','cinematic'],animals:['photoreal','clay'],faith:['cinematic','kinetic'],science:['cinematic','editorial_collage'],history:['editorial_collage','papercut'],money:['kinetic','whiteboard'],tech:['kinetic','cinematic']};
const VOICES = [
  {id:'maya',n:'Maya',r:'warm',d:'Friendly Filipino-English explainer',t:'PH · Female'},
  {id:'paolo',n:'Paolo',r:'conversational',d:'Relaxed Filipino-English narrator',t:'PH · Male'},
  {id:'nova',n:'Nova',r:'neutral',d:'Clear, neutral international English',t:'Neutral · Female'},
  {id:'adam',n:'Adam',r:'deep narrator',d:'Documentary, authoritative',t:'US · Male'},
  {id:'rachel',n:'Rachel',r:'warm',d:'Calm, friendly explainer',t:'US · Female'},
  {id:'josh',n:'Josh',r:'energetic',d:'Upbeat, punchy hooks',t:'US · Male'},
  {id:'bella',n:'Bella',r:'soft storyteller',d:'Gentle, intimate',t:'US · Female'},
  {id:'antoni',n:'Antoni',r:'conversational',d:'Relaxed, natural',t:'US · Male'}];
/* default voice follows the target market until you pick one yourself */
const VOICE_BY_MARKET = {PH:'maya', US:'rachel', CA:'rachel'};
const voiceFor = m => VOICE_BY_MARKET[m] || 'nova';
const ROLES = [['bg','Background'],['text','Text'],['hl','Highlight'],['accent','Accent'],['warn','Warning']];
const FONTS = ['Poppins','Inter','Manrope','Outfit','Plus Jakarta Sans','DM Sans'];
const CAPSTY = [{id:'pop',n:'Word pop',d:'One word at a time, scale-in',m:'<em>POTASSIUM</em>'},{id:'chunk3',n:'3-word chunks',d:'Short bursts, easy to read',m:'more <em>potassium</em> than'},{id:'line',n:'Full line',d:'Whole sentence, karaoke fill',m:'Avocados pack more <em>potassium</em> than bananas'}];
const CAPPOS = [{id:'top',n:'Top',y:8},{id:'center',n:'Center',y:24},{id:'lower',n:'Lower-third',y:38}];
const MUSIC = ['None','Upbeat acoustic','Lo-fi chill','Cinematic pulse','Bright pop','Ambient warm'];
const PLATS = [{id:'yt',n:'YouTube Shorts',i:'yt',c:'#EA3943'},{id:'fb',n:'Facebook Reels',i:'fb',c:'#00C2FF'},{id:'tt',n:'TikTok',i:'tt',c:'#F5F7FA'},{id:'ig',n:'Instagram Reels',i:'ig',c:'#FF6B9A'}];
let TOPICS = [
  {t:'Top 5 foods with more potassium than a banana',h:'"Bananas aren\'t #1. Not even close."',s:92},
  {t:'5 Filipino fruits loaded with vitamin C',h:'"#1 grows in your lola\'s backyard."',s:88},
  {t:'Top 5 breakfast swaps under 150 calories',h:'"Swap #3 tastes better than the original."',s:85},
  {t:'5 seeds you should add to your rice bowl',h:'"One spoon of #1 = 5g of fibre."',s:81},
  {t:'Top 5 high-fibre foods at the palengke',h:'"All under ₱50. #1 will surprise you."',s:79}];


/* ---------- real research data (data.js, built from /workspace/video-app-pack) ---------- */
const RD = window.RS_DATA, REAL = !!RD;
const shortN = n => n.replace(/\s*\(.*?\)/g,'').trim();
if (REAL) {
  const GM = {yt_monetization:['yt','#EA3943','Grow Shorts + long-form toward YPP revenue share.'],
    fb_monetization:['fb','#00C2FF','Original Reels tuned for qualified views and payouts.'],
    tiktok_rewards:['tt','#F5F7FA','Rewards only count videos over 1 minute.'],
    affiliate:['dollar','#16C784','Drive clicks to product links and earn per sale.'],
    ecommerce:['cart','#FFB020','Sell your own physical products from a store.'],
    digital_product:['pkg','#8B5CF6','Funnel viewers to an ebook, course or template.'],
    local_leads:['pin','#FFB020','Get calls and messages from nearby customers.'],
    brand_awareness:['eye','#00C2FF','Keep a brand top of mind with steady posting.'],
    audience_sponsorship:['target','#8B5CF6','Grow an audience for sponsors or an email list.'],
    faith_community:['heart','#FF6B9A','Share encouragement and grow a community.'],
    cause_education:['globe','#16C784','Educate the public for a cause, school or non-profit.']};
  GOALS = RD.goals.map(g=>({id:g.id,n:g.short,full:g.name,d:(GM[g.id]||[])[2]||'',i:(GM[g.id]||['target'])[0],c:(GM[g.id]||[,'#00C2FF'])[1],kpi:g.kpi,cta:g.cta,len:g.lengths}));
  GOAL_TIP = {}; GOALS.forEach(g=>GOAL_TIP[g.id]=[`KPIs: ${g.kpi.slice(0,2).join(', ')}`, `CTA: ${g.cta.split(/\.\s/)[0].replace(/\.$/,'')}`, g.len?`Recommended lengths: ${g.len.join(' / ')}s`:'Length set per platform']);
  const CM = {health_nutrition:['leaf','#16C784'],human_body:['story','#FF6B9A'],science_space:['atom','#00C2FF'],animals_pets:['paw','#FFB020'],history_culture:['hist','#E8A657'],
    faith:['book','#FF6B9A'],finance:['chart','#16C784'],business_tech:['cpu','#8B5CF6'],motivation:['bolt','#FFB020'],food_cooking:['food','#EA3943'],travel_places:['globe','#00C2FF'],
    home_diy:['home','#E8A657'],mystery:['search','#8B5CF6'],local_business:['pin','#FFB020'],kids_learning:['spark','#16C784']};
  NICHES = RD.cats.map(c=>({id:c.id,n:shortN(c.name),full:c.name,i:(CM[c.id]||['grid'])[0],c:(CM[c.id]||[,'#00C2FF'])[1],
    subs:c.subs.map(x=>[x.id,x.name,x]),best:[]}));
  GOALS.forEach(g=>{ NICHES.map(n=>[n,n.subs.filter(s=>s[2].goals.includes(g.id)).length/n.subs.length+(n.subs.find(s=>s[2].goals.includes(g.id)&&s[2].vis==='high')?0.01:0)])
    .filter(x=>x[1]>=0.5).sort((a,b)=>b[1]-a[1]).slice(0,4).forEach(x=>x[0].best.push(g.id)); });
  const BG = {
    photoreal_macro:'radial-gradient(circle at 55% 50%,#6b4423 0 8%,transparent 9%),radial-gradient(ellipse 30% 40% at 55% 50%,#e3ee9a,#9cc244 70%,transparent 72%),radial-gradient(ellipse 36% 47% at 55% 50%,#2f5016 95%,transparent 97%),linear-gradient(150deg,#4a3420,#120c06)',
    editorial_collage:'linear-gradient(8deg,transparent 40%,#f2c94c 40% 47%,transparent 47%),linear-gradient(-12deg,transparent 55%,rgba(30,30,30,.75) 55% 75%,transparent 75%),repeating-radial-gradient(circle at 30% 40%,#c9b99a 0 1px,transparent 1px 4px),#e8dcc4',
    papercut:'radial-gradient(ellipse 80% 40% at 50% 110%,#2f6b4f 60%,transparent 61%),radial-gradient(ellipse 70% 40% at 20% 100%,#4b9a6e 60%,transparent 61%),radial-gradient(ellipse 80% 45% at 80% 95%,#7cc49a 60%,transparent 61%),linear-gradient(#ffd9a8,#f6a77a)',
    stickman:'#f4f4f0', whiteboard:'#fbfbf8',
    clay_3d:'radial-gradient(circle at 35% 55%,#ff9db0 0 16%,transparent 17%),radial-gradient(circle at 65% 45%,#8fd3ff 0 20%,transparent 21%),radial-gradient(circle at 50% 75%,#ffe08a 0 12%,transparent 13%),linear-gradient(#f3e9ff,#d9c8f5)',
    sci_3d:'radial-gradient(circle at 50% 50%,rgba(0,194,255,.9) 0 6%,rgba(0,194,255,.25) 7% 22%,transparent 23%),radial-gradient(circle at 30% 30%,rgba(139,92,246,.6),transparent 30%),radial-gradient(circle at 75% 70%,rgba(234,57,67,.5),transparent 25%),#050a18',
    isometric_3d:'linear-gradient(30deg,transparent 45%,#7c6cf0 45% 55%,transparent 55%),linear-gradient(150deg,transparent 45%,#a99bff 45% 55%,transparent 55%),linear-gradient(90deg,transparent 46%,#5a4bd1 46% 54%,transparent 54%),linear-gradient(#e9e6ff,#cfc8ff)',
    archival_doc:'radial-gradient(ellipse at center,transparent 40%,rgba(0,0,0,.55)),repeating-linear-gradient(0deg,rgba(0,0,0,.05) 0 1px,transparent 1px 3px),linear-gradient(135deg,#c9b38a,#7d6646 60%,#3e3020)',
    anime:'radial-gradient(circle at 75% 35%,#fff6c8 0 9%,transparent 10%),linear-gradient(transparent 62%,#2b5d8a 62% 72%,#1b3a5a 72%),linear-gradient(#5aa9f0,#ffc4a8)',
    kinetic_type:'#0d0d0d',
    flat_infographic:'linear-gradient(90deg,transparent 18%,#16C784 18% 30%,transparent 30% 40%,#00C2FF 40% 52%,transparent 52% 62%,#FFB020 62% 74%,transparent 74%) bottom/100% 60% no-repeat,#13233b',
    classical_painting:'radial-gradient(ellipse 40% 50% at 50% 55%,#e8c27a,#a36b2c 60%,transparent 70%),radial-gradient(circle at 20% 20%,#3b2a1a,transparent 50%),linear-gradient(160deg,#2a1d12,#5b3a1d)',
    watercolor_story:'radial-gradient(circle at 30% 40%,rgba(255,170,190,.8),transparent 30%),radial-gradient(circle at 65% 55%,rgba(140,200,255,.8),transparent 32%),radial-gradient(circle at 50% 85%,rgba(170,230,170,.8),transparent 30%),#fbf6ee'};
  const OLD = Object.fromEntries(STYLES.map(x=>[x.id,x]));
  const SVG = {stickman:OLD.stick.svg, whiteboard:OLD.white.svg, kinetic_type:OLD.kinetic.svg};
  STYLES = RD.styles.map(x=>({id:x.id,n:x.name,desc:x.desc,bg:BG[x.id]||'#222',svg:SVG[x.id]||'',
    sfx:`${x.layer}, ${x.suffix}`, mo:`One camera move per clip: ${x.moves.join(', ')}.`,
    cap:[x.caps.highlight,x.caps.position].filter(Boolean).join('. ').replace(/^./,c=>c.toUpperCase())+'.'}));
}
const styleRec = () => { if(!REAL) return STYLE_REC[S.niche]||[]; const f=RD.fit[`${S.niche}/${S.sub}`]; return f?[f.default,...(f.alts||[]).slice(0,1)]:[]; };
const curSub = () => (N(S.niche).subs.find(s=>s[0]===S.sub)||[])[2];
/* Suggested topics must fit the chosen format and length: "in 30 seconds" follows the project duration, and a List countdown
   (5 items) drops seeds with a different item count ("3 desk stretches", "Chicken adobo, 4 steps") or a 3-part rule ("50/30/20"). */
const NUMW={one:1,two:2,three:3,four:4,five:5,six:6,seven:7,eight:8,nine:9,ten:10,eleven:11,twelve:12,thirteen:13,fourteen:14,fifteen:15,sixteen:16,seventeen:17,eighteen:18,nineteen:19,twenty:20,thirty:30,forty:40,fifty:50,hundred:100,dozen:12};
const NUMRE='(\\d+|'+Object.keys(NUMW).join('|')+')', numv=x=>/^\d+$/.test(x)?+x:NUMW[x.toLowerCase()];
const ITEMN='steps|elements|tips|ways|things|items|spots|habits|signs|facts|reasons|rules|foods|stretches|myths|mistakes|lessons|apps|tricks|hacks|secrets|questions|truths|moves|stages|phases|types|kinds|levels|parts|pillars|principles|laws|layers|categories|methods|exercises|words|places|ideas|examples';
/* finance bundle: a suggestion may not carry a figure without a source, so seeds with numbers (other than the length and the list count) are dropped */
function fitSeeds(seeds, format, dur, fin){ const out=[];
  (seeds||[]).forEach(t0=>{ let t=String(t0).replace(/\bin (\d+) seconds?\b/gi, `in ${dur} seconds`).replace(/\b(\d+)-second (video|explainer|guide)\b/gi, `${dur}-second $2`);
    if(format==='list'){ const lead=t.match(new RegExp('^(?:top\\s+)?'+NUMRE+'\\s+(?![-–%])','i')), tail=t.match(new RegExp('\\b'+NUMRE+'\\s+(?:[a-z]+\\s+)?('+ITEMN+')\\b','i'));
      const n=lead?numv(lead[1]):tail?numv(tail[1]):null; if(n!=null&&n!==5) return; if(new RegExp('\\b'+NUMRE+'\\s*[\\/-]\\s*'+NUMRE+'\\s*[\\/-]\\s*'+NUMRE+'\\b','i').test(t)) return; }
    if(fin){ const rest=t.replace(/\bin \d+ seconds?\b/gi,'').replace(/\b\d+-second\b/gi,'').replace(format==='list'?/^(?:top\s+)?5\s+/i:/^$/,''); if(/[\d₱$€£¥%]/.test(rest)) return; if(/\b(?:hundred|thousand|million|billion|percent|pesos?)\b/i.test(rest)) return; }
    out.push(t); });
  return out; }
const topics = () => { const sb=curSub(); if(!(REAL&&sb&&sb.seeds.length)) return TOPICS; const f=fitSeeds(sb.seeds,S.format,S.dur,bundleIds().some(b=>b==='finance'||b==='crypto')); return (f.length?f:[`${subName()}: ${S.format==='list'?'5 things to know':'explained'}`]).slice(0,5).map(t=>({t})); };

/* ---------- state (prefilled example) ---------- */
const S = {step:1,max:1,goal:REAL?'fb_monetization':'facebook',niche:REAL?'health_nutrition':'health',sub:REAL?'healthy_foods':'healthy',format:'list',dur:45,aspect:'9:16',style:REAL?'photoreal_macro':'photoreal',
  voice:'maya',playing:'maya',voicePicked:false,aiLabel:'auto',lang:'English',pace:1.0,energy:'Warm',
  pron:[],
  name:'Your brand',handle:'@yourbrand',logo:false,
  pal:{bg:'#0B0F1A',text:'#F5F7FA',hl:'#16C784',accent:'#00C2FF',warn:'#EA3943'},
  fh:'Poppins',fb:'Inter',cta:'Follow for more',end:'See you in the next one.',
  capStyle:'chunk3',capPos:'lower',counter:true,music:'Upbeat acoustic',sfx:'Med',
  banned:REAL?['cure','treat','prevent','heal','detox','miracle','guaranteed']:['cure','treat','prevent','detox'],disclaimer:true,cite:true,plat:{yt:false,fb:false,tt:false,ig:false},
  acc:true,locked:false,locking:false,topic:0,
  vo:true,aiAck:false,aiTag:true,kids:false,noClaims:false,ownTopic:'',ackErr:false,projectId:null,compAck:false,version:1,versions:[],cap:20,market:'PH'};
const S_DEFAULT = JSON.parse(JSON.stringify(S));
/* Validate anything that comes from outside (Import JSON, or a tampered localStorage draft): enums, hex colours, numbers, string lengths.
   Acknowledgements are never trusted from a file. Forced bundles and the cap are re-applied after. */
const HEX=/^#[0-9a-f]{6}$/i, str=(v,n=120)=>typeof v==='string'?v.replace(/[\u0000-\u001f]/g,'').slice(0,n):null;
function sanitizeIntake(I, opts={}){ const o={}, D=S_DEFAULT, inList=(v,l)=>l.includes(v)?v:undefined;
  o.goal=inList(I.goal,GOALS.map(g=>g.id)); o.niche=inList(I.niche,NICHES.map(n=>n.id));
  const nn=N(o.niche||D.niche); o.sub=inList(I.sub,nn.subs.map(x=>x[0]))||(o.niche?nn.subs[0][0]:undefined);
  o.format=inList(I.format,FORMATS.map(f=>f.id)); o.aspect=inList(I.aspect,ASPECTS.map(a=>a.id));
  if(Number.isFinite(+I.dur)) o.dur=Math.max(10,Math.min(180,Math.round(+I.dur)));
  o.style=inList(I.style,STYLES.map(x=>x.id)); o.voice=inList(I.voice,VOICES.map(v=>v.id)); o.voicePicked=I.voicePicked===true; o.aiLabel=I.aiLabel==='always'?'always':'auto';
  o.lang=str(I.lang,40)||undefined; o.energy=inList(I.energy,['Calm','Warm','Hype']); if(Number.isFinite(+I.pace)) o.pace=Math.max(0.7,Math.min(1.3,+I.pace));
  if(Array.isArray(I.pron)) o.pron=I.pron.filter(x=>Array.isArray(x)&&typeof x[0]==='string'&&typeof x[1]==='string').slice(0,40).map(([w,q])=>[str(w,40),str(q,60)]);
  ['name','handle','cta','end'].forEach(k=>{ const v=str(I[k],k==='end'||k==='cta'?140:60); if(v!==null) o[k]=v; });
  if(I.pal&&typeof I.pal==='object'){ o.pal={}; Object.keys(D.pal).forEach(k=>o.pal[k]=HEX.test(I.pal[k])?I.pal[k].toUpperCase():D.pal[k]); }
  o.fh=inList(I.fh,FONTS); o.fb=inList(I.fb,FONTS); o.capStyle=inList(I.capStyle,CAPSTY.map(c=>c.id)); o.capPos=inList(I.capPos,CAPPOS.map(c=>c.id));
  o.music=inList(I.music,MUSIC); o.sfx=inList(I.sfx,['Low','Med','High']);
  if(Array.isArray(I.banned)) o.banned=I.banned.map(w=>str(w,40)).filter(Boolean).map(w=>w.toLowerCase()).slice(0,60);
  if(I.plat&&typeof I.plat==='object'){ o.plat={}; PLATS.forEach(x=>o.plat[x.id]=I.plat[x.id]===true); }
  ['counter','vo','aiTag','noClaims','disclaimer'].forEach(k=>{ if(typeof I[k]==='boolean') o[k]=I[k]; }); o.kids=I.kids===true; o.kidsBundle=I.kidsBundle===true;
  o.ownTopic=str(I.ownTopic,160)||''; o.topic=I.topic===-1?-1:(Number.isInteger(I.topic)&&I.topic>=0&&I.topic<5?I.topic:0);
  o.market=M3.MARKETS.some(m=>m[0]===I.market)?I.market:'PH';
  o.cap=Math.max(1,Math.min(M3.CAP_MAX,Math.round(+I.cap||M3.CAP_MAX)));
  Object.keys(o).forEach(k=>o[k]===undefined&&delete o[k]);
  if(opts.keepState){ ['step','max','acc','locked','projectId','version','versions','aiAck','compAck'].forEach(k=>{ if(I[k]!==undefined) o[k]=I[k]; });
    o.step=Math.max(1,Math.min(9,+o.step||1)); o.max=Math.max(1,Math.min(9,+o.max||1)); o.version=Math.max(1,+o.version||1); o.aiAck=o.aiAck===true; o.compAck=o.compAck===true; o.locked=o.locked===true; if(!Array.isArray(o.versions)) o.versions=[]; }
  else { o.aiAck=false; o.compAck=false; }
  return o; }
const TRANSIENT=['locking','playing','ackErr','sample'];
function saveDraft(){ if(!window.Store) return; const o={}; Object.keys(S).forEach(k=>{ if(!TRANSIENT.includes(k)) o[k]=S[k]; }); Store.saveDraft(o); const el=document.querySelector('.saved'); if(el){ el.classList.remove('pulse'); void el.offsetWidth; el.classList.add('pulse'); el.lastChild.textContent=' Autosaved '+new Date().toLocaleTimeString([], {hour:'numeric',minute:'2-digit'}); } }
const INTAKE_FIELDS=['goal','niche','sub','format','dur','aspect','style','vo','voice','lang','pace','energy','pron','name','handle','pal','fh','fb','cta','end','capStyle','capPos','counter','music','sfx','banned','disclaimer','plat','kids','aiAck','aiTag','noClaims','compAck','ownTopic','topic','cap','market','voicePicked','aiLabel'];
const intakeSnapshot=()=>{ const o={}; INTAKE_FIELDS.forEach(k=>o[k]=JSON.parse(JSON.stringify(S[k]))); return o; };
const REALISTIC=['photoreal_macro','archival_doc','photoreal','cinematic'];
const isRealistic=()=>REALISTIC.includes(S.style);
/* MASTER_PACK safety.ai_disclosure {label: auto|always}: auto = platform AI label whenever output is photoreal or could be mistaken for real.
   A realistic synthetic narrator counts as could-be-mistaken-for-real (borderline), so voiceover on → label on. */
const aiOn=()=>S.aiLabel==='always'||isRealistic()||!!S.vo;
const aiReason=()=>S.aiLabel==='always'?'On: you chose "Always label".':isRealistic()?`On (auto): ${ST()?ST().n:'this style'} is a realistic style that could be mistaken for real footage.`:S.vo?'On (auto): the synthetic narrator sounds like a real person, so the video could be mistaken for real (borderline case, 3x3 labels it).':'Off (auto): stylised visuals and no voiceover, so nothing could be mistaken for real. Every description still lists the AI tools used.';
const affOn=()=>S.goal==='affiliate';
const claimsOn=()=>M3.needsNoClaims(S)||S.noClaims||(typeof bundleList==='function'&&bundleList().some(b=>b.banned_claims&&b.banned_claims.length));
const BUNDLES=(REAL&&RD.bundles)||{};
const bundleIds=()=>{ const sb=curSub(); const b=(sb&&sb.bundles)?sb.bundles.slice():[]; if(!REAL&&S.niche==='kids_learning') b.push('kids'); M3.topicBundles(M3.topicText(S)).forEach(x=>{ if(!b.includes(x)&&(BUNDLES[x]||!REAL)) b.push(x); }); return b; };
const topicHits=()=>S.topic===-1?M3.bannedHits(S.ownTopic,[...new Set(S.banned.concat(forcedWords()))]):[];
const bundleList=()=>bundleIds().map(id=>Object.assign({id},BUNDLES[id]||{})).filter(b=>b.forced!==false);
const hasBundle=id=>bundleIds().includes(id);
const forcedDisc=()=>{ const b=bundleList().filter(x=>x.disclaimer&&x.disclaimer.required); return b.find(x=>x.id==='crypto')||b.find(x=>x.id==='finance')||b[0]||null; };
const kidsBlocked=()=>hasBundle('alcohol')||hasBundle('true_crime');
const kidsForced=()=>hasBundle('kids')&&!kidsBlocked();
const kidsOn=()=>!kidsBlocked()&&(S.kids||kidsForced());
const forcedWords=()=>[...new Set(bundleList().flatMap(b=>b.banned_words||[]))];
const blockedGoal=()=>{ const b=bundleList().find(x=>(x.goals_blocked||[]).includes(S.goal)); return b?b:null; };
const highRisk=()=>!!forcedDisc()||kidsForced()||M3.needsNoClaims(S)||((curSub()||{}).risk==='high');
const discOn=()=>S.disclaimer||highRisk();
const PRESETS={yt_monetization:{dur:45,format:'list',plat:{yt:true},capStyle:'pop'},fb_monetization:{dur:60,format:'story',plat:{fb:true,ig:true}},tiktok_rewards:{dur:90,format:'story',plat:{tt:true}},
  affiliate:{dur:30,format:'list',plat:{yt:true,fb:true,tt:true,ig:true}},ecommerce:{dur:30,format:'reveal',plat:{fb:true,ig:true,tt:true}},digital_product:{dur:45,format:'reveal',plat:{yt:true,fb:true}},
  local_leads:{dur:30,format:'list',plat:{fb:true,ig:true}},brand_awareness:{dur:30,format:'story',plat:{fb:true,ig:true,yt:true}},audience_sponsorship:{dur:60,format:'story',plat:{yt:true,tt:true}},
  faith_community:{dur:45,format:'story',plat:{fb:true,yt:true},energy:'Calm'},cause_education:{dur:60,format:'list',plat:{yt:true,fb:true}}};
const presetText=g=>{const p=PRESETS[g]; if(!p) return ''; return `${p.dur}s · ${FORMATS.find(f=>f.id===p.format).n} · ${Object.keys(p.plat).map(k=>PLATS.find(x=>x.id===k).n).join(', ')}${p.capStyle?' · word-pop captions':''}${p.energy?' · calm voice':''}`;};


const words = d => Math.round(d*155/60), shots = d => Math.round(d/2.5);
const G = id => GOALS.find(g=>g.id===id), N = id => NICHES.find(n=>n.id===id);
const subName = () => (N(S.niche).subs.find(s=>s[0]===S.sub)||[,'—'])[1];
const F = () => FORMATS.find(f=>f.id===S.format), ST = () => STYLES.find(s=>s.id===S.style), V = () => VOICES.find(v=>v.id===S.voice);
const capN = () => CAPSTY.find(c=>c.id===S.capStyle).n, posN = () => CAPPOS.find(c=>c.id===S.capPos).n;
const platList = () => PLATS.filter(p=>S.plat[p.id]).map(p=>p.n.replace(' Reels','').replace(' Shorts',''));

function stepValue(i){ return [
  G(S.goal).n, `${N(S.niche).n} › ${subName()}`, `${F().n} · ${S.dur}s · ${S.aspect}`, ST().n,
  S.vo?`${V().n} · ${S.lang} · ${S.energy}`:'No voiceover', S.name, `${capN()} · ${posN()}`, `${S.aiAck?'AI labels ✓':'AI labels needed'} · ${platList().length} platforms`,
  S.locked?'Locked ✓':'Ready to lock'][i]; }

/* ---------- shell ---------- */
function rail(){
  return `<h6>Intake</h6><ol class="steps">${STEPS.map((s,i)=>{const n=i+1,cl=n===S.step?'on':(n<S.step||(S.locked&&n===9)?'done':(n<=S.max?'done':'future'));
    return `<li><button type="button" class="stp ${cl}" data-go="${n}" ${n===S.step?'aria-current="step"':''}><span class="dot">${cl==='done'?ic('check'):n}</span><span style="min-width:0;display:block"><span class="t" style="display:block">${s.t}</span><span class="v" style="display:block">${n<=S.max?esc(stepValue(i)):'Not started'}</span></span></button></li>`}).join('')}</ol>
    <div class="rail-foot"><div class="bar"><i style="width:${pct()}%"></i></div><p><span>Step ${S.step} of 9</span><span>${pct()}%</span></p></div>`;
}
function mobSteps(){ return STEPS.map((s,i)=>{const n=i+1;return `<button data-go="${n}" class="${n===S.step?'on':(n<=S.max?'done':'')}"><i>${n<S.step?'✓':n}</i>${s.t}</button>`}).join(''); }
const pct = () => S.locked?100:Math.round((S.step-1)/9*100);

function summary(){
  const rows=[
    ['target','Goal',G(S.goal).n,'',1],['grid','Niche',`${N(S.niche).n} › ${subName()}`,'',2],
    ['film','Format',`${F().n}`,`${S.dur}s · ${S.aspect} · ${words(S.dur)} words · ${shots(S.dur)} shots`,3],
    ['wand','Style',ST().n,'Prompt suffix + motion rule attached',4],
    ['mic','Voice',S.vo?`${V().n} – ${V().r}`:'No voiceover',S.vo?`${S.lang} · ${S.pace.toFixed(2)}× · ${S.energy}`:'Captions + music only',5],
    ['palette','Brand',`${S.name}`,`${S.handle} · ${S.fh} / ${S.fb}`,6],
    ['cc','Captions & audio',`${capN()} · ${posN()}`,`${S.music} · SFX ${S.sfx} · −14 LUFS`,7],
    ['shield','Safety & AI labels',`${S.aiAck?'AI disclosure ✓':'AI disclosure pending'}${claimsOn()?' · no-claims':''}${kidsOn()?' · made for kids':''}`,platList().join(', '),8]];
  const c=2*Math.PI*20, done=pct();
  return `<div class="sumhd"><div class="ring"><svg viewBox="0 0 48 48"><defs><linearGradient id="rg"><stop offset="0" stop-color="#00C2FF"/><stop offset="1" stop-color="#16C784"/></linearGradient></defs><circle class="bg" cx="24" cy="24" r="20"/><circle class="fg" cx="24" cy="24" r="20" stroke-dasharray="${c}" stroke-dashoffset="${c*(1-done/100)}"/></svg><b>${done}%</b></div>
    <div><h4>Project summary</h4><p>${S.locked?'Intake locked · rules v1':'Fills in as you choose'}</p></div></div>
    ${rows.map(([i,k,v,s,n])=>{const filled=n<=S.max;return `<div class="srow ${filled?'':'pnd'} ${n===S.step?'cur':''}" data-row="${n}">
      <div class="si">${ic(i)}</div><div style="min-width:0"><div class="sk">${k}</div>
      <div class="sv">${filled?esc(v):'Pending'}</div>${filled&&s?`<div class="ss">${esc(s)}</div>`:''}
      ${filled&&n===6?`<div class="dots">${ROLES.map(r=>`<i style="background:${S.pal[r[0]]}"></i>`).join('')}</div>`:''}</div></div>`}).join('')}
    ${S.max>=3?`<div class="comp"><div><b style="color:var(--cyan)">${words(S.dur)}</b><span>word budget</span></div><div><b style="color:var(--green)">${shots(S.dur)}</b><span>shots</span></div><div><b>2.5s</b><span>max / shot</span></div></div>`:''}`;
}
function footer(){
  const last=S.step===9;
  return `<button class="btn ghost" data-go="${S.step-1}" ${S.step===1?'disabled':''}>${ic('al')}Back</button>
    <div class="sp">${last?(S.locked?'Intake locked. Create the project to start.':(!S.aiAck?'Confirm AI disclosure in step 8 before locking.':!S.compAck?'Tick the compliance check to lock.':'Review everything, then lock to generate global rules.')):(S.step===8&&!S.aiAck?'<span style="color:#ffb1b5">Confirm AI disclosure to continue</span>':`Next: ${STEPS[S.step].t}`)}</div>
    ${last?(S.locked?`<button class="btn pri" data-act="create">${S.projectId?'Open project':'Create project'} ${ic('ar')}</button>`:`<button class="btn pri" data-act="lock" ${canLock()?'':'disabled'}>${ic('lock')}Lock v${S.version}</button>`)
      :`<button class="btn pri" data-go="${S.step+1}">Continue ${ic('ar')}</button>`}`;
}
const sh = (title,sub,right='') => `<div class="sh st"><div class="grow"><div class="eb">Step ${S.step} of 9 · ${STEPS[S.step-1].t}</div><h1>${title}</h1><p>${sub}</p></div>${right}</div>`;
const seg = (key,opts,val) => `<div class="seg" data-seg>${opts.map(o=>`<button class="${String(o)===String(val)?'sel':''}" data-set="${key}" data-val="${o}">${o}${key==='dur'?'s':''}</button>`).join('')}<span class="pill"></span></div>`;
const chk = on => on?`<span class="chk">${ic('check')}</span>`:'';

/* ---------- steps ---------- */
const VIEWS = {
1(){ const tip=GOAL_TIP[S.goal]||[];
  return sh('What should these videos earn you?','Pick one primary goal. It tunes hooks, length, CTA and platform rules downstream.',REAL?`<span class="badge grn">${ic('check')}Research data · ${RD.counts.goals} goals</span>`:'')+
  `<div class="grid g4">${GOALS.map(g=>`<button class="card st ${S.goal===g.id?'sel':''}" data-set="goal" data-val="${g.id}">${chk(S.goal===g.id)}
     <div class="ico" style="--c:${g.c}1f;--cc:${g.c}">${ic(g.i)}</div><h3>${g.n}</h3><p>${g.d}</p></button>`).join('')}
   <div class="panel st ${A('goal')}" style="background:linear-gradient(160deg,rgba(139,92,246,.12),rgba(139,92,246,.02));border-color:rgba(139,92,246,.3)">
     <div class="badge vio" style="margin-bottom:10px">${ic('spark')}What this goal changes</div>
     ${tip.map(t=>`<div class="row" style="gap:8px;margin-top:6px;font-size:12.5px;color:#d5dbe6;align-items:flex-start">${ic('check')}<span>${t}</span></div>`).join('')}
   </div></div>
   <div class="grid g2" style="margin-top:14px">
    <div class="panel st"><div class="lbl" style="margin-top:0">${ic('wand')}Preset for this goal</div>
      <p class="muted">${presetText(S.goal)||'No preset for this goal.'}</p>
      ${PRESETS[S.goal]?`<button class="btn" style="margin-top:10px" data-act="preset">${ic('spark')}Apply preset</button>`:''}${S.presetApplied===S.goal?`<span class="badge grn" style="margin-left:8px">${ic('check')}Applied</span>`:''}</div>
    <div class="panel st warnpanel"><div class="lbl" style="margin-top:0;color:#ffcf7a">${ic('warn')}Monetization warnings</div>
      ${monoWarnings().map(t=>`<div class="wrow">${ic('info')}<span>${t}</span></div>`).join('')}</div>
   </div>`; },
2(){ const n=N(S.niche), gname=G(S.goal).n, sb=curSub();
  const badge = REAL?`<span class="badge grn">${ic('check')}Research data · ${RD.counts.cats} categories · ${RD.counts.subs} sub-niches</span>`:`<span class="badge warn">${ic('info')}Example data, research pending</span>`;
  const risk = r => r==='high'?' <span class="badge warn" style="padding:1px 6px;font-size:10px">strict safety</span>':'';
  return sh('Pick a niche','Main category first, then a sub-niche. Tags show what fits your goal.',badge)+
  `<div class="grid g5">${NICHES.map(x=>{const best=x.best.includes(S.goal);
    return `<button class="card ncard st ${S.niche===x.id?'sel':''}" data-set="niche" data-val="${x.id}" title="${esc(x.full||x.n)}">${chk(S.niche===x.id)}
      <div class="nrow"><div class="ico" style="--c:${x.c}1f;--cc:${x.c}">${ic(x.i)}</div><div style="min-width:0"><h3>${x.n}</h3>
      <div class="cnt">${x.subs.length?x.subs.length+' sub-niches':'Sub-niches pending'}</div></div></div>
      ${best?`<span class="rec">${ic('spark')}Best for ${gname}</span>`:''}</button>`}).join('')}</div>
  <div class="subwrap st ${A('niche')}"><h5>${ic(n.i)}${esc(n.full||n.n)} · sub-niches <span class="r" style="margin-left:auto;font-size:11.5px;color:var(--mute);font-weight:500"><span style="color:var(--green)">●</span> fits ${gname}</span></h5>
    <div class="chips">${n.subs.map(s=>{const fit=REAL?s[2].goals.includes(S.goal):true;return `<button class="chip ${S.sub===s[0]?'sel g':''}" data-set="sub" data-val="${s[0]}">${S.sub===s[0]?ic('check'):(fit?'<span style="color:var(--green);font-size:9px">●</span>':'')}${esc(s[1])}${REAL?risk(s[2].risk):(s[0]==='disease'?risk('high'):'')}</button>`}).join('')}</div>
    ${REAL&&sb?`<div class="tinyrv" style="margin-top:12px">
      <span class="badge mute">RPM tier: ${sb.rpm} (estimate)</span><span class="badge mute">${sb.ever}</span><span class="badge mute">AI visual feasibility: ${sb.vis}</span>
      <span class="badge ${sb.risk==='high'?'warn':sb.risk==='medium'?'vio':'grn'}">Compliance: ${sb.risk}${sb.areas.length?' · '+sb.areas.slice(0,2).join(', '):''}</span></div>`:''}${alcoholWarn()}</div>`; },
3(){ return sh('Format & duration','The skeleton every script follows. Numbers below update live.')+
  `<div class="lbl st">Format</div><div class="grid g3">${FORMATS.map(f=>`<button class="card st ${S.format===f.id?'sel':''}" data-set="format" data-val="${f.id}">${chk(S.format===f.id)}
    <div class="ico" style="--c:rgba(0,194,255,.12);--cc:var(--cyan)">${ic(f.i)}</div><h3>${f.n}</h3><p>${f.d}</p>
    <div class="beats">${f.beats.map((b,j)=>`<i class="${f.k.includes(j)?'k':''}" style="height:${b*12}%"></i>`).join('')}</div></button>`).join('')}</div>
  <div class="lbl st">Duration ${(S.goal==='tiktok_rewards'||S.plat.tt)&&S.dur<=60?'<span class="badge warn" style="text-transform:none;letter-spacing:0">TikTok: Reach only, not eligible for Creator Rewards (needs 61s+)</span>':''}<span class="r" style="color:var(--dim)">≈155 wpm narration · max 2.5s per shot</span></div>
  <div class="st">${seg('dur',[30,45,60,90],S.dur)}</div>
  <div class="stats st">
    <div class="stat c"><b>≈${words(S.dur)}<small>words</small></b><span>Word budget at 155 wpm</span></div>
    <div class="stat g"><b>${shots(S.dur)}<small>shots</small></b><span>At 2.5s max per shot</span></div>
    <div class="stat"><b>${M3.BEATS[S.format].length}<small>beats</small></b><span>${M3.BEAT_LABEL[S.format]}</span></div>
    <div class="stat"><b>~${Math.round(words(S.dur)/M3.BEATS[S.format].length)}<small>w/beat</small></b><span>Avg words per beat (${words(S.dur)} ÷ ${M3.BEATS[S.format].length})</span></div></div>
  <div class="lbl st">Aspect ratio</div><div class="grid g3">${ASPECTS.map(a=>`<button class="card acard st ${S.aspect===a.id?'sel':''}" data-set="aspect" data-val="${a.id}">${chk(S.aspect===a.id)}
    <div class="fbox"><div class="frame" style="width:${a.w}px;height:${a.h}px;color:${S.aspect===a.id?'var(--cyan)':'var(--mute)'}"></div></div><h3>${a.id}</h3><p>${a.d}</p></button>`).join('')}</div>`; },
4(){ const rec=styleRec(), s=ST();
  return sh('Visual style','Applied to every still and clip so the channel looks consistent.')+
  `<div class="grid g5">${STYLES.map(x=>`<button class="card scard st ${S.style===x.id?'sel':''}" data-set="style" data-val="${x.id}">${chk(S.style===x.id)}
    <div class="thumb" style="background:${x.bg}">${x.svg||''}${rec.includes(x.id)?`<span class="rb">★ Recommended for your niche</span>`:''}</div><h3>${x.n}</h3></button>`).join('')}${STYLES.length%5?`<button class="card scard st" style="border-style:dashed;background:transparent;display:grid;place-items:center;text-align:center;color:var(--mute)"><div><div class="ico" style="margin:0 auto 8px">${ic('plus')}</div><h3 style="color:var(--mute);min-height:0">Custom style<br><span style="font-weight:400;font-size:11.5px">from reference images</span></h3></div></button>`:''}</div>
  <div class="expand st ${A('style')}">
    <div><h5>What this adds to every prompt</h5><code>…, ${esc(s.sfx)}</code></div>
    <div><h5>Motion rule</h5><p>${s.mo}</p></div>
    <div><h5>Caption treatment</h5><p>${s.cap}</p><div class="badge grn" style="margin-top:10px">${ic('check')}Applied to all ${shots(S.dur)} shots</div></div></div>`; },
5(){ return sh('Narrator voice','Preview voices, then tune language, pace and energy.',`<span class="badge mute">${ic('info')}Example voices</span>`)+
  `<p class="ttsnote st" id="ttsnote">${ic('info')} ${App.canSpeak()?'Play gives a short <b>browser voice sample</b> (simulator): it uses your pace, but it is not the ElevenLabs voice. The real build renders a 10-second sample from your ElevenLabs account.':'<b>Audio preview isn\'t available</b> in this browser (simulator). The real build renders a 10-second sample from your ElevenLabs account.'}</p>`+
  `<div class="trow st" style="margin-bottom:14px"><div class="tx"><h4>Voiceover narration</h4><p>${S.vo?'On. Needs an ElevenLabs API key in Connections.':'Off. Videos use captions and music only, so ElevenLabs is not needed.'}</p></div><div class="tog ${S.vo?'on':''}" data-act="tog" data-val="vo"></div></div>
  <div class="${S.vo?'':'dimmed'}" style="display:grid;grid-template-columns:minmax(0,1.45fr) minmax(0,1fr);gap:16px;align-items:start">
   <div class="grid" style="gap:10px">${VOICES.map((v,vi)=>{const on=S.playing===v.id;
     return `<div class="card vcard st ${S.voice===v.id?'sel':''}" data-set="voice" data-val="${v.id}">
       <button class="play ${on?'on':''}" data-act="play" data-val="${v.id}" aria-label="${on?'Stop':'Play'} ${v.n} preview">${ic(on?'pause':'play')}</button>
       <div class="vmeta"><h3><button type="button" class="vsel" data-set="voice" data-val="${v.id}">${v.n} <span style="color:var(--mute);font-weight:500">– ${v.r}</span></button></h3><p>${v.d}</p></div>
       <div class="wave ${on?'on':''}">${Array.from({length:18},(_,j)=>{const h=20+Math.abs(Math.sin(j*1.7+vi*3))*70+(j%4)*3;return `<i style="--h:${Math.min(h,100)}%;--d:${(j%7)*-0.13}s;--s:${(0.4+((j*37)%60)/100).toFixed(2)}"></i>`}).join('')}</div>
       <span class="vtag">${v.t}</span>${S.voice===v.id?`<span class="chk">${ic('check')}</span>`:''}</div>`}).join('')}</div>
   <div class="grid" style="gap:14px">
     <div class="panel st"><div class="lbl">${ic('globe')}Language</div>${seg('lang',['English','Tagalog','Taglish'],S.lang)}
       <div class="lbl">Pace <span class="r" id="paceV" style="color:var(--cyan);font-weight:700">${S.pace.toFixed(2)}×</span></div>
       <input type="range" class="range" min="0.8" max="1.25" step="0.05" value="${S.pace}" data-in="pace">
       <div class="row" style="justify-content:space-between;font-size:11px;color:var(--dim);margin-top:4px"><span>0.8× slower</span><span>155 wpm</span><span>1.25× faster</span></div>
       <div class="lbl">Energy</div><div class="chips">${['Calm','Warm','Hype'].map(e=>`<button class="chip ${S.energy===e?'sel':''}" data-set="energy" data-val="${e}">${e}</button>`).join('')}</div></div>
     <div class="panel st"><div class="lbl" style="margin-top:0">Pronunciation list <span class="r" style="color:var(--dim)">${S.pron.length} words</span></div>
       <div class="pron">${S.pron.map(([w,p],i)=>`<div class="prow"><span>${esc(w)}</span>${ic('ar')}<span class="ph">${esc(p)}</span><button data-act="delpron" data-val="${i}" style="color:var(--dim)" aria-label="Remove ${esc(w)}">${ic('x')}</button></div>`).join('')}
       <div class="row" style="gap:6px;margin-top:4px"><input class="inp" id="pw" maxlength="40" placeholder="word" style="padding:8px 10px"><input class="inp" id="pp" maxlength="60" placeholder="say it like…" style="padding:8px 10px"><button class="btn" data-act="addpron" style="padding:8px 10px" aria-label="Add pronunciation">${ic('plus')}</button></div></div></div>
   </div></div>`; },
6(){ return sh('Brand kit','Everything here is burned into every video. Preview updates live.')+
  `<div class="brandgrid"><div>
    <div class="f2 st"><label class="field"><span>Brand name</span><input class="inp" data-in="name" maxlength="60" value="${esc(S.name)}"></label>
      <label class="field"><span>Handle</span><input class="inp" data-in="handle" maxlength="40" value="${esc(S.handle)}"></label></div>
    <div class="f2 st" style="margin-top:12px">
      <div class="drop"><div class="dz">${ic('up')}</div><div style="min-width:0"><b>Logo (optional)</b><small>Drop PNG 512×512. The brand initial is used until you add one.</small></div></div>
      <div class="drop"><div class="dz">${ic('up')}</div><div><b>Frame overlay</b><small>Drop PNG 1080×1920 (optional)</small></div></div></div>
    <div class="lbl st">Palette · 5 roles</div>
    <div class="pal st">${ROLES.map(([k,l])=>`<div class="sw"><label style="background:${hx(S.pal[k])}" data-sw="${k}"><input type="color" value="${hx(S.pal[k])}" data-col="${k}" aria-label="${l} colour"></label><span>${l}</span><input class="hex" value="${hx(S.pal[k])}" data-hex="${k}" maxlength="7" aria-label="${l} colour hex"></div>`).join('')}</div>
    <div class="st" id="contrastBox">${contrastBox()}</div>
    <div class="lbl st">Typography & text</div>
    <div class="f2 st"><label class="field"><span>Heading font</span><select class="inp" data-in="fh">${FONTS.map(f=>`<option ${f===S.fh?'selected':''}>${f}</option>`).join('')}</select></label>
      <label class="field"><span>Body font</span><select class="inp" data-in="fb">${FONTS.map(f=>`<option ${f===S.fb?'selected':''}>${f}</option>`).join('')}</select></label></div>
    <div class="f2 st" style="margin-top:12px"><label class="field"><span>CTA text (the only CTA, last 15%)</span><input class="inp" maxlength="140" data-in="cta" value="${esc(S.cta)}"></label>
      <label class="field"><span>End card line (not a second CTA)</span><input class="inp" data-in="end" maxlength="140" value="${esc(S.end)}"></label></div>
  </div>
  <div class="prevcol st"><div class="prevhd"><b>Live preview · 9:16</b><span class="live"><i></i>LIVE</span></div>
    <div class="phones" id="pv">${phoneScene()}${phoneEnd()}</div></div></div>`; },
7(){ return sh('Captions & audio','How words appear on screen and how the mix sounds.')+
  `<div class="lbl st">Caption style</div><div class="grid g3">${CAPSTY.map(c=>`<button class="card cs st ${S.capStyle===c.id?'sel':''}" data-set="capStyle" data-val="${c.id}">${chk(S.capStyle===c.id)}
     <div class="mini" style="${c.id==='pop'?'font-size:20px':''}"><span>${capSample(c.id)}</span>${affOn()?`<small class="miniaff">${esc(M3.AFFILIATE_LINE)}</small>`:''}</div><h3>${c.n}</h3><p>${c.d}</p></button>`).join('')}</div>
   <div style="display:grid;grid-template-columns:minmax(0,1.2fr) minmax(0,1fr);gap:16px;margin-top:4px">
    <div><div class="lbl st">Position</div><div class="grid g3">${CAPPOS.map(p=>`<button class="card poscard st ${S.capPos===p.id?'sel':''}" data-set="capPos" data-val="${p.id}"><div class="pf"><i style="top:${p.y}px"></i></div><h3>${p.n}</h3></button>`).join('')}</div></div>
    <div><div class="lbl st">On-screen</div><div class="trow st"><div class="tx"><h4>Progress counter</h4><p>Shows "3/6" style beat counter</p></div><div class="tog ${S.counter?'on':''}" data-act="tog" data-val="counter"></div></div></div></div>
   <div class="affnote st" style="background:rgba(0,194,255,.06);border-color:rgba(0,194,255,.3);color:#d8e6f0">${ic('info')}<div><b>Fixed rules:</b> captions or on-screen text on every frame · safe zones 250px top / 400px bottom (on 1080×1920), so nothing sits under platform UI · one soft CTA, only in the last 15% of the video.</div></div>
   ${affOn()?`<div class="affnote st">${ic('dollar')}<div><b>Affiliate disclosure is on (goal: Affiliate).</b> "${esc(M3.AFFILIATE_LINE)}" is burned into the captions on the first and last shot and added to the description (US FTC endorsement guides, PH DTI / Consumer Act). You can't turn it off for this goal.</div></div>`:''}
   <div class="lbl st">Audio</div>
   <div class="grid g3 st">
     <label class="field"><span>Music mood</span><select class="inp" data-in="music">${MUSIC.map(m=>`<option ${m===S.music?'selected':''}>${m}</option>`).join('')}</select></label>
     <div class="field"><span>SFX intensity</span>${seg('sfx',['Low','Med','High'],S.sfx)}</div>
     <div class="field"><span>Loudness target</span><div class="fixed"><b>−14 LUFS</b><span class="badge mute">Fixed</span><span class="lk">${ic('lock')}</span>
       <span class="tip" style="margin-left:auto">${ic('info')}<span class="tt">Normalised to −14 LUFS integrated, −1 dBTP true peak: the level YouTube, Facebook and TikTok target, so videos don't get turned down or sound quiet next to others.</span></span></div></div>
   </div>`; },
8(){ return sh('Safety & platforms','Guardrails every script must pass, and where you plan to publish.')+bundleBanner()+
  `<div class="panel st"><div class="lbl" style="margin-top:0">${ic('shield')}Banned words ${M3.BANNED_PRESET[S.niche]?`<span class="badge grn" style="text-transform:none;letter-spacing:0">Prefilled for ${esc(N(S.niche).n)}</span>`:''}<span class="r" style="color:var(--dim)">Scripts using these are rewritten</span></div>
    <div class="chips">${S.banned.map((w,i)=>forcedWords().includes(w)?`<span class="chip word forced" title="Forced by the ${esc(bundleList().map(b=>b.name).join(' / '))} rule bundle">${ic('lock')}${esc(w)}</span>`:`<span class="chip word">${esc(w)}<button class="x" data-act="delword" data-val="${i}" aria-label="Remove ${esc(w)}">${ic('x')}</button></span>`).join('')}
      <span class="addin"><input id="bw" maxlength="40" placeholder="Add a word…"><button class="btn" data-act="addword" style="padding:4px 8px;border-radius:99px" aria-label="Add banned word">${ic('plus')}</button></span></div>
    <div class="row" style="margin-top:10px;gap:6px;font-size:12px;color:var(--dim)">Suggested: ${suggestWords().filter(w=>!S.banned.includes(w)).map(w=>`<button class="chip ghost" style="padding:3px 10px;font-size:12px" data-act="sugword" data-val="${w}">+ ${w}</button>`).join('')}</div></div>
  <div class="grid g2" style="margin-top:12px">
    <div class="trow st" style="flex-wrap:wrap"><div class="tx"><h4>${forcedDisc()&&forcedDisc().disclaimer.type==='NFA'?'NFA disclaimer (not financial advice)':'Disclaimer'}</h4><p>Shown on the first frame and in the description</p></div><div class="tog ${discOn()?'on':''} ${highRisk()?'locked':''}" ${highRisk()?'aria-disabled="true" title="Always on for high-risk niches"':'data-act="tog" data-val="disclaimer"'}></div>
      ${highRisk()?`<p style="flex-basis:100%;font-size:11.5px;color:var(--mute)">${ic('lock')} Locked on by the forced rule bundle${bundleList().length?': '+esc(bundleList().map(b=>b.name).join(' · ')):''}. You can't turn it off.</p>`:''}
      ${discOn()?`<div class="disc ${A('disclaimer')}" style="flex-basis:100%">${disclaimerText()}</div>`:''}</div>
    <div class="trow st" style="align-items:flex-start"><div class="tx"><h4>Cite a source for every fact <span class="badge mute">${ic('lock')}Locked on</span></h4><p>Each claim in the script carries a source URL that reviewers can check before approval.</p></div><div class="tog on locked" title="Always on"></div></div></div>
  <div class="lbl st">Publish to</div>
  <div class="grid g4">${PLATS.map(p=>`<button class="card plat st ${S.plat[p.id]?'sel':''}" data-act="plat" data-val="${p.id}" ${kidsForced()&&p.id!=='yt'?'disabled title="Kids projects publish to YouTube only"':''}><div class="ico" style="--c:${p.c}1f;--cc:${p.c}">${ic(p.i)}</div><h3>${p.n}</h3><span class="cbx">${ic('check')}</span></button>`).join('')}</div>
  ${S.plat.tt?`<p class="st" style="margin-top:10px;font-size:12px">${S.dur<=60?`<span class="badge warn" style="margin-right:6px">TikTok: Reach only, not eligible for Creator Rewards</span><span class="muted">${S.dur}s is fine for reach. Creator Rewards needs 61s or longer (pick 90s in Format).</span>`:`<span class="badge grn">${ic('check')}TikTok: Creator Rewards eligible (${S.dur}s)</span>`}</p>`:''}
  ${marketField()}${alcoholWarn()}
  ${step8Extra()}`; },
9(){ const items=[['Goal',G(S.goal).n,'Primary monetization path',1],['Niche',`${N(S.niche).n} › ${subName()}`,REAL?`Compliance: ${(curSub()||{}).risk||'—'}`:'Example data',2],
    ['Format',`${F().n} · ${S.dur}s`,`${S.aspect} · ≈${words(S.dur)} words · ${shots(S.dur)} shots${S.plat.tt&&S.dur<=60?' · TikTok: reach only':''}`,3],['Budget',`$${S.cap}/day cap`,'Per user · enforced by your Grok Bot',9],['Style',ST().n,ST().mo,4],
    ['Voice',S.vo?`${V().n} – ${V().r}`:'No voiceover',S.vo?`${S.lang} · ${S.pace.toFixed(2)}× · ${S.energy}`:'Captions + music only',5],['Brand',S.name,`${S.handle} · ${S.fh} / ${S.fb}`,6],
    ['Captions',`${capN()} · ${posN()}`,`Counter ${S.counter?'on':'off'}${affOn()?' · affiliate line on':''}`,7],['Audio',`${S.music} · SFX ${S.sfx}`,'−14 LUFS',7],
    ['Safety',`${S.banned.length} banned · sources on${claimsOn()?' · no-claims':''}`,`${kidsOn()?'Made for kids · ':''}${platList().join(', ')}`,8],
    ['AI disclosure',S.aiAck?'Confirmed · required':'Not confirmed',aiPlatSummary(),8]];
  if(S.locked) return sh('Intake locked','Global rules are built for this topic. Create the project to start.')+
    `<div class="okbanner st"><div class="lk">${ic('lock')}</div><div style="flex:1"><h3>Rules v${S.version} built from your intake · v${S.version} is read-only</h3><p>${items.slice(0,6).map(i=>esc(i[1])).join(' · ')}</p><p class="mono" style="margin-top:4px">intake hash ${M3.hash(intakeSnapshot())}</p></div><button class="btn ghost" data-act="newversion">${ic('edit')}Edit as v${S.version+1}</button></div>
    ${versionsList()}
    ${reviewWarnings()}
    ${topicSection(true)}
    <div class="next st"><div class="n">${ic('edit')}</div><div><b>Next: Script (approval 1)</b><p>Creates a project and sends the first jobs to your Grok Bot worker (simulated in this test build): Rules, then a ${S.dur}s script for "${esc(curTopic())}". You approve it before any voice or visuals are made.</p></div><button class="btn pri" data-act="create">${S.projectId?'Open project':'Create project & start'} ${ic('ar')}</button></div>`;
  return sh('Review & lock','Check every choice. Locking turns them into global rules every video follows.',`<div class="row" style="gap:8px"><button class="btn ghost" data-act="export">${ic('dl')}Export JSON</button><label class="btn ghost" style="cursor:pointer">${ic('up')}Import JSON<input type="file" accept="application/json,.json" id="impFile" hidden></label></div>`)+
  `${blockedGoal()?`<div class="errbanner st">${ic('warn')}<div><b>${esc(G(S.goal).n)} isn't allowed for ${esc(subName())}.</b> The ${esc(blockedGoal().name)} bundle blocks this goal (no exchange or token referral links). <a data-go="1">Change goal →</a> or <a data-go="2">change niche →</a></div></div>`:''}
  ${!S.aiAck?`<div class="errbanner st">${ic('warn')}<div><b>AI disclosure isn't confirmed.</b> It's required before you can lock. <a data-go="8">Go to step 8 →</a></div></div>`:''}
  ${reviewWarnings()}${alcoholWarn()}
  <div class="grid g3">${items.map(([k,v,s,n])=>`<div class="card rv st"><div class="k">${k}<a data-go="${n}">${ic('edit')}Edit</a></div><div class="val">${esc(v)}</div><div class="sub">${esc(s)}</div></div>`).join('')}</div>
  ${costEstimate()}
  ${versionsList()}
  ${topicSection(false)}
  <label class="ack st ${S.compAck?'on':''}" style="margin-top:14px"><input type="checkbox" data-act="compack" ${S.compAck?'checked':''} aria-describedby="compackd"><span id="compackd"><b>Compliance check (required).</b> I confirm these videos follow each platform's rules and local law: claims will be sourced, ${affOn()?'the affiliate disclosure stays on, ':''}AI labels stay on${highRisk()?', the disclaimer stays on for this high-risk niche':''}, and I'll review every approval step before anything is published.</span></label>
  <div class="acc st ${S.acc?'open':''}"><button data-act="acc">${ic('bolt')}Generated global rules preview <span class="badge mute">rules v1 · compiled from this intake</span><span class="cv">${ic('cr')}</span></button>
    <div class="accb"><div><pre class="json" tabindex="0" role="region" aria-label="Generated global rules JSON">${rulesJSON()}</pre></div></div></div>
  <button class="lockbtn st ${S.locking?'locking':''}" data-act="lock" ${canLock()?'':'disabled'}>${ic('lock')}${S.locking?'Locking intake…':(!S.aiAck?'Confirm AI disclosure first (step 8)':blockedGoal()?'Goal not allowed for this niche':topicHits().length?'Remove banned words from your topic':(S.topic===-1&&!S.ownTopic.trim())?'Write your topic or pick one':!S.compAck?'Tick the compliance check to lock':`Lock intake v${S.version} & build rules`)}</button>`; }
};

/* preview caption follows the current topic (and so the niche), never a fixed food example */
function sampleWords(){ const w=curTopic().replace(/["“”]/g,'').split(/\s+/).filter(Boolean).slice(0,7); return w.length?w:['Your','topic','here']; }
function capSample(mode){ const w=sampleWords(); let hi=0; w.forEach((x,i)=>{ if(x.replace(/\W/g,'').length>w[hi].replace(/\W/g,'').length) hi=i; });
  const em=i=>`<em>${esc(w[i])}</em>`;
  if(mode==='pop') return `<em>${esc(w[hi].toUpperCase())}</em>`;
  if(mode==='chunk3'){ const a=Math.max(0,Math.min(hi-1,w.length-3)); return w.slice(a,a+3).map((x,j)=>a+j===hi?em(hi):esc(x)).join(' '); }
  return w.map((x,i)=>i===hi?em(i):esc(x)).join(' '); }
function phoneScene(){ return `<div><div class="phone"><div class="notch"></div><div class="scene"></div>
  <div class="pprog">${[1,2,3,4,5,6].map(i=>`<i class="${i<=3?'f':''}"></i>`).join('')}</div>
  <div class="safez t"><span>250px safe</span></div><div class="safez b"><span>400px safe</span></div><div class="pdisc" style="color:${cr('#FFFFFF',hx(S.pal.warn))>=cr('#0B0F1A',hx(S.pal.warn))?'#FFFFFF':'#0B0F1A'}">${esc(shortDisc())}</div><div class="pctr">3/6</div>${S.aiTag||isRealistic()?'<div class="paitag">AI-generated</div>':''}
  <div class="pcap">${capSample('line')}${affOn()?`<span class="paff">${esc(M3.AFFILIATE_LINE)}</span>`:''}</div>
  <div class="plt"><div class="plogo">${esc((S.name||'?').trim().charAt(0).toUpperCase()||'?')}</div><div style="min-width:0"><b data-bind="name">${esc(S.name)}</b><small data-bind="handle">${esc(S.handle)}</small></div></div></div><div class="phcap">Scene · beat 3</div></div>`; }
function phoneEnd(){ return `<div><div class="phone sm"><div class="notch"></div><div class="pend"><div class="plogo">${esc((S.name||'?').trim().charAt(0).toUpperCase()||'?')}</div><b data-bind="name">${esc(S.name)}</b>
  <p data-bind="end">${esc(S.end)}</p><span class="cta" data-bind="cta">${esc(S.cta)}</span>${affOn()?`<span class="paff" style="position:static;margin-top:6px">${esc(M3.AFFILIATE_LINE)}</span>`:''}<small data-bind="handle">${esc(S.handle)}</small></div></div><div class="phcap">End card</div></div>`; }
function applyPreviewVars(){ const el=document.getElementById('pv'); if(!el) return;
  const p=S.pal; Object.assign(el.style,{}); el.style.setProperty('--pbg',p.bg); el.style.setProperty('--ptext',p.text); el.style.setProperty('--phl',p.hl);
  el.style.setProperty('--paccent',p.accent); el.style.setProperty('--ponhl',onHl()); el.style.setProperty('--pwarn',p.warn); el.style.setProperty('--fh',`"${S.fh}"`); el.style.setProperty('--fb',`"${S.fb}"`); }

function rulesJSON(){
  const o=compileRules();
  return esc(JSON.stringify(o,null,2)).replace(/&quot;([^&]+)&quot;:/g,'<span class="k">"$1"</span>:').replace(/: &quot;([^&]*)&quot;/g,': <span class="s">"$1"</span>')
    .replace(/: (-?\d+\.?\d*)/g,': <span class="n">$1</span>').replace(/: (true|false)/g,': <span class="b">$1</span>').replace(/^(\s+)&quot;([^&]*)&quot;/gm,'$1<span class="s">"$2"</span>');
}

/* ---------- 3x3 additions: warnings, AI disclosure, claims, cost, rules ---------- */
function monoWarnings(){ const w=[];
  if(S.goal==='tiktok_rewards'||S.plat.tt) w.push(`TikTok Creator Rewards only pays on videos <b>61s or longer</b>. 30–60s is fine for reach, but it gets marked <b>Reach only: not eligible for Creator Rewards</b>${S.dur<=60?` (yours is ${S.dur}s; the TikTok preset uses 90s)`:''}.`);
  w.push('Mass-produced, templated or repetitive videos get <b>demonetized</b> (YouTube "inauthentic content", Meta "unoriginal content"). 3x3 varies topic, script and visuals every time. Don\'t post near-duplicates.');
  if(S.goal==='yt_monetization') w.push('YouTube Partner Program needs 1,000 subscribers plus 10M Shorts views in 90 days, or 4,000 long-form watch hours in 12 months.');
  if(S.goal==='fb_monetization') w.push('Facebook only pays for original content. Reposted or lightly edited clips earn nothing.');
  if(S.goal==='affiliate') w.push('Every affiliate video must carry a disclosure. 3x3 adds it on screen and in the caption automatically.');
  return w; }
function suggestWords(){ return ({health_nutrition:['burn fat','boost immunity','superfood','miracle'],human_body:['instant relief','doctors hate','miracle'],finance:['passive income guaranteed','no risk','insider tip','100x'],local_business:['cheapest','guaranteed results']})[S.niche]||['miracle','guaranteed','shocking','secret']; }
function disclaimerText(){ const fd=forcedDisc(); if(fd&&fd.disclaimer.on_screen) return fd.disclaimer.on_screen;  if(S.niche==='finance') return 'Educational only, not financial advice. Do your own research.'; if(['health_nutrition','human_body'].includes(S.niche)||S.sub==='clinic_education') return REAL?RD.rules.safety.disclaimer.on_screen:'General information, not medical advice.'; return 'For general information only.'; }
function shortDisc(){ return S.niche==='finance'?'Not financial advice':(['health_nutrition','human_body'].includes(S.niche)?'Not medical advice':'General info'); }
const CLAIM_RULES={health:(REAL&&RD.rules.safety.claim_rules)||['No disease treatment/prevention claims'],finance:['No promised or "guaranteed" returns','No personalised investment, crypto or tax advice','Show risk on any return figure','No AI persona presented as a licensed adviser']};
function claimRules(){ const bc=[...new Set(bundleList().flatMap(b=>b.banned_claims||[]))]; if(bc.length) return bc.map(x=>'No '+x.replace(/^no /i,'')); return S.niche==='finance'||/invest|credit|crypto/.test(S.sub||'')?CLAIM_RULES.finance:CLAIM_RULES.health; }
function aiPlatSummary(){ const p=Object.keys(S.plat).filter(k=>S.plat[k]); if(!aiOn()) return 'Auto: platform labels off (stylised, no voiceover)'; return p.length?p.map(k=>M3.AI_DISCLOSURE[k].label).filter((v,i,a)=>a.indexOf(v)===i).join(' · '):'No platforms selected'; }
function step8Extra(){ const plats=Object.keys(S.plat).filter(k=>S.plat[k]); const auto=M3.needsNoClaims(S);
  return `<div class="panel st aipanel ${S.ackErr?'shake':''}" id="aiDisc"><div class="lbl" style="margin-top:0">${ic('eye')}AI disclosure <span class="badge red" style="text-transform:none;letter-spacing:0">${ic('lock')}Required · can't be skipped</span></div>
    ${isRealistic()?`<div class="errbanner" style="margin:0 0 10px">${ic('warn')}<div><b>Photoreal style selected.</b> Realistic-looking AI scenes must carry the platform AI label. Hiding it can get videos removed or your account struck.</div></div>`:''}
    <div class="trow" id="aiauto" style="margin:0 0 10px"><div class="tx"><h4>Platform AI label: ${S.aiLabel==='always'?'Always':'Auto (spec default)'}</h4><p id="aireason">${esc(aiReason())}</p></div><div class="tog ${S.aiLabel==='always'?'on':''}" data-act="ailabel" role="switch" tabindex="0" aria-checked="${S.aiLabel==='always'}" aria-label="Always apply the platform AI label"></div></div>
    <table class="aitable"><thead><tr><th>Platform</th><th>Label applied</th><th>How 3x3 applies it</th></tr></thead><tbody>
    ${plats.length?plats.map(k=>{const d=M3.AI_DISCLOSURE[k];return `<tr><td>${d.n}</td><td>${aiOn()?`<span class="badge vio">${d.label}</span>`:'<span class="badge mute">Not needed (auto)</span>'}</td><td>${d.how}</td></tr>`}).join(''):'<tr><td colspan="3" style="color:var(--mute)">No platforms selected yet. Pick where you plan to publish above, or leave them all off to download only.</td></tr>'}
    </tbody></table>
    <div class="trow" style="margin-top:10px"><div class="tx"><h4>On-screen "AI-generated" tag</h4><p>${isRealistic()?'Locked on for photoreal styles.':'Small corner tag on the first 3 seconds.'}</p></div><div class="tog ${S.aiTag||isRealistic()?'on':''} ${isRealistic()?'locked':''}" ${isRealistic()?'':'data-act="tog" data-val="aiTag"'}></div></div>
    <label class="ack ${S.aiAck?'on':''}"><input type="checkbox" data-act="ack" ${S.aiAck?'checked':''}><span>I understand 3x3 applies each platform's AI label whenever a video is realistic or could be mistaken for real (auto), or on every video if I choose "Always", and that every description lists the AI tools used.</span></label></div>
  <div class="grid g2" style="margin-top:12px">
    <div class="trow st" style="align-items:flex-start;flex-wrap:wrap"><div class="tx"><h4>No-claims rules ${auto?`<span class="badge mute">${ic('lock')}Auto-on for this niche</span>`:''}</h4><p>${auto?'Health, finance and crypto topics always run strict claim checks.':'Optional for this niche.'}</p></div><div class="tog ${claimsOn()?'on':''} ${auto?'locked':''}" ${auto?'':'data-act="tog" data-val="noClaims"'}></div>
      ${claimsOn()?`<ul class="claimlist">${claimRules().map(r=>`<li>${esc(r)}</li>`).join('')}</ul>`:''}</div>
    <div class="trow st" style="align-items:flex-start;flex-wrap:wrap"><div class="tx"><h4>${ic('kid')} Made for kids</h4><p>YouTube COPPA setting. When on, comments and personalised ads are off, and the script avoids anything not suitable for under-13s.${S.niche==='kids_learning'&&!S.kids?' <b style="color:#ffcf7a">Recommended for Kids & learning.</b>':''}</p></div><div class="tog ${kidsOn()?'on':''} ${kidsForced()||kidsBlocked()?'locked':''}" ${kidsForced()||kidsBlocked()?'aria-disabled="true"':'data-act="tog" data-val="kids"'}></div>
      ${kidsBlocked()?`<p style="flex-basis:100%;font-size:11.5px;color:var(--mute);margin-top:6px">${ic('lock')} Off and locked: ${hasBundle('alcohol')?'alcohol':'true-crime'} content is never made for kids.</p>`:''}
      ${kidsForced()?`<p style="flex-basis:100%;font-size:11.5px;color:var(--mute);margin-top:6px">${ic('lock')} Forced by the Made for kids (COPPA) bundle. ${esc((BUNDLES.kids||{}).platform_note||'Kids projects publish to YouTube only.')}</p>`:''}</div>
  </div>`; }
const hx=v=>HEX.test(v||'')?v:'#000000';
function lum(h){ const c=[1,3,5].map(i=>parseInt(h.slice(i,i+2),16)/255).map(x=>x<=.03928?x/12.92:Math.pow((x+.055)/1.055,2.4)); return .2126*c[0]+.7152*c[1]+.0722*c[2]; }
function cr(a,b){ try{ const x=lum(a),y=lum(b); return (Math.max(x,y)+.05)/(Math.min(x,y)+.05); }catch(e){ return 1; } }
function onHl(){ return cr('#0B0F1A',S.pal.hl)>=cr('#FFFFFF',S.pal.hl)?'#0B0F1A':'#FFFFFF'; }
function contrastBox(){ const P=Object.fromEntries(Object.entries(S.pal).map(([k,v])=>[k,hx(v)])), rows=[['Text on background',P.text,P.bg],['Highlight word on background',P.hl,P.bg],['Accent on background',P.accent,P.bg],['Pill text on highlight (auto)',onHl(),P.hl]];
  const wt=cr('#FFFFFF',P.hl);
  return `<div class="lbl">Contrast check <span class="r" style="color:var(--dim)">WCAG AA needs 4.5:1</span></div><div class="contrast">${rows.map(([n,f,b])=>{const r=cr(f,b);return `<div class="crow ${r>=4.5?'pass':'fail'}"><span class="sw2" style="color:${hx(f)};background:${hx(b)}" data-t="Aa" role="img" aria-label="Sample"></span><span>${n}</span><b>${r.toFixed(2)}:1 ${r>=4.5?'✓':'✗ too low'}</b></div>`}).join('')}
   ${wt<4.5?`<div class="crow fail"><span class="sw2" style="color:#fff;background:${P.hl}" data-t="Aa" role="img" aria-label="Blocked sample: white on highlight"></span><span>White text on highlight is blocked</span><b>${wt.toFixed(2)}:1</b></div>`:''}</div>`; }
function bundleBanner(){ const bl=bundleList(); if(!bl.length) return ''; return `<div class="infobox st" style="background:rgba(139,92,246,.07);border-color:rgba(139,92,246,.35)">${ic('lock')}<div><b>Forced rule bundle${bl.length>1?'s':''}: ${esc(bl.map(b=>b.name).join(' · '))}</b><br>These settings are locked for ${esc(subName())}: ${[forcedDisc()?(forcedDisc().disclaimer.type==='NFA'?'NFA disclaimer':'disclaimer'):'', claimsOn()?'no-claims rules':'', kidsForced()?'made for kids + YouTube only':'', forcedWords().length?forcedWords().length+' banned words':''].filter(Boolean).join(' · ')}.${blockedGoal()?` <b style="color:#ffb1b5">Your goal (${esc(G(S.goal).n)}) is blocked for this niche.</b>`:''}</div></div>`; }
function marketField(){ const alc=M3.isAlcohol(S); return `<label class="field st" style="max-width:320px;margin-top:12px"><span>Target market${alc?' (sets alcohol age limits)':''}</span><select class="inp" data-in="market">${M3.MARKETS.map(([c,n,a])=>`<option value="${c}" ${S.market===c?'selected':''}>${n}${alc?` · drinking age ${a}`:''}</option>`).join('')}</select></label>`; }
function alcoholWarn(){ if(!M3.isAlcohol(S)) return ''; return `<div class="errbanner st" style="margin-top:12px;background:rgba(255,176,32,.08);border-color:rgba(255,176,32,.5)">${ic('warn')}<div><b>Alcohol niche: never auto-published.</b> ${esc(M3.ALCOHOL_YT)}${S.plat.yt?'':' (YouTube isn\'t selected right now.)'}</div></div>`; }
function topicSection(ro){ const hits=topicHits(), tb=M3.topicBundles(M3.topicText(S));
  return `<div class="lbl st">${ic('spark')}Suggested topics · ${esc(subName())} <span class="r">${REAL?`<span class="badge grn">From research topic seeds</span>`:`<span class="badge warn">Example data, research pending</span>`}</span></div>
    <div class="grid g3">${topics().map((t,i)=>`<button class="card topic st ${S.topic===i?'sel':''}" data-set="topic" data-val="${i}" ${ro?'disabled':''}>${chk(S.topic===i)}<div class="no">TOPIC ${i+1}</div><h3>${esc(t.t)}</h3>${t.h?`<p>${t.h}</p>`:''}
      <div class="meta">${t.s?`<span class="badge grn">Fit ${t.s}</span>`:''}<span class="badge mute">${F().n}</span><span class="badge mute">${S.dur}s</span><span class="badge mute">${S.aspect}</span></div></button>`).join('')}
      <div class="card topic st ${S.topic===-1?'sel':''}" style="border-style:dashed;background:transparent">${chk(S.topic===-1)}<div class="no">YOUR OWN</div><h3 style="color:var(--mute)">Write my own topic</h3>
        <input class="inp" id="ownT" data-in="ownTopic" maxlength="160" aria-label="Your own topic" placeholder="e.g. 5 fruits with more fibre than oats" value="${esc(S.ownTopic)}" style="margin-top:8px" ${ro?'readonly aria-readonly="true"':''}></div></div>
    ${ro?`<p class="muted st" style="margin-top:6px">${ic('lock')} The topic is part of locked v${S.version}. To change it, use "Edit as v${S.version+1}".</p>`:''}
    ${hits.length?`<div class="errbanner st" style="margin-top:10px">${ic('warn')}<div><b>Your topic uses banned words: ${hits.map(esc).join(', ')}.</b> Reword it before you lock.</div></div>`:''}
    ${tb.length?`<div class="infobox st" style="margin-top:10px">${ic('lock')}<div>Your topic triggers the <b>${tb.map(x=>esc((BUNDLES[x]||{name:x}).name||x)).join(' · ')}</b> rule bundle${tb.length>1?'s':''}. Their forced settings now apply.</div></div>`:''}`; }
function canLock(){ return S.aiAck&&S.compAck&&!blockedGoal()&&!topicHits().length&&!(S.topic===-1&&!S.ownTopic.trim()); }
function versionsList(){ if(!S.versions||!S.versions.length) return ''; return `<div class="verlist st"><span class="muted" style="align-self:center">Locked versions (read-only):</span>${S.versions.slice().sort((a,b)=>a.v-b.v).map(v=>`<button class="badge ${v.v===S.version&&S.locked?'grn':'mute'}" data-act="viewver" data-val="${v.v}" title="Open read-only JSON">${ic('lock')}v${v.v} · ${new Date(v.locked_at).toLocaleDateString([], {month:'short',day:'numeric'})} · ${v.intake_hash.slice(0,8)}</button>`).join('')}</div>`; }
function curTopic(){ return S.topic===-1?(S.ownTopic||'Your own topic'):(topics()[S.topic]||topics()[0]).t; }
function reviewWarnings(){ const ws=M3.warnings(intakeSnapshot(), Store.getConnections()); if(!ws.length) return `<div class="okline st">${ic('check')}All connections this intake needs are ready.</div>`;
  return `<div class="warnbox st"><div class="wh">${ic('warn')}<b>${ws.length} connection${ws.length>1?'s':''} missing for these choices</b><span>You can lock now and connect later. Those steps will wait at "Needs you".</span></div>
    ${ws.map(w=>`<a class="wline" href="#/connections?focus=${w.id}"><span>${esc(w.text)}</span><small>${esc(w.why)}</small><b>Fix ${ic('ar')}</b></a>`).join('')}</div>`; }
function costEstimate(){ const w=words(S.dur), ch=Math.round(w*5.8), n=shots(S.dur), sw=Math.ceil(n*0.2);
  return `<div class="panel st cost"><div class="lbl" style="margin-top:0">${ic('dollar')}Cost per video <span class="badge warn" style="text-transform:none;letter-spacing:0">Estimates</span></div>
   <div class="stats" style="margin:0"><div class="stat c"><b>${S.vo?'~'+ch.toLocaleString():'0'}<small>chars</small></b><span>ElevenLabs: about 1 credit per character on Multilingual v2, about half on Flash/Turbo${S.vo?'':' (voiceover off)'}</span></div>
   <div class="stat g"><b>~${n+sw}<small>images</small></b><span>Grok Imagine stills: ${n} shots + ~${sw} swaps</span></div>
   <div class="stat"><b>~${n}<small>clips</small></b><span>Grok Imagine image→video, one per still</span></div>
   <div class="stat"><b>${S.dur}s</b><span>Final length · −14 LUFS</span></div></div>
   <div class="caprow"><label class="field" style="max-width:220px"><span>Daily spend cap per user (USD)</span><input class="inp" type="number" min="1" max="${M3.CAP_MAX}" step="1" data-in="cap" value="${+S.cap||M3.CAP_MAX}"></label><p class="muted">Default and maximum is <b>$20/day</b> (estimated, about $${M3.videoCost(S)} per video). The test build pauses new jobs at the cap with "Needs you" (simulated); in production the cap is enforced server-side and by your bot.</p></div>
   <p class="muted" style="margin-top:8px">Grok Imagine runs on the xAI API, which bills per generation and has rate limits. Check current pricing on your own xAI and ElevenLabs plans. Re-runs and swaps add to these numbers.</p></div>`; }
function compileRules(){ const sb=curSub()||{}, g=G(S.goal), plats=Object.keys(S.plat).filter(k=>S.plat[k]);
  return {rule_set_version:(REAL&&RD.rules.rule_set_version)||'1.2',intake_version:S.version, intake_hash:M3.hash(intakeSnapshot()), goal:{id:S.goal,name:g.full||g.n,cta:S.cta},
    niche:{category:S.niche,sub:S.sub,compliance:sb.risk||null}, topic:curTopic(),
    format:{type:S.format,duration_s:S.dur,aspect:S.aspect,word_budget:words(S.dur),wpm:155,shot_count:shots(S.dur),max_shot_s:2.5},
    canvas:{width:S.aspect==='16:9'?1920:1080,height:S.aspect==='9:16'?1920:1080,safe_zone_px:{top:250,bottom:400},note:'No captions, labels or key subjects inside the safe zones'},
    cta:{count:1,style:'soft',text:S.cta,placement:'last 15% of runtime only',end_card_line_is_not_a_cta:true},
    style_module:{id:S.style,prompt_suffix:ST().sfx,motion:ST().mo},
    voice:S.vo?{provider:'elevenlabs',id:S.voice,language:S.lang,pace:S.pace,energy:S.energy.toLowerCase(),pronunciations:S.pron.length}:{enabled:false},
    brand:{name:S.name,handle:S.handle,palette:S.pal,fonts:[S.fh,S.fb],end_card:S.end},
    captions:{style:S.capStyle,position:S.capPos,counter:S.counter,on_every_frame:true,safe_zone_px:{top:250,bottom:400},affiliate_line:affOn()?M3.AFFILIATE_LINE:null},
    audio:{music:S.music,sfx:S.sfx.toLowerCase(),lufs:-14,true_peak_db:-1},
    rule_bundles_applied:bundleIds(), bundle_rules:Object.fromEntries(bundleList().map(b=>[b.id,Object.fromEntries(['visual_rules','subject_rules','pii','sources','age_gate','cta','affiliate'].filter(f=>b[f]).map(f=>[f,b[f]]).concat(b.publishing?[['auto_publish',b.publishing.auto_publish!==false]]:[]))])), generation_routing:{route:'xai_api',browser_routing_allowed:false}, safety:{banned_words:S.banned,no_claims:claimsOn()?claimRules():false,disclaimer:discOn()?{text:disclaimerText(),locked:highRisk()}:false,cite_sources:true,made_for_kids:kidsOn(), made_for_kids_forced:kidsForced(), made_for_kids_blocked:kidsBlocked()},
    ai_disclosure:{required:true,label:S.aiLabel,labels_on:aiOn(),reason:aiReason(),tools_line:true,acknowledged:S.aiAck,on_screen_tag:S.aiTag||isRealistic(),photoreal:isRealistic(),synthetic_voice:!!S.vo,platforms:aiOn()?Object.fromEntries(plats.map(k=>[k,M3.AI_DISCLOSURE[k].label])):{}},
    affiliate_disclosure:affOn()?{required:true,on_screen:true,in_description:true,text:M3.AFFILIATE_LINE}:null,
    budget:{daily_cap_usd:Math.min(M3.CAP_MAX,+S.cap||M3.CAP_MAX),est_cost_per_video_usd:M3.videoCost(S),enforced_by:'server-side ledger + user Grok Bot in production (simulated here)'}, tiktok:S.plat.tt?{duration_s:S.dur,creator_rewards_eligible:S.dur>60}:null,
    market:{code:S.market,drinking_age:M3.drinkingAge(S.market),facebook_age_min:M3.ageMin(S.market)}, platforms:plats, publish_via:'official APIs only', gates:S.vo?['script','voice','stills','final']:['script','stills','final'], clip_preview:'inside the Master gate (final)', approvals:'hash-locked'}; }

/* load the autosaved draft (validated: it may have been edited in devtools) */
(function(){ const d=window.Store&&Store.getDraft(); if(d&&d.goal&&GOALS.find(g=>g.id===d.goal)) Object.assign(S,sanitizeIntake(d,{keepState:true}),{locking:false,playing:null,ackErr:false}); else S.playing=null; })();
/* ---------- render ---------- */
let changed=null, stepChanged=true;
const A = k => (changed===k && !stepChanged) ? 'reveal' : '';
function render(){
  if(!window.INTAKE_ON) return;
  const fk=stepChanged?null:App.focusKey();
  document.getElementById('rail').innerHTML=rail();
  document.getElementById('mob').innerHTML=mobSteps();
  document.getElementById('sum').innerHTML=summary();
  const m=document.getElementById('content');
  m.innerHTML=VIEWS[S.step]();
  if(S.locked&&S.step<9){ m.classList.add('ro'); m.insertAdjacentHTML('afterbegin',`<div class="errbanner" style="background:rgba(0,194,255,.07);border-color:rgba(0,194,255,.35)">${ic('lock')}<div><b>Read-only: intake v${S.version} is locked.</b> To change anything, go to Review and choose "Edit as v${S.version+1}". v${S.version} stays as it is.</div></div>`);
    m.querySelectorAll('input,select,textarea,button:not([data-go])').forEach(x=>x.disabled=true); } else m.classList.remove('ro');
  m.classList.toggle('enter',stepChanged);
  if(stepChanged){ void m.offsetWidth; m.querySelectorAll('.st').forEach((e,i)=>e.style.setProperty('--i',Math.min(i,14))); document.getElementById('scroll').scrollTop=0; window.scrollTo(0,0); }
  document.getElementById('foot').innerHTML=footer();
  applyPreviewVars(); placePills();
  if(changed){ const r=document.querySelector(`.srow[data-row="${S.step}"]`); r&&r.classList.add('flash'); }
  const stepWasChanged=stepChanged; stepChanged=false; changed=null; S.ackErr=false; saveDraft();
  const imp=document.getElementById('impFile'); if(imp) imp.onchange=e=>{ importIntake(e); e.target.value=''; };
  App.a11y(document.querySelector('.vintake'));
  if(fk) App.refocus(fk); else if(document.activeElement===document.body||!document.activeElement){ const h=document.querySelector('#content h1,#content h2'); if(h&&stepWasChanged){ h.tabIndex=-1; h.focus({preventScroll:true}); } }
}
function placePills(){ document.querySelectorAll('[data-seg]').forEach(s=>{const b=s.querySelector('.sel'),p=s.querySelector('.pill'); if(b){p.style.left=b.offsetLeft+'px';p.style.width=b.offsetWidth+'px';}}); }
function go(n){ n=Math.max(1,Math.min(9,n)); if(n===S.step) return;
  if(n>8 && !S.aiAck && !S.locked){ if(S.step!==8){ S.step=8; stepChanged=true; } S.ackErr=true; S.max=Math.max(S.max,8); history.replaceState(null,'','#/intake/8'); render(); const a=document.getElementById('aiDisc'); a&&a.scrollIntoView({block:'center'}); return; }
  S.step=n; S.max=Math.max(S.max,n); stepChanged=true; history.replaceState(null,'',`#/intake/${n}`); render(); }
function applyPreset(){ const p=PRESETS[S.goal]; if(!p) return; Object.assign(S,{dur:p.dur,format:p.format,plat:Object.assign({yt:false,fb:false,tt:false,ig:false},p.plat)}); if(p.capStyle) S.capStyle=p.capStyle; if(p.energy) S.energy=p.energy; S.presetApplied=S.goal; }
function applyBundles(){ const fw=forcedWords(); S.banned=[...new Set(fw.concat(S.banned.filter(w=>!Object.values(BUNDLES).some(b=>(b.banned_words||[]).includes(w)))))]; if(!fw.length&&!S.banned.length) S.banned=['miracle','guaranteed'];
  if(kidsForced()){ S.kids=true; S.plat={yt:true,fb:false,tt:false,ig:false}; S.kidsBundle=true; }
  else { if(S.kidsBundle){ S.kids=false; const pr=PRESETS[S.goal]; S.plat=Object.assign({yt:false,fb:false,tt:false,ig:false},pr?pr.plat:{yt:true,fb:true,ig:true}); S.kidsBundle=false; }
    if(kidsBlocked()) S.kids=false; }
  if(forcedDisc()) S.disclaimer=true; }
function onNiche(v){ const n=N(v); S.sub=n.subs[0]?n.subs[0][0]:null; const pre=M3.BANNED_PRESET[v]; S.banned=pre?pre.slice():['miracle','guaranteed']; S.kids=false; applyBundles();
  if(REAL){ const f=RD.fit[`${v}/${S.sub}`]; if(f&&f.default&&STYLES.find(x=>x.id===f.default)) S.style=f.default; } S.topic=0; }
function exportIntake(){ const blob=new Blob([JSON.stringify({app:'3x3',kind:'intake',version:1,exported_at:new Date().toISOString(),intake:intakeSnapshot()},null,2)],{type:'application/json'});
  const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=`3x3-intake-${(S.name||'project').toLowerCase().replace(/[^a-z0-9]+/g,'-')}.json`; document.body.appendChild(a); a.click(); a.remove(); }
function importIntake(e){ const f=e.target.files[0]; if(!f) return; const r=new FileReader(); r.onload=()=>{ try{ const o=JSON.parse(r.result); const I=o.intake||o;
    if(!I||typeof I!=='object'||!G(I.goal)||!N(I.niche)) throw new Error('Unknown goal or niche'); const clean=sanitizeIntake(I);
    Object.assign(S,clean); S.locked=false; S.projectId=null; S.max=9; S.aiAck=false; S.compAck=false; applyBundles(); stepChanged=true; render();
    App.toast('Intake imported. Forced rules and the $'+M3.CAP_MAX+'/day cap were re-applied. Confirm the AI disclosure and the compliance check again.'); }
  catch(err){ App.toast('Import failed: '+err.message,'err'); } }; r.readAsText(f); }

function intakeClick(e){
  if(!window.INTAKE_ON) return;
  const g=e.target.closest('[data-go]'); if(g){ e.preventDefault(); go(+g.dataset.go); return; }
  const a=e.target.closest('[data-act]');
  if(a){ const v=a.dataset.val; e.stopPropagation();
    if(S.locked&&!['create','newversion','viewver','acc','export','play','newintake'].includes(a.dataset.act)){ App.toast(`v${S.version} is locked. Use "Edit as v${S.version+1}" on Review.`,'err'); return; }
    switch(a.dataset.act){
      case 'play': { S.playing = S.playing===v?null:v; if(S.playing){ const vv=VOICES.find(x=>x.id===v)||{n:'This voice'}; const eng=App.say(`Hi, I'm ${vv.n}. This is a short sample at your pace and energy for ${S.name||'your brand'}.`, S.pace); S.sample={voice:v, engine:eng}; if(!eng) App.toast('Audio preview isn\'t available in this browser (simulator)','err'); } else if(window.speechSynthesis){ try{ speechSynthesis.cancel(); }catch(e){} } break; }
      case 'tog': if(v==='kids'&&(kidsForced()||kidsBlocked())) return; S[v]=!S[v]; changed=v; break;
      case 'ack': S.aiAck=a.checked; changed='aiAck'; break;
      case 'ailabel': S.aiLabel=S.aiLabel==='always'?'auto':'always'; changed='aiLabel'; break;
      case 'plat': if(kidsForced()&&v!=='yt'){ App.toast('Kids projects publish to YouTube only (COPPA bundle)','err'); return; } S.plat[v]=!S.plat[v]; changed='plat'; break;
      case 'preset': applyPreset(); break;
      case 'delword': if(forcedWords().includes(S.banned[+v])) return; S.banned.splice(+v,1); break;
      case 'sugword': S.banned.push(v); break;
      case 'addword': {const i=document.getElementById('bw'); if(i.value.trim()) S.banned.push(i.value.trim().toLowerCase()); break;}
      case 'delpron': S.pron.splice(+v,1); break;
      case 'addpron': {const w=document.getElementById('pw').value.trim(),p=document.getElementById('pp').value.trim(); if(w&&p) S.pron.push([w,p]); break;}
      case 'acc': document.querySelector('.acc').classList.toggle('open'); S.acc=!S.acc; saveDraft(); return;
      case 'export': exportIntake(); return;
      case 'compack': S.compAck=a.checked; break;
      case 'newversion': { S.locked=false; S.projectId=null; S.version=(S.versions.length?Math.max(...S.versions.map(v=>v.v)):S.version)+1; S.compAck=false; stepChanged=true; history.replaceState(null,'','#/intake/9'); App.toast(`Editing v${S.version}. Earlier versions stay read-only.`); break; }
      case 'viewver': { const vv=S.versions.find(x=>x.v===+v); if(vv){ const w=window.open('', '_blank'); if(w){ w.document.title='3x3 intake v'+vv.v+' (read-only)'; w.document.body.style.cssText='background:#0B0F1A;color:#F5F7FA;font:12px monospace;white-space:pre;padding:16px'; w.document.body.textContent=JSON.stringify(vv,null,2); } } return; }
      case 'lock': if(S.locked||S.locking) return; if(!canLock()){ if(!S.aiAck) go(9); else App.toast(blockedGoal()?'This goal is blocked for this niche':topicHits().length?'Remove banned words from your topic first':!S.compAck?'Tick the compliance check first':'Write your topic first','err'); return; } if(S.step!==9){go(9);} S.locking=true; render();
        setTimeout(()=>{S.locking=false;S.locked=true;S.max=9;S.projectId=null;stepChanged=true; const snap=intakeSnapshot(); S.versions=S.versions.filter(x=>x.v!==S.version).concat([{v:S.version,locked_at:new Date().toISOString(),intake_hash:M3.hash(snap),intake:snap,rules:compileRules()}]);history.replaceState(null,'','#/intake/9');render();},1100); return;
      case 'create': { if(S.projectId && Store.getProject(S.projectId)){ location.hash='#/project/'+S.projectId; return; }
        if(S.topic===-1 && !S.ownTopic.trim()){ App.toast('Write your topic first, or pick a suggested one','err'); document.getElementById('ownT')&&document.getElementById('ownT').focus(); return; }
        const p=Pipeline.create(Object.assign(intakeSnapshot(),{version:S.version}), compileRules(), curTopic(), {goalName:G(S.goal).n, nicheName:`${N(S.niche).n} › ${subName()}`, formatName:F().n, styleName:ST().n, styleBg:ST().bg, voiceName:S.vo?V().n:null});
        S.projectId=p.id; saveDraft(); location.hash='#/project/'+p.id; return; }
      case 'newintake': Object.assign(S, JSON.parse(JSON.stringify(S_DEFAULT)), {playing:null}); stepChanged=true; history.replaceState(null,'','#/intake/1'); break;
    }
    render(); return; }
  const s=e.target.closest('[data-set]');
  if(s&&S.locked){ App.toast(`v${S.version} is locked. Use "Edit as v${S.version+1}" on Review.`,'err'); return; }
  if(s){ const k=s.dataset.set; let v=s.dataset.val; if(k==='dur'||k==='topic') v=+v;
    if(S[k]===v) return; S[k]=v; changed=k; if(k==='voice') S.voicePicked=true;
    if(k==='niche') onNiche(v);
    if(k==='sub'||k==='topic'){ applyBundles(); }
    if(k==='sub'&&REAL){ const f=RD.fit[`${S.niche}/${v}`]; if(f&&f.default&&STYLES.find(x=>x.id===f.default)) S.style=f.default; S.topic=0; }
    render(); }
}
document.addEventListener('click',intakeClick);
document.addEventListener('focusin',e=>{ if(window.INTAKE_ON&&!S.locked&&e.target.id==='ownT'&&S.topic!==-1){ S.topic=-1; document.querySelectorAll('.topic').forEach(t=>t.classList.remove('sel')); e.target.closest('.topic').classList.add('sel'); saveDraft(); } });
document.addEventListener('input',e=>{
  if(!window.INTAKE_ON) return;
  const t=e.target, k=t.dataset.in;
  if(k&&S.locked) return;
  if(k==='cap'){ S.cap=Math.max(1,Math.min(M3.CAP_MAX,Math.round(+t.value||M3.CAP_MAX))); if(+t.value>M3.CAP_MAX) t.value=M3.CAP_MAX; saveDraft(); return; }
  if(k==='ownTopic'){ const before=bundleIds().join(), hb=topicHits().join(); S.ownTopic=t.value.slice(0,160); if(S.topic!==-1) S.topic=-1;
    if(bundleIds().join()!==before||topicHits().join()!==hb){ applyBundles(); S.compAck=false; render(); } else { document.getElementById('foot').innerHTML=footer(); const lb=document.querySelector('.lockbtn'); if(lb) lb.disabled=!canLock(); saveDraft(); } return; }
  if(k==='market'&&!S.voicePicked){ S.voice=voiceFor(t.value); S.playing=S.voice; }
  if(k){ S[k]= k==='pace'?+t.value:t.value; if(k==='pace'){document.getElementById('paceV').textContent=S.pace.toFixed(2)+'×';}
    document.querySelectorAll(`[data-bind="${k}"]`).forEach(el=>el.textContent=t.value);
    applyPreviewVars(); document.getElementById('sum').innerHTML=summary(); document.getElementById('rail').innerHTML=rail(); saveDraft(); return; }
  if(t.dataset.col){ const r=t.dataset.col; S.pal[r]=t.value.toUpperCase(); document.querySelector(`[data-hex="${r}"]`).value=S.pal[r]; t.parentElement.style.background=t.value; applyPreviewVars(); document.getElementById('sum').innerHTML=summary(); const cb=document.getElementById('contrastBox'); if(cb) cb.innerHTML=contrastBox(); saveDraft(); }
  if(t.dataset.hex && /^#[0-9a-f]{6}$/i.test(t.value)){ const r=t.dataset.hex; S.pal[r]=t.value.toUpperCase(); const sw=document.querySelector(`[data-sw="${r}"]`); sw.style.background=t.value; sw.querySelector('input').value=t.value; applyPreviewVars(); document.getElementById('sum').innerHTML=summary(); const cb=document.getElementById('contrastBox'); if(cb) cb.innerHTML=contrastBox(); saveDraft(); }
});
document.addEventListener('change',e=>{ if(window.INTAKE_ON&&e.target.tagName==='SELECT'&&e.target.dataset.in) e.target.dispatchEvent(new Event('input',{bubbles:true})); });
window.addEventListener('resize',()=>window.INTAKE_ON&&placePills());

window.Intake = {
  html(){ return `<div class="body"><aside class="rail" id="rail"></aside><main class="main"><div class="mob-steps" id="mob"></div><div class="scroll" id="scroll"><div id="content"></div></div><div class="foot" id="foot"></div></main><aside class="sum" id="sum"></aside></div>`; },
  mount(step){ window.INTAKE_ON=true; if(!window._bundlesApplied){ window._bundlesApplied=true; if(!S.locked) applyBundles(); } if(step){ S.step=Math.max(1,Math.min(9,step)); if(S.step>8&&!S.aiAck&&!S.locked) { S.step=8; } S.max=Math.max(S.max,S.step); } stepChanged=true; render(); },
  unmount(){ window.INTAKE_ON=false; },
  state:S, snapshot:intakeSnapshot, voiceFor, aiOn, aiReason, fitSeeds, topics, capSample, rerender(){ if(window.INTAKE_ON){ render(); } },
  reset(){ Object.assign(S, JSON.parse(JSON.stringify(S_DEFAULT)), {playing:null}); },
};
