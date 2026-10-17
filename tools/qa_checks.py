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
    ok('alcohol_modes', modes); ok('alcohol_all_private', all(('private' in m or 'unpublished' in m or 'held' in m) for m in modes) and len(modes) == 4)
    ok('alcohol_needs_you_age_gate', s == 'needs' and pg.locator('[data-x="age18"]').count() == 4 and pg.is_disabled('[data-x="ageconfirm"]'))
    pg.locator('#stage-publish').scroll_into_view_if_needed(); pg.screenshot(path=str(O/'31-alcohol-age-gate.png'))
    for i in range(4): pg.locator('[data-x="age18"]').nth(i).check(); pg.wait_for_timeout(150)
    pg.click('[data-x="ageconfirm"]'); pg.wait_for_timeout(300); ok('alcohol_done_after_18_confirm', wait(pg, pid, 'publish', ('done',), 3) == 'done')
    # 5. spend cap: burst of jobs pauses at $20
    E(pg, "Store.resetSpend()"); pid2 = pid
    E(pg, f"(()=>{{for(let i=0;i<40;i++) Pipeline.start(Store.getProject('{pid2}'),'video',{{force:true}})}})()"); pg.wait_for_timeout(300)
    sp = E(pg, "Store.spentToday()"); st = E(pg, f"Store.getProject('{pid2}').stages.video")
    ok('cap_spend_le_20', sp <= 20.0001); ok('cap_needs_you', st['status'] == 'needs' and bool(st.get('capHit')))
    pg.locator('#stage-video').scroll_into_view_if_needed(); pg.wait_for_timeout(300); pg.screenshot(path=str(O/'32-spend-cap-needs-you.png'))
    # 6. a11y: axe + focus retention + hex ring
    pg = page(); connect(pg); A = {}
    def axe(name): pg.add_script_tag(content=AXE); A[name] = E(pg, "axe.run(document,{resultTypes:['violations']}).then(r=>r.violations.filter(v=>['serious','critical'].includes(v.impact)).map(v=>({id:v.id,impact:v.impact,n:v.nodes.length,t:v.nodes.slice(0,3).map(n=>n.target.join(' '))})))")
    for i in range(1, 9): hash(pg, f'#/intake/{i}', 500); axe(f'intake{i}')
    E(pg, "Intake.state.aiAck=true"); hash(pg, '#/intake/9', 500); axe('intake9'); lock(pg); axe('intake9-locked')
    pg.click('[data-act="create"]'); pg.wait_for_timeout(1500); axe('project')
    for h in ['#/projects', '#/connections', '#/onboarding']: hash(pg, h, 500); axe(h)
    serious = {k: v for k, v in A.items() if v}; ok('axe_no_serious_critical', not serious)
    if serious: print(json.dumps(serious, indent=1))
    pg2 = page(); hash(pg2, '#/intake/8', 500)
    pg2.locator('.tog[data-val="noClaims"], .tog[data-val="kids"]').first.focus(); pg2.keyboard.press('Space'); pg2.wait_for_timeout(300)
    ok('focus_kept_after_toggle', E(pg2, "document.activeElement.classList.contains('tog')"))
    hash(pg2, '#/intake/3', 500); pg2.locator('[data-set="dur"]').nth(1).focus(); pg2.keyboard.press('Enter'); pg2.wait_for_timeout(300)
    ok('focus_kept_after_card_pick', E(pg2, "document.activeElement.dataset.set==='dur'"))
    hash(pg2, '#/intake/6', 500); pg2.locator('.hex').first.focus()
    ok('hex_focus_ring', E(pg2, "(()=>{const c=getComputedStyle(document.activeElement);return c.outlineStyle!=='none'&&parseFloat(c.outlineWidth)>0})()"))
    # 7. mobile banner
    m = page(390, 844); hash(m, '#/intake/8', 500); m.mouse.wheel(0, 3000); m.wait_for_timeout(400)
    bn = E(m, "(()=>{const t=document.querySelector('.testbar'),s=t.querySelector('span'),r=t.getBoundingClientRect();return {top:r.top,spanVisible:getComputedStyle(s).display!=='none'&&s.offsetHeight>0,scrollY:scrollY}})()")
    ok('mobile_banner', bn); ok('mobile_banner_sticky_and_text', bn['top'] >= -1 and bn['spanVisible'] and bn['scrollY'] > 0)
    m.screenshot(path=str(O/'m7-banner-sticky-390.png'))
    ok('page_errors', errs or 'none'); ok('no_real_key_in_storage', not E(m, "Object.values(localStorage).some(v=>/(sk|xai)[-_][A-Za-z0-9]{16,}/.test(v))"))
    b.close()
json.dump({'results': R, 'axe': A, 'errors': errs}, open(O/'qa_checks.json', 'w'), indent=1, default=str)
