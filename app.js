import {
  createId,
  todayISO,
  monthKey,
  formatCurrency,
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
  validateDebt,
  replaceCategory,
  appendCategory,
  sortCategories,
  groupTransactionsByDate,
  validateRegistration,
  authenticateUser,
  validateEmail,
  buildBudgetOverview,
  getAvailableYears,
  nowTimeHHMM
} from './logic.js';
import {
  buildConfirmationDialogModel,
  getInitialClientState,
  buildStoredSessionPayload
} from './ui-helpers.js';

const API_BASE = '/api';
const AUTH_KEY = 'spendwise-pro-auth-v2';

const DEFAULT_FILTERS = {
  search: '',
  month: '2026-05',
  wallet: 'all',
  type: 'all',
  category: 'all'
};

const DEFAULT_STATE = {
  ...getInitialClientState(),
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
  filters: { ...DEFAULT_FILTERS },
  analytics: {
    tab: 'category',
    month: '2026-05',
    year: 2026
  }
};

const els = {};
let state = loadState();
let authToken = null;
let isHydratingState = false;
let syncTimeoutId = null;
let isSyncingState = false;
let editingTransactionId = null;
let editingBudgetId = null;
let editingGoalId = null;
let editingWalletId = null;
let editingDebtId = null;
let editingCategoryId = null;
let currentModal = 'transaction';
let confirmResolver = null;

const sectionMeta = {
  dashboard: { title: 'Dashboard', subtitle: 'Hôm nay bạn chi tiêu gì chưa?' },
  transactions: { title: 'Lịch sử Giao dịch', subtitle: 'Quản lý và tra cứu lịch sử thu chi theo nhóm ngày.' },
  wallets: { title: 'Ví & Danh mục', subtitle: 'Quản lý ví, danh mục thu chi và đồng bộ số dư theo giao dịch thực tế.' },
  budgets: { title: 'Hạn mức Chi tiêu', subtitle: 'Theo dõi chi tiêu theo danh mục với cảnh báo ngân sách thông minh.' },
  goals: { title: 'Mục tiêu Tiết kiệm', subtitle: 'Tăng tốc các mục tiêu tài chính cá nhân với progress trực quan.' },
  debts: { title: 'Khoản nợ', subtitle: 'Theo dõi nợ phải trả và phải thu một cách minh bạch.' },
  analytics: { title: 'Phân tích Tài chính', subtitle: 'Biểu đồ và KPI trực quan để đọc xu hướng chi tiêu.' }
};

function loadState() {
  return structuredClone(DEFAULT_STATE);
}

function saveState() {
  if (isHydratingState || !authToken) return;
  if (syncTimeoutId) clearTimeout(syncTimeoutId);
  syncTimeoutId = setTimeout(() => {
    void syncStateToServer();
  }, 250);
}

function saveSession() {
  const auth = buildStoredSessionPayload(authToken, state.authView);
  localStorage.setItem(AUTH_KEY, JSON.stringify(auth));
}

function restoreSession() {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    authToken = parsed.token || null;
    state.authView = parsed.authView || 'login';
  } catch {
    authToken = null;
    state.authView = 'login';
  }
}

async function apiRequest(pathname, { method = 'GET', body, skipAuth = false } = {}) {
  const response = await fetch(`${API_BASE}${pathname}`, {
    method,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(!skipAuth && authToken ? { Authorization: `Bearer ${authToken}` } : {})
    },
    body: body ? JSON.stringify(body) : undefined
  });

  const text = await response.text();
  const json = text ? JSON.parse(text) : null;
  if (!response.ok) {
    throw new Error(json?.message || 'Yêu cầu tới máy chủ thất bại');
  }
  return json;
}

async function bootstrapAuthenticatedState() {
  if (!authToken) return false;
  try {
    const me = await apiRequest('/auth/me');
    const stateRes = await apiRequest('/state');
    state = { ...structuredClone(DEFAULT_STATE), ...stateRes.state };
    state.users = [me.user];
    state.currentUserId = me.user.id;
    state.filters = { ...DEFAULT_FILTERS, ...(stateRes.state?.filters || {}) };
    state.analytics = { ...DEFAULT_STATE.analytics, ...(stateRes.state?.analytics || {}) };
    renderAll();
    return true;
  } catch {
    authToken = null;
    state = structuredClone(DEFAULT_STATE);
    saveSession();
    return false;
  }
}

async function syncStateToServer() {
  if (!authToken || isHydratingState || isSyncingState) return;
  isSyncingState = true;
  try {
    const payload = structuredClone(state);
    payload.users = [];
    await apiRequest('/state', {
      method: 'PUT',
      body: { state: payload }
    });
  } catch (error) {
    showToast(error.message || 'Không thể đồng bộ dữ liệu', 'danger');
  } finally {
    isSyncingState = false;
  }
}

function $(selector) {
  return document.querySelector(selector);
}

function bindElements() {
  Object.assign(els, {
    pageTitle: $('#page-title'),
    pageSubtitle: $('#page-subtitle'),
    navButtons: Array.from(document.querySelectorAll('.nav-item')),
    sectionEls: Array.from(document.querySelectorAll('.view-section')),
    jumpButtons: Array.from(document.querySelectorAll('[data-jump]')),
    summaryAssets: $('#summary-assets'),
    summaryIncome: $('#summary-income'),
    summaryExpense: $('#summary-expense'),
    summaryBalance: $('#summary-balance'),
    balanceFoot: $('#balance-foot'),
    incomeCountFoot: $('#income-count-foot'),
    expenseCountFoot: $('#expense-count-foot'),
    dashboardAlertBanner: $('#dashboard-alert-banner'),
    walletSummaryList: $('#wallet-summary-list'),
    cashflowChart: $('#cashflow-chart'),
    walletGrid: $('#wallet-grid'),
    categoryGrid: $('#category-grid'),
    budgetGrid: $('#budget-grid'),
    goalGrid: $('#goal-grid'),
    debtList: $('#debt-list'),
    debtPayable: $('#debt-payable'),
    debtReceivable: $('#debt-receivable'),
    debtNet: $('#debt-net'),
    analyticsDonut: $('#analytics-donut'),
    analyticsDonutLegend: $('#analytics-donut-legend'),
    analyticsAlertCard: $('#analytics-alert-card'),
    topCategoryCard: $('#top-category-card'),
    avgExpensePerTx: $('#avg-expense-per-tx'),
    avgExpensePerDay: $('#avg-expense-per-day'),
    savingsTrendChart: $('#savings-trend-chart'),
    transactionGroupList: $('#transaction-group-list'),
    searchInput: $('#search-input'),
    reportMonth: $('#report-month'),
    walletFilter: $('#wallet-filter'),
    typeFilter: $('#transaction-type-filter'),
    categoryFilter: $('#category-filter'),
    modalBackdrop: $('#modal-backdrop'),
    modalTitle: $('#modal-title'),
    modalSubtitle: $('#modal-subtitle'),
    transactionForm: $('#transaction-form'),
    budgetForm: $('#budget-form'),
    goalForm: $('#goal-form'),
    walletForm: $('#wallet-form'),
    categoryForm: $('#category-form'),
    transferForm: $('#transfer-form'),
    debtForm: $('#debt-form'),
    transactionType: $('#transaction-type'),
    transactionAmount: $('#transaction-amount'),
    transactionWallet: $('#transaction-wallet'),
    transactionCategory: $('#transaction-category'),
    transactionDate: $('#transaction-date'),
    transactionDescription: $('#transaction-description'),
    transactionRecurring: $('#transaction-recurring'),
    transactionSubmitText: $('#transaction-submit-text'),
    transactionError: $('#transaction-error'),
    budgetCategory: $('#budget-category'),
    budgetAmount: $('#budget-amount'),
    budgetMonth: $('#budget-month'),
    budgetSubmitText: $('#budget-submit-text'),
    budgetError: $('#budget-error'),
    goalName: $('#goal-name'),
    goalTarget: $('#goal-target'),
    goalCurrent: $('#goal-current'),
    goalDeadline: $('#goal-deadline'),
    goalSubmitText: $('#goal-submit-text'),
    goalError: $('#goal-error'),
    walletName: $('#wallet-name'),
    walletType: $('#wallet-type'),
    walletBalance: $('#wallet-balance'),
    walletIcon: $('#wallet-icon'),
    walletSubmitText: $('#wallet-submit-text'),
    walletError: $('#wallet-error'),
    categoryName: $('#category-name'),
    categoryType: $('#category-type'),
    categoryIcon: $('#category-icon'),
    categorySubmitText: $('#category-submit-text'),
    categoryError: $('#category-error'),
    transferFromWallet: $('#transfer-from-wallet'),
    transferToWallet: $('#transfer-to-wallet'),
    transferAmount: $('#transfer-amount'),
    transferDate: $('#transfer-date'),
    transferNote: $('#transfer-note'),
    transferError: $('#transfer-error'),
    debtName: $('#debt-name'),
    debtType: $('#debt-type'),
    debtAmount: $('#debt-amount'),
    debtDue: $('#debt-due'),
    debtNote: $('#debt-note'),
    debtSubmitText: $('#debt-submit-text'),
    debtError: $('#debt-error'),
    toastContainer: $('#toast-container'),
    authOverlay: $('#auth-overlay'),
    appShell: $('#app-shell'),
    showLogin: $('#show-login'),
    showRegister: $('#show-register'),
    loginForm: $('#login-form'),
    registerForm: $('#register-form'),
    forgotPasswordForm: $('#forgot-password-form'),
    loginEmail: $('#login-email'),
    loginPassword: $('#login-password'),
    loginError: $('#login-error'),
    registerFullname: $('#register-fullname'),
    registerEmail: $('#register-email'),
    registerPassword: $('#register-password'),
    registerConfirmPassword: $('#register-confirm-password'),
    registerEmailError: $('#register-email-error'),
    registerError: $('#register-error'),
    forgotEmail: $('#forgot-email'),
    forgotPasswordError: $('#forgot-password-error'),
    showForgotPassword: $('#show-forgot-password'),
    backToLogin: $('#back-to-login'),
    userName: $('#user-name'),
    userRole: $('#user-role'),
    userAvatar: $('#user-avatar'),
    logoutBtn: $('#logout-btn'),
    budgetBadge: $('#budget-badge'),
    analyticsTabs: Array.from(document.querySelectorAll('.analytics-tab')),
    analyticsMonth: $('#analytics-month'),
    analyticsTotalExpense: $('#analytics-total-expense'),
    analyticsYearLabel: $('#analytics-year-label'),
    yearlyBarChart: $('#yearly-bar-chart'),
    yearlyChartDetail: $('#yearly-chart-detail'),
    analyticsCategoryView: $('#analytics-category-view'),
    analyticsYearlyView: $('#analytics-yearly-view'),
    yearPrev: $('#year-prev'),
    yearNext: $('#year-next'),
    clickableSummaryCards: Array.from(document.querySelectorAll('.clickable-summary')),
    confirmBackdrop: $('#confirm-backdrop'),
    confirmTitle: $('#confirm-title'),
    confirmMessage: $('#confirm-message'),
    confirmIcon: $('#confirm-icon'),
    confirmAccept: $('#confirm-accept'),
    confirmCancel: $('#confirm-cancel')
  });
}

function getCurrentUser() {
  return state.users.find(user => user.id === state.currentUserId) || null;
}

function walletById(id) {
  return state.wallets.find(item => item.id === id);
}

function categoryById(id) {
  return state.categories.find(item => item.id === id);
}

function recalculateWalletBalances() {
  state.wallets = computeWalletBalances(state.wallets, state.transactions);
}

function canManageCategory(categoryId) {
  return categoryId !== 'cat-transfer';
}

function categoriesForType(type) {
  return sortCategories(state.categories.filter(item => item.type === type && canManageCategory(item.id)));
}

function setSelectValueWithFallback(selectEl, preferred, fallback = 'all') {
  const values = Array.from(selectEl.options).map(option => option.value);
  const value = values.includes(String(preferred)) ? String(preferred) : fallback;
  selectEl.value = value;
  return value;
}

function syncFiltersToInputs() {
  els.searchInput.value = String(state.filters.search || '');
  els.reportMonth.value = String(state.filters.month || DEFAULT_FILTERS.month);
  state.filters.wallet = setSelectValueWithFallback(els.walletFilter, state.filters.wallet, 'all');
  state.filters.type = setSelectValueWithFallback(els.typeFilter, state.filters.type, 'all');
  state.filters.category = setSelectValueWithFallback(els.categoryFilter, state.filters.category, 'all');
  els.analyticsMonth.value = state.analytics.month || getSelectedMonth();
  els.analyticsYearLabel.textContent = String(state.analytics.year);
}

function syncFiltersFromInputs() {
  state.filters.search = String(els.searchInput.value || '').trim();
  state.filters.month = String(els.reportMonth.value || DEFAULT_FILTERS.month);
  state.filters.wallet = String(els.walletFilter.value || 'all');
  state.filters.type = String(els.typeFilter.value || 'all');
  state.filters.category = String(els.categoryFilter.value || 'all');
}

function getSelectedMonth() {
  return state.filters.month || DEFAULT_FILTERS.month;
}

function setActiveSection(section) {
  els.navButtons.forEach(btn => btn.classList.toggle('active', btn.dataset.section === section));
  els.sectionEls.forEach(sec => sec.classList.toggle('active-section', sec.id === `section-${section}`));
  const meta = sectionMeta[section];
  els.pageTitle.textContent = meta.title;
  els.pageSubtitle.textContent = meta.subtitle;
}

function clearEditingState() {
  editingTransactionId = null;
  editingBudgetId = null;
  editingGoalId = null;
  editingWalletId = null;
  editingDebtId = null;
  editingCategoryId = null;
}

function openModal(type) {
  currentModal = type;
  els.modalBackdrop.classList.remove('hidden');
  [els.transactionForm, els.budgetForm, els.goalForm, els.walletForm, els.categoryForm, els.transferForm, els.debtForm].forEach(form => form.classList.add('hidden-form'));
  const modalMap = {
    transaction: { title: editingTransactionId ? 'Chỉnh sửa giao dịch' : 'Ghi chép giao dịch mới', subtitle: 'Nhập thông tin giao dịch đầy đủ và chính xác.', form: els.transactionForm },
    budget: { title: editingBudgetId ? 'Chỉnh sửa hạn mức' : 'Thiết lập hạn mức', subtitle: 'Áp dụng hạn mức theo danh mục chi và theo tháng.', form: els.budgetForm },
    goal: { title: editingGoalId ? 'Chỉnh sửa mục tiêu' : 'Thêm mục tiêu tiết kiệm', subtitle: 'Theo dõi tiến độ tài chính với progress card.', form: els.goalForm },
    wallet: { title: editingWalletId ? 'Chỉnh sửa ví' : 'Thêm ví mới', subtitle: 'Quản lý thông tin ví và số dư mở đầu.', form: els.walletForm },
    category: { title: editingCategoryId ? 'Chỉnh sửa danh mục' : 'Thêm danh mục mới', subtitle: 'Quản lý danh mục thu chi và dùng lại cho mọi giao dịch.', form: els.categoryForm },
    transfer: { title: 'Chuyển tiền giữa các ví', subtitle: 'Cập nhật số dư ví nguồn và ví đích đồng thời.', form: els.transferForm },
    debt: { title: editingDebtId ? 'Chỉnh sửa khoản nợ' : 'Thêm khoản nợ', subtitle: 'Quản lý khoản phải trả và khoản phải thu minh bạch.', form: els.debtForm }
  };
  const config = modalMap[type];
  els.modalTitle.textContent = config.title;
  els.modalSubtitle.textContent = config.subtitle;
  config.form.classList.remove('hidden-form');
}

function closeModal() {
  els.modalBackdrop.classList.add('hidden');
  clearEditingState();
  resetForms();
}

function clearAuthFeedback() {
  [els.loginError, els.registerError, els.registerEmailError, els.forgotPasswordError].forEach(el => {
    if (el) el.textContent = '';
  });
}

function resetForms() {
  [els.transactionForm, els.budgetForm, els.goalForm, els.walletForm, els.categoryForm, els.transferForm, els.debtForm].forEach(form => form.reset());
  clearAuthFeedback();
  els.transactionType.value = 'expense';
  els.transactionDate.value = todayISO();
  els.budgetMonth.value = getSelectedMonth();
  els.transferDate.value = todayISO();
  els.debtDue.value = todayISO();
  els.transactionSubmitText.textContent = 'Lưu giao dịch';
  els.budgetSubmitText.textContent = 'Lưu hạn mức';
  els.goalSubmitText.textContent = 'Lưu mục tiêu';
  els.walletSubmitText.textContent = 'Lưu ví';
  els.categorySubmitText.textContent = 'Lưu danh mục';
  els.debtSubmitText.textContent = 'Lưu khoản nợ';
  [els.transactionError, els.budgetError, els.goalError, els.walletError, els.categoryError, els.transferError, els.debtError].forEach(el => { el.textContent = ''; });
  syncSelectors();
}

function syncSelectors() {
  const selectedTxCategory = els.transactionCategory.value;
  const selectedTxWallet = els.transactionWallet.value;
  const selectedBudgetCategory = els.budgetCategory.value;
  const selectedFromWallet = els.transferFromWallet.value;
  const selectedToWallet = els.transferToWallet.value;

  const txType = els.transactionType.value;
  const txCategories = categoriesForType(txType);
  els.transactionCategory.innerHTML = '<option value="">-- Chọn danh mục --</option>' + txCategories.map(item => `<option value="${item.id}">${item.icon} ${item.name}</option>`).join('');
  els.transactionWallet.innerHTML = state.wallets.map(item => `<option value="${item.id}">${item.name}</option>`).join('');
  els.budgetCategory.innerHTML = categoriesForType('expense').map(item => `<option value="${item.id}">${item.icon} ${item.name}</option>`).join('');
  els.walletFilter.innerHTML = '<option value="all">Tất cả ví</option>' + state.wallets.map(item => `<option value="${item.id}">${item.name}</option>`).join('');
  els.categoryFilter.innerHTML = '<option value="all">Tất cả danh mục</option>' + sortCategories(state.categories.filter(item => item.id !== 'cat-transfer')).map(item => `<option value="${item.id}">${item.name}</option>`).join('');

  const txCategoryValues = Array.from(els.transactionCategory.options).map(option => option.value);
  els.transactionCategory.value = txCategoryValues.includes(selectedTxCategory) ? selectedTxCategory : '';
  const txWalletValues = Array.from(els.transactionWallet.options).map(option => option.value);
  if (txWalletValues.length) els.transactionWallet.value = txWalletValues.includes(selectedTxWallet) ? selectedTxWallet : txWalletValues[0];
  const budgetCategoryValues = Array.from(els.budgetCategory.options).map(option => option.value);
  if (budgetCategoryValues.length) els.budgetCategory.value = budgetCategoryValues.includes(selectedBudgetCategory) ? selectedBudgetCategory : budgetCategoryValues[0];

  const transferOptions = state.wallets.map(item => `<option value="${item.id}">${item.name}</option>`).join('');
  els.transferFromWallet.innerHTML = transferOptions;
  els.transferToWallet.innerHTML = transferOptions;
  const walletIds = state.wallets.map(item => item.id);
  if (walletIds.length) {
    els.transferFromWallet.value = walletIds.includes(selectedFromWallet) ? selectedFromWallet : walletIds[0];
    const fallbackTo = walletIds[1] || walletIds[0];
    els.transferToWallet.value = walletIds.includes(selectedToWallet) ? selectedToWallet : fallbackTo;
  }

  syncFiltersToInputs();
}

function filteredTransactions() {
  const month = getSelectedMonth();
  const search = String(state.filters.search || '').toLowerCase();
  const wallet = String(state.filters.wallet || 'all');
  const type = String(state.filters.type || 'all');
  const category = String(state.filters.category || 'all');
  return state.transactions
    .filter(item => monthKey(item.date) === month)
    .filter(item => wallet === 'all' || String(item.walletId) === wallet)
    .filter(item => type === 'all' || String(item.type) === type)
    .filter(item => category === 'all' || String(item.categoryId) === category)
    .filter(item => {
      if (!search) return true;
      const walletName = walletById(item.walletId)?.name || '';
      const categoryName = categoryById(item.categoryId)?.name || '';
      return [item.description, walletName, categoryName, item.tag].join(' ').toLowerCase().includes(search);
    })
    .sort((a, b) => new Date(`${b.date} ${b.time || '00:00'}`) - new Date(`${a.date} ${a.time || '00:00'}`));
}

function showToast(text, level = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast-item ${level}`;
  toast.textContent = text;
  els.toastContainer.appendChild(toast);
  setTimeout(() => toast.classList.add('visible'), 10);
  setTimeout(() => {
    toast.classList.remove('visible');
    setTimeout(() => toast.remove(), 250);
  }, 3200);
}

function closeConfirmDialog(accepted = false) {
  els.confirmBackdrop.classList.add('hidden');
  els.confirmBackdrop.setAttribute('aria-hidden', 'true');
  els.confirmBackdrop.querySelector('.confirm-card')?.classList.remove('danger', 'warning');
  const resolver = confirmResolver;
  confirmResolver = null;
  if (resolver) resolver(Boolean(accepted));
}

function requestConfirmation(kind, payload = {}) {
  const config = buildConfirmationDialogModel(kind, payload);
  els.confirmTitle.textContent = config.title;
  els.confirmMessage.textContent = config.message;
  els.confirmAccept.textContent = config.confirmText;
  els.confirmCancel.textContent = config.cancelText;
  els.confirmIcon.textContent = config.tone === 'danger' ? '🗑️' : '⚠️';
  const card = els.confirmBackdrop.querySelector('.confirm-card');
  card?.classList.remove('danger', 'warning');
  card?.classList.add(config.tone === 'danger' ? 'danger' : 'warning');
  els.confirmBackdrop.classList.remove('hidden');
  els.confirmBackdrop.setAttribute('aria-hidden', 'false');
  return new Promise(resolve => {
    confirmResolver = resolve;
  });
}

function consumeLatestAlert() {
  if (!state.alerts.length) return;
  const latest = state.alerts[state.alerts.length - 1];
  state.alerts = [];
  showToast(latest.text, latest.level || 'info');
}

function renderUserCard() {
  const user = getCurrentUser();
  if (!user) {
    els.userName.textContent = 'Chưa đăng nhập';
    els.userName.title = 'Chưa đăng nhập';
    els.userRole.textContent = 'Đăng nhập để đồng bộ dữ liệu';
    els.userRole.title = 'Đăng nhập để đồng bộ dữ liệu';
    els.userAvatar.textContent = 'U';
    return;
  }

  const displayName = String(user.fullName || user.name || user.email || 'User').trim();
  const displayEmail = String(user.email || '').trim();
  els.userName.textContent = displayName;
  els.userName.title = displayName;
  const roleText = displayEmail ? `Email: ${displayEmail}` : 'Tài khoản SpendWise Pro';
  els.userRole.textContent = roleText;
  els.userRole.title = roleText;
  els.userAvatar.textContent = displayName.slice(0, 1).toUpperCase();
}

function renderSummary() {
  const month = getSelectedMonth();
  const summary = computeMonthlySummary(state.transactions, month);
  const totalAssets = state.wallets.reduce((sum, item) => sum + Number(item.balance), 0);
  els.summaryAssets.textContent = formatCurrency(totalAssets);
  els.summaryIncome.textContent = formatCurrency(summary.income);
  els.summaryExpense.textContent = formatCurrency(summary.expense);
  els.summaryBalance.textContent = formatCurrency(summary.balance);
  els.summaryBalance.className = `metric-value ${summary.balance < 0 ? 'negative' : 'positive'}`;
  els.balanceFoot.innerHTML = summary.balance < 0 ? '⚠ Số dư âm trong tháng hiện tại' : 'Số dư tháng hiện tại đang tích cực';
  els.incomeCountFoot.textContent = `${state.transactions.filter(item => monthKey(item.date) === month && item.type === 'income' && item.categoryId !== 'cat-transfer').length} giao dịch thu`;
  els.expenseCountFoot.textContent = `${state.transactions.filter(item => monthKey(item.date) === month && item.type === 'expense' && item.categoryId !== 'cat-transfer').length} giao dịch chi`;
}

function renderDashboardAlert() {
  const month = getSelectedMonth();
  const budgetStatuses = computeBudgetStatuses(state.categories, state.transactions, state.budgets.filter(item => item.month === month), month);
  const strongest = budgetStatuses.find(item => item.level === 'danger') || budgetStatuses.find(item => item.level === 'critical') || budgetStatuses.find(item => item.level === 'warning');
  if (!strongest) {
    els.dashboardAlertBanner.classList.add('empty');
    els.dashboardAlertBanner.innerHTML = '<strong>Ngân sách ổn định</strong><p>Chưa có danh mục nào gần vượt hạn mức trong tháng này.</p>';
    els.budgetBadge.classList.add('hidden');
    return;
  }
  els.dashboardAlertBanner.classList.remove('empty');
  els.dashboardAlertBanner.innerHTML = `<strong>CẢNH BÁO NGÂN SÁCH</strong><p>${strongest.icon} ${strongest.categoryName}: ${formatCurrency(strongest.spent)} / ${formatCurrency(strongest.limit)} (${strongest.usage}%)</p>`;
  if (strongest.level === 'danger') els.budgetBadge.classList.remove('hidden');
  else els.budgetBadge.classList.add('hidden');
}

function renderCashflowChart() {
  const yearData = aggregateYearlyTotals(state.transactions, state.analytics.year);
  const maxValue = Math.max(1, ...yearData.flatMap(item => [item.income, item.expense]));
  els.cashflowChart.innerHTML = yearData.map(item => {
    const incomeHeight = item.income ? Math.max(12, (item.income / maxValue) * 170) : 12;
    const expenseHeight = item.expense ? Math.max(12, (item.expense / maxValue) * 170) : 12;
    return `
      <div class="bar-month-group">
        <div class="bar-col income" style="height:${incomeHeight}px"></div>
        <div class="bar-col expense ${item.balance < 0 ? 'negative-outline' : ''}" style="height:${expenseHeight}px"></div>
        <div class="bar-month-label">${item.label}</div>
      </div>`;
  }).join('');
}

function renderWalletSummary() {
  const topWallets = [...state.wallets].sort((a, b) => b.balance - a.balance).slice(0, 4);
  els.walletSummaryList.innerHTML = topWallets.map(item => `
    <article class="compact-card">
      <div>
        <strong>${item.icon} ${item.name}</strong>
        <div class="meta">${item.type}</div>
      </div>
      <strong>${formatCurrency(item.balance)}</strong>
    </article>`).join('');
}

function renderWalletGrid() {
  const month = getSelectedMonth();

  els.walletGrid.innerHTML = state.wallets.map(item => `
    <article class="wallet-card">
      <div class="wallet-card-top">
        <div class="wallet-icon-box">${item.icon}</div>
        <div class="inline-actions">
          <button class="icon-square edit" title="Sửa" data-edit-wallet="${item.id}">✎</button>
          <button class="icon-square delete" title="Xóa" data-delete-wallet="${item.id}">🗑</button>
        </div>
      </div>
      <div class="wallet-title">${item.name}</div>
      <div class="wallet-balance">${formatCurrency(item.balance)}</div>
      <div class="wallet-kind">${item.type} • Số dư gốc ${formatCurrency(item.openingBalance)}</div>
    </article>`).join('');

  const categoryCards = sortCategories(state.categories.filter(item => item.id !== 'cat-transfer')).map(item => {
    const linkedTransactions = state.transactions.filter(tx => tx.categoryId === item.id).length;
    const linkedBudgets = state.budgets.filter(budget => budget.categoryId === item.id).length;
    const canDelete = linkedTransactions === 0 && linkedBudgets === 0;
    return `
      <article class="wallet-card category-card">
        <div class="wallet-card-top">
          <div class="wallet-icon-box">${item.icon}</div>
          <div class="inline-actions">
            <button class="icon-square edit" title="Sửa" data-edit-category="${item.id}">✎</button>
            <button class="icon-square delete" title="Xóa" data-delete-category="${item.id}" ${canDelete ? '' : 'disabled'}>🗑</button>
          </div>
        </div>
        <div class="wallet-title">${item.name}</div>
        <div class="wallet-balance">${item.type === 'income' ? 'Danh mục Thu' : 'Danh mục Chi'}</div>
        <div class="wallet-kind">${state.transactions.filter(tx => tx.categoryId === item.id && monthKey(tx.date) === month).length} giao dịch tháng • ${state.budgets.filter(budget => budget.categoryId === item.id && budget.month === month).length} hạn mức tháng</div>
      </article>`;
  }).join('') || '<div class="empty-state">Chưa có danh mục tuỳ chỉnh nào.</div>';

  els.categoryGrid.innerHTML = categoryCards;
}

function renderBudgetGrid() {
  const month = getSelectedMonth();
  const overview = buildBudgetOverview(state.categories, state.transactions, state.budgets, month);
  els.budgetGrid.innerHTML = overview.map(item => {
    const budget = state.budgets.find(entry => entry.categoryId === item.categoryId && entry.month === month);
    if (!item.hasBudget) {
      return `
        <article class="budget-card unconfigured">
          <div class="budget-card-top">
            <div>
              <div class="budget-title">${item.icon} ${item.categoryName}</div>
              <div class="budget-amount empty-budget">Chưa thiết lập</div>
            </div>
            <div class="inline-actions">
              <button class="icon-square edit" data-create-budget="${item.categoryId}">＋</button>
            </div>
          </div>
          <div class="budget-footer"><strong>${formatCurrency(item.spent)}</strong><span class="budget-date">Đã chi trong tháng</span></div>
        </article>`;
    }
    return `
      <article class="budget-card">
        <div class="budget-card-top">
          <div>
            <div class="budget-title">${item.level === 'warning' || item.level === 'critical' || item.level === 'danger' ? '⚠️ ' : ''}${item.icon} ${item.categoryName}</div>
            <div class="budget-amount">${formatCurrency(item.limit)}</div>
          </div>
          <div class="inline-actions">
            <button class="icon-square edit" data-edit-budget="${budget?.id || ''}">✎</button>
            <button class="icon-square delete" data-budget-delete="${budget?.id || ''}">🗑</button>
          </div>
        </div>
        <div class="progress-track"><div class="progress-fill ${item.level === 'safe' ? 'safe' : item.level}" style="width:${Math.min(item.usage, 100)}%"></div></div>
        <div class="budget-footer"><strong>${item.usage}%</strong><span class="budget-date">${formatCurrency(item.spent)} / ${formatCurrency(item.limit)} • Còn lại ${formatCurrency(item.remaining)}</span></div>
      </article>`;
  }).join('') || '<div class="empty-state">Chưa có hạn mức cho tháng đang xem.</div>';
}

function renderGoalGrid() {
  els.goalGrid.innerHTML = state.goals.map(item => {
    const progress = computeGoalProgress(item);
    return `
      <article class="goal-card">
        <div class="goal-card-top">
          <div class="goal-title">${item.name}</div>
          <div class="inline-actions">
            <button class="icon-square edit" data-edit-goal="${item.id}">✎</button>
            <button class="icon-square delete" data-delete-goal="${item.id}">🗑</button>
          </div>
        </div>
        <div class="goal-amount">${formatCurrency(item.current)} / ${formatCurrency(item.target)}</div>
        <div class="progress-track"><div class="progress-fill goal" style="width:${Math.min(progress,100)}%"></div></div>
        <div class="goal-footer"><strong>Tiến độ: ${progress}%</strong><span class="goal-date">Hạn: ${item.deadline || 'Chưa đặt'}</span></div>
      </article>`;
  }).join('') || '<div class="empty-state">Chưa có mục tiêu tiết kiệm.</div>';
}

function renderDebtSection() {
  const payable = state.debts.filter(item => item.type === 'payable').reduce((sum, item) => sum + Number(item.amount), 0);
  const receivable = state.debts.filter(item => item.type === 'receivable').reduce((sum, item) => sum + Number(item.amount), 0);
  els.debtPayable.textContent = formatCurrency(payable);
  els.debtReceivable.textContent = formatCurrency(receivable);
  els.debtNet.textContent = formatCurrency(receivable - payable);
  els.debtList.innerHTML = state.debts.map(item => `
    <article class="debt-card">
      <div>
        <strong>${item.name}</strong>
        <div class="meta">${item.note || 'Không có ghi chú'} • Hạn ${item.due || 'Chưa đặt'}</div>
      </div>
      <div style="text-align:right">
        <div class="pill ${item.type}">${item.type === 'payable' ? 'Phải trả' : 'Phải thu'}</div>
        <strong style="display:block;margin-top:10px">${formatCurrency(item.amount)}</strong>
        <div class="row-actions" style="justify-content:flex-end;margin-top:12px">
          <button class="icon-square edit" data-edit-debt="${item.id}">✎</button>
          <button class="icon-square delete" data-delete-debt="${item.id}">🗑</button>
        </div>
      </div>
    </article>`).join('') || '<div class="empty-state">Chưa có khoản nợ nào.</div>';
}

function renderTransactionGroups() {
  const txs = filteredTransactions();
  if (!txs.length) {
    els.transactionGroupList.innerHTML = '<div class="empty-state">Chưa có giao dịch nào. Nhấn + để bắt đầu ghi chép.</div>';
    return;
  }
  const groups = groupTransactionsByDate(txs);
  els.transactionGroupList.innerHTML = groups.map(group => `
    <div class="transaction-day-group">
      <div class="transaction-day-header">${group.label}</div>
      <div class="transaction-day-items">
        ${group.items.map(item => {
          const wallet = walletById(item.walletId);
          const category = categoryById(item.categoryId);
          return `
            <article class="transaction-row-card">
              <button class="transaction-main-button" data-edit-transaction="${item.id}">
                <div class="tx-left">
                  <div class="wallet-icon-box small">${category?.icon || '❓'}</div>
                  <div>
                    <strong>${category?.name || 'Không xác định'}</strong>
                    <div class="meta">${item.description || 'Không có mô tả'} • ${wallet?.name || 'Không xác định'}</div>
                  </div>
                </div>
                <div class="tx-right">
                  <strong class="${item.type === 'income' ? 'positive' : 'negative'}">${item.type === 'income' ? '+' : '-'}${formatCurrency(item.amount)}</strong>
                  <span class="meta">${item.time || '00:00'}</span>
                </div>
              </button>
              <div class="row-actions wrap-right">
                ${item.tag ? `<span class="badge-chip recurring">${item.tag}</span>` : ''}
                <button class="icon-square edit" data-edit-transaction="${item.id}" ${item.transferId ? 'disabled' : ''}>✎</button>
                <button class="icon-square delete" data-delete-transaction="${item.id}">🗑</button>
              </div>
            </article>`;
        }).join('')}
      </div>
    </div>`).join('');
}

function renderAnalytics() {
  const month = state.analytics.month || getSelectedMonth();
  const expenseData = aggregateExpenseByCategory(state.transactions, state.categories, month);
  renderDonut(expenseData, els.analyticsDonut, els.analyticsDonutLegend);
  renderSavingsTrend();
  const totalExpense = expenseData.reduce((sum, item) => sum + item.amount, 0);
  els.analyticsTotalExpense.textContent = formatCurrency(totalExpense);
  const expenseTx = state.transactions.filter(item => monthKey(item.date) === month && item.type === 'expense' && item.categoryId !== 'cat-transfer');
  const avgPerTx = expenseTx.length ? Math.round(totalExpense / expenseTx.length) : 0;
  const uniqueDays = new Set(expenseTx.map(item => item.date)).size || 1;
  const avgPerDay = expenseTx.length ? Math.round(totalExpense / uniqueDays) : 0;
  els.avgExpensePerTx.textContent = formatCurrency(avgPerTx);
  els.avgExpensePerDay.textContent = formatCurrency(avgPerDay);
  if (expenseData[0]) {
    els.topCategoryCard.innerHTML = `<strong>${expenseData[0].icon} ${expenseData[0].name}</strong><div class="warning" style="margin-top:8px;font-size:22px;font-weight:800">${formatCurrency(expenseData[0].amount)}</div>`;
  } else {
    els.topCategoryCard.innerHTML = 'Không có dữ liệu';
  }
  const monthStatuses = computeBudgetStatuses(state.categories, state.transactions, state.budgets.filter(item => item.month === month), month);
  const strongest = monthStatuses.find(item => item.level === 'danger') || monthStatuses.find(item => item.level === 'critical') || monthStatuses.find(item => item.level === 'warning');
  els.analyticsAlertCard.innerHTML = strongest ? `<strong>${strongest.categoryName}</strong><div style="margin-top:8px;color:var(--gold-2);font-weight:800">${formatCurrency(strongest.spent)} / ${formatCurrency(strongest.limit)} (${strongest.usage}%)</div>` : 'Không có cảnh báo ngân sách';

  els.analyticsCategoryView.classList.toggle('active-analytics-view', state.analytics.tab === 'category');
  els.analyticsYearlyView.classList.toggle('active-analytics-view', state.analytics.tab === 'yearly');
  els.analyticsTabs.forEach(tab => tab.classList.toggle('active', tab.dataset.analyticsTab === state.analytics.tab));
  els.analyticsYearLabel.textContent = String(state.analytics.year);
  renderYearlyChart();
}

function renderDonut(data, svgEl, legendEl) {
  if (!data.length) {
    svgEl.innerHTML = '<text x="110" y="110" text-anchor="middle" fill="#94a3b8">Không có dữ liệu</text>';
    legendEl.innerHTML = '<div class="empty-state">Không có dữ liệu chi tiêu tháng này.</div>';
    return;
  }
  const colors = ['#3e7be0', '#19b889', '#5b5ce2', '#d93e95', '#f04267', '#f6bf22', '#35c8a0'];
  const radius = 72;
  const center = 110;
  const circumference = 2 * Math.PI * radius;
  const total = data.reduce((sum, item) => sum + item.amount, 0);
  let start = 0;
  svgEl.innerHTML = data.map((item, index) => {
    const ratio = item.amount / total;
    const dash = ratio * circumference;
    const gap = circumference - dash;
    const segment = `<circle data-tooltip="${item.icon} ${item.name}: ${formatCurrency(item.amount)} (${item.percent}%)" r="${radius}" cx="${center}" cy="${center}" fill="transparent" stroke="${colors[index % colors.length]}" stroke-width="26" stroke-dasharray="${dash} ${gap}" stroke-dashoffset="${-start}" transform="rotate(-90 ${center} ${center})"></circle>`;
    start += dash;
    return segment;
  }).join('') + `<circle r="44" cx="${center}" cy="${center}" fill="#0f172a"></circle><text x="110" y="105" text-anchor="middle" fill="#e2e8f0" font-size="15">Tổng chi</text><text x="110" y="128" text-anchor="middle" fill="#f8fafc" font-size="18" font-weight="800">${Math.round(total / 1000)}k</text>`;
  legendEl.innerHTML = data.map((item, index) => `<div class="legend-row" title="${item.name}: ${formatCurrency(item.amount)} (${item.percent}%)"><span class="legend-bullet" style="background:${colors[index % colors.length]}"></span><span>${item.icon} ${item.name}</span><span>${formatCurrency(item.amount)} • ${item.percent}%</span></div>`).join('');
}

function renderSavingsTrend() {
  const data = [12000000, 10500000, 16200000, 23800000];
  const labels = ['Tuần 1', 'Tuần 2', 'Tuần 3', 'Tuần 4'];
  const width = 520;
  const height = 240;
  const padX = 36;
  const padY = 28;
  const maxValue = Math.max(...data);
  const minValue = Math.min(...data);
  const xStep = (width - padX * 2) / (data.length - 1);
  const points = data.map((value, i) => {
    const x = padX + i * xStep;
    const normalized = (value - minValue) / Math.max(maxValue - minValue, 1);
    const y = height - padY - normalized * (height - padY * 2 - 18);
    return { x, y, value };
  });
  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${height - padY} L ${points[0].x} ${height - padY} Z`;
  els.savingsTrendChart.innerHTML = `
    <defs>
      <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#f5b316" stop-opacity="0.28" />
        <stop offset="100%" stop-color="#f5b316" stop-opacity="0.02" />
      </linearGradient>
    </defs>
    <path d="${areaPath}" fill="url(#areaGradient)"></path>
    <path d="${linePath}" fill="none" stroke="#f5b316" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"></path>
    ${points.map(p => `<circle cx="${p.x}" cy="${p.y}" r="5" fill="#f5b316"></circle>`).join('')}
    ${labels.map((label, i) => `<text x="${padX + i * xStep}" y="${height - 6}" fill="#94a3b8" font-size="12" text-anchor="middle">${label}</text>`).join('')}`;
}

function renderYearlyChart() {
  const yearData = aggregateYearlyTotals(state.transactions, state.analytics.year);
  const maxValue = Math.max(1, ...yearData.flatMap(item => [item.income, item.expense]));
  els.yearlyBarChart.innerHTML = yearData.map(item => {
    const incomeHeight = item.income ? Math.max(10, (item.income / maxValue) * 180) : 10;
    const expenseHeight = item.expense ? Math.max(10, (item.expense / maxValue) * 180) : 10;
    return `
      <button class="bar-month-group yearly-selectable" data-year-month="${item.monthIndex}">
        <div class="bar-col income" style="height:${incomeHeight}px" title="Thu: ${formatCurrency(item.income)}"></div>
        <div class="bar-col expense ${item.balance < 0 ? 'negative-outline' : ''}" style="height:${expenseHeight}px" title="Chi: ${formatCurrency(item.expense)}"></div>
        <div class="bar-month-label">${item.label}</div>
      </button>`;
  }).join('');
}

function renderAll() {
  if (isHydratingState) return;
  recalculateWalletBalances();
  syncSelectors();
  renderUserCard();
  renderSummary();
  renderDashboardAlert();
  renderCashflowChart();
  renderWalletSummary();
  renderWalletGrid();
  renderBudgetGrid();
  renderGoalGrid();
  renderDebtSection();
  renderTransactionGroups();
  renderAnalytics();
  saveState();
  saveSession();
  consumeLatestAlert();
}
function handleTransactionSubmit(event) {
  event.preventDefault();
  void (async () => {
    els.transactionError.textContent = '';
    const validation = validateTransaction(state.categories, {
      type: els.transactionType.value,
      amount: els.transactionAmount.value,
      categoryId: els.transactionCategory.value,
      date: els.transactionDate.value,
      description: els.transactionDescription.value,
      time: editingTransactionId ? (state.transactions.find(item => item.id === editingTransactionId)?.time || nowTimeHHMM()) : nowTimeHHMM()
    });
    if (!validation.ok) {
      if (validation.code === 'future_date_confirmation') {
        const accepted = await requestConfirmation('future-transaction');
        if (!accepted) return;
        return submitTransactionWithOverride();
      }
      els.transactionError.textContent = validation.message;
      return;
    }
    applyTransactionPayload(validation.data);
  })();
}

function submitTransactionWithOverride() {
  const validation = validateTransaction(state.categories, {
    type: els.transactionType.value,
    amount: els.transactionAmount.value,
    categoryId: els.transactionCategory.value,
    date: els.transactionDate.value,
    description: els.transactionDescription.value,
    time: editingTransactionId ? (state.transactions.find(item => item.id === editingTransactionId)?.time || nowTimeHHMM()) : nowTimeHHMM()
  }, { allowFuture: true });
  if (!validation.ok) {
    els.transactionError.textContent = validation.message;
    return;
  }
  applyTransactionPayload(validation.data);
}

function applyTransactionPayload(validationData) {
  const payload = { ...validationData, walletId: els.transactionWallet.value, tag: els.transactionRecurring.value };
  let tx;
  if (editingTransactionId) {
    state.transactions = state.transactions.map(item => item.id === editingTransactionId ? { ...item, ...payload } : item);
    tx = state.transactions.find(item => item.id === editingTransactionId);
  } else {
    tx = { id: createId('tx'), ...payload };
    state.transactions.push(tx);
  }
  const month = monthKey(tx.date);
  const alert = buildBudgetAlert(tx, state.categories, state.budgets.filter(item => item.month === month), state.transactions, month);
  if (alert) state.alerts.push(alert);
  recalculateWalletBalances();
  closeModal();
  renderAll();
  setActiveSection('transactions');
}

function handleBudgetSubmit(event) {
  event.preventDefault();
  const categoryId = els.budgetCategory.value;
  const amount = Number(els.budgetAmount.value);
  const month = els.budgetMonth.value;
  if (!categoryId) {
    els.budgetError.textContent = 'Vui lòng chọn danh mục chi';
    return;
  }
  if (!(amount > 0)) {
    els.budgetError.textContent = 'Hạn mức phải lớn hơn 0 ₫';
    return;
  }
  if (editingBudgetId) {
    state.budgets = state.budgets.map(item => item.id === editingBudgetId ? { ...item, categoryId, amount, month } : item);
  } else {
    const existing = state.budgets.find(item => item.categoryId === categoryId && item.month === month);
    if (existing) existing.amount = amount;
    else state.budgets.push({ id: createId('budget'), categoryId, month, amount });
  }
  closeModal();
  renderAll();
  setActiveSection('budgets');
}

function handleGoalSubmit(event) {
  event.preventDefault();
  const validation = validateGoal({
    name: els.goalName.value,
    target: els.goalTarget.value,
    current: els.goalCurrent.value,
    deadline: els.goalDeadline.value
  });
  if (!validation.ok) {
    els.goalError.textContent = validation.message;
    return;
  }
  if (editingGoalId) {
    state.goals = state.goals.map(item => item.id === editingGoalId ? { ...item, ...validation.data } : item);
  } else {
    state.goals.push({ id: createId('goal'), ...validation.data });
  }
  closeModal();
  renderAll();
  setActiveSection('goals');
}

function handleWalletSubmit(event) {
  event.preventDefault();
  const validation = validateWallet(state.wallets, {
    name: els.walletName.value,
    type: els.walletType.value,
    balance: els.walletBalance.value,
    icon: els.walletIcon.value
  }, editingWalletId);
  if (!validation.ok) {
    els.walletError.textContent = validation.message;
    return;
  }
  const payload = { ...validation.data, openingBalance: Number(validation.data.balance), balance: Number(validation.data.balance) };
  if (editingWalletId) {
    state.wallets = state.wallets.map(item => item.id === editingWalletId ? { ...item, ...payload } : item);
  } else {
    state.wallets.push({ id: createId('wallet'), ...payload });
  }
  recalculateWalletBalances();
  closeModal();
  renderAll();
  setActiveSection('wallets');
}

function handleCategorySubmit(event) {
  event.preventDefault();
  const payload = {
    name: els.categoryName.value,
    type: els.categoryType.value,
    icon: els.categoryIcon.value
  };
  const validation = validateCategory(state.categories, payload, editingCategoryId);
  if (!validation.ok) {
    els.categoryError.textContent = validation.message;
    return;
  }
  const normalized = { ...validation.data };
  if (editingCategoryId) {
    state.categories = replaceCategory(state.categories, editingCategoryId, normalized);
  } else {
    state.categories = appendCategory(state.categories, { id: createId('category'), ...normalized });
  }
  state.categories = sortCategories(state.categories);
  closeModal();
  renderAll();
  setActiveSection('wallets');
}

function handleTransferSubmit(event) {
  event.preventDefault();
  const fromWalletId = els.transferFromWallet.value;
  const toWalletId = els.transferToWallet.value;
  const amount = Number(els.transferAmount.value);
  const date = els.transferDate.value || todayISO();
  const note = els.transferNote.value.trim() || 'Chuyển tiền giữa ví';

  const validation = transferBetweenWallets(state.wallets, { fromWalletId, toWalletId, amount });
  if (!validation.ok) {
    els.transferError.textContent = validation.message;
    return;
  }

  const fromWalletName = walletById(fromWalletId)?.name;
  const toWalletName = walletById(toWalletId)?.name;
  const transferId = createId('transfer');
  const description = `${note} (${fromWalletName} → ${toWalletName})`;

  state.transactions.push(
    {
      id: createId('tx'), transferId, transferRole: 'out', linkedWalletId: toWalletId, type: 'expense', amount,
      categoryId: 'cat-transfer', walletId: fromWalletId, date, time: nowTimeHHMM(), description, tag: 'Chuyển ví'
    },
    {
      id: createId('tx'), transferId, transferRole: 'in', linkedWalletId: fromWalletId, type: 'income', amount,
      categoryId: 'cat-transfer', walletId: toWalletId, date, time: nowTimeHHMM(), description, tag: 'Chuyển ví'
    }
  );

  recalculateWalletBalances();
  state.alerts.push({ level: 'safe', text: `Đã chuyển ${formatCurrency(amount)} từ ${fromWalletName} sang ${toWalletName}` });
  closeModal();
  renderAll();
  setActiveSection('wallets');
}

function handleDebtSubmit(event) {
  event.preventDefault();
  const validation = validateDebt({
    name: els.debtName.value,
    type: els.debtType.value,
    amount: els.debtAmount.value,
    due: els.debtDue.value,
    note: els.debtNote.value
  });
  if (!validation.ok) {
    els.debtError.textContent = validation.message;
    return;
  }
  if (editingDebtId) {
    state.debts = state.debts.map(item => item.id === editingDebtId ? { ...item, ...validation.data } : item);
  } else {
    state.debts.push({ id: createId('debt'), ...validation.data });
  }
  closeModal();
  renderAll();
  setActiveSection('debts');
}

function editTransaction(id) {
  const tx = state.transactions.find(item => item.id === id);
  if (!tx) return;
  if (tx.transferId) {
    showToast('Giao dịch chuyển tiền không chỉnh sửa trực tiếp. Vui lòng xóa cặp chuyển tiền và tạo lại.', 'warning');
    return;
  }
  clearEditingState();
  editingTransactionId = id;
  els.transactionType.value = tx.type;
  syncSelectors();
  els.transactionWallet.value = tx.walletId;
  els.transactionCategory.value = tx.categoryId;
  els.transactionAmount.value = tx.amount;
  els.transactionDate.value = tx.date;
  els.transactionDescription.value = tx.description;
  els.transactionRecurring.value = tx.tag || '';
  els.transactionSubmitText.textContent = 'Cập nhật giao dịch';
  openModal('transaction');
}

function editBudget(id) {
  const budget = state.budgets.find(item => item.id === id);
  if (!budget) return;
  clearEditingState();
  editingBudgetId = id;
  els.budgetCategory.value = budget.categoryId;
  els.budgetAmount.value = budget.amount;
  els.budgetMonth.value = budget.month;
  els.budgetSubmitText.textContent = 'Cập nhật hạn mức';
  openModal('budget');
}

function editGoal(id) {
  const goal = state.goals.find(item => item.id === id);
  if (!goal) return;
  clearEditingState();
  editingGoalId = id;
  els.goalName.value = goal.name;
  els.goalTarget.value = goal.target;
  els.goalCurrent.value = goal.current;
  els.goalDeadline.value = goal.deadline || '';
  els.goalSubmitText.textContent = 'Cập nhật mục tiêu';
  openModal('goal');
}

function editWallet(id) {
  const wallet = state.wallets.find(item => item.id === id);
  if (!wallet) return;
  clearEditingState();
  editingWalletId = id;
  els.walletName.value = wallet.name;
  els.walletType.value = wallet.type;
  els.walletBalance.value = Number(wallet.openingBalance ?? wallet.balance);
  els.walletIcon.value = wallet.icon;
  els.walletSubmitText.textContent = 'Cập nhật ví';
  openModal('wallet');
}

function editCategory(id) {
  const category = state.categories.find(item => item.id === id);
  if (!category || !canManageCategory(id)) return;
  clearEditingState();
  editingCategoryId = id;
  els.categoryName.value = category.name;
  els.categoryType.value = category.type;
  els.categoryType.disabled = true;
  els.categoryIcon.value = category.icon;
  els.categorySubmitText.textContent = 'Cập nhật danh mục';
  openModal('category');
}

function deleteCategory(id) {
  void (async () => {
    const result = deleteCategoryById(state.categories, id, state.transactions, state.budgets);
    if (!result.ok) {
      showToast(result.message, 'warning');
      return;
    }
    const accepted = await requestConfirmation('delete-category', { categoryName: result.category.name });
    if (!accepted) return;
    state.categories = result.categories;
    renderAll();
  })();
}

function editDebt(id) {
  const debt = state.debts.find(item => item.id === id);
  if (!debt) return;
  clearEditingState();
  editingDebtId = id;
  els.debtName.value = debt.name;
  els.debtType.value = debt.type;
  els.debtAmount.value = debt.amount;
  els.debtDue.value = debt.due || '';
  els.debtNote.value = debt.note || '';
  els.debtSubmitText.textContent = 'Cập nhật khoản nợ';
  openModal('debt');
}

function deleteTransaction(id) {
  void (async () => {
    const tx = state.transactions.find(item => item.id === id);
    if (!tx) return;
    const label = categoryById(tx.categoryId)?.name || tx.description || tx.id;
    const isTransfer = Boolean(tx.transferId);
    const accepted = isTransfer
      ? await requestConfirmation('delete-transaction-transfer', { description: tx.description || tx.id })
      : await requestConfirmation('delete-transaction', { label, amountText: formatCurrency(tx.amount) });
    if (!accepted) return;
    state.transactions = isTransfer
      ? state.transactions.filter(item => item.transferId !== tx.transferId)
      : state.transactions.filter(item => item.id !== id);
    recalculateWalletBalances();
    renderAll();
  })();
}

function deleteBudget(id) {
  void (async () => {
    const result = deleteBudgetById(state.budgets, id);
    if (!result.ok) return;
    const categoryName = categoryById(result.budget.categoryId)?.name || result.budget.categoryId;
    const accepted = await requestConfirmation('delete-budget', { categoryName });
    if (!accepted) return;
    state.budgets = result.budgets;
    renderAll();
  })();
}

function deleteGoal(id) {
  void (async () => {
    const result = deleteGoalById(state.goals, id);
    if (!result.ok) return;
    const accepted = await requestConfirmation('delete-goal', { goalName: result.goal.name });
    if (!accepted) return;
    state.goals = result.goals;
    renderAll();
  })();
}

function deleteWallet(id) {
  void (async () => {
    const wallet = state.wallets.find(item => item.id === id);
    if (!wallet) return;
    const used = state.transactions.some(item => item.walletId === id);
    if (used) {
      showToast('Không thể xóa ví đã phát sinh giao dịch', 'warning');
      return;
    }
    const accepted = await requestConfirmation('delete-wallet', { walletName: wallet.name });
    if (!accepted) return;
    state.wallets = state.wallets.filter(item => item.id !== id);
    renderAll();
  })();
}

function deleteDebt(id) {
  void (async () => {
    const debt = state.debts.find(item => item.id === id);
    if (!debt) return;
    const accepted = await requestConfirmation('delete-debt', { debtName: debt.name });
    if (!accepted) return;
    state.debts = state.debts.filter(item => item.id !== id);
    renderAll();
  })();
}

function exportTransactions() {
  const rows = filteredTransactions().map(item => {
    const wallet = walletById(item.walletId)?.name || '';
    const category = categoryById(item.categoryId)?.name || '';
    return [item.date, item.time || '', wallet, category, item.description, item.type, item.amount, item.tag || ''].join(',');
  });
  const csv = ['Ngay,Gio,Vi,Danh muc,Mo ta,Loai,So tien,Nhan', ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `transactions-${getSelectedMonth()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function openBudgetCreateForCategory(categoryId) {
  clearEditingState();
  openModal('budget');
  els.budgetCategory.value = categoryId;
  els.budgetMonth.value = getSelectedMonth();
}

function openTransactionsByType(type) {
  state.filters.type = type === 'balance' ? 'all' : type;
  setActiveSection('transactions');
  renderAll();
}

function setAuthView(view) {
  state.authView = view;
  clearAuthFeedback();
  els.loginForm.classList.toggle('hidden-auth-form', view !== 'login');
  els.loginForm.classList.toggle('active-auth-form', view === 'login');
  els.registerForm.classList.toggle('hidden-auth-form', view !== 'register');
  els.registerForm.classList.toggle('active-auth-form', view === 'register');
  els.forgotPasswordForm.classList.toggle('hidden-auth-form', view !== 'forgot');
  els.forgotPasswordForm.classList.toggle('active-auth-form', view === 'forgot');
  els.showLogin.classList.toggle('active', view === 'login');
  els.showRegister.classList.toggle('active', view === 'register');
  saveSession();
}

function updateAuthVisibility() {
  const loggedIn = Boolean(getCurrentUser());
  els.authOverlay.classList.toggle('hidden', loggedIn);
  els.appShell.classList.toggle('app-disabled', !loggedIn);
  if (!loggedIn) setAuthView(state.authView || 'login');
}

function handleRegisterEmailBlur() {
  const email = els.registerEmail.value.trim();
  if (!email) {
    els.registerEmailError.textContent = '';
    return;
  }
  els.registerEmailError.textContent = validateEmail(email) ? '' : 'Email không hợp lệ';
}

function handleRegisterSubmit(event) {
  event.preventDefault();
  void (async () => {
    try {
      const result = await apiRequest('/auth/register', {
        method: 'POST',
        skipAuth: true,
        body: {
          fullName: els.registerFullname.value,
          email: els.registerEmail.value,
          password: els.registerPassword.value,
          confirmPassword: els.registerConfirmPassword.value
        }
      });
      authToken = result.token;
      state = { ...structuredClone(DEFAULT_STATE), ...result.state };
      state.users = [result.user];
      state.currentUserId = result.user.id;
      state.authView = 'login';
      saveSession();
      updateAuthVisibility();
      renderAll();
      showToast(`Chào mừng ${result.user.fullName}!`, 'safe');
    } catch (error) {
      clearAuthFeedback();
      els.registerError.textContent = error.message;
      if (/Email/i.test(error.message)) els.registerEmailError.textContent = error.message;
    }
  })();
}

function handleLoginSubmit(event) {
  event.preventDefault();
  void (async () => {
    try {
      const result = await apiRequest('/auth/login', {
        method: 'POST',
        skipAuth: true,
        body: {
          email: els.loginEmail.value,
          password: els.loginPassword.value
        }
      });
      authToken = result.token;
      state = { ...structuredClone(DEFAULT_STATE), ...result.state };
      state.users = [result.user];
      state.currentUserId = result.user.id;
      saveSession();
      updateAuthVisibility();
      renderAll();
      showToast(`Xin chào ${result.user.fullName}!`, 'safe');
    } catch (error) {
      clearAuthFeedback();
      els.loginError.textContent = error.message;
    }
  })();
}

function handleForgotPasswordSubmit(event) {
  event.preventDefault();
  void (async () => {
    try {
      const result = await apiRequest('/auth/forgot-password', {
        method: 'POST',
        skipAuth: true,
        body: { email: els.forgotEmail.value }
      });
      clearAuthFeedback();
      showToast(result.message, 'warning');
      setAuthView('login');
    } catch (error) {
      clearAuthFeedback();
      els.forgotPasswordError.textContent = error.message;
    }
  })();
}

async function logout() {
  const accepted = await requestConfirmation('logout-account');
  if (!accepted) return;

  try {
    if (authToken) {
      await apiRequest('/auth/logout', { method: 'POST' });
    }
  } catch {
    // noop
  } finally {
    authToken = null;
    state = structuredClone(DEFAULT_STATE);
    state.authView = 'login';
    clearAuthFeedback();
    saveSession();
    updateAuthVisibility();
    renderAll();
    showToast('Đã đăng xuất tài khoản', 'warning');
  }
}

function showYearDetail(monthIndex) {
  const item = aggregateYearlyTotals(state.transactions, state.analytics.year)[Number(monthIndex)];
  if (!item) return;
  els.yearlyChartDetail.innerHTML = `<strong>${item.label}/${state.analytics.year}</strong><br/>Tổng thu: ${formatCurrency(item.income)}<br/>Tổng chi: ${formatCurrency(item.expense)}<br/>Số dư: ${formatCurrency(item.balance)}`;
}

function cycleAnalyticsYear(direction) {
  const years = getAvailableYears(state.transactions, state.analytics.year);
  const currentIndex = years.indexOf(state.analytics.year);
  if (currentIndex === -1) return;
  const nextIndex = Math.min(Math.max(currentIndex + direction, 0), years.length - 1);
  state.analytics.year = years[nextIndex];
  renderAll();
}

function attachEvents() {
  els.navButtons.forEach(btn => btn.addEventListener('click', () => setActiveSection(btn.dataset.section)));
  els.jumpButtons.forEach(btn => btn.addEventListener('click', () => setActiveSection(btn.dataset.jump)));
  $('#open-transaction-modal').addEventListener('click', () => { clearEditingState(); openModal('transaction'); });
  $('#open-quick-action').addEventListener('click', () => setActiveSection('transactions'));
  $('#close-modal').addEventListener('click', closeModal);
  els.modalBackdrop.addEventListener('click', (e) => { if (e.target === els.modalBackdrop) closeModal(); });
  els.confirmCancel.addEventListener('click', () => closeConfirmDialog(false));
  els.confirmAccept.addEventListener('click', () => closeConfirmDialog(true));
  els.confirmBackdrop.addEventListener('click', (e) => { if (e.target === els.confirmBackdrop) closeConfirmDialog(false); });
  $('#new-budget-btn').addEventListener('click', () => { clearEditingState(); openModal('budget'); });
  $('#new-goal-btn').addEventListener('click', () => { clearEditingState(); openModal('goal'); });
  $('#new-debt-btn').addEventListener('click', () => { clearEditingState(); openModal('debt'); });
  $('#add-wallet-btn').addEventListener('click', () => { clearEditingState(); openModal('wallet'); });
  $('#new-category-btn').addEventListener('click', () => { clearEditingState(); els.categoryType.disabled = false; openModal('category'); });
  $('#transfer-wallet-btn').addEventListener('click', () => { clearEditingState(); openModal('transfer'); });
  els.transactionType.addEventListener('change', syncSelectors);
  els.transactionForm.addEventListener('submit', handleTransactionSubmit);
  els.budgetForm.addEventListener('submit', handleBudgetSubmit);
  els.goalForm.addEventListener('submit', handleGoalSubmit);
  els.walletForm.addEventListener('submit', handleWalletSubmit);
  els.categoryForm.addEventListener('submit', handleCategorySubmit);
  els.transferForm.addEventListener('submit', handleTransferSubmit);
  els.debtForm.addEventListener('submit', handleDebtSubmit);

  [els.searchInput, els.reportMonth, els.walletFilter, els.typeFilter, els.categoryFilter].forEach(el => {
    el.addEventListener('input', () => { syncFiltersFromInputs(); renderAll(); });
    el.addEventListener('change', () => { syncFiltersFromInputs(); renderAll(); });
  });

  $('#reset-demo-data').addEventListener('click', () => {
    void (async () => {
      const accepted = await requestConfirmation('reset-demo-data');
      if (!accepted) return;
      state = structuredClone(DEFAULT_STATE);
      restoreSession();
      renderAll();
      updateAuthVisibility();
    })();
  });

  $('#export-transactions').addEventListener('click', exportTransactions);

  els.showLogin.addEventListener('click', () => setAuthView('login'));
  els.showRegister.addEventListener('click', () => setAuthView('register'));
  els.showForgotPassword.addEventListener('click', () => setAuthView('forgot'));
  els.backToLogin.addEventListener('click', () => setAuthView('login'));
  els.registerEmail.addEventListener('blur', handleRegisterEmailBlur);
  els.registerForm.addEventListener('submit', handleRegisterSubmit);
  els.loginForm.addEventListener('submit', handleLoginSubmit);
  els.forgotPasswordForm.addEventListener('submit', handleForgotPasswordSubmit);
  els.logoutBtn.addEventListener('click', logout);

  els.analyticsTabs.forEach(tab => tab.addEventListener('click', () => {
    state.analytics.tab = tab.dataset.analyticsTab;
    renderAll();
  }));
  els.analyticsMonth.addEventListener('change', () => {
    state.analytics.month = els.analyticsMonth.value || getSelectedMonth();
    renderAll();
  });
  els.yearPrev.addEventListener('click', () => cycleAnalyticsYear(1));
  els.yearNext.addEventListener('click', () => cycleAnalyticsYear(-1));
  els.clickableSummaryCards.forEach(card => card.addEventListener('click', () => openTransactionsByType(card.dataset.summaryFilter)));

  document.body.addEventListener('click', (event) => {
    const editId = event.target.closest('[data-edit-transaction]')?.dataset.editTransaction;
    if (editId) editTransaction(editId);
    const deleteId = event.target.closest('[data-delete-transaction]')?.dataset.deleteTransaction;
    if (deleteId) deleteTransaction(deleteId);
    const deleteBudgetId = event.target.closest('[data-budget-delete]')?.dataset.budgetDelete;
    if (deleteBudgetId) deleteBudget(deleteBudgetId);
    const editBudgetId = event.target.closest('[data-edit-budget]')?.dataset.editBudget;
    if (editBudgetId) editBudget(editBudgetId);
    const createBudgetCategoryId = event.target.closest('[data-create-budget]')?.dataset.createBudget;
    if (createBudgetCategoryId) openBudgetCreateForCategory(createBudgetCategoryId);
    const editGoalId = event.target.closest('[data-edit-goal]')?.dataset.editGoal;
    if (editGoalId) editGoal(editGoalId);
    const deleteGoalId = event.target.closest('[data-delete-goal]')?.dataset.deleteGoal;
    if (deleteGoalId) deleteGoal(deleteGoalId);
    const editWalletId = event.target.closest('[data-edit-wallet]')?.dataset.editWallet;
    if (editWalletId) editWallet(editWalletId);
    const deleteWalletId = event.target.closest('[data-delete-wallet]')?.dataset.deleteWallet;
    if (deleteWalletId) deleteWallet(deleteWalletId);
    const editCategoryId = event.target.closest('[data-edit-category]')?.dataset.editCategory;
    if (editCategoryId) editCategory(editCategoryId);
    const deleteCategoryId = event.target.closest('[data-delete-category]')?.dataset.deleteCategory;
    if (deleteCategoryId) deleteCategory(deleteCategoryId);
    const editDebtId = event.target.closest('[data-edit-debt]')?.dataset.editDebt;
    if (editDebtId) editDebt(editDebtId);
    const deleteDebtId = event.target.closest('[data-delete-debt]')?.dataset.deleteDebt;
    if (deleteDebtId) deleteDebt(deleteDebtId);
    const yearMonth = event.target.closest('[data-year-month]')?.dataset.yearMonth;
    if (yearMonth) showYearDetail(yearMonth);
  });
}

function init() {
  bindElements();
  restoreSession();
  syncFiltersToInputs();
  resetForms();
  syncSelectors();
  attachEvents();
  setActiveSection('dashboard');
  renderAll();
  updateAuthVisibility();
  if (authToken) {
    isHydratingState = true;
    void bootstrapAuthenticatedState().finally(() => {
      isHydratingState = false;
      renderAll();
      updateAuthVisibility();
    });
  }
}

init();
