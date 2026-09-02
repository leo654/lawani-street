import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';

const baseUrl = process.env.QA_BASE_URL || 'http://127.0.0.1:4173';
const outDir = path.resolve('_debug/qa-breakpoints');

const targets = [
  { name: 'index', url: '/index.html' },
  { name: 'work', url: '/work.html' }
];

const viewports = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'tablet', width: 1024, height: 768 },
  { name: 'mobile', width: 390, height: 844 }
];

const sampleDelays = [0, 120, 240, 420, 700, 1100];

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

async function captureMetrics(page) {
  return page.evaluate(() => {
    const root = document.documentElement;
    const body = document.body;
    const nav = document.querySelector('[data-estrela-nav]');
    const menu = document.querySelector('[data-estrela-menu]');
    const workHeader = document.querySelector('#work .work-header');
    const toggle = document.querySelector('[data-estrela-menu-toggle]');
    const rect = (el) => {
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { x: r.x, y: r.y, width: r.width, height: r.height, top: r.top, left: r.left };
    };

    return {
      scrollY: window.scrollY || window.pageYOffset || 0,
      rootClientWidth: root ? root.clientWidth : null,
      rootOffsetWidth: root ? root.offsetWidth : null,
      bodyClientWidth: body ? body.clientWidth : null,
      bodyOffsetWidth: body ? body.offsetWidth : null,
      bodyLeft: body ? body.getBoundingClientRect().left : null,
      menuOpen: !!(root && root.classList.contains('estrela-menu-open')),
      menuAriaHidden: menu ? menu.getAttribute('aria-hidden') : null,
      navRect: rect(nav),
      workHeaderRect: rect(workHeader),
      toggleRect: rect(toggle),
      classes: {
        root: root ? root.className : '',
        body: body ? body.className : ''
      }
    };
  });
}

function metricDelta(base, next) {
  const navDx = base.navRect && next.navRect ? Math.abs(next.navRect.x - base.navRect.x) : null;
  const navDy = base.navRect && next.navRect ? Math.abs(next.navRect.y - base.navRect.y) : null;
  const bodyDx = base.bodyLeft != null && next.bodyLeft != null ? Math.abs(next.bodyLeft - base.bodyLeft) : null;
  const widthShift =
    base.rootClientWidth != null && next.rootClientWidth != null
      ? Math.abs(next.rootClientWidth - base.rootClientWidth)
      : null;
  const scrollDrift = Math.abs((next.scrollY || 0) - (base.scrollY || 0));

  return { navDx, navDy, bodyDx, widthShift, scrollDrift };
}

async function run() {
  await ensureDir(outDir);
  const browser = await chromium.launch({ headless: true });
  const report = {
    generatedAt: new Date().toISOString(),
    baseUrl,
    results: []
  };

  for (const target of targets) {
    for (const vp of viewports) {
      const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
        deviceScaleFactor: 1
      });
      const page = await context.newPage();
      const entry = {
        page: target.name,
        viewport: vp,
        steps: [],
        issues: []
      };

      const pageUrl = `${baseUrl}${target.url}`;
      await page.goto(pageUrl, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(1800);

      await page.evaluate(() => {
        var max = Math.max(0, document.body.scrollHeight - window.innerHeight);
        var y = Math.min(700, max);
        window.scrollTo(0, y);
      });
      await page.waitForTimeout(250);
      await page.evaluate(() => {
        var max = Math.max(0, document.body.scrollHeight - window.innerHeight);
        var y = Math.min(700, max);
        window.scrollTo(0, y);
      });
      await page.waitForTimeout(250);

      const baseline = await captureMetrics(page);
      entry.steps.push({ phase: 'baseline', metrics: baseline });
      await page.screenshot({ path: path.join(outDir, `${target.name}-${vp.name}-baseline.png`), fullPage: false });

      const toggle = page.locator('[data-estrela-menu-toggle]').first();
      const hasToggle = (await toggle.count()) > 0;
      if (!hasToggle) {
        entry.issues.push('No global menu toggle found');
        report.results.push(entry);
        await context.close();
        continue;
      }

      await page.evaluate(() => {
        var el = document.querySelector('[data-estrela-menu-toggle]');
        if (el) el.click();
      });

      var elapsed = 0;
      for (const ms of sampleDelays) {
        var wait = ms - elapsed;
        if (wait < 0) wait = 0;
        await page.waitForTimeout(wait === 0 ? 16 : wait);
        elapsed = ms;
        const sample = await captureMetrics(page);
        const delta = metricDelta(baseline, sample);
        entry.steps.push({ phase: `open+${ms}ms`, metrics: sample, delta });
      }

      await page.screenshot({ path: path.join(outDir, `${target.name}-${vp.name}-open.png`), fullPage: false });

      const closeBtn = page.locator('[data-estrela-menu-close]').first();
      await page.evaluate(() => {
        var btn = document.querySelector('[data-estrela-menu-close]');
        if (btn) {
          btn.click();
          return;
        }
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      });
      await page.waitForTimeout(1250);

      const afterClose = await captureMetrics(page);
      const closeDelta = metricDelta(baseline, afterClose);
      entry.steps.push({ phase: 'after-close', metrics: afterClose, delta: closeDelta });
      await page.screenshot({ path: path.join(outDir, `${target.name}-${vp.name}-after-close.png`), fullPage: false });

      const maxBodyDx = Math.max(
        0,
        ...entry.steps.map((s) => (s.delta && typeof s.delta.bodyDx === 'number' ? s.delta.bodyDx : 0))
      );
      const maxWidthShift = Math.max(
        0,
        ...entry.steps.map((s) => (s.delta && typeof s.delta.widthShift === 'number' ? s.delta.widthShift : 0))
      );
      const closeScrollDrift = closeDelta.scrollDrift;

      if (maxBodyDx > 1.2) entry.issues.push(`Body horizontal drift > 1.2px (${maxBodyDx.toFixed(2)}px)`);
      if (maxWidthShift > 1.2) entry.issues.push(`Root width shift > 1.2px (${maxWidthShift.toFixed(2)}px)`);
      if (closeScrollDrift > 2.0) entry.issues.push(`Scroll restore drift > 2px (${closeScrollDrift.toFixed(2)}px)`);

      entry.summary = {
        maxBodyDx,
        maxWidthShift,
        closeScrollDrift
      };

      report.results.push(entry);
      await context.close();
    }
  }

  await browser.close();
  const reportPath = path.join(outDir, 'report.json');
  await fs.writeFile(reportPath, JSON.stringify(report, null, 2), 'utf8');
  console.log(reportPath);
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
