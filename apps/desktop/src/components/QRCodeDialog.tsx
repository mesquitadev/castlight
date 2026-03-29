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
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-zinc-800 rounded-2xl p-8 text-center space-y-4">
        <h3 className="text-lg font-semibold text-white">Conectar tela</h3>
        <p className="text-zinc-400 text-sm">Escaneie o QR Code com o dispositivo</p>
        <div className="bg-white p-4 rounded-xl inline-block">
          <QRCodeSVG value={url} size={200} />
        </div>
        <p className="text-zinc-500 text-xs font-mono">{url}</p>
        <button
          onClick={() => dispatch(toggleQRDialog())}
          className="px-4 py-2 bg-zinc-700 text-white rounded-lg text-sm hover:bg-zinc-600"
        >
          Fechar
        </button>
      </div>
    </div>
  );
}
