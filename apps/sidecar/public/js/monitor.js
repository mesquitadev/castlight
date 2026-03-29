var socket = connectSocket();

socket.on("content:lyrics", function(data) {
  document.getElementById("current-content").textContent = data.song.title + " — " + data.section.label;
});

socket.on("content:bible", function(data) {
  var ref = data.reference.book + " " + data.reference.chapter + ":" + data.reference.verseStart;
  var text = data.verses.map(function(v) { return v.text; }).join(" ");
  document.getElementById("bible-content").innerHTML = "<strong>" + ref + "</strong><br>" + text;
  document.getElementById("current-content").textContent = ref;
});

socket.on("content:notice", function(data) {
  document.getElementById("notice-content").innerHTML = "<strong>" + data.title + "</strong><br>" + data.body;
  document.getElementById("current-content").textContent = "Aviso: " + data.title;
});

socket.on("content:clear", function() {
  document.getElementById("current-content").textContent = "Nenhum";
});

socket.on("screens:updated", function(screens) {
  document.getElementById("screens-count").textContent = screens.length;
});
