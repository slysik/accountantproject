/**
 * record-demo.mjs
 *
 * Logs in as vic@alpina.net, creates a fresh demo company, walks through:
 *   1. Create company (via wizard → Commit step)
 *   2. Import expenses + show column mapping
 *   3. View categorized expenses in the company folder
 *   4. Ask Alladin AI a question
 *   5. Add team members with permissions
 *   6. Add category mappings
 *   7. Import a second file with those categories → show auto-mapping
 *
 * Then cleans up the demo company before exiting.
 */
import { chromium } from 'playwright';
import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';

const BASE_URL     = 'http://localhost:3000';
const SUPABASE_URL = 'https://enkmkdhloycjczdqaucg.supabase.co';
const SERVICE_KEY  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVua21rZGhsb3ljamN6ZHFhdWNnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDgwNDA2MSwiZXhwIjoyMDkwMzgwMDYxfQ.HApaXDZ0DYfFjsn9I4JSm-u1TR2lf0DetYKJnPFIBkU';
const EMAIL        = 'demo@session.com';
const PASSWORD     = 'Demo@ABF2026!';
const COMPANY      = 'Acme Business Services';
const OUT_DIR   = '/tmp/abf-frames';
const VIDEO_OUT = path.resolve('public/demo.mp4');
const POSTER_OUT= path.resolve('public/demo-poster.jpg');
const FPS       = 24;

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });
let frameIndex = 0;

// ── Frame helpers ─────────────────────────────────────────────────────────────

async function snap(page) {
  const num = String(frameIndex++).padStart(5, '0');
  await page.screenshot({ path: `${OUT_DIR}/frame-${num}.jpg`, type: 'jpeg', quality: 92 });
}

async function hold(page, seconds) {
  const n = Math.round(seconds * FPS);
  for (let i = 0; i < n; i++) await snap(page);
}

async function scroll(page, distance, seconds = 1.5) {
  const steps = Math.round(seconds * FPS);
  for (let i = 0; i < steps; i++) {
    await page.evaluate((d) => window.scrollBy(0, d), distance / steps);
    await page.waitForTimeout(1000 / FPS);
    await snap(page);
  }
}

// ── Banner helpers ────────────────────────────────────────────────────────────

async function banner(page, title, sub = '') {
  await page.evaluate(({ title, sub }) => {
    document.getElementById('__demo-banner')?.remove();
    const el = document.createElement('div');
    el.id = '__demo-banner';
    el.style.cssText = `
      position:fixed;bottom:28px;left:50%;transform:translateX(-50%);
      z-index:99999;background:rgba(0,0,0,0.78);backdrop-filter:blur(14px);
      border:1px solid rgba(255,255,255,0.13);border-radius:14px;
      padding:13px 28px;text-align:center;pointer-events:none;
      font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
      box-shadow:0 8px 40px rgba(0,0,0,0.45);white-space:nowrap;
    `;
    el.innerHTML = `
      <div style="color:#fff;font-size:16px;font-weight:700">${title}</div>
      ${sub ? `<div style="color:rgba(255,255,255,0.55);font-size:12px;margin-top:3px">${sub}</div>` : ''}
    `;
    document.body.appendChild(el);
  }, { title, sub });
}

async function clearBanner(page) {
  await page.evaluate(() => document.getElementById('__demo-banner')?.remove());
}

// ── Highlight a DOM element with a pulsing ring ───────────────────────────────


async function clearHighlight(page) {
  await page.evaluate(() => document.getElementById('__demo-hl')?.remove());
}

/** Highlight using a Playwright locator (handles :has-text and other Playwright selectors) */
async function highlightLocator(page, locator) {
  try {
    const box = await locator.boundingBox({ timeout: 2000 });
    if (!box) return;
    await page.evaluate(({ top, left, width, height }) => {
      document.getElementById('__demo-hl')?.remove();
      const el = document.createElement('div');
      el.id = '__demo-hl';
      el.style.cssText = `
        position:fixed;pointer-events:none;z-index:99998;
        top:${top - 4}px;left:${left - 4}px;
        width:${width + 8}px;height:${height + 8}px;
        border:2.5px solid #f97316;border-radius:10px;
        box-shadow:0 0 0 4px rgba(249,115,22,0.25);
      `;
      document.body.appendChild(el);
    }, box);
  } catch { /* element not found — skip highlight */ }
}

// ── Demo user lifecycle ───────────────────────────────────────────────────────

async function createDemoUser() {
  console.log(`→ Creating demo user: ${EMAIL}`);
  const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD, email_confirm: true }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(`Failed to create demo user: ${JSON.stringify(json)}`);
  console.log(`✓ Demo user created: ${json.id}`);
  return json;
}

async function deleteDemoUser(userId) {
  await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${userId}`, {
    method: 'DELETE',
    headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` },
  });
  console.log('✓ Demo user deleted');
}

// ── Main ──────────────────────────────────────────────────────────────────────

(async () => {
  const demoUser = await createDemoUser();

  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    acceptDownloads: false,
  });
  const page = await ctx.newPage();

  try {

  // ══ SCENE 1: Homepage ═══════════════════════════════════════════════════════
  console.log('→ Scene 1: Homepage');
  await page.goto(BASE_URL);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(800);
  await clearBanner(page);
  await hold(page, 2);

  // Slow scroll to reveal the video section
  await scroll(page, 300, 2);
  await hold(page, 1.5);
  await scroll(page, 400, 2);
  await hold(page, 1);

  // Scroll back up and click Get started free
  await scroll(page, -700, 1.5);
  await hold(page, 1);
  await banner(page, 'Get started free', 'Clicking through to sign in');
  await hold(page, 1);
  // Navigate to login directly so the demo user can sign in
  await page.goto(`${BASE_URL}/login`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(600);

  // ══ SCENE 2: Login ══════════════════════════════════════════════════════════
  console.log('→ Scene 2: Login');
  await page.fill('input[type="email"]', EMAIL);
  await page.fill('input[type="password"]', PASSWORD);
  await banner(page, 'Sign In', 'Secure login with email & password');
  await hold(page, 1);
  await page.click('button[type="submit"]');
  await page.waitForURL(/dashboard/, { timeout: 20000 });
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);

  // ══ SCENE 3: Dashboard overview ════════════════════════════════════════════
  console.log('→ Scene 3: Dashboard');
  await banner(page, 'Dashboard', 'All your companies and expense history at a glance');
  await hold(page, 2);
  await scroll(page, 400, 1.5);
  await hold(page, 0.75);
  await scroll(page, -400, 1);

  // ══ SCENE 4: Open Import Wizard — Upload step ═══════════════════════════════
  console.log('→ Scene 3: Wizard - Upload');
  await page.goto(`${BASE_URL}/dashboard/wizard`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(600);
  await banner(page, 'Import Wizard — Step 1', 'Upload a bank or credit card CSV export');
  await hold(page, 1.5);

  // Click "Try sample data"
  const trySampleBtn = page.getByRole('button', { name: /try sample data/i });
  await trySampleBtn.click();
  await page.waitForTimeout(1500);
  await banner(page, 'Column Mapping', 'Tell the system which columns are date, description, and amount');
  await hold(page, 1.5);

  // Highlight the field mapping section — use Playwright locator, then pass bounding box
  await highlightLocator(page, page.locator('h3').filter({ hasText: 'Field mapping' }).first());
  await hold(page, 1.5);
  await clearHighlight(page);
  await scroll(page, 300, 1);

  // Highlight the mapped preview table
  await highlightLocator(page, page.locator('h3').filter({ hasText: 'Mapped preview' }).first());
  await hold(page, 1);
  await clearHighlight(page);

  // Click "Continue to review"
  await banner(page, 'Mapping confirmed', 'Rows are ready for review');
  const continueBtn = page.getByRole('button', { name: /continue to review/i });
  await continueBtn.click();
  await page.waitForTimeout(800);

  // ══ SCENE 4: Review step ════════════════════════════════════════════════════
  console.log('→ Scene 4: Wizard - Review');
  await banner(page, 'Import Wizard — Step 2', 'Review and edit each transaction before categorizing');
  await hold(page, 1.5);
  await scroll(page, 400, 1.5);
  await hold(page, 0.75);

  // Click "Let AI map categories"
  const reviewNextBtn = page.getByRole('button', { name: /let ai map categories/i });
  await reviewNextBtn.waitFor({ timeout: 10000 });
  await reviewNextBtn.click();
  await page.waitForTimeout(2000); // AI categorization takes a moment

  // ══ SCENE 5: AI Map / Categorize step ══════════════════════════════════════
  console.log('→ Scene 5: Wizard - AI Categorize');
  await banner(page, 'Import Wizard — Step 3', 'AI maps each expense to an IRS category automatically');
  await hold(page, 2);
  await scroll(page, 300, 1);
  await hold(page, 1);

  // Continue to Commit
  const categorizeNextBtn = page.getByRole('button', { name: /continue to commit/i });
  await categorizeNextBtn.waitFor({ timeout: 10000 });
  await categorizeNextBtn.click();
  await page.waitForTimeout(800);

  // ══ SCENE 6: Commit step — assign to company ════════════════════════════════
  console.log('→ Scene 6: Wizard - Commit');
  await banner(page, 'Import Wizard — Step 4', 'Assign transactions to a company and save');
  await hold(page, 1.5);

  // Fill in company name
  const companyInput = page.locator('input').filter({ hasNot: page.locator('input[type="checkbox"]') }).first();
  if (await companyInput.count()) {
    await companyInput.fill(COMPANY);
    await hold(page, 0.75);
  }
  await highlightLocator(page, companyInput);
  await hold(page, 1);
  await clearHighlight(page);

  // Click "Yes, commit entries to company"
  const saveBtn = page.getByRole('button', { name: /yes, commit entries to company/i });
  await saveBtn.waitFor({ timeout: 10000 });
  await banner(page, 'Saving to company…', `Creating "${COMPANY}"`);
  await saveBtn.click();
  await page.waitForTimeout(3000);
  await banner(page, '✓ Expenses Saved', `"${COMPANY}" is now in your dashboard`);
  await hold(page, 2);

  // ══ SCENE 7: View categorized expenses in company ════════════════════════════
  console.log('→ Scene 7: Company folder view');
  await page.goto(`${BASE_URL}/dashboard`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(800);
  await banner(page, 'Company Folder', `Viewing categorized expenses inside "${COMPANY}"`);
  await hold(page, 1.5);

  // Click into the demo company
  const companyLink = page.locator(`a[href*="/dashboard/"]`).filter({ hasText: COMPANY }).first();
  if (await companyLink.count()) {
    await companyLink.click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(800);
  }
  await banner(page, 'Expense Ledger', 'Transactions sorted by IRS category, date & amount');
  await hold(page, 2);
  await scroll(page, 500, 1.5);
  await hold(page, 1);
  await scroll(page, -300, 1);

  // ══ SCENE 8: Alladin AI ═════════════════════════════════════════════════════
  console.log('→ Scene 8: Alladin AI');
  await page.goto(`${BASE_URL}/dashboard`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(600);

  // Open Alladin chat
  const alladinBtn = page.locator('button[title="Open Alladin AI"]');
  if (await alladinBtn.count()) {
    await alladinBtn.click();
    await page.waitForTimeout(700);
  }
  await banner(page, 'Alladin AI Assistant', 'Ask questions about your expenses in plain English');
  await hold(page, 1.5);

  // Type a question
  const chatInput = page.locator('textarea, input[type="text"]').last();
  if (await chatInput.count()) {
    await chatInput.click();
    await chatInput.pressSequentially('What were my top 3 spending categories this year?', { delay: 45 });
    await hold(page, 1);
    await chatInput.press('Enter');
    await page.waitForTimeout(3000); // wait for AI response
  }
  await banner(page, 'AI Response', 'Instant answers from your actual financial data');
  await hold(page, 2.5);

  // Close chat
  const closeChat = page.locator('button[title*="close" i], button[aria-label*="close" i]').first();
  if (await closeChat.count()) { await closeChat.click(); await page.waitForTimeout(300); }

  // ══ SCENE 9: Team settings — add users ═════════════════════════════════════
  console.log('→ Scene 9: Team access');
  await page.goto(`${BASE_URL}/settings/team`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(600);
  await banner(page, 'Team Access', 'Invite collaborators and assign roles by company');
  await hold(page, 1.5);
  await scroll(page, 300, 1);
  await hold(page, 1);

  // Show the invite form — use force:true so disabled state doesn't block the demo
  const emailInput = page.locator('input[placeholder*="email" i]').last();
  if (await emailInput.count()) {
    await emailInput.fill('bookkeeper@example.com', { force: true });
    await hold(page, 0.5);
    await highlightLocator(page, emailInput);
    await hold(page, 0.75);
    await clearHighlight(page);
  }

  // Show role selector
  const roleSelect = page.locator('select').last();
  if (await roleSelect.count()) {
    await highlightLocator(page, roleSelect);
    await banner(page, 'Assign Role', 'Viewer · Contributor · Admin — per company access');
    await hold(page, 1.5);
    await clearHighlight(page);
  }

  // ══ SCENE 10: Category mappings ════════════════════════════════════════════
  console.log('→ Scene 10: Category mappings');
  await page.goto(`${BASE_URL}/settings/categories`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(600);
  await banner(page, 'Category Mappings', 'Map bank labels to IRS categories once — applies forever');
  await hold(page, 1.5);
  await scroll(page, 300, 1);
  await hold(page, 1);

  // Fill in a mapping: "TRAVEL" → Travel
  const sourceLabelInput = page.locator('input[placeholder*="Meals" i], input[placeholder*="entertainment" i], input[placeholder*="Starbucks" i]').first();
  if (await sourceLabelInput.count()) {
    await sourceLabelInput.fill('TRAVEL');
    await hold(page, 0.5);
  }

  // Highlight the Map To Category dropdown
  const catSelect = page.locator('select').nth(1); // second select = "Map To Category"
  if (await catSelect.count()) {
    await highlightLocator(page, catSelect);
    await banner(page, 'Map "TRAVEL" → Travel & Transportation', 'Future imports with this label auto-categorize');
    await hold(page, 1.5);
    await clearHighlight(page);
  }

  // ══ SCENE 11: Second import — auto-mapping in action ═══════════════════════
  console.log('→ Scene 11: Auto-mapping import');
  await page.goto(`${BASE_URL}/dashboard/wizard`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(600);
  await banner(page, 'Second Import', 'Importing a new file — category mappings apply automatically');
  await hold(page, 1.5);

  // Use Try Sample Data again to simulate the import
  const trySample2 = page.getByRole('button', { name: /try sample data/i });
  await trySample2.click();
  await page.waitForTimeout(1500);
  await banner(page, 'Auto-Mapping in Action', '"TRAVEL" and "SOFTWARE" rows categorized automatically');
  await hold(page, 1.5);
  await scroll(page, 300, 1);
  await hold(page, 1);

  // Highlight the category column in the mapped preview
  await highlightLocator(page, page.locator('th').filter({ hasText: 'Imported Category' }).first());
  await hold(page, 1.5);
  await clearHighlight(page);

  // ══ SCENE 13: Final closing shot — back to homepage ════════════════════════
  console.log('→ Scene 13: Closing on homepage');
  await page.goto(BASE_URL);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(600);
  await clearBanner(page);
  await hold(page, 2);
  await scroll(page, 350, 2);
  await hold(page, 1.5);
  await clearBanner(page);
  await hold(page, 0.5);

  } finally {
    await browser.close();
    await deleteDemoUser(demoUser.id);
  }

  console.log(`\n✓ ${frameIndex} frames (${(frameIndex / FPS).toFixed(1)}s) — building video...`);

  execSync(`cp "${OUT_DIR}/frame-00000.jpg" "${POSTER_OUT}"`);
  execSync(
    `ffmpeg -y -framerate ${FPS} -pattern_type glob -i "${OUT_DIR}/frame-*.jpg" ` +
    `-vf "scale=1440:-2" -c:v libx264 -preset slow -crf 20 -pix_fmt yuv420p -movflags +faststart "${VIDEO_OUT}"`,
    { stdio: 'inherit' }
  );
  fs.rmSync(OUT_DIR, { recursive: true });

  const mb = (fs.statSync(VIDEO_OUT).size / 1024 / 1024).toFixed(1);
  console.log(`\n✓ ${VIDEO_OUT} (${mb} MB)`);
  console.log(`✓ ${POSTER_OUT}`);
})();
