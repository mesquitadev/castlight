import { BibleNavigator } from "../components/BibleNavigator";

export function Bible() {
  return (
    <div className="p-6 space-y-4">
      <div>
        <h2 className="text-xl font-semibold" style={{ color: "var(--color-text-primary)", fontFamily: "var(--font-display)" }}>Biblia</h2>
        <p className="text-sm mt-0.5" style={{ color: "var(--color-text-muted)" }}>Navegue e apresente versiculos biblicos</p>
      </div>
      <BibleNavigator />
    </div>
  );
}
