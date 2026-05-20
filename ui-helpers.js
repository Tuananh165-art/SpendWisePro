export function getInitialClientState() {
  return {
    users: [],
    currentUserId: null,
    authView: 'login'
  };
}

export function buildStoredSessionPayload(token, authView = 'login') {
  return {
    token: token || null,
    authView: authView || 'login'
  };
}

export function buildConfirmationDialogModel(kind, payload = {}) {
  switch (kind) {
    case 'future-transaction':
      return {
        title: 'Xác nhận giao dịch tương lai',
        message: 'Bạn đang nhập giao dịch tương lai, tiếp tục?',
        confirmText: 'Tiếp tục',
        cancelText: 'Quay lại',
        tone: 'warning'
      };
    case 'delete-category':
      return {
        title: 'Xóa danh mục',
        message: `Bạn có chắc muốn xóa danh mục ${payload.categoryName || ''}? Thao tác này không thể hoàn tác.`,
        confirmText: 'Xóa danh mục',
        cancelText: 'Đóng',
        tone: 'danger'
      };
    case 'delete-transaction-transfer':
      return {
        title: 'Xóa giao dịch chuyển tiền',
        message: `Xóa giao dịch chuyển tiền ${payload.description || ''}? Hệ thống sẽ xóa cả 2 bút toán liên kết.`,
        confirmText: 'Xóa giao dịch',
        cancelText: 'Hủy',
        tone: 'danger'
      };
    case 'delete-transaction':
      return {
        title: 'Xóa giao dịch',
        message: `Xóa giao dịch ${payload.label || ''} – ${payload.amountText || ''}?`,
        confirmText: 'Xóa giao dịch',
        cancelText: 'Hủy',
        tone: 'danger'
      };
    case 'delete-budget':
      return {
        title: 'Xóa hạn mức',
        message: `Xóa hạn mức danh mục ${payload.categoryName || ''}?`,
        confirmText: 'Xóa hạn mức',
        cancelText: 'Hủy',
        tone: 'danger'
      };
    case 'delete-goal':
      return {
        title: 'Xóa mục tiêu',
        message: `Xóa mục tiêu ${payload.goalName || ''}?`,
        confirmText: 'Xóa mục tiêu',
        cancelText: 'Hủy',
        tone: 'danger'
      };
    case 'delete-wallet':
      return {
        title: 'Xóa ví',
        message: `Xóa ví ${payload.walletName || ''}?`,
        confirmText: 'Xóa ví',
        cancelText: 'Hủy',
        tone: 'danger'
      };
    case 'delete-debt':
      return {
        title: 'Xóa khoản nợ',
        message: `Xóa khoản nợ ${payload.debtName || ''}?`,
        confirmText: 'Xóa khoản nợ',
        cancelText: 'Hủy',
        tone: 'danger'
      };
    case 'reset-demo-data':
      return {
        title: 'Khôi phục dữ liệu mẫu',
        message: 'Khôi phục dữ liệu demo mặc định? Mọi thay đổi chưa đồng bộ sẽ bị thay thế.',
        confirmText: 'Khôi phục',
        cancelText: 'Hủy',
        tone: 'warning'
      };
    case 'logout-account':
      return {
        title: 'Đăng xuất tài khoản',
        message: 'Bạn có chắc muốn đăng xuất khỏi SpendWise Pro?',
        confirmText: 'Đăng xuất',
        cancelText: 'Ở lại',
        tone: 'warning'
      };
    default:
      return {
        title: 'Xác nhận',
        message: payload.message || 'Bạn có chắc muốn tiếp tục?',
        confirmText: 'Tiếp tục',
        cancelText: 'Hủy',
        tone: 'warning'
      };
  }
}
