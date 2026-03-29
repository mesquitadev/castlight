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
    <div
      className="fixed inset-0 flex items-center justify-center z-50"
      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)" }}
    >
      <div className="card p-10 text-center space-y-5" style={{ minWidth: 360 }}>
        <div>
          <h3 className="text-xl font-bold" style={{ color: "var(--color-text-primary)", fontFamily: "var(--font-display)" }}>Conectar tela</h3>
          <p className="text-sm mt-1" style={{ color: "var(--color-text-secondary)" }}>Escaneie o QR Code com o dispositivo</p>
        </div>
        <div className="bg-white p-5 rounded-2xl inline-block" style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.3)" }}>
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
