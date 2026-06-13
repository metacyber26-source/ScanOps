import type { InventoryItem } from "./types"

// Catalog of "detectable" objects the simulated vision model knows about.
// Grouped by AI-generated category (function / theme).
interface DetectableDef {
  name: string
  nameId: string
  category: string
  categoryId: string
  emoji: string
  location: string
}

const CATALOG: DetectableDef[] = [
  // Books / Buku
  { name: "Novel", nameId: "Novel", category: "Books", categoryId: "Buku", emoji: "📕", location: "Shelf A" },
  { name: "Comic", nameId: "Komik", category: "Books", categoryId: "Buku", emoji: "📗", location: "Shelf A" },
  { name: "Notebook", nameId: "Buku Tulis", category: "Books", categoryId: "Buku", emoji: "📘", location: "Shelf A" },
  { name: "Magazine", nameId: "Majalah", category: "Books", categoryId: "Buku", emoji: "📙", location: "Shelf A" },
  // Beverages / Minuman
  { name: "Bottled Water", nameId: "Air Botol", category: "Beverages", categoryId: "Minuman", emoji: "🥤", location: "Rack 1" },
  { name: "Canned Drink", nameId: "Minuman Kaleng", category: "Beverages", categoryId: "Minuman", emoji: "🥫", location: "Rack 1" },
  { name: "Coffee Pack", nameId: "Kopi Sachet", category: "Beverages", categoryId: "Minuman", emoji: "☕", location: "Rack 1" },
  // Snacks / Camilan
  { name: "Chips", nameId: "Keripik", category: "Snacks", categoryId: "Camilan", emoji: "🍿", location: "Rack 2" },
  { name: "Biscuit", nameId: "Biskuit", category: "Snacks", categoryId: "Camilan", emoji: "🍪", location: "Rack 2" },
  { name: "Candy", nameId: "Permen", category: "Snacks", categoryId: "Camilan", emoji: "🍬", location: "Rack 2" },
  // Toys / Mainan
  { name: "Action Figure", nameId: "Action Figure", category: "Toys", categoryId: "Mainan", emoji: "🤖", location: "Box B" },
  { name: "Toy Car", nameId: "Mobil Mainan", category: "Toys", categoryId: "Mainan", emoji: "🚗", location: "Box B" },
  { name: "Building Block", nameId: "Balok Susun", category: "Toys", categoryId: "Mainan", emoji: "🧱", location: "Box B" },
  // Tools / Peralatan
  { name: "Screwdriver", nameId: "Obeng", category: "Tools", categoryId: "Peralatan", emoji: "🪛", location: "Drawer C" },
  { name: "Battery", nameId: "Baterai", category: "Tools", categoryId: "Peralatan", emoji: "🔋", location: "Drawer C" },
  { name: "Tape Roll", nameId: "Gulungan Lakban", category: "Tools", categoryId: "Peralatan", emoji: "🧻", location: "Drawer C" },
  // Stationery / Alat Tulis
  { name: "Pen", nameId: "Pulpen", category: "Stationery", categoryId: "Alat Tulis", emoji: "🖊️", location: "Tray D" },
  { name: "Marker", nameId: "Spidol", category: "Stationery", categoryId: "Alat Tulis", emoji: "🖍️", location: "Tray D" },
  { name: "Eraser", nameId: "Penghapus", category: "Stationery", categoryId: "Alat Tulis", emoji: "🧽", location: "Tray D" },
]

export interface DetectedGroup {
  def: DetectableDef
  count: number
}

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

// Simulate a single-angle detection: pick a random subset of object types
// with random counts (this is where overlapping/occlusion errors would occur).
export function detectAngle(): DetectedGroup[] {
  const typeCount = randInt(2, 4)
  const shuffled = [...CATALOG].sort(() => Math.random() - 0.5)
  const picked = shuffled.slice(0, typeCount)
  return picked.map((def) => ({ def, count: randInt(1, 6) }))
}

// Merge multiple angles. For each object type, AI takes the MAX count seen
// across angles (overlapping items hidden in one angle appear in another),
// which prevents both miscounting and double-counting.
export function mergeAngles(angles: DetectedGroup[][]): DetectedGroup[] {
  const map = new Map<string, DetectedGroup>()
  for (const angle of angles) {
    for (const g of angle) {
      const existing = map.get(g.def.name)
      if (!existing) {
        map.set(g.def.name, { def: g.def, count: g.count })
      } else {
        existing.count = Math.max(existing.count, g.count)
      }
    }
  }
  return Array.from(map.values())
}

export function groupToItem(g: DetectedGroup): InventoryItem {
  const now = Date.now()
  return {
    id: `${g.def.name}-${now}-${Math.random().toString(36).slice(2, 7)}`,
    name: g.def.name,
    nameId: g.def.nameId,
    category: g.def.category,
    categoryId: g.def.categoryId,
    emoji: g.def.emoji,
    count: g.count,
    threshold: 3,
    location: g.def.location,
    description: "",
    createdAt: now,
    updatedAt: now,
  }
}

// Simulated voice transcription based on a short canned phrase set.
const PHRASES_EN = [
  "Restock these before the weekend.",
  "Top shelf, near the window.",
  "Customer favorite, sells fast.",
  "Check expiry date next month.",
  "Reserved for the display section.",
]
const PHRASES_ID = [
  "Isi ulang sebelum akhir pekan.",
  "Rak atas, dekat jendela.",
  "Favorit pelanggan, cepat habis.",
  "Cek tanggal kedaluwarsa bulan depan.",
  "Disisihkan untuk bagian pajangan.",
]

export function fakeTranscribe(lang: "id" | "en"): string {
  const arr = lang === "id" ? PHRASES_ID : PHRASES_EN
  return arr[Math.floor(Math.random() * arr.length)]
}
