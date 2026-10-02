/* =====================================================
   PRAJNA CO-HAB — single source of truth.
   Fill these once; every page reads from here.
   ===================================================== */
window.PRAJNA = window.PRAJNA || {
  phone: null,              // NEVER publish. left blank on purpose.
  twinRent: null,           // e.g. 6500
  singleRent: null,         // e.g. 9500
  deposit: null,            // e.g. 6500
  foodIncluded: null,       // "included" | "optional" | "notprovided"
  availability: null,       // e.g. "3 twin beds open — singles full"
  endpoint: "",             // Google Apps Script /exec URL (free data capture). Empty = demo mode.
  community: "",            // optional: any invite URL you want the Pit button to use
  ownerNote: "Family-run. Run by us. No broker."
};

(function(){
  var C = window.PRAJNA;
  /* v53: THE CONTACT CHANNEL IS EMAIL.
     The owner's number is never published. A visitor writes, and the
     number comes out in the reply if they want to talk. wa() is gone:
     every WhatsApp deep link on this site pointed at a channel we
     have deliberately closed. mail() returns null when no address is
     configured, so a CTA can never open an empty mail client. */
  function mail(subject, body){
    if(!C.email || C.email.indexOf("@") < 1){ return null; }
    var s = subject || "Prajna Co-hab enquiry";
    var b = body || "Hi,\n\nI saw the Prajna Co-hab site and I'd like to ask about rooms.\n\nMove-in month:\nRoom type (double sharing / private):\nWith or without dinner:\n\nMy phone number (so you can reply or call if easier):\n\nThanks.";
    return "mailto:" + C.email + "?subject=" + encodeURIComponent(s) + "&body=" + encodeURIComponent(b);
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
  /* v53: two meal plans per room type. Dinner is INCLUDED in the "meal"
     price and nothing else is - the site states that rather than
     implying full board. */
  var rj = C.twinRent ? inr(C.twinRent) : "-";
  var rjm = C.twinRentMeal ? inr(C.twinRentMeal) : "-";
  var rs = C.singleRent ? inr(C.singleRent) : "-";
  var rsm = C.singleRentMeal ? inr(C.singleRentMeal) : "-";
  set("twinRent", rj + " / month");
  set("twinRentMeal", rjm + " / month");
  set("singleRent", rs + " / month");
  set("singleRentMeal", rsm + " / month");

  var foodWord = "dinner included in the meal plan";
  set("foodWord", foodWord);
  set("foodLineTwin", "Dinner included with the meal plan");
  set("foodLineSingle", "Dinner included with the meal plan");

  var dl = document.getElementById("depositline");
  var depBits = [];
  if(C.twinDeposit) depBits.push("Double sharing " + inr(C.twinDeposit));
  if(C.singleDeposit) depBits.push("Private " + inr(C.singleDeposit));
  if(dl && depBits.length){
    dl.textContent = "Refundable deposit: " + depBits.join(" · ");
    dl.style.display = "list-item";
  }

  /* first-month cost card: rent + refundable deposit, per meal plan */
  set("costTwin", C.twinRent && C.twinDeposit ? inr(C.twinRent + C.twinDeposit) + " (rent + deposit)" : "-");
  set("costTwinMeal", C.twinRentMeal && C.twinDeposit ? inr(C.twinRentMeal + C.twinDeposit) + " (rent + deposit)" : "-");
  set("costSingle", C.singleRent && C.singleDeposit ? inr(C.singleRent + C.singleDeposit) + " (rent + deposit)" : "-");
  set("costSingleMeal", C.singleRentMeal && C.singleDeposit ? inr(C.singleRentMeal + C.singleDeposit) + " (rent + deposit)" : "-");

  if(C.lockInMonths && C.noticeMonths){
    var terms = document.getElementById("termsline");
    if(terms){
      terms.textContent = C.lockInMonths + "-month lock-in, " + C.noticeMonths + "-month notice to leave.";
      terms.style.display = "block";
    }
  }

  /* email CTAs (data-mailsubject lets each button pre-fill its own subject) */
  var mlinks = document.querySelectorAll(".mail-link");
  for(var j=0;j<mlinks.length;j++){
    var subj = mlinks[j].getAttribute("data-mailsubject") || "Prajna Co-hab enquiry";
    var url = mail(subj, mlinks[j].getAttribute("data-mailbody"));
    if(!url){
      /* no address configured: take the CTA out of the tab order and the
         layout rather than parking a link that opens an empty mail client. */
      mlinks[j].setAttribute("aria-hidden","true");
      mlinks[j].setAttribute("tabindex","-1");
      mlinks[j].style.display = "none";
      continue;
    }
    mlinks[j].setAttribute("href", url);
  }
  /* v53: the number is never public, so there are no tel: links anywhere.
     Any legacy #calllink is removed from the page entirely rather than
     left as a dead control. */
  var call = document.getElementById("calllink");
  if(call && call.parentNode){ call.parentNode.removeChild(call); }
  /* v53: no telephone is injected into the structured data. The number is
     never public, and a stale "+91-0000000000" in the JSON-LD is worse
     than no number at all. */
  var ld = document.getElementById("ldjson");
  if(ld){
    try{
      var o = JSON.parse(ld.textContent);
      if(o.telephone === "+91-0000000000"){ delete o.telephone; }
      ld.textContent = JSON.stringify(o);
    }catch(e){}
  }
  var comm = document.getElementById("communitylink");
  if(comm){
    if(C.community){ comm.href = C.community; comm.setAttribute("target","_blank"); comm.setAttribute("rel","noopener"); }
    else {
      /* v53: there is no WhatsApp Community. This control used to sit at
         half opacity with no explanation, reading as a broken site. Point
         it at email instead, which is the channel we actually use. */
      var cm = mail("Joining The Pit board");
      if(cm){ comm.href = cm; comm.classList.add("mail-link"); }
      else { comm.parentNode && comm.parentNode.removeChild(comm); }
    }
  }

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
          /* v53: with no Apps Script endpoint the form is not a dead end -
             it hands the visitor a pre-filled email with everything they
             typed, so their message is never lost. No number, no WhatsApp,
             and it works on any device with a mail client. */
          var typeName = data.type === "board" ? "The Pit board" : (data.type === "feedback" ? "Feedback" : "Room enquiry");
          var lines = [];
          for(var k2 in data){
            if(k2 === "type" || !data[k2]) continue;
            lines.push(k2 + ": " + data[k2]);
          }
          var link = mail(typeName + " — Prajna Co-hab", "Hi,\n\n" + lines.join("\n") + "\n\nMy phone number (so you can reply or call if easier):\n\nThanks.");
          if(link){ window.location.href = link; }
          showResult(f, "Opening your email app with everything you typed. If nothing happens, write to us at " + C.email + ".");
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
                ? "Posted. We read it before it goes up."
                : "Got it. We reply by email, and we'll call you if you left a number.");
            })
            .catch(function(){
              if (tries > 0) { setTimeout(function(){ send(payload, tries - 1); }, 1200); return; }
              if (sub) { sub.disabled = false; sub.textContent = sub.dataset.label || "Send"; }
              showResult(f, "Network hiccup \u2014 please try once more, or just email " + C.email + ".");
            });
        }
      });
    })(forms[k]);
  }

  /* automotive board */
  var board = document.getElementById("board");
  if(board){
    var seed = [
      { name:"Prajna", topic:"Welcome", msg:"Mechanics you trust, spare-part shops, used bikes, RTO doubts, carpooling \u2014 ask. Keep it on-topic." }
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
      var stale = keys.filter(function(k){ return k.indexOf("prajna-") === 0 && k !== "prajna-v59"; });
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
  if(C.email && !document.querySelector(".mail-float")){
    var wf = document.createElement("a");
    wf.className = "mail-float";
    wf.setAttribute("aria-label", "Email us");
    wf.href = mail("Prajna Co-hab enquiry");
    wf.innerHTML = '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M16 3C9.4 3 4 8.3 4 14.9c0 2.6.8 5 2.3 7L4.6 28l6.3-1.6c1.6.9 3.3 1.3 5.1 1.3 6.6 0 12-5.3 12-11.9S22.6 3 16 3zm0 21.8c-1.6 0-3.2-.4-4.6-1.2l-.3-.2-3.7 1 1-3.6-.2-.3c-1.2-1.9-1.8-4-1.8-6.1 0-5.5 4.5-9.9 9.6-9.9s9.6 4.4 9.6 9.9-4.5 10.4-9.6 10.4zm5.5-7.4c-.3-.2-1.8-.9-2.1-1s-.5-.2-.7.1-.8 1-1 1.2-.4.2-.7.1c-.3-.2-1.3-.5-2.4-1.5-.9-.8-1.5-1.8-1.7-2.1s0-.5.1-.6l.5-.6c.2-.2.2-.3.3-.5s0-.4 0-.6-.7-1.7-1-2.3c-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.6.1-.9.4-.3.3-1.1 1.1-1.1 2.7s1.2 3.1 1.3 3.3c.2.2 2.3 3.6 5.7 5 3.4 1.3 3.4.9 4 .8.6-.1 1.8-.7 2.1-1.5.3-.7.3-1.3.2-1.5-.1-.1-.3-.2-.6-.4z"/></svg>';
    document.body.appendChild(wf);
  }
})();
/* v19: live vacancy badge — count from config, date always today (IST) */
(function(){
  var b=document.getElementById('vacancy-badge'); if(!b) return;
  var cfg=window.PRAJNA||{}; var n=cfg.bedsOpen;
  if(typeof n!=='number'||n<0){b.hidden=true;return;}
  var txt=b.querySelector('.vtxt');
  if(n===0){
    /* "0 beds open" reads like a bug. Say the true thing in plain words. */
    txt.textContent='No beds free right now';
    b.removeAttribute('data-mailsubject');
    b.setAttribute('data-mailsubject','Tell me when a bed opens at Prajna Co-hab');
    b.hidden=false;
    return;
  }
  var ds=new Date().toLocaleDateString('en-IN',{weekday:'short',day:'numeric',month:'short',timeZone:'Asia/Kolkata'});
  txt.textContent=n+' bed'+(n===1?'':'s')+' open · '+ds;
  b.setAttribute('data-mailsubject','Is a bed open at Prajna Co-hab?');
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
    if(a.classList.contains('mail-link')) log('mail_click', (a.getAttribute('data-mailsubject')||'enquiry').slice(0,60));
    else if(a.classList.contains('share-btn')){ log('share_tap',''); }
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
    var txt = 'Prajna Co-hab - family-run co-living in Moshi, Pimpri-Chinchwad. Rooms from Rs 7,200 a month.';
    if(navigator.share){ navigator.share({title:'Prajna Co-hab', text:txt, url:url}).catch(function(){}); }
    else if(navigator.clipboard && navigator.clipboard.writeText){
      /* v53: the old fallback opened a wa.me share link. The number is never
         public, so sharing goes through the clipboard instead - works with
         no WhatsApp involved. */
      navigator.clipboard.writeText(txt + ' ' + url).then(function(){
        var t = document.getElementById("share-note");
        if(t){ t.textContent = "Link copied."; t.style.display = "block"; }
      }).catch(function(){});
    }
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
