import { useState } from "react";
import { OBSTab } from "../components/settings/OBSTab";
import { StreamTab } from "../components/settings/StreamTab";
import { BiblesTab } from "../components/settings/BiblesTab";
import { ProjectionTab } from "../components/settings/ProjectionTab";
import { ThemesTab } from "../components/settings/ThemesTab";
import { SlidesTab } from "../components/media/SlidesTab";
import { ImagesTab } from "../components/media/ImagesTab";
import { VideosTab } from "../components/media/VideosTab";
import { NoticesTab } from "../components/media/NoticesTab";
import { BackgroundsTab } from "../components/media/BackgroundsTab";

const SECTIONS = [
  {
    label: "Conteudo",
    tabs: [
      { id: "themes", label: "Temas" },
      { id: "backgrounds", label: "Backgrounds" },
      { id: "slides", label: "Slides" },
      { id: "images", label: "Imagens" },
      { id: "videos", label: "Videos" },
      { id: "notices", label: "Avisos" },
    ],
  },
  {
    label: "Sistema",
    tabs: [
      { id: "bibles", label: "Biblias" },
      { id: "projection", label: "Projecao" },
      { id: "obs", label: "OBS" },
      { id: "stream", label: "Stream" },
    ],
  },
] as const;

type TabId = (typeof SECTIONS)[number]["tabs"][number]["id"];

const TAB_COMPONENTS: Record<TabId, React.FC> = {
  themes: ThemesTab,
  backgrounds: BackgroundsTab,
  slides: SlidesTab,
  images: ImagesTab,
  videos: VideosTab,
  notices: NoticesTab,
  bibles: BiblesTab,
  projection: ProjectionTab,
  obs: OBSTab,
  stream: StreamTab,
};

export function Settings() {
  const [activeTab, setActiveTab] = useState<TabId>("themes");
  const TabContent = TAB_COMPONENTS[activeTab];

  return (
    <div className="flex h-full">
      {/* Left sidebar with grouped tabs */}
      <div className="w-48 flex-shrink-0 overflow-y-auto py-6 px-3 space-y-5" style={{ borderRight: "1px solid var(--color-surface-300)" }}>
        {SECTIONS.map((section) => (
          <div key={section.label}>
            <p className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--color-surface-600)" }}>
              {section.label}
            </p>
            <div className="space-y-0.5">
              {section.tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className="w-full text-left px-3 py-1.5 rounded-lg text-[13px] font-medium transition-all"
                    style={{
                      color: isActive ? "var(--color-accent)" : "var(--color-surface-800)",
                      background: isActive ? "var(--color-accent-glow)" : "transparent",
                    }}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <TabContent />
      </div>
    </div>
  );
}
