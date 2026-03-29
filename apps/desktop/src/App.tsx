import { useSelector } from "react-redux";
import type { RootState } from "./store";
import { useSocket } from "./hooks/useSocket";
import { Sidebar } from "./components/Sidebar";
import { Dashboard } from "./pages/Dashboard";
import { Lyrics } from "./pages/Lyrics";
import { Bible } from "./pages/Bible";
import { Media } from "./pages/Media";
import { Screens } from "./pages/Screens";
import { Settings } from "./pages/Settings";

const PAGES = {
  dashboard: Dashboard,
  lyrics: Lyrics,
  bible: Bible,
  media: Media,
  screens: Screens,
  settings: Settings,
} as const;

export function App() {
  useSocket();
  const activePanel = useSelector((s: RootState) => s.ui.activePanel);
  const Page = PAGES[activePanel as keyof typeof PAGES] ?? Dashboard;

  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex-1 overflow-hidden relative">
        <div className="absolute inset-0 overflow-y-auto">
          <Page />
        </div>
      </main>
    </div>
  );
}
