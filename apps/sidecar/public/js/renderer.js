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

  function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  function renderLyrics(data) {
    fadeContent(() => {
      contentLayer.innerHTML = '<div class="content-text">' + escapeHtml(data.section.text) + '</div>';
    });
  }

  function renderBible(data) {
    fadeContent(() => {
      const verseText = data.verses.map((v) => '<sup>' + v.verse + '</sup> ' + escapeHtml(v.text)).join(" ");
      const ref = data.reference.book + ' ' + data.reference.chapter + ':' + data.reference.verseStart + (data.reference.verseEnd ? '-' + data.reference.verseEnd : '');
      contentLayer.innerHTML = '<div class="content-text" style="font-size:clamp(1.5rem,4vw,4rem);">' + verseText + '</div><div class="bible-reference">' + escapeHtml(ref) + ' — ' + data.reference.version.toUpperCase() + '</div>';
    });
  }

  function renderSlide(data) {
    const url = SIDECAR_URL + data.slides[data.currentIndex];
    fadeContent(() => {
      contentLayer.innerHTML = '<img class="slide-image" src="' + url + '" alt="Slide ' + (data.currentIndex + 1) + '" />';
    });
  }

  function renderImage(data) {
    const url = SIDECAR_URL + data.url;
    fadeContent(() => {
      contentLayer.innerHTML = '<img class="slide-image" src="' + url + '" alt="' + escapeHtml(data.filename) + '" />';
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
        contentLayer.innerHTML = '<video class="video-player" ' + (enableAudio ? '' : 'muted') + ' autoplay></video>';
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
      contentLayer.innerHTML = '<div class="notice-card"><h2>' + escapeHtml(data.title) + '</h2><p>' + escapeHtml(data.body) + '</p></div>';
    });
  }

  function clearContent() {
    fadeContent(() => {
      contentLayer.innerHTML = "";
      if (currentVideo) { currentVideo.pause(); currentVideo.src = ""; currentVideo = null; }
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
      backgroundLayer.style.backgroundImage = 'url(' + SIDECAR_URL + data.value + ')';
      backgroundLayer.innerHTML = "";
    } else if (data.type === "video") {
      backgroundLayer.style.backgroundImage = "none";
      backgroundLayer.innerHTML = '<video src="' + SIDECAR_URL + data.value + '" autoplay loop muted playsinline style="width:100%;height:100%;object-fit:cover;"></video>';
    }
  }

  return { renderLyrics, renderBible, renderSlide, renderImage, renderVideo, renderNotice, clearContent, setBackground };
}

function bindScreenEvents(socket, renderer, options) {
  var enableAudio = options && options.enableAudio ? true : false;
  socket.on("content:lyrics", function(data) { renderer.renderLyrics(data); });
  socket.on("content:bible", function(data) { renderer.renderBible(data); });
  socket.on("content:slide", function(data) { renderer.renderSlide(data); });
  socket.on("content:image", function(data) { renderer.renderImage(data); });
  socket.on("content:video", function(data) { renderer.renderVideo(data, enableAudio); });
  socket.on("content:notice", function(data) { renderer.renderNotice(data); });
  socket.on("content:clear", function() { renderer.clearContent(); });
  socket.on("background:change", function(data) { renderer.setBackground(data); });
}
