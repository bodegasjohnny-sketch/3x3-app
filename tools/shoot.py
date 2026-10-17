"""End-to-end click-through + screenshots. Usage: python3 tools/shoot.py [base_url]"""
import sys, json
from pathlib import Path
from playwright.sync_api import sync_playwright
BASE = (sys.argv[1] if len(sys.argv) > 1 else 'http://localhost:8765/').rstrip('/') + '/?static=1'
O = Path(__file__).resolve().parent.parent / 'shots'; O.mkdir(exist_ok=True)
errs, log = [], []
def L(*a): log.append(' '.join(map(str, a))); print(*a, flush=True)
with sync_playwright() as p:
    b = p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
    ctx = b.new_context(viewport={'width':1440, 'height':900}, accept_downloads=True)
    pg = ctx.new_page(); pg.on('dialog', lambda d: d.accept())
    pg.on('pageerror', lambda e: errs.append('PAGEERR ' + str(e))); pg.on('console', lambda m: m.type == 'error' and errs.append(m.text))
    shot = lambda n, full=False: (pg.wait_for_timeout(350), pg.screenshot(path=str(O/f'{n}.png'), full_page=full), L('shot', n))
    pg.goto(BASE + '#/intake/1'); pg.evaluate('localStorage.clear()'); pg.reload(); pg.wait_for_timeout(600)
    shot('01-intake-goal')
    pg.click('[data-act="preset"]'); pg.wait_for_timeout(200)
    names = ['niche','format','style','voice','brand','captions']
    for i, n in enumerate(names):
        pg.click('.foot .btn.pri'); pg.wait_for_timeout(450); shot(f'0{i+2}-intake-{n}')
    # step 8: try to continue without ack -> blocked
    pg.click('.foot .btn.pri'); pg.wait_for_timeout(400)
    assert '#/intake/8' in pg.url, pg.url
    pg.click('.foot .btn.pri'); pg.wait_for_timeout(400); assert '#/intake/8' in pg.url, 'should be blocked without AI ack'
    L('step 8 gate OK')
    pg.check('#aiDisc input[type=checkbox]'); pg.wait_for_timeout(300); shot('08-intake-safety-ai', True)
    pg.click('.foot .btn.pri'); pg.wait_for_timeout(500); assert '#/intake/9' in pg.url
    assert pg.is_disabled('.lockbtn'), 'lock must need compliance ack'
    pg.check('[data-act="compack"]'); pg.wait_for_timeout(300); shot('09-intake-review', True)
    pg.click('.lockbtn'); pg.wait_for_timeout(1700); shot('10-intake-locked')
    pg.click('.next [data-act="create"]'); pg.wait_for_timeout(1500)
    assert '#/project/' in pg.url; L('project', pg.url)
    shot('11-project-needs-you')
    # connections
    pg.click('a.tab[href="#/connections"]'); pg.wait_for_timeout(500); shot('12-connections-missing')
    # worker onboarding (simulated): URL + routine key (fake only) -> signing secret shown once -> test job
    pg.fill('#w-url', 'https://bot.example.test/routines/3x3/webhook'); pg.fill('#w-key', 'sk_' + 'a'*40); pg.click('[data-x="wsave"]'); pg.wait_for_timeout(250)
    msg = pg.inner_text('#err-worker'); L('real-looking key rejected:', msg[:70]); assert 'rejected' in msg
    pg.fill('#w-url', 'https://bot.example.test/routines/3x3/webhook'); pg.fill('#w-key', 'test_routine_1'); pg.click('[data-x="wsave"]'); pg.wait_for_timeout(300)
    sec = pg.inner_text('#sigsec'); L('signing secret shown once:', sec[:14] + '…')
    store = pg.evaluate('JSON.stringify(localStorage)'); assert sec not in store and 'test_routine_1' not in store and 'sk_aaaa' not in store, 'secrets must not be stored'
    pg.locator('#conn-worker').scroll_into_view_if_needed(); shot('12b-connections-worker-secret')
    pg.click('[data-x="wfailnext"]'); pg.check('[data-x="wsaved"]'); pg.click('[data-x="wtest"]'); pg.wait_for_timeout(1800)
    assert "couldn't reach your bot" in pg.inner_text('#conn-worker'); L('worker failure message OK')
    pg.click('[data-x="wtest"]'); pg.wait_for_timeout(1800)
    assert 'Worker connected' in pg.inner_text('#conn-worker'); L('worker connected OK')
    for c in ['imagine','elevenlabs']:
        pg.click(f'[data-x="simstatus"][data-c="{c}"][data-v="connected"]'); pg.wait_for_timeout(250)
    pg.click('[data-x="oauth"][data-c="tiktok"]'); pg.wait_for_timeout(300); shot('13-connections-oauth-popup')
    pg.click('[data-x="oauthallow"]'); pg.wait_for_timeout(300)
    for c in ['youtube','facebook','instagram']:
        pg.click(f'[data-x="oauth"][data-c="{c}"]'); pg.wait_for_timeout(250); pg.click('[data-x="oauthallow"]'); pg.wait_for_timeout(250)
    L('tiktok status:', pg.inner_text('#conn-tiktok .kv b')[:60])
    pg.evaluate('window.scrollTo(0,0); document.getElementById("page").scrollTop=0'); shot('14-connections-connected')
    # back to project: should auto-resume
    pg.go_back(); pg.wait_for_timeout(200)
    pid = pg.evaluate("Store.listProjects()[0].id"); pg.goto(BASE + '#/project/' + pid); pg.wait_for_timeout(300)
    pg.evaluate('Sim3x3.speed=3')
    def st(k): return pg.evaluate(f"(()=>{{const p=Store.getProject('{pid}');return Pipeline.eff(p,'{k}')}})()")
    def wait_for(k, s, t=15000):
        pg.wait_for_function(f"(()=>{{const p=Store.getProject('{pid}');return Pipeline.eff(p,'{k}')==='{s}'}})()", timeout=t)
    wait_for('script', 'awaiting'); shot('15-project-script-approval', True)
    for k in ['script','voice','stills','final']:
        wait_for(k, 'awaiting')
        if k == 'script': pg.evaluate("("+"(pid=>{const p=Store.getProject(pid),B=p.stages.script.output.beats,pace=+p.intake.pace||1,dur=p.intake.dur,V='keep receipts sorted weekly and compare totals before payday so every peso has a clear job'.split(' '),cta=B[B.length-1].line.split(/\\s+/).length,need=Math.max(4,Math.round(((dur-0.08-0.12*B.length)*155*pace/60-cta)/(B.length-1)));return Pipeline.editScript(pid,B.map((b,i)=>i<B.length-1?Array.from({length:need},(_,j)=>V[(j+i)%V.length]).join(' ')+'.':b.line))})"+")('"+pid+"')"); pg.wait_for_timeout(300)
        pg.click(f'[data-x="approve"][data-k="{k}"]'); pg.wait_for_timeout(300); L('approved', k)
        if k == 'stills': pass
    wait_for('publish', 'needs'); shot('16-project-publish-choice', True)
    # hash-lock demo: swap a still after everything approved
    pg.click('[data-x="swap"][data-i="2"]'); wait_for('stills', 'awaiting')
    L('after swap:', st('stills'), st('video'), st('final')); assert st('video') == 'stale' and st('final') == 'stale'
    pg.evaluate("document.getElementById('stage-video').scrollIntoView({block:'center'})"); shot('17-project-reapproval-needed')
    pg.click('[data-x="approve"][data-k="stills"]'); pg.wait_for_timeout(300)
    pg.click('[data-x="regen"][data-k="video"]'); wait_for('video', 'done'); pg.wait_for_timeout(300)   # no Video gate: clips are previewed inside the Master gate
    # failure + retry demo on final
    pg.click('[data-x="failnext"]'); pg.click('[data-x="regen"][data-k="final"]'); wait_for('final', 'failed')
    pg.locator('#stage-final').scroll_into_view_if_needed(); shot('18-project-failed-retry')
    pg.click('[data-x="retry"][data-k="final"]'); wait_for('final', 'awaiting'); pg.click('[data-x="approve"][data-k="final"]')
    wait_for('publish', 'needs'); pg.click('[data-x="queue"]'); wait_for('publish', 'done')
    pg.evaluate('document.getElementById("page").scrollTop=0'); shot('19-project-complete', True)
    pg.click('a.tab[href="#/projects"]'); pg.wait_for_timeout(400); shot('20-projects')
    pg.click('a.tab[href="#/onboarding"]'); pg.wait_for_timeout(500); shot('21-onboarding', True)
    # rotate signing secret (suspected leak) -> back to step 2
    pg.click('a.tab[href="#/connections"]'); pg.wait_for_timeout(400); pg.click('[data-x="rotate"][data-leak="1"]'); pg.wait_for_timeout(400)
    L('after rotate worker:', pg.evaluate("Store.getConnection('worker').status")); pg.locator('#conn-worker').scroll_into_view_if_needed(); shot('21b-connections-rotated')
    pg.check('[data-x="wsaved"]'); pg.click('[data-x="wtest"]'); pg.wait_for_timeout(1800); L('re-connected:', pg.evaluate("Store.getConnection('worker').status"))
    # intake versioning
    pg.goto(BASE + '#/intake/9'); pg.wait_for_timeout(500); pg.click('[data-act="newversion"]'); pg.wait_for_timeout(400)
    L('version now', pg.evaluate('Intake.state.version'), 'locked versions', pg.evaluate('Intake.state.versions.length'))
    # alcohol niche warning
    ax = b.new_context(viewport={'width':1440,'height':900}); ap = ax.new_page()
    ap.goto(BASE + '#/intake/2'); ap.wait_for_timeout(400); ap.click('[data-set="niche"][data-val="history_culture"]'); ap.wait_for_timeout(200); ap.click('[data-set="sub"][data-val="liquor_history"]'); ap.wait_for_timeout(300)
    L('alcohol warning shown:', 'never auto-published' in ap.inner_text('#content')); ap.screenshot(path=str(O/'24-alcohol-warning.png')); ax.close()
    # forced rule bundles (fresh context)
    bx = b.new_context(viewport={'width':1440,'height':900}); bp = bx.new_page(); bp.on('pageerror', lambda e: errs.append('B PAGEERR ' + str(e)))
    bp.goto(BASE + '#/intake/2'); bp.wait_for_timeout(500)
    bp.click('[data-set="niche"][data-val="finance"]'); bp.wait_for_timeout(200); bp.click('[data-set="sub"][data-val="crypto_basics"]'); bp.wait_for_timeout(200)
    bp.goto(BASE + '#/intake/1'); bp.wait_for_timeout(300); bp.click('[data-set="goal"][data-val="affiliate"]'); bp.wait_for_timeout(200)
    bp.goto(BASE + '#/intake/8'); bp.wait_for_timeout(500); bp.check('#aiDisc input[type=checkbox]'); bp.wait_for_timeout(200)
    r = bp.evaluate("({disc:document.querySelector('.disc')&&document.querySelector('.disc').textContent, discLocked:!!document.querySelector('.trow .tog.locked[aria-disabled]'), forced:document.querySelectorAll('.chip.word.forced').length})")
    L('crypto bundle:', r); assert r['discLocked'] and 'Not financial advice' in (r['disc'] or '')
    bp.screenshot(path=str(O/'22-bundle-crypto-safety.png'), full_page=True)
    bp.goto(BASE + '#/intake/9'); bp.wait_for_timeout(400); bp.check('[data-act="compack"]'); bp.wait_for_timeout(200)
    L('crypto+affiliate lock disabled:', bp.is_disabled('.lockbtn')); assert bp.is_disabled('.lockbtn')
    bp.goto(BASE + '#/intake/2'); bp.wait_for_timeout(300); bp.click('[data-set="niche"][data-val="kids_learning"]'); bp.wait_for_timeout(200)
    bp.goto(BASE + '#/intake/8'); bp.wait_for_timeout(400)
    k = bp.evaluate("({kids:Intake.state.kids, plat:Intake.state.plat, kidsLocked:[...document.querySelectorAll('.tog.locked')].length, disabledPlats:document.querySelectorAll('.plat[disabled]').length})")
    L('kids bundle:', k); assert k['kids'] and k['disabledPlats'] == 3
    bp.screenshot(path=str(O/'23-bundle-kids-safety.png'), full_page=True); bx.close()
    # mobile
    m = b.new_context(viewport={'width':390, 'height':844}, device_scale_factor=2, is_mobile=True, has_touch=True)
    mp = m.new_page(); mp.on('pageerror', lambda e: errs.append('M PAGEERR ' + str(e)))
    state = pg.evaluate('JSON.stringify(Object.fromEntries(Object.keys(localStorage).map(k=>[k,localStorage.getItem(k)])))')
    mp.goto(BASE + '#/intake/1'); mp.evaluate(f'(s=>{{const o=JSON.parse(s);for(const k in o)localStorage.setItem(k,o[k])}})({json.dumps(state)})')
    for n, h in [('m1-intake-goal', '#/intake/1'), ('m2-intake-brand', '#/intake/6'), ('m3-intake-safety', '#/intake/8'), ('m4-project', '#/project/' + pid), ('m5-connections', '#/connections'), ('m6-onboarding', '#/onboarding')]:
        mp.goto(BASE + h); mp.reload(); mp.wait_for_timeout(700); mp.screenshot(path=str(O/f'{n}-390.png'))
        mp.screenshot(path=str(O/f'{n}-390-full.png'), full_page=True); L('shot', n)
        ow = mp.evaluate('document.documentElement.scrollWidth'); 
        if ow > 392: L('WARN horizontal overflow', n, ow)
    # check mobile step chips fully visible
    mp.goto(BASE + '#/intake/1'); mp.reload(); mp.wait_for_timeout(500)
    cut = mp.evaluate("[...document.querySelectorAll('.mob-steps button')].filter(b=>{const r=b.getBoundingClientRect();return r.right>window.innerWidth+1||r.left<-1}).length")
    L('mobile step chips cut off:', cut)
    b.close()
L('ERRORS:', errs or 'none')
(O/'run-log.txt').write_text('\n'.join(log))
