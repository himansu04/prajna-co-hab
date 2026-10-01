/* Prajna photo gallery: filtered editorial grid, restrained 3D, native modal viewer. */
(function () {
  "use strict";

  var grid = document.getElementById("gallery-grid");
  var dialog = document.getElementById("gallery-dialog");
  if (!grid || !dialog || !dialog.showModal) return;

  var items = Array.prototype.slice.call(grid.querySelectorAll(".gallery-item"));
  var filters = Array.prototype.slice.call(document.querySelectorAll("[data-filter]"));
  var count = document.getElementById("gallery-count");
  var photo = dialog.querySelector(".gallery-dialog-image");
  var caption = dialog.querySelector(".gallery-dialog-caption");
  var counter = dialog.querySelector(".gallery-dialog-count");
  var active = [];
  var current = 0;
  var returnFocus = null;
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia && window.matchMedia("(pointer:fine)").matches;

  function labelCount(n) {
    return n + (n === 1 ? " photograph" : " photographs");
  }

  function applyFilter(value) {
    filters.forEach(function (button) {
      var selected = button.getAttribute("data-filter") === value;
      button.setAttribute("aria-pressed", selected ? "true" : "false");
    });
    items.forEach(function (item) {
      item.hidden = value !== "all" && item.getAttribute("data-category") !== value;
    });
    active = items.filter(function (item) { return !item.hidden; });
    count.textContent = labelCount(active.length);
  }

  filters.forEach(function (button) {
    button.addEventListener("click", function () {
      applyFilter(button.getAttribute("data-filter"));
    });
  });
  applyFilter("all");

  function paint(index) {
    if (!active.length) return;
    current = (index + active.length) % active.length;
    var item = active[current];
    var link = item.querySelector(".gallery-image-link");
    var image = item.querySelector("img");
    var title = item.querySelector("figcaption > span");
    photo.src = link.href;
    photo.alt = image.alt;
    caption.textContent = title ? title.textContent : image.alt;
    counter.textContent = (current + 1) + " of " + active.length;
  }

  grid.addEventListener("click", function (event) {
    var link = event.target.closest(".gallery-image-link");
    if (!link) return;
    event.preventDefault();
    active = items.filter(function (item) { return !item.hidden; });
    var item = link.closest(".gallery-item");
    paint(active.indexOf(item));
    returnFocus = link;
    dialog.showModal();
    log("gallery_open", item.getAttribute("data-category"));
  });

  dialog.addEventListener("close", function () {
    if (returnFocus && document.contains(returnFocus)) returnFocus.focus({ preventScroll: true });
    returnFocus = null;
  });
  dialog.querySelector(".gallery-close").addEventListener("click", function () { dialog.close(); });
  dialog.querySelector(".gallery-prev").addEventListener("click", function () { paint(current - 1); });
  dialog.querySelector(".gallery-next").addEventListener("click", function () { paint(current + 1); });
  dialog.addEventListener("click", function (event) {
    if (event.target === dialog) dialog.close();
  });
  dialog.addEventListener("keydown", function (event) {
    if (event.key === "ArrowLeft") { event.preventDefault(); paint(current - 1); }
    if (event.key === "ArrowRight") { event.preventDefault(); paint(current + 1); }
  });

  var touchX = null;
  dialog.addEventListener("touchstart", function (event) {
    touchX = event.touches[0].clientX;
  }, { passive: true });
  dialog.addEventListener("touchend", function (event) {
    if (touchX === null) return;
    var delta = event.changedTouches[0].clientX - touchX;
    if (Math.abs(delta) > 48) paint(current + (delta < 0 ? 1 : -1));
    touchX = null;
  }, { passive: true });

  if (finePointer && !reduceMotion) {
    grid.addEventListener("pointermove", function (event) {
      var link = event.target.closest(".gallery-image-link");
      if (!link) return;
      var box = link.getBoundingClientRect();
      var x = (event.clientX - box.left) / box.width - 0.5;
      var y = (event.clientY - box.top) / box.height - 0.5;
      link.style.setProperty("--tilt-x", (-y * 3.2).toFixed(2) + "deg");
      link.style.setProperty("--tilt-y", (x * 3.2).toFixed(2) + "deg");
      link.classList.add("is-tilting");
    });
    grid.addEventListener("pointerout", function (event) {
      var link = event.target.closest(".gallery-image-link");
      if (!link || link.contains(event.relatedTarget)) return;
      link.classList.remove("is-tilting");
      link.style.removeProperty("--tilt-x");
      link.style.removeProperty("--tilt-y");
    });
  }

  if (!reduceMotion && "IntersectionObserver" in window) {
    document.documentElement.classList.add("gallery-motion-ready");
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("gallery-visible");
        observer.unobserve(entry.target);
      });
    }, { rootMargin: "0px 0px -48px 0px", threshold: 0.08 });
    items.forEach(function (item) { observer.observe(item); });
  }

  function log(eventName, extra) {
    var endpoint = (window.PRAJNA || {}).endpoint;
    if (!endpoint || !navigator.sendBeacon) return;
    try {
      navigator.sendBeacon(endpoint, JSON.stringify({
        type: "visit", event: eventName, page: location.pathname,
        extra: extra || "", ref: document.referrer || "",
        screen: (screen.width || 0) + "x" + (screen.height || 0),
        lang: navigator.language || ""
      }));
    } catch (error) { /* analytics must never block the gallery */ }
  }
})();
