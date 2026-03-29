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
      <h2 className="text-xl font-semibold text-white">Midia</h2>
      <div className="flex gap-1 border-b border-zinc-800">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? "text-white border-b-2 border-blue-500"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <TabContent />
    </div>
  );
}
