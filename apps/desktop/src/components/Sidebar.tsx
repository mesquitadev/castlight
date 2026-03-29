import { useSelector, useDispatch } from "react-redux";
import type { RootState } from "../store";
import { setActivePanel } from "../store/slices/ui";

const NAV_ITEMS = [
  { id: "dashboard" as const, label: "Dashboard", icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
  )},
  { id: "lyrics" as const, label: "Letras", icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>
  )},
  { id: "bible" as const, label: "Biblia", icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/><line x1="12" y1="6" x2="12" y2="13"/><line x1="9" y1="9.5" x2="15" y2="9.5"/></svg>
  )},
  { id: "media" as const, label: "Midia", icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="2"/><path d="m10 8 6 4-6 4V8z"/></svg>
  )},
  { id: "screens" as const, label: "Telas", icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
  )},
  { id: "settings" as const, label: "Config", icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
  )},
];

export function Sidebar() {
  const activePanel = useSelector((s: RootState) => s.ui.activePanel);
  const screenCount = useSelector((s: RootState) => s.screens.connected.length);
  const dispatch = useDispatch();

  return (
    <aside className="w-[220px] flex-shrink-0 flex flex-col" style={{ background: "var(--color-surface-100)", borderRight: "1px solid var(--color-surface-300)" }}>
      {/* Logo */}
      <div className="px-5 py-5 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg, var(--color-accent-dim), var(--color-accent))" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-surface-50)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
          </svg>
        </div>
        <div>
          <h1 className="text-sm font-bold tracking-tight" style={{ color: "#fff" }}>Castlight</h1>
          <span className="text-[10px] font-mono" style={{ color: "var(--color-surface-700)" }}>v0.1.0</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-2 space-y-0.5">
        <p className="px-3 pt-2 pb-1.5 text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--color-surface-600)" }}>
          Menu
        </p>
        {NAV_ITEMS.map((item, i) => {
          const isActive = activePanel === item.id;
          return (
            <button
              key={item.id}
              onClick={() => dispatch(setActivePanel(item.id))}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-150"
              style={{
                color: isActive ? "var(--color-accent)" : "var(--color-surface-800)",
                background: isActive ? "var(--color-accent-glow)" : "transparent",
                borderLeft: isActive ? "2px solid var(--color-accent)" : "2px solid transparent",
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.color = "#e2e2f0";
                  e.currentTarget.style.background = "var(--color-surface-300)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.color = "var(--color-surface-800)";
                  e.currentTarget.style.background = "transparent";
                }
              }}
            >
              <span style={{ opacity: isActive ? 1 : 0.6 }}>{item.icon}</span>
              <span>{item.label}</span>
              {item.id === "screens" && screenCount > 0 && (
                <span
                  className="ml-auto text-[10px] font-bold rounded-full px-1.5 py-0.5"
                  style={{ background: "var(--color-accent-glow)", color: "var(--color-accent)" }}
                >
                  {screenCount}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t" style={{ borderColor: "var(--color-surface-300)" }}>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: "var(--color-success)", boxShadow: "0 0 6px rgba(52, 211, 153, 0.4)" }} />
          <span className="text-[11px] font-mono" style={{ color: "var(--color-surface-700)" }}>Sidecar online</span>
        </div>
      </div>
    </aside>
  );
}
