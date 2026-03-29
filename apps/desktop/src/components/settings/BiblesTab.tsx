import { useState } from "react";
import { useGetAvailableBiblesQuery, useDownloadBibleMutation, useRemoveBibleMutation } from "../../store/api";

export function BiblesTab() {
  const { data: bibles = [], isLoading } = useGetAvailableBiblesQuery();
  const [downloadBible] = useDownloadBibleMutation();
  const [removeBible] = useRemoveBibleMutation();
  const [downloading, setDownloading] = useState<string | null>(null);

  const handleDownload = async (id: string) => {
    setDownloading(id);
    try {
      await downloadBible(id).unwrap();
    } catch {
      // error handled by RTK Query
    }
    setDownloading(null);
  };

  if (isLoading) return <p className="text-zinc-500">Carregando...</p>;

  const installed = bibles.filter((b) => b.installed);
  const available = bibles.filter((b) => !b.installed);

  return (
    <div className="space-y-6">
      {/* Installed */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-zinc-400 uppercase">Biblias instaladas ({installed.length})</h3>
        {installed.length === 0 && (
          <p className="text-zinc-500 text-sm">Nenhuma biblia instalada. Baixe uma versao abaixo.</p>
        )}
        {installed.map((bible) => (
          <div key={bible.id} className="bg-zinc-800 rounded-lg p-4 flex items-center justify-between">
            <div>
              <p className="text-white font-medium">{bible.name}</p>
              <p className="text-zinc-500 text-xs">{bible.id.toUpperCase()} — {bible.language.toUpperCase()}</p>
            </div>
            <button
              onClick={() => removeBible(bible.id)}
              className="px-3 py-1.5 bg-red-600/20 text-red-400 rounded-lg text-xs hover:bg-red-600/30"
            >
              Remover
            </button>
          </div>
        ))}
      </div>

      {/* Available for download */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-zinc-400 uppercase">Disponiveis para download ({available.length})</h3>
        {available.map((bible) => (
          <div key={bible.id} className="bg-zinc-800 rounded-lg p-4 flex items-center justify-between">
            <div>
              <p className="text-white font-medium">{bible.name}</p>
              <p className="text-zinc-500 text-xs">{bible.id.toUpperCase()} — {bible.language.toUpperCase()}</p>
            </div>
            <button
              onClick={() => handleDownload(bible.id)}
              disabled={downloading === bible.id}
              className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs hover:bg-blue-500 disabled:opacity-50"
            >
              {downloading === bible.id ? "Baixando..." : "Baixar"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
