// HTTP server — serves the Web UI and exposes a tiny REST API for
// the Web/CLI/Agent to share the same JSON file.
//
// Endpoints:
//   GET  /             → static index.html (or the project root index.html)
//   GET  /api/ping     → { ok, lang, version }  (used by Web to detect backend)
//   GET  /api/data     → full store JSON
//   PUT  /api/data     → replace full store JSON
//   POST /api/import   → merge/replace (used by Web's "upload to local service")
//
// CORS: allows http://localhost:* and file:// origins (the Web can be opened
// via file:// AND connect back to localhost for sharing).

const http = require('http');
const fs = require('fs');
const path = require('path');
const store = require('./store');
const { getDataPath } = require('./util/path');

const STATIC_DIRS = [
  path.join(__dirname, '..'),                // project root (index.html)
];

function findStaticFile(reqPath) {
  if (reqPath === '/' || reqPath === '') reqPath = '/index.html';
  // Strip query
  const clean = reqPath.split('?')[0];
  for (const dir of STATIC_DIRS) {
    const candidate = path.join(dir, clean);
    // Security: candidate must be inside dir
    if (candidate.startsWith(dir) && fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
      return candidate;
    }
  }
  return null;
}

function sendJson(res, status, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Length': Buffer.byteLength(body),
  });
  res.end(body);
}

function sendFile(res, filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const mime = {
    '.html': 'text/html; charset=utf-8',
    '.js':   'application/javascript; charset=utf-8',
    '.css':  'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png':  'image/png',
    '.svg':  'image/svg+xml',
  }[ext] || 'application/octet-stream';
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not found');
      return;
    }
    res.writeHead(200, {
      'Content-Type': mime,
      'Access-Control-Allow-Origin': '*',
      'Content-Length': data.length,
    });
    res.end(data);
  });
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', c => chunks.push(c));
    req.on('end', () => {
      try {
        const buf = Buffer.concat(chunks).toString('utf8');
        resolve(buf ? JSON.parse(buf) : null);
      } catch (e) {
        reject(e);
      }
    });
    req.on('error', reject);
  });
}

async function handle(req, res) {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    });
    res.end();
    return;
  }

  const parsed = new URL(req.url, 'http://localhost');
  const pathname = parsed.pathname;

  try {
    if (req.method === 'GET' && pathname === '/api/ping') {
      sendJson(res, 200, { ok: true, lang: 'zh', version: '0.1.0' });
      return;
    }
    if (req.method === 'GET' && pathname === '/api/data') {
      const data = (await store.load()) || (await store.seedIfEmpty());
      sendJson(res, 200, data);
      return;
    }
    if (req.method === 'PUT' && pathname === '/api/data') {
      const body = await readBody(req);
      if (!body || typeof body !== 'object') {
        sendJson(res, 400, { error: 'Invalid JSON body' });
        return;
      }
      if (!Array.isArray(body.students) || !Array.isArray(body.courses) || !Array.isArray(body.subjects)) {
        sendJson(res, 400, { error: 'Missing students/courses/subjects arrays' });
        return;
      }
      body.initialized = true;
      await store.save(body);
      sendJson(res, 200, { ok: true });
      return;
    }
    if (req.method === 'POST' && pathname === '/api/import') {
      const body = await readBody(req);
      if (!body || typeof body !== 'object') {
        sendJson(res, 400, { error: 'Invalid JSON body' });
        return;
      }
      const result = await store.importJSON(body);
      sendJson(res, 200, { ok: true, students: result.students.length, courses: result.courses.length });
      return;
    }
    if (req.method === 'GET' && pathname === '/api/path') {
      sendJson(res, 200, { path: getDataPath() });
      return;
    }
    if (req.method === 'GET' && pathname === '/api/export.png') {
      const studentId = parsed.searchParams.get('student');
      const month = parsed.searchParams.get('month') || undefined;
      if (!studentId) {
        sendJson(res, 400, { error: 'Missing ?student=<id>' });
        return;
      }
      try {
        // Lazy require so the route does not pull puppeteer when not used.
        const { exportCalendarPNG } = require('./export-png');
        const out = await exportCalendarPNG({ studentId, month }, { store });
        // Use Content-Disposition with just the basename — the full
        // Windows path contains characters (":", "\") that break HTTP
        // header validation in Node, and clients don't need it anyway.
        const baseName = require('path').basename(out.path);
        res.writeHead(200, {
          'Content-Type': 'image/png',
          'Content-Length': fs.statSync(out.path).size,
          'Content-Disposition': `inline; filename="${baseName}"`,
          'Access-Control-Allow-Origin': '*',
        });
        fs.createReadStream(out.path).pipe(res);
      } catch (e) {
        sendJson(res, 500, { error: e.message || String(e) });
      }
      return;
    }

    if (req.method === 'GET') {
      const file = findStaticFile(pathname);
      if (file) {
        sendFile(res, file);
        return;
      }
    }

    sendJson(res, 404, { error: 'Not found', path: pathname });
  } catch (e) {
    console.error('[server] error', e);
    sendJson(res, 500, { error: e.message || String(e) });
  }
}

// The HTTP request handler — usable both as a long-running server (via
// start()) and as a one-shot in-process server (e.g. for Puppeteer export,
// which boots it on a random port, runs a render, then closes it).
function createRequestHandler() {
  return handle;
}

function start({ port = 3737, host = '127.0.0.1' } = {}) {
  return new Promise((resolve, reject) => {
    const server = http.createServer(handle);
    server.on('error', err => {
      if (err.code === 'EADDRINUSE') {
        reject(new Error(`端口 ${port} 已被占用，请用 --port 指定其他端口`));
      } else {
        reject(err);
      }
    });
    server.listen(port, host, () => {
      console.log(`juan-schedule web server: http://${host}:${port}`);
      console.log(`Data file: ${getDataPath()}`);
      resolve(server);
    });
  });
}

module.exports = { start, handle, createRequestHandler };
