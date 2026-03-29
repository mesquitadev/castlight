var socket = connectSocket();
var renderer = createRenderer(document.getElementById("content"), document.getElementById("bg"));
bindScreenEvents(socket, renderer, { enableAudio: true });

// Load saved settings on start
fetch(window.location.origin + "/api/settings/default_wallpaper")
  .then(function(r) { return r.json(); })
  .then(function(config) {
    if (config && config.type) renderer.setBackground(config);
  })
  .catch(function() {});

fetch(window.location.origin + "/api/settings/projection_area")
  .then(function(r) { return r.json(); })
  .then(function(area) {
    if (area && area.enabled !== undefined) renderer.setProjectionArea(area);
  })
  .catch(function() {});

var lt = document.getElementById("lower-third");
var ltText = document.getElementById("lt-text");
var ltSubtext = document.getElementById("lt-subtext");

socket.on("content:lyrics", function(data) {
  ltText.textContent = data.song.title;
  ltSubtext.textContent = data.song.artist;
  lt.classList.add("visible");
});

socket.on("content:bible", function(data) {
  var ref = data.reference.book + " " + data.reference.chapter + ":" + data.reference.verseStart;
  ltText.textContent = ref;
  ltSubtext.textContent = data.reference.version.toUpperCase();
  lt.classList.add("visible");
});

socket.on("content:clear", function() { lt.classList.remove("visible"); });

socket.on("stream:lower-third", function(data) {
  ltText.textContent = data.text;
  ltSubtext.textContent = data.subtext;
  if (data.visible) lt.classList.add("visible");
  else lt.classList.remove("visible");
});
