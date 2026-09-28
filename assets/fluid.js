/* Prajna Co-hab — the pond (v35)
   One body of clear water behind every page. Four layers stack into depth:
   a still bed of light, caustics bending through the surface, a shallow
   ripple skin at the top, and body colour that tints the whole column.
   The water responds to scrolling: it lifts and a wake trails behind you.
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
  var COLS = ["%23c05621", "%23d9a441", "%237a5a1c"];

  function uri(i){ return 'url("data:image/svg+xml,' + MOTIFS[i % MOTIFS.length].replace(/COL/g, COLS[i % COLS.length]) + '")'; }

  /* 1 — the pond: clear spring water behind every page (v22).
     Light columns bend under the surface, folk motifs hang suspended and
     flow free on Lissajous paths, rings spread from unseen drops, and the
     water parallax-glides a touch slower than the glass above it. */
  function ambient(){
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

    var ctx = c.getContext("2d");
    /* a 2x backing store on a phone is ~1.3M px re-filled per frame */
    var dpr = Math.min(window.devicePixelRatio||1, (window.innerWidth<700 ? 1.5 : 2));
    var w=0, h=0, t0=performance.now(), TAU=Math.PI*2;
    var px=0.5, py=0.4, tx=0.5, ty=0.4;
    var water = Math.max(0.34, (window.matchMedia && window.matchMedia("(pointer:fine)").matches) ? 0.5 : 0.34);
    var alt=0;
    var DEEP = [251,247,239];              /* the pale bed under the water */
    var SURF = [255,251,242];              /* light pooling on top */
    var beds=[], caustics=[], skins=[], tinters=[], drops=[];
    var phase = 0, sy=0, lastSy=0, flow=0, wakePh=0, wakeAmp=0;

    function resize(){
      w = window.innerWidth; h = window.innerHeight;
      c.width = Math.floor(w*dpr); c.height = Math.floor(h*dpr);
      c.style.width = w+"px"; c.style.height = h+"px";
      ctx.setTransform(dpr,0,0,dpr,0,0);
      var phone = w < 700;
      /* seeded from the path so no two pages get the same water */
      alt = (location.pathname.split("/").pop() || "index").length;

      /* BED — a still, very broad underlight. Kept to one pass: the pale
         ground already lives in CSS, so this is only the lift of the dapples. */
      beds = [];
      for(var i=0;i<(phone?2:4);i++){
        beds.push({
          bx: (0.15 + 0.7*((i*0.37 + alt*0.13) % 1)),
          by: (0.12 + 0.76*((i*0.53 + alt*0.21) % 1)),
          r:  (0.3 + 0.22*((i*0.29 + alt*0.09) % 1)),
          sp: 0.00004 + 0.00003*((i+alt)%3),
          ph: i*1.9 + alt*0.37,
          a:  0.085 + 0.03*(i%3)
        });
      }

      /* CAUSTICS — light folding through the surface. Same math as a real
         caustic: the squared sum of two crossing wavefronts, which naturally
         leaves bright filaments rather than blobs. */
      caustics = [];
      var cn = phone ? 2 : 3;
      for(var k=0;k<cn;k++){
        caustics.push({
          sc: 0.0022 + 0.0016*k + 0.0004*((alt+k)%4),
          rf: 0.63 + 0.21*k,
          ph: k*1.7 + alt*0.23,
          sp: 0.00011 + 0.00007*k,
          dy: 0.00006 + 0.00004*k,
          a:  (k===0 ? 0.11 : 0.07) - 0.015*k
        });
      }

      /* SKIN — the shallow wave at the top, what you actually see looking at
         a pond. Only the upper third, sitting above the caustics. */
      skins = [];
      var sn = phone ? 9 : 20;
      for(var q=0;q<sn;q++){
        skins.push({
          y: (q+0.5)/sn,                      /* 0 at surface .. 1 at depth */
          ax: 0.00017 + 0.00013*((q*0.13+alt*0.07)%1),
          ax2:0.00031 + 0.00019*((q*0.29+alt*0.11)%1),
          ph: Math.random()*TAU,
          ph2:Math.random()*TAU,
          a: (0.5 - 0.34*((q+0.5)/sn)) * 0.34,
          light: q % 3 !== 0
        });
      }

      /* COLOUR — ochre and terracotta, two slow pools. */
      tinters = [];
      for(var b2=0;b2<(phone?2:3);b2++){
        tinters.push({
          col: b2===0 ? [217,164,65] : (b2===1 ? [192,86,33] : [43,38,32]),
          bx: 0.16 + 0.68*((b2*0.41 + alt*0.11) % 1),
          by: 0.14 + 0.72*((b2*0.57 + alt*0.19) % 1),
          r:  0.36 + 0.18*((b2*0.31 + alt*0.07) % 1),
          sp: 0.00006 + 0.00005*((b2+alt)%3),
          ph: b2*2.1 + alt*0.31,
          a:  b2===2 ? 0.05 : 0.09
        });
      }
    }

    function draw(now){
      var e = now - t0;
      sy = window.pageYOffset || 0;
      var dv = sy - lastSy; lastSy = sy;
      /* a wake that trails whatever the scroll just did */
      wakeAmp += (Math.min(Math.abs(dv), 60) - wakeAmp) * 0.12;
      wakePh += Math.abs(dv) * 0.0000009;
      phase += 0.00042 + (water - 0.34) * 0.0006;
      flow += (wakeAmp * 0.06 - flow) * 0.06;

      ctx.clearRect(0,0,w,h);

      /* ---- LAYER 0 · the bed. CSS paints the pale ground; this is only
         the pooled underlight that gives the water somewhere to sit. ---- */
      for(var i=0;i<beds.length;i++){
        var bd = beds[i];
        var ox = Math.sin(e*bd.sp + bd.ph) * w*0.10;
        var oy = Math.cos(e*bd.sp*0.79 + bd.ph*1.3) * h*0.08;
        var rr = bd.r * Math.max(w,h);
        var bx = bd.bx*w + ox, by = bd.by*h + oy - sy*0.012;
        var bg = ctx.createRadialGradient(bx,by,rr*0.05, bx,by,rr);
        bg.addColorStop(0,"rgba("+DEEP[0]+","+DEEP[1]+","+DEEP[2]+","+bd.a+")");
        bg.addColorStop(1,"rgba("+DEEP[0]+","+DEEP[1]+","+DEEP[2]+",0)");
        ctx.fillStyle = bg;
        ctx.fillRect(0,0,w,h);
      }

      /* ---- LAYER 1 · caustics. The bright folding veins. Composite to
         screen so they ADD light: that is what makes it read as water. ---- */
      ctx.save();
      ctx.globalCompositeOperation = "lighten";
      for(var k2=0;k2<caustics.length;k2++){
        var ca = caustics[k2];
        var t = e*ca.sp + ca.ph;
        var ny = Math.round(h/22), nx = Math.round(w/16);
        var stepY = h/ny, stepX = w/nx;
        var ah = 0.5;
        var w1a = 1.6, w2a = 1.1;
        var b1 = -h*0.34 + flow + Math.sin(e*ca.dy + ca.ph)*h*0.06;
        var b2 = -h*0.52 + flow*1.4 + Math.cos(e*ca.dy*0.8 + ca.ph)*h*0.05;
        var vx = Math.sin(t)*w*0.035;
        ctx.beginPath();
        for(var gy=-2; gy<=ny+2; gy++){
          var y = gy*stepY;
          for(var gx=-2; gx<=nx+2; gx++){
            var x = gx*stepX + vx*(1 - y/h);
            /* two crossing wavefronts; squaring the sum leaves filaments */
            var f1 = Math.sin(x/sc*2.4*ca.rf + Math.sin(y/(sc*3.1) + t*0.9)*w1a + t*1.3 + vx*0.02);
            var f2 = Math.sin(y/sc*1.9 - Math.sin(x/(sc*2.7) - t*0.7)*w2a - t*0.9 + b1*0.004);
            var v = (f1 + f2) * 0.5;
            v = v*v*v*v*v;                     /* ^5 = thin veins, not blobs */
            v *= (0.40 + 0.60*Math.sin(y/stepY*0.11 + t*0.6));
            if(v < 0.020) { continue; }
            ctx.rect(x - stepX*0.5, y - stepY*0.5, stepX*1.02, stepY*1.02);
          }
        }
        ctx.globalAlpha = ca.a;
        ctx.fillStyle = "rgb(206,186,150)";
        ctx.fill();
      }
      ctx.restore();

      /* ---- LAYER 2 · the skin. Soft horizontal light bands drifting on the
         surface. Drawn as thin gradient slivers, cheap and very convincing. */
      ctx.save();
      ctx.globalCompositeOperation = "lighten";
      for(var q2=0;q2<skins.length;q2++){
        var sk = skins[q2];
        /* the whole skin lifts and bunches as you scroll */
        var yBase = -h*0.12 + sk.y*h*1.18 + flow*(1+sk.y) - (sy*0.03)%h;
        var drift = Math.sin(e*sk.ax + sk.ph)*w*0.06 + Math.sin(e*sk.ax2 + sk.ph2)*w*0.028;
        var xoff = drift + Math.sin(e*0.00009 + q2)*w*0.02;
        var thick = 16 + 26*(1 - sk.y) + (wakeAmp*0.5)*(1 - sk.y);
        var g2 = ctx.createLinearGradient(0, yBase-thick, 0, yBase+thick);
        var col = sk.light ? "238,226,200" : "206,162,84";
        var aa = sk.a * (0.55 + 0.45*Math.sin(e*0.0004 + q2*1.1)) * (1 + wakeAmp*0.012);
        g2.addColorStop(0,   "rgba("+col+",0)");
        g2.addColorStop(0.42,"rgba("+col+","+Math.max(0,Math.min(0.22,aa))+")");
        g2.addColorStop(0.5, "rgba("+col+","+Math.max(0,Math.min(0.3,aa*1.45))+")");
        g2.addColorStop(0.58,"rgba("+col+","+Math.max(0,Math.min(0.22,aa))+")");
        g2.addColorStop(1,   "rgba("+col+",0)");
        ctx.fillStyle = g2;
        /* the sliver tapers at both ends so the band has no cut edge */
        ctx.beginPath();
        ctx.ellipse(w/2 + xoff, yBase, w*0.78, thick, 0, 0, TAU);
        ctx.fill();
      }
      ctx.restore();

      /* ---- LAYER 3 · body colour. Ochre and terracotta suspended in the
         water, and the warm light that follows a mouse. ---- */
      for(var b3=0;b3<tinters.length;b3++){
        var tn = tinters[b3];
        var tox = Math.sin(e*tn.sp + tn.ph) * w*0.12;
        var toy = Math.cos(e*tn.sp*0.81 + tn.ph*1.2) * h*0.10;
        var trr = tn.r * Math.max(w,h);
        var tg = ctx.createRadialGradient(tn.bx*w+tox, tn.by*h+toy, trr*0.06,
                                          tn.bx*w+tox, tn.by*h+toy, trr);
        tg.addColorStop(0,"rgba("+tn.col[0]+","+tn.col[1]+","+tn.col[2]+","+tn.a+")");
        tg.addColorStop(1,"rgba("+tn.col[0]+","+tn.col[1]+","+tn.col[2]+",0)");
        ctx.fillStyle = tg;
        ctx.fillRect(0,0,w,h);
      }

      if(water > 0.4){
        px += (tx-px)*0.028; py += (ty-py)*0.028;
        var lg = ctx.createRadialGradient(px*w, py*h, 10, px*w, py*h, Math.max(w,h)*0.6);
        lg.addColorStop(0,   "rgba(255,251,238,0.13)");
        lg.addColorStop(0.30,"rgba(217,164,65,0.07)");
        lg.addColorStop(1,   "rgba(250,246,240,0)");
        ctx.fillStyle = lg;
        ctx.fillRect(0,0,w,h);
      }

      /* ---- drops. A ring spreads, and a second one follows it, so it reads
         as a surface being touched rather than a circle being drawn. ---- */
      if(!drops.length || e - drops[drops.length-1].t0 > 3200){
        drops.push({x: w*0.12 + Math.random()*w*0.76,
                    y: h*0.16 + Math.random()*h*0.7,
                    t0: e, sc: 0.7 + Math.random()*0.9});
      }
      for(var d2=drops.length-1; d2>=0; d2--){
        var dp = drops[d2], age = e - dp.t0;
        if(age > 7200){ drops.splice(d2,1); continue; }
        var fal = 1 - age/7200;
        fal = fal*fal;
        for(var rg=0; rg<2; rg++){
          var rr2 = (18 + age*0.021*dp.sc) * (rg ? 1.6 : 1);
          ctx.strokeStyle = "rgba(120,106,88," + (fal*(rg?0.05:0.085)).toFixed(4) + ")";
          ctx.lineWidth = rg ? 1 : 1.3;
          ctx.beginPath(); ctx.arc(dp.x, dp.y - sy*0.02 + flow*0.2, rr2, 0, TAU); ctx.stroke();
        }
      }

      /* ---- wake. Faint streaked lines behind a scrolling page. ---- */
      if(wakeAmp > 1.2){
        ctx.save();
        ctx.globalAlpha = Math.min(0.5, wakeAmp/60);
        for(var k3=0;k3<5;k3++){
          var wy = (k3/5)*h + (flow*2 % h);
          ctx.strokeStyle = k3%2 ? "rgba(192,86,33,0.10)" : "rgba(217,164,65,0.13)";
          ctx.lineWidth = 1;
          ctx.beginPath();
          for(var sx2=0; sx2<=w; sx2+=22){
            var off = Math.sin(sx2*0.004 + e*0.0002 + k3 + wakePh)*10*(1+wakeAmp/40);
            if(sx2===0) ctx.moveTo(sx2, wy+off); else ctx.lineTo(sx2, wy+off);
          }
          ctx.stroke();
        }
        ctx.restore();
      }

      if(!paused){ requestAnimationFrame(draw); }
    }

    /* SCROLL PAUSE. The canvas repaints several fullscreen passes per frame
       and every glass panel above re-blurs its region each time. Nobody
       studies drifting water mid-scroll, so the loop stops while the page
       moves and resumes 220ms after it settles. Tab-hidden and scroll-paused
       are the same decision routed through one flag. */
    var paused = false, resumeTimer = null;
    function setPaused(v, reason){
      if(v === paused) return;
      paused = v;
      if(reason === "scroll"){
        document.documentElement.classList.toggle("is-scrolling", v);
        if(v){ document.documentElement.classList.add("was-scrolling"); }
        else {
          /* the water needs a moment to settle after the page stops */
          setTimeout(function(){ document.documentElement.classList.remove("was-scrolling"); }, 520);
        }
      }
      if(!paused){
        t0 = performance.now();          /* reset the clock or it lurches */
        requestAnimationFrame(draw);
      }
    }
    var scrollTick = false;
    window.addEventListener("scroll", function(){
      setPaused(true, "scroll");
      if(resumeTimer){ clearTimeout(resumeTimer); }
      resumeTimer = setTimeout(function(){ setPaused(false, "scroll"); }, 220);
      /* keep a coarse wake signal alive while paused, so resuming is a
         continuation of the same motion rather than a jump */
      if(!scrollTick){
        scrollTick = true;
        requestAnimationFrame(function(){
          var y = window.pageYOffset || 0;
          wakeAmp += (Math.min(Math.abs(y-lastSy), 60) - wakeAmp) * 0.2;
          lastSy = y; scrollTick = false;
        });
      }
    }, { passive: true });
    document.addEventListener("visibilitychange", function(){
      if(document.hidden){ setPaused(true, "tab"); }
      else { if(resumeTimer){ clearTimeout(resumeTimer); } setPaused(false, "tab"); }
    });

    resize();
    window.addEventListener("resize", resize);
    /* a touch screen has no hover light worth the per-move work */
    if(window.matchMedia && window.matchMedia("(pointer:fine)").matches){
      window.addEventListener("pointermove", function(ev){
        tx = ev.clientX / window.innerWidth;
        ty = ev.clientY / window.innerHeight;
      }, { passive: true });
    }
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
