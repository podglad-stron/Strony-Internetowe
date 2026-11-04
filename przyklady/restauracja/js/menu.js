/* Menu Gospody Trzy Doliny.

   SHEET_CSV_URL: wklej tu link do Arkusza Google z menu (instrukcja: INSTRUKCJA_ARKUSZ.md).
   Działa zwykły link do arkusza udostępnionego „każdy, kto ma link” (zmiana ceny widoczna od razu)
   albo link „Opublikuj w internecie → CSV” (Google odświeża go z kilkuminutowym opóźnieniem).
   Pusty link, brak internetu albo błąd arkusza: strona pokazuje menu zapisane w stronie, bez komunikatu o błędzie. */
const SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/11dSN2hShXu4EiKh_27pQEfC44uiATsikbftdMwH4v08/edit?gid=490587101#gid=490587101";

(function () {
  "use strict";
  var LANG = (document.documentElement.lang || "pl").slice(0, 2);
  var box = document.querySelector("[data-menu]");
  if (!box) return;
  var nav = document.querySelector("[data-menu-nav]");
  var status = document.querySelector("[data-menu-status]");

  var KATEGORIE = {
    "przystawki": { pl: "Przystawki", de: "Vorspeisen", en: "Starters", ikona: "fa-cheese" },
    "zupy": { pl: "Zupy", de: "Suppen", en: "Soups", ikona: "fa-bowl-food" },
    "dania główne": { pl: "Dania główne", de: "Hauptgerichte", en: "Main courses", ikona: "fa-drumstick-bite" },
    "dania wegetariańskie": { pl: "Dania wegetariańskie", de: "Vegetarische Gerichte", en: "Vegetarian dishes", ikona: "fa-leaf" },
    "desery": { pl: "Desery", de: "Desserts", en: "Desserts", ikona: "fa-cake-candles" },
    "napoje i piwa": { pl: "Napoje i piwa", de: "Getränke und Bier", en: "Drinks and beer", ikona: "fa-beer-mug-empty" }
  };
  var TXT = {
    pl: { live: "Menu wczytane na żywo z Arkusza Google", o: "o godz." },
    de: { live: "Speisekarte live aus Google Sheets geladen", o: "um" },
    en: { live: "Menu loaded live from Google Sheets", o: "at" }
  };
  var KOLUMNY = ["kategoria", "nazwa_pl", "nazwa_de", "nazwa_en", "opis_pl", "opis_de", "opis_en", "cena", "dostepne"];

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined && text !== null) e.textContent = text;
    return e;
  }
  function slug(s) {
    return "kat-" + String(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/ł/g, "l")
      .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  }
  function price(raw) {
    var s = String(raw || "").replace(/\s|zł|zl|pln/gi, "").replace(",", ".");
    var n = parseFloat(s);
    if (!isFinite(n)) return String(raw || "").trim();
    return n.toLocaleString(LANG === "en" ? "en-GB" : LANG + "-" + LANG.toUpperCase(),
      { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 }) + " zł";
  }
  function available(v) {
    return ["nie", "no", "nein", "false", "0", "n"].indexOf(String(v || "").trim().toLowerCase()) < 0;
  }

  /* CSV wg RFC 4180: cudzysłowy, "" w środku pola, przecinki i nowe linie w polach. */
  function parseCSV(text) {
    var rows = [], row = [], field = "", q = false, i = 0, c;
    text = String(text).replace(/^﻿/, "");
    for (; i < text.length; i++) {
      c = text[i];
      if (q) {
        if (c === '"') { if (text[i + 1] === '"') { field += '"'; i++; } else q = false; }
        else field += c;
      } else if (c === '"') q = true;
      else if (c === ",") { row.push(field); field = ""; }
      else if (c === "\n" || c === "\r") {
        if (c === "\r" && text[i + 1] === "\n") i++;
        row.push(field); rows.push(row); row = []; field = "";
      } else field += c;
    }
    if (field || row.length) { row.push(field); rows.push(row); }
    return rows;
  }
  function itemsFromCSV(text) {
    var rows = parseCSV(text).filter(function (r) { return r.some(function (x) { return String(x).trim(); }); });
    if (rows.length < 2) return [];
    var head = rows[0].map(function (h) { return String(h).trim().toLowerCase(); });
    var idx = {};
    KOLUMNY.forEach(function (k) { idx[k] = head.indexOf(k); });
    if (idx.nazwa_pl < 0 || idx.cena < 0) return [];
    return rows.slice(1).map(function (r) {
      var o = {};
      KOLUMNY.forEach(function (k) { o[k] = idx[k] >= 0 ? String(r[idx[k]] || "").trim() : ""; });
      return o;
    }).filter(function (o) { return o.nazwa_pl; });
  }

  function render(items, live) {
    var groups = [], byKey = {};
    items.forEach(function (it) {
      if (!available(it.dostepne)) return;
      var key = String(it.kategoria || "Menu").trim();
      if (!byKey[key]) { byKey[key] = []; groups.push(key); }
      byKey[key].push(it);
    });
    if (!groups.length) return false;
    box.textContent = "";
    if (nav) nav.textContent = "";
    groups.forEach(function (key) {
      var info = KATEGORIE[key.toLowerCase()] || {};
      var label = info[LANG] || key;
      var id = slug(key);
      var sec = el("section", "kotwica");
      sec.id = id;
      var h = el("h2", "font-display text-3xl md:text-4xl font-semibold flex items-center gap-3");
      var icon = el("i", "fa-solid " + (info.ikona || "fa-utensils") + " text-wine text-2xl");
      icon.setAttribute("aria-hidden", "true");
      h.appendChild(icon);
      h.appendChild(document.createTextNode(label));
      sec.appendChild(h);
      var ul = el("ul", "mt-5 divide-y divide-line border-t border-line");
      byKey[key].forEach(function (it) {
        var li = el("li", "py-4");
        var row = el("div", "menu-row");
        row.appendChild(el("span", "font-semibold text-[17px] sm:text-lg leading-snug", it["nazwa_" + LANG] || it.nazwa_pl));
        row.appendChild(el("span", "dots"));
        row.appendChild(el("span", "font-display text-lg font-semibold tabular-nums whitespace-nowrap", price(it.cena)));
        li.appendChild(row);
        if (LANG !== "pl") li.appendChild(el("p", "text-sm italic text-wine/80", it.nazwa_pl));
        var opis = it["opis_" + LANG] || it.opis_pl;
        if (opis) li.appendChild(el("p", "mt-1 text-[15px] text-muted", opis));
        ul.appendChild(li);
      });
      sec.appendChild(ul);
      box.appendChild(sec);
      if (nav) {
        var a = el("a", "shrink-0 rounded-full border border-line bg-surface px-4 py-2 text-sm font-semibold hover:border-wine hover:text-wine transition whitespace-nowrap", label);
        a.href = "#" + id;
        nav.appendChild(a);
      }
    });
    if (status) {
      if (live) {
        var tx = TXT[LANG] || TXT.pl;
        status.textContent = tx.live + " · " + tx.o + " " + new Date().toLocaleTimeString(LANG, { hour: "2-digit", minute: "2-digit", second: "2-digit" });
        status.classList.remove("hidden");
      } else status.classList.add("hidden");
    }
    return true;
  }

  /* Zwykły link do arkusza (…/spreadsheets/d/ID/edit#gid=0) zamieniamy na eksport CSV bez pamięci podręcznej. */
  function sheetUrl(url) {
    var m = url.match(/docs\.google\.com\/spreadsheets\/d\/([a-zA-Z0-9_-]{20,})/);
    if (m && url.indexOf("/d/e/") < 0) {
      var gid = (url.match(/[#&?]gid=(\d+)/) || [])[1];
      url = "https://docs.google.com/spreadsheets/d/" + m[1] + "/gviz/tq?tqx=out:csv&headers=1" + (gid ? "&gid=" + gid : "");
    }
    return url + (url.indexOf("?") >= 0 ? "&" : "?") + "_=" + Date.now();
  }

  var fallback = [];
  try { fallback = JSON.parse(document.getElementById("menu-dane").textContent); } catch (e) { fallback = []; }
  render(fallback, false);

  var url = String(typeof SHEET_CSV_URL === "string" ? SHEET_CSV_URL : "").trim();
  if (!url) return;
  var ctrl = window.AbortController ? new AbortController() : null;
  var timer = setTimeout(function () { if (ctrl) ctrl.abort(); }, 7000);
  fetch(sheetUrl(url), { cache: "no-store", signal: ctrl ? ctrl.signal : undefined })
    .then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.text(); })
    .then(function (text) {
      var items = itemsFromCSV(text);
      if (!items.length || !render(items, true)) throw new Error("arkusz bez pozycji menu");
    })
    .catch(function (err) {
      if (window.console) console.warn("Menu z arkusza niedostępne, pokazuję menu zapisane w stronie:", err && err.message);
      render(fallback, false);
    })
    .then(function () { clearTimeout(timer); });
})();
