/* Rubryka – strona przykładowa (pakiet Firma). Bez zależności, działa także z dysku (file://). */
(function () {
  "use strict";

  /* --- okna (pakiet) ------------------------------------------------------ */
  var lastFocus = null;
  function openModal(id) {
    var m = document.getElementById(id);
    if (!m) return;
    lastFocus = document.activeElement;
    m.hidden = false;
    document.documentElement.style.overflow = "hidden";
    var f = m.querySelector("[data-autofocus]") || m.querySelector("button, a, input");
    if (f) f.focus();
  }
  function closeModal(m) {
    m.hidden = true;
    document.documentElement.style.overflow = "";
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  document.querySelectorAll("[data-modal-open]").forEach(function (b) {
    b.addEventListener("click", function () { openModal(b.getAttribute("data-modal-open")); });
  });
  document.querySelectorAll(".modal").forEach(function (m) {
    m.querySelectorAll("[data-modal-close]").forEach(function (c) {
      c.addEventListener("click", function () { closeModal(m); });
    });
  });
  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;
    document.querySelectorAll(".modal:not([hidden])").forEach(closeModal);
    var menu = document.getElementById("menu-mobile");
    if (menu && !menu.hidden) toggleMenu(false);
  });

  /* --- menu na telefonie ---------------------------------------------------- */
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

  /* --- formularze (wersja demonstracyjna: nic nie jest wysyłane) ------------ */
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
      done.classList.add("hidden");
      fields.classList.remove("hidden");
    });
  });

  /* --- kalkulator ceny (cennik) ---------------------------------------------- */
  var calc = document.querySelector("form[data-calc]");
  if (calc) {
    var PRACOWNIK = 45, PRACOWNIK_PO_20 = 40, ZAGRANICA = 120;
    var fmt = function (n) { return n.toLocaleString("pl-PL") + " zł"; };
    var update = function () {
      var forma = calc.querySelector("input[name=forma]:checked");
      var docs = +calc.elements.dokumenty.value;
      var people = +calc.elements.pracownicy.value;
      var ksiegowosc = +forma.dataset.base + Math.max(0, docs - +forma.dataset.incl) * +forma.dataset.doc;
      var kadry = Math.min(people, 20) * PRACOWNIK + Math.max(0, people - 20) * PRACOWNIK_PO_20;
      var zagr = calc.elements.zagranica.checked ? ZAGRANICA : 0;
      document.querySelector("[data-out=dokumenty]").textContent = docs;
      document.querySelector("[data-out=pracownicy]").textContent = people;
      document.querySelector("[data-calc-part=ksiegowosc]").textContent = fmt(ksiegowosc);
      document.querySelector("[data-calc-part=kadry]").textContent = fmt(kadry);
      document.querySelector("[data-calc-part=zagranica]").textContent = fmt(zagr);
      document.querySelector("[data-calc-total]").textContent = (ksiegowosc + kadry + zagr).toLocaleString("pl-PL");
    };
    calc.addEventListener("input", update);
    calc.addEventListener("change", update);
    update();
  }
})();
