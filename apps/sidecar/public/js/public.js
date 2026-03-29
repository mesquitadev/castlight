var socket = connectSocket();
var renderer = createRenderer(document.getElementById("content"), document.getElementById("bg"));
bindScreenEvents(socket, renderer, { enableAudio: false });
