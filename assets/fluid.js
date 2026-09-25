/* Prajna Co-hab — ambient layer (v10)
   Folk texture, warm light and slow motion. Hand-drawn madhubani-style motifs
   drift across a gradient wash while a soft light follows the pointer.
   No libraries, no network, no images. Respects reduced-motion. */
(function(){
  "use strict";
  if(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches){
    document.documentElement.className += " reduce";
    return;
  }
  var NS = "http://www.w3.org/2000/svg";

  /* folk motifs, hand-drawn feel: lotus, fish, peacock eye, mandana diamond, sprig */
  var MOTIFS = [
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 70" fill="none" stroke="COL" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M60 58C54 40 54 20 60 6c6 14 6 34 0 52Z"/><path d="M60 58C50 46 38 34 28 16c14 8 26 26 32 42Z"/><path d="M60 58c10-12 22-24 32-42-14 8-26 26-32 42Z"/><path d="M60 58C48 52 34 50 12 50c16 10 34 12 48 8Z"/><path d="M60 58c12-6 26-8 48-8-16 10-34 12-48 8Z"/></svg>',
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 70" fill="none" stroke="COL" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 35c18-20 62-20 84 0-22 20-66 20-84 0Z"/><path d="M98 35l12-10v20Z"/><circle cx="40" cy="30" r="3"/><path d="M14 35c14 6 30 8 46 6"/><path d="M40 41c10 0 20-2 28-6"/></svg>',
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 70" fill="none" stroke="COL" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M40 52c0-22 16-38 38-38-2 24-16 40-38 38Z"/><circle cx="66" cy="30" r="7"/><circle cx="66" cy="30" r="2.4"/><path d="M78 52c8 2 16 0 22-6"/><path d="M36 56c-8 2-16 0-22-6"/></svg>',
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 70" fill="none" stroke="COL" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M60 8 84 35 60 62 36 35Z"/><path d="M60 20 72 35 60 50 48 35Z"/><circle cx="60" cy="35" r="3"/><path d="M60 8v6M60 56v6M36 35h6M78 35h6"/></svg>',
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 70" fill="none" stroke="COL" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M60 62V20"/><path d="M60 34c-12-6-22-4-30 4 12 4 22 2 30-4Z"/><path d="M60 34c12-6 22-4 30 4-12 4-22 2-30-4Z"/><path d="M60 20c-10-4-18-2-24 6 10 2 18 0 24-6Z"/><path d="M60 20c10-4 18-2 24 6-10 2-18 0-24-6Z"/><circle cx="60" cy="14" r="3"/></svg>'
  ];
  var COLS = ["%23c05a2e", "%23d9a441", "%232b2620"];

  function uri(i){ return 'url("data:image/svg+xml,' + MOTIFS[i % MOTIFS.length].replace(/COL/g, COLS[i % COLS.length]) + '")'; }

  /* 1 — the ground: animated folk texture pinned BEHIND every page, all pages */
  function ambient(){
    /* v10: the vignette is a real layer, not just a CSS rule */
    if(!document.querySelector(".vignette")){
      var v = document.createElement("div");
      v.className = "vignette";
      v.setAttribute("aria-hidden","true");
      document.body.appendChild(v);
    }

    var c = document.createElement("canvas");
    c.className = "bgfx";
    c.setAttribute("aria-hidden","true");
    document.body.insertBefore(c, document.body.firstChild);

    var ctx = c.getContext("2d"), dpr = Math.min(window.devicePixelRatio||1, 2);
    var w=0, h=0, items=[], t0=performance.now(), alt=0;
    var px=0.5, py=0.4, tx=0.5, ty=0.4;
    /* v10.1 fluid layer: large soft colour fields that drift like slow water.
       They sit under the motifs and give the page its liquid depth. */
    var BLOB_COLS=[
      [217,164,65],   /* ochre  */
      [192,90,46],    /* terracotta */
      [43,38,32],     /* ink    */
      [224,190,120]   /* pale turmeric */
    ];
    var blobs=[];

    function resize(){
      w = window.innerWidth; h = window.innerHeight;
      c.width = Math.floor(w*dpr); c.height = Math.floor(h*dpr);
      c.style.width = w+"px"; c.style.height = h+"px";
      ctx.setTransform(dpr,0,0,dpr,0,0);
      items = [];
      /* derive the motif layout from the page URL so every page looks different */
      alt = (location.pathname.split("/").pop() || "index").length;
      var n = Math.max(9, Math.min(20, Math.round((w*h)/78000)));
      for(var i=0;i<n;i++){
        items.push({
          m: (i + alt) % MOTIFS.length,
          x: Math.random()*w,
          y: Math.random()*h,
          s: 0.55 + Math.random()*0.6,
          vx: (Math.random()-0.5)*0.12,
          vy: -0.05 - Math.random()*0.085,
          rot: (Math.random()-0.5)*0.4,
          vr: (Math.random()-0.5)*0.00018,
          a: 0.11 + Math.random()*0.09,
          wob: Math.random()*Math.PI*2
        });
      }
      /* 4-5 blobs; layout seeded from the page path like the motifs */
      blobs=[];
      var bn = w < 700 ? 3 : 5;
      for(var b=0;b<bn;b++){
        blobs.push({
          col: BLOB_COLS[(b + alt) % BLOB_COLS.length],
          bx: (0.12 + 0.76*((b*0.37 + alt*0.11) % 1)),
          by: (0.15 + 0.7*((b*0.53 + alt*0.19) % 1)),
          r: (0.24 + 0.16*((b*0.29 + alt*0.07) % 1)),
          sp: 0.00004 + 0.00005*((b+alt)%3),
          ph: b*1.7 + alt*0.31,
          a: b===2 ? 0.05 : 0.075
        });
      }
    }

    var imgs = MOTIFS.map(function(_,i){
      var im = new Image();
      im.decoding = "async";
      im.src = 'data:image/svg+xml,' + MOTIFS[i].replace(/COL/g, COLS[i % COLS.length]);
      return im;
    });

    function draw(now){
      var e = now - t0;
      ctx.clearRect(0,0,w,h);

      /* v10: the paper ground is painted here, on the ambient layer itself,
         so the wash can never sit on top of the motion. */
      var paper = ctx.createLinearGradient(0,0,0,h);
      paper.addColorStop(0,"#fdf8f1");
      paper.addColorStop(0.44,"#faf6f0");
      paper.addColorStop(1,"#f4ecdf");
      ctx.fillStyle = paper;
      ctx.fillRect(0,0,w,h);

      var w1 = ctx.createRadialGradient(w*0.88,-h*0.10,10, w*0.88,-h*0.10, Math.max(w,h)*0.85);
      w1.addColorStop(0,"rgba(217,164,65,0.20)");
      w1.addColorStop(1,"rgba(217,164,65,0)");
      ctx.fillStyle = w1; ctx.fillRect(0,0,w,h);

      var w2 = ctx.createRadialGradient(-w*0.08,h*0.16,10, -w*0.08,h*0.16, Math.max(w,h)*0.75);
      w2.addColorStop(0,"rgba(192,90,46,0.13)");
      w2.addColorStop(1,"rgba(192,90,46,0)");
      ctx.fillStyle = w2; ctx.fillRect(0,0,w,h);

      /* the liquid: each blob breathes around its anchor on its own slow clock */
      for(var b=0;b<blobs.length;b++){
        var bl = blobs[b];
        var ox = Math.sin(e*bl.sp + bl.ph) * w*0.06;
        var oy = Math.cos(e*bl.sp*0.83 + bl.ph*1.3) * h*0.05;
        var rr = bl.r * Math.max(w,h);
        var bg = ctx.createRadialGradient(bl.bx*w + ox, bl.by*h + oy, rr*0.08, bl.bx*w + ox, bl.by*h + oy, rr);
        bg.addColorStop(0, "rgba("+bl.col[0]+","+bl.col[1]+","+bl.col[2]+","+bl.a+")");
        bg.addColorStop(1, "rgba("+bl.col[0]+","+bl.col[1]+","+bl.col[2]+",0)");
        ctx.fillStyle = bg;
        ctx.fillRect(0,0,w,h);
      }

      px += (tx-px)*0.03; py += (ty-py)*0.03;
      var g = ctx.createRadialGradient(px*w, py*h, 10, px*w, py*h, Math.max(w,h)*0.7);
      g.addColorStop(0, "rgba(217,164,65,0.17)");
      g.addColorStop(0.42, "rgba(192,90,46,0.055)");
      g.addColorStop(1, "rgba(250,246,240,0)");
      ctx.fillStyle = g;
      ctx.fillRect(0,0,w,h);

      for(var i=0;i<items.length;i++){
        var it = items[i];
        it.x += it.vx + Math.sin(e*0.00033 + it.wob)*0.18;
        it.y += it.vy;
        it.rot += it.vr;
        if(it.y < -120){ it.y = h + 100; it.x = Math.random()*w; }
        if(it.x < -120) it.x = w + 100; else if(it.x > w + 120) it.x = -100;
        var im = imgs[it.m]; if(!im || !im.complete) continue;
        var bw = 136*it.s, bh = 79*it.s;
        ctx.save();
        ctx.globalAlpha = it.a;
        ctx.translate(it.x, it.y);
        ctx.rotate(it.rot);
        ctx.drawImage(im, -bw/2, -bh/2, bw, bh);
        ctx.restore();
      }

      ctx.strokeStyle = "rgba(192,90,46,0.055)";
      ctx.lineWidth = 1;
      var cx = w*0.84, cy = h*0.18;
      for(var r=0;r<5;r++){
        ctx.beginPath();
        ctx.arc(cx, cy, 120 + r*90 + Math.sin(e*0.0001 + r)*10, 0, Math.PI*2);
        ctx.stroke();
      }
      requestAnimationFrame(draw);
    }

    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", function(ev){
      tx = ev.clientX / window.innerWidth;
      ty = ev.clientY / window.innerHeight;
    }, { passive: true });
    window.addEventListener("visibilitychange", function(){
      if(!document.hidden) t0 = performance.now();
    });

    requestAnimationFrame(draw);
  }

  /* 2 — lotus line that draws itself once */
  function lotuses(){
    var bands = document.querySelectorAll(".familyband, .plaque, .cta-strip .wrap");
    Array.prototype.forEach.call(bands, function(el){
      if(el.querySelector(".lotusdraw")) return;
      var svg = document.createElementNS(NS,"svg");
      svg.setAttribute("class","lotusdraw");
      svg.setAttribute("viewBox","0 0 120 70");
      svg.setAttribute("aria-hidden","true");
      ["M60 58C54 40 54 20 60 6c6 14 6 34 0 52Z",
       "M60 58C50 46 38 34 28 16c14 8 26 26 32 42Z",
       "M60 58c10-12 22-24 32-42-14 8-26 26-32 42Z",
       "M60 58C48 52 34 50 12 50c16 10 34 12 48 8Z",
       "M60 58c12-6 26-8 48-8-16 10-34 12-48 8Z"].forEach(function(d,i){
        var p = document.createElementNS(NS,"path");
        p.setAttribute("d", d);
        p.setAttribute("fill","none");
        p.setAttribute("stroke","currentColor");
        p.setAttribute("stroke-width", i? "2.2":"2.6");
        p.setAttribute("stroke-linecap","round");
        p.style.strokeDasharray = "160";
        p.style.strokeDashoffset = "160";
        p.style.animation = "drawlotus 1.6s cubic-bezier(.22,.61,.36,1) " + (0.1 + i*0.13) + "s forwards";
        svg.appendChild(p);
      });
      el.insertBefore(svg, el.firstChild);
    });
  }

  /* 3 — nested lotus watermark on the quiet sections */
  function ripples(){
    var secs = document.querySelectorAll("section:not(.flat), .cta-strip, .feature");
    Array.prototype.forEach.call(secs, function(el, i){
      if(el.querySelector(".ripplelotus")) return;
      var box = document.createElement("div");
      box.className = "ripplelotus";
      box.setAttribute("aria-hidden","true");
      box.style.backgroundImage = uri(i);
      el.insertBefore(box, el.firstChild);
    });
  }

  /* 4 — arrival on scroll */
  function flow(){
    var sel = "section, .card, .promises div, .menucard .day, .post, .faq details, .amen div, .step, " +
              ".hero .cta-row, .familyband, .tourbox, .costrows>div, .voice, .statrow>div, .plaque, " +
              ".board .post, .loc, .day, .sheet, .pitstats, .onepager";
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

  /* 5 — scroll chrome */
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

  function boot(){ ambient(); lotuses(); ripples(); flow(); chrome(); }
  if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
