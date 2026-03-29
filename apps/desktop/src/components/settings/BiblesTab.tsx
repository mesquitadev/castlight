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

  if (isLoading) return <p style={{ color: "var(--color-text-muted)" }}>Carregando...</p>;

  const installed = bibles.filter((b) => b.installed);
  const available = bibles.filter((b) => !b.installed);

  return (
    <div className="space-y-6">
      {/* Installed */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium uppercase" style={{ color: "var(--color-text-secondary)" }}>Biblias instaladas ({installed.length})</h3>
        {installed.length === 0 && (
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>Nenhuma biblia instalada. Baixe uma versao abaixo.</p>
        )}
        {installed.map((bible: any) => (
          <div key={bible.id} className="card p-4 flex items-center justify-between">
            <div>
              <p className="font-medium" style={{ color: "var(--color-text-primary)" }}>{bible.name}</p>
              <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>{bible.id.toUpperCase()} — {bible.copyright}</p>
            </div>
            <button
              onClick={() => removeBible(bible.id)}
              className="btn btn-danger text-xs"
            >
              Remover
            </button>
          </div>
        ))}
      </div>

      {/* Available for download */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium uppercase" style={{ color: "var(--color-text-secondary)" }}>Disponiveis para download ({available.length})</h3>
        {available.map((bible: any) => (
          <div key={bible.id} className="card p-4 flex items-center justify-between">
            <div>
              <p className="font-medium" style={{ color: "var(--color-text-primary)" }}>{bible.name}</p>
              <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>{bible.id.toUpperCase()} — {bible.copyright}</p>
            </div>
            <button
              onClick={() => handleDownload(bible.id)}
              disabled={downloading === bible.id}
              className="btn btn-primary text-xs disabled:opacity-50"
            >
              {downloading === bible.id ? "Baixando..." : "Baixar"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
