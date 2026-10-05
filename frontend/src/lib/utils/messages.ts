/** Pesan pengguna dalam Bahasa Indonesia, sesuai konvensi repo. */

export type MessageKey =
  | 'auth.required'
  | 'auth.invalidCredentials'
  | 'auth.networkError'
  | 'auth.signOut'
  | 'auth.householdRequired'
  | 'common.saved'
  | 'common.deleted'
  | 'common.loading'
  | 'common.empty'
  | 'common.retry'
  | 'common.cancel'
  | 'common.confirm'
  | 'common.amountRequired'
  | 'common.amountInvalid'
  | 'tx.incomeRequired'
  | 'tx.expenseRequired'
  | 'tx.transferNeedsTwoWallets'
  | 'tx.sameWalletTransfer'
  | 'wallet.nameRequired'
  | 'category.nameRequired'
  | 'category.duplicateName'
  | 'budget.invalidMonth'
  | 'pin.minLength'
  | 'pin.mismatch'
  | 'pin.wrong'
  | 'pin.needOld'
  | 'pin.notSet'
  | 'ai.unavailable'
  | 'export.failed'
  | 'restore.failed'

type Dict = Record<MessageKey, string>

const id: Dict = {
  'auth.required': 'Silakan masuk untuk melanjutkan',
  'auth.invalidCredentials': 'Email atau kata sandi salah',
  'auth.networkError': 'Tidak dapat terhubung ke server. Cek koneksi lalu coba lagi.',
  'auth.signOut': 'Keluar dari akun?',
  'auth.householdRequired': 'Nama rumah tangga wajib diisi',
  'common.saved': 'Tersimpan',
  'common.deleted': 'Data dihapus',
  'common.loading': 'Memuat…',
  'common.empty': 'Belum ada data',
  'common.retry': 'Coba lagi',
  'common.cancel': 'Batal',
  'common.confirm': 'Ya, lanjutkan',
  'common.amountRequired': 'Nominal belum diisi',
  'common.amountInvalid': 'Nominal tidak valid',
  'tx.incomeRequired': 'Pemasukan wajib memilih kategori',
  'tx.expenseRequired': 'Pengeluaran wajib memilih kategori',
  'tx.transferNeedsTwoWallets': 'Transfer butuh dompet asal dan tujuan',
  'tx.sameWalletTransfer': 'Dompet asal dan tujuan tidak boleh sama',
  'wallet.nameRequired': 'Nama dompet wajib diisi',
  'category.nameRequired': 'Nama kategori wajib diisi',
  'category.duplicateName': 'Kategori dengan nama itu sudah ada',
  'budget.invalidMonth': 'Format bulan harus YYYY-MM',
  'pin.minLength': 'PIN minimal 4 karakter',
  'pin.mismatch': 'Konfirmasi PIN tidak sama',
  'pin.wrong': 'PIN salah',
  'pin.needOld': 'Masukkan PIN lama untuk menggantinya',
  'pin.notSet': 'PIN belum dipasang',
  'ai.unavailable': 'Layanan AI sedang tidak tersedia',
  'export.failed': 'Gagal mengekspor data',
  'restore.failed': 'Gagal memulihkan data',
}

export type Lang = 'id' | 'en'

const en: Dict = {
  'auth.required': 'Please sign in to continue',
  'auth.invalidCredentials': 'Incorrect email or password',
  'auth.networkError': 'Cannot reach the server. Check your connection and try again.',
  'auth.signOut': 'Sign out of your account?',
  'auth.householdRequired': 'Household name is required',
  'common.saved': 'Saved',
  'common.deleted': 'Record deleted',
  'common.loading': 'Loading…',
  'common.empty': 'Nothing here yet',
  'common.retry': 'Try again',
  'common.cancel': 'Cancel',
  'common.confirm': 'Yes, continue',
  'common.amountRequired': 'Amount is required',
  'common.amountInvalid': 'Invalid amount',
  'tx.incomeRequired': 'Income requires a category',
  'tx.expenseRequired': 'Expense requires a category',
  'tx.transferNeedsTwoWallets': 'Transfer needs a source and a destination wallet',
  'tx.sameWalletTransfer': 'Source and destination wallet must differ',
  'wallet.nameRequired': 'Wallet name is required',
  'category.nameRequired': 'Category name is required',
  'category.duplicateName': 'A category with that name already exists',
  'budget.invalidMonth': 'Month must be in YYYY-MM format',
  'pin.minLength': 'PIN must be at least 4 characters',
  'pin.mismatch': 'PIN confirmation does not match',
  'pin.wrong': 'Incorrect PIN',
  'pin.needOld': 'Enter your current PIN to replace it',
  'pin.notSet': 'No PIN configured yet',
  'ai.unavailable': 'The AI service is unavailable',
  'export.failed': 'Export failed',
  'restore.failed': 'Restore failed',
}

const dicts: Record<Lang, Dict> = { id, en }

export type TranslateMessage = (key: MessageKey) => string

export function translate(key: MessageKey, lang: Lang = 'id'): string {
  return dicts[lang]?.[key] ?? id[key]
}

/** Pesan error dari Go API dipetakan ke Bahasa Indonesia bila memungkinkan. */
export function fromApiError(error: unknown, lang: Lang = 'id'): string {
  if (error instanceof Error && error.message) return error.message
  return translate('common.retry', lang)
}