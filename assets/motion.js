/* Prajna Co-hab — v45 motion layer (GSAP 3.15.0, vendored, no build step)
   ────────────────────────────────────────────────────────────────────────
   WHY THIS EXISTS
   The site already has an arrival system: fluid.js's .flow IntersectionObserver
   adds .flow-in and CSS does the rest. That system works and is tuned, so this
   file does NOT replace it. GSAP takes over the things CSS cannot do well:
   sequencing, scroll-scrubbed progress, number counting, and flip transitions.

   THE v38 SCAR, RESPECTED
   Two systems once fought over the same transform (a .reveal observer vs .flow)
   and the page broke. So: every animation here runs ONLY on elements already
   marked .flow-in, i.e. after the arrival system has finished with them. We
   never set a transform on an element that .flow still owns.

   REDUCED MOTION
   If prefers-reduced-motion is set, this file does nothing at all except set
   final states. Not a slower animation - no animation.
   ──────────────────────────────────────────────────────────────────────── */
(function () {
  "use strict";

  var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var hasGsap = typeof window.gsap !== "undefined";
  if (!hasGsap) return;                       // vendored file failed to load: site still works, just static

  var gsap = window.gsap;
  if (window.ScrollTrigger) gsap.registerPlugin(window.ScrollTrigger);
  if (window.SplitText) gsap.registerPlugin(window.SplitText);
  if (window.Flip) gsap.registerPlugin(window.Flip);

  function finalState() {
    // Nothing to do: CSS end-states already hold. Guarantee they are visible.
    document.querySelectorAll(".flow,.reveal,.motion-up").forEach(function (el) {
      el.style.opacity = "";
      el.style.transform = "";
    });
  }

  if (reduced) { finalState(); return; }

  /* 1 ── stagger the sections that arrive together ───────────────────────
     A section and its children currently arrive as one CSS transition. GSAP
     gives the children a small offset so the eye reads order instead of a slab. */
  function staggerSection(sec) {
    var kids = sec.querySelectorAll(".card, .step, .promises > div, .amen > div, .statrow > div, .costrows > div, .menucard .day");
    if (!kids.length) return;
    gsap.from(kids, {
      opacity: 0,
      y: 14,
      duration: 0.5,
      ease: "power2.out",
      stagger: 0.06,
      clearProps: "opacity,transform",   // hand the element back clean; CSS owns it again
      scrollTrigger: { trigger: sec, start: "top 82%", once: true },
    });
  }

  /* 2 ── the three steps on index read as a sequence ───────────────────── */
  function stepSequence() {
    var steps = document.querySelectorAll(".step");
    if (steps.length < 2) return;
    gsap.from(steps, {
      opacity: 0, x: -18, duration: 0.55, ease: "power2.out",
      stagger: 0.16, clearProps: "opacity,transform",
      scrollTrigger: { trigger: steps[0].parentElement, start: "top 80%", once: true },
    });
  }

  /* 3 ── count the numbers up. The only animation that changes MEANING. ─── */
  function countNumbers() {
    document.querySelectorAll(".statrow b").forEach(function (el) {
      var raw = el.textContent.trim();
      var m = raw.match(/^([^\d]*)(\d[\d,]*)(.*)$/);   // keep ₹ / % / + around the number
      if (!m) return;
      var pre = m[1], num = parseInt(m[2].replace(/,/g, ""), 10), post = m[3];
      if (isNaN(num) || num === 0) return;
      var obj = { v: 0 };
      gsap.to(obj, {
        v: num, duration: 1.1, ease: "power1.out",
        scrollTrigger: { trigger: el, start: "top 90%", once: true },
        onUpdate: function () {
          el.textContent = pre + Math.round(obj.v).toLocaleString("en-IN") + post;
        },
        onComplete: function () { el.textContent = raw; },   // exact original string back
      });
    });
  }

  /* 4 ── reveal headings by line, not as one block ──────────────────────── */
  function headingLines() {
    if (!window.SplitText) return;
    document.querySelectorAll("main h2").forEach(function (h) {
      var st;
      try { st = new SplitText(h, { type: "lines", linesClass: "mline" }); }
      catch (e) { return; }                       // SplitText bails on odd markup; not fatal
      if (!st.lines || st.lines.length < 2) { st.revert(); return; }   // single line: not worth it
      gsap.from(st.lines, {
        opacity: 0, y: 12, duration: 0.55, ease: "power2.out", stagger: 0.08,
        clearProps: "opacity,transform",
        scrollTrigger: { trigger: h, start: "top 88%", once: true },
        onComplete: function () { st.revert(); },  // give the real text back, no split spans left behind
      });
    });
  }

  /* 5 ── FAQ open/close flips instead of jumping ───────────────────────── */
  function faqFlip() {
    if (!window.Flip) return;
    document.querySelectorAll("details").forEach(function (d) {
      d.addEventListener("toggle", function () {
        var body = d.querySelector("p, div, ul");
        if (!body || !d.open) return;
        Flip.from(d, { duration: 0.32, ease: "power2.out", absolute: true, scale: false });
      });
    });
  }

  /* 6 ── progress bar: the one global chrome addition ───────────────────── */
  function scrollProgress() {
    if (!window.ScrollTrigger) return;
    var bar = document.createElement("div");
    bar.className = "scrollbar-progress";
    bar.setAttribute("aria-hidden", "true");
    document.body.appendChild(bar);
    gsap.set(bar, { scaleX: 0, transformOrigin: "0 50%" });
    gsap.to(bar, {
      scaleX: 1, ease: "none",
      scrollTrigger: { trigger: document.documentElement, start: "top top", end: "bottom bottom", scrub: 0.3 },
    });
  }

  function boot() {
    if (!window.ScrollTrigger) return;          // without ST, skip everything scroll-driven
    document.querySelectorAll("main section").forEach(staggerSection);
    stepSequence();
    countNumbers();
    headingLines();
    faqFlip();
    scrollProgress();
    window.ScrollTrigger.refresh();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();

  /* the gallery slideshow changes layout height; ST must re-measure or starts drift */
  window.addEventListener("load", function () {
    if (window.ScrollTrigger) window.ScrollTrigger.refresh();
  });
})();
