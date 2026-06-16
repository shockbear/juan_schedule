// Headless PNG export for a student calendar.
//
// Flow:
//   1. Spin up an embedded HTTP server on a random localhost port, serving
//      the project root + REST API backed by the on-disk JSON store.
//   2. Launch Puppeteer (bundled Chromium by default; falls back to a
//      system-installed Chrome/Chromium via PUPPETEER_EXECUTABLE_PATH).
//   3. Navigate to http://127.0.0.1:<port>/?student=<id>&month=YYYY-MM&export=1
//      The Web UI auto-detects `?export=1` and renders a clean printable
//      calendar (chrome hidden, banner shown, light theme forced).
//   4. Wait for `window.__juanExportReady` plus a visible `.cal-cell`.
//   5. Screenshot the calendar container to a PNG file.
//   6. Tear down Puppeteer and the embedded server.
//
// The embedded server is necessary because the Web UI's data load uses
// fetch() to /api/data — file:// origins cannot do that. Reusing the
// production server module guarantees identical behaviour to the Web UI.
//
// All failures bubble up as a single Error; the caller (CLI or HTTP
// endpoint) is expected to print a helpful message.

const http = require('http');
const path = require('path');
const fs = require('fs');
const { createRequestHandler } = require('./server');
const { getDataPath } = require('./util/path');

const DEFAULT_VIEWPORT = { width: 1280, height: 900, deviceScaleFactor: 2 };
const RENDER_TIMEOUT_MS = 15000;
const NAV_TIMEOUT_MS = 20000;

function loadPuppeteer() {
  try {
    // Lazy require so a missing Puppeteer does not break the rest of the
    // CLI (init / web / CRUD) at startup.
    return require('puppeteer');
  } catch (e) {
    const hint = [
      'Puppeteer is required for headless PNG export but is not installed.',
      'Install it with:  npm install puppeteer',
      '(Or set PUPPETEER_EXECUTABLE_PATH to a system Chrome/Chromium and install puppeteer-core.)',
    ].join('\n');
    throw new Error(hint);
  }
}

function defaultOutputPath({ studentId, month, studentName }) {
  // We prefer the student ID over the name in the filename because names
  // can be non-ASCII (CJK, accented, etc.) and a non-ASCII basename
  // breaks HTTP Content-Disposition validation in Node. The rendered PNG
  // itself already labels the student in its header, so the filename
  // only needs to be unique and shell-safe.
  const safe = (s) => String(s || '').replace(/[\\/:*?"<>|\x00-\x1f]/g, '_');
  const tag = safe(studentId || studentName || 'student');
  const m = month || new Date().toISOString().slice(0, 7);
  return path.join(process.cwd(), `juan-schedule-${tag}-${m}.png`);
}

function startEmbeddedServer(handler) {
  return new Promise((resolve, reject) => {
    const server = http.createServer(handler);
    server.on('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      resolve({ server, port });
    });
  });
}

function stopServer(server) {
  return new Promise((resolve) => {
    if (!server) return resolve();
    server.close(() => resolve());
    // close idle connections to let close() finish promptly
    try { server.closeAllConnections && server.closeAllConnections(); } catch (_) {}
  });
}

async function launchBrowser(puppeteer) {
  const opts = {
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
    ],
  };
  if (process.env.PUPPETEER_EXECUTABLE_PATH) {
    opts.executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
  }
  return puppeteer.launch(opts);
}

/**
 * Export a student's calendar to a PNG file using a headless browser.
 *
 * @param {object} args
 * @param {string} args.studentId     Required. The student to render.
 * @param {string} [args.month]       YYYY-MM. Defaults to data.currentMonth.
 * @param {string} [args.outputPath]  Where to write the PNG. Defaults to
 *                                    ./juan-schedule-<name>-<month>.png
 * @param {string} [args.url]         Override the page URL (advanced). By
 *                                    default uses the embedded server.
 * @param {object} [args.viewport]    Puppeteer viewport options.
 * @returns {Promise<{path:string,studentId:string,month:string|null}>}
 */
async function exportCalendarPNG(args, ctx) {
  const { studentId, month, outputPath, url, viewport } = args || {};
  if (!studentId) throw new Error('studentId is required');

  // Pre-flight: confirm the student exists. We do this via the store so
  // the error message is the same as for other tools.
  const data = await ctx.store.load();
  const student = (data.students || []).find(s => s.id === studentId);
  if (!student) throw new Error(`Student not found: ${studentId}`);

  const out = outputPath || defaultOutputPath({
    studentId,
    studentName: student.name,
    month: month || data.currentMonth,
  });
  // Ensure parent directory exists.
  const parent = path.dirname(out);
  if (parent && !fs.existsSync(parent)) {
    fs.mkdirSync(parent, { recursive: true });
  }

  const puppeteer = loadPuppeteer();

  // Start the embedded server (unless the caller supplied their own URL).
  let embedded = null;
  let pageUrl = url;
  if (!pageUrl) {
    const handler = createRequestHandler();
    embedded = await startEmbeddedServer(handler);
    const params = new URLSearchParams();
    params.set('student', studentId);
    if (month) params.set('month', month);
    params.set('export', '1');
    pageUrl = `http://127.0.0.1:${embedded.port}/?${params.toString()}`;
  }

  const browser = await launchBrowser(puppeteer);
  try {
    const page = await browser.newPage();
    await page.setViewport(Object.assign({}, DEFAULT_VIEWPORT, viewport || {}));

    // Help with very large lists of chips by not being stingy on memory.
    page.setDefaultTimeout(NAV_TIMEOUT_MS);

    await page.goto(pageUrl, { waitUntil: 'networkidle0', timeout: NAV_TIMEOUT_MS });

    // Wait for the Web UI to declare itself ready (set in init()).
    await page.waitForFunction(
      () => window.__juanExportReady === true,
      { timeout: RENDER_TIMEOUT_MS }
    );

    // Wait for the calendar to actually render cells. Some months have
    // leading/trailing days from neighbouring months; .cal-cell always
    // exists once the calendar has been drawn.
    await page.waitForSelector('.cal-cell', { timeout: RENDER_TIMEOUT_MS });

    // Small settle delay so any font/layout shifts complete before the
    // shot. The chips use the system stack so this is usually <50ms.
    await new Promise(r => setTimeout(r, 100));

    // Prefer the calendar section (includes banner + grid + legends).
    // Fall back to the grid, then the body.
    const target = await page.evaluateHandle(() => {
      return document.querySelector('#view-calendar')
          || document.querySelector('.cal-grid')
          || document.body;
    });
    const element = target.asElement();
    if (!element) throw new Error('Calendar element not found');
    await element.screenshot({ path: out, type: 'png' });

    return {
      path: out,
      studentId,
      month: month || data.currentMonth,
      studentName: student.name,
      dataPath: getDataPath(),
    };
  } finally {
    try { await browser.close(); } catch (_) {}
    if (embedded) await stopServer(embedded.server);
  }
}

module.exports = { exportCalendarPNG, defaultOutputPath };
