import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await b.newPage({ viewport:{width:900,height:1300}, deviceScaleFactor:2 });
await p.goto('http://localhost:4173/logo/card/1/', { waitUntil:'networkidle' });
const r = await p.evaluate(() => {
  const vc=document.querySelector('.vc'); const box=vc.getBoundingClientRect(); const mm=box.height/297;
  const at=e=>{const b=e.getBoundingClientRect();return `${((b.top-box.top)/mm).toFixed(1)} … ${((b.bottom-box.top)/mm).toFixed(1)}`;};
  const o={};
  for (const [k,s] of Object.entries({кадр:'.vc-frame',логотип:'.vc-seam',заголовок:'.vc-offer',
    самовывоз:'.vc-kicker',карточки:'.vc-cards',выноска:'.vc-call',контакты:'.vc-contacts',реквизиты:'.vc-legal'}))
    o[k]=at(vc.querySelector(s));
  const f=vc.querySelector('.vc-frame').getBoundingClientRect();
  const k=getComputedStyle(vc.querySelector('.vc-kicker'));
  o.кадрГабарит=`${(f.width/mm).toFixed(1)}×${(f.height/mm).toFixed(1)} мм, левый край ${((f.left-box.left)/mm).toFixed(1)} мм`;
  o.радиусКадра=getComputedStyle(vc.querySelector('.vc-frame')).borderRadius;
  o.радиусКарточки=getComputedStyle(vc.querySelector('.vc-card')).borderRadius;
  o.строкаСамовывоза=`${k.fontSize} / ${k.color} / ${k.textTransform} / ${k.letterSpacing} / ${k.textDecorationLine}`;
  o.переливТела=vc.querySelector('.vc-body').scrollHeight-vc.querySelector('.vc-body').clientHeight;
  return o;
});
console.log(r);
await p.locator('.vc').screenshot({ path:'/tmp/claude-0/-home-user-element/ad81a4a0-be22-5501-865e-399fe70f69de/scratchpad/vc2.png' });
await b.close();
