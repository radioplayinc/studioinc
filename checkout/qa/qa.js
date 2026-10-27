const puppeteer = require('/home/hatch/workspace/qa-rig/node_modules/puppeteer-core');
const path = require('path');
const sleep = ms => new Promise(r => setTimeout(r, ms));
let failures = [];
function check(name, cond, extra) {
  if (cond) console.log('PASS ' + name);
  else { failures.push(name); console.log('FAIL ' + name + (extra ? ' :: ' + extra : '')); }
}
async function activeScreen(page, root) {
  return page.evaluate((root) => {
    const s = document.querySelector(root + ' .screen.active') || document.querySelector('.screen.active');
    return s ? s.dataset.screen : null;
  }, root);
}
async function waitScreen(page, name, timeout = 6000) {
  const t0 = Date.now();
  while (Date.now() - t0 < timeout) {
    if ((await activeScreen(page)) === name) return true;
    await sleep(120);
  }
  return false;
}

(async () => {
  const browser = await puppeteer.launch({ executablePath: '/opt/meta-chromium/chrome', args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));

  // ---------- CHECKOUT ----------
  const CK = 'file://' + path.resolve(__dirname, '..', 'index.html');
  await page.goto(CK, { waitUntil: 'load' });
  await sleep(2200);
  check('checkout loader active', (await activeScreen(page)) === 'loader');
  const demoHidden = await page.$eval('#demoLink', el => el.style.display === 'none');
  check('demo link hidden until demo URL configured', demoHidden);
  await page.click('#enterBtn');
  check('packages screen', await waitScreen(page, 'packages'));
  const pkgText = await page.$eval('#packageChoices', el => el.textContent);
  check('all three prices shown', pkgText.includes('$2,499') && pkgText.includes('$3,499') && pkgText.includes('$3,999'), pkgText.slice(0, 140));
  check('Pro badge', pkgText.includes('Most studios pick this'));
  check('studio copy, no movers', !pkgText.toLowerCase().includes('mover'));
  await page.screenshot({ path: path.resolve(__dirname, '..', 'preview', '01-packages.png') }).catch(() => {});
  await page.click('[data-package="pro"]');
  check('funding screen', await waitScreen(page, 'funding'));
  const depSub = await page.$eval('#depSub', el => el.textContent);
  check('Pro deposit $1,749', depSub.includes('$1,749') && depSub.includes('$1,750'), depSub);
  await page.click('[data-funding="deposit"]');
  check('careplan screen', await waitScreen(page, 'careplan'));
  const careSub = await page.$eval('#careYesSub', el => el.textContent);
  check('Pro care plan $150/mo', careSub.includes('$150/mo'), careSub);
  await page.click('[data-careplan="yes"]');
  check('details screen', await waitScreen(page, 'details'));
  await page.type('#coName', 'Test Studio');
  await page.type('#fullName', 'Studio Owner');
  await page.type('#email', 'owner@teststudio.com');
  await page.type('#phone', '(555) 010-4455');
  await page.click('#detailsBtn');
  check('review screen', await waitScreen(page, 'review'));
  await sleep(300);
  const dueAmt = await page.$eval('#dueAmt', el => el.textContent.trim());
  check('due today $1,749', dueAmt === '$1,749', 'got ' + dueAmt);
  const careAmt = await page.$eval('#careAmt', el => el.textContent.trim());
  check('care line $150/mo', careAmt === '$150/mo', 'got ' + careAmt);
  const payLabel = await page.$eval('#payBtn', el => el.textContent);
  check('pay button $1,749', payLabel.includes('$1,749'), payLabel);
  // Pay opens the Jim link in a new popup target (ignore Chrome's own
  // omnibox shell target; wait for the target that navigates to Jim)
  await page.click('#payBtn');
  let popupUrl = null;
  for (let i = 0; i < 25 && !popupUrl; i++) {
    await sleep(200);
    const targets = browser.targets().map(t => { try { return t.url(); } catch (e) { return ''; } });
    popupUrl = targets.find(u => u.indexOf('https://pay.jim.com/') === 0) || null;
  }
  check('done screen', await waitScreen(page, 'done'));
  const ref = await page.$eval('#orderRef', el => el.textContent.trim());
  check('order ref BQ-####', /^BQ-\d{4}$/.test(ref), 'got ' + ref);
  check('Jim popup opened to Pro deposit link', popupUrl === 'https://pay.jim.com/jim_human-petroleum-llc/Ri0x-p8f1FrQNr1-1749.00', 'got ' + popupUrl);

  // ---------- DEMO TAB ----------
  const DM = 'file://' + path.resolve(__dirname, '..', '..', 'moovit-studio-demo', 'index.html');
  await page.goto(DM, { waitUntil: 'load' });
  await sleep(1600);
  const tab = await page.$eval('#sellTab', el => ({ text: el.textContent, visible: el.offsetHeight > 0, bottom: el.getBoundingClientRect().bottom }));
  check('sell tab present and visible', tab.visible && tab.text.includes('Need a site like this?'), JSON.stringify(tab));
  check('sell tab pinned to bottom', Math.abs(tab.bottom - 844) < 2, 'bottom=' + tab.bottom);
  await page.click('#sellTab');
  await sleep(300);
  const tabText = await page.$eval('#sellTab span', el => el.textContent);
  check('unconfigured tab shows coming-soon, stays on loader', tabText.includes('coming soon') && (await activeScreen(page)) === 'loader', tabText);
  await page.screenshot({ path: path.resolve(__dirname, '..', '..', 'moovit-studio-demo', 'preview', '09-selltab.png') });
  // smoke: tab does not break the booking flow
  await page.click('#enterBtn');
  await waitScreen(page, 'project');
  await page.click('[data-screen="project"] .choice[data-value="Single"]');
  await waitScreen(page, 'session');
  await page.click('[data-sessiontype="record-eng"]');
  await waitScreen(page, 'room');
  await page.click('[data-room="A"]');
  await waitScreen(page, 'duration');
  await page.click('[data-hours="2"]');
  await waitScreen(page, 'addons');
  await page.click('#addonsContinue');
  await waitScreen(page, 'schedule');
  const chips = await page.$$('#dateStrip .datechip');
  await chips[0].click(); await sleep(200);
  const slots = await page.$$('#timeSlots .slot');
  await slots[0].click(); await sleep(150);
  await page.click('#scheduleContinue');
  await waitScreen(page, 'contact');
  await page.type('#fullName', 'Tab Tester');
  await page.type('#email', 'tab@test.com');
  await page.type('#phone', '(555) 111-2222');
  await page.click('#contactContinue');
  check('estimate screen with tab present', await waitScreen(page, 'estimate'));
  await sleep(1200);
  const est = await page.$eval('#estTotal', el => el.textContent.trim());
  check('Studio A 2hr estimate $190', est === '$190', 'got ' + est);
  const tabStillThere = await page.$eval('#sellTab', el => el.offsetHeight > 0);
  check('sell tab still visible on estimate screen', tabStillThere);

  check('zero JS page errors', errors.length === 0, errors.join(' | '));
  await browser.close();
  console.log(failures.length ? ('\nQA FAILURES: ' + failures.length) : '\nQA ALL PASS');
  process.exit(failures.length ? 1 : 0);
})().catch(e => { console.error('QA CRASH', e); process.exit(2); });
