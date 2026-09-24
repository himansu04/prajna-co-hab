/* ============================================
   MOCKUP ONLY — sample data for the review build.
   NEVER deploy this file to the production site.
   ============================================ */
window.PRAJNA = {
  phone: "919800000000",          // SAMPLE number — dead by design
  twinRent: 6500,                 // SAMPLE rate
  singleRent: 9500,               // SAMPLE rate
  deposit: 6500,                  // SAMPLE deposit
  foodIncluded: "included",       // SAMPLE food mode
  availability: "2 twin beds open — book a visit", // SAMPLE status
  endpoint: "",                   // demo mode
  community: "",
  ownerNote: "Family-run. Owner-managed. No broker."
};
/* olive MOCKUP ribbon so reviewers never mistake sample for real */
(function(){
  function ribbon(){
    if(document.getElementById("mockupRibbon")) return;
    var r = document.createElement("div");
    r.id = "mockupRibbon";
    r.textContent = "MOCKUP BUILD — SAMPLE DATA, NOT LIVE PRICES";
    r.style.cssText = "position:fixed;top:0;left:0;right:0;z-index:9999;background:#6b6b2a;color:#fff;font-family:Verdana,Arial,sans-serif;font-size:.7rem;letter-spacing:.14em;text-transform:uppercase;text-align:center;padding:.3rem 0;pointer-events:none";
    document.body.appendChild(r);
  }
  if(document.readyState === "loading"){ document.addEventListener("DOMContentLoaded", ribbon); } else { ribbon(); }
})();
