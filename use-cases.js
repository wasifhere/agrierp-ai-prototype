/**
 * AgriCompanion — Use Cases section behaviour
 *  1. Scroll reveal: header, then each row (text staggers in, media un-clips, glass card rises).
 *  2. Scroll-linked parallax on the photo and glass card (≥768px, motion allowed).
 * No dependencies. Safe to include once per page; initialises every [data-uc].
 * Content stays fully visible if this script never runs (classes are opt-in).
 */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  var wideEnough = window.matchMedia("(min-width: 768px)");

  function init(section) {
    if (section.__ucInit) return;
    section.__ucInit = true;

    var header = section.querySelector("[data-uc-reveal]");
    var rows = Array.prototype.slice.call(section.querySelectorAll("[data-uc-row]"));

    // Stagger indices for the reveal transitions
    if (header) Array.prototype.forEach.call(header.children, function (el, i) { el.style.setProperty("--uc-i", i); });
    rows.forEach(function (row) {
      var textKids = row.querySelectorAll(".uc-row__text > *");
      Array.prototype.forEach.call(textKids, function (el, i) { el.style.setProperty("--uc-i", i); });
      Array.prototype.forEach.call(row.querySelectorAll(".uc-list__item"), function (el, i) {
        el.style.setProperty("--uc-i", textKids.length - 1 + i);
      });
    });

    if (!("IntersectionObserver" in window)) return; // leave everything visible
    // Hide the not-yet-revealed state instantly (no fade-out flash on load), then re-enable transitions
    section.classList.add("uc--no-anim", "uc--js");
    void section.offsetWidth;
    window.requestAnimationFrame(function () {
      window.requestAnimationFrame(function () { section.classList.remove("uc--no-anim"); });
    });

    var targets = (header ? [header] : []).concat(rows);
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        el.classList.add("is-visible");
        io.unobserve(el);
        // After the entrance finishes, let parallax drive the transforms without lag
        window.setTimeout(function () { el.classList.add("is-settled"); }, 1200);
      });
    }, { rootMargin: "0px 0px -15% 0px", threshold: 0.15 });
    targets.forEach(function (t) { io.observe(t); });

    // Anything already above the fold (e.g. deep-link / reload mid-page) shows immediately
    targets.forEach(function (t) {
      if (t.getBoundingClientRect().bottom < 0) { t.classList.add("is-visible", "is-settled"); io.unobserve(t); }
    });

    // --- Parallax ----------------------------------------------------------
    var medias = rows.map(function (row) {
      return {
        box: row.querySelector(".uc-media"),
        bg: row.querySelector(".uc-media__bg"),
        glass: row.querySelector(".uc-media__glass")
      };
    }).filter(function (m) { return m.box && m.bg && m.glass; });

    var ticking = false;
    function clear() {
      medias.forEach(function (m) {
        m.bg.style.removeProperty("--uc-bg-par");
        m.glass.style.removeProperty("--uc-glass-par");
      });
    }
    function update() {
      ticking = false;
      if (reduceMotion.matches || !wideEnough.matches) { clear(); return; }
      var vh = window.innerHeight;
      medias.forEach(function (m) {
        var r = m.box.getBoundingClientRect();
        if (r.bottom < -100 || r.top > vh + 100) return;
        // -1 when the card's centre is at the bottom of the viewport, +1 at the top
        var p = 1 - ((r.top + r.height / 2) / vh) * 2;
        p = Math.max(-1, Math.min(1, p));
        m.bg.style.setProperty("--uc-bg-par", (p * 14).toFixed(2) + "px");
        m.glass.style.setProperty("--uc-glass-par", (p * -22).toFixed(2) + "px");
      });
    }
    function onScroll() {
      if (!ticking) { ticking = true; window.requestAnimationFrame(update); }
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    if (reduceMotion.addEventListener) {
      reduceMotion.addEventListener("change", onScroll);
      wideEnough.addEventListener("change", onScroll);
    }
    update();
  }

  function boot() {
    Array.prototype.forEach.call(document.querySelectorAll("[data-uc]"), init);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
