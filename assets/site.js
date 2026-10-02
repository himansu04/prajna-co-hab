/* =====================================================
   PRAJNA CO-HAB — single source of truth.
   Fill these once; every page reads from here.
   ===================================================== */
window.PRAJNA = window.PRAJNA || {
  phone: null,              // co-hab WhatsApp number, digits only e.g. "919812345678"
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
  function wa(msg){
    if(!C.phone){ return null; }   /* v34: no number configured = no dead link */
    return "https://wa.me/" + C.phone + "?text=" + encodeURIComponent(msg || "Hi, I want to book a visit to Prajna Co-hab. Please share availability.");
  }
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

  /* first-month cost card (v5) */
  set("costTwin", (C.twinRent && C.deposit) ? inr(C.twinRent + C.deposit) + " in month one" : "Ask on WhatsApp");
  set("costSingle", (C.singleRent && C.deposit) ? inr(C.singleRent + C.deposit) + " in month one" : "Ask on WhatsApp");

  /* whatsapp + call links (data-wamsg allows custom prefill per button) */
  var wlinks = document.querySelectorAll(".wa-link");
  for(var j=0;j<wlinks.length;j++){
    var msg = wlinks[j].getAttribute("data-wamsg") || "Hi, I want to book a visit to Prajna Co-hab. Please share availability.";
    var url = wa(msg);
    if(!url){
      /* v34: no number yet — take the dead CTA out of the tab order and the
         layout rather than parking a link that goes nowhere. */
      wlinks[j].setAttribute("aria-hidden","true");
      wlinks[j].setAttribute("tabindex","-1");
      wlinks[j].style.display = "none";
      continue;
    }
    wlinks[j].setAttribute("href", url);
    wlinks[j].setAttribute("target", "_blank");
    wlinks[j].setAttribute("rel", "noopener");
  }
  var call = document.getElementById("calllink");
  if(call){
    if(C.phone){ call.setAttribute("href", "tel:+" + C.phone); }
    else{
      /* no number yet: take the dead Call link out of the tab order and layout,
         same as the WhatsApp CTAs, instead of leaving a focusable "#" jump. */
      call.setAttribute("aria-hidden","true");
      call.setAttribute("tabindex","-1");
      call.style.display = "none";
    }
  }
  var ld = document.getElementById("ldjson");
  if(ld && C.phone){
    try{ var o = JSON.parse(ld.textContent); o.telephone = "+" + C.phone; ld.textContent = JSON.stringify(o); }catch(e){}
  }
  var comm = document.getElementById("communitylink");
  if(comm){ if(C.community){ comm.href = C.community; } else { comm.removeAttribute("href"); comm.style.opacity = .5; } }

  /* forms → free backend (Google Sheets via Apps Script) */
  function showResult(f, text){
    var r = f.querySelector(".fresult");
    if(r){
      /* v34: role=status so a screen reader hears the outcome */
      r.setAttribute("role","status");
      r.setAttribute("aria-live","polite");
      r.textContent = text;
      r.className = "fresult show";
    }
  }
  var forms = document.querySelectorAll("form[data-formtype]");
  for(var k=0;k<forms.length;k++){
    (function(f){
      f.addEventListener("submit", function(ev){
        ev.preventDefault();
        var data = { type: f.getAttribute("data-formtype") };
        var els = f.querySelectorAll("input[name],select[name],textarea[name]");
        for(var m=0;m<els.length;m++){ data[els[m].name] = els[m].value; }
        var sub = f.querySelector("button[type=submit]");
        if(sub && !sub.dataset.label) sub.dataset.label = sub.textContent;
        if(!C.endpoint){
          /* v50: this used to tell visitors about DEPLOY.md, an internal file
             they will never see. Say what actually happened, in their language. */
          showResult(f, "Saved for now. This form is being connected — message us on WhatsApp or call and the owner will pick it up directly.");
          f.reset();
          return;
        }
        data.source = (location.pathname.split("/").pop() || "index.html");
        if (sub) { sub.disabled = true; sub.textContent = "Sending..."; }
        send(data, 2);

        function send(payload, tries){
          fetch(C.endpoint, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(payload) })
            .then(function(r){ return r.json().catch(function(){ return { ok: true }; }); })
            .then(function(res){
              if (res && res.ok === false) throw new Error(res.error || "server");
              f.reset();
              if (sub) { sub.disabled = false; sub.textContent = sub.dataset.label || "Send"; }
              showResult(f, data.type === "board"
                ? "Posted. It appears on the board once the owner clears it."
                : "Got it. The owner will get back to you on WhatsApp or by call.");
            })
            .catch(function(){
              if (tries > 0) { setTimeout(function(){ send(payload, tries - 1); }, 1200); return; }
              if (sub) { sub.disabled = false; sub.textContent = sub.dataset.label || "Send"; }
              showResult(f, "Network hiccup \u2014 please try once more, or just WhatsApp us.");
            });
        }
      });
    })(forms[k]);
  }

  /* automotive board */
  var board = document.getElementById("board");
  if(board){
    var seed = [
      { name:"Owner", topic:"Welcome", msg:"Mechanics you trust, spare-part shops, used bikes, RTO doubts, carpooling \u2014 ask. Keep it on-topic." }
    ];
    function render(list, demo){
      board.innerHTML = "";
      for(var n=0;n<list.length;n++){
        var el = document.createElement("div"); el.className = "post";
        var meta = document.createElement("div"); meta.className = "meta";
        /* v50: this used to build the meta line with innerHTML, splicing the
           post's name and topic straight from the endpoint into markup. Any
           markup in those fields executed. Built with real nodes + textContent
           now, so a bad value renders as text and nothing else. */
        meta.appendChild(document.createTextNode(list[n].name || ""));
        var topic = document.createElement("span"); topic.className = "topic";
        topic.textContent = list[n].topic || "General";
        meta.appendChild(topic);
        if(demo){
          var dt = document.createElement("span"); dt.className = "demo-tag";
          dt.textContent = "demo";
          meta.appendChild(document.createTextNode(" "));
          meta.appendChild(dt);
        }
        var body = document.createElement("p"); body.textContent = list[n].message || list[n].msg || "";
        el.appendChild(meta); el.appendChild(body); board.appendChild(el);
      }
    }
    render(seed, false);
    if(C.endpoint){
      fetch(C.endpoint + "?type=board")
        .then(function(r){ return r.json(); })
        .then(function(list){ if(list && list.length){ render(list, false); } })
        .catch(function(){});
    }
  }

  /* gallery lightbox */
/* v38: the .gal lightbox was dead code on every page (gallery uses the
   #gal-ss slideshow with its own zoom). Removed. */
  /* v43: the .gal lightbox block was removed in v38, but the `if(gal){`
     wrapper and its body were left behind. `gal` is never declared, so this
     threw ReferenceError on EVERY page and killed everything after it in this
     IIFE - footer year, sticky-header shadow, 3D tilt, service-worker
     registration. Deleted the whole block. */

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

  /* v38: the .reveal IntersectionObserver fought fluid.js's .flow system
     (one set transform:none!important while the other animated it). .flow
     owns arrival now, so this is gone. */

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


  /* one-time heal: if a previous deploy left a stale offline cache, clear it and reload once */
  if ("serviceWorker" in navigator && "caches" in window && !sessionStorage.getItem("prajna-healed")) {
    caches.keys().then(function(keys){
      var stale = keys.filter(function(k){ return k.indexOf("prajna-") === 0 && k !== "prajna-v50"; });
      if (!stale.length) return;
      Promise.all(stale.map(function(k){ return caches.delete(k); })).then(function(){
        sessionStorage.setItem("prajna-healed", "1");
        /* v34: purge silently. The old code reloaded mid-visit and discarded
           scroll position, focus and any half-typed form. */
      });
    }).catch(function(){});
  }

  /* installable app + offline shell (v6) */
  var mf = document.createElement("link");
  mf.rel = "manifest"; mf.href = "manifest.webmanifest";
  document.head.appendChild(mf);
  var th = document.createElement("meta");
  th.name = "theme-color"; th.content = "#c05a2e";
  document.head.appendChild(th);
  if ("serviceWorker" in navigator && location.protocol === "https:") {
    window.addEventListener("load", function(){
      navigator.serviceWorker.register("sw.js").then(function(reg){
        reg.update();
        if (reg.waiting) reg.waiting.postMessage({ type: "skip" });
      }).catch(function(){});
    });
  }

  /* desktop floating WhatsApp button (v5) — mobile keeps its bottom bar */
  if(C.phone && !document.querySelector(".wa-float")){
    var wf = document.createElement("a");
    wf.className = "wa-float";
    wf.setAttribute("aria-label", "WhatsApp us");
    wf.setAttribute("target", "_blank");
    wf.setAttribute("rel", "noopener");
    wf.href = wa("Hi, I have a question about Prajna Co-hab.");
    wf.innerHTML = '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M16 3C9.4 3 4 8.3 4 14.9c0 2.6.8 5 2.3 7L4.6 28l6.3-1.6c1.6.9 3.3 1.3 5.1 1.3 6.6 0 12-5.3 12-11.9S22.6 3 16 3zm0 21.8c-1.6 0-3.2-.4-4.6-1.2l-.3-.2-3.7 1 1-3.6-.2-.3c-1.2-1.9-1.8-4-1.8-6.1 0-5.5 4.5-9.9 9.6-9.9s9.6 4.4 9.6 9.9-4.5 10.4-9.6 10.4zm5.5-7.4c-.3-.2-1.8-.9-2.1-1s-.5-.2-.7.1-.8 1-1 1.2-.4.2-.7.1c-.3-.2-1.3-.5-2.4-1.5-.9-.8-1.5-1.8-1.7-2.1s0-.5.1-.6l.5-.6c.2-.2.2-.3.3-.5s0-.4 0-.6-.7-1.7-1-2.3c-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.6.1-.9.4-.3.3-1.1 1.1-1.1 2.7s1.2 3.1 1.3 3.3c.2.2 2.3 3.6 5.7 5 3.4 1.3 3.4.9 4 .8.6-.1 1.8-.7 2.1-1.5.3-.7.3-1.3.2-1.5-.1-.1-.3-.2-.6-.4z"/></svg>';
    document.body.appendChild(wf);
  }
})();
/* v19: live vacancy badge — count from config, date always today (IST) */
(function(){
  var b=document.getElementById('vacancy-badge'); if(!b) return;
  var cfg=window.PRAJNA||{}; var n=cfg.bedsOpen;
  if(typeof n!=='number'||n<0){b.hidden=true;return;}
  var ds=new Date().toLocaleDateString('en-IN',{weekday:'short',day:'numeric',month:'short',timeZone:'Asia/Kolkata'});
  b.querySelector('.vtxt').textContent=n+' bed'+(n===1?'':'s')+' open · '+ds;
  b.hidden=false;
})();

/* v24: visit + intent analytics - own backend, no cookies, no third party */
(function(){
  var cfg=window.PRAJNA||{}, EP=cfg.endpoint;
  function qs(k){ var m=location.search.match(new RegExp('[?&]'+k+'=([^&]*)')); return m?decodeURIComponent(m[1]):''; }
  function log(ev, extra){
    if(!EP || EP.indexOf('script.google')!==0 && EP.indexOf('https://script.google')!==0) return;
    var d={type:'visit',event:ev,page:location.pathname,ref:document.referrer||'',
      src:qs('utm_source'),med:qs('utm_medium'),cmp:qs('utm_campaign'),
      screen:(screen.width||0)+'x'+(screen.height||0),lang:navigator.language||'',extra:extra||''};
    try{ navigator.sendBeacon(EP, JSON.stringify(d)); }catch(e){}
  }
  log('page_view');
  var t0=Date.now(), sent=false;
  function dwell(){ if(sent)return; sent=true; log('dwell', Math.round((Date.now()-t0)/1000)+'s'); }
  window.addEventListener('pagehide', dwell);
  document.addEventListener('visibilitychange', function(){ if(document.visibilityState==='hidden') dwell(); });
  document.addEventListener('click', function(e){
    var a=e.target.closest ? e.target.closest('a') : null; if(!a) return;
    if(a.classList.contains('wa-link')) log('wa_click', (a.getAttribute('data-wamsg')||'').slice(0,60));
    else if(a.classList.contains('share-btn')){ /* logged separately */ }
    else if(a.getAttribute('href') && a.getAttribute('href').indexOf('tel:')===0) log('call_tap','');
    else if(a.closest('.gal')) log('gallery_open', (a.getAttribute('href')||'').split('/').pop().slice(0,40));
    else if(a.classList.contains('btn')) log('cta_click', (a.textContent||'').trim().slice(0,40));
  }, {passive:true});
})();

/* v26: send-to-a-friend - the word-of-mouth door, logged as share_tap */
(function(){
  function share(){
    var url=location.href;
    log('share_tap','');
    if(navigator.share){ navigator.share({title:'Prajna Co-hab, Moshi', text:'Family-run co-living house near Chakan MIDC - home food, no broker', url:url}).catch(function(){}); }
    else{ window.open('https://wa.me/?text='+encodeURIComponent('Prajna Co-hab, Moshi - family-run co-living near Chakan MIDC. Home food, fair rent. '+url),'_blank'); }
  }
  document.addEventListener('click', function(e){
    var b=e.target.closest ? e.target.closest('.share-btn') : null;
    if(b){ e.preventDefault(); share(); }
  }, {passive:false});
  function log(ev, extra){
    var cfg=window.PRAJNA||{}, EP=cfg.endpoint; if(!EP) return;
    try{ navigator.sendBeacon(EP, JSON.stringify({type:'visit',event:ev,page:location.pathname,extra:extra||'',src:qs('utm_source'),med:qs('utm_medium'),cmp:qs('utm_campaign'),ref:document.referrer||'',screen:(screen.width||0)+'x'+(screen.height||0),lang:navigator.language||''})); }catch(e){}
    function qs(k){ var m=location.search.match(new RegExp('[?&]'+k+'=([^&]*)')); return m?decodeURIComponent(m[1]):''; }
  }
})();
