/* Gospoda Trzy Doliny – strona przykładowa (pakiet Restauracja). Bez zależności, działa także z dysku (file://). */
(function () {
  "use strict";
  var LANG = (document.documentElement.lang || "pl").slice(0, 2);

  var I18N = {
    pl: { dzis: "Dziś", otwarte: "otwarte teraz", zamkniete: "teraz zamknięte" },
    de: { dzis: "Heute", otwarte: "jetzt geöffnet", zamkniete: "jetzt geschlossen" },
    en: { dzis: "Today", otwarte: "open now", zamkniete: "closed now" }
  };
  var BANER = {
    pl: { tekst: "Ta strona jest dostępna po polsku.", link: "Przejdź" },
    de: { tekst: "Diese Seite gibt es auch auf Deutsch.", link: "Zur deutschen Seite" },
    en: { tekst: "This page is also available in English.", link: "Switch to English" }
  };
  var t = I18N[LANG] || I18N.pl;

  // Godziny otwarcia: dzień ISO (1 = poniedziałek) -> [od, do]. Te same dane są w _zrodla/restauracja/strona.py.
  function codziennie(od, doGodz) { var g = {}; for (var d = 1; d <= 7; d++) g[d] = [od, doGodz]; return g; }
  var LOKALE = {
    jg: { 1: [12, 22], 2: [12, 22], 3: [12, 22], 4: [12, 22], 5: [12, 23], 6: [12, 23], 7: [12, 21] },
    cieplice: codziennie(11, 21),
    karpacz: codziennie(12, 22)
  };

  function store(key, value) {
    try {
      if (value === undefined) return window.localStorage.getItem(key);
      window.localStorage.setItem(key, value);
    } catch (e) { return null; }  // tryb prywatny albo zablokowane dane: strona działa dalej
  }

  /* --- dzisiejsze godziny -------------------------------------------------------- */
  var now = new Date();
  var isoDay = now.getDay() === 0 ? 7 : now.getDay();
  var hour = now.getHours() + now.getMinutes() / 60;
  document.querySelectorAll("[data-dzis]").forEach(function (el) {
    var g = (LOKALE[el.getAttribute("data-dzis")] || {})[isoDay];
    if (!g) return;
    var open = hour >= g[0] && hour < g[1];
    el.innerHTML = '<i class="fa-regular fa-clock mr-1.5" aria-hidden="true"></i>' + t.dzis + " " + g[0] + ":00–" + g[1] + ":00 · " +
      (open ? t.otwarte : '<span class="text-muted font-normal">' + t.zamkniete + "</span>");
  });
  document.querySelectorAll("tr[data-dni]").forEach(function (tr) {
    if (tr.getAttribute("data-dni").split(",").indexOf(String(isoDay)) >= 0) tr.classList.add("dzis");
  });

  /* --- okna: pakiet i rezerwacja ---------------------------------------------------- */
  var lastFocus = null;
  function openModal(id) {
    var m = document.getElementById(id);
    if (!m) return false;
    lastFocus = document.activeElement;
    m.hidden = false;
    document.documentElement.style.overflow = "hidden";
    var f = m.querySelector("[data-autofocus]") || m.querySelector("button, a, input, select");
    if (f) f.focus();
    return true;
  }
  function closeModal(m) {
    m.hidden = true;
    document.documentElement.style.overflow = "";
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  document.querySelectorAll("[data-modal-open]").forEach(function (b) {
    b.addEventListener("click", function () { openModal(b.getAttribute("data-modal-open")); });
  });
  document.querySelectorAll("[data-rez-open]").forEach(function (b) {
    b.addEventListener("click", function () {
      var modal = document.getElementById("modal-rezerwacja");
      if (!modal) { window.location.href = "rezerwacja.html"; return; }
      var wybor = b.getAttribute("data-rez-lokal-wybor");
      var select = modal.querySelector("[data-rez-lokal]");
      if (wybor && select) select.value = wybor;
      openModal("modal-rezerwacja");
    });
  });
  document.querySelectorAll(".modal").forEach(function (m) {
    m.querySelectorAll("[data-modal-close]").forEach(function (c) { c.addEventListener("click", function () { closeModal(m); }); });
  });
  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;
    document.querySelectorAll(".modal:not([hidden])").forEach(closeModal);
    if (menu && !menu.hidden) toggleMenu(false);
  });

  /* --- menu na telefonie -------------------------------------------------------------- */
  var toggle = document.querySelector("[data-menu-toggle]");
  var menu = document.getElementById("menu-mobile");
  function toggleMenu(show) {
    if (!toggle || !menu) return;
    menu.hidden = !show;
    toggle.setAttribute("aria-expanded", String(show));
    toggle.innerHTML = show ? '<i class="fa-solid fa-xmark" aria-hidden="true"></i>' : '<i class="fa-solid fa-bars" aria-hidden="true"></i>';
  }
  if (toggle && menu) {
    toggle.addEventListener("click", function () { toggleMenu(menu.hidden); });
    menu.querySelectorAll("a").forEach(function (a) { a.addEventListener("click", function () { toggleMenu(false); }); });
  }

  /* --- rezerwacja (wersja demonstracyjna: nic nie jest wysyłane) -------------------- */
  var today = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  document.querySelectorAll("[data-rez-data]").forEach(function (d) { d.min = today; if (!d.value) d.value = today; });
  document.querySelectorAll("form[data-demo-form]").forEach(function (form) {
    var fields = form.querySelector("[data-form-fields]");
    var done = form.querySelector("[data-form-done]");
    var error = form.querySelector("[data-form-error]");
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var missing = Array.prototype.filter.call(form.querySelectorAll("[required]"), function (el) {
        var empty = !String(el.value || "").trim();
        el.classList.toggle("border-red-500", empty);
        el.setAttribute("aria-invalid", empty ? "true" : "false");
        return empty;
      });
      if (missing.length) {
        if (error) error.classList.remove("hidden");
        missing[0].focus();
        return;
      }
      if (error) error.classList.add("hidden");
      fields.classList.add("hidden");
      done.classList.remove("hidden");
      done.focus();
    });
    var again = form.querySelector("[data-form-reset]");
    if (again) again.addEventListener("click", function () {
      form.reset();
      form.querySelectorAll("[data-rez-data]").forEach(function (d) { d.value = today; });
      done.classList.add("hidden");
      fields.classList.remove("hidden");
    });
  });

  /* --- język: zapamiętany wybór i podpowiedź dla gości z zagranicy ------------------ */
  document.querySelectorAll(".lang a[data-lang]").forEach(function (a) {
    a.addEventListener("click", function () { store("td-jezyk", a.getAttribute("data-lang")); });
  });
  var baner = document.querySelector("[data-baner-jezyka]");
  if (baner && !store("td-baner-zamkniety")) {
    var chosen = store("td-jezyk");
    var browser = (navigator.language || "").slice(0, 2).toLowerCase();
    var target = chosen && chosen !== LANG ? chosen : (!chosen && LANG === "pl" && (browser === "de" || browser === "en") ? browser : null);
    var link = target && document.querySelector('.lang a[data-lang="' + target + '"]');
    if (link && BANER[target]) {
      baner.querySelector("[data-baner-tekst]").textContent = BANER[target].tekst;
      var a = baner.querySelector("[data-baner-link]");
      a.textContent = BANER[target].link;
      a.href = link.getAttribute("href");
      a.lang = target;
      a.addEventListener("click", function () { store("td-jezyk", target); });
      baner.classList.remove("hidden");
      baner.querySelector("[data-baner-zamknij]").addEventListener("click", function () {
        baner.classList.add("hidden");
        store("td-baner-zamkniety", "1");
      });
    }
  }
})();
