/**
 * AgriCompanion — Feature page hero behaviour
 *  1. Entrance on load: badge, title, text, CTAs, logos stagger in; photo settles; phones rise (front, then back).
 *  2. Pointer tilt (mouse, ≥992px): the phone pair tilts toward the cursor, back and front phones drift apart.
 *  3. Scroll parallax (≥768px): front phone moves up faster than the back phone as the hero scrolls away.
 *  4. [data-af-scroll] links scroll smoothly to their target and move focus there.
 * Everything is static and visible without JS or with reduced motion.
 */
(function () {
  "use strict";

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
  var tiltMq = window.matchMedia("(min-width: 992px) and (hover: hover) and (pointer: fine)");
  var parMq = window.matchMedia("(min-width: 768px)");

  function init(hero) {
    if (hero.__afInit) return;
    hero.__afInit = true;

    Array.prototype.forEach.call(hero.querySelectorAll("[data-af-in]"), function (el, i) {
      el.style.setProperty("--af-i", i);
    });

    // --- Entrance -------------------------------------------------------
    hero.classList.add("af--no-anim", "af--js");
    void hero.offsetWidth;
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        hero.classList.remove("af--no-anim");
        hero.classList.add("is-in");
        setTimeout(function () { hero.classList.add("is-settled"); }, 1700);
      });
    });

    var visual = hero.querySelector("[data-af-visual]");
    var phones = hero.querySelector(".af-hero__phones");
    var back = hero.querySelector(".af-hero__phone--back");
    var front = hero.querySelector(".af-hero__phone--front");
    if (!visual || !phones || !back || !front) return;

    // --- Pointer tilt ---------------------------------------------------
    function resetTilt() {
      phones.style.removeProperty("--af-rx");
      phones.style.removeProperty("--af-ry");
      ["--af-back-x", "--af-back-y", "--af-front-x", "--af-front-y", "--af-back-z", "--af-front-z"].forEach(function (p) {
        back.style.removeProperty(p); front.style.removeProperty(p);
      });
    }
    visual.addEventListener("pointermove", function (e) {
      if (reduce.matches || !tiltMq.matches || e.pointerType !== "mouse") return;
      var r = visual.getBoundingClientRect();
      var x = (e.clientX - r.left) / r.width - 0.5;   // -0.5 … 0.5
      var y = (e.clientY - r.top) / r.height - 0.5;
      phones.style.setProperty("--af-rx", (-y * 8).toFixed(2) + "deg");
      phones.style.setProperty("--af-ry", (x * 10).toFixed(2) + "deg");
      front.style.setProperty("--af-front-x", (x * 14).toFixed(1) + "px");
      front.style.setProperty("--af-front-y", (y * 10).toFixed(1) + "px");
      back.style.setProperty("--af-back-x", (x * -10).toFixed(1) + "px");
      back.style.setProperty("--af-back-y", (y * -6).toFixed(1) + "px");
      front.style.setProperty("--af-front-z", "30px");
      back.style.setProperty("--af-back-z", "-30px");
    });
    visual.addEventListener("pointerleave", resetTilt);

    // --- Scroll parallax ------------------------------------------------
    var ticking = false;
    function update() {
      ticking = false;
      if (reduce.matches || !parMq.matches) {
        front.style.removeProperty("--af-front-par");
        back.style.removeProperty("--af-back-par");
        return;
      }
      var r = visual.getBoundingClientRect();
      if (r.bottom < 0 || r.top > window.innerHeight) return;
      // 0 while the visual's top is at/under the viewport top, growing as it scrolls away
      var p = Math.max(0, Math.min(1, -r.top / r.height));
      front.style.setProperty("--af-front-par", (p * -70).toFixed(1) + "px");
      back.style.setProperty("--af-back-par", (p * -28).toFixed(1) + "px");
    }
    function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(update); } }
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    update();
  }

  // --- Smooth anchor scroll (works for any [data-af-scroll] on the page) --
  document.addEventListener("click", function (e) {
    var link = e.target.closest && e.target.closest("a[data-af-scroll]");
    if (!link) return;
    var id = (link.getAttribute("href") || "").slice(1);
    var target = id && document.getElementById(id);
    if (!target) return;
    e.preventDefault();
    target.scrollIntoView({ behavior: reduce.matches ? "auto" : "smooth", block: "start" });
    if (!target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1");
    target.focus({ preventScroll: true });
    if (history.replaceState) history.replaceState(null, "", "#" + id);
  });

  function boot() { Array.prototype.forEach.call(document.querySelectorAll("[data-af-hero]"), init); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
