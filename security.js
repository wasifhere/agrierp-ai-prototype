/**
 * Trust & security section — scroll reveal + ambient motion trigger.
 * Text lines and cards stagger in, photo panel un-clips, glass card rises, source rows follow.
 * Static and fully visible without JS or with reduced motion.
 */
(function () {
  "use strict";
  function init(sec) {
    if (sec.__secInit || !("IntersectionObserver" in window)) return;
    sec.__secInit = true;
    Array.prototype.forEach.call(sec.querySelectorAll("[data-sec-in]"), function (el, i) { el.style.setProperty("--i", i); });
    Array.prototype.forEach.call(sec.querySelectorAll(".sec__trace-row"), function (el, i) { el.style.setProperty("--i", i); });
    sec.classList.add("sec--no-anim", "sec--js");
    void sec.offsetWidth;
    requestAnimationFrame(function () { requestAnimationFrame(function () { sec.classList.remove("sec--no-anim"); }); });
    function show() {
      sec.classList.add("is-visible");
      setTimeout(function () { sec.classList.add("is-settled"); }, 1600);
    }
    if (sec.getBoundingClientRect().bottom < 0) { show(); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { io.disconnect(); show(); } });
    }, { rootMargin: "0px 0px -15% 0px", threshold: 0.15 });
    io.observe(sec);
  }
  function boot() { Array.prototype.forEach.call(document.querySelectorAll("[data-sec]"), init); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
