import { useState } from "react";
import { SlidesTab } from "../components/media/SlidesTab";
import { ImagesTab } from "../components/media/ImagesTab";
import { VideosTab } from "../components/media/VideosTab";
import { NoticesTab } from "../components/media/NoticesTab";
import { BackgroundsTab } from "../components/media/BackgroundsTab";

const TABS = [
  { id: "slides", label: "Slides" },
  { id: "images", label: "Imagens" },
  { id: "videos", label: "Videos" },
  { id: "notices", label: "Avisos" },
  { id: "backgrounds", label: "Backgrounds" },
] as const;

type TabId = (typeof TABS)[number]["id"];

const TAB_COMPONENTS: Record<TabId, React.FC> = {
  slides: SlidesTab,
  images: ImagesTab,
  videos: VideosTab,
  notices: NoticesTab,
  backgrounds: BackgroundsTab,
};

export function Media() {
  const [activeTab, setActiveTab] = useState<TabId>("slides");
  const TabContent = TAB_COMPONENTS[activeTab];

  return (
    <div className="p-6 space-y-4">
      <div>
        <h2 className="text-xl font-semibold" style={{ color: "var(--color-text-primary)", fontFamily: "var(--font-display)" }}>Midia</h2>
        <p className="text-sm mt-0.5" style={{ color: "var(--color-text-muted)" }}>Gerencie slides, imagens, videos e avisos</p>
      </div>
      <div className="flex gap-1" style={{ borderBottom: "1px solid var(--color-surface-300)" }}>
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="px-4 py-2 text-sm font-medium transition-colors"
            style={
              activeTab === tab.id
                ? { color: "var(--color-text-primary)", borderBottom: "2px solid var(--color-accent)" }
                : { color: "var(--color-text-muted)" }
            }
          >
            {tab.label}
          </button>
        ))}
      </div>
      <TabContent />
    </div>
  );
}
