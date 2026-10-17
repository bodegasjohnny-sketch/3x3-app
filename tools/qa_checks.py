"""Regression checks for QA site-pass2 items (XSS, import, topic, alcohol, cap, a11y). Usage: python3 tools/qa_checks.py [base] [axe.min.js]"""
import sys, json, time
from pathlib import Path
from playwright.sync_api import sync_playwright
BASE = (sys.argv[1] if len(sys.argv) > 1 else 'http://localhost:8765/').rstrip('/') + '/?static=1'
AXE = Path(sys.argv[2] if len(sys.argv) > 2 else '/tmp/axe.min.js').read_text()
O = Path(__file__).resolve().parent.parent / 'shots'; R = {}; errs = []; dialogs = []
def ok(k, v): R[k] = v; print(('PASS ' if v is True else 'INFO ' if v is not False else 'FAIL ') + k, '' if isinstance(v, bool) else v, flush=True)
with sync_playwright() as p:
    b = p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
    def page(w=1440, h=900):
        ctx = b.new_context(viewport={'width':w, 'height':h}); pg = ctx.new_page()
        pg.on('dialog', lambda d: (dialogs.append(d.message), d.accept())); pg.on('pageerror', lambda e: errs.append(str(e)))
        pg.goto(BASE + '#/intake/1'); pg.evaluate('localStorage.clear()'); pg.reload(); pg.wait_for_timeout(500); return pg
    E = lambda pg, js: pg.evaluate(js)
    AX = {}
    def axe_on(pg, name): pg.add_script_tag(content=AXE); AX[name] = E(pg, "axe.run(document,{resultTypes:['violations']}).then(r=>r.violations.filter(v=>['serious','critical'].includes(v.impact)).map(v=>({id:v.id,n:v.nodes.length,t:v.nodes.slice(0,3).map(n=>n.target.join(' '))})))")
    def hash(pg, h, t=400): E(pg, f"location.hash={json.dumps(h)}"); pg.wait_for_timeout(t)
    def connect(pg):
        hash(pg, '#/connections')
        for c in ['worker','imagine','elevenlabs','youtube','facebook','tiktok','instagram']:
            l = pg.locator(f'[data-x="simstatus"][data-c="{c}"][data-v="connected"]')
            if l.count(): l.first.click(); pg.wait_for_timeout(100)
        E(pg, "['youtube','facebook','tiktok','instagram'].forEach(c=>Store.saveConnection(c,{status:'connected',account:'@test'})); Store.saveConnection('worker',{status:'connected'})")
    def lock(pg):
        hash(pg, '#/intake/8'); E(pg, "Intake.state.aiAck=true"); hash(pg, '#/intake/9'); E(pg, "Intake.rerender()")
        if not E(pg, 'Intake.state.compAck'): pg.check('[data-act="compack"]'); pg.wait_for_timeout(200)
        if pg.is_disabled('.lockbtn'): return False
        pg.click('.lockbtn'); pg.wait_for_timeout(1500); return E(pg, 'Intake.state.locked')
    def wait(pg, pid, k, sts=('awaiting','done','needs','failed'), t=20):
        end = time.time() + t
        while time.time() < end:
            s = E(pg, f"Pipeline.eff(Store.getProject('{pid}'),'{k}')")
            if s in sts: return s
            pg.wait_for_timeout(200)
        return s
    # 1. XSS: pronunciation list + import JSON
    pg = page(); hash(pg, '#/intake/5')
    pg.fill('#pw', '<img src=x onerror=alert("pron")>'); pg.fill('#pp', '<b>x</b>'); pg.click('[data-act="addpron"]'); pg.wait_for_timeout(300)
    pg.reload(); pg.wait_for_timeout(600); hash(pg, '#/intake/5')
    ok('xss_pron_no_alert', not any('pron' in d for d in dialogs) and pg.locator('.pron img').count() == 0)
    bad = {"app":"3x3","intake":{"goal":"affiliate","niche":"finance","sub":"crypto_basics","pal":{"bg":"red;\"><img src=x onerror=alert('pal')>","hl":"#16C784"},
           "pron":[["<img src=x onerror=alert('imp')>","x"]],"aspect":"9:16\"><img src=x onerror=alert('asp')>","dur":"45<img>","cap":1000000,"aiAck":True,"compAck":True,
           "disclaimer":False,"banned":[],"plat":{"yt":True,"tt":True}}}
    Path('/tmp/bad.json').write_text(json.dumps(bad)); E(pg, 'Intake.state.aiAck=true'); hash(pg, '#/intake/9'); pg.set_input_files('#impFile', '/tmp/bad.json'); pg.wait_for_timeout(500)
    hash(pg, '#/intake/6'); hash(pg, '#/intake/5'); hash(pg, '#/intake/9')
    st = E(pg, "JSON.parse(JSON.stringify(Intake.state))")
    ok('xss_import_no_alert', not any(k in ' '.join(dialogs) for k in ['pal','imp','asp']))
    ok('import_resets_acks', st['aiAck'] is False and st['compAck'] is False)
    ok('import_cap_clamped_20', st['cap'] == 20)
    ok('import_pal_validated', st['pal']['bg'] == '#0B0F1A')
    ok('import_crypto_bundle_reapplied', E(pg, "Intake.state.disclaimer===true") and all(w in st['banned'] for w in ['100x','airdrop']))
    E(pg, 'Intake.state.aiAck=true'); hash(pg, '#/intake/8'); hash(pg, '#/intake/9'); E(pg, 'Intake.rerender()')
    ok('import_affiliate_blocked_for_crypto', pg.is_disabled('.lockbtn', timeout=3000))
    # 2. custom topic screening + word boundaries
    pg = page(); hash(pg, '#/intake/1'); pg.click('[data-set="goal"][data-val="affiliate"]'); hash(pg, '#/intake/2')
    pg.click('[data-set="niche"][data-val="business_tech"]') if pg.locator('[data-set="niche"][data-val="business_tech"]').count() else None
    E(pg, 'Intake.state.aiAck=true'); hash(pg, '#/intake/9'); pg.fill('#ownT', '100x guaranteed crypto airdrop'); pg.wait_for_timeout(400)
    tb = E(pg, "M3.topicBundles(M3.topicText(Intake.state))")
    ok('topic_triggers_crypto', 'crypto' in tb); ok('topic_bundle_rules', E(pg, "Intake.snapshot().disclaimer===true"))
    ok('topic_banned_hits_block_lock', pg.is_disabled('.lockbtn') and 'banned words' in pg.inner_text('#content'))
    pg.screenshot(path=str(O/'30-topic-crypto-blocked.png'), full_page=True)
    fp = E(pg, "['Beginner budgeting','How engines work','Origin of the drum','Spectrum of light','Livestock farming','Chocolate bars'].map(t=>[t,M3.topicBundles(t)]).filter(x=>x[1].includes('alcohol')||x[1].includes('crypto'))")
    ok('word_boundaries_no_false_alcohol', fp == []); ok('rum_still_matches', E(pg, "M3.topicBundles('History of rum in the Caribbean').includes('alcohol')"))
    # 3. topic read-only after lock
    pg.fill('#ownT', '5 facts about the moon landing'); pg.wait_for_timeout(300)
    ok('locks_with_clean_topic', lock(pg)); ro = E(pg, "(()=>{const i=document.getElementById('ownT');return !!i&&i.readOnly})()")
    h1 = E(pg, "Intake.snapshot().ownTopic"); pg.locator('#ownT').type('XYZ') if not ro else None
    ok('topic_readonly_after_lock', ro and E(pg, "Intake.snapshot().ownTopic") == h1)
    # 4. alcohol: private drafts everywhere, age gate, affiliate blocked, disclaimer
    pg = page(); connect(pg); hash(pg, '#/intake/1'); pg.click('[data-set="goal"][data-val="affiliate"]'); hash(pg, '#/intake/2')
    pg.click('[data-set="niche"][data-val="history_culture"]'); pg.wait_for_timeout(200); pg.click('[data-set="sub"][data-val="liquor_history"]'); pg.wait_for_timeout(200)
    E(pg, "Intake.state.plat={yt:true,fb:true,tt:true,ig:true}"); hash(pg, '#/intake/9'); E(pg, "Intake.rerender()")
    ok('alcohol_affiliate_blocked', not lock(pg))
    hash(pg, '#/intake/1'); pg.click('[data-set="goal"][data-val="yt_monetization"]'); E(pg, "Intake.state.plat={yt:true,fb:true,tt:true,ig:true}")
    ok('alcohol_locks_other_goal', lock(pg)); rules = E(pg, "Intake.state.versions.slice(-1)[0].rules")
    ok('alcohol_disclaimer', rules['safety']['disclaimer']['text'])
    ok('alcohol_bundle_applied', 'alcohol' in rules['rule_bundles_applied'])
    pg.click('[data-act="create"]'); pg.wait_for_timeout(600); pid = E(pg, "location.hash.split('/')[2]"); E(pg, "Sim3x3.speed=3")
    for k in ['script','stills','video','final']:
        wait(pg, pid, k, ('awaiting',)); pg.locator(f'#stage-{k} [data-x="approve"]').click(); pg.wait_for_timeout(300)
    wait(pg, pid, 'publish', ('needs',)); pg.locator('[data-x="queue"]').click(); s = wait(pg, pid, 'publish', ('needs','done'))
    modes = E(pg, f"Store.getProject('{pid}').stages.publish.output.results.map(r=>r.plat+': '+r.mode)")
    ok('alcohol_modes', modes)
    exp = {'yt':'uploaded private', 'tt':'TikTok inbox', 'fb':'held by 3x3', 'ig':'held by 3x3'}
    ok('alcohol_modes_v26', len(modes) == 4 and all(exp[m.split(':')[0]] in m for m in modes))
    ok('alcohol_needs_you_per_platform_confirm', s == 'needs' and pg.locator('[data-x="ageconfirm"]').count() == 4 and pg.locator('[data-x="agekeep"]').count() == 4)
    logs = E(pg, f"Store.getProject('{pid}').log.map(l=>l.text).join(' | ')")
    ok('alcohol_upload_log_v28_wording', '3x3 leaves it private; visibility is your decision' in logs and 'TikTok sent to inbox drafts' in logs and 'keep private' in logs and 'never makes alcohol public' not in logs and 'confirm each post' not in logs)
    E(pg, f"Pipeline.download('{pid}')"); pg.wait_for_timeout(300)
    dl = E(pg, f"(()=>{{const st=Store.getProject('{pid}').stages.publish;return {{status:st.status, gate:!!st.ageGate, dl:!!st.downloadedAt, out:!!(st.output&&st.output.downloaded)}}}})()")
    ok('alcohol_download_leaves_publish_not_done', dl == {'status':'needs','gate':True,'dl':True,'out':False})
    pg.locator('#stage-publish').scroll_into_view_if_needed(); pg.screenshot(path=str(O/'31-alcohol-age-gate.png')); axe_on(pg, 'project-alcohol-age-gate')
    # (1) Facebook: Page age restriction is checked BEFORE answering
    ok('alcohol_fb_answer_disabled_until_page_check', pg.is_disabled('[data-x="ageconfirm"][data-p="fb"]'))
    E(pg, f"Pipeline.confirmAgeGate('{pid}','fb','age_restricted')"); ok('alcohol_fb_api_refuses_without_page_check', not E(pg, f"!!Store.getProject('{pid}').stages.publish.ageGate.confirmed.fb"))
    pg.check('[data-x="fbpage"]'); pg.wait_for_timeout(250); pg.click('[data-x="ageconfirm"][data-p="fb"]'); pg.wait_for_timeout(300)
    after = E(pg, f"(()=>{{const st=Store.getProject('{pid}').stages.publish;return {{status:st.status, fb:st.output.results.find(r=>r.plat==='fb').mode, call:st.ageGate.confirmed.fb}}}})()")
    ok('alcohol_fb_confirm_age_gate_5_args', after['call']['rpc'] == 'confirm_age_gate' and len(after['call']['args']) == 5 and after['call']['args'][4] == 'age_restricted')
    ok('alcohol_fb_server_publish_age_min_ai_flag', 'age_min=18' in after['fb'] and 'is_ai_generated=true' in after['fb'] and after['call']['page_check_at'])
    # (2) YouTube copy: stays private, never told to publish
    yt_copy = E(pg, "M3.ALCOHOL_STEPS.yt + ' ' + M3.ALCOHOL_AFTER.yt + ' ' + M3.ALCOHOL_YT")
    ok('alcohol_yt_copy_v28_leaves_private', '3x3 leaves it private; visibility is your decision' in yt_copy and 'it stays private' not in yt_copy and 'publish it in YouTube' not in yt_copy and 'publish in YouTube Studio' not in yt_copy)
    ok('confirm_age_gate_text_version_m4_seed', after['call']['args'][3] == 'agt_2026_10_v1')
    tt_copy = E(pg, "[M3.ALCOHOL_STEPS.tt, M3.ALCOHOL_KEPT.tt, M3.ALCOHOL_AFTER.tt, M3.ALCOHOL_YT, M3.PUBLISH_NOTE].join(' || ')")
    card = pg.inner_text('#stage-publish')
    ok('alcohol_tt_copy_v28', 'Only me' not in tt_copy and 'Only me' not in card and 'your choice' in E(pg, "M3.ALCOHOL_STEPS.tt") and "don't post the draft (or delete it)" in E(pg, "M3.ALCOHOL_STEPS.tt")
       and 'unposted or deleted' in E(pg, "M3.ALCOHOL_KEPT.tt") and 'set Audience controls 18+ first, then choose the visibility yourself' in E(pg, "M3.ALCOHOL_YT"))
    ok('alcohol_tt_steps_from_v28_pack', E(pg, "RS_DATA.bundles.alcohol.publishing.manual_steps.tiktok === M3.ALCOHOL_STEPS.tt && M3.ALCOHOL_STEPS.tt.includes('Once 18+ is set, who can view the post is your choice')"))
    ok('alcohol_never_tells_user_make_public', not any(x in (tt_copy + ' ' + yt_copy + ' ' + card).lower() for x in ['make it public','set it to public','post it to everyone','set who can view to everyone']))
    # (4) kept_private passes the 5th arg; (1) keep private exists for FB/IG and sends nothing
    pg.click('[data-x="agekeep"][data-p="ig"]'); pg.wait_for_timeout(250)
    ig = E(pg, f"(()=>{{const st=Store.getProject('{pid}').stages.publish;return {{mode:st.output.results.find(r=>r.plat==='ig').mode, call:st.ageGate.confirmed.ig}}}})()")
    ok('alcohol_ig_keep_private_nothing_sent', 'nothing sent' in ig['mode'] and ig['call']['args'][4] == 'kept_private' and ig['call']['final'] is True)
    pg.click('[data-x="agekeep"][data-p="yt"]'); pg.wait_for_timeout(250)
    ytm = E(pg, f"Store.getProject('{pid}').stages.publish.output.results.find(r=>r.plat==='yt').mode")
    ok('alcohol_yt_keep_private_never_public', 'kept private' in ytm and 'never made public' in ytm)
    ok('alcohol_not_done_until_all_answered', E(pg, f"Store.getProject('{pid}').stages.publish.status") == 'needs')
    pg.locator('#stage-publish').scroll_into_view_if_needed(); pg.screenshot(path=str(O/'31b-alcohol-answers.png'))
    pg.click('[data-x="ageconfirm"][data-p="tt"]'); pg.wait_for_timeout(250)
    ok('alcohol_done_after_all_answers', wait(pg, pid, 'publish', ('done',), 3) == 'done')
    ok('confirm_age_gate_rejects_bad_outcome', E(pg, "(()=>{try{M3.confirm_age_gate('p','fb','h','v','confirm');return false}catch(e){return true}})()"))
    # (3) age_min by market
    ok('age_min_by_market', E(pg, "['PH','US','CA','KR','JP','TH','GB','OTHER'].map(m=>M3.ageMin(m)).join()") == '18,21,21,21,21,21,18,18')
    # 4c. kids flag must not carry over: kids -> true crime -> liquor_history -> lock
    pk = page(); hash(pk, '#/intake/2'); pk.click('[data-set="niche"][data-val="kids_learning"]'); pk.wait_for_timeout(200)
    k1 = E(pk, "Intake.snapshot().kids")
    pk.click('[data-set="niche"][data-val="mystery"]'); pk.wait_for_timeout(200); pk.click('[data-set="sub"][data-val="true_crime_historical"]'); pk.wait_for_timeout(200)
    k2 = E(pk, "[Intake.snapshot().kids, JSON.stringify(Intake.snapshot().plat)]")
    pk.click('[data-set="niche"][data-val="history_culture"]'); pk.wait_for_timeout(200); pk.click('[data-set="sub"][data-val="liquor_history"]'); pk.wait_for_timeout(200)
    hash(pk, '#/intake/1'); pk.click('[data-set="goal"][data-val="yt_monetization"]'); pk.wait_for_timeout(150)
    ok('kids_on_in_kids_niche', k1 is True); ok('kids_off_after_true_crime', k2[0] is False and k2[1] != '{"yt":true,"fb":false,"tt":false,"ig":false}')
    ok('kids_lock_liquor', lock(pk)); kr = E(pk, "Intake.state.versions.slice(-1)[0].rules.safety")
    ok('kids_false_after_kids_truecrime_liquor_lock', kr['made_for_kids'] is False)
    hash(pk, '#/intake/9'); pk.click('[data-act="newversion"]'); pk.wait_for_timeout(300); hash(pk, '#/intake/2')
    pk.click('[data-set="niche"][data-val="kids_learning"]'); pk.wait_for_timeout(200)
    Path('/tmp/nokids.json').write_text(json.dumps({"app":"3x3","intake":{"goal":"yt_monetization","niche":"science_space","plat":{"yt":True}}}))
    E(pk, 'Intake.state.aiAck=true'); hash(pk, '#/intake/9'); pk.set_input_files('#impFile', '/tmp/nokids.json'); pk.wait_for_timeout(500)
    ok('import_without_kids_field_is_false', E(pk, "Intake.snapshot().kids") is False)
    # 4d. topic evasion
    ev = E(pk, """(()=>{const pos={'c r y p t o coins':'crypto','crypt0':'crypto','cryp-to':'crypto','Bitcoins':'crypto','whiskies':'alcohol','\u0441rypto':'crypto','\uff43\uff52\uff59\uff50\uff54\uff4f':'crypto','Doge coin price':'crypto','Solana':'crypto','10x gains':'crypto','1 0 0 x returns':'crypto','\u0392\u0399\u03a4CO\u0399\u039d':'crypto','11quor':'alcohol','I1quor':'alcohol','Iiquor history':'alcohol','&#99;rypto presale':'crypto','&#x63;rypto':'crypto','&amp;#99;rypto':'crypto','wh&iacute;sky':'alcohol','&lt;b&gt;spirits':'alcohol','Spirits of Scotland':'alcohol','hard seltzer boom':'alcohol','100x your money':'crypto','moonshine':'alcohol','liquors':'alcohol','b1tc01n':'crypto'};
      const neg=['Beginner budgeting','How engines work','Origin of the drum','Spectrum of light','Livestock farming','Solar system','Cryptography basics','Holy spirit','Gingerbread','Rumors debunked','4x4 trucks','Doge Palace Venice','100x zoom camera','10x10 grid','2x speed','Liquid crystals','Spiritual retreats','Wholesale','Female','Finale','Rationale','Lily pads','Illinois','Silly songs','Million dollar'];
      return {miss:Object.entries(pos).filter(([t,b])=>!M3.topicBundles(t).includes(b)).map(x=>x[0]), fp:neg.filter(t=>M3.topicBundles(t).length), banned:M3.bannedHits('1 0 0 x g u a r a n t e e d',['guaranteed','100x'])}})()""")
    ev2 = E(pk, "({cure:M3.bannedHits('A cure-all tonic',['cure']), cureNo:M3.bannedHits('Curious cats',['cure']), il:M3.bannedHits('Gu4r4nteed I1fe hacks',['life'])})")
    ok('banned_cure_all_hyphen_split', ev2['cure'] == ['cure'] and ev2['cureNo'] == [] and ev2['il'] == ['life'])
    ok('topic_evasion_caught', ev['miss'] == []); ok('topic_no_false_positives', ev['fp'] == []); ok('topic_spaced_banned_words', sorted(ev['banned']) == ['100x','guaranteed'])
    if ev['miss'] or ev['fp']: print(ev)
    # 4e. routine key / URL rules
    kc = E(pk, "[M3.checkKey('test-abc').ok, M3.checkKey('test_abc').ok, M3.checkUrl('https://user:pass@bot.example.test/hook').ok, M3.checkUrl('https://bot.example.test/hook').ok]")
    ok('routine_key_rules', kc == [False, True, False, True])
    hash(pk, '#/intake/6'); E(pk, "Intake.rerender()")
    ok('maxlength_on_text_inputs', E(pk, "[...document.querySelectorAll('#content input.inp[data-in]')].filter(i=>i.type==='text'||!i.type).every(i=>i.maxLength>0)"))
    # 4b. TikTok audit: inbox before; after audit, non-alcohol direct post needs a privacy choice (no default)
    pg3 = page(); connect(pg3); E(pg3, "Intake.state.plat={yt:false,fb:false,tt:true,ig:false}; Intake.state.aiAck=true")
    lock(pg3); pg3.click('[data-act="create"]'); pg3.wait_for_timeout(600); pid3 = E(pg3, "location.hash.split('/')[2]"); E(pg3, "Sim3x3.speed=3")
    for k in ['script','stills','video','final']:
        wait(pg3, pid3, k, ('awaiting',)); pg3.locator(f'#stage-{k} [data-x="approve"]').click(); pg3.wait_for_timeout(300)
    wait(pg3, pid3, 'publish', ('needs',))
    ok('tiktok_inbox_before_audit', 'inbox' in E(pg3, f"Pipeline.publishTargets(Store.getProject('{pid3}'))[0].mode") and pg3.locator(f'#ttpriv-{pid3}').count() == 0)
    pg3.click('[data-x="ttaudit"]'); pg3.wait_for_timeout(300)
    axe_on(pg3, 'project-tiktok-privacy-dropdown')
    ok('tiktok_privacy_dropdown_no_default', E(pg3, f"document.getElementById('ttpriv-{pid3}').value") == '')
    pg3.click('[data-x="queue"]'); pg3.wait_for_timeout(300); ok('tiktok_queue_blocked_without_privacy', E(pg3, f"Pipeline.eff(Store.getProject('{pid3}'),'publish')") == 'needs')
    pg3.select_option(f'#ttpriv-{pid3}', 'FOLLOWER_OF_CREATOR'); pg3.click('[data-x="queue"]'); wait(pg3, pid3, 'publish', ('done',))
    ok('tiktok_direct_post_with_chosen_privacy', E(pg3, f"Store.getProject('{pid3}').stages.publish.output.results[0].mode"))
    pg3.locator('#stage-publish').scroll_into_view_if_needed(); pg3.screenshot(path=str(O/'33-tiktok-after-audit.png'))
    # 4f. rapid regenerate: one active job per step, charged once
    E(pg, "Store.resetSpend()"); before = E(pg, "Store.listJobs().length")
    E(pg, f"(()=>{{for(let i=0;i<15;i++) Pipeline.regenerate('{pid}','stills')}})()"); pg.wait_for_timeout(200)
    rr = E(pg, f"[Store.listJobs().length, Store.spentToday(), M3.stageCost('stills', Store.getProject('{pid}').intake)]")
    ok('rapid_regenerate_one_job', rr[0] - before == 1); ok('rapid_regenerate_charged_once', abs(rr[1] - rr[2]) < 1e-6)
    wait(pg, pid, 'stills', ('awaiting',))
    # 5. spend cap: burst of jobs pauses at $20
    E(pg, "Store.resetSpend()"); pid2 = pid
    for i in range(6):
        E(pg, f"Pipeline.start(Store.getProject('{pid2}'),'video',{{force:true}})"); wait(pg, pid2, 'video', ('awaiting','needs','failed'))
        if E(pg, f"!!Store.getProject('{pid2}').stages.video.capHit"): break
    sp = E(pg, "Store.spentToday()"); st = E(pg, f"Store.getProject('{pid2}').stages.video")
    ok('cap_spend_le_20', sp <= 20.0001); ok('cap_needs_you', st['status'] == 'needs' and bool(st.get('capHit')))
    pg.locator('#stage-video').scroll_into_view_if_needed(); pg.wait_for_timeout(300); pg.screenshot(path=str(O/'32-spend-cap-needs-you.png'))
    # pass-4 fixes: publish reads compiled made_for_kids; alcohol Download leaves Publish not done
    kr = E(pg, """(()=>{const base={id:'x',intake:{plat:{yt:true,fb:true,tt:true,ig:true},kids:true,dur:45,niche:'science_space'},rules:{rule_bundles_applied:[],safety:{made_for_kids:false}}};
      const a=Pipeline.publishTargets(base).map(r=>r.plat).join(); base.intake.kids=false; base.rules.safety.made_for_kids=true;
      const b=Pipeline.publishTargets(base).map(r=>r.plat+(r.kids?'*':'')).join(); return {a,b}})()""")
    ok('publish_targets_use_compiled_made_for_kids', kr['a'] == 'yt,fb,tt,ig' and kr['b'] == 'yt*')
    ok('tt_direct_uses_compiled_made_for_kids', E(pg, "(()=>{Store.setFlag('tiktok_direct_post_audited',true);const p={intake:{plat:{tt:true},kids:true,niche:'science_space'},rules:{safety:{made_for_kids:false}}};const r=Pipeline.ttDirect(p);p.rules.safety.made_for_kids=true;const r2=Pipeline.ttDirect(p);Store.setFlag('tiktok_direct_post_audited',false);return r&&!r2})()"))
    # alcohol log names only the selected platforms (no TikTok here)
    pa = page(); connect(pa); hash(pa, '#/intake/1'); pa.click('[data-set="goal"][data-val="yt_monetization"]'); hash(pa, '#/intake/2')
    pa.click('[data-set="niche"][data-val="history_culture"]'); pa.wait_for_timeout(200); pa.click('[data-set="sub"][data-val="liquor_history"]'); pa.wait_for_timeout(200)
    E(pa, "Intake.state.plat={yt:true,fb:true,tt:false,ig:true}"); lock(pa); pa.click('[data-act="create"]'); pa.wait_for_timeout(600); pid2 = E(pa, "location.hash.split('/')[2]"); E(pa, "Sim3x3.speed=3")
    for k in ['script','stills','video','final']:
        wait(pa, pid2, k, ('awaiting',)); pa.locator(f'#stage-{k} [data-x="approve"]').click(); pa.wait_for_timeout(300)
    wait(pa, pid2, 'publish', ('needs',)); pa.locator('[data-x="queue"]').click(); wait(pa, pid2, 'publish', ('needs','done'))
    alog = E(pa, f"Store.getProject('{pid2}').log.map(l=>l.text).find(t=>t.startsWith('Alcohol bundle'))") or ''
    ok('alcohol_log_only_selected_platforms', 'TikTok' not in alog and 'YouTube uploaded private' in alog and 'Facebook and Instagram held by 3x3' in alog)
    ok('alcohol_log_text', alog)
    # Hackathon topic cases (pass 4 68/75 list and spot-check af42f13 95/120 list), verbatim in tools/hackathon_topic_cases.json
    HC = json.loads((Path(__file__).resolve().parent / 'hackathon_topic_cases.json').read_text())
    acc_pos, acc_neg = set(HC['accepted']['pos']), set(HC['accepted']['neg'])
    for nm, pos, neg in [('68', HC['pos68'], HC['neg75']), ('95', HC['pos95'], HC['neg120'])]:
        r = E(pa, f"(([pos,neg])=>({{miss:Object.entries(pos).filter(([t,b])=>!M3.topicBundles(t).includes(b)).map(x=>x[0]), fp:[...new Set(neg.filter(t=>M3.topicBundles(t).length))]}}))({json.dumps([pos, neg])})")
        ok(f'hackathon_topic_{nm}_counts', f"caught {len(pos)-len(r['miss'])}/{len(pos)}, false positives {len(r['fp'])}/{len(set(neg))} (unique); miss {r['miss']}, fp {r['fp']}")
        ok(f'hackathon_topic_{nm}_only_accepted', set(r['miss']) <= acc_pos and set(r['fp']) <= acc_neg)
    named = E(pa, """(()=>{const pos=['DOGE','Doge','100X','1000x','1 0 0 x','DOGE army','doge 100x','doge kanye','next 100x','1OOx gem','%63rypto','%D1%81rypto','Doge Palace doge coin pump'];
      const neg=['Doge Palace gift shop prices','Doge Palace tickets: how to buy',"Doge's Palace Venice",'100x zoom camera','100x microscope money saving','high spirits','evil spirits in folklore','Sol-gel chemistry','wine-dark sea in Homer','Ale-xander the great','soju-less','ale-wife','Soi Cowboy Bangkok','cure-all','Trading cards','Mead lake','Cider press history','Kidnapping of Persephone myth'];
      return {miss:pos.filter(t=>!M3.topicBundles(t).includes('crypto')), fp:neg.filter(t=>M3.topicBundles(t).length)}})()""")
    ok('topic_pass4_named_misses_caught', named['miss'] == []); ok('topic_pass4_named_false_positives_clean', named['fp'] == [])
    if named['miss'] or named['fp']: print(named)
    ok('banned_cure_all_still_caught_after_hyphen_restriction', E(pa, "M3.bannedHits('Cure-All tonic',['cure']).length===1 && M3.bannedHits('secure procurement',['cure']).length===0"))
    # (5) stuck routine reset card
    ps = page(); hash(ps, '#/connections', 500)
    ok('stuck_card_hidden_by_default', ps.locator('#conn-stuck').count() == 0)
    ps.click('[data-x="stucksim"]'); ps.wait_for_timeout(300)
    txt = ps.inner_text('#conn-stuck') if ps.locator('#conn-stuck').count() else ''
    ok('stuck_card_shows', "isn't picking up jobs" in txt and 'keyset.v1.json' in txt and 'keyset_expired' in txt)
    ps.screenshot(path=str(O/'34-stuck-routine-card.png'), full_page=False)
    ps.click('[data-x="stuckback"]'); ps.wait_for_timeout(250); ok('stuck_card_recopy_when_flag_returns', 'Re-copy the routine' in ps.inner_text('#conn-stuck'))
    ps.click('[data-x="stuckoff"]'); ps.wait_for_timeout(200); ps.click('[data-x="stucksim"]'); ps.wait_for_timeout(200); ps.click('[data-x="stuckcheck"]'); ps.wait_for_timeout(300)
    ok('stuck_card_clears_after_check', ps.locator('#conn-stuck').count() == 0)
    ps.click('[data-x="stucksim"]'); ps.wait_for_timeout(200); ps.click('[data-x="stucksim"]'); ps.wait_for_timeout(200); ps.click('[data-x="stucksim"]'); ps.wait_for_timeout(200)
    ok('stuck_template_outdated_needs_recopy', 'template_outdated' in ps.inner_text('#conn-stuck') and 'Re-copy the routine' in ps.inner_text('#conn-stuck'))
    ps.add_script_tag(content=AXE); AX['connections-stuck-card'] = E(ps, "axe.run(document,{resultTypes:['violations']}).then(r=>r.violations.filter(v=>['serious','critical'].includes(v.impact)).map(v=>({id:v.id,n:v.nodes.length,t:v.nodes.slice(0,3).map(n=>n.target.join(' '))})))")
    # 6. a11y: axe + focus retention + hex ring
    pg = page(); connect(pg); A = {}
    def axe(name): pg.add_script_tag(content=AXE); A[name] = E(pg, "axe.run(document,{resultTypes:['violations']}).then(r=>r.violations.filter(v=>['serious','critical'].includes(v.impact)).map(v=>({id:v.id,impact:v.impact,n:v.nodes.length,t:v.nodes.slice(0,3).map(n=>n.target.join(' '))})))")
    for i in range(1, 9): hash(pg, f'#/intake/{i}', 500); axe(f'intake{i}')
    E(pg, "Intake.state.aiAck=true"); hash(pg, '#/intake/9', 500); axe('intake9'); lock(pg); axe('intake9-locked')
    pg.click('[data-act="create"]'); pg.wait_for_timeout(1500); axe('project')
    for h in ['#/projects', '#/connections', '#/onboarding']: hash(pg, h, 500); axe(h)
    A.update(AX); serious = {k: v for k, v in A.items() if v}; ok('axe_no_serious_critical', not serious)
    if serious: print(json.dumps(serious, indent=1))
    pg2 = page(); hash(pg2, '#/intake/8', 500)
    pg2.locator('.tog[data-val="noClaims"], .tog[data-val="kids"]').first.focus(); pg2.keyboard.press('Space'); pg2.wait_for_timeout(300)
    ok('focus_kept_after_toggle', E(pg2, "document.activeElement.classList.contains('tog')"))
    hash(pg2, '#/intake/3', 500); pg2.locator('[data-set="dur"]').nth(1).focus(); pg2.keyboard.press('Enter'); pg2.wait_for_timeout(300)
    ok('focus_kept_after_card_pick', E(pg2, "document.activeElement.dataset.set==='dur'"))
    hash(pg2, '#/intake/6', 500); pg2.locator('.hex').first.focus()
    ok('hex_focus_ring', E(pg2, "(()=>{const c=getComputedStyle(document.activeElement);return c.outlineStyle!=='none'&&parseFloat(c.outlineWidth)>0})()"))
    # 6b. axe at 390px
    mm = page(390, 844); connect(mm)
    for i in [1, 6, 8]:
        hash(mm, f'#/intake/{i}', 500); mm.add_script_tag(content=AXE); A[f'390-intake{i}'] = E(mm, "axe.run(document,{resultTypes:['violations']}).then(r=>r.violations.filter(v=>['serious','critical'].includes(v.impact)).map(v=>({id:v.id,n:v.nodes.length,t:v.nodes.slice(0,3).map(n=>n.target.join(' '))})))")
    E(mm, "Intake.state.aiAck=true"); lock(mm); mm.click('[data-act="create"]'); mm.wait_for_timeout(2500)
    for h in [None, '#/connections', '#/onboarding']:
        if h: hash(mm, h, 500)
        mm.add_script_tag(content=AXE); A['390-' + (h or 'project')] = E(mm, "axe.run(document,{resultTypes:['violations']}).then(r=>r.violations.filter(v=>['serious','critical'].includes(v.impact)).map(v=>({id:v.id,n:v.nodes.length,t:v.nodes.slice(0,3).map(n=>n.target.join(' '))})))")
    serious390 = {k: v for k, v in A.items() if k.startswith('390') and v}; ok('axe_390_no_serious_critical', not serious390)
    if serious390: print(json.dumps(serious390, indent=1))
    # 7. mobile banner
    m = page(390, 844); hash(m, '#/intake/8', 500); m.mouse.wheel(0, 3000); m.wait_for_timeout(400)
    bn = E(m, "(()=>{const t=document.querySelector('.testbar'),s=t.querySelector('span'),r=t.getBoundingClientRect();return {top:r.top,spanVisible:getComputedStyle(s).display!=='none'&&s.offsetHeight>0,scrollY:scrollY}})()")
    ok('mobile_banner', bn); ok('mobile_banner_sticky_and_text', bn['top'] >= -1 and bn['spanVisible'] and bn['scrollY'] > 0)
    m.screenshot(path=str(O/'m7-banner-sticky-390.png'))
    ok('page_errors', errs or 'none'); ok('no_real_key_in_storage', not E(m, "Object.values(localStorage).some(v=>/(sk|xai)[-_][A-Za-z0-9]{16,}/.test(v))"))
    b.close()
json.dump({'results': R, 'axe': A, 'errors': errs}, open(O/'qa_checks.json', 'w'), indent=1, default=str)
