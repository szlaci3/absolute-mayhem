import os
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--enable-unsafe-swiftshader'])
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
 bell=w['entities']['bell_1']
 assert page.locator('#graphics-error').is_hidden()
 def screen_point(x,y,height):
  return page.evaluate('''async ([x,z,height]) => {
   const {createCamera}=await import('/scene.js');
   const {Vector3}=await import('three');
   const rect=document.querySelector('canvas').getBoundingClientRect();
   const camera=createCamera(rect.width/rect.height);
   const p=new Vector3(x,height,z).project(camera);
   return [rect.left+(p.x+1)*rect.width/2,rect.top+(1-p.y)*rect.height/2];
  }''',[x,y,height])
 def click_obj(x,y,height=.65):
  page.mouse.click(*screen_point(x,y,height))
 # Orbiting changes where the lens appears, without moving the explorer.
 lens=screen_point(6,3,.85)
 page.mouse.move(*lens);page.wait_for_selector('#hover-name:text("Meridian lens")')
 page.mouse.down();page.mouse.move(lens[0]+95,lens[1]+8,steps=4);page.mouse.up()
 page.mouse.move(*lens);page.wait_for_selector('#hover-name:text("Meridian lens")',state='hidden')
 same(w,state())
 page.locator('#reset-camera').click()
 page.mouse.move(*lens);page.wait_for_selector('#hover-name:text("Meridian lens")')
 click_obj(bell['x']-.21,bell['y'],.96);page.wait_for_function("JSON.parse(localStorage.getItem('absolute-mayhem.world.v1')).w.entities.span_a.on")
 mid=state();page.locator('#examples button').nth(1).click();page.locator('#apply').click()
 now=state();assert now['revision']==2 and now['player']==mid['player'] and now['timers']==mid['timers'] and now['vars']==mid['vars']
 page.reload();same(now,state());page.locator('#undo').click();same(mid,state())
 page.wait_for_function("!JSON.parse(localStorage.getItem('absolute-mayhem.world.v1')).w.entities.span_a.on",timeout=11000)
 a=state();edit('Give the ocean telepathy');assert 'supports' in page.locator('#toast').inner_text();same(a,state())
 click_obj(6,3);page.wait_for_function("JSON.parse(localStorage.getItem('absolute-mayhem.world.v1')).w.vars.aligned===1")
 click_obj(12,4);page.wait_for_selector('#objective:text("meridian is restored")');assert state()['vars']['awake']==1
 page.locator('#details').click();assert 'Responding: None' in page.locator('#dialogbody').inner_text();page.locator('#close').click()
 page.set_viewport_size({'width':390,'height':844});assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
 assert not errors,errors
 print('Chromium PASS: WebGL, orbit, camera reset, 3D picking, movement, ignite, local bell trigger, timed bridge, active timer rewrite, progress/position, reload, undo, rejection, expiry, lens, crossing, orrery, provider indicator, mobile width')
 browser.close()
