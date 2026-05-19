const MONTH_NAMES = ['T1','T2','T3','T4','T5','T6','T7','T8','T9','T10','T11','T12'];

export function formatCurrency(value) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(Number(value || 0));
}

export function normalizeCategoryName(name) {
  return String(name || '').trim().replace(/\s+/g, ' ').toLowerCase();
}

export function monthKey(input) {
  const d = input instanceof Date ? input : new Date(input);
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${d.getFullYear()}-${month}`;
}

export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function createId(prefix = 'id') {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

export function validateCategory(categories, payload, editingId = null) {
  const name = String(payload?.name || '').trim();
  const type = payload?.type;
  const icon = String(payload?.icon || '').trim();
  if (!name) return { ok: false, message: 'Tên danh mục không được để trống' };
  if (!['income', 'expense'].includes(type)) return { ok: false, message: 'Loại danh mục không hợp lệ' };
  const normalized = normalizeCategoryName(name);
  const duplicated = categories.some(category => normalizeCategoryName(category.name) == normalized && category.id !== editingId);
  if (duplicated) return { ok: false, message: 'Danh mục này đã tồn tại' };
  return { ok: true, data: { name, type, icon: icon || (type === 'income' ? '💰' : '🛒') } };
}

export function validateTransaction(categories, payload) {
  const amount = Number(payload?.amount);
  const categoryId = payload?.categoryId;
  const txDate = payload?.date || todayISO();
  const type = payload?.type;
  if (!(amount > 0)) return { ok: false, message: 'Số tiền phải lớn hơn 0' };
  if (!categoryId) return { ok: false, message: 'Vui lòng chọn danh mục' };
  const category = categories.find(item => item.id === categoryId);
  if (!category) return { ok: false, message: 'Danh mục không tồn tại' };
  if (type !== category.type) return { ok: false, message: 'Loại giao dịch phải khớp với loại danh mục' };
  const chosenDate = new Date(txDate);
  const today = new Date(todayISO());
  if (chosenDate.getTime() > today.getTime()) return { ok: false, message: 'Bạn đang nhập giao dịch tương lai, vui lòng chọn ngày hợp lệ' };
  return { ok: true, data: { amount, categoryId, date: txDate, type, description: String(payload?.description || '').trim() } };
}

export function getMonthlyTransactions(transactions, month) {
  return transactions.filter(item => monthKey(item.date) === month);
}

export function computeMonthlySummary(transactions, month) {
  const monthTransactions = getMonthlyTransactions(transactions, month);
  const income = monthTransactions.filter(item => item.type === 'income').reduce((sum, item) => sum + Number(item.amount), 0);
  const expense = monthTransactions.filter(item => item.type === 'expense').reduce((sum, item) => sum + Number(item.amount), 0);
  return { income, expense, balance: income - expense, count: monthTransactions.length };
}

export function aggregateExpenseByCategory(transactions, categories, month) {
  const categoryMap = new Map(categories.map(item => [item.id, item]));
  const totals = new Map();
  getMonthlyTransactions(transactions, month).filter(item => item.type === 'expense').forEach(item => {
    totals.set(item.categoryId, (totals.get(item.categoryId) || 0) + Number(item.amount));
  });
  const totalExpense = Array.from(totals.values()).reduce((sum, value) => sum + value, 0);
  return Array.from(totals.entries()).map(([categoryId, amount]) => {
    const category = categoryMap.get(categoryId);
    return { categoryId, name: category?.name || 'Không xác định', icon: category?.icon || '❓', amount, percent: totalExpense ? Number(((amount / totalExpense) * 100).toFixed(2)) : 0 };
  }).sort((a, b) => b.amount - a.amount);
}

export function aggregateYearlyTotals(transactions, year) {
  const data = Array.from({ length: 12 }, (_, index) => ({ monthIndex: index, label: MONTH_NAMES[index], income: 0, expense: 0, balance: 0 }));
  transactions.forEach(item => {
    const d = new Date(item.date);
    if (d.getFullYear() !== Number(year)) return;
    const entry = data[d.getMonth()];
    if (item.type === 'income') entry.income += Number(item.amount);
    if (item.type === 'expense') entry.expense += Number(item.amount);
    entry.balance = entry.income - entry.expense;
  });
  return data;
}

export function computeBudgetStatuses(categories, transactions, budgets, month) {
  return budgets.map(budget => {
    const category = categories.find(item => item.id === budget.categoryId);
    if (!category) return null;
    const spent = getMonthlyTransactions(transactions, month).filter(item => item.type === 'expense' && item.categoryId === budget.categoryId).reduce((sum, item) => sum + Number(item.amount), 0);
    const limit = Number(budget.amount);
    const usage = limit ? Number(((spent / limit) * 100).toFixed(2)) : 0;
    let level = 'safe';
    if (usage >= 100) level = 'danger';
    else if (usage >= 90) level = 'critical';
    else if (usage >= 70) level = 'warning';
    return { categoryId: budget.categoryId, categoryName: category.name, icon: category.icon, limit, spent, remaining: limit - spent, usage, level };
  }).filter(Boolean).sort((a, b) => b.usage - a.usage);
}

export function buildBudgetAlert(latestTransaction, categories, budgets, transactions, month) {
  if (!latestTransaction || latestTransaction.type !== 'expense') return null;
  const category = categories.find(item => item.id === latestTransaction.categoryId);
  const budget = budgets.find(item => item.categoryId === latestTransaction.categoryId && monthKey(latestTransaction.date) === month);
  if (!category || !budget) return null;
  const status = computeBudgetStatuses(categories, transactions, budgets, month).find(item => item.categoryId === latestTransaction.categoryId);
  if (!status) return null;
  if (status.usage >= 100) return { level: 'danger', text: `Bạn đã VƯỢT hạn mức ${category.name}! (${status.usage}%)` };
  if (status.usage >= 90) return { level: 'critical', text: `Bạn đã dùng ${status.usage}% hạn mức ${category.name}` };
  if (status.usage >= 70) return { level: 'warning', text: `${category.name} đã đạt ${status.usage}% hạn mức tháng này` };
  return null;
}

export function normalizeName(value) {
  return String(value || '').trim().replace(/\s+/g, ' ').toLowerCase();
}

export function validateWallet(wallets, payload, editingId = null) {
  const name = String(payload?.name || '').trim();
  const type = String(payload?.type || '').trim().toUpperCase();
  const balance = Number(payload?.balance);
  const icon = String(payload?.icon || '').trim();
  if (!name) return { ok: false, message: 'Tên ví không được để trống' };
  if (!['CASH', 'BANK', 'WALLET'].includes(type)) return { ok: false, message: 'Loại ví không hợp lệ' };
  if (Number.isNaN(balance) || balance < 0) return { ok: false, message: 'Số dư ví phải từ 0 trở lên' };
  const duplicated = wallets.some(item => normalizeName(item.name) === normalizeName(name) && item.id !== editingId);
  if (duplicated) return { ok: false, message: 'Ví này đã tồn tại' };
  return { ok: true, data: { name, type, balance, icon: icon || '💼' } };
}

export function transferBetweenWallets(wallets, payload) {
  const fromWalletId = payload?.fromWalletId;
  const toWalletId = payload?.toWalletId;
  const amount = Number(payload?.amount);
  if (!fromWalletId || !toWalletId) return { ok: false, message: 'Vui lòng chọn ví nguồn và ví đích' };
  if (fromWalletId === toWalletId) return { ok: false, message: 'Ví nguồn và ví đích phải khác nhau' };
  if (!(amount > 0)) return { ok: false, message: 'Số tiền chuyển phải lớn hơn 0' };
  const fromWallet = wallets.find(item => item.id === fromWalletId);
  const toWallet = wallets.find(item => item.id === toWalletId);
  if (!fromWallet || !toWallet) return { ok: false, message: 'Ví chuyển tiền không tồn tại' };
  if (Number(fromWallet.balance) < amount) return { ok: false, message: 'Ví nguồn không đủ số dư' };
  const nextWallets = wallets.map(item => {
    if (item.id === fromWalletId) return { ...item, balance: Number(item.balance) - amount };
    if (item.id === toWalletId) return { ...item, balance: Number(item.balance) + amount };
    return item;
  });
  return { ok: true, wallets: nextWallets };
}

export function computeWalletBalances(wallets, transactions) {
  return wallets.map(wallet => {
    const openingBalance = Number(wallet.openingBalance ?? wallet.balance ?? 0);
    const relatedTransactions = transactions.filter(item => item.walletId === wallet.id);
    const delta = relatedTransactions.reduce((sum, item) => {
      if (item.type === 'income') return sum + Number(item.amount || 0);
      if (item.type === 'expense') return sum - Number(item.amount || 0);
      return sum;
    }, 0);
    return { ...wallet, openingBalance, balance: openingBalance + delta };
  });
}

export function deleteCategoryById(categories, categoryId, transactions = [], budgets = []) {
  const category = categories.find(item => item.id === categoryId);
  if (!category) return { ok: false, message: 'Danh mục không tồn tại' };
  if (categoryId === 'cat-transfer') return { ok: false, message: 'Không thể xóa danh mục hệ thống Chuyển ví' };
  if (transactions.some(item => item.categoryId === categoryId)) {
    return { ok: false, message: 'Không thể xóa danh mục đã phát sinh giao dịch' };
  }
  if (budgets.some(item => item.categoryId === categoryId)) {
    return { ok: false, message: 'Không thể xóa danh mục đang được áp dụng hạn mức' };
  }
  return { ok: true, category, categories: categories.filter(item => item.id !== categoryId) };
}

export function createCategory(payload, existingCategories) {
  const validation = validateCategory(existingCategories, payload);
  if (!validation.ok) return validation;
  return { ok: true, data: validation.data };
}

export function updateCategory(existingCategories, categoryId, payload) {
  const validation = validateCategory(existingCategories, payload, categoryId);
  if (!validation.ok) return validation;
  return { ok: true, data: validation.data };
}

export function replaceCategory(categories, categoryId, payload) {
  return categories.map(item => item.id === categoryId ? { ...item, ...payload } : item);
}

export function appendCategory(categories, category) {
  return [...categories, category];
}

export function sortCategories(categories) {
  return [...categories].sort((a, b) => {
    if (a.type !== b.type) return a.type.localeCompare(b.type);
    return a.name.localeCompare(b.name, 'vi');
  });
}

export function validateGoal(payload) {
  const name = String(payload?.name || '').trim();
  const target = Number(payload?.target);
  const current = Number(payload?.current);
  const deadline = String(payload?.deadline || '').trim();
  if (!name) return { ok: false, message: 'Vui lòng nhập tên mục tiêu' };
  if (!(target > 0)) return { ok: false, message: 'Mục tiêu tiền phải lớn hơn 0' };
  if (Number.isNaN(current) || current < 0) return { ok: false, message: 'Số tiền đã tích lũy phải hợp lệ' };
  if (current > target) return { ok: false, message: 'Số đã tích lũy không được lớn hơn mục tiêu' };
  return { ok: true, data: { name, target, current, deadline } };
}

export function computeGoalProgress(goal) {
  const target = Number(goal?.target || 0);
  const current = Number(goal?.current || 0);
  if (!(target > 0)) return 0;
  return Math.round((current / target) * 100);
}

export function deleteBudgetById(budgets, budgetId) {
  const budget = budgets.find(item => item.id === budgetId);
  if (!budget) return { ok: false, message: 'Hạn mức không tồn tại' };
  return { ok: true, budget, budgets: budgets.filter(item => item.id !== budgetId) };
}

export function deleteGoalById(goals, goalId) {
  const goal = goals.find(item => item.id === goalId);
  if (!goal) return { ok: false, message: 'Mục tiêu không tồn tại' };
  return { ok: true, goal, goals: goals.filter(item => item.id !== goalId) };
}

export function validateDebt(payload) {
  const name = String(payload?.name || '').trim();
  const amount = Number(payload?.amount);
  const type = String(payload?.type || '').trim();
  const due = String(payload?.due || '').trim();
  const note = String(payload?.note || '').trim();
  if (!name) return { ok: false, message: 'Tên khoản nợ không được để trống' };
  if (!(amount > 0)) return { ok: false, message: 'Số tiền khoản nợ phải lớn hơn 0' };
  if (!['payable', 'receivable'].includes(type)) return { ok: false, message: 'Loại khoản nợ không hợp lệ' };
  return { ok: true, data: { name, amount, type, due, note } };
}
