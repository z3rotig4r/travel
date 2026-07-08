import { createBrowserRouter } from "react-router-dom";
import { Layout } from "./components/Layout";
import { Dashboard } from "./pages/Dashboard";
import { Schedule } from "./pages/Schedule";
import { PlaceGuide } from "./pages/PlaceGuide";
import { MapPage } from "./pages/MapPage";
import { Shopping } from "./pages/Shopping";
import { Extras } from "./pages/Extras";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      { index: true, element: <Dashboard /> },
      { path: "schedule", element: <Schedule /> },
      { path: "guide", element: <PlaceGuide /> },
      { path: "map", element: <MapPage /> },
      { path: "shopping", element: <Shopping /> },
      { path: "extras", element: <Extras /> },
    ],
  },
]);
