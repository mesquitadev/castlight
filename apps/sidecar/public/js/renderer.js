var SIDECAR_URL = window.location.origin;

var FIT_CSS = {
  cover: "cover",
  contain: "contain",
  stretch: "100% 100%",
  center: "auto",
};

function createRenderer(contentLayer, backgroundLayer) {
  var currentVideo = null;

  function fadeContent(callback) {
    contentLayer.classList.add("fade-out");
    contentLayer.classList.remove("fade-in");
    setTimeout(function() {
      callback();
      contentLayer.classList.remove("fade-out");
      contentLayer.classList.add("fade-in");
    }, 300);
  }

  function escapeHtml(text) {
    var div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  function renderLyrics(data) {
    fadeContent(function() {
      contentLayer.innerHTML = '<div class="content-text">' + escapeHtml(data.section.text) + '</div>';
    });
  }

  function renderBible(data) {
    fadeContent(function() {
      var verseText = data.verses.map(function(v) { return '<sup>' + v.verse + '</sup> ' + escapeHtml(v.text); }).join(" ");
      var ref = data.reference.book + ' ' + data.reference.chapter + ':' + data.reference.verseStart + (data.reference.verseEnd ? '-' + data.reference.verseEnd : '');
      contentLayer.innerHTML = '<div class="content-text" style="font-size:clamp(1.5rem,4vw,4rem);">' + verseText + '</div><div class="bible-reference">' + escapeHtml(ref) + ' — ' + data.reference.version.toUpperCase() + '</div>';
    });
  }

  function renderSlide(data) {
    var url = SIDECAR_URL + data.slides[data.currentIndex];
    fadeContent(function() {
      contentLayer.innerHTML = '<img class="slide-image" src="' + url + '" alt="Slide ' + (data.currentIndex + 1) + '" />';
    });
  }

  function renderImage(data) {
    var url = SIDECAR_URL + data.url;
    fadeContent(function() {
      contentLayer.innerHTML = '<img class="slide-image" src="' + url + '" alt="' + escapeHtml(data.filename) + '" />';
    });
  }

  function renderVideo(data, enableAudio) {
    var url = SIDECAR_URL + data.url;
    if (data.action === "play") {
      if (currentVideo && currentVideo.src.endsWith(data.url)) {
        currentVideo.currentTime = data.timestamp || 0;
        currentVideo.play();
        return;
      }
      fadeContent(function() {
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
    fadeContent(function() {
      contentLayer.innerHTML = '<div class="notice-card"><h2>' + escapeHtml(data.title) + '</h2><p>' + escapeHtml(data.body) + '</p></div>';
    });
  }

  function clearContent() {
    fadeContent(function() {
      contentLayer.innerHTML = "";
      if (currentVideo) { currentVideo.pause(); currentVideo.src = ""; currentVideo = null; }
    });
  }

  function setBackground(data) {
    if (!backgroundLayer) return;
    var fit = data.fit || "cover";
    var bgSize = FIT_CSS[fit] || "cover";

    if (data.type === "color") {
      backgroundLayer.style.backgroundImage = "none";
      backgroundLayer.style.backgroundColor = data.value;
      backgroundLayer.style.backgroundSize = "";
      backgroundLayer.innerHTML = "";
    } else if (data.type === "gradient") {
      backgroundLayer.style.backgroundImage = data.value;
      backgroundLayer.style.backgroundSize = "";
      backgroundLayer.innerHTML = "";
    } else if (data.type === "image") {
      backgroundLayer.style.backgroundImage = 'url(' + SIDECAR_URL + data.value + ')';
      backgroundLayer.style.backgroundSize = bgSize;
      backgroundLayer.style.backgroundPosition = "center";
      backgroundLayer.style.backgroundRepeat = "no-repeat";
      backgroundLayer.innerHTML = "";
    } else if (data.type === "video") {
      backgroundLayer.style.backgroundImage = "none";
      backgroundLayer.style.backgroundSize = "";
      var objFit = fit === "stretch" ? "fill" : fit === "center" ? "none" : fit;
      backgroundLayer.innerHTML = '<video src="' + SIDECAR_URL + data.value + '" autoplay loop muted playsinline style="width:100%;height:100%;object-fit:' + objFit + ';"></video>';
    }
  }

  function setProjectionArea(area) {
    var container = document.querySelector(".screen-container");
    if (!container) return;
    if (!area.enabled) {
      container.style.top = "0";
      container.style.bottom = "0";
      container.style.left = "0";
      container.style.right = "0";
      container.style.width = "100vw";
      container.style.height = "100vh";
      container.style.position = "fixed";
      container.style.transform = "none";
    } else {
      container.style.position = "fixed";
      container.style.top = area.top + "%";
      container.style.bottom = area.bottom + "%";
      container.style.left = area.left + "%";
      container.style.right = area.right + "%";
      container.style.width = "auto";
      container.style.height = "auto";
      container.style.transform = "none";
    }
  }

  return {
    renderLyrics: renderLyrics,
    renderBible: renderBible,
    renderSlide: renderSlide,
    renderImage: renderImage,
    renderVideo: renderVideo,
    renderNotice: renderNotice,
    clearContent: clearContent,
    setBackground: setBackground,
    setProjectionArea: setProjectionArea,
  };
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
  socket.on("projection:area", function(data) { renderer.setProjectionArea(data); });
}
