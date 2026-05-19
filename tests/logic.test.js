import test from 'node:test';
import assert from 'node:assert/strict';
import {
  validateCategory,
  validateTransaction,
  computeMonthlySummary,
  aggregateExpenseByCategory,
  aggregateYearlyTotals,
  computeBudgetStatuses,
  buildBudgetAlert,
  validateWallet,
  transferBetweenWallets,
  validateGoal,
  computeGoalProgress,
  computeWalletBalances,
  deleteCategoryById,
  deleteBudgetById,
  deleteGoalById,
  validateDebt
} from '../logic.js';

const categories = [
  { id: 'salary', name: 'Lương', type: 'income', icon: '💼' },
  { id: 'food', name: 'Ăn uống', type: 'expense', icon: '🍜' },
  { id: 'transport', name: 'Di chuyển', type: 'expense', icon: '🛵' }
];

const transactions = [
  { id: 't1', type: 'income', amount: 10000000, categoryId: 'salary', date: '2026-05-01', description: '' },
  { id: 't2', type: 'expense', amount: 500000, categoryId: 'food', date: '2026-05-02', description: '' },
  { id: 't3', type: 'expense', amount: 250000, categoryId: 'transport', date: '2026-05-03', description: '' },
  { id: 't4', type: 'expense', amount: 300000, categoryId: 'food', date: '2026-04-02', description: '' }
];

const budgets = [
  { id: 'b1', categoryId: 'food', month: '2026-05', amount: 700000 },
  { id: 'b2', categoryId: 'transport', month: '2026-05', amount: 500000 }
];

const wallets = [
  { id: 'cash', name: 'Tiền mặt', type: 'CASH', balance: 1000000 },
  { id: 'bank', name: 'VPBank', type: 'BANK', balance: 5000000 }
];

test('validateCategory rejects empty category name', () => {
  const result = validateCategory(categories, { name: '   ', type: 'expense', icon: '🍜' });
  assert.equal(result.ok, false);
  assert.match(result.message, /không được để trống/i);
});

test('validateCategory rejects duplicate name ignoring spaces and case', () => {
  const result = validateCategory(categories, { name: '  ăn   UỐng ', type: 'expense', icon: '🍜' });
  assert.equal(result.ok, false);
  assert.match(result.message, /đã tồn tại/i);
});

test('validateTransaction rejects missing category', () => {
  const result = validateTransaction(categories, { type: 'expense', amount: 10000, categoryId: '', date: '2026-05-05' });
  assert.equal(result.ok, false);
  assert.match(result.message, /vui lòng chọn danh mục/i);
});

test('validateTransaction rejects invalid amount', () => {
  const result = validateTransaction(categories, { type: 'expense', amount: 0, categoryId: 'food', date: '2026-05-05' });
  assert.equal(result.ok, false);
  assert.match(result.message, /lớn hơn 0/i);
});

test('computeMonthlySummary returns income expense balance and count', () => {
  const result = computeMonthlySummary(transactions, '2026-05');
  assert.deepEqual(result, { income: 10000000, expense: 750000, balance: 9250000, count: 3 });
});

test('aggregateExpenseByCategory returns sorted category totals with percentage', () => {
  const result = aggregateExpenseByCategory(transactions, categories, '2026-05');
  assert.equal(result[0].name, 'Ăn uống');
  assert.equal(result[0].amount, 500000);
  assert.equal(result[1].name, 'Di chuyển');
  assert.equal(result[1].amount, 250000);
});

test('aggregateYearlyTotals groups transactions by month', () => {
  const result = aggregateYearlyTotals(transactions, 2026);
  assert.equal(result[4].income, 10000000);
  assert.equal(result[4].expense, 750000);
  assert.equal(result[3].expense, 300000);
});

test('computeBudgetStatuses marks warning/critical/danger correctly', () => {
  const result = computeBudgetStatuses(categories, transactions, budgets, '2026-05');
  assert.equal(result[0].categoryName, 'Ăn uống');
  assert.equal(result[0].usage, 71.43);
  assert.equal(result[0].level, 'warning');
});

test('buildBudgetAlert returns warning alert when threshold exceeded', () => {
  const latest = { id: 'x', type: 'expense', amount: 500000, categoryId: 'food', date: '2026-05-12', description: '' };
  const newTransactions = [...transactions, latest];
  const result = buildBudgetAlert(latest, categories, budgets, newTransactions, '2026-05');
  assert.equal(result.level, 'danger');
  assert.match(result.text, /vượt hạn mức/i);
});

test('validateWallet rejects duplicate wallet name', () => {
  const result = validateWallet(wallets, { name: '  tiền Mặt ', type: 'CASH', balance: 200000 });
  assert.equal(result.ok, false);
  assert.match(result.message, /ví này đã tồn tại/i);
});

test('transferBetweenWallets moves money between two wallets', () => {
  const result = transferBetweenWallets(wallets, { fromWalletId: 'bank', toWalletId: 'cash', amount: 700000 });
  assert.equal(result.ok, true);
  assert.equal(result.wallets.find(item => item.id === 'bank').balance, 4300000);
  assert.equal(result.wallets.find(item => item.id === 'cash').balance, 1700000);
});

test('transferBetweenWallets rejects insufficient balance', () => {
  const result = transferBetweenWallets(wallets, { fromWalletId: 'cash', toWalletId: 'bank', amount: 2000000 });
  assert.equal(result.ok, false);
  assert.match(result.message, /không đủ số dư/i);
});

test('validateGoal rejects when current exceeds target', () => {
  const result = validateGoal({ name: 'Laptop', target: 10000000, current: 12000000, deadline: '2026-08-01' });
  assert.equal(result.ok, false);
  assert.match(result.message, /không được lớn hơn mục tiêu/i);
});

test('computeGoalProgress rounds percentage', () => {
  assert.equal(computeGoalProgress({ target: 28000000, current: 12000000 }), 43);
});

test('deleteBudgetById removes only the selected budget id', () => {
  const duplicatedCategoryBudgets = [
    { id: 'b1', categoryId: 'food', month: '2026-05', amount: 700000 },
    { id: 'b2', categoryId: 'food', month: '2026-06', amount: 900000 },
    { id: 'b3', categoryId: 'transport', month: '2026-05', amount: 500000 }
  ];
  const result = deleteBudgetById(duplicatedCategoryBudgets, 'b1');
  assert.equal(result.ok, true);
  assert.deepEqual(result.budgets.map(item => item.id), ['b2', 'b3']);
});

test('deleteGoalById removes only the selected goal id', () => {
  const goals = [
    { id: 'g1', name: 'Laptop', target: 10000000, current: 2000000, deadline: '2026-08-01' },
    { id: 'g2', name: 'Trip', target: 20000000, current: 5000000, deadline: '2026-09-01' }
  ];
  const result = deleteGoalById(goals, 'g1');
  assert.equal(result.ok, true);
  assert.deepEqual(result.goals.map(item => item.id), ['g2']);
});

test('validateDebt accepts payable debt with valid fields', () => {
  const result = validateDebt({ name: 'Nợ thẻ', amount: 2000000, type: 'payable', due: '2026-06-01', note: 'abc' });
  assert.equal(result.ok, true);
});

test('validateDebt rejects invalid type', () => {
  const result = validateDebt({ name: 'Nợ thẻ', amount: 2000000, type: 'weird', due: '2026-06-01', note: 'abc' });
  assert.equal(result.ok, false);
  assert.match(result.message, /không hợp lệ/i);
});

test('computeWalletBalances derives wallet balances from opening balance and transactions', () => {
  const baseWallets = [
    { id: 'cash', name: 'Tiền mặt', type: 'CASH', openingBalance: 1000000, balance: 1000000 },
    { id: 'bank', name: 'VPBank', type: 'BANK', openingBalance: 5000000, balance: 5000000 }
  ];
  const txs = [
    { id: 't1', type: 'expense', walletId: 'cash', amount: 250000 },
    { id: 't2', type: 'income', walletId: 'cash', amount: 100000 },
    { id: 't3', type: 'income', walletId: 'bank', amount: 300000 },
    { id: 't4', type: 'expense', walletId: 'bank', amount: 750000 }
  ];

  const result = computeWalletBalances(baseWallets, txs);

  assert.equal(result.find(item => item.id === 'cash').balance, 850000);
  assert.equal(result.find(item => item.id === 'bank').balance, 4550000);
});

test('computeWalletBalances handles transfer as expense+income pair without changing total assets', () => {
  const baseWallets = [
    { id: 'cash', name: 'Tiền mặt', type: 'CASH', openingBalance: 1000000, balance: 1000000 },
    { id: 'bank', name: 'VPBank', type: 'BANK', openingBalance: 5000000, balance: 5000000 }
  ];
  const txs = [
    { id: 't1', transferId: 'tr1', type: 'expense', walletId: 'bank', categoryId: 'cat-transfer', amount: 700000 },
    { id: 't2', transferId: 'tr1', type: 'income', walletId: 'cash', categoryId: 'cat-transfer', amount: 700000 }
  ];

  const result = computeWalletBalances(baseWallets, txs);
  const total = result.reduce((sum, item) => sum + Number(item.balance), 0);

  assert.equal(result.find(item => item.id === 'bank').balance, 4300000);
  assert.equal(result.find(item => item.id === 'cash').balance, 1700000);
  assert.equal(total, 6000000);
});

test('computeWalletBalances restores balances after removing transfer pair', () => {
  const baseWallets = [
    { id: 'cash', name: 'Tiền mặt', type: 'CASH', openingBalance: 1000000, balance: 1000000 },
    { id: 'bank', name: 'VPBank', type: 'BANK', openingBalance: 5000000, balance: 5000000 }
  ];
  const txsWithTransfer = [
    { id: 's1', type: 'expense', walletId: 'cash', amount: 100000 },
    { id: 't1', transferId: 'tr2', type: 'expense', walletId: 'bank', categoryId: 'cat-transfer', amount: 300000 },
    { id: 't2', transferId: 'tr2', type: 'income', walletId: 'cash', categoryId: 'cat-transfer', amount: 300000 }
  ];

  const withTransfer = computeWalletBalances(baseWallets, txsWithTransfer);
  const withoutTransfer = computeWalletBalances(baseWallets, txsWithTransfer.filter(item => item.transferId !== 'tr2'));

  assert.equal(withTransfer.find(item => item.id === 'cash').balance, 1200000);
  assert.equal(withTransfer.find(item => item.id === 'bank').balance, 4700000);
  assert.equal(withoutTransfer.find(item => item.id === 'cash').balance, 900000);
  assert.equal(withoutTransfer.find(item => item.id === 'bank').balance, 5000000);
});

test('deleteCategoryById rejects deleting category used by transactions or budgets', () => {
  const result = deleteCategoryById(
    categories,
    'food',
    [{ id: 'tx-food', categoryId: 'food', amount: 100000, type: 'expense' }],
    [{ id: 'budget-food', categoryId: 'food', month: '2026-05', amount: 500000 }]
  );

  assert.equal(result.ok, false);
  assert.match(result.message, /đã phát sinh giao dịch|đang được áp dụng hạn mức/i);
});

test('deleteCategoryById removes unused category', () => {
  const extraCategories = [...categories, { id: 'gift', name: 'Quà tặng', type: 'income', icon: '🎁' }];
  const result = deleteCategoryById(extraCategories, 'gift', transactions, budgets);

  assert.equal(result.ok, true);
  assert.deepEqual(result.categories.map(item => item.id), ['salary', 'food', 'transport']);
});
