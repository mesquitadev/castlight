# Castlight Phase 3.5 — Client Screens Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build all client screen pages (public, stage, stream, monitor, bible, tech) as static HTML/JS served by the sidecar, with real-time WebSocket content rendering.

**Architecture:** Plain HTML + vanilla JS + Socket.IO client CDN + Tailwind CDN. The sidecar serves static files from `apps/sidecar/public/`. Each screen connects via WebSocket, registers with fingerprint, and renders content based on events.

**Tech Stack:** HTML5, Vanilla JS (ES modules), Socket.IO client 4.x (CDN), Tailwind CSS (CDN)

---

## File Structure

```
apps/sidecar/public/
├── index.html              # Welcome / registration page
├── public.html             # Public screen
├── stage.html              # Stage return screen
├── stream.html             # Stream/OBS screen
├── monitor.html            # Pastor monitor screen
├── bible.html              # Bible control (tablet)
├── tech.html               # Technical dashboard
├── css/
│   └── screen.css          # Shared styles (fullscreen, transitions, identify flash)
└── js/
    ├── socket-client.js    # WebSocket connection, fingerprint, registration
    ├── renderer.js         # Content rendering (lyrics, bible, slide, image, video, notice, background)
    ├── public.js           # Public screen logic
    ├── stage.js            # Stage screen logic
    ├── stream.js           # Stream screen logic (with lower third + audio)
    ├── monitor.js          # Monitor screen logic
    ├── bible.js            # Bible control logic (tablet UI + send)
    └── tech.js             # Tech dashboard logic
```

---

### Task 1: Shared CSS + Socket Client + Renderer

**Files:**
- Create: `apps/sidecar/public/css/screen.css`
- Create: `apps/sidecar/public/js/socket-client.js`
- Create: `apps/sidecar/public/js/renderer.js`

- [ ] **Step 1: Create shared CSS**

```css
/* apps/sidecar/public/css/screen.css */
* { margin: 0; padding: 0; box-sizing: border-box; }

html, body {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background: #000;
  color: #fff;
  font-family: system-ui, -apple-system, sans-serif;
}

.screen-container {
  width: 100vw;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.background-layer {
  position: absolute;
  inset: 0;
  z-index: 0;
  background-size: cover;
  background-position: center;
  transition: background-image 0.5s ease;
}

.background-layer video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.content-layer {
  position: relative;
  z-index: 10;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 5vh 8vw;
  transition: opacity 0.4s ease;
}

.content-layer.fade-out { opacity: 0; }
.content-layer.fade-in { opacity: 1; }

.content-text {
  font-size: clamp(2rem, 5vw, 5rem);
  text-align: center;
  line-height: 1.4;
  text-shadow: 2px 2px 8px rgba(0,0,0,0.8);
  white-space: pre-line;
}

.bible-reference {
  position: absolute;
  bottom: 5vh;
  right: 8vw;
  font-size: clamp(1rem, 2vw, 2rem);
  opacity: 0.8;
  text-shadow: 1px 1px 4px rgba(0,0,0,0.8);
}

.notice-card {
  background: rgba(0,0,0,0.7);
  border-radius: 1.5rem;
  padding: 3rem 4rem;
  text-align: center;
  backdrop-filter: blur(10px);
}

.notice-card h2 {
  font-size: clamp(2rem, 4vw, 4rem);
  margin-bottom: 1rem;
}

.notice-card p {
  font-size: clamp(1.2rem, 2.5vw, 2.5rem);
  opacity: 0.8;
}

.lower-third {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 20;
  padding: 1rem 2rem;
  background: linear-gradient(transparent, rgba(0,0,0,0.8));
  transform: translateY(100%);
  transition: transform 0.4s ease;
}

.lower-third.visible { transform: translateY(0); }

.lower-third .text { font-size: 1.5rem; font-weight: 600; }
.lower-third .subtext { font-size: 1rem; opacity: 0.7; }

/* Identify flash */
@keyframes identify-flash {
  0%, 100% { background: transparent; }
  50% { background: rgba(59, 130, 246, 0.5); }
}

.identifying {
  animation: identify-flash 0.5s ease 3;
}

/* Video fullscreen */
.video-player {
  width: 100vw;
  height: 100vh;
  object-fit: contain;
  background: #000;
}

/* Slide fullscreen */
.slide-image {
  max-width: 100vw;
  max-height: 100vh;
  object-fit: contain;
}
```

- [ ] **Step 2: Create Socket client**

```javascript
// apps/sidecar/public/js/socket-client.js

function getFingerprint() {
  let fp = localStorage.getItem("castlight-fingerprint");
  if (!fp) {
    fp = "fp-" + Math.random().toString(36).slice(2) + Date.now().toString(36);
    localStorage.setItem("castlight-fingerprint", fp);
  }
  return fp;
}

function connectSocket(onRegistered) {
  const socket = io(window.location.origin, {
    path: "/ws",
    transports: ["websocket"],
  });

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
    const routes = {
      public: "/public",
      stage: "/stage",
      stream: "/stream",
      monitor: "/monitor",
      bible: "/bible",
      tech: "/tech",
    };
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
```

- [ ] **Step 3: Create renderer**

```javascript
// apps/sidecar/public/js/renderer.js

const SIDECAR_URL = window.location.origin;

function createRenderer(contentLayer, backgroundLayer) {
  let currentVideo = null;

  function fadeContent(callback) {
    contentLayer.classList.add("fade-out");
    contentLayer.classList.remove("fade-in");
    setTimeout(() => {
      callback();
      contentLayer.classList.remove("fade-out");
      contentLayer.classList.add("fade-in");
    }, 300);
  }

  function renderLyrics(data) {
    fadeContent(() => {
      contentLayer.innerHTML = `<div class="content-text">${escapeHtml(data.section.text)}</div>`;
    });
  }

  function renderBible(data) {
    fadeContent(() => {
      const verseText = data.verses.map((v) => `<sup>${v.verse}</sup> ${escapeHtml(v.text)}`).join(" ");
      const ref = `${data.reference.book} ${data.reference.chapter}:${data.reference.verseStart}${data.reference.verseEnd ? "-" + data.reference.verseEnd : ""}`;
      contentLayer.innerHTML = `
        <div class="content-text" style="font-size: clamp(1.5rem, 4vw, 4rem);">${verseText}</div>
        <div class="bible-reference">${escapeHtml(ref)} — ${data.reference.version.toUpperCase()}</div>
      `;
    });
  }

  function renderSlide(data) {
    const url = SIDECAR_URL + data.slides[data.currentIndex];
    fadeContent(() => {
      contentLayer.innerHTML = `<img class="slide-image" src="${url}" alt="Slide ${data.currentIndex + 1}" />`;
    });
  }

  function renderImage(data) {
    const url = SIDECAR_URL + data.url;
    fadeContent(() => {
      contentLayer.innerHTML = `<img class="slide-image" src="${url}" alt="${escapeHtml(data.filename)}" />`;
    });
  }

  function renderVideo(data, enableAudio) {
    const url = SIDECAR_URL + data.url;
    if (data.action === "play") {
      if (currentVideo && currentVideo.src.endsWith(data.url)) {
        currentVideo.currentTime = data.timestamp || 0;
        currentVideo.play();
        return;
      }
      fadeContent(() => {
        contentLayer.innerHTML = `<video class="video-player" ${enableAudio ? "" : "muted"} autoplay></video>`;
        currentVideo = contentLayer.querySelector("video");
        currentVideo.src = url;
        currentVideo.currentTime = data.timestamp || 0;
        currentVideo.play();
      });
    } else if (data.action === "pause" && currentVideo) {
      currentVideo.pause();
    } else if (data.action === "seek" && currentVideo) {
      currentVideo.currentTime = data.timestamp || 0;
    }
  }

  function renderNotice(data) {
    fadeContent(() => {
      contentLayer.innerHTML = `
        <div class="notice-card">
          <h2>${escapeHtml(data.title)}</h2>
          <p>${escapeHtml(data.body)}</p>
        </div>
      `;
    });
  }

  function clearContent() {
    fadeContent(() => {
      contentLayer.innerHTML = "";
      if (currentVideo) {
        currentVideo.pause();
        currentVideo.src = "";
        currentVideo = null;
      }
    });
  }

  function setBackground(data) {
    if (!backgroundLayer) return;
    if (data.type === "color") {
      backgroundLayer.style.backgroundImage = "none";
      backgroundLayer.style.backgroundColor = data.value;
      backgroundLayer.innerHTML = "";
    } else if (data.type === "gradient") {
      backgroundLayer.style.backgroundImage = data.value;
      backgroundLayer.innerHTML = "";
    } else if (data.type === "image") {
      backgroundLayer.style.backgroundImage = `url(${SIDECAR_URL}${data.value})`;
      backgroundLayer.innerHTML = "";
    } else if (data.type === "video") {
      backgroundLayer.style.backgroundImage = "none";
      backgroundLayer.innerHTML = `<video src="${SIDECAR_URL}${data.value}" autoplay loop muted playsinline style="width:100%;height:100%;object-fit:cover;"></video>`;
    }
  }

  function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  return { renderLyrics, renderBible, renderSlide, renderImage, renderVideo, renderNotice, clearContent, setBackground };
}

function bindScreenEvents(socket, renderer, options) {
  const enableAudio = options?.enableAudio ?? false;

  socket.on("content:lyrics", (data) => renderer.renderLyrics(data));
  socket.on("content:bible", (data) => renderer.renderBible(data));
  socket.on("content:slide", (data) => renderer.renderSlide(data));
  socket.on("content:image", (data) => renderer.renderImage(data));
  socket.on("content:video", (data) => renderer.renderVideo(data, enableAudio));
  socket.on("content:notice", (data) => renderer.renderNotice(data));
  socket.on("content:clear", () => renderer.clearContent());
  socket.on("background:change", (data) => renderer.setBackground(data));
}
```

- [ ] **Step 4: Commit**

```bash
git add apps/sidecar/public/
git commit -m "feat(screens): add shared CSS, socket client, and content renderer"
```

---

### Task 2: Welcome Page + Static Serving

**Files:**
- Create: `apps/sidecar/public/index.html`
- Modify: `apps/sidecar/src/server.ts`

- [ ] **Step 1: Create welcome page**

```html
<!-- apps/sidecar/public/index.html -->
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Castlight</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://cdn.socket.io/4.7.5/socket.io.min.js"></script>
  <script src="/js/socket-client.js"></script>
</head>
<body class="bg-zinc-950 text-white min-h-screen flex items-center justify-center">
  <div id="app" class="text-center space-y-6 p-8">
    <h1 class="text-4xl font-bold">Castlight</h1>
    <div id="status" class="space-y-2">
      <div class="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
      <p class="text-zinc-400">Conectando ao servidor...</p>
    </div>
    <div id="registered" class="hidden space-y-4">
      <div class="bg-green-900/50 text-green-300 px-4 py-2 rounded-lg inline-block">Conectado</div>
      <p class="text-zinc-400" id="screen-info"></p>
      <div id="waiting" class="space-y-2">
        <div class="w-6 h-6 border-2 border-zinc-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p class="text-zinc-500 text-sm">Aguardando atribuicao de papel pelo operador...</p>
      </div>
      <div id="role-info" class="hidden">
        <p class="text-zinc-400">Papel: <span id="role-name" class="text-white font-semibold"></span></p>
        <p class="text-zinc-500 text-sm">Redirecionando...</p>
      </div>
    </div>
  </div>
  <script>
    const socket = connectSocket((info) => {
      document.getElementById("status").classList.add("hidden");
      document.getElementById("registered").classList.remove("hidden");
      document.getElementById("screen-info").textContent =
        `${screen.width}x${screen.height} — ${navigator.userAgent.slice(0, 40)}...`;
      if (info.role) {
        showRole(info.role);
      }
    });

    socket.on("screen:role-assigned", (role) => {
      showRole(role);
    });

    function showRole(role) {
      document.getElementById("waiting").classList.add("hidden");
      document.getElementById("role-info").classList.remove("hidden");
      document.getElementById("role-name").textContent = role;
      const routes = { public: "/public", stage: "/stage", stream: "/stream", monitor: "/monitor", bible: "/bible", tech: "/tech" };
      setTimeout(() => { window.location.href = routes[role] || "/"; }, 1000);
    }
  </script>
</body>
</html>
```

- [ ] **Step 2: Add static file serving to server.ts**

Read existing `apps/sidecar/src/server.ts`. Add import:
```typescript
import { serveStatic } from "hono/bun";
import { readFileSync, existsSync } from "fs";
import { join } from "path";
```

Add `publicDir: string` to `AppContext`.

Add static serving AFTER all `/api` routes but BEFORE the return statement:
```typescript
  // Serve static assets (CSS, JS)
  app.use("/css/*", serveStatic({ root: ctx.publicDir }));
  app.use("/js/*", serveStatic({ root: ctx.publicDir }));

  // Serve screen HTML pages
  const screenPages = ["index", "public", "stage", "stream", "monitor", "bible", "tech"];
  for (const page of screenPages) {
    const route = page === "index" ? "/" : `/${page}`;
    app.get(route, (c) => {
      const filePath = join(ctx.publicDir, `${page}.html`);
      if (!existsSync(filePath)) return c.text("Page not found", 404);
      return c.html(readFileSync(filePath, "utf-8"));
    });
  }
```

Also update `apps/sidecar/src/index.ts` to pass `publicDir`:
```typescript
const publicDir = join(import.meta.dir, "../public");
```
Add `publicDir` to the createApp call.

- [ ] **Step 3: Verify welcome page loads**

Start sidecar and open `http://localhost:3100/` in a browser.
Expected: Castlight welcome page with "Conectando..." then "Conectado".

- [ ] **Step 4: Commit**

```bash
git add apps/sidecar/public/index.html apps/sidecar/src/server.ts apps/sidecar/src/index.ts
git commit -m "feat(screens): add welcome page with registration and static file serving"
```

---

### Task 3: Public Screen

**Files:**
- Create: `apps/sidecar/public/public.html`
- Create: `apps/sidecar/public/js/public.js`

- [ ] **Step 1: Create public.html**

```html
<!-- apps/sidecar/public/public.html -->
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Castlight — Publico</title>
  <link rel="stylesheet" href="/css/screen.css">
  <script src="https://cdn.socket.io/4.7.5/socket.io.min.js"></script>
  <script src="/js/socket-client.js"></script>
  <script src="/js/renderer.js"></script>
</head>
<body>
  <div class="screen-container">
    <div class="background-layer" id="bg"></div>
    <div class="content-layer fade-in" id="content"></div>
  </div>
  <script src="/js/public.js"></script>
</body>
</html>
```

- [ ] **Step 2: Create public.js**

```javascript
// apps/sidecar/public/js/public.js
const socket = connectSocket();
const renderer = createRenderer(
  document.getElementById("content"),
  document.getElementById("bg")
);
bindScreenEvents(socket, renderer, { enableAudio: false });
```

- [ ] **Step 3: Commit**

```bash
git add apps/sidecar/public/public.html apps/sidecar/public/js/public.js
git commit -m "feat(screens): add public screen with fullscreen content rendering"
```

---

### Task 4: Stage Screen (Retorno)

**Files:**
- Create: `apps/sidecar/public/stage.html`
- Create: `apps/sidecar/public/js/stage.js`

- [ ] **Step 1: Create stage.html**

```html
<!-- apps/sidecar/public/stage.html -->
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Castlight — Retorno</title>
  <link rel="stylesheet" href="/css/screen.css">
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://cdn.socket.io/4.7.5/socket.io.min.js"></script>
  <script src="/js/socket-client.js"></script>
</head>
<body class="bg-zinc-950 text-white">
  <div class="h-screen flex flex-col">
    <div id="header" class="flex items-center justify-between px-6 py-3 bg-zinc-900 border-b border-zinc-800">
      <span id="song-key" class="text-blue-400 font-mono text-lg"></span>
      <span id="song-title" class="text-zinc-400 text-sm"></span>
      <span id="section-pos" class="text-zinc-500 text-sm"></span>
    </div>
    <div id="current" class="flex-1 flex items-center justify-center px-8">
      <div id="current-text" class="text-center text-4xl leading-relaxed whitespace-pre-line"></div>
    </div>
    <div id="next" class="h-1/4 bg-zinc-900/50 border-t border-zinc-800 flex items-center justify-center px-8">
      <div class="text-center">
        <span class="text-zinc-500 text-xs uppercase tracking-wide">Proximo</span>
        <div id="next-text" class="text-zinc-400 text-xl mt-1 whitespace-pre-line"></div>
      </div>
    </div>
  </div>
  <script src="/js/stage.js"></script>
</body>
</html>
```

- [ ] **Step 2: Create stage.js**

```javascript
// apps/sidecar/public/js/stage.js
const socket = connectSocket();

socket.on("content:lyrics", (data) => {
  document.getElementById("current-text").textContent = data.section.text;
  document.getElementById("next-text").textContent = data.nextSection?.text ?? "";
  document.getElementById("song-title").textContent = `${data.song.title} — ${data.song.artist}`;
  document.getElementById("song-key").textContent = data.song.key ? `Tom: ${data.song.key}` : "";
  document.getElementById("section-pos").textContent = data.section.label;
});

socket.on("content:bible", (data) => {
  const text = data.verses.map((v) => v.text).join(" ");
  const ref = `${data.reference.book} ${data.reference.chapter}:${data.reference.verseStart}`;
  document.getElementById("current-text").textContent = text;
  document.getElementById("next-text").textContent = "";
  document.getElementById("song-title").textContent = ref + " — " + data.reference.version.toUpperCase();
  document.getElementById("song-key").textContent = "";
  document.getElementById("section-pos").textContent = "";
});

socket.on("content:clear", () => {
  document.getElementById("current-text").textContent = "";
  document.getElementById("next-text").textContent = "";
  document.getElementById("song-title").textContent = "";
  document.getElementById("song-key").textContent = "";
  document.getElementById("section-pos").textContent = "";
});
```

- [ ] **Step 3: Commit**

```bash
git add apps/sidecar/public/stage.html apps/sidecar/public/js/stage.js
git commit -m "feat(screens): add stage screen with current/next section and song info"
```

---

### Task 5: Stream, Monitor, Bible, Tech Screens

**Files:**
- Create: `apps/sidecar/public/stream.html`
- Create: `apps/sidecar/public/js/stream.js`
- Create: `apps/sidecar/public/monitor.html`
- Create: `apps/sidecar/public/js/monitor.js`
- Create: `apps/sidecar/public/bible.html`
- Create: `apps/sidecar/public/js/bible.js`
- Create: `apps/sidecar/public/tech.html`
- Create: `apps/sidecar/public/js/tech.js`

- [ ] **Step 1: Create stream.html + stream.js**

stream.html is identical to public.html but adds a lower-third div and uses stream.js:

```html
<!-- apps/sidecar/public/stream.html -->
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Castlight — Stream</title>
  <link rel="stylesheet" href="/css/screen.css">
  <script src="https://cdn.socket.io/4.7.5/socket.io.min.js"></script>
  <script src="/js/socket-client.js"></script>
  <script src="/js/renderer.js"></script>
</head>
<body>
  <div class="screen-container">
    <div class="background-layer" id="bg"></div>
    <div class="content-layer fade-in" id="content"></div>
    <div class="lower-third" id="lower-third">
      <div class="text" id="lt-text"></div>
      <div class="subtext" id="lt-subtext"></div>
    </div>
  </div>
  <script src="/js/stream.js"></script>
</body>
</html>
```

```javascript
// apps/sidecar/public/js/stream.js
const socket = connectSocket();
const renderer = createRenderer(
  document.getElementById("content"),
  document.getElementById("bg")
);
// Stream screen has audio enabled for OBS Browser Source capture
bindScreenEvents(socket, renderer, { enableAudio: true });

// Lower third
const lt = document.getElementById("lower-third");
const ltText = document.getElementById("lt-text");
const ltSubtext = document.getElementById("lt-subtext");

socket.on("content:lyrics", (data) => {
  ltText.textContent = data.song.title;
  ltSubtext.textContent = data.song.artist;
  lt.classList.add("visible");
});

socket.on("content:bible", (data) => {
  const ref = `${data.reference.book} ${data.reference.chapter}:${data.reference.verseStart}`;
  ltText.textContent = ref;
  ltSubtext.textContent = data.reference.version.toUpperCase();
  lt.classList.add("visible");
});

socket.on("content:clear", () => {
  lt.classList.remove("visible");
});

socket.on("stream:lower-third", (data) => {
  ltText.textContent = data.text;
  ltSubtext.textContent = data.subtext;
  if (data.visible) lt.classList.add("visible");
  else lt.classList.remove("visible");
});
```

- [ ] **Step 2: Create monitor.html + monitor.js**

```html
<!-- apps/sidecar/public/monitor.html -->
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Castlight — Monitor</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://cdn.socket.io/4.7.5/socket.io.min.js"></script>
  <script src="/js/socket-client.js"></script>
  <link rel="stylesheet" href="/css/screen.css">
</head>
<body class="bg-zinc-950 text-white p-6">
  <h1 class="text-2xl font-bold mb-6">Castlight Monitor</h1>
  <div class="grid grid-cols-1 gap-4">
    <div class="bg-zinc-800 rounded-xl p-4">
      <h2 class="text-zinc-400 text-sm uppercase mb-2">Conteudo atual</h2>
      <div id="current-content" class="text-white text-lg">Nenhum</div>
    </div>
    <div class="bg-zinc-800 rounded-xl p-4">
      <h2 class="text-zinc-400 text-sm uppercase mb-2">Versiculo</h2>
      <div id="bible-content" class="text-white">—</div>
    </div>
    <div class="bg-zinc-800 rounded-xl p-4">
      <h2 class="text-zinc-400 text-sm uppercase mb-2">Aviso</h2>
      <div id="notice-content" class="text-white">—</div>
    </div>
    <div class="bg-zinc-800 rounded-xl p-4">
      <h2 class="text-zinc-400 text-sm uppercase mb-2">Telas conectadas</h2>
      <div id="screens-count" class="text-white text-3xl font-bold">0</div>
    </div>
  </div>
  <script src="/js/monitor.js"></script>
</body>
</html>
```

```javascript
// apps/sidecar/public/js/monitor.js
const socket = connectSocket();

socket.on("content:lyrics", (data) => {
  document.getElementById("current-content").textContent = `${data.song.title} — ${data.section.label}`;
});

socket.on("content:bible", (data) => {
  const ref = `${data.reference.book} ${data.reference.chapter}:${data.reference.verseStart}`;
  const text = data.verses.map((v) => v.text).join(" ");
  document.getElementById("bible-content").innerHTML = `<strong>${ref}</strong><br>${text}`;
  document.getElementById("current-content").textContent = ref;
});

socket.on("content:notice", (data) => {
  document.getElementById("notice-content").innerHTML = `<strong>${data.title}</strong><br>${data.body}`;
  document.getElementById("current-content").textContent = `Aviso: ${data.title}`;
});

socket.on("content:clear", () => {
  document.getElementById("current-content").textContent = "Nenhum";
});

socket.on("screens:updated", (screens) => {
  document.getElementById("screens-count").textContent = screens.length;
});
```

- [ ] **Step 3: Create bible.html + bible.js**

```html
<!-- apps/sidecar/public/bible.html -->
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Castlight — Biblia</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://cdn.socket.io/4.7.5/socket.io.min.js"></script>
  <script src="/js/socket-client.js"></script>
  <link rel="stylesheet" href="/css/screen.css">
</head>
<body class="bg-zinc-950 text-white">
  <div class="max-w-2xl mx-auto p-4 space-y-4">
    <div class="flex items-center gap-3">
      <h1 class="text-xl font-bold">Biblia</h1>
      <select id="version-select" class="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-sm"></select>
    </div>
    <div id="breadcrumb" class="text-sm text-zinc-400"></div>
    <div id="search-box" class="flex gap-2">
      <input id="search-input" type="text" placeholder="Buscar texto..." class="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white placeholder-zinc-500" />
      <button id="search-btn" class="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm">Buscar</button>
    </div>
    <div id="content-area" class="space-y-2"></div>
  </div>
  <script src="/js/bible.js"></script>
</body>
</html>
```

```javascript
// apps/sidecar/public/js/bible.js
const socket = connectSocket();
const API = window.location.origin + "/api";
let currentVersion = "acf";
let currentBook = null;
let currentChapter = null;

const versionSelect = document.getElementById("version-select");
const breadcrumb = document.getElementById("breadcrumb");
const contentArea = document.getElementById("content-area");
const searchInput = document.getElementById("search-input");
const searchBtn = document.getElementById("search-btn");

async function fetchJSON(url) {
  const res = await fetch(url);
  return res.json();
}

async function loadVersions() {
  const versions = await fetchJSON(`${API}/bible/versions`);
  versionSelect.innerHTML = versions.map((v) => `<option value="${v.id}">${v.name}</option>`).join("");
  versionSelect.value = currentVersion;
  versionSelect.addEventListener("change", () => { currentVersion = versionSelect.value; loadBooks(); });
  loadBooks();
}

async function loadBooks() {
  currentBook = null;
  currentChapter = null;
  breadcrumb.textContent = "";
  const books = await fetchJSON(`${API}/bible/versions/${currentVersion}/books`);
  contentArea.innerHTML = `<div class="grid grid-cols-3 gap-2">${books.map((b) =>
    `<button onclick="selectBook('${b.name}', ${b.chapters})" class="bg-zinc-800 rounded-lg p-3 text-left hover:bg-zinc-700 transition-colors">
      <div class="text-white text-sm font-medium">${b.name}</div>
      <div class="text-zinc-500 text-xs">${b.chapters} cap.</div>
    </button>`
  ).join("")}</div>`;
}

window.selectBook = function(name, chapters) {
  currentBook = name;
  breadcrumb.innerHTML = `<button onclick="loadBooks()" class="text-blue-400 hover:underline">Livros</button> > ${name}`;
  contentArea.innerHTML = `<div class="grid grid-cols-6 gap-2">${Array.from({ length: chapters }, (_, i) =>
    `<button onclick="selectChapter(${i + 1})" class="bg-zinc-800 rounded-lg p-3 text-center text-white hover:bg-zinc-700 transition-colors">${i + 1}</button>`
  ).join("")}</div>`;
};

window.selectChapter = async function(chapter) {
  currentChapter = chapter;
  breadcrumb.innerHTML = `<button onclick="loadBooks()" class="text-blue-400 hover:underline">Livros</button> > <button onclick="selectBook('${currentBook}', 0)" class="text-blue-400 hover:underline">${currentBook}</button> > Cap. ${chapter}`;
  const verses = await fetchJSON(`${API}/bible/verses?version=${currentVersion}&book=${currentBook}&chapter=${chapter}&verseStart=1&verseEnd=200`);
  contentArea.innerHTML = `<div class="space-y-1">${verses.map((v) =>
    `<button onclick="sendVerse(${v.verse})" class="w-full text-left p-3 rounded-lg hover:bg-zinc-700 transition-colors">
      <span class="text-blue-400 text-xs font-bold mr-2">${v.verse}</span>
      <span class="text-white">${v.text}</span>
    </button>`
  ).join("")}</div>`;
};

window.sendVerse = function(verseNum) {
  socket.emit("bible:send", {
    version: currentVersion,
    book: currentBook,
    chapter: currentChapter,
    verseStart: verseNum,
  });
};

searchBtn.addEventListener("click", async () => {
  const q = searchInput.value.trim();
  if (!q) return;
  const results = await fetchJSON(`${API}/bible/search?version=${currentVersion}&q=${encodeURIComponent(q)}`);
  contentArea.innerHTML = `<p class="text-zinc-400 text-sm">${results.length} resultado(s)</p>
    <div class="space-y-1">${results.slice(0, 50).map((v) =>
    `<button onclick="socket.emit('bible:send', { version: '${currentVersion}', book: '${v.book}', chapter: ${v.chapter}, verseStart: ${v.verse} })" class="w-full text-left p-3 rounded-lg hover:bg-zinc-700 transition-colors">
      <span class="text-blue-400 text-xs font-bold mr-2">${v.bookAbbr} ${v.chapter}:${v.verse}</span>
      <span class="text-white">${v.text}</span>
    </button>`
  ).join("")}</div>`;
});

loadVersions();
```

- [ ] **Step 4: Create tech.html + tech.js**

```html
<!-- apps/sidecar/public/tech.html -->
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Castlight — Tecnica</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://cdn.socket.io/4.7.5/socket.io.min.js"></script>
  <script src="/js/socket-client.js"></script>
  <link rel="stylesheet" href="/css/screen.css">
</head>
<body class="bg-zinc-950 text-white p-6">
  <h1 class="text-2xl font-bold mb-6">Castlight Tecnica</h1>
  <div class="grid grid-cols-2 gap-4">
    <div class="bg-zinc-800 rounded-xl p-4">
      <h2 class="text-zinc-400 text-sm uppercase mb-2">Servidor</h2>
      <div id="server-info" class="text-white text-sm space-y-1"></div>
    </div>
    <div class="bg-zinc-800 rounded-xl p-4">
      <h2 class="text-zinc-400 text-sm uppercase mb-2">OBS</h2>
      <div id="obs-info" class="text-white text-sm">Desconectado</div>
    </div>
    <div class="col-span-2 bg-zinc-800 rounded-xl p-4">
      <h2 class="text-zinc-400 text-sm uppercase mb-3">Telas conectadas</h2>
      <div id="screens-list" class="space-y-2"></div>
    </div>
  </div>
  <script src="/js/tech.js"></script>
</body>
</html>
```

```javascript
// apps/sidecar/public/js/tech.js
const socket = connectSocket();
const API = window.location.origin + "/api";

async function loadServerInfo() {
  const health = await fetch(`${API}/health`).then((r) => r.json());
  document.getElementById("server-info").innerHTML = `
    <p>IP: <span class="text-blue-400">${health.ip}</span></p>
    <p>Porta: <span class="text-blue-400">3100</span></p>
    <p>Status: <span class="text-green-400">Online</span></p>
  `;
}

socket.on("screens:updated", (screens) => {
  const roles = { public: "Publico", stage: "Retorno", stream: "Stream", monitor: "Monitor", bible: "Biblia", tech: "Tecnica" };
  document.getElementById("screens-list").innerHTML = screens.length === 0
    ? '<p class="text-zinc-500">Nenhuma tela conectada</p>'
    : screens.map((s) => `
      <div class="flex items-center justify-between bg-zinc-700 rounded-lg px-3 py-2">
        <span class="text-white text-sm">${s.name || s.userAgent.slice(0, 30)}</span>
        <span class="text-zinc-400 text-xs">${s.resolution.width}x${s.resolution.height}</span>
        <span class="text-blue-400 text-xs">${roles[s.role] || "Sem papel"}</span>
      </div>
    `).join("");
});

socket.on("obs:status", (status) => {
  document.getElementById("obs-info").innerHTML = status.connected
    ? `<span class="text-green-400">Conectado</span> — Cena: ${status.currentScene || "—"}${status.recording ? " — <span class='text-red-400'>Gravando</span>" : ""}`
    : '<span class="text-red-400">Desconectado</span>';
});

loadServerInfo();
```

- [ ] **Step 5: Commit**

```bash
git add apps/sidecar/public/
git commit -m "feat(screens): add stream, monitor, bible control, and tech screens"
```

---

### Task 6: Integration Verification

- [ ] **Step 1: Run all sidecar tests**

Run: `cd apps/sidecar && bun test`
Expected: All tests pass.

- [ ] **Step 2: Start sidecar and test all screens**

Start: `bun run apps/sidecar/src/index.ts`

Open in browser:
- `http://localhost:3100/` — Welcome page (should show "Conectado")
- `http://localhost:3100/public` — Black screen (waiting for content)
- `http://localhost:3100/stage` — Stage layout
- `http://localhost:3100/stream` — Stream layout with lower third
- `http://localhost:3100/monitor` — Monitor dashboard
- `http://localhost:3100/bible` — Bible navigation (tablet-friendly)
- `http://localhost:3100/tech` — Tech status

- [ ] **Step 3: Commit and push**

```bash
git push
```
