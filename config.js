/* MOCKUP ONLY — sample data so the site reads like a finished product. Never deploy this file. */
window.PRAJNA = {
  phone: "919800000000",
  twinRent: 6500,
  singleRent: 9500,
  deposit: 6500,
  foodIncluded: "included",
  availability: "2 twin beds open — call to confirm",
  endpoint: "",
  community: "",
  ownerNote: "Family-run. Owner-managed. No broker."
};
(function(){
  function ribbon(){
    var d = document.createElement("div");
    d.textContent = "Mockup preview — sample data, not live figures";
    d.style.cssText = "position:fixed;top:0;left:0;right:0;z-index:9999;background:#7a5a1c;color:#fdf8ef;font-family:Verdana,Arial,sans-serif;font-size:.68rem;letter-spacing:.14em;text-transform:uppercase;text-align:center;padding:.4rem 0";
    document.body.appendChild(d);
  }
  if(document.readyState === "loading"){ document.addEventListener("DOMContentLoaded", ribbon); } else { ribbon(); }
})();
