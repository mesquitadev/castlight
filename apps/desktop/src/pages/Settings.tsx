import { useState } from "react";
import { OBSTab } from "../components/settings/OBSTab";
import { StreamTab } from "../components/settings/StreamTab";
import { BiblesTab } from "../components/settings/BiblesTab";
import { ProjectionTab } from "../components/settings/ProjectionTab";
import { ThemesTab } from "../components/settings/ThemesTab";

const TABS = [
  { id: "themes", label: "Temas" },
  { id: "projection", label: "Projecao" },
  { id: "bibles", label: "Biblias" },
  { id: "obs", label: "OBS" },
  { id: "stream", label: "Stream" },
] as const;

type TabId = (typeof TABS)[number]["id"];
const TAB_COMPONENTS: Record<TabId, React.FC> = {
  themes: ThemesTab,
  projection: ProjectionTab,
  bibles: BiblesTab,
  obs: OBSTab,
  stream: StreamTab,
};

export function Settings() {
  const [activeTab, setActiveTab] = useState<TabId>("themes");
  const TabContent = TAB_COMPONENTS[activeTab];
  return (
    <div className="p-6 space-y-4">
      <h2 className="text-xl font-semibold text-white">Configuracoes</h2>
      <div className="flex gap-1 border-b border-zinc-800">
        {TABS.map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`px-4 py-2 text-sm font-medium transition-colors ${activeTab === tab.id ? "text-white border-b-2 border-blue-500" : "text-zinc-400 hover:text-white"}`}>{tab.label}</button>
        ))}
      </div>
      <TabContent />
    </div>
  );
}
