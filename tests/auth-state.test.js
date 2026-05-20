import test from 'node:test';
import assert from 'node:assert/strict';
import { getInitialClientState, buildStoredSessionPayload, buildConfirmationDialogModel } from '../ui-helpers.js';

test('getInitialClientState starts logged out with empty users', () => {
  const state = getInitialClientState();

  assert.deepEqual(state.users, []);
  assert.equal(state.currentUserId, null);
  assert.equal(state.authView, 'login');
});

test('buildStoredSessionPayload stores token and auth view only', () => {
  const payload = buildStoredSessionPayload('abc-token', 'register');

  assert.deepEqual(payload, {
    token: 'abc-token',
    authView: 'register'
  });
});

test('buildConfirmationDialogModel creates logout confirmation config', () => {
  const config = buildConfirmationDialogModel('logout-account');

  assert.equal(config.title, 'Đăng xuất tài khoản');
  assert.equal(config.confirmText, 'Đăng xuất');
  assert.equal(config.cancelText, 'Ở lại');
  assert.equal(config.tone, 'warning');
});
