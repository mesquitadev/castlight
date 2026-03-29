import { useSelector, useDispatch } from "react-redux";
import type { RootState } from "../store";
import { setActivePanel } from "../store/slices/ui";

const NAV_ITEMS = [
  { id: "dashboard" as const, label: "Dashboard", icon: "🏠" },
  { id: "lyrics" as const, label: "Letras", icon: "🎵" },
  { id: "bible" as const, label: "Biblia", icon: "📖" },
  { id: "screens" as const, label: "Telas", icon: "🖥️" },
  { id: "media" as const, label: "Midia", icon: "🎬" },
];

export function Sidebar() {
  const activePanel = useSelector((s: RootState) => s.ui.activePanel);
  const screenCount = useSelector((s: RootState) => s.screens.connected.length);
  const dispatch = useDispatch();

  return (
    <aside className="w-56 bg-zinc-900 border-r border-zinc-800 flex flex-col">
      <div className="p-4 border-b border-zinc-800">
        <h1 className="text-lg font-bold text-white">Castlight</h1>
      </div>
      <nav className="flex-1 p-2 space-y-1">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            onClick={() => dispatch(setActivePanel(item.id))}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
              activePanel === item.id
                ? "bg-zinc-700 text-white"
                : "text-zinc-400 hover:text-white hover:bg-zinc-800"
            }`}
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
            {item.id === "screens" && screenCount > 0 && (
              <span className="ml-auto text-xs bg-blue-600 text-white px-1.5 py-0.5 rounded-full">
                {screenCount}
              </span>
            )}
          </button>
        ))}
      </nav>
    </aside>
  );
}
