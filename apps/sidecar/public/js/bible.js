var socket = connectSocket();
var API = window.location.origin + "/api";
var currentVersion = "acf";
var currentBook = null;
var currentChapter = null;

var versionSelect = document.getElementById("version-select");
var breadcrumb = document.getElementById("breadcrumb");
var contentArea = document.getElementById("content-area");
var searchInput = document.getElementById("search-input");
var searchBtn = document.getElementById("search-btn");

function fetchJSON(url) { return fetch(url).then(function(r) { return r.json(); }); }

function loadVersions() {
  fetchJSON(API + "/bible/versions").then(function(versions) {
    versionSelect.innerHTML = versions.map(function(v) { return '<option value="' + v.id + '">' + v.name + '</option>'; }).join("");
    versionSelect.value = currentVersion;
    versionSelect.addEventListener("change", function() { currentVersion = versionSelect.value; loadBooks(); });
    loadBooks();
  });
}

function loadBooks() {
  currentBook = null;
  currentChapter = null;
  breadcrumb.textContent = "";
  fetchJSON(API + "/bible/versions/" + currentVersion + "/books").then(function(books) {
    contentArea.innerHTML = '<div class="grid grid-cols-3 gap-2">' + books.map(function(b) {
      return '<button onclick="selectBook(\'' + b.name + '\', ' + b.chapters + ')" class="bg-zinc-800 rounded-lg p-3 text-left hover:bg-zinc-700 transition-colors"><div class="text-white text-sm font-medium">' + b.name + '</div><div class="text-zinc-500 text-xs">' + b.chapters + ' cap.</div></button>';
    }).join("") + '</div>';
  });
}

function selectBook(name, chapters) {
  currentBook = name;
  breadcrumb.innerHTML = '<button onclick="loadBooks()" class="text-blue-400 hover:underline">Livros</button> > ' + name;
  contentArea.innerHTML = '<div class="grid grid-cols-6 gap-2">' + Array.from({ length: chapters }, function(_, i) {
    return '<button onclick="selectChapter(' + (i + 1) + ')" class="bg-zinc-800 rounded-lg p-3 text-center text-white hover:bg-zinc-700 transition-colors">' + (i + 1) + '</button>';
  }).join("") + '</div>';
}

function selectChapter(chapter) {
  currentChapter = chapter;
  breadcrumb.innerHTML = '<button onclick="loadBooks()" class="text-blue-400 hover:underline">Livros</button> > <button onclick="selectBook(\'' + currentBook + '\', 0)" class="text-blue-400 hover:underline">' + currentBook + '</button> > Cap. ' + chapter;
  fetchJSON(API + "/bible/verses?version=" + currentVersion + "&book=" + currentBook + "&chapter=" + chapter + "&verseStart=1&verseEnd=200").then(function(verses) {
    contentArea.innerHTML = '<div class="space-y-1">' + verses.map(function(v) {
      return '<button onclick="sendVerse(' + v.verse + ')" class="w-full text-left p-3 rounded-lg hover:bg-zinc-700 transition-colors"><span class="text-blue-400 text-xs font-bold mr-2">' + v.verse + '</span><span class="text-white">' + v.text + '</span></button>';
    }).join("") + '</div>';
  });
}

function sendVerse(verseNum) {
  socket.emit("bible:send", { version: currentVersion, book: currentBook, chapter: currentChapter, verseStart: verseNum });
}

searchBtn.addEventListener("click", function() {
  var q = searchInput.value.trim();
  if (!q) return;
  fetchJSON(API + "/bible/search?version=" + currentVersion + "&q=" + encodeURIComponent(q)).then(function(results) {
    contentArea.innerHTML = '<p class="text-zinc-400 text-sm">' + results.length + ' resultado(s)</p><div class="space-y-1">' + results.slice(0, 50).map(function(v) {
      return '<button onclick="sendVerseRef(\'' + v.book + '\', ' + v.chapter + ', ' + v.verse + ')" class="w-full text-left p-3 rounded-lg hover:bg-zinc-700 transition-colors"><span class="text-blue-400 text-xs font-bold mr-2">' + v.bookAbbr + ' ' + v.chapter + ':' + v.verse + '</span><span class="text-white">' + v.text + '</span></button>';
    }).join("") + '</div>';
  });
});

function sendVerseRef(book, chapter, verse) {
  socket.emit("bible:send", { version: currentVersion, book: book, chapter: chapter, verseStart: verse });
}

loadVersions();
