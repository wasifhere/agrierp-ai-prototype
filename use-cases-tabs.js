/**
 * AgriCompanion — Use Cases, tabbed variant behaviour
 *  - WAI-ARIA tabs: click, ←/→ (wraps), Home/End; automatic activation; inactive panels are inert.
 *  - Sliding green indicator follows the active tab; on narrow screens the bar scrolls it into view.
 *  - Scroll reveal: header, tab bar, then the active panel (reuses use-cases.css reveal states).
 *  - Tab switch: outgoing panel fades, incoming replays a quicker staggered reveal.
 *  - Touch swipe on the panel moves to the next/previous tab.
 *  - Deep link: #uct-panel-N opens that tab on load.
 * Without JS: tab bar hidden, all panels stacked and visible.
 */
(function () {
  "use strict";

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
  var forEach = function (list, fn) { Array.prototype.forEach.call(list, fn); };

  function init(section) {
    if (section.__uctInit) return;
    section.__uctInit = true;

    var tablist = section.querySelector('[role="tablist"]');
    var tabs = Array.prototype.slice.call(section.querySelectorAll('[role="tab"]'));
    var panels = tabs.map(function (t) { return document.getElementById(t.getAttribute("aria-controls")); });
    var indicator = section.querySelector(".uc-tabs__indicator");
    var panelsWrap = section.querySelector(".uc-panels");
    if (!tablist || !tabs.length || panels.indexOf(null) !== -1) return;

    // Stagger indices (same scheme as use-cases.js)
    forEach(section.querySelectorAll("[data-uc-reveal]"), function (wrap) {
      forEach(wrap.children, function (el, i) { el.style.setProperty("--uc-i", i); });
    });
    panels.forEach(function (panel) {
      var kids = panel.querySelectorAll(".uc-row__text > *");
      forEach(kids, function (el, i) { el.style.setProperty("--uc-i", i); });
      forEach(panel.querySelectorAll(".uc-list__item"), function (el, i) { el.style.setProperty("--uc-i", kids.length - 1 + i); });
    });

    var current = Math.max(0, tabs.findIndex(function (t) { return t.getAttribute("aria-selected") === "true"; }));
    var fromHash = panels.findIndex(function (p) { return "#" + p.id === location.hash; });
    if (fromHash !== -1) current = fromHash;
    var revealed = false;
    var hasIO = "IntersectionObserver" in window;

    // --- Enable tabbed mode -------------------------------------------------
    section.classList.add("uc--no-anim", "uct--ready");
    if (hasIO) section.classList.add("uc--js");
    tabs.forEach(function (tab, i) {
      var on = i === current;
      tab.setAttribute("aria-selected", on ? "true" : "false");
      tab.tabIndex = on ? 0 : -1;
      panels[i].classList.toggle("is-active", on);
      panels[i].inert = !on;
    });
    if (indicator) indicator.style.transition = "none";
    placeIndicator(false);
    void section.offsetWidth;
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        section.classList.remove("uc--no-anim");
        if (indicator) indicator.style.transition = "";
      });
    });

    function placeIndicator(smoothScroll) {
      var tab = tabs[current];
      if (indicator) {
        indicator.style.width = tab.offsetWidth + "px";
        indicator.style.setProperty("--uct-x", tab.offsetLeft + "px");
      }
      if (tablist.scrollWidth > tablist.clientWidth + 1) {
        var left = tab.offsetLeft - (tablist.clientWidth - tab.offsetWidth) / 2;
        tablist.scrollTo({ left: left, behavior: smoothScroll && !reduce.matches ? "smooth" : "auto" });
      }
    }

    // --- Scroll reveal ------------------------------------------------------
    if (hasIO) {
      var targets = Array.prototype.slice.call(section.querySelectorAll("[data-uc-reveal]")).concat([panelsWrap]);
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var el = entry.target;
          io.unobserve(el);
          if (el === panelsWrap) { revealed = true; panels[current].classList.add("is-visible"); }
          else el.classList.add("is-visible");
        });
      }, { rootMargin: "0px 0px -15% 0px", threshold: 0.15 });
      targets.forEach(function (t) {
        if (t.getBoundingClientRect().bottom < 0) {   // already scrolled past (reload mid-page)
          if (t === panelsWrap) { revealed = true; panels[current].classList.add("is-visible"); }
          else t.classList.add("is-visible");
        } else io.observe(t);
      });
    } else {
      revealed = true;
    }

    // --- Selecting a tab ----------------------------------------------------
    var leaveTimer = null;
    function select(next, opts) {
      opts = opts || {};
      if (next === current) { if (opts.focus) tabs[next].focus(); return; }
      var prev = current;
      current = next;

      tabs.forEach(function (tab, i) {
        var on = i === next;
        tab.setAttribute("aria-selected", on ? "true" : "false");
        tab.tabIndex = on ? 0 : -1;
      });
      if (opts.focus) tabs[next].focus({ preventScroll: true });
      placeIndicator(true);

      var outP = panels[prev], inP = panels[next];
      outP.inert = true;
      inP.inert = false;
      clearTimeout(leaveTimer);
      panels.forEach(function (p, i) { if (i !== prev && i !== next) p.classList.remove("is-active", "is-leaving", "is-switching"); });

      var animate = !reduce.matches && hasIO && revealed;
      if (!animate) {
        outP.classList.remove("is-active", "is-leaving");
        inP.classList.add("is-active");
        if (revealed) inP.classList.add("is-visible");
        return;
      }

      // reset incoming panel to its hidden state without transitions
      inP.classList.add("uct--reset");
      inP.classList.remove("is-visible", "is-leaving");
      inP.classList.add("is-active", "is-switching");
      void inP.offsetWidth;
      inP.classList.remove("uct--reset");

      outP.classList.add("is-leaving");
      leaveTimer = setTimeout(function () {
        outP.classList.remove("is-active", "is-leaving", "is-switching");
      }, 170);

      requestAnimationFrame(function () {
        requestAnimationFrame(function () { inP.classList.add("is-visible"); });
      });
    }

    tabs.forEach(function (tab, i) {
      tab.addEventListener("click", function () { select(i); });
    });
    tablist.addEventListener("keydown", function (e) {
      var n = tabs.length, to = null;
      if (e.key === "ArrowRight") to = (current + 1) % n;
      else if (e.key === "ArrowLeft") to = (current - 1 + n) % n;
      else if (e.key === "Home") to = 0;
      else if (e.key === "End") to = n - 1;
      if (to === null) return;
      e.preventDefault();
      select(to, { focus: true });
    });

    // --- Touch swipe on the panel area ------------------------------------
    var sx = 0, sy = 0, tracking = false;
    panelsWrap.addEventListener("touchstart", function (e) {
      if (e.touches.length !== 1) { tracking = false; return; }
      tracking = true; sx = e.touches[0].clientX; sy = e.touches[0].clientY;
    }, { passive: true });
    panelsWrap.addEventListener("touchend", function (e) {
      if (!tracking) return;
      tracking = false;
      var t = e.changedTouches[0], dx = t.clientX - sx, dy = t.clientY - sy;
      if (Math.abs(dx) < 50 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
      var n = tabs.length;
      select(dx < 0 ? Math.min(n - 1, current + 1) : Math.max(0, current - 1));
    }, { passive: true });

    // --- Edge fades for the scrollable bar ---------------------------------
    function edges() {
      var max = tablist.scrollWidth - tablist.clientWidth;
      tablist.classList.toggle("can-left", max > 1 && tablist.scrollLeft > 2);
      tablist.classList.toggle("can-right", max > 1 && tablist.scrollLeft < max - 2);
    }
    tablist.addEventListener("scroll", edges, { passive: true });

    // --- Keep indicator aligned on resize / font load ------------------------
    if ("ResizeObserver" in window) new ResizeObserver(function () { placeIndicator(false); edges(); }).observe(tablist);
    else window.addEventListener("resize", function () { placeIndicator(false); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { placeIndicator(false); edges(); });
  }

  function boot() { forEach(document.querySelectorAll("[data-uc-tabs]"), init); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
