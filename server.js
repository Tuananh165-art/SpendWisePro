import http from 'node:http';
import path from 'node:path';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import crypto from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';

const DEFAULT_STATIC_DIR = path.resolve('F:/SpendWisePro');
const DEFAULT_DB_PATH = path.resolve('F:/SpendWisePro/spendwise.sqlite');

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function defaultFinanceState(user) {
  return {
    users: [
      {
        id: user.id,
        fullName: user.fullName,
        email: user.email
      }
    ],
    currentUserId: user.id,
    authView: 'login',
    categories: [
      { id: 'cat-salary', name: 'Lương', type: 'income', icon: '💼' },
      { id: 'cat-bonus', name: 'Thưởng', type: 'income', icon: '🎉' },
      { id: 'cat-food', name: 'Ăn uống', type: 'expense', icon: '🍜' },
      { id: 'cat-transport', name: 'Di chuyển', type: 'expense', icon: '🛵' },
      { id: 'cat-bills', name: 'Hóa đơn', type: 'expense', icon: '💡' },
      { id: 'cat-entertainment', name: 'Giải trí', type: 'expense', icon: '🎬' },
      { id: 'cat-shopping', name: 'Mua sắm', type: 'expense', icon: '🛍️' },
      { id: 'cat-transfer', name: 'Chuyển ví', type: 'expense', icon: '⇄' }
    ],
    wallets: [
      { id: 'wallet-cash', name: 'Tiền mặt', type: 'CASH', icon: '💵', balance: 3500000, openingBalance: 3500000 },
      { id: 'wallet-vpbank', name: 'VPBank', type: 'BANK', icon: '🏦', balance: 22800000, openingBalance: 22800000 },
      { id: 'wallet-momo', name: 'Ví MoMo', type: 'WALLET', icon: '📱', balance: 1560000, openingBalance: 1560000 },
      { id: 'wallet-zalo', name: 'Ví Zalo Pay', type: 'WALLET', icon: '💳', balance: 820000, openingBalance: 820000 },
      { id: 'wallet-saving', name: 'Tiết kiệm', type: 'BANK', icon: '💎', balance: 18000000, openingBalance: 18000000 },
      { id: 'wallet-usd', name: 'USD Account', type: 'BANK', icon: '💲', balance: 4200000, openingBalance: 4200000 }
    ],
    transactions: [
      { id: 'tx1', type: 'income', amount: 15000000, categoryId: 'cat-salary', walletId: 'wallet-vpbank', date: '2026-05-01', time: '08:00', description: 'Lương tháng 5', tag: '' },
      { id: 'tx2', type: 'expense', amount: 450000, categoryId: 'cat-food', walletId: 'wallet-cash', date: '2026-05-02', time: '11:20', description: 'Ăn trưa cả tuần', tag: '' },
      { id: 'tx3', type: 'expense', amount: 180000, categoryId: 'cat-transport', walletId: 'wallet-momo', date: '2026-05-03', time: '07:35', description: 'Đổ xăng', tag: '' },
      { id: 'tx4', type: 'expense', amount: 600000, categoryId: 'cat-bills', walletId: 'wallet-vpbank', date: '2026-05-05', time: '20:10', description: 'Tiền điện nước', tag: 'Định kỳ' },
      { id: 'tx5', type: 'expense', amount: 320000, categoryId: 'cat-entertainment', walletId: 'wallet-zalo', date: '2026-05-10', time: '18:30', description: 'Xem phim cuối tuần', tag: '' },
      { id: 'tx6', type: 'income', amount: 2000000, categoryId: 'cat-bonus', walletId: 'wallet-vpbank', date: '2026-04-20', time: '09:00', description: 'Thưởng dự án', tag: '' },
      { id: 'tx7', type: 'expense', amount: 2920000, categoryId: 'cat-shopping', walletId: 'wallet-vpbank', date: '2026-05-14', time: '16:15', description: 'Mua sắm gia đình', tag: '' },
      { id: 'tx8', type: 'expense', amount: 300000, categoryId: 'cat-food', walletId: 'wallet-cash', date: '2026-04-22', time: '10:00', description: 'Đi chợ', tag: '' },
      { id: 'tx9', type: 'expense', amount: 210000, categoryId: 'cat-transport', walletId: 'wallet-momo', date: '2026-03-18', time: '08:45', description: 'Gửi xe', tag: '' }
    ],
    budgets: [
      { id: 'budget-food-2026-05', categoryId: 'cat-food', month: '2026-05', amount: 800000 },
      { id: 'budget-transport-2026-05', categoryId: 'cat-transport', month: '2026-05', amount: 400000 },
      { id: 'budget-bills-2026-05', categoryId: 'cat-bills', month: '2026-05', amount: 700000 },
      { id: 'budget-shopping-2026-05', categoryId: 'cat-shopping', month: '2026-05', amount: 3000000 },
      { id: 'budget-entertainment-2026-05', categoryId: 'cat-entertainment', month: '2026-05', amount: 1800000 }
    ],
    goals: [
      { id: 'goal1', name: 'iPhone 15 Pro', target: 28000000, current: 12000000, deadline: '2026-09-30' },
      { id: 'goal2', name: 'Du lịch Nhật Bản', target: 45000000, current: 15000000, deadline: '2026-12-15' },
      { id: 'goal3', name: 'Tiết kiệm khẩn cấp', target: 50000000, current: 35000000, deadline: '2026-08-01' },
      { id: 'goal4', name: 'Mua laptop mới', target: 32000000, current: 12500000, deadline: '2026-10-20' }
    ],
    debts: [
      { id: 'debt1', name: 'Nợ thẻ tín dụng', amount: 4200000, type: 'payable', due: '2026-05-28', note: 'Thanh toán cuối tháng' },
      { id: 'debt2', name: 'Anh Minh mượn', amount: 1800000, type: 'receivable', due: '2026-06-05', note: 'Ứng trước chuyến đi' },
      { id: 'debt3', name: 'Khoản vay laptop', amount: 6200000, type: 'payable', due: '2026-06-18', note: 'Kỳ trả thứ 3' }
    ],
    alerts: [],
    filters: {
      search: '',
      month: '2026-05',
      wallet: 'all',
      type: 'all',
      category: 'all'
    },
    analytics: {
      tab: 'category',
      month: '2026-05',
      year: 2026
    }
  };
}

function ensureDir(filePath) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function openDatabase(dbPath) {
  ensureDir(dbPath);
  const db = new DatabaseSync(dbPath);
  db.exec(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      full_name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      password_salt TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS sessions (
      token TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS user_states (
      user_id TEXT PRIMARY KEY,
      state_json TEXT NOT NULL,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS password_reset_requests (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);
  return db;
}

function safeUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    fullName: row.full_name,
    email: row.email
  };
}

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || '').trim());
}

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return { salt, hash };
}

function comparePassword(password, salt, expectedHash) {
  const actualHash = hashPassword(password, salt).hash;
  return crypto.timingSafeEqual(Buffer.from(actualHash, 'hex'), Buffer.from(expectedHash, 'hex'));
}

function createToken() {
  return crypto.randomBytes(32).toString('hex');
}

function createJsonResponse(status, payload) {
  return {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify(payload)
  };
}

async function readJson(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const text = Buffer.concat(chunks).toString('utf8');
  if (!text) return {};
  return JSON.parse(text);
}

function getTokenFromRequest(req) {
  const auth = req.headers.authorization || '';
  if (!auth.startsWith('Bearer ')) return null;
  return auth.slice('Bearer '.length).trim();
}

function getSessionUser(db, token) {
  if (!token) return null;
  return db.prepare(`
    SELECT users.id, users.full_name, users.email
    FROM sessions
    JOIN users ON users.id = sessions.user_id
    WHERE sessions.token = ?
  `).get(token);
}

function getUserState(db, userRow) {
  const row = db.prepare('SELECT state_json FROM user_states WHERE user_id = ?').get(userRow.id);
  if (!row) {
    const state = defaultFinanceState(safeUser(userRow));
    db.prepare('INSERT INTO user_states (user_id, state_json) VALUES (?, ?)').run(userRow.id, JSON.stringify(state));
    return state;
  }

  try {
    const parsed = JSON.parse(row.state_json);
    if (!parsed.users || !Array.isArray(parsed.users) || !parsed.users.length) {
      parsed.users = [safeUser(userRow)];
    } else {
      parsed.users = [safeUser(userRow)];
    }
    parsed.currentUserId = userRow.id;
    return parsed;
  } catch {
    const state = defaultFinanceState(safeUser(userRow));
    db.prepare('UPDATE user_states SET state_json = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?').run(JSON.stringify(state), userRow.id);
    return state;
  }
}

function saveUserState(db, userRow, state) {
  const nextState = clone(state);
  nextState.users = [safeUser(userRow)];
  nextState.currentUserId = userRow.id;
  db.prepare(`
    INSERT INTO user_states (user_id, state_json, updated_at)
    VALUES (?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(user_id) DO UPDATE SET state_json = excluded.state_json, updated_at = CURRENT_TIMESTAMP
  `).run(userRow.id, JSON.stringify(nextState));
  return nextState;
}

function notFound() {
  return createJsonResponse(404, { message: 'Not found' });
}

async function serveStatic(req, staticDir) {
  const url = new URL(req.url, 'http://localhost');
  let pathname = decodeURIComponent(url.pathname);
  if (pathname === '/') pathname = '/index.html';
  const filePath = path.normalize(path.join(staticDir, pathname));
  if (!filePath.startsWith(path.normalize(staticDir))) {
    return createJsonResponse(403, { message: 'Forbidden' });
  }

  try {
    const data = await fsp.readFile(filePath);
    const ext = path.extname(filePath).toLowerCase();
    const contentType = {
      '.html': 'text/html; charset=utf-8',
      '.js': 'text/javascript; charset=utf-8',
      '.css': 'text/css; charset=utf-8',
      '.json': 'application/json; charset=utf-8',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.svg': 'image/svg+xml',
      '.ico': 'image/x-icon'
    }[ext] || 'application/octet-stream';
    return { status: 200, headers: { 'Content-Type': contentType }, body: data };
  } catch {
    const fallback = path.join(staticDir, 'index.html');
    const data = await fsp.readFile(fallback);
    return { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' }, body: data };
  }
}

export function createApp({ dbPath = DEFAULT_DB_PATH, staticDir = DEFAULT_STATIC_DIR } = {}) {
  const db = openDatabase(dbPath);

  const server = http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url, 'http://localhost');

      if (url.pathname === '/api/auth/register' && req.method === 'POST') {
        const body = await readJson(req);
        const fullName = String(body.fullName || '').trim();
        const email = normalizeEmail(body.email);
        const password = String(body.password || '');
        const confirmPassword = String(body.confirmPassword || '');

        if (!fullName) {
          return writeResponse(res, createJsonResponse(400, { message: 'Họ tên không được để trống' }));
        }
        if (!validateEmail(email)) {
          return writeResponse(res, createJsonResponse(400, { message: 'Email không hợp lệ' }));
        }
        if (password.length < 6) {
          return writeResponse(res, createJsonResponse(400, { message: 'Mật khẩu tối thiểu 6 ký tự' }));
        }
        if (password !== confirmPassword) {
          return writeResponse(res, createJsonResponse(400, { message: 'Mật khẩu không khớp' }));
        }

        const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
        if (existing) {
          return writeResponse(res, createJsonResponse(409, { message: 'Email này đã được đăng ký.' }));
        }

        const userId = crypto.randomUUID();
        const { salt, hash } = hashPassword(password);
        db.prepare('INSERT INTO users (id, full_name, email, password_hash, password_salt) VALUES (?, ?, ?, ?, ?)').run(userId, fullName, email, hash, salt);

        const userRow = db.prepare('SELECT id, full_name, email FROM users WHERE id = ?').get(userId);
        const token = createToken();
        db.prepare('INSERT INTO sessions (token, user_id) VALUES (?, ?)').run(token, userId);
        const state = saveUserState(db, userRow, defaultFinanceState(safeUser(userRow)));

        return writeResponse(res, createJsonResponse(201, { token, user: safeUser(userRow), state }));
      }

      if (url.pathname === '/api/auth/login' && req.method === 'POST') {
        const body = await readJson(req);
        const email = normalizeEmail(body.email);
        const password = String(body.password || '');
        const userRow = db.prepare('SELECT * FROM users WHERE email = ?').get(email);

        if (!userRow || !comparePassword(password, userRow.password_salt, userRow.password_hash)) {
          return writeResponse(res, createJsonResponse(401, { message: 'Email hoặc mật khẩu không đúng' }));
        }

        const token = createToken();
        db.prepare('INSERT INTO sessions (token, user_id) VALUES (?, ?)').run(token, userRow.id);
        const state = getUserState(db, userRow);
        return writeResponse(res, createJsonResponse(200, { token, user: safeUser(userRow), state }));
      }

      if (url.pathname === '/api/auth/logout' && req.method === 'POST') {
        const token = getTokenFromRequest(req);
        if (token) db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
        return writeResponse(res, createJsonResponse(200, { message: 'Đăng xuất thành công' }));
      }

      if (url.pathname === '/api/auth/me' && req.method === 'GET') {
        const token = getTokenFromRequest(req);
        const userRow = getSessionUser(db, token);
        if (!userRow) {
          return writeResponse(res, createJsonResponse(401, { message: 'Phiên đăng nhập không hợp lệ' }));
        }
        return writeResponse(res, createJsonResponse(200, { user: safeUser(userRow) }));
      }

      if (url.pathname === '/api/auth/forgot-password' && req.method === 'POST') {
        const body = await readJson(req);
        const email = normalizeEmail(body.email);
        const userRow = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
        if (userRow) {
          db.prepare('INSERT INTO password_reset_requests (id, user_id) VALUES (?, ?)').run(crypto.randomUUID(), userRow.id);
        }
        return writeResponse(res, createJsonResponse(200, { message: 'Nếu email tồn tại, yêu cầu khôi phục đã được ghi nhận.' }));
      }

      if (url.pathname === '/api/state' && req.method === 'GET') {
        const token = getTokenFromRequest(req);
        const userRow = getSessionUser(db, token);
        if (!userRow) {
          return writeResponse(res, createJsonResponse(401, { message: 'Phiên đăng nhập không hợp lệ' }));
        }
        const state = getUserState(db, userRow);
        return writeResponse(res, createJsonResponse(200, { state }));
      }

      if (url.pathname === '/api/state' && req.method === 'PUT') {
        const token = getTokenFromRequest(req);
        const userRow = getSessionUser(db, token);
        if (!userRow) {
          return writeResponse(res, createJsonResponse(401, { message: 'Phiên đăng nhập không hợp lệ' }));
        }
        const body = await readJson(req);
        if (!body || typeof body.state !== 'object' || body.state === null) {
          return writeResponse(res, createJsonResponse(400, { message: 'Payload state không hợp lệ' }));
        }
        const state = saveUserState(db, userRow, body.state);
        return writeResponse(res, createJsonResponse(200, { state }));
      }

      if (url.pathname.startsWith('/api/')) {
        return writeResponse(res, notFound());
      }

      return writeResponse(res, await serveStatic(req, staticDir));
    } catch (error) {
      return writeResponse(res, createJsonResponse(500, { message: 'Internal server error', detail: error.message }));
    }
  });

  server.db = db;
  return server;
}

function writeResponse(res, response) {
  res.writeHead(response.status, response.headers);
  res.end(response.body);
}

const isDirectRun = (() => {
  const entry = process.argv[1];
  if (!entry) return false;
  const normalizedEntry = path.resolve(entry).replace(/\\/g, '/');
  const currentFile = new URL(import.meta.url).pathname.replace(/^\//, '').replace(/\\/g, '/');
  return currentFile.toLowerCase().endsWith(normalizedEntry.toLowerCase()) || normalizedEntry.toLowerCase().endsWith('server.js');
})();

if (isDirectRun) {
  const port = Number(process.env.PORT || 8081);
  const app = createApp({
    dbPath: process.env.SPENDWISE_DB_PATH || DEFAULT_DB_PATH,
    staticDir: process.env.SPENDWISE_STATIC_DIR || DEFAULT_STATIC_DIR
  });
  app.listen(port, '0.0.0.0', () => {
    console.log(`SpendWise Pro server running at http://localhost:${port}`);
  });
}
