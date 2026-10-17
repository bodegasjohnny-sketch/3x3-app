from playwright.sync_api import sync_playwright
errs=[]
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox'])
    pg=b.new_page(viewport={'width':1440,'height':900})
    pg.on('pageerror',lambda e:errs.append('PAGEERR '+str(e))); pg.on('console',lambda m: m.type=='error' and errs.append(m.text))
    for h in ['#/intake/1','#/intake/2','#/intake/5','#/intake/6','#/intake/7','#/intake/8','#/intake/9','#/projects','#/connections','#/onboarding']:
        pg.goto('http://localhost:8765/?static=1'+h); pg.wait_for_timeout(500)
    b.close()
print(errs or 'no errors')
