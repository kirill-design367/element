import { chromium } from 'playwright';
const OUT='/tmp/claude-0/-home-user-Ai-Agent/ae36228a-3a88-5d5f-ba6c-41e656162fdc/scratchpad/shots';
const BASE='http://localhost:4173';
const b = await chromium.launch();

// ── 1. Клавиатура: у каждого элемента в табе должен быть видимый фокус ──
{
  const ctx = await b.newContext({ viewport:{width:1440,height:900} });
  const p = await ctx.newPage();
  await p.goto(`${BASE}/`, {waitUntil:'networkidle'});
  const bad=[]; const seen=[];
  for (let i=0;i<28;i++){
    await p.keyboard.press('Tab');
    const info = await p.evaluate(()=>{
      const el=document.activeElement; if(!el||el===document.body) return null;
      const s=getComputedStyle(el);
      const r=el.getBoundingClientRect();
      return {tag:el.tagName, text:(el.textContent||'').trim().slice(0,28),
        outline:s.outlineStyle+' '+s.outlineWidth, w:Math.round(r.width), h:Math.round(r.height)};
    });
    if(!info) continue;
    seen.push(info.text||info.tag);
    if(info.outline.startsWith('none')) bad.push(info);
  }
  console.log('таб-обход, элементов:', seen.length);
  console.log('без видимого фокуса:', bad.length ? JSON.stringify(bad) : 'нет');
  await p.screenshot({path:`${OUT}/qa-focus.png`});
  await ctx.close();
}

// ── 2. Размеры целей нажатия на телефоне ──
{
  const ctx = await b.newContext({ viewport:{width:390,height:844}, isMobile:true, hasTouch:true });
  const p = await ctx.newPage();
  for (const url of ['/', '/catalog/']) {
    await p.goto(BASE+url, {waitUntil:'networkidle'});
    const small = await p.evaluate(()=>{
      const out=[];
      document.querySelectorAll('a,button,select,input,textarea').forEach(el=>{
        const r=el.getBoundingClientRect();
        if(r.width===0||r.height===0) return;
        if(r.height<40||r.width<24) out.push({t:(el.textContent||el.getAttribute('aria-label')||el.tagName).trim().slice(0,30), w:Math.round(r.width), h:Math.round(r.height)});
      });
      return out;
    });
    console.log(`цели меньше 40px по высоте на ${url}:`, small.length? JSON.stringify(small.slice(0,8)) : 'нет');
  }
  await ctx.close();
}

// ── 3. prefers-reduced-motion: никаких перелётов ──
{
  const ctx = await b.newContext({ viewport:{width:1440,height:900}, reducedMotion:'reduce' });
  const p = await ctx.newPage();
  await p.goto(`${BASE}/`, {waitUntil:'networkidle'});
  await p.waitForTimeout(600);
  const card = p.locator('a[href*="category=shcheben"]').last();
  await card.scrollIntoViewIfNeeded();
  await card.click();
  await p.waitForTimeout(120);
  const overlays = await p.evaluate(()=>document.querySelectorAll('body > div[aria-hidden="true"][style*="position:fixed"]').length);
  console.log('reduced-motion: наложений перелёта', overlays, '| адрес', p.url ? '' : '');
  console.log('reduced-motion URL:', p.url());
  await p.screenshot({path:`${OUT}/qa-reduced-motion.png`});
  await ctx.close();
}

// ── 4. Заявка-список: добавление, объём, удаление, форма ──
{
  const ctx = await b.newContext({ viewport:{width:1440,height:900} });
  const p = await ctx.newPage();
  await p.goto(`${BASE}/catalog/`, {waitUntil:'networkidle'});
  await p.waitForTimeout(400);
  const buttons = p.locator('article button:has-text("В заявку")');
  await buttons.nth(0).click();
  await p.keyboard.press('Escape');
  await buttons.nth(3).click();
  await p.waitForTimeout(400);
  const count = await p.locator('[role="dialog"] li').count();
  console.log('позиций в заявке:', count);
  await p.locator('[role="dialog"] input[type=number]').first().fill('45');
  await p.waitForTimeout(300);
  const totals = await p.locator('[role="dialog"]').innerText();
  console.log('в панели есть итог:', /Ориентировочно с доставкой/.test(totals));
  await p.screenshot({path:`${OUT}/qa-request-panel.png`});
  // форма
  await p.locator('[role="dialog"] input#\\:r0\\:-name, [role="dialog"] form input').first().fill('Иван');
  const phone = p.locator('[role="dialog"] form input[type=tel]');
  await phone.fill('+7 916 111 22 33');
  await p.locator('[role="dialog"] form button[type=submit]').click();
  await p.waitForTimeout(1400);
  const done = await p.locator('[role="dialog"]').innerText();
  console.log('подтверждение показано:', /Заявка собрана/.test(done));
  console.log('в тексте заявки две позиции:', (done.match(/^\d\.\s/gm)||[]).length);
  await p.screenshot({path:`${OUT}/qa-request-done.png`});
  await ctx.close();
}

await b.close();
