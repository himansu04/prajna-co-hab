/* =====================================================
   PRAJNA CO-HAB — single source of truth.
   Fill these once; every page reads from here.
   ===================================================== */
window.PRAJNA = window.PRAJNA || {
  phone: null,              // PG WhatsApp number, digits only e.g. "919812345678"
  twinRent: null,           // e.g. 6500
  singleRent: null,         // e.g. 9500
  deposit: null,            // e.g. 6500
  foodIncluded: null,       // "included" | "optional" | "notprovided"
  availability: null,       // e.g. "3 twin beds open — singles full"
  endpoint: "",             // Google Apps Script /exec URL (free data capture). Empty = demo mode.
  community: "",            // WhatsApp Community/Group invite link for the Automotive Hub
  ownerNote: "Family-run. Owner-managed. No broker."
};

(function(){
  var C = window.PRAJNA;
  function wa(msg){ return "https://wa.me/" + C.phone + "?text=" + encodeURIComponent(msg || "Hi, I want to book a visit to Prajna Co-hab. Please share availability."); }
  function inr(n){ return "\u20B9" + Number(n).toLocaleString("en-IN"); }
  function set(key, val){ var els = document.querySelectorAll('[data-cfg="'+key+'"]'); for(var i=0;i<els.length;i++){ els[i].textContent = val; } }

  /* nav active state */
  var here = location.pathname.split("/").pop() || "index.html";
  var links = document.querySelectorAll(".navlinks a");
  for(var i=0;i<links.length;i++){
    var href = links[i].getAttribute("href");
    if(href === here){ links[i].className = "on"; }
  }

  /* availability badge */
  if(C.availability){
    var b = document.getElementById("availbadge");
    if(b){ b.textContent = C.availability; b.style.display = "inline-block"; }
  }

  /* prices + food */
  set("twinRent", C.twinRent ? inr(C.twinRent) + " / month" : "Ask today's rate on WhatsApp");
  set("singleRent", C.singleRent ? inr(C.singleRent) + " / month" : "Ask today's rate on WhatsApp");
  var foodWord = C.foodIncluded === "included" ? "included in the rent" : (C.foodIncluded === "optional" ? "available as an optional add-on" : "not provided; kitchen access available");
  set("foodWord", foodWord);
  set("foodLineTwin", "Food " + foodWord);
  set("foodLineSingle", "Food " + foodWord);
  if(C.deposit){
    var d = document.getElementById("depositline");
    if(d){ d.textContent = "Security deposit: " + inr(C.deposit) + " (refundable per agreement)"; d.style.display = "list-item"; }
  }

  /* whatsapp + call links (data-wamsg allows custom prefill per button) */
  var wlinks = document.querySelectorAll(".wa-link");
  for(var j=0;j<wlinks.length;j++){
    var msg = wlinks[j].getAttribute("data-wamsg") || "Hi, I want to book a visit to Prajna Co-hab. Please share availability.";
    wlinks[j].setAttribute("href", wa(msg));
    wlinks[j].setAttribute("target", "_blank");
    wlinks[j].setAttribute("rel", "noopener");
  }
  var call = document.getElementById("calllink");
  if(call && C.phone){ call.setAttribute("href", "tel:+" + C.phone); }
  var ld = document.getElementById("ldjson");
  if(ld && C.phone){
    try{ var o = JSON.parse(ld.textContent); o.telephone = "+" + C.phone; ld.textContent = JSON.stringify(o); }catch(e){}
  }
  var comm = document.getElementById("communitylink");
  if(comm){ if(C.community){ comm.href = C.community; } else { comm.removeAttribute("href"); comm.style.opacity = .5; } }

  /* forms → free backend (Google Sheets via Apps Script) */
  function showResult(f, text){
    var r = f.querySelector(".fresult");
    if(r){ r.textContent = text; r.className = "fresult show"; }
  }
  var forms = document.querySelectorAll("form[data-formtype]");
  for(var k=0;k<forms.length;k++){
    (function(f){
      f.addEventListener("submit", function(ev){
        ev.preventDefault();
        var data = { type: f.getAttribute("data-formtype") };
        var els = f.querySelectorAll("input[name],select[name],textarea[name]");
        for(var m=0;m<els.length;m++){ data[els[m].name] = els[m].value; }
        if(!C.endpoint){
          showResult(f, "Saved in demo mode. Connect the free Google Sheets backend (5-minute setup in DEPLOY.md) and this lands in your sheet for real.");
          f.reset();
          return;
        }
        fetch(C.endpoint, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(data) })
          .then(function(){ f.reset(); showResult(f, data.type === "board" ? "Posted. It appears on the board once the owner clears it." : "Got it. The owner will get back to you on WhatsApp or by call."); })
          .catch(function(){ showResult(f, "Network hiccup — please try once more, or just WhatsApp us."); });
      });
    })(forms[k]);
  }

  /* automotive board */
  var board = document.getElementById("board");
  if(board){
    var seed = [
      { name:"Owner", topic:"Welcome", msg:"Ask anything about vehicles around the Bhosari\u2013Chakan belt: mechanics you trust, spare-part shops, used bike deals, RTO and insurance doubts, or carpooling to shifts. Keep it helpful and on-topic." },
      { name:"Demo post", topic:"Mechanic", msg:"This is a sample post so you can see how the board reads. Real posts arrive once the free backend is connected and moderation is switched on." },
      { name:"Demo post", topic:"Carpool", msg:"Another sample: shift workers from the same MIDC gate can find each other here and share rides." }
    ];
    function render(list, demo){
      board.innerHTML = "";
      for(var n=0;n<list.length;n++){
        var el = document.createElement("div"); el.className = "post";
        var meta = document.createElement("div"); meta.className = "meta";
        meta.innerHTML = list[n].name + ' <span class="topic">' + (list[n].topic || "General") + "</span> " + (demo ? '<span class="demo-tag">demo</span>' : "");
        var body = document.createElement("p"); body.textContent = list[n].message || list[n].msg || "";
        el.appendChild(meta); el.appendChild(body); board.appendChild(el);
      }
    }
    render(seed, true);
    if(C.endpoint){
      fetch(C.endpoint + "?type=board")
        .then(function(r){ return r.json(); })
        .then(function(list){ if(list && list.length){ render(list, false); } })
        .catch(function(){});
    }
  }

  /* gallery lightbox */
  var gal = document.querySelector(".gal");
  if(gal){
    var lb = document.createElement("div"); lb.className = "lb";
    lb.innerHTML = '<img alt=""><div class="cap"></div>';
    document.body.appendChild(lb);
    gal.addEventListener("click", function(ev){
      var fig = ev.target.closest("figure"); if(!fig){ return; }
      var img = fig.querySelector("img");
      if(!img || !img.getAttribute("src")){ return; }
      lb.querySelector("img").src = img.src;
      lb.querySelector(".cap").textContent = (fig.querySelector("figcaption") || {}).textContent || "";
      lb.className = "lb show";
    });
    lb.addEventListener("click", function(){ lb.className = "lb"; });
  }

  /* footer year */
  var yr = document.getElementById("yr"); if(yr){ yr.textContent = new Date().getFullYear(); }

  /* ---------- v4 polish layer ---------- */
  var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* sticky header shadow */
  var hd = document.querySelector("header");
  function onScroll(){
    if(!hd){ return; }
    if(window.scrollY > 8){ hd.classList.add("scrolled"); } else { hd.classList.remove("scrolled"); }
  }
  window.addEventListener("scroll", onScroll, { passive:true });
  onScroll();

  /* reveal on scroll */
  var rEls = document.querySelectorAll(".reveal");
  if(!reduced && "IntersectionObserver" in window){
    var io = new IntersectionObserver(function(entries){
      for(var q=0;q<entries.length;q++){
        if(entries[q].isIntersecting){ entries[q].target.classList.add("in"); io.unobserve(entries[q].target); }
      }
    }, { threshold:.1, rootMargin:"0px 0px -5% 0px" });
    for(var r=0;r<rEls.length;r++){ io.observe(rEls[r]); }
  } else {
    for(var s=0;s<rEls.length;s++){ rEls[s].classList.add("in"); }
  }

  /* gentle 3D tilt on cards (desktop pointers only) */
  if(!reduced && window.matchMedia && window.matchMedia("(pointer:fine)").matches){
    var tilts = document.querySelectorAll(".tilt");
    for(var t=0;t<tilts.length;t++){
      (function(el){
        el.addEventListener("mousemove", function(ev){
          var b = el.getBoundingClientRect();
          var x = (ev.clientX - b.left) / b.width - .5;
          var y = (ev.clientY - b.top) / b.height - .5;
          el.style.transform = "perspective(900px) rotateX(" + (-y*4.5).toFixed(2) + "deg) rotateY(" + (x*4.5).toFixed(2) + "deg) translateY(-3px)";
        });
        el.addEventListener("mouseleave", function(){ el.style.transform = ""; });
      })(tilts[t]);
    }
  }
})();
