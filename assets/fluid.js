/* Prajna Co-hab — ambient layer (v6)
   Minimal Indian folk motion: drifting rangoli rings, mandana dots, a lotus-line
   drawn in on scroll, tilt on large chrome. No libraries, no network. */
(function(){
  "use strict";
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var NS = "http://www.w3.org/2000/svg";
  if(reduce) return;

  /* 1 — ambient background canvas: slow concentric rangoli rings + drifting dots */
  function ambient(){
    var c = document.createElement("canvas");
    c.className = "bgfx";
    c.setAttribute("aria-hidden","true");
    document.body.insertBefore(c, document.body.firstChild);
    var ctx = c.getContext("2d"), dpr = Math.min(window.devicePixelRatio||1, 2);
    var w = 0, h = 0, rings = [], dots = [], t0 = performance.now();

    function resize(){
      w = window.innerWidth; h = window.innerHeight;
      c.width = Math.floor(w*dpr); c.height = Math.floor(h*dpr);
      c.style.width = w+"px"; c.style.height = h+"px";
      ctx.setTransform(dpr,0,0,dpr,0,0);
      rings = []; dots = [];
      var cx = w*0.78, cy = h*0.22;
      for(var r=0;r<6;r++) rings.push({ rad: 90 + r*78, sp: 0.00002 + r*0.000012 });
      var n = Math.max(5, Math.min(10, Math.round(w/170)));
      for(var d=0; d<n; d++) dots.push({
        x: Math.random(), y: Math.random(),
        s: 0.000008 + Math.random()*0.000014,
        r: 1 + Math.random()*1.4,
        ph: Math.random()*Math.PI*2,
        am: 10 + Math.random()*16
      });
    }

    function draw(now){
      var e = (now - t0);
      ctx.clearRect(0,0,w,h);
      var cx = w*0.78, cy = h*0.22;
      ctx.strokeStyle = "rgba(192,90,46,0.045)";
      ctx.lineWidth = 1;
      for(var i=0;i<rings.length;i++){
        var R = rings[i].rad + Math.sin(e*rings[i].sp*1000)*8;
        ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI*2); ctx.stroke();
      }
      ctx.strokeStyle = "rgba(217,164,65,0.05)";
      ctx.setLineDash([3,7]);
      ctx.beginPath(); ctx.arc(cx, cy, rings[2].rad + Math.sin(e*0.00009)*10, 0, Math.PI*2); ctx.stroke();
      ctx.setLineDash([]);
      for(var d=0; d<dots.length; d++){
        var p = dots[d];
        var x = p.x*w, y = (p.y*h) + Math.sin(e*p.s*1000 + p.ph)*p.am;
        ctx.fillStyle = "rgba(217,164,65,0.16)";
        ctx.save(); ctx.translate(x,y); ctx.rotate(Math.PI/4);
        ctx.fillRect(-p.r/2, -p.r/2, p.r, p.r);
        ctx.restore();
      }
      requestAnimationFrame(draw);
    }

    resize();
    window.addEventListener("resize", resize);
    if(!window.matchMedia("(hover: none)").matches) requestAnimationFrame(draw);
    else { ctx.clearRect(0,0,w,h); requestAnimationFrame(draw); }
  }

  /* 2 — lotus line that draws itself once, behind the family band */
  function lotuses(){
    var bands = document.querySelectorAll(".familyband, .cta-strip .wrap");
    Array.prototype.forEach.call(bands, function(el){
      if(el.querySelector(".lotusdraw")) return;
      var svg = document.createElementNS(NS,"svg");
      svg.setAttribute("class","lotusdraw");
      svg.setAttribute("viewBox","0 0 120 70");
      svg.setAttribute("aria-hidden","true");
      var paths = [
        "M60 58C54 40 54 20 60 6c6 14 6 34 0 52Z",
        "M60 58C50 46 38 34 28 16c14 8 26 26 32 42Z",
        "M60 58c10-12 22-24 32-42-14 8-26 26-32 42Z",
        "M60 58C48 52 34 50 12 50c16 10 34 12 48 8Z",
        "M60 58c12-6 26-8 48-8-16 10-34 12-48 8Z"
      ];
      paths.forEach(function(d,i){
        var path = document.createElementNS(NS,"path");
        path.setAttribute("d", d);
        path.setAttribute("fill","none");
        path.setAttribute("stroke","currentColor");
        path.setAttribute("stroke-width", i? "2.2":"2.6");
        path.setAttribute("stroke-linecap","round");
        path.style.strokeDasharray = "160";
        path.style.strokeDashoffset = "160";
        path.style.animation = "drawlotus 1.5s cubic-bezier(.22,.61,.36,1) " + (0.1 + i*0.13) + "s forwards";
        svg.appendChild(path);
      });
      el.insertBefore(svg, el.firstChild);
    });
  }

  /* 3 — the drawn path: sections, cards and tiles arrive on scroll */
  function flow(){
    var sel = "section, .card, .promises div, .menucard .day, .promises, .post, .faq details, .amen div, .step";
    var items = document.querySelectorAll(sel);
    if(!("IntersectionObserver" in window)){
      Array.prototype.forEach.call(items, function(el){ el.classList.add("flow-in"); });
      return;
    }
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(en){
        if(en.isIntersecting){ en.target.classList.add("flow-in"); io.unobserve(en.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.06 });
    Array.prototype.forEach.call(items, function(el){
      if(el.hasAttribute("data-flow")) return;
      el.setAttribute("data-flow","");
      el.classList.add("flow");
      io.observe(el);
    });
  }

  /* 4 — fluid chrome: header nudge + nav underline */
  function chrome(){
    var head = document.querySelector("header");
    if(!head) return;
    var last = window.pageYOffset, ticking = false;
    function onScroll(){
      var y = window.pageYOffset;
      if(Math.abs(y-last) > 6){ head.classList.toggle("scrolled", y > 24); last = y; }
      ticking = false;
    }
    window.addEventListener("scroll", function(){
      if(!ticking){ ticking = true; requestAnimationFrame(onScroll); }
    }, { passive: true });
    onScroll();
  }

  function boot(){ ambient(); lotuses(); flow(); chrome(); }
  if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
