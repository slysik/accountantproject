#!/usr/bin/env node
// eval-logo-size.mjs  (v2)
//
// Improvements over v1:
//  - Scorer measures the actual logo <img> bounding box (not just the wordmark
//    text), so candidates genuinely differentiate.
//  - Runs a BASELINE pass (no flags) once so every candidate can be compared
//    as a delta-from-baseline ("growth factor").
//  - Factors wordmark legibility as a secondary signal.
//  - Overflow and vertical-budget penalties.
//
// Usage:  BASE_URL=http://localhost:3000 node scripts/eval-logo-size.mjs
// Output: artifacts/logo-eval/<ts>/ {report.json, report.md, *.png}

import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3000';

const CANDIDATES = [
  { id: 'C1-64',  size: 64,  className: 'h-16 w-16' },
  { id: 'C2-72',  size: 72,  className: 'h-[72px] w-[72px]' },
  { id: 'C3-80',  size: 80,  className: 'h-20 w-20' },
  { id: 'C4-96',  size: 96,  className: 'h-24 w-24' },
  { id: 'C5-112', size: 112, className: 'h-28 w-28' },
  { id: 'C6-128', size: 128, className: 'h-32 w-32' },
];

const ROUTES = [
  { path: '/',           name: 'home' },
  { path: '/login',      name: 'login' },
  { path: '/onboard',    name: 'onboard' },
  { path: '/pricing',    name: 'pricing' },
  { path: '/subscribe',  name: 'subscribe' },
  { path: '/preview/v3', name: 'preview_v3' },
];

const VIEWPORTS = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'mobile',  width: 375,  height: 812 },
];

const TOP_LEFT_CLIP = { x: 0, y: 0, width: 560, height: 220 };

function paramize(c) {
  if (!c) return '';
  const qp = new URLSearchParams();
  qp.set('logoSize', String(c.size));
  qp.set('logoClass', c.className);
  return qp.toString();
}

async function measure(page) {
  return page.evaluate(() => {
    // Find the brand logo image in the first header/aside region only.
    const roots = Array.from(document.querySelectorAll('header, aside')).slice(0, 3);
    let logoH = 0;
    let logoW = 0;
    let wordmarkH = 0;
    for (const root of roots) {
      for (const img of root.querySelectorAll('img')) {
        const alt = (img.getAttribute('alt') || '').toLowerCase();
        if (alt.includes("accountant")) {
          const r = img.getBoundingClientRect();
          if (r.height > logoH) { logoH = r.height; logoW = r.width; }
        }
      }
      for (const el of root.querySelectorAll('span, p, h1, h2')) {
        const text = (el.textContent || '').trim();
        if (!text || !/Accountant|ABF/i.test(text)) continue;
        // Skip long descriptive text; focus on the brand label itself
        if (text.length > 40) continue;
        const r = el.getBoundingClientRect();
        if (r.height > wordmarkH) wordmarkH = r.height;
      }
    }
    const overflowPx = Math.max(
      0,
      document.documentElement.scrollHeight - window.innerHeight,
    );
    return { logoH, logoW, wordmarkH, overflowPx, vpH: window.innerHeight };
  });
}

// Score shape: peak legibility at ~96–110px, linear rise from 32 → 96,
// gentle falloff past 120, hard penalty past 160 (dominates the header).
function logoLegibility(h) {
  if (h <= 0) return 0;
  if (h < 32)  return (h / 32) * 0.35;
  if (h < 72)  return 0.35 + ((h - 32) / 40) * 0.40; // 0.35 → 0.75
  if (h < 96)  return 0.75 + ((h - 72) / 24) * 0.20; // 0.75 → 0.95
  if (h < 120) return 0.95 + ((h - 96) / 24) * 0.05; // 0.95 → 1.00 (plateau)
  if (h < 140) return 1.00 - ((h - 120) / 20) * 0.05;
  if (h < 160) return 0.95 - ((h - 140) / 20) * 0.15;
  return 0.80 - Math.min(0.60, (h - 160) / 40 * 0.20);
}

function wordmarkLegibility(h) {
  if (h <= 0)  return 0.5; // no wordmark is neutral, not a failure
  if (h <= 12) return (h / 12) * 0.6;
  if (h <= 18) return 0.6 + ((h - 12) / 6) * 0.3;   // 0.6 → 0.9
  if (h <= 24) return 0.9 + ((h - 18) / 6) * 0.1;   // 0.9 → 1.0
  return 1.0;
}

function overflowPenalty(m) {
  const r = m.overflowPx / m.vpH;
  if (r < 3) return 0;
  if (r < 6) return 0.05;
  return 0.12;
}

async function runOne(browser, cand, out) {
  const ctx = await browser.newContext();
  const results = [];
  for (const vp of VIEWPORTS) {
    await ctx.close().catch(() => {});
    const c = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
    for (const route of ROUTES) {
      const page = await c.newPage();
      const qp = paramize(cand);
      const url = `${BASE_URL}${route.path}${qp ? '?' + qp : ''}`;
      try {
        await page.goto(url, { waitUntil: 'networkidle', timeout: 20_000 });
        // Wait for the client-side sizing override to apply post-hydration.
        await page.waitForTimeout(350);
        const shot = resolve(out, `${cand?.id ?? 'baseline'}-${route.name}-${vp.name}.png`);
        await page.screenshot({ path: shot, clip: TOP_LEFT_CLIP });
        const m = await measure(page);
        results.push({ route: route.name, vp: vp.name, ...m, screenshot: shot });
      } catch (err) {
        results.push({ route: route.name, vp: vp.name, error: String(err?.message ?? err) });
      } finally {
        await page.close();
      }
    }
    await c.close();
  }
  return results;
}

function score(m, baselineLogoH) {
  if (!m || m.error) return null;
  const L = logoLegibility(m.logoH);
  const W = wordmarkLegibility(m.wordmarkH);
  const P = overflowPenalty(m);
  const growth = baselineLogoH > 0 ? m.logoH / baselineLogoH : 1;
  // Prefer candidates that grew the logo (growth > 1) without overwhelming
  const growthBonus = growth <= 1 ? 0 : Math.min(0.15, (growth - 1) * 0.08);
  return {
    logoH: m.logoH,
    wordmarkH: m.wordmarkH,
    growth: +growth.toFixed(2),
    legibility: +L.toFixed(3),
    wordmark: +W.toFixed(3),
    overflowPenalty: +P.toFixed(3),
    growthBonus: +growthBonus.toFixed(3),
    score: +(0.65 * L + 0.20 * W + growthBonus - P).toFixed(3),
  };
}

async function run() {
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const outDir = resolve(__dirname, '..', 'artifacts', 'logo-eval', ts);
  mkdirSync(outDir, { recursive: true });

  const browser = await chromium.launch();

  console.log('Running baseline (no flags)…');
  const baselineRaw = await runOne(browser, null, outDir);
  // Per-(route,viewport) baseline logo height map
  const baselineLogoH = new Map();
  for (const r of baselineRaw) {
    if (!r.error) baselineLogoH.set(`${r.route}|${r.vp}`, r.logoH);
  }

  const all = [];
  for (const cand of CANDIDATES) {
    console.log(`Candidate ${cand.id} (size=${cand.size})…`);
    const rows = await runOne(browser, cand, outDir);
    for (const r of rows) {
      const base = baselineLogoH.get(`${r.route}|${r.vp}`) ?? 0;
      const s = score(r, base);
      all.push({ candidate: cand.id, baselineLogoH: base, ...r, ...(s ?? {}) });
    }
  }

  await browser.close();

  // Aggregate per candidate
  const by = new Map();
  for (const r of all) {
    if (r.error || r.score == null) continue;
    const cur = by.get(r.candidate) ?? { n: 0, sum: 0, logoSum: 0 };
    cur.n += 1; cur.sum += r.score; cur.logoSum += r.logoH;
    by.set(r.candidate, cur);
  }
  const ranked = [...by.entries()]
    .map(([id, { n, sum, logoSum }]) => ({
      id,
      meanScore: +(sum / n).toFixed(3),
      meanLogoH: +(logoSum / n).toFixed(1),
      n,
    }))
    .sort((a, b) => b.meanScore - a.meanScore);

  writeFileSync(
    resolve(outDir, 'report.json'),
    JSON.stringify({ baseUrl: BASE_URL, candidates: CANDIDATES, baselineLogoH: [...baselineLogoH], results: all, ranked }, null, 2),
  );
  writeFileSync(
    resolve(outDir, 'report.md'),
    [
      `# Logo Sizing Eval (v2) — ${ts}`,
      ``,
      `Base URL: ${BASE_URL}`,
      ``,
      `## Ranking`, ``,
      `| Candidate | Mean Score | Mean Logo px | Samples |`,
      `|-----------|-----------:|-------------:|--------:|`,
      ...ranked.map(r => `| ${r.id} | ${r.meanScore} | ${r.meanLogoH} | ${r.n} |`),
      ``,
      `## Winner: **${ranked[0]?.id ?? 'n/a'}**`,
      ``,
      `Scoring: 0.65 · logoLegibility + 0.20 · wordmarkLegibility + growthBonus − overflowPenalty.`,
      `logoLegibility peaks at ~96–120px; penalizes tiny (<32px) and huge (>160px) logos.`,
    ].join('\n'),
  );

  console.log(`\nEval complete. Report: ${outDir}/report.md`);
  for (const r of ranked) {
    console.log(`  ${r.id}  score=${r.meanScore}  meanLogoPx=${r.meanLogoH}  n=${r.n}`);
  }
}

run().catch(err => { console.error(err); process.exit(1); });
