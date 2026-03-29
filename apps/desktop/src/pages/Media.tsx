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
    <div className="p-6 space-y-5">
      <div className="page-header" style={{ marginBottom: 0 }}>
        <h2 className="page-title">Midia</h2>
        <p className="page-subtitle">Gerencie slides, imagens, videos e avisos</p>
      </div>
      <div className="tab-bar">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`tab-item ${activeTab === tab.id ? "tab-item-active" : ""}`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <TabContent />
    </div>
  );
}
