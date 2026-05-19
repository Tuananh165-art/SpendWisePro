import {
  createId,
  todayISO,
  monthKey,
  formatCurrency,
  validateTransaction,
  computeMonthlySummary,
  aggregateExpenseByCategory,
  aggregateYearlyTotals,
  computeBudgetStatuses,
  buildBudgetAlert
} from './logic.js';

const STORAGE_KEY = 'spendwise-pro-week3-state-v2';

const DEFAULT_STATE = {
  categories: [
    { id: 'cat-salary', name: 'Lương', type: 'income', icon: '💼' },
    { id: 'cat-bonus', name: 'Thưởng', type: 'income', icon: '🎉' },
    { id: 'cat-food', name: 'Ăn uống', type: 'expense', icon: '🍜' },
    { id: 'cat-transport', name: 'Di chuyển', type: 'expense', icon: '🛵' },
    { id: 'cat-bills', name: 'Hóa đơn', type: 'expense', icon: '💡' },
    { id: 'cat-entertainment', name: 'Giải trí', type: 'expense', icon: '🎬' },
    { id: 'cat-shopping', name: 'Mua sắm', type: 'expense', icon: '🛍️' }
  ],
  wallets: [
    { id: 'wallet-cash', name: 'Tiền mặt', type: 'CASH', icon: '💵', balance: 3500000 },
    { id: 'wallet-vpbank', name: 'VPBank', type: 'BANK', icon: '🏦', balance: 22800000 },
    { id: 'wallet-momo', name: 'Ví MoMo', type: 'WALLET', icon: '📱', balance: 1560000 },
    { id: 'wallet-zalo', name: 'Ví Zalo Pay', type: 'WALLET', icon: '💳', balance: 820000 },
    { id: 'wallet-saving', name: 'Tiết kiệm', type: 'BANK', icon: '💎', balance: 18000000 },
    { id: 'wallet-usd', name: 'USD Account', type: 'BANK', icon: '💲', balance: 4200000 }
  ],
  transactions: [
    { id: 'tx1', type: 'income', amount: 15000000, categoryId: 'cat-salary', walletId: 'wallet-vpbank', date: '2026-05-01', description: 'Lương tháng 5', tag: '' },
    { id: 'tx2', type: 'expense', amount: 450000, categoryId: 'cat-food', walletId: 'wallet-cash', date: '2026-05-02', description: 'Ăn trưa cả tuần', tag: '' },
    { id: 'tx3', type: 'expense', amount: 180000, categoryId: 'cat-transport', walletId: 'wallet-momo', date: '2026-05-03', description: 'Đổ xăng', tag: '' },
    { id: 'tx4', type: 'expense', amount: 600000, categoryId: 'cat-bills', walletId: 'wallet-vpbank', date: '2026-05-05', description: 'Tiền điện nước', tag: 'Định kỳ' },
    { id: 'tx5', type: 'expense', amount: 320000, categoryId: 'cat-entertainment', walletId: 'wallet-zalo', date: '2026-05-10', description: 'Xem phim cuối tuần', tag: '' },
    { id: 'tx6', type: 'income', amount: 2000000, categoryId: 'cat-bonus', walletId: 'wallet-vpbank', date: '2026-04-20', description: 'Thưởng dự án', tag: '' },
    { id: 'tx7', type: 'expense', amount: 2920000, categoryId: 'cat-shopping', walletId: 'wallet-vpbank', date: '2026-05-14', description: 'Mua sắm gia đình', tag: '' },
    { id: 'tx8', type: 'expense', amount: 300000, categoryId: 'cat-food', walletId: 'wallet-cash', date: '2026-04-22', description: 'Đi chợ', tag: '' },
    { id: 'tx9', type: 'expense', amount: 210000, categoryId: 'cat-transport', walletId: 'wallet-momo', date: '2026-03-18', description: 'Gửi xe', tag: '' }
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
  alerts: []
};

const els = {};
let state = loadState();
let editingTransactionId = null;
let currentModal = 'transaction';

const sectionMeta = {
  dashboard: { title: 'Dashboard', subtitle: 'Chào buổi sáng! Hôm nay bạn chi tiêu gì chưa?' },
  transactions: { title: 'Lịch sử Giao dịch', subtitle: 'Quản lý và tra cứu lịch sử thu chi theo đúng thiết kế tuần 2.' },
  wallets: { title: 'Ví & Tài khoản', subtitle: 'Quản lý hệ sinh thái ví và dòng tiền linh hoạt giữa các tài khoản.' },
  budgets: { title: 'Hạn mức Chi tiêu', subtitle: 'Theo dõi chi tiêu theo danh mục với cảnh báo ngân sách thông minh.' },
  goals: { title: 'Mục tiêu Tiết kiệm', subtitle: 'Tăng tốc các mục tiêu tài chính cá nhân với progress trực quan.' },
  debts: { title: 'Khoản nợ', subtitle: 'Theo dõi nợ phải trả và phải thu một cách minh bạch.' },
  analytics: { title: 'Phân tích Tài chính', subtitle: 'Biểu đồ và KPI trực quan để đọc xu hướng chi tiêu trong tháng.' }
};

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return structuredClone(DEFAULT_STATE);
    return { ...structuredClone(DEFAULT_STATE), ...JSON.parse(raw) };
  } catch {
    return structuredClone(DEFAULT_STATE);
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
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
    summaryBudget: $('#summary-budget'),
    totalBudgetProgress: $('#total-budget-progress'),
    incomeCountFoot: $('#income-count-foot'),
    expenseCountFoot: $('#expense-count-foot'),
    dashboardAlertBanner: $('#dashboard-alert-banner'),
    walletSummaryList: $('#wallet-summary-list'),
    cashflowChart: $('#cashflow-chart'),
    walletGrid: $('#wallet-grid'),
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
    transactionTableBody: $('#transaction-table-body'),
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
    budgetError: $('#budget-error'),
    goalName: $('#goal-name'),
    goalTarget: $('#goal-target'),
    goalCurrent: $('#goal-current'),
    goalDeadline: $('#goal-deadline'),
    goalError: $('#goal-error')
  });
}

function walletById(id) {
  return state.wallets.find(item => item.id === id);
}
function categoryById(id) {
  return state.categories.find(item => item.id === id);
}
function getSelectedMonth() {
  return els.reportMonth.value || '2026-05';
}

function setActiveSection(section) {
  els.navButtons.forEach(btn => btn.classList.toggle('active', btn.dataset.section === section));
  els.sectionEls.forEach(sec => sec.classList.toggle('active-section', sec.id === `section-${section}`));
  const meta = sectionMeta[section];
  els.pageTitle.textContent = meta.title;
  els.pageSubtitle.textContent = meta.subtitle;
}

function openModal(type) {
  currentModal = type;
  els.modalBackdrop.classList.remove('hidden');
  [els.transactionForm, els.budgetForm, els.goalForm].forEach(form => form.classList.add('hidden-form'));
  if (type === 'transaction') {
    els.modalTitle.textContent = editingTransactionId ? 'Chỉnh sửa giao dịch' : 'Ghi chép giao dịch mới';
    els.modalSubtitle.textContent = 'Nhập thông tin theo đúng acceptance criteria.';
    els.transactionForm.classList.remove('hidden-form');
  }
  if (type === 'budget') {
    els.modalTitle.textContent = 'Thiết lập hạn mức';
    els.modalSubtitle.textContent = 'Áp dụng hạn mức theo danh mục chi và theo tháng.';
    els.budgetForm.classList.remove('hidden-form');
  }
  if (type === 'goal') {
    els.modalTitle.textContent = 'Thêm mục tiêu tiết kiệm';
    els.modalSubtitle.textContent = 'Theo dõi tiến độ tài chính với progress card.';
    els.goalForm.classList.remove('hidden-form');
  }
}

function closeModal() {
  els.modalBackdrop.classList.add('hidden');
  editingTransactionId = null;
  resetForms();
}

function resetForms() {
  els.transactionForm.reset();
  els.budgetForm.reset();
  els.goalForm.reset();
  els.transactionType.value = 'expense';
  els.transactionDate.value = todayISO();
  els.budgetMonth.value = getSelectedMonth();
  els.transactionSubmitText.textContent = 'Lưu giao dịch';
  els.transactionError.textContent = '';
  els.budgetError.textContent = '';
  els.goalError.textContent = '';
  syncSelectors();
}

function syncSelectors() {
  const txType = els.transactionType.value;
  const txCategories = state.categories.filter(item => item.type === txType);
  els.transactionCategory.innerHTML = '<option value="">-- Chọn danh mục --</option>' + txCategories.map(item => `<option value="${item.id}">${item.icon} ${item.name}</option>`).join('');
  els.transactionWallet.innerHTML = state.wallets.map(item => `<option value="${item.id}">${item.name}</option>`).join('');
  els.budgetCategory.innerHTML = state.categories.filter(item => item.type === 'expense').map(item => `<option value="${item.id}">${item.icon} ${item.name}</option>`).join('');
  els.walletFilter.innerHTML = '<option value="all">Tất cả ví</option>' + state.wallets.map(item => `<option value="${item.id}">${item.name}</option>`).join('');
  els.categoryFilter.innerHTML = '<option value="all">Tất cả danh mục</option>' + state.categories.map(item => `<option value="${item.id}">${item.name}</option>`).join('');
}

function filteredTransactions() {
  const month = getSelectedMonth();
  const search = (els.searchInput.value || '').trim().toLowerCase();
  const wallet = els.walletFilter.value;
  const type = els.typeFilter.value;
  const category = els.categoryFilter.value;
  return state.transactions
    .filter(item => monthKey(item.date) === month)
    .filter(item => wallet === 'all' || item.walletId === wallet)
    .filter(item => type === 'all' || item.type === type)
    .filter(item => category === 'all' || item.categoryId === category)
    .filter(item => {
      if (!search) return true;
      const walletName = walletById(item.walletId)?.name || '';
      const categoryName = categoryById(item.categoryId)?.name || '';
      return [item.description, walletName, categoryName, item.tag].join(' ').toLowerCase().includes(search);
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date));
}

function renderSummary() {
  const month = getSelectedMonth();
  const summary = computeMonthlySummary(state.transactions, month);
  const totalAssets = state.wallets.reduce((sum, item) => sum + item.balance, 0);
  const budgets = state.budgets.filter(item => item.month === month);
  const totalBudget = budgets.reduce((sum, item) => sum + Number(item.amount), 0);
  const budgetUsage = totalBudget ? Math.min((summary.expense / totalBudget) * 100, 100) : 0;
  const monthTx = state.transactions.filter(item => monthKey(item.date) === month);
  els.summaryAssets.textContent = formatCurrency(totalAssets);
  els.summaryIncome.textContent = formatCurrency(summary.income);
  els.summaryExpense.textContent = formatCurrency(summary.expense);
  els.summaryBudget.textContent = formatCurrency(totalBudget);
  els.totalBudgetProgress.style.width = `${budgetUsage}%`;
  els.incomeCountFoot.textContent = `${monthTx.filter(item => item.type === 'income').length} giao dịch thu`;
  els.expenseCountFoot.textContent = `${monthTx.filter(item => item.type === 'expense').length} giao dịch chi`;
}

function renderDashboardAlert() {
  const month = getSelectedMonth();
  const budgetStatuses = computeBudgetStatuses(state.categories, state.transactions, state.budgets.filter(item => item.month === month), month);
  const strongest = budgetStatuses.find(item => item.level === 'danger') || budgetStatuses.find(item => item.level === 'critical') || budgetStatuses.find(item => item.level === 'warning');
  if (!strongest) {
    els.dashboardAlertBanner.classList.add('empty');
    els.dashboardAlertBanner.innerHTML = '<strong>Ngân sách ổn định</strong><p>Chưa có danh mục nào gần vượt hạn mức trong tháng này.</p>';
    return;
  }
  els.dashboardAlertBanner.classList.remove('empty');
  els.dashboardAlertBanner.innerHTML = `<strong>GẦN HẾT HẠN MỨC</strong><p>${strongest.categoryName}: ${formatCurrency(strongest.spent)} / ${formatCurrency(strongest.limit)} (${strongest.usage}%)</p>`;
}

function renderCashflowChart() {
  const yearData = aggregateYearlyTotals(state.transactions, 2026).slice(0, 6);
  const maxValue = Math.max(1, ...yearData.flatMap(item => [item.income, item.expense]));
  els.cashflowChart.innerHTML = yearData.map(item => {
    const incomeHeight = Math.max(12, (item.income / maxValue) * 170);
    const expenseHeight = Math.max(12, (item.expense / maxValue) * 170);
    return `
      <div class="bar-month-group">
        <div class="bar-col income" style="height:${incomeHeight}px"></div>
        <div class="bar-col expense" style="height:${expenseHeight}px"></div>
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
  els.walletGrid.innerHTML = state.wallets.map(item => `
    <article class="wallet-card">
      <div class="wallet-card-top">
        <div class="wallet-icon-box">${item.icon}</div>
        <div class="inline-actions">
          <button class="icon-square edit" title="Sửa">✎</button>
          <button class="icon-square delete" title="Xóa">🗑</button>
        </div>
      </div>
      <div class="wallet-title">${item.name}</div>
      <div class="wallet-balance">${formatCurrency(item.balance)}</div>
      <div class="wallet-kind">${item.type}</div>
    </article>`).join('');
}

function renderBudgetGrid() {
  const month = getSelectedMonth();
  const statuses = computeBudgetStatuses(state.categories, state.transactions, state.budgets.filter(item => item.month === month), month);
  els.budgetGrid.innerHTML = statuses.map(item => `
    <article class="budget-card">
      <div class="budget-card-top">
        <div>
          <div class="budget-title">${item.icon} ${item.categoryName}</div>
          <div class="budget-amount">${formatCurrency(item.spent)} / ${formatCurrency(item.limit)}</div>
        </div>
        <div class="inline-actions">
          <button class="icon-square edit">✎</button>
          <button class="icon-square delete" data-budget-delete="${item.categoryId}">🗑</button>
        </div>
      </div>
      <div class="progress-track"><div class="progress-fill ${item.level === 'safe' ? 'safe' : item.level}" style="width:${Math.min(item.usage,100)}%"></div></div>
      <div class="budget-footer"><strong>${item.usage}%</strong><span class="budget-date">Còn lại ${formatCurrency(item.remaining)}</span></div>
    </article>`).join('') || '<div class="empty-state">Chưa có hạn mức cho tháng đang xem.</div>';
}

function renderGoalGrid() {
  els.goalGrid.innerHTML = state.goals.map(item => {
    const progress = item.target ? Math.round((item.current / item.target) * 100) : 0;
    return `
      <article class="goal-card">
        <div class="goal-card-top">
          <div class="goal-title">${item.name}</div>
          <div class="inline-actions">
            <button class="icon-square edit">✎</button>
            <button class="icon-square delete">🗑</button>
          </div>
        </div>
        <div class="goal-amount">${formatCurrency(item.current)} / ${formatCurrency(item.target)}</div>
        <div class="progress-track"><div class="progress-fill goal" style="width:${Math.min(progress,100)}%"></div></div>
        <div class="goal-footer"><strong>Tiến độ: ${progress}%</strong><span class="goal-date">Hạn: ${item.deadline}</span></div>
      </article>`;
  }).join('');
}

function renderDebtSection() {
  const payable = state.debts.filter(item => item.type === 'payable').reduce((sum, item) => sum + item.amount, 0);
  const receivable = state.debts.filter(item => item.type === 'receivable').reduce((sum, item) => sum + item.amount, 0);
  els.debtPayable.textContent = formatCurrency(payable);
  els.debtReceivable.textContent = formatCurrency(receivable);
  els.debtNet.textContent = formatCurrency(receivable - payable);
  els.debtList.innerHTML = state.debts.map(item => `
    <article class="debt-card">
      <div>
        <strong>${item.name}</strong>
        <div class="meta">${item.note} • Hạn ${item.due}</div>
      </div>
      <div style="text-align:right">
        <div class="pill ${item.type}">${item.type === 'payable' ? 'Phải trả' : 'Phải thu'}</div>
        <strong style="display:block;margin-top:10px">${formatCurrency(item.amount)}</strong>
      </div>
    </article>`).join('');
}

function renderTransactionTable() {
  const txs = filteredTransactions();
  els.transactionTableBody.innerHTML = txs.map(item => {
    const wallet = walletById(item.walletId);
    const category = categoryById(item.categoryId);
    return `
      <tr>
        <td>${item.date}</td>
        <td><span class="wallet-chip">${wallet?.icon || '💼'} ${wallet?.name || 'Không xác định'}</span></td>
        <td><span class="category-chip">${category?.icon || '❓'} ${category?.name || 'Không xác định'}</span></td>
        <td>
          <div>${item.description || 'Không có mô tả'}</div>
          ${item.tag ? `<span class="badge-chip recurring">${item.tag}</span>` : ''}
        </td>
        <td><span class="type-chip ${item.type}">${item.type === 'income' ? 'Thu' : 'Chi'}</span></td>
        <td class="${item.type === 'income' ? 'positive' : 'negative'}"><strong>${item.type === 'income' ? '+' : '-'}${formatCurrency(item.amount)}</strong></td>
        <td>
          <div class="row-actions">
            <button class="icon-square edit" data-edit-transaction="${item.id}">✎</button>
            <button class="icon-square delete" data-delete-transaction="${item.id}">🗑</button>
          </div>
        </td>
      </tr>`;
  }).join('') || '<tr><td colspan="7"><div class="empty-state">Không có giao dịch phù hợp bộ lọc.</div></td></tr>';
}

function renderAnalytics() {
  const month = getSelectedMonth();
  const expenseData = aggregateExpenseByCategory(state.transactions, state.categories, month);
  renderDonut(expenseData, els.analyticsDonut, els.analyticsDonutLegend);
  renderSavingsTrend();
  const totalExpense = expenseData.reduce((sum, item) => sum + item.amount, 0);
  const expenseTx = state.transactions.filter(item => monthKey(item.date) === month && item.type === 'expense');
  const avgPerTx = expenseTx.length ? Math.round(totalExpense / expenseTx.length) : 0;
  const uniqueDays = new Set(expenseTx.map(item => item.date)).size || 1;
  const avgPerDay = Math.round(totalExpense / uniqueDays);
  els.avgExpensePerTx.textContent = formatCurrency(avgPerTx);
  els.avgExpensePerDay.textContent = formatCurrency(avgPerDay);
  if (expenseData[0]) {
    els.topCategoryCard.innerHTML = `<strong>${expenseData[0].icon} ${expenseData[0].name}</strong><div class="warning" style="margin-top:8px;font-size:22px;font-weight:800">${formatCurrency(expenseData[0].amount)}</div>`;
  } else {
    els.topCategoryCard.innerHTML = 'Không có dữ liệu';
  }
  const monthStatuses = computeBudgetStatuses(state.categories, state.transactions, state.budgets.filter(item => item.month === month), month);
  const strongest = monthStatuses.find(item => item.level === 'danger') || monthStatuses.find(item => item.level === 'critical') || monthStatuses[0];
  els.analyticsAlertCard.innerHTML = strongest ? `<strong>${strongest.categoryName}</strong><div style="margin-top:8px;color:var(--gold-2);font-weight:800">${formatCurrency(strongest.spent)} / ${formatCurrency(strongest.limit)} (${strongest.usage}%)</div>` : 'Không có cảnh báo ngân sách';
}

function renderDonut(data, svgEl, legendEl) {
  if (!data.length) {
    svgEl.innerHTML = '<text x="110" y="110" text-anchor="middle" fill="#94a3b8">Không có dữ liệu</text>';
    legendEl.innerHTML = '<div class="empty-state">Tháng này chưa có giao dịch chi.</div>';
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
    const segment = `<circle r="${radius}" cx="${center}" cy="${center}" fill="transparent" stroke="${colors[index % colors.length]}" stroke-width="26" stroke-dasharray="${dash} ${gap}" stroke-dashoffset="${-start}" transform="rotate(-90 ${center} ${center})"></circle>`;
    start += dash;
    return segment;
  }).join('') + `<circle r="44" cx="${center}" cy="${center}" fill="#0f172a"></circle><text x="110" y="105" text-anchor="middle" fill="#e2e8f0" font-size="15">Tổng chi</text><text x="110" y="128" text-anchor="middle" fill="#f8fafc" font-size="18" font-weight="800">${Math.round(total/1000)}k</text>`;
  legendEl.innerHTML = data.map((item, index) => `<div class="legend-row"><span class="legend-bullet" style="background:${colors[index % colors.length]}"></span><span>${item.icon} ${item.name}</span><span>${item.percent}%</span></div>`).join('');
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

function updateWalletBalancesFromTransactions() {
  const baseMap = Object.fromEntries(DEFAULT_STATE.wallets.map(item => [item.id, item.balance]));
  state.wallets = state.wallets.map(wallet => {
    const txs = state.transactions.filter(tx => tx.walletId === wallet.id);
    let balance = baseMap[wallet.id] ?? wallet.balance;
    txs.forEach(tx => {
      if (tx.type === 'income') balance += tx.amount;
      else balance -= tx.amount;
    });
    return { ...wallet, balance: Math.max(balance, 0) };
  });
}

function renderAll() {
  updateWalletBalancesFromTransactions();
  renderSummary();
  renderDashboardAlert();
  renderCashflowChart();
  renderWalletSummary();
  renderWalletGrid();
  renderBudgetGrid();
  renderGoalGrid();
  renderDebtSection();
  renderTransactionTable();
  renderAnalytics();
  saveState();
}

function handleTransactionSubmit(event) {
  event.preventDefault();
  const validation = validateTransaction(state.categories, {
    type: els.transactionType.value,
    amount: els.transactionAmount.value,
    categoryId: els.transactionCategory.value,
    date: els.transactionDate.value,
    description: els.transactionDescription.value
  });
  if (!validation.ok) {
    els.transactionError.textContent = validation.message;
    return;
  }
  const payload = {
    ...validation.data,
    walletId: els.transactionWallet.value,
    tag: els.transactionRecurring.value
  };
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
  const existing = state.budgets.find(item => item.categoryId === categoryId && item.month === month);
  if (existing) existing.amount = amount;
  else state.budgets.push({ id: createId('budget'), categoryId, month, amount });
  closeModal();
  renderAll();
  setActiveSection('budgets');
}

function handleGoalSubmit(event) {
  event.preventDefault();
  const name = els.goalName.value.trim();
  const target = Number(els.goalTarget.value);
  const current = Number(els.goalCurrent.value);
  const deadline = els.goalDeadline.value;
  if (!name) {
    els.goalError.textContent = 'Vui lòng nhập tên mục tiêu';
    return;
  }
  if (!(target > 0) || current < 0) {
    els.goalError.textContent = 'Mục tiêu và số đã tích lũy phải hợp lệ';
    return;
  }
  state.goals.push({ id: createId('goal'), name, target, current, deadline });
  closeModal();
  renderAll();
  setActiveSection('goals');
}

function editTransaction(id) {
  const tx = state.transactions.find(item => item.id === id);
  if (!tx) return;
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

function deleteTransaction(id) {
  const tx = state.transactions.find(item => item.id === id);
  if (!tx) return;
  if (!confirm(`Xóa giao dịch ${tx.description || tx.id}?`)) return;
  state.transactions = state.transactions.filter(item => item.id !== id);
  renderAll();
}

function deleteBudget(categoryId) {
  if (!confirm('Xóa hạn mức của danh mục này trong tháng đang xem?')) return;
  state.budgets = state.budgets.filter(item => !(item.categoryId === categoryId && item.month === getSelectedMonth()));
  renderAll();
}

function exportTransactions() {
  const rows = filteredTransactions().map(item => {
    const wallet = walletById(item.walletId)?.name || '';
    const category = categoryById(item.categoryId)?.name || '';
    return [item.date, wallet, category, item.description, item.type, item.amount, item.tag || ''].join(',');
  });
  const csv = ['Ngay,Vi,Danh muc,Mo ta,Loai,So tien,Nhan', ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `transactions-${getSelectedMonth()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function attachEvents() {
  els.navButtons.forEach(btn => btn.addEventListener('click', () => setActiveSection(btn.dataset.section)));
  els.jumpButtons.forEach(btn => btn.addEventListener('click', () => setActiveSection(btn.dataset.jump)));
  $('#open-transaction-modal').addEventListener('click', () => openModal('transaction'));
  $('#open-quick-action').addEventListener('click', () => setActiveSection('transactions'));
  $('#close-modal').addEventListener('click', closeModal);
  els.modalBackdrop.addEventListener('click', (e) => { if (e.target === els.modalBackdrop) closeModal(); });
  $('#new-budget-btn').addEventListener('click', () => openModal('budget'));
  $('#new-goal-btn').addEventListener('click', () => openModal('goal'));
  els.transactionType.addEventListener('change', syncSelectors);
  els.transactionForm.addEventListener('submit', handleTransactionSubmit);
  els.budgetForm.addEventListener('submit', handleBudgetSubmit);
  els.goalForm.addEventListener('submit', handleGoalSubmit);
  [els.searchInput, els.reportMonth, els.walletFilter, els.typeFilter, els.categoryFilter].forEach(el => el.addEventListener('input', renderAll));
  [els.reportMonth, els.walletFilter, els.typeFilter, els.categoryFilter].forEach(el => el.addEventListener('change', renderAll));
  $('#reset-demo-data').addEventListener('click', () => {
    if (!confirm('Khôi phục dữ liệu demo mặc định?')) return;
    state = structuredClone(DEFAULT_STATE);
    resetForms();
    renderAll();
  });
  $('#export-transactions').addEventListener('click', exportTransactions);
  document.body.addEventListener('click', (event) => {
    const editId = event.target.closest('[data-edit-transaction]')?.dataset.editTransaction;
    if (editId) editTransaction(editId);
    const deleteId = event.target.closest('[data-delete-transaction]')?.dataset.deleteTransaction;
    if (deleteId) deleteTransaction(deleteId);
    const deleteBudgetId = event.target.closest('[data-budget-delete]')?.dataset.budgetDelete;
    if (deleteBudgetId) deleteBudget(deleteBudgetId);
  });
  $('#add-wallet-btn').addEventListener('click', () => alert('Bản demo tuần 3 tập trung vào UI và nghiệp vụ chính. Có thể mở rộng form thêm ví nếu cần.'));
  $('#transfer-wallet-btn').addEventListener('click', () => alert('Mockup tuần 2 có module chuyển tiền; bản demo tuần 3 đang thể hiện UI ví theo thiết kế.'));
}

function init() {
  bindElements();
  els.reportMonth.value = '2026-05';
  resetForms();
  syncSelectors();
  attachEvents();
  setActiveSection('dashboard');
  renderAll();
}

init();
