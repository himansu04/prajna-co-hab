/* ============================================================
   Prajna Co-hab — site config
   ------------------------------------------------------------
   REVIEW BUILD. Every number below is a SAMPLE, clearly tagged
   on the page as a sample. The phone is deliberately blank so
   no WhatsApp / call button can ever point at a stranger.

   To go live: fill the six fields at the bottom. The banner
   removes itself the moment `phone` is a real number.
   ============================================================ */
window.PRAJNA = {

  /* ---- SAMPLE DATA (safe to show, tagged on the page) ---- */
  sample: true,

  twinRent: 6500,          // SAMPLE
  singleRent: 9500,        // SAMPLE
  deposit: 6500,           // SAMPLE
  foodIncluded: "included",// SAMPLE
  availability: "2 twin beds open - book a visit", // SAMPLE
  bedsOpen: 2,             // SAMPLE

  /* ---- CONTACT: blank until the real number is supplied ---- */
  phone: "",               // blank on purpose. wa() returns null with no
                           // phone, so every WhatsApp CTA hides itself
                           // instead of dialling a placeholder.
  endpoint: "",
  community: "",
  ownerNote: "Family-run. Owner-managed. No broker."
};

/* ---- the honesty banner ----
   Shows while the data is sample. Kills itself the instant a real phone
   number exists in the config above, so it can never ship to a live site. */
(function(){
  function banner(){
    if(!window.PRAJNA || !window.PRAJNA.sample) return;
    if(document.getElementById("sampleBanner")) return;
    var b = document.createElement("div");
    b.id = "sampleBanner";
    b.setAttribute("role","status");
    b.textContent = "SAMPLE DATA - rents, availability and photos are examples, not live figures. Contact details coming soon.";
    b.style.cssText =
      "position:fixed;top:0;left:0;right:0;z-index:9999;background:#6b6b2a;color:#fff;" +
      "font-size:.72rem;letter-spacing:.1em;text-align:center;padding:.4rem .8rem;" +
      "line-height:1.4;pointer-events:none;";
    document.body.appendChild(b);
    /* push the page down so the banner never covers the header */
    document.body.style.paddingTop = b.offsetHeight + "px";
  }
  if(document.readyState === "loading"){ document.addEventListener("DOMContentLoaded", banner); }
  else { banner(); }
})();
