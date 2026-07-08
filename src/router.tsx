import { createBrowserRouter } from "react-router-dom";
import { lazy, Suspense, type ReactNode } from "react";
import { Layout } from "./components/Layout";
import { Today } from "./pages/Today";
import { Dashboard } from "./pages/Dashboard";

// 무거운/부가 라우트는 지연 로딩 (모바일 초기 로딩 개선)
const Schedule = lazy(() => import("./pages/Schedule").then((m) => ({ default: m.Schedule })));
const PlaceGuide = lazy(() => import("./pages/PlaceGuide").then((m) => ({ default: m.PlaceGuide })));
const MapPage = lazy(() => import("./pages/MapPage").then((m) => ({ default: m.MapPage })));
const Shopping = lazy(() => import("./pages/Shopping").then((m) => ({ default: m.Shopping })));
const Expenses = lazy(() => import("./pages/Expenses").then((m) => ({ default: m.Expenses })));
const Extras = lazy(() => import("./pages/Extras").then((m) => ({ default: m.Extras })));
const Print = lazy(() => import("./pages/Print").then((m) => ({ default: m.Print })));

const Fallback = () => <div className="container" style={{ padding: 40, color: "var(--ink-faint)" }}>불러오는 중…</div>;
const L = (node: ReactNode) => <Suspense fallback={<Fallback />}>{node}</Suspense>;

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      { index: true, element: <Dashboard /> },
      { path: "today", element: <Today /> },
      { path: "schedule", element: L(<Schedule />) },
      { path: "guide", element: L(<PlaceGuide />) },
      { path: "map", element: L(<MapPage />) },
      { path: "shopping", element: L(<Shopping />) },
      { path: "expenses", element: L(<Expenses />) },
      { path: "extras", element: L(<Extras />) },
      { path: "print", element: L(<Print />) },
    ],
  },
]);
