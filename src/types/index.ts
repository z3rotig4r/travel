export interface Ref { label: string; url: string; type?: string }

export interface Block {
  time: string;
  title: string;
  note?: string;
  place?: string;
  refs?: Ref[];
}
export interface Day {
  day: number;
  date: string;
  dow: string;
  theme: string;
  blocks: Block[];
}

export interface Place {
  id: string;
  category: "attraction" | "food";
  name: string;
  area: string;
  desc?: string;
  access?: string;
  hours?: string;
  fee?: string;
  lat: number;
  lng: number;
  tag?: string;
  // food-only
  foodType?: string;
  menu?: string;
  tabelog?: string;
  google?: string;
  note?: string;
}

export interface Trip {
  title: string;
  subtitle: string;
  startDate: string;
  endDate: string;
  nights: number;
  days: number;
  people: string;
  flight: string;
  hotel: { name: string; zip: string; lat: number; lng: number };
  budgetTotalKRW: number;
  budgetPerPersonKRW: number;
  exchangeRate: string;
  airport: { name: string; lat: number; lng: number };
}

export interface Video {
  id: string;
  title: string;
  videoId: string;
  tags?: string[];
  desc?: string;
}

/* ---- 사용자 생성 데이터 (IndexedDB 영속) ---- */

// 영상 가이드: 특정 순간 북마크
export interface Bookmark {
  id: string;
  videoId: string;         // youtube id
  videoTitle: string;
  group?: string;          // 사용자 지정 그룹/카테고리 (예: 오타루, 맛집)
  place?: string;          // 연결된 장소/일정
  seconds: number;         // 타임스탬프 (초)
  label: string;           // 순간 제목
  memo: string;
  imageId?: string;        // IndexedDB image blob 참조
  createdAt: number;
}

/* ---- 편집 가능한 컬렉션 (시드에서 초기화 후 사용자가 수정) ---- */
export interface BudgetFixed { cat: string; item: string; krw: number; note?: string }
export interface BudgetCat { cat: string; jpy: number; krw: number }
export interface TourItem {
  name: string; price: number; time: string; pickup: string;
  photo: string; junpei?: string | null; rating?: string | null;
  pros: string; cons: string; url: string;
}
export interface Insurer { name: string; limit: string; fee: string; note: string; url: string }

// 쇼핑 리스트 항목
export interface ShoppingItem {
  id: string;
  name: string;            // 제품/상품명
  memo: string;
  sourceUrl?: string;      // 유튜브/릴스 등 출처
  sourceType?: "youtube" | "instagram" | "web" | "other";
  price?: string;
  bought: boolean;
  imageId?: string;
  createdAt: number;
}
