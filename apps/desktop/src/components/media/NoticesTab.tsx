import { useState } from "react";
import { useDispatch } from "react-redux";
import { useGetSavedNoticesQuery, useCreateNoticeMutation, useDeleteNoticeMutation } from "../../store/api";
import { presentNotice } from "../../store/slices/presentation";
import { SIDECAR_PORT, ScreenRole } from "@castlight/shared";

export function NoticesTab() {
  const dispatch = useDispatch();
  const { data: savedNotices = [] } = useGetSavedNoticesQuery();
  const [createNotice] = useCreateNoticeMutation();
  const [deleteNotice] = useDeleteNoticeMutation();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  const broadcast = (t: string, b: string) => {
    dispatch(presentNotice({ id: "", title: t, body: b, saved: false, createdAt: "" }));
    fetch(`http://localhost:${SIDECAR_PORT}/api/screens/broadcast`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event: "content:notice",
        roles: [ScreenRole.Public, ScreenRole.Stage, ScreenRole.Stream, ScreenRole.Monitor],
        data: { title: t, body: b },
      }),
    });
  };

  const handleSend = () => {
    if (!title.trim()) return;
    broadcast(title, body);
    setTitle(""); setBody("");
  };

  const handleSaveAndSend = async () => {
    if (!title.trim()) return;
    await createNotice({ title, body, save: true });
    broadcast(title, body);
    setTitle(""); setBody("");
  };

  return (
    <div className="space-y-6">
      <div className="card p-4 space-y-3">
        <input type="text" placeholder="Titulo do aviso" value={title} onChange={(e) => setTitle(e.target.value)} className="input-field w-full" />
        <textarea placeholder="Corpo do aviso" value={body} onChange={(e) => setBody(e.target.value)} rows={3} className="input-field w-full resize-none" />
        <div className="flex gap-2">
          <button onClick={handleSend} className="btn btn-primary">Enviar</button>
          <button onClick={handleSaveAndSend} className="btn btn-secondary">Salvar e Enviar</button>
        </div>
      </div>
      {savedNotices.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium uppercase" style={{ color: "var(--color-text-secondary)" }}>Avisos salvos</h3>
          {savedNotices.map((notice) => (
            <div key={notice.id} className="card p-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>{notice.title}</p>
                <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>{notice.body}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => broadcast(notice.title, notice.body)} className="text-xs hover:underline" style={{ color: "var(--color-accent)" }}>Enviar</button>
                <button onClick={() => deleteNotice(notice.id)} className="text-xs hover:underline" style={{ color: "var(--color-danger)" }}>Excluir</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
