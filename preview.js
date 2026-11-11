/**
 * Prototype-only device preview switcher.
 * Bottom-left glass widget: Mobile (390×844) · Tablet (768×1024) · Desktop (1440×900).
 * By default the page shows normally at the visitor's own screen size (the matching button is lit).
 * Choosing a size shows this same page inside a device-sized iframe, so the real responsive CSS and
 * animations run. Desktop on a wide screen is simply the page itself.
 * - Choice is kept in the URL (?view=mobile|tablet) so a link opens in that size.
 * - Esc returns to the full page. Respects reduced motion.
 * Not part of the production sections — don't ship.
 */
(function () {
  "use strict";
  if (window.self !== window.top) return; // inside the preview frame: no widget

  var MODES = {
    mobile:  { w: 390,  h: 844,  r: 38, label: "Mobile",  icon: "fa-mobile-screen-button" },
    tablet:  { w: 768,  h: 1024, r: 26, label: "Tablet",  icon: "fa-tablet-screen-button" },
    desktop: { w: 1440, h: 900,  r: 14, label: "Desktop", icon: "fa-desktop" }
  };
  var ORDER = ["mobile", "tablet", "desktop"];
  var current = null;

  function el(tag, cls, attrs) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (attrs) Object.keys(attrs).forEach(function (k) { n.setAttribute(k, attrs[k]); });
    return n;
  }

  // --- Widget -------------------------------------------------------------
  var bar = el("div", "pv-switch", { role: "group", "aria-label": "Preview screen size" });
  var thumb = el("span", "pv-switch__thumb", { "aria-hidden": "true" });
  bar.appendChild(thumb);
  var buttons = {};
  ORDER.forEach(function (key) {
    var m = MODES[key];
    var b = el("button", "pv-btn", { type: "button", "aria-pressed": "false", "aria-label": m.label + " preview", "data-label": m.label + " · " + m.w + "px" });
    b.innerHTML = '<i class="fa-solid ' + m.icon + '" aria-hidden="true"></i>';
    b.addEventListener("click", function () { apply(key, true); });
    buttons[key] = b;
    bar.appendChild(b);
  });
  var size = el("span", "pv-switch__size", { "aria-live": "polite" });
  bar.appendChild(size);

  // --- Stage --------------------------------------------------------------
  var stage = el("div", "pv-stage", { "aria-hidden": "true" });
  var device = el("div", "pv-device");
  var frame = el("iframe", "", { title: "Page preview" });
  var caption = el("p", "pv-caption");
  device.appendChild(frame);
  stage.appendChild(device);
  stage.appendChild(caption);

  function frameSrc() {
    return location.pathname + "?embed=1";
  }

  // "auto" = the real page at the visitor's own screen size (default; no frame)
  function autoKey() { return window.innerWidth < 600 ? "mobile" : window.innerWidth < 1200 ? "tablet" : "desktop"; }

  function layout() {
    var useFrame = current !== "auto" && (current !== "desktop" || window.innerWidth < 1200);
    var m = MODES[current] || MODES.desktop;
    if (current === "auto") markPressed(autoKey());
    stage.classList.toggle("is-on", useFrame);
    stage.setAttribute("aria-hidden", useFrame ? "false" : "true");
    document.documentElement.classList.toggle("pv-lock", useFrame);

    if (useFrame) {
      var availW = window.innerWidth - 48 - 18;              // padding + bezel
      var availH = window.innerHeight - 24 - 88 - 30 - 18;   // top pad, widget room, caption, bezel
      var s = Math.min(1, availW / m.w, availH / m.h);
      frame.style.width = m.w + "px";
      frame.style.height = m.h + "px";
      frame.style.transform = "scale(" + s + ")";
      device.style.width = Math.round(m.w * s) + "px";
      device.style.height = Math.round(m.h * s) + "px";
      device.style.setProperty("--pv-radius", Math.round(m.r * s) + "px");
      if (!frame.getAttribute("src") || frame.getAttribute("src") === "about:blank") frame.setAttribute("src", frameSrc());
      caption.textContent = m.label + " · " + m.w + " × " + m.h + (s < 0.995 ? " · shown at " + Math.round(s * 100) + "%" : "");
      size.textContent = m.w + "px";
    } else {
      if (frame.getAttribute("src") && frame.getAttribute("src") !== "about:blank") frame.setAttribute("src", "about:blank");
      size.textContent = window.innerWidth + "px";
    }
  }

  function markPressed(key) {
    ORDER.forEach(function (k) { buttons[k].setAttribute("aria-pressed", k === key ? "true" : "false"); });
    thumb.style.setProperty("--pv-x", buttons[key].offsetLeft + "px");
  }

  function apply(key, fromUser) {
    if (!MODES[key]) key = "auto";
    // Desktop on a wide screen is just the real page
    if (key === "desktop" && window.innerWidth >= 1200) key = "auto";
    current = key;
    if (key !== "auto") markPressed(key);
    layout();
    if (fromUser && history.replaceState) {
      var u = new URL(location.href);
      if (key === "auto") u.searchParams.delete("view"); else u.searchParams.set("view", key);
      history.replaceState(null, "", u.pathname + u.search + u.hash);
    }
  }

  function boot() {
    document.body.appendChild(stage);
    document.body.appendChild(bar);
    var start = new URLSearchParams(location.search).get("view");
    apply(MODES[start] ? start : "auto", false);
    window.addEventListener("resize", function () { if (current) layout(); }, { passive: true });
    function onKey(e) {
      if (e.key === "Escape" && stage.classList.contains("is-on")) apply("auto", true);
    }
    document.addEventListener("keydown", onKey);
    // Esc also works while focus is inside the preview frame (same origin)
    frame.addEventListener("load", function () {
      try { frame.contentWindow.addEventListener("keydown", onKey); } catch (err) { /* cross-origin: ignore */ }
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
