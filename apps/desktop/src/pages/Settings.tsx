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
      <div>
        <h2 className="text-xl font-semibold" style={{ color: "var(--color-text-primary)", fontFamily: "var(--font-display)" }}>Configuracoes</h2>
        <p className="text-sm mt-0.5" style={{ color: "var(--color-text-muted)" }}>Personalize temas, projecao, biblias e integrações</p>
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
