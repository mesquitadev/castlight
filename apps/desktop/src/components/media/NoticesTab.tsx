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
      <div className="bg-zinc-800 rounded-lg p-4 space-y-3">
        <input type="text" placeholder="Titulo do aviso" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full bg-zinc-700 border border-zinc-600 rounded-lg px-4 py-2 text-white placeholder-zinc-500" />
        <textarea placeholder="Corpo do aviso" value={body} onChange={(e) => setBody(e.target.value)} rows={3} className="w-full bg-zinc-700 border border-zinc-600 rounded-lg px-4 py-2 text-white placeholder-zinc-500 resize-none" />
        <div className="flex gap-2">
          <button onClick={handleSend} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-500">Enviar</button>
          <button onClick={handleSaveAndSend} className="px-4 py-2 bg-zinc-700 text-white rounded-lg text-sm hover:bg-zinc-600">Salvar e Enviar</button>
        </div>
      </div>
      {savedNotices.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-zinc-400 uppercase">Avisos salvos</h3>
          {savedNotices.map((notice) => (
            <div key={notice.id} className="bg-zinc-800 rounded-lg p-3 flex items-center justify-between">
              <div>
                <p className="text-white text-sm font-medium">{notice.title}</p>
                <p className="text-zinc-400 text-xs">{notice.body}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => broadcast(notice.title, notice.body)} className="text-xs text-blue-400 hover:underline">Enviar</button>
                <button onClick={() => deleteNotice(notice.id)} className="text-xs text-red-400 hover:underline">Excluir</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
