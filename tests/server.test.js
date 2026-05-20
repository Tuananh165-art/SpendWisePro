import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs/promises';
import { createApp } from '../server.js';

async function createTestContext() {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'spendwise-server-'));
  const dbPath = path.join(tempDir, 'test.sqlite');
  const app = createApp({ dbPath, staticDir: path.resolve('F:/SpendWisePro') });
  await new Promise(resolve => app.listen(0, '127.0.0.1', resolve));
  const address = app.address();
  const baseUrl = `http://127.0.0.1:${address.port}`;

  return {
    app,
    baseUrl,
    dbPath,
    async close() {
      await new Promise((resolve, reject) => app.close(error => error ? reject(error) : resolve()));
      if (app.db && typeof app.db.close === 'function') {
        app.db.close();
      }
      await fs.rm(tempDir, { recursive: true, force: true });
    }
  };
}

async function request(baseUrl, pathname, { method = 'GET', token, body } = {}) {
  const response = await fetch(`${baseUrl}${pathname}`, {
    method,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: body ? JSON.stringify(body) : undefined
  });

  const text = await response.text();
  return {
    status: response.status,
    json: text ? JSON.parse(text) : null
  };
}

test('register returns token and current user profile', async () => {
  const ctx = await createTestContext();
  try {
    const registerRes = await request(ctx.baseUrl, '/api/auth/register', {
      method: 'POST',
      body: {
        fullName: 'Nguyen Van A',
        email: 'a@example.com',
        password: '123456',
        confirmPassword: '123456'
      }
    });

    assert.equal(registerRes.status, 201);
    assert.ok(registerRes.json.token);
    assert.equal(registerRes.json.user.fullName, 'Nguyen Van A');

    const meRes = await request(ctx.baseUrl, '/api/auth/me', {
      token: registerRes.json.token
    });

    assert.equal(meRes.status, 200);
    assert.equal(meRes.json.user.email, 'a@example.com');
  } finally {
    await ctx.close();
  }
});

test('login rejects wrong password and accepts correct password', async () => {
  const ctx = await createTestContext();
  try {
    await request(ctx.baseUrl, '/api/auth/register', {
      method: 'POST',
      body: {
        fullName: 'Demo User',
        email: 'demo@example.com',
        password: '123456',
        confirmPassword: '123456'
      }
    });

    const wrongRes = await request(ctx.baseUrl, '/api/auth/login', {
      method: 'POST',
      body: {
        email: 'demo@example.com',
        password: 'wrong-password'
      }
    });

    assert.equal(wrongRes.status, 401);
    assert.match(wrongRes.json.message, /không đúng/i);

    const loginRes = await request(ctx.baseUrl, '/api/auth/login', {
      method: 'POST',
      body: {
        email: 'demo@example.com',
        password: '123456'
      }
    });

    assert.equal(loginRes.status, 200);
    assert.ok(loginRes.json.token);
  } finally {
    await ctx.close();
  }
});

test('authenticated user can load and persist state to sqlite', async () => {
  const ctx = await createTestContext();
  try {
    const registerRes = await request(ctx.baseUrl, '/api/auth/register', {
      method: 'POST',
      body: {
        fullName: 'State User',
        email: 'state@example.com',
        password: '123456',
        confirmPassword: '123456'
      }
    });

    const token = registerRes.json.token;
    const initialStateRes = await request(ctx.baseUrl, '/api/state', { token });
    assert.equal(initialStateRes.status, 200);
    assert.ok(Array.isArray(initialStateRes.json.state.transactions));

    const nextState = {
      ...initialStateRes.json.state,
      wallets: [
        ...initialStateRes.json.state.wallets,
        { id: 'wallet-new', name: 'Techcombank', type: 'BANK', icon: '🏦', openingBalance: 5000000, balance: 5000000 }
      ]
    };

    const saveRes = await request(ctx.baseUrl, '/api/state', {
      method: 'PUT',
      token,
      body: { state: nextState }
    });

    assert.equal(saveRes.status, 200);
    assert.equal(saveRes.json.state.wallets.some(item => item.id === 'wallet-new'), true);

    const reloadRes = await request(ctx.baseUrl, '/api/state', { token });
    assert.equal(reloadRes.status, 200);
    assert.equal(reloadRes.json.state.wallets.some(item => item.id === 'wallet-new'), true);
  } finally {
    await ctx.close();
  }
});

test('user state is isolated per account', async () => {
  const ctx = await createTestContext();
  try {
    const user1 = await request(ctx.baseUrl, '/api/auth/register', {
      method: 'POST',
      body: {
        fullName: 'User One',
        email: 'one@example.com',
        password: '123456',
        confirmPassword: '123456'
      }
    });
    const user2 = await request(ctx.baseUrl, '/api/auth/register', {
      method: 'POST',
      body: {
        fullName: 'User Two',
        email: 'two@example.com',
        password: '123456',
        confirmPassword: '123456'
      }
    });

    const user1State = await request(ctx.baseUrl, '/api/state', { token: user1.json.token });
    const changed = {
      ...user1State.json.state,
      goals: [{ id: 'goal-only-user-1', name: 'Laptop', target: 10000000, current: 1000000, deadline: '2026-12-31' }]
    };

    await request(ctx.baseUrl, '/api/state', {
      method: 'PUT',
      token: user1.json.token,
      body: { state: changed }
    });

    const reload1 = await request(ctx.baseUrl, '/api/state', { token: user1.json.token });
    const reload2 = await request(ctx.baseUrl, '/api/state', { token: user2.json.token });

    assert.equal(reload1.json.state.goals.some(item => item.id === 'goal-only-user-1'), true);
    assert.equal(reload2.json.state.goals.some(item => item.id === 'goal-only-user-1'), false);
  } finally {
    await ctx.close();
  }
});

test('logout invalidates bearer token', async () => {
  const ctx = await createTestContext();
  try {
    const registerRes = await request(ctx.baseUrl, '/api/auth/register', {
      method: 'POST',
      body: {
        fullName: 'Logout User',
        email: 'logout@example.com',
        password: '123456',
        confirmPassword: '123456'
      }
    });

    const token = registerRes.json.token;
    const logoutRes = await request(ctx.baseUrl, '/api/auth/logout', {
      method: 'POST',
      token
    });

    assert.equal(logoutRes.status, 200);

    const meRes = await request(ctx.baseUrl, '/api/auth/me', { token });
    assert.equal(meRes.status, 401);
  } finally {
    await ctx.close();
  }
});
