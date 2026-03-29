import { useSelector } from "react-redux";
import type { RootState } from "./store";
import { useSocket } from "./hooks/useSocket";
import { Sidebar } from "./components/Sidebar";
import { Dashboard } from "./pages/Dashboard";
import { Lyrics } from "./pages/Lyrics";
import { Bible } from "./pages/Bible";
import { Screens } from "./pages/Screens";
import { Media } from "./pages/Media";
import { Settings } from "./pages/Settings";

const PAGES = {
  dashboard: Dashboard,
  lyrics: Lyrics,
  bible: Bible,
  screens: Screens,
  media: Media,
  settings: Settings,
} as const;

export function App() {
  useSocket();
  const activePanel = useSelector((s: RootState) => s.ui.activePanel);
  const Page = PAGES[activePanel];

  return (
    <div className="flex h-screen bg-zinc-950 text-white">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <Page />
      </main>
    </div>
  );
}
