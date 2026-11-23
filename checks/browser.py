import os
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 page=browser.new_page(viewport={'width':1440,'height':1000}); errors=[]
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto(os.environ.get('STUDIO_URL','http://127.0.0.1:3000'));page.wait_for_selector('#mode:text("offline")')
 def state():return page.evaluate("JSON.parse(localStorage.getItem('absolute-mayhem.world.v1')).w")
 def press(k):page.locator('canvas').focus();page.keyboard.press(k)
 def edit(s):page.locator('#prompt').fill(s);page.locator('#apply').click()
 def same(a,b):
  for k in ['player','vars','entities','rules','timers','revision']:assert a[k]==b[k],k
 press('s');press('e');assert state()['vars']['flame']==1
 before=state();page.locator('#examples button').first.click();page.locator('#apply').click()
 w=state();assert w['revision']==1 and w['player']==before['player'] and w['vars']==before['vars']
 bell=w['entities']['bell_1'];rect=page.locator('canvas').bounding_box()
 def click_obj(x,y):
  page.mouse.click(rect['x']+(315+(x-y)*24)*rect['width']/760,rect['y']+(95+(x+y)*10-12)*rect['height']/420)
 click_obj(bell['x'],bell['y']);page.wait_for_function("JSON.parse(localStorage.getItem('absolute-mayhem.world.v1')).w.entities.span_a.on")
 mid=state();page.locator('#examples button').nth(1).click();page.locator('#apply').click()
 now=state();assert now['revision']==2 and now['player']==mid['player'] and now['timers']==mid['timers'] and now['vars']==mid['vars']
 page.reload();same(now,state());page.locator('#undo').click();same(mid,state())
 a=state();edit('Give the ocean telepathy');assert 'supports' in page.locator('#toast').inner_text();same(a,state())
 page.wait_for_function("!JSON.parse(localStorage.getItem('absolute-mayhem.world.v1')).w.entities.span_a.on",timeout=11000)
 click_obj(6,3);page.wait_for_function("JSON.parse(localStorage.getItem('absolute-mayhem.world.v1')).w.vars.aligned===1")
 click_obj(12,4);page.wait_for_selector('#objective:text("meridian is restored")');assert state()['vars']['awake']==1
 page.locator('#details').click();assert 'Responding: None' in page.locator('#dialogbody').inner_text();page.locator('#close').click()
 page.set_viewport_size({'width':390,'height':844});assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
 assert not errors,errors
 print('Chromium PASS: movement, ignite, local bell trigger, timed bridge, active timer rewrite, progress/position, reload, undo, rejection, expiry, lens, crossing, orrery, provider indicator, mobile width')
 browser.close()
