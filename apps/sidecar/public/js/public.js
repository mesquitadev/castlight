var socket = connectSocket();
var renderer = createRenderer(document.getElementById("content"), document.getElementById("bg"));
bindScreenEvents(socket, renderer, { enableAudio: false });

// Load saved wallpaper on start
fetch(window.location.origin + "/api/settings/default_wallpaper")
  .then(function(r) { return r.json(); })
  .then(function(config) {
    if (config && config.type) renderer.setBackground(config);
  })
  .catch(function() {});
