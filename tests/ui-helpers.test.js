import test from 'node:test';
import assert from 'node:assert/strict';
import { buildConfirmationDialogModel } from '../ui-helpers.js';

test('buildConfirmationDialogModel creates future transaction confirmation config', () => {
  const result = buildConfirmationDialogModel('future-transaction');

  assert.equal(result.title, 'Xác nhận giao dịch tương lai');
  assert.match(result.message, /tương lai/i);
  assert.equal(result.confirmText, 'Tiếp tục');
  assert.equal(result.cancelText, 'Quay lại');
  assert.equal(result.tone, 'warning');
});

test('buildConfirmationDialogModel creates category delete confirmation config', () => {
  const result = buildConfirmationDialogModel('delete-category', { categoryName: 'Y tế' });

  assert.equal(result.title, 'Xóa danh mục');
  assert.match(result.message, /Y tế/);
  assert.match(result.message, /không thể hoàn tác/i);
  assert.equal(result.confirmText, 'Xóa danh mục');
  assert.equal(result.tone, 'danger');
});

test('buildConfirmationDialogModel creates transfer delete confirmation config', () => {
  const result = buildConfirmationDialogModel('delete-transaction-transfer', { description: 'Chuyển tiền giữa ví' });

  assert.equal(result.title, 'Xóa giao dịch chuyển tiền');
  assert.match(result.message, /xóa cả 2 bút toán liên kết/i);
  assert.equal(result.confirmText, 'Xóa giao dịch');
  assert.equal(result.tone, 'danger');
});

test('buildConfirmationDialogModel creates budget delete confirmation config', () => {
  const result = buildConfirmationDialogModel('delete-budget', { categoryName: 'Ăn uống' });

  assert.equal(result.title, 'Xóa hạn mức');
  assert.match(result.message, /Ăn uống/);
  assert.equal(result.confirmText, 'Xóa hạn mức');
});
