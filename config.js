/* ============================================================
   Prajna Co-hab — site config
   ------------------------------------------------------------
   PRE-LAUNCH BUILD. Rates and availability are left blank so the
   site never shows an invented price or bed count. The phone is
   blank so no WhatsApp / call button can ever point at a stranger.

   To go live: fill phone, twinRent, singleRent, deposit, and
   availability (+ bedsOpen). The banner removes itself the moment
   `phone` is a real number.
   ============================================================ */
window.PRAJNA = {

  sample: true,

  twinRent: null,           // set a real monthly rent to show it
  singleRent: null,
  deposit: null,
  foodIncluded: "included", // home-style food is part of the offer
  availability: null,       // set a real string to show the badge
  bedsOpen: null,

  /* ---- CONTACT: blank until the real number is supplied ---- */
  phone: "",               // blank on purpose. wa() returns null with no
                           // phone, so every WhatsApp CTA hides itself
                           // instead of dialling a placeholder.
  endpoint: "",
  community: "",
  ownerNote: "Family-run. Owner-managed. No broker."
};

/* ---- the pre-launch banner ----
   Shows while the site is pre-launch. Kills itself the instant a real phone
   number exists in the config above, so it can never ship to a live site. */
(function(){
  function banner(){
    if(!window.PRAJNA || !window.PRAJNA.sample) return;
    if(document.getElementById("sampleBanner")) return;
    var b = document.createElement("div");
    b.id = "sampleBanner";
    b.setAttribute("role","status");
    b.textContent = "Preview — rates, availability and contact details go live soon. Photos are real.";
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
