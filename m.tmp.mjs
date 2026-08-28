import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await b.newPage({ viewport:{width:900,height:1300}, deviceScaleFactor:2 });
await p.goto('http://localhost:4173/logo/card/1/', { waitUntil:'networkidle' });
console.log(await p.evaluate(() => {
  const vc=document.querySelector('.vc'); const box=vc.getBoundingClientRect(); const mm=box.height/297;
  const at=e=>`${((e.getBoundingClientRect().top-box.top)/mm).toFixed(1)} … ${((e.getBoundingClientRect().bottom-box.top)/mm).toFixed(1)}`;
  const o={};
  for (const [k,s] of Object.entries({кадр:'.vc-frame',логотип:'.vc-mark',заголовок:'.vc-offer',
    самовывоз:'.vc-kicker',карточки:'.vc-cards',выноска:'.vc-call',контакты:'.vc-contacts',реквизиты:'.vc-legal'}))
    o[k]=at(vc.querySelector(s));
  const f=vc.querySelector('.vc-frame').getBoundingClientRect();
  const m=vc.querySelector('.vc-mark').getBoundingClientRect();
  o.кадр_габарит=`${(f.width/mm).toFixed(1)}×${(f.height/mm).toFixed(1)} мм, левый край ${((f.left-box.left)/mm).toFixed(1)}`;
  o.логотип_отступы=`слева ${((m.left-f.left)/mm).toFixed(1)}, снизу ${((f.bottom-m.bottom)/mm).toFixed(1)}, размер ${(m.width/mm).toFixed(1)}×${(m.height/mm).toFixed(1)}`;
  const body=vc.querySelector('.vc-body');
  o.перелив=body.scrollHeight-body.clientHeight;
  return o;
}));
await p.locator('.vc').screenshot({ path:'/tmp/claude-0/-home-user-element/ad81a4a0-be22-5501-865e-399fe70f69de/scratchpad/vc4.png' });
await b.close();
