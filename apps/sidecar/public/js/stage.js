var socket = connectSocket();

socket.on("content:lyrics", function(data) {
  document.getElementById("current-text").textContent = data.section.text;
  document.getElementById("next-text").textContent = data.nextSection ? data.nextSection.text : "";
  document.getElementById("song-title").textContent = data.song.title + " — " + data.song.artist;
  document.getElementById("song-key").textContent = data.song.key ? "Tom: " + data.song.key : "";
  document.getElementById("section-pos").textContent = data.section.label;
});

socket.on("content:bible", function(data) {
  var text = data.verses.map(function(v) { return v.text; }).join(" ");
  var ref = data.reference.book + " " + data.reference.chapter + ":" + data.reference.verseStart;
  document.getElementById("current-text").textContent = text;
  document.getElementById("next-text").textContent = "";
  document.getElementById("song-title").textContent = ref + " — " + data.reference.version.toUpperCase();
  document.getElementById("song-key").textContent = "";
  document.getElementById("section-pos").textContent = "";
});

socket.on("content:clear", function() {
  document.getElementById("current-text").textContent = "";
  document.getElementById("next-text").textContent = "";
  document.getElementById("song-title").textContent = "";
  document.getElementById("song-key").textContent = "";
  document.getElementById("section-pos").textContent = "";
});
