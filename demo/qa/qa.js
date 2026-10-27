const puppeteer = require('/home/hatch/workspace/qa-rig/node_modules/puppeteer-core');
const path = require('path');

const URL = 'file://' + path.resolve(__dirname, '..', 'index.html');
const OUT = path.resolve(__dirname, '..', 'preview');
const sleep = ms => new Promise(r => setTimeout(r, ms));

let failures = [];
function check(name, cond, extra) {
  if (cond) { console.log('PASS ' + name); }
  else { failures.push(name); console.log('FAIL ' + name + (extra ? ' :: ' + extra : '')); }
}

async function activeScreen(page) {
  return page.evaluate(() => {
    const s = document.querySelector('.screen.active');
    return s ? s.dataset.screen : null;
  });
}
async function waitScreen(page, name, timeout = 6000) {
  const t0 = Date.now();
  while (Date.now() - t0 < timeout) {
    if ((await activeScreen(page)) === name) return true;
    await sleep(120);
  }
  return false;
}
async function clickChoice(page, selector) {
  await page.waitForSelector(selector, { visible: true });
  await page.click(selector);
}
async function shot(page, name) {
  await page.screenshot({ path: path.join(OUT, name + '.png') });
}

(async () => {
  const browser = await puppeteer.launch({
    executablePath: '/opt/meta-chromium/chrome',
    args: ['--no-sandbox', '--disable-dev-shm-usage']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });

  // ---------- PATH 1: recording with engineer, Studio B, 4 hrs ----------
  await page.goto(URL, { waitUntil: 'load' });
  await sleep(1600);
  check('loader active', (await activeScreen(page)) === 'loader');
  await shot(page, '01-loader');
  await page.click('#enterBtn');
  check('project screen', await waitScreen(page, 'project'));
  await clickChoice(page, '[data-screen="project"] .choice[data-value="Single"]');
  check('session screen', await waitScreen(page, 'session'));
  await shot(page, '02-session');
  await clickChoice(page, '[data-sessiontype="record-eng"]');
  check('room screen', await waitScreen(page, 'room'));
  await shot(page, '03-room');
  await clickChoice(page, '[data-room="B"]');
  check('duration screen', await waitScreen(page, 'duration'));
  await clickChoice(page, '[data-hours="4"]');
  check('addons screen', await waitScreen(page, 'addons'));
  await page.click('[data-addon="Session musician"]');
  await page.click('[data-addon="Vocal production + tuning"]');
  await sleep(200);
  await page.click('#addonsContinue');
  check('schedule screen', await waitScreen(page, 'schedule'));
  const chips = await page.$$('#dateStrip .datechip');
  check('date chips rendered', chips.length >= 10, 'got ' + chips.length);
  await chips[1].click();
  await sleep(200);
  const slots = await page.$$('#timeSlots .slot');
  check('time slots rendered', slots.length >= 8, 'got ' + slots.length);
  await slots[2].click();
  await sleep(150);
  await page.click('#scheduleContinue');
  check('contact screen', await waitScreen(page, 'contact'));
  await page.type('#fullName', 'Test Artist');
  await page.type('#artistName', 'Nova Rae');
  await page.type('#email', 'nova@example.com');
  await page.type('#phone', '(555) 010-2233');
  await page.click('#contactContinue');
  check('estimate screen', await waitScreen(page, 'estimate'));
  await sleep(1200);
  const estTotal = await page.$eval('#estTotal', el => el.textContent.trim());
  check('recording estimate = $557', estTotal === '$557', 'got ' + estTotal);
  const estLines = await page.$eval('#estLines', el => el.textContent);
  check('estimate shows engineer line', estLines.includes('Engineer'), estLines.slice(0, 120));
  check('estimate shows block discount', estLines.includes('Block discount'), estLines.slice(0, 120));
  const depLine = await page.$eval('#estDepositLine', el => el.textContent);
  check('deposit line $279', depLine.includes('$279'), depLine);
  await shot(page, '04-estimate-recording');
  await page.click('#estContinue');
  check('payment screen', await waitScreen(page, 'payment'));
  await sleep(400);
  const payDep = await page.$eval('#payDeposit', el => el.textContent.trim());
  check('payment deposit $279 of $557', payDep === '$279 of $557', 'got ' + payDep);
  await shot(page, '05-payment');
  await page.click('#payNow');
  await sleep(400);
  const paidVisible = await page.$eval('#paidDone', el => el.style.display !== 'none');
  check('demo pay reveals completed button', paidVisible);
  await page.click('#paidDone');
  check('confirm screen', await waitScreen(page, 'confirm'));
  await sleep(600);
  const ref = await page.$eval('#confirmRef', el => el.textContent.trim());
  check('confirm ref ST-####', /^ST-\d{4}$/.test(ref), 'got ' + ref);
  const confSession = await page.$eval('#confirmSession', el => el.textContent.trim());
  check('confirm session summary', confSession.includes('Studio B') && confSession.includes('4 hrs'), confSession);
  await shot(page, '06-confirm');
  // PNG session sheet download should not error
  await page.click('#downloadSheet');
  await sleep(800);
  check('no errors after download click', errors.length === 0, errors.join(' | '));

  // ---------- PATH 2: mixing, 4 songs, invoice route ----------
  await page.goto(URL, { waitUntil: 'load' });
  await sleep(1600);
  await page.click('#enterBtn');
  await waitScreen(page, 'project');
  await clickChoice(page, '[data-screen="project"] .choice[data-value="Album"]');
  await waitScreen(page, 'session');
  await clickChoice(page, '[data-sessiontype="mixing"]');
  check('songs screen', await waitScreen(page, 'songs'));
  await page.click('#songPlus'); await page.click('#songPlus'); await page.click('#songPlus');
  await sleep(200);
  const songCount = await page.$eval('#songCount', el => el.textContent.trim());
  check('song stepper = 4', songCount === '4', 'got ' + songCount);
  await page.click('#songsContinue');
  check('addons screen (service path)', await waitScreen(page, 'addons'));
  await page.click('#addonsContinue');
  check('schedule screen (service path)', await waitScreen(page, 'schedule'));
  const chips2 = await page.$$('#dateStrip .datechip');
  await chips2[0].click();
  await sleep(200);
  const slots2 = await page.$$('#timeSlots .slot');
  check('service path slots rendered', slots2.length >= 1, 'got ' + slots2.length);
  await slots2[0].click();
  await sleep(150);
  await page.click('#scheduleContinue');
  await waitScreen(page, 'contact');
  await page.type('#fullName', 'Mix Client');
  await page.type('#email', 'mix@example.com');
  await page.type('#phone', '(555) 999-8877');
  await page.click('#contactContinue');
  check('estimate screen (mixing)', await waitScreen(page, 'estimate'));
  await sleep(1200);
  const est2 = await page.$eval('#estTotal', el => el.textContent.trim());
  check('mixing estimate = $1,260', est2 === '$1,260', 'got ' + est2);
  const dep2 = await page.$eval('#estDepositLine', el => el.textContent);
  check('mixing deposit $630', dep2.includes('$630'), dep2);
  await shot(page, '07-estimate-mixing');
  await page.click('#estContinue');
  await waitScreen(page, 'payment');
  await sleep(300);
  await page.click('#invoiceMe');
  check('confirm screen (invoice)', await waitScreen(page, 'confirm'));
  await sleep(500);
  const lede = await page.$eval('#confirmLede', el => el.textContent);
  check('invoice confirm copy', lede.includes('Invoice sent'), lede.slice(0, 80));
  await shot(page, '08-confirm-invoice');

  // ---------- PATH 3: contact validation blocks bad email ----------
  await page.goto(URL, { waitUntil: 'load' });
  await sleep(1600);
  await page.click('#enterBtn');
  await waitScreen(page, 'project');
  await clickChoice(page, '[data-screen="project"] .choice[data-value="Podcast"]');
  await waitScreen(page, 'session');
  await clickChoice(page, '[data-sessiontype="podcast"]');
  await waitScreen(page, 'room');
  await clickChoice(page, '[data-room="P"]');
  await waitScreen(page, 'duration');
  await clickChoice(page, '[data-hours="2"]');
  await waitScreen(page, 'addons');
  await page.click('#addonsContinue');
  await waitScreen(page, 'schedule');
  const chips3 = await page.$$('#dateStrip .datechip');
  await chips3[0].click(); await sleep(200);
  const slots3 = await page.$$('#timeSlots .slot');
  await slots3[0].click(); await sleep(150);
  await page.click('#scheduleContinue');
  await waitScreen(page, 'contact');
  await page.type('#fullName', 'Pod Host');
  await page.type('#email', 'not-an-email');
  await page.type('#phone', '(555) 111-2222');
  await page.click('#contactContinue');
  await sleep(500);
  check('bad email stays on contact', (await activeScreen(page)) === 'contact');
  const cErr = await page.$eval('#contactError', el => el.textContent);
  check('validation error shown', cErr.length > 0, cErr);
  // podcast suite 2hr estimate sanity after fixing email: 55*2 = 110, engineer included
  await page.evaluate(() => { document.getElementById('email').value = ''; });
  await page.type('#email', 'host@example.com');
  await page.click('#contactContinue');
  check('estimate screen (podcast)', await waitScreen(page, 'estimate'));
  await sleep(1200);
  const est3 = await page.$eval('#estTotal', el => el.textContent.trim());
  check('podcast estimate = $110', est3 === '$110', 'got ' + est3);

  check('zero page errors overall', errors.length === 0, errors.join(' | '));

  await browser.close();
  console.log(failures.length ? ('\nQA FAILURES: ' + failures.length) : '\nQA ALL PASS');
  process.exit(failures.length ? 1 : 0);
})().catch(e => { console.error('QA CRASH', e); process.exit(2); });
