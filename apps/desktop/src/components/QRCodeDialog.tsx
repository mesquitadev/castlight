import { useSelector, useDispatch } from "react-redux";
import type { RootState } from "../store";
import { toggleQRDialog } from "../store/slices/ui";
import { QRCodeSVG } from "qrcode.react";
import { SIDECAR_PORT } from "@castlight/shared";

export function QRCodeDialog() {
  const open = useSelector((s: RootState) => s.ui.qrDialogOpen);
  const dispatch = useDispatch();

  if (!open) return null;

  const url = `http://localhost:${SIDECAR_PORT}`;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50" style={{ background: "rgba(0,0,0,0.7)" }}>
      <div className="card p-8 text-center space-y-4" style={{ minWidth: 320 }}>
        <h3 className="text-lg font-semibold" style={{ color: "var(--color-text-primary)", fontFamily: "var(--font-display)" }}>Conectar tela</h3>
        <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>Escaneie o QR Code com o dispositivo</p>
        <div className="bg-white p-4 rounded-xl inline-block">
          <QRCodeSVG value={url} size={200} />
        </div>
        <p className="text-xs" style={{ color: "var(--color-text-muted)", fontFamily: "var(--font-mono)" }}>{url}</p>
        <button
          onClick={() => dispatch(toggleQRDialog())}
          className="btn btn-secondary"
        >
          Fechar
        </button>
      </div>
    </div>
  );
}
