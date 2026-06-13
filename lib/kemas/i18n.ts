export type Lang = "id" | "en"

export function detectLang(): Lang {
  if (typeof navigator === "undefined") return "en"
  const candidates = [navigator.language, ...(navigator.languages || [])]
  for (const c of candidates) {
    if (c && c.toLowerCase().startsWith("id")) return "id"
  }
  return "en"
}

type Dict = Record<string, string>

const en: Dict = {
  appName: "KemasAI",
  appSubtitle: "AutoShelf",
  // nav
  navDashboard: "Dashboard",
  navScan: "Scan",
  navSearch: "Search",
  // dashboard
  greeting: "Your shelf at a glance",
  totalItems: "Total items",
  categories: "Categories",
  lowStock: "Low stock",
  lowStockAlerts: "Low-stock alerts",
  noAlerts: "No alerts. Everything is well stocked.",
  snooze: "Snooze",
  dismiss: "Dismiss",
  runningLow: "running low",
  unitsLeft: "{n} left",
  yourCategories: "Your categories",
  noCategories: "No items yet. Tap the scan button to start cataloging.",
  itemsCount: "{n} items",
  inStock: "In stock",
  // scanner
  scanTitle: "Real-time scanner",
  scanHint: "Point your camera at a pile of items",
  tapToScan: "Tap to scan",
  scanning: "Detecting objects...",
  startCamera: "Start camera",
  cameraError: "Camera unavailable. Using simulated scan.",
  capture: "Capture",
  addAngle: "Add angle",
  multiAngle: "Multi-angle scan",
  anglesCaptured: "{n} angle(s) captured",
  merging: "Merging angles to avoid double-counting...",
  detected: "Detected items",
  saveToCatalog: "Save to catalog",
  rescan: "Scan again",
  savedToast: "Saved {n} items to your catalog",
  // item detail
  itemDetail: "Item detail",
  category: "Category",
  count: "Count",
  location: "Location",
  status: "Status",
  voiceNote: "Voice note",
  recordNote: "Record a voice note",
  recording: "Recording... tap to stop",
  transcribing: "Transcribing...",
  playNote: "Play note",
  noVoiceNote: "No voice note yet.",
  delete: "Delete item",
  adjustCount: "Adjust count",
  description: "Description",
  // search
  searchPlaceholder: "Search items, categories, notes...",
  searchHint: "Search by name, category, or voice note",
  noResults: "No items match your search.",
  resultsCount: "{n} result(s)",
  // status
  statusOk: "Healthy",
  statusLow: "Low",
  statusOut: "Out",
  // common
  close: "Close",
  done: "Done",
}

const id: Dict = {
  appName: "KemasAI",
  appSubtitle: "AutoShelf",
  navDashboard: "Beranda",
  navScan: "Pindai",
  navSearch: "Cari",
  greeting: "Ringkasan rak Anda",
  totalItems: "Total barang",
  categories: "Kategori",
  lowStock: "Stok menipis",
  lowStockAlerts: "Peringatan stok menipis",
  noAlerts: "Tidak ada peringatan. Semua stok aman.",
  snooze: "Tunda",
  dismiss: "Tutup",
  runningLow: "stok menipis",
  unitsLeft: "sisa {n}",
  yourCategories: "Kategori Anda",
  noCategories: "Belum ada barang. Ketuk tombol pindai untuk mulai.",
  itemsCount: "{n} barang",
  inStock: "Tersedia",
  scanTitle: "Pemindai waktu nyata",
  scanHint: "Arahkan kamera ke tumpukan barang",
  tapToScan: "Ketuk untuk memindai",
  scanning: "Mendeteksi objek...",
  startCamera: "Nyalakan kamera",
  cameraError: "Kamera tidak tersedia. Memakai pindai simulasi.",
  capture: "Ambil",
  addAngle: "Tambah sudut",
  multiAngle: "Pindai multi-sudut",
  anglesCaptured: "{n} sudut diambil",
  merging: "Menggabungkan sudut agar tidak terhitung ganda...",
  detected: "Barang terdeteksi",
  saveToCatalog: "Simpan ke katalog",
  rescan: "Pindai lagi",
  savedToast: "{n} barang disimpan ke katalog",
  itemDetail: "Detail barang",
  category: "Kategori",
  count: "Jumlah",
  location: "Lokasi",
  status: "Status",
  voiceNote: "Catatan suara",
  recordNote: "Rekam catatan suara",
  recording: "Merekam... ketuk untuk berhenti",
  transcribing: "Menyalin...",
  playNote: "Putar catatan",
  noVoiceNote: "Belum ada catatan suara.",
  delete: "Hapus barang",
  adjustCount: "Sesuaikan jumlah",
  description: "Deskripsi",
  searchPlaceholder: "Cari barang, kategori, catatan...",
  searchHint: "Cari berdasarkan nama, kategori, atau catatan suara",
  noResults: "Tidak ada barang yang cocok.",
  resultsCount: "{n} hasil",
  statusOk: "Aman",
  statusLow: "Menipis",
  statusOut: "Habis",
  close: "Tutup",
  done: "Selesai",
}

const dicts: Record<Lang, Dict> = { en, id }

export function makeT(lang: Lang) {
  const d = dicts[lang]
  return (key: keyof typeof en, vars?: Record<string, string | number>) => {
    let s = d[key] ?? en[key] ?? String(key)
    if (vars) {
      for (const k of Object.keys(vars)) {
        s = s.replace(`{${k}}`, String(vars[k]))
      }
    }
    return s
  }
}

export type TFunc = ReturnType<typeof makeT>
