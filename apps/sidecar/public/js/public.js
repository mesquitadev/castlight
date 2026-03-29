var socket = connectSocket();
var renderer = createRenderer(document.getElementById("content"), document.getElementById("bg"));
bindScreenEvents(socket, renderer, { enableAudio: false });

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
