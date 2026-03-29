var socket = connectSocket();
var API = window.location.origin + "/api";

function loadServerInfo() {
  fetch(API + "/health").then(function(r) { return r.json(); }).then(function(health) {
    document.getElementById("server-info").innerHTML = '<p>IP: <span class="text-blue-400">' + health.ip + '</span></p><p>Porta: <span class="text-blue-400">3100</span></p><p>Status: <span class="text-green-400">Online</span></p>';
  });
}

socket.on("screens:updated", function(screens) {
  var roles = { public: "Publico", stage: "Retorno", stream: "Stream", monitor: "Monitor", bible: "Biblia", tech: "Tecnica" };
  document.getElementById("screens-list").innerHTML = screens.length === 0
    ? '<p class="text-zinc-500">Nenhuma tela conectada</p>'
    : screens.map(function(s) {
      return '<div class="flex items-center justify-between bg-zinc-700 rounded-lg px-3 py-2"><span class="text-white text-sm">' + (s.name || s.userAgent.slice(0, 30)) + '</span><span class="text-zinc-400 text-xs">' + s.resolution.width + 'x' + s.resolution.height + '</span><span class="text-blue-400 text-xs">' + (roles[s.role] || "Sem papel") + '</span></div>';
    }).join("");
});

socket.on("obs:status", function(status) {
  document.getElementById("obs-info").innerHTML = status.connected
    ? '<span class="text-green-400">Conectado</span> — Cena: ' + (status.currentScene || "—") + (status.recording ? ' — <span class="text-red-400">Gravando</span>' : '')
    : '<span class="text-red-400">Desconectado</span>';
});

loadServerInfo();
