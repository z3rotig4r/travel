import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Bookmark, ShoppingItem, Day, Block, BudgetFixed, BudgetCat, TourItem, Insurer, ExpenseEntry, Place, Trip } from "../types";
import { deleteImage } from "../lib/db";
import * as seed from "../data";

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v));

interface Tours { biei_furano: { date: string; title: string; items: TourItem[] }; shakotan_otaru: { date: string; title: string; items: TourItem[] } }

interface State {
  // 사용자 생성
  bookmarks: Bookmark[];
  shopping: ShoppingItem[];
  expenses: ExpenseEntry[];
  checked: Record<string, boolean>;
  theme: "light" | "dark";

  // 실시간 공유(Supabase)
  roomId: string | null;
  syncName: string;
  syncStatus: "off" | "online" | "offline" | "syncing" | "error";
  lastSyncedAt: number;
  lastSyncedBy: string;

  // 편집 가능한 시드 컬렉션 (첫 실행 시 seed에서 채움)
  seededVersion: number;
  trip: Trip;
  itinerary: Day[];
  packing: Record<string, string[]>;
  budgetFixed: BudgetFixed[];
  budgetCats: BudgetCat[];
  tours: Tours;
  insurers: Insurer[];
  places: Place[];

  // --- bookmarks ---
  addBookmark: (b: Omit<Bookmark, "id" | "createdAt">) => void;
  updateBookmark: (id: string, patch: Partial<Bookmark>) => void;
  removeBookmark: (id: string) => void;

  // --- shopping ---
  addShopping: (s: Omit<ShoppingItem, "id" | "createdAt" | "bought">) => void;
  updateShopping: (id: string, patch: Partial<ShoppingItem>) => void;
  removeShopping: (id: string) => void;
  toggleBought: (id: string) => void;

  // --- expenses ---
  addExpense: (e: Omit<ExpenseEntry, "id" | "createdAt">) => void;
  updateExpense: (id: string, patch: Partial<ExpenseEntry>) => void;
  removeExpense: (id: string) => void;

  // --- places (시드 마커 + 사용자 등록) ---
  addPlace: (p: Omit<Place, "id">) => string;
  updatePlace: (id: string, patch: Partial<Place>) => void;
  removePlace: (id: string) => void;

  // --- trip meta ---
  updateTrip: (patch: Partial<Trip>) => void;

  // --- packing ---
  toggleCheck: (key: string) => void;
  addPackingItem: (cat: string, item: string) => void;
  removePackingItem: (cat: string, item: string) => void;
  addPackingCategory: (cat: string) => void;
  removePackingCategory: (cat: string) => void;

  // --- itinerary ---
  addBlock: (dayIdx: number, block: Block) => void;
  updateBlock: (dayIdx: number, blockIdx: number, patch: Partial<Block>) => void;
  removeBlock: (dayIdx: number, blockIdx: number) => void;
  addDay: () => void;
  updateDayMeta: (dayIdx: number, patch: Partial<Pick<Day, "date" | "dow" | "theme">>) => void;
  removeDay: (dayIdx: number) => void;

  // --- budget ---
  addBudgetFixed: (row: BudgetFixed) => void;
  updateBudgetFixed: (i: number, patch: Partial<BudgetFixed>) => void;
  removeBudgetFixed: (i: number) => void;

  // --- tours ---
  addTour: (group: keyof Tours, t: TourItem) => void;
  updateTour: (group: keyof Tours, i: number, patch: Partial<TourItem>) => void;
  removeTour: (group: keyof Tours, i: number) => void;

  // --- insurers ---
  addInsurer: (x: Insurer) => void;
  updateInsurer: (i: number, patch: Partial<Insurer>) => void;
  removeInsurer: (i: number) => void;

  // --- sync ---
  setRoom: (id: string | null) => void;
  setSyncName: (name: string) => void;
  setSyncStatus: (s: State["syncStatus"], at?: number, by?: string) => void;

  // --- misc ---
  setTheme: (t: "light" | "dark") => void;
  importState: (data: any) => void;
  resetSeed: () => void;
}

const SEED_VERSION = 2;
const seededDefaults = () => ({
  seededVersion: SEED_VERSION,
  trip: clone(seed.trip) as Trip,
  itinerary: clone(seed.itinerary),
  packing: clone(seed.packing),
  budgetFixed: clone(seed.budget.fixed) as BudgetFixed[],
  budgetCats: clone(seed.budget.categorySummary) as BudgetCat[],
  tours: clone(seed.tours) as Tours,
  insurers: clone(seed.insurance.companies) as Insurer[],
  places: clone(seed.allPlaces) as Place[],
});

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      bookmarks: [],
      shopping: [],
      expenses: [],
      checked: {},
      theme: "light",
      roomId: null,
      syncName: "",
      syncStatus: "off",
      lastSyncedAt: 0,
      lastSyncedBy: "",
      ...seededDefaults(),

      addBookmark: (b) =>
        set((s) => ({ bookmarks: [{ ...b, id: uid(), createdAt: Date.now() }, ...s.bookmarks] })),
      updateBookmark: (id, patch) =>
        set((s) => ({ bookmarks: s.bookmarks.map((x) => (x.id === id ? { ...x, ...patch } : x)) })),
      removeBookmark: (id) => {
        const b = get().bookmarks.find((x) => x.id === id);
        if (b?.imageId) deleteImage(b.imageId);
        set((s) => ({ bookmarks: s.bookmarks.filter((x) => x.id !== id) }));
      },

      addShopping: (item) =>
        set((s) => ({ shopping: [{ ...item, id: uid(), createdAt: Date.now(), bought: false }, ...s.shopping] })),
      updateShopping: (id, patch) =>
        set((s) => ({ shopping: s.shopping.map((x) => (x.id === id ? { ...x, ...patch } : x)) })),
      removeShopping: (id) => {
        const it = get().shopping.find((x) => x.id === id);
        if (it?.imageId) deleteImage(it.imageId);
        set((s) => ({ shopping: s.shopping.filter((x) => x.id !== id) }));
      },
      toggleBought: (id) =>
        set((s) => ({ shopping: s.shopping.map((x) => (x.id === id ? { ...x, bought: !x.bought } : x)) })),

      addExpense: (e) =>
        set((s) => ({ expenses: [{ ...e, id: uid(), createdAt: Date.now() }, ...s.expenses] })),
      updateExpense: (id, patch) =>
        set((s) => ({ expenses: s.expenses.map((x) => (x.id === id ? { ...x, ...patch } : x)) })),
      removeExpense: (id) =>
        set((s) => ({ expenses: s.expenses.filter((x) => x.id !== id) })),

      addPlace: (p) => {
        const id = "usr-" + uid();
        set((s) => ({ places: [...s.places, { ...p, id, custom: true }] }));
        return id;
      },
      updatePlace: (id, patch) =>
        set((s) => ({ places: s.places.map((x) => (x.id === id ? { ...x, ...patch } : x)) })),
      removePlace: (id) =>
        set((s) => ({ places: s.places.filter((x) => x.id !== id) })),

      updateTrip: (patch) => set((s) => ({ trip: { ...s.trip, ...patch } })),

      toggleCheck: (key) => set((s) => ({ checked: { ...s.checked, [key]: !s.checked[key] } })),
      addPackingItem: (cat, item) =>
        set((s) => ({ packing: { ...s.packing, [cat]: [...(s.packing[cat] || []), item] } })),
      removePackingItem: (cat, item) =>
        set((s) => ({ packing: { ...s.packing, [cat]: (s.packing[cat] || []).filter((x) => x !== item) } })),
      addPackingCategory: (cat) =>
        set((s) => (s.packing[cat] ? {} : { packing: { ...s.packing, [cat]: [] } })),
      removePackingCategory: (cat) =>
        set((s) => { const p = { ...s.packing }; delete p[cat]; return { packing: p }; }),

      addBlock: (dayIdx, block) =>
        set((s) => { const it = clone(s.itinerary); it[dayIdx].blocks.push(block); return { itinerary: it }; }),
      updateBlock: (dayIdx, blockIdx, patch) =>
        set((s) => { const it = clone(s.itinerary); it[dayIdx].blocks[blockIdx] = { ...it[dayIdx].blocks[blockIdx], ...patch }; return { itinerary: it }; }),
      removeBlock: (dayIdx, blockIdx) =>
        set((s) => { const it = clone(s.itinerary); it[dayIdx].blocks.splice(blockIdx, 1); return { itinerary: it }; }),
      addDay: () =>
        set((s) => {
          const it = clone(s.itinerary);
          const n = it.length + 1;
          it.push({ day: n, date: `${n}일차`, dow: "", theme: "새 일정", blocks: [] });
          return { itinerary: it };
        }),
      updateDayMeta: (dayIdx, patch) =>
        set((s) => { const it = clone(s.itinerary); it[dayIdx] = { ...it[dayIdx], ...patch }; return { itinerary: it }; }),
      removeDay: (dayIdx) =>
        set((s) => {
          const it = clone(s.itinerary); it.splice(dayIdx, 1);
          it.forEach((d, i) => (d.day = i + 1));
          return { itinerary: it };
        }),

      addBudgetFixed: (row) => set((s) => ({ budgetFixed: [...s.budgetFixed, row] })),
      updateBudgetFixed: (i, patch) =>
        set((s) => ({ budgetFixed: s.budgetFixed.map((r, j) => (j === i ? { ...r, ...patch } : r)) })),
      removeBudgetFixed: (i) => set((s) => ({ budgetFixed: s.budgetFixed.filter((_, j) => j !== i) })),

      addTour: (group, t) =>
        set((s) => { const tr = clone(s.tours); tr[group].items.push(t); return { tours: tr }; }),
      updateTour: (group, i, patch) =>
        set((s) => { const tr = clone(s.tours); tr[group].items[i] = { ...tr[group].items[i], ...patch }; return { tours: tr }; }),
      removeTour: (group, i) =>
        set((s) => { const tr = clone(s.tours); tr[group].items.splice(i, 1); return { tours: tr }; }),

      addInsurer: (x) => set((s) => ({ insurers: [...s.insurers, x] })),
      updateInsurer: (i, patch) =>
        set((s) => ({ insurers: s.insurers.map((r, j) => (j === i ? { ...r, ...patch } : r)) })),
      removeInsurer: (i) => set((s) => ({ insurers: s.insurers.filter((_, j) => j !== i) })),

      setRoom: (id) => set({ roomId: id }),
      setSyncName: (name) => set({ syncName: name }),
      setSyncStatus: (s, at, by) => set((st) => ({ syncStatus: s, lastSyncedAt: at ?? st.lastSyncedAt, lastSyncedBy: by ?? st.lastSyncedBy })),

      setTheme: (t) => set({ theme: t }),
      importState: (data) =>
        set((s) => !data || typeof data !== "object" ? {} : ({
          bookmarks: data.bookmarks ?? s.bookmarks,
          shopping: data.shopping ?? s.shopping,
          expenses: data.expenses ?? s.expenses,
          checked: data.checked ?? s.checked,
          trip: data.trip ?? s.trip,
          places: data.places ?? s.places,
          itinerary: data.itinerary ?? s.itinerary,
          packing: data.packing ?? s.packing,
          budgetFixed: data.budgetFixed ?? s.budgetFixed,
          budgetCats: data.budgetCats ?? s.budgetCats,
          tours: data.tours ?? s.tours,
          insurers: data.insurers ?? s.insurers,
        })),
      resetSeed: () => set({ ...seededDefaults() }),
    }),
    {
      name: "sapporo-travel-store",
      version: SEED_VERSION,
      migrate: (persisted: any, _v) => {
        // 이전 버전(시드 컬렉션 없음) 호환: 누락 필드 채우기
        if (persisted && persisted.seededVersion !== SEED_VERSION) {
          const d = seededDefaults();
          return { ...d, ...persisted, seededVersion: SEED_VERSION,
            trip: persisted.trip ?? d.trip,
            itinerary: persisted.itinerary ?? d.itinerary,
            packing: persisted.packing ?? d.packing,
            budgetFixed: persisted.budgetFixed ?? d.budgetFixed,
            budgetCats: persisted.budgetCats ?? d.budgetCats,
            tours: persisted.tours ?? d.tours,
            insurers: persisted.insurers ?? d.insurers,
            places: persisted.places ?? d.places };
        }
        return persisted;
      },
    }
  )
);
