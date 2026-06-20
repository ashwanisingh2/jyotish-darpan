'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');
const reading = require('./api/reading');
const health = require('./api/health');
const geocode = require('./api/geocode');
const kundali = require('./api/kundali');
const panchang = require('./api/panchang');

const PORT = Number(process.env.PORT || 8765);
const HOST = process.env.HOST || '127.0.0.1';
const ROOT = path.resolve(__dirname);
const MAX_BODY_BYTES = 20_000;

const API_ROUTES = {
  '/api/reading': reading,
  '/api/health': health,
  '/health': health,
  '/api/geocode': geocode,
  '/api/kundali': kundali,
  '/api/panchang': panchang
};

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
  '.ico': 'image/x-icon'
};

function applySecurityHeaders(res) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader('Content-Security-Policy', "default-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; connect-src 'self'; img-src 'self' data:; base-uri 'none'; form-action 'self'");
}

function enhanceResponse(res) {
  res.status = code => {
    res.statusCode = code;
    return res;
  };
  res.json = value => {
    if (!res.headersSent) res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify(value));
  };
  return res;
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (Buffer.byteLength(body) > MAX_BODY_BYTES) reject(new Error('Request too large'));
    });
    req.on('end', () => {
      if (!body) return resolve({});
      try { resolve(JSON.parse(body)); } catch { reject(new Error('Invalid JSON')); }
    });
    req.on('error', reject);
  });
}

function serveStatic(req, res, pathname) {
  const requested = pathname === '/' ? 'index.html' : pathname.slice(1);
  const file = path.resolve(ROOT, requested);
  const type = MIME_TYPES[path.extname(file)];
  if (!file.startsWith(ROOT + path.sep) || !type) return res.status(404).json({ error: 'Not found' });
  fs.readFile(file, (error, data) => {
    if (error) return res.status(404).json({ error: 'Not found' });
    res.setHeader('Content-Type', type);
    res.setHeader('Cache-Control', type.startsWith('text/html') ? 'no-cache' : 'public, max-age=3600');
    res.statusCode = 200;
    res.end(req.method === 'HEAD' ? '' : data);
  });
}

const server = http.createServer(async (req, rawRes) => {
  const res = enhanceResponse(rawRes);
  applySecurityHeaders(res);
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const handler = API_ROUTES[url.pathname];

  if (handler) {
    req.query = Object.fromEntries(url.searchParams);
    if (req.method === 'POST') {
      try { req.body = await readJsonBody(req); }
      catch (error) { return res.status(400).json({ error: error.message }); }
    }
    return handler(req, res);
  }

  if (req.method !== 'GET' && req.method !== 'HEAD') return res.status(405).json({ error: 'Method not allowed' });
  return serveStatic(req, res, url.pathname);
});

server.listen(PORT, HOST, () => console.log(`Jyotish Darpan running on http://${HOST}:${PORT}`));
