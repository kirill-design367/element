import { chromium } from 'playwright';
const b = await chromium.launch();
const ctx = await b.newContext({ viewport:{width:1440,height:900} });
const p = await ctx.newPage();
const cdp = await ctx.newCDPSession(p);
await cdp.send('Emulation.setCPUThrottlingRate', { rate: 6 });
await cdp.send('Network.enable');
await cdp.send('Network.emulateNetworkConditions', {offline:false, latency:150, downloadThroughput:1.6*1024*1024/8, uploadThroughput:750*1024/8});

const url = process.argv[2] ?? 'http://localhost:4173/catalog/?category=pesok';
const want = Number(process.argv[3] ?? 4);
await p.goto(url, { waitUntil:'commit' });
const t0 = Date.now();
let first = null, wrongSeen = 0;
for (let i=0;i<120;i++){
  const n = await p.locator('article:visible').count().catch(()=>0);
  if (n>0 && first===null) first = {n, ms: Date.now()-t0};
  if (n>0 && n!==want) wrongSeen++;
  if (n===want){ console.log('первая отрисовка:', JSON.stringify(first)); console.log('правильная выборка на:', Date.now()-t0,'мс'); console.log('замеров с неверным числом:', wrongSeen); break; }
  await p.waitForTimeout(40);
}
await p.screenshot({ path:'/tmp/claude-0/-home-user-Ai-Agent/ae36228a-3a88-5d5f-ba6c-41e656162fdc/scratchpad/shots/flip-direct-throttled.png' });
await b.close();
