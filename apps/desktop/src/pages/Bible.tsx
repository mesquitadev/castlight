import { BibleNavigator } from "../components/BibleNavigator";

export function Bible() {
  return (
    <div className="p-6 space-y-4">
      <h2 className="text-xl font-semibold text-white">Biblia</h2>
      <BibleNavigator />
    </div>
  );
}
