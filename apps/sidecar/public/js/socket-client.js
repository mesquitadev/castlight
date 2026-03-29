function getFingerprint() {
  let fp = localStorage.getItem("castlight-fingerprint");
  if (!fp) {
    fp = "fp-" + Math.random().toString(36).slice(2) + Date.now().toString(36);
    localStorage.setItem("castlight-fingerprint", fp);
  }
  return fp;
}

function connectSocket(onRegistered) {
  const socket = io(window.location.origin, { path: "/ws", transports: ["websocket"] });

  socket.on("connect", () => {
    console.log("[castlight] connected");
    socket.emit("screen:register", {
      userAgent: navigator.userAgent,
      resolution: { width: screen.width, height: screen.height },
      fingerprint: getFingerprint(),
    });
  });

  socket.on("screen:registered", (info) => {
    console.log("[castlight] registered:", info);
    if (onRegistered) onRegistered(info);
  });

  socket.on("screen:role-assigned", (role) => {
    console.log("[castlight] role assigned:", role);
    const routes = { public: "/public", stage: "/stage", stream: "/stream", monitor: "/monitor", bible: "/bible", tech: "/tech" };
    if (routes[role] && window.location.pathname !== routes[role]) {
      window.location.href = routes[role];
    }
  });

  socket.on("screen:identify", () => {
    document.body.classList.add("identifying");
    setTimeout(() => document.body.classList.remove("identifying"), 1500);
  });

  return socket;
}
