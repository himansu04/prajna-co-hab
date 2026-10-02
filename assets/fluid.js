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
    var beds=[], caustics=[], skins=[], tinters=[], drops=[], motifs=[], swells=[];
    var phase = 0, sy=0, lastSy=0, flow=0, wakePh=0, wakeAmp=0, moving=0;
    /* v40: `phone` used to be declared INSIDE resize(), so it was out of scope
       in draw() - any layer that referenced it threw a ReferenceError on every
       frame and the whole canvas died silently. Hoisted here so every layer can
       read it. This is the same bug class that killed the caustics from v35 to
       v39 (`sc` bound only as a property, never as a local). */
    var phone = window.innerWidth < 700;

    function resize(){
      w = window.innerWidth; h = window.innerHeight;
      c.width = Math.floor(w*dpr); c.height = Math.floor(h*dpr);
      c.style.width = w+"px"; c.style.height = h+"px";
      ctx.setTransform(dpr,0,0,dpr,0,0);
      phone = w < 700;   /* v40: assigns the hoisted outer flag, no shadow */
      /* seeded from the path so no two pages get the same water */
      alt = (location.pathname.split("/").pop() || "index").length;

      /* BED — a still, very broad underlight. Kept to one pass: the pale
         ground already lives in CSS, so this is only the lift of the dapples. */
      beds = [];
      for(var i=0;i<(phone?2:4);i++){
        beds.push({
          bx: (0.15 + 0.7*((i*0.37 + alt*0.13) % 1)),
          by: (0.12 + 0.76*((i*0.53 + alt*0.21) % 1)),
          r:  (0.38 + 0.26*((i*0.29 + alt*0.09) % 1)),
          sp: 0.00004 + 0.00003*((i+alt)%3),
          ph: i*1.9 + alt*0.37,
          a:  0.50 + 0.14*(i%3)
        });
      }

      /* CAUSTICS — light folding through the surface. Same math as a real
         caustic: the squared sum of two crossing wavefronts, which naturally
         leaves bright filaments rather than blobs. */
      /* v51 — THE CAUSTIC WAVE WAS SUB-PIXEL.
         `sc` used to be 0.0022, which put one full sine cycle every 0.009
         PIXELS. With samples 32px apart, consecutive samples landed ~3500
         cycles apart in phase, so f1 and f2 were uncorrelated noise and the
         layer drew flat grain - never water. sc is now derived from a target
         wavelength of ~100px (a broad pond ripple) that the sample density
         can actually resolve. This is the reason the water never appeared. */
      /* sc is chosen so wavelength = 2*PI*sc/(2.4*rf) ~= 100px. Solve for sc. */
      var SCALE = (100 * 2.4 * 0.63) / (2 * Math.PI);
      caustics = [];
      var cn = 2;   /* v39: was 3 - the third pass cost a full wavefront sweep for almost no visible gain */
      for(var k=0;k<cn;k++){
        caustics.push({
          sc: SCALE*(1 - k*0.26),
          rf: 0.63 + 0.21*k,
          ph: k*1.7 + alt*0.23,
          sp: 0.00011 + 0.00007*k,
          dy: 0.00006 + 0.00004*k,
          /* v39: these alphas were written when this layer threw before it
             could ever draw, so nobody ever saw them. Live, the old values
             put 18% of the viewport under lum 200 and pushed warmth to +31:
             a warm haze rather than moving water. Halved and narrowed. */
          a:  (k===0 ? 0.52 : 0.34) - 0.08*k
        });
      }

      /* SKIN — the shallow wave at the top, what you actually see looking at
         a pond. Only the upper third, sitting above the caustics. */
      skins = [];
      var sn = phone ? 8 : 12;
      for(var q=0;q<sn;q++){
        skins.push({
          y: (q+0.5)/sn,                      /* 0 at surface .. 1 at depth */
          ax: 0.00017 + 0.00013*((q*0.13+alt*0.07)%1),
          ax2:0.00031 + 0.00019*((q*0.29+alt*0.11)%1),
          ph: Math.random()*TAU,
          ph2:Math.random()*TAU,
          a: (0.5 - 0.22*((q+0.5)/sn)) * 1.60,
          light: q % 3 !== 0
        });
      }

      /* SWELL — three long travelling waves that pass under everything.
         This is the layer's shared motion: one body of water moving, rather
         than N independent objects deciding to move. Periods 1 : 0.71 : 0.53
         of each other so the pattern takes minutes to repeat. */
      swells = [];
      var swn = phone ? 2 : 3;
      for(var swi=0; swi<swn; swi++){
        swells.push({
          f: (0.000052 - swi*0.000011) * (1 + ((alt+swi)%3)*0.06),
          a: (13 - swi*3.4) * (phone ? 0.7 : 1),
          k: 0.0032 + swi*0.0021,
          ph: swi*2.3 + alt*0.41
        });
      }

      /* MOTIFS — the folk marks, floating in the water rather than drifting
         over it. They sink slowly, rock on the swell, and are brightest near
         the surface. Depth drives size, alpha and blur so they read as being
         at different distances inside the same water. */
      var lo = phone ? 5 : 10;
      var n = Math.max(lo, Math.min(12, Math.round((w*h)/110000)));
      motifs = [];
      for(var mi=0;mi<n;mi++){
        /* SUBMERGED, not sinking. A mark hanging in still water doesn't
           travel anywhere: it holds station and answers the surface above
           it. Random depth across the whole column so the marks occupy
           different distances inside the same water. */
        var depth = 0.08 + Math.random()*0.72;     /* 0.08 near surf .. 0.80 deep */
        motifs.push({
          m: (mi + alt) % MOTIFS.length,
          bx: Math.random()*w, by: Math.random()*h,
          /* SIZE: 10% of the screen's short edge, scaled by depth so the
             deep ones sit a little smaller and read as further away. */
          s: 1.0,
          /* the long, slow sway. Periods are deliberately incommensurate
             (0.9 : 1.7 : 0.31) so a mark never retraces its own path -
             that is what stops it looking like a loop. */
          ax: 12 + 16*(1-depth) + Math.random()*14,
          ax2: 5 + 9*(1-depth) + Math.random()*7,
          fx: 0.00004 + Math.random()*0.000035,
          fx2: 0.000075 + Math.random()*0.00005,
          ph: Math.random()*TAU, ph2: Math.random()*TAU,
          /* the vertical draft of still water: a very slow settle, far
             slower than the horizontal sway */
          ph3: Math.random()*TAU,
          vy: 0.00033 + Math.random()*0.00030,
          rrot: (Math.random()-0.5)*0.30,
          /* roll: the slowest of all the rotations, plus a faster flutter */
          fr: 0.000022 + Math.random()*0.00003,
          fr2: 0.00009 + Math.random()*0.00005,
          ph4: Math.random()*TAU,
          depth: depth,
          /* 10% of the short edge; deeper = smaller */
          px: (Math.min(w,h) * 0.10) * (1.0 - 0.26*depth),
          a: (0.78 - 0.30*depth) + Math.random()*0.06
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
          a:  b2===2 ? 0.24 : 0.40
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
      sy = window.pageYOffset || 0;
      var dv = sy - lastSy; lastSy = sy;
      /* a wake that trails whatever the scroll just did */
      wakeAmp += (Math.min(Math.abs(dv), 60) - wakeAmp) * 0.12;
      wakePh += Math.abs(dv) * 0.0000009;
      phase += 0.00042 + (water - 0.34) * 0.0006;
      /* the flow force RISES fast and FALLS slowly. Water is heavy: it takes
         the push immediately and then takes its time giving it back, which is
         why a fast up-slew reads as weight and a symmetric one reads as jelly. */
      flow += (wakeAmp * 0.06 - flow) * (wakeAmp > flow/0.06 ? 0.10 : 0.035);
      /* how long, in px, the water has been moving for: the delay that makes
         the surface light lag the scroll rather than stick to it */
      moving += ((wakeAmp > 0.6 ? 1 : 0) - moving) * 0.045;

      /* the travelling swell. Three long waves crossing at slightly different
         speeds and angles: where they stack the whole layer lifts, which is
         what makes the marks move as ONE body of water instead of each one
         doing its own little dance. */
      var sy0 = 0, sy1 = 0;
      for(var swi=0; swi<swells.length; swi++){
        var sw = swells[swi];
        var ph = e*sw.f + sw.ph + (sy*sw.k*0.10);
        sy0 += Math.sin(ph) * sw.a;
        sy1 += Math.sin(ph*0.83 + sw.ph) * sw.a * 0.7;
      }

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

      /* ---- LAYER 0.5 · the floating marks, suspended in the water.
         Drawn UNDER the caustics, so the light of the surface travels across
         them: that ordering is what makes them sit IN the water rather than
         hover above it. Nothing here travels fast - the whole layer is
         deliberately one order of magnitude slower than the water around it,
         because that is the difference between floating and drifting. ---- */
      for(var m2=0;m2<motifs.length;m2++){
        var mo = motifs[m2];
        var mim = imgs[mo.m];
        if(!mim || !mim.complete) continue;
        /* three incommensurate sines per axis: the path never closes, so the
           mark keeps finding new positions without ever leaving its pool */
        var swayX = Math.sin(e*mo.fx + mo.ph)*mo.ax
                  + Math.sin(e*mo.fx2 + mo.ph2)*mo.ax2
                  + Math.sin(e*mo.fx*2.7 + mo.ph4)*mo.ax2*0.35;
        var sx = swells.reduce(function(acc, sw){
          return acc + Math.sin(e*sw.f + sw.ph + mo.by*sw.k)*sw.a;
        }, 0);
        var mx = mo.bx + swayX + sx * (1 - mo.depth);

        /* vertical: a slow draft, plus the long travelling wave that lifts
           the entire layer. Scroll drags the whole column a touch slower than
           the glass in front, which is the parallax. */
        var swellY = sy0 * (1 - mo.depth*0.55);
        var my = mo.by
               + Math.sin(e*mo.vy + mo.ph3)*(7 + 10*(1-mo.depth))
               + sy1 * (1 - mo.depth*0.6)
               - sy*0.018;
        /* wrap with generous margin so a mark is never clipped mid-frame */
        var span = h + 420;
        my = ((my - e*mo.vy*0.0) % span + span) % span - 210;

        var bob = Math.sin(e*0.00042 + mo.ph3 + my*0.005) * (4 + 6*(1-mo.depth));
        /* squash and stretch: moving water does not move a solid object, it
           deforms what sits in it. Amplitude rises with scroll so the marks
           lean into the flow instead of being shoved by it. */
        var charge = Math.min(1, wakeAmp/34);
        var sq = 1 + (0.010 + 0.032*charge) * Math.sin(e*0.00062 + mo.ph + mx*0.004);
        var sqx = 1 - (sq-1)*0.68;

        var rot = mo.rrot
                + Math.sin(e*mo.fr + mo.ph)*0.075
                + Math.sin(e*mo.fr2 + mo.ph4)*0.028
                + flow * 0.00072 * (1 - mo.depth);
        var mw = mo.px, mh = mo.px * (70/120);
        ctx.save();
        ctx.globalAlpha = Math.max(0, Math.min(0.82, mo.a * (1 + wakeAmp*0.0035)));
        ctx.translate(mx, my + bob);
        ctx.rotate(rot);
        ctx.scale(sqx, sq);
        ctx.drawImage(mim, -mw/2, -mh/2, mw, mh);
        ctx.restore();
      }

      /* ---- LAYER 1 · caustics. The bright folding veins. Composite to
         screen so they ADD light: that is what makes it read as water. ---- */
      ctx.save();
      /* v40: was 'lighten' (max per channel). A warm-grey fill can NEVER lift
         a bright paper under max(), so this layer was mathematically unable to
         show itself on the pale water areas - stdev in empty regions was 4.4
         lum out of 255, i.e. invisible. 'lighter' adds instead of maxing, so
         light can actually accumulate. Kept below clipping by using a light,
         low-alpha fill. */
      ctx.globalCompositeOperation = "lighter";
      for(var k2=0;k2<caustics.length;k2++){
        var ca = caustics[k2];
        var t = e*ca.sp + ca.ph;
        var ny = Math.round(h/22), nx = Math.round(w/16);
        var stepY = h/ny, stepX = w/nx;
        var ah = 0.5;
        var w1a = 1.6, w2a = 1.1;
        var sc = ca.sc;          /* v39 FIX: the caustic math below read a bare
                                    `sc` that was never bound, so this whole layer
                                    threw a ReferenceError on every frame and the
                                    light-folding veins never drew at all. The
                                    wavelength lived on ca.sc the entire time. */
        var b1 = -h*0.34 + flow + Math.sin(e*ca.dy + ca.ph)*h*0.06;
        var b2 = -h*0.52 + flow*1.4 + Math.cos(e*ca.dy*0.8 + ca.ph)*h*0.05;
        var vx = Math.sin(t)*w*0.035;
        /* v40: was a filled 16x22px rect grid at 16% coverage. Measured result:
           that reads as a soft blotchy wash, not water - a vision model called
           it flat cream even with the numbers moving. Real caustics are THIN
           BRIGHT FILAMENTS where two wavefronts cross, so this traces each
           crest as a polyline instead of lighting up whole cells. */
        ctx.beginPath();
        /* v40b: 15 banded lines read as STRIPES, not a caustic field - measured
           stdev actually fell 8.12 -> 4.01 vs the old grid fill. The fix is
           DENSITY + CROSSING: many more filaments, and a vertical wander larger
           than the line spacing so they weave through each other instead of
           sitting in their own horizontal lane. That is what a real caustic
           field looks like from above - a net, not a comb. */
        var LINES = phone ? 9 : 16;   /* v51: was 18/30 - at a 100px wavelength a fine net reads as a comb, not water */
        /* v41 PERF: the sample step is 2 columns instead of 1 - a filament is a
           smooth slow curve, so half the samples read identically while costing
           a full sin() each. Halving the density plus halving the line count
           keeps the same woven look (the lines still cross, because the wander
           still exceeds the lane spacing) at ~1/3 the cost. */
        /* v51: was stepX*2 (32px steps), which gives only 3 samples per
           100px wavelength - the wave aliases into noise no matter how
           correct sc is. ~10px steps give 10 samples per cycle: smooth. */
        var xStep = Math.max(8, w/105);
        var nx2 = Math.round(w/xStep);
        for(var li=0; li<LINES; li++){
          /* scatter the lanes so adjacent filaments are not evenly spaced */
          var band = (li + 0.5 + 0.34*Math.sin(li*2.399 + ca.ph))/LINES;
          /* v50: this was `yBase`, which collides with the identically-named
             variable in the skin loop below. `var` is function-scoped, so both
             hoisted to draw() and shared ONE binding - the skin loop silently
             overwrote the caustic loop's value. Renamed so each keeps its own. */
          var lineBase = band*h;
          var started = false;
          /* v41 PERF: everything below depends only on `li`, never on sx2, so it
             is hoisted out of the inner loop instead of being recomputed for
             all ~40 samples. Same numbers, a fraction of the trig. */
          var yN = lineBase/(sc*0.55) + t*0.9;
          var ph1 = Math.sin(yN)*w1a + t*1.3 + vx*0.02;
          var ph2 = lineBase/sc*0.42 - t*0.9 + b1*0.02;
          var wPh1 = t*0.7 + li*1.9;
          var wPh2 = -t*0.45 + ca.ph + li*2.7;
          var wAmp1 = stepY * 6.5, wAmp2 = stepY * 4.2;
          var yShift = vx*(1 - lineBase/h);
          for(var si=0; si<=nx2; si++){
            var x = si*xStep + yShift;
            /* the crossing wavefronts, same math as before: where they agree
               the crest is bright, where they cancel there is nothing */
            var f1 = Math.sin(x/sc*2.4*ca.rf + ph1);
            var f2 = Math.sin(ph2 - Math.sin(x/(sc*2.7) - t*0.7)*w2a);
            var v = (f1 + f2) * 0.5;
            v = v*v*v*v;
            /* the filament wanders vertically along its own crest. The wander
               is LARGER than the lane spacing so filaments cross and braid;
               two incommensurate terms so no two lines march together */
            var y = lineBase
                  + Math.sin(x*0.012*ca.rf + wPh1) * wAmp1
                  + Math.sin(x*0.0043 + wPh2) * wAmp2;
            if(v < 0.10){ started = false; continue; }
            if(!started){ ctx.moveTo(x,y); started = true; }
            else { ctx.lineTo(x,y); }
          }
        }
        ctx.globalAlpha = ca.a;
        ctx.strokeStyle = "rgb(252,250,242)";   /* bright filament, reads as light on the mid bed */
        ctx.lineWidth = phone ? 1.3 : 1.6;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.stroke();
      }
      ctx.restore();

      /* ---- LAYER 2 · the skin. Soft horizontal light bands drifting on the
         surface. Drawn as thin gradient slivers, cheap and very convincing. */
      ctx.save();
      /* v40: same fix as the caustics - additive light, not max(). */
      ctx.globalCompositeOperation = "lighter";
      for(var q2=0;q2<skins.length;q2++){
        var sk = skins[q2];
        /* the whole skin lifts and bunches as you scroll */
        var yBase = -h*0.12 + sk.y*h*1.18 + flow*(1+sk.y) - (sy*0.03)%h;
        /* the surface band travels WITH the swell, so the skin and the marks
           are visibly the same body of water */
        var drift = Math.sin(e*sk.ax + sk.ph)*w*0.05 + Math.sin(e*sk.ax2 + sk.ph2)*w*0.022;
        var xoff = drift + Math.sin(e*0.00007 + q2)*w*0.02 + sy0*2.4;
        /* thinner and softer than before: a still pond's surface reads as a
           broad sheen, not as stripes */
        var thick = 26 + 34*(1 - sk.y) + (wakeAmp*0.45)*(1 - sk.y);
        var g2 = ctx.createLinearGradient(0, yBase-thick, 0, yBase+thick);
        var col = sk.light ? "255,247,228" : "240,196,110";
        var aa = sk.a * (0.55 + 0.45*Math.sin(e*0.00026 + q2*1.1 + sy1*0.004)) * (1 + wakeAmp*0.010);
        g2.addColorStop(0,   "rgba("+col+",0)");
        g2.addColorStop(0.42,"rgba("+col+","+Math.max(0,Math.min(0.42,aa))+")");
        g2.addColorStop(0.5, "rgba("+col+","+Math.max(0,Math.min(0.55,aa*1.45))+")");
        g2.addColorStop(0.58,"rgba("+col+","+Math.max(0,Math.min(0.50,aa))+")");
        g2.addColorStop(1,   "rgba("+col+",0)");
        ctx.fillStyle = g2;
        /* the sliver tapers at both ends so the band has no cut edge */
        ctx.beginPath();
        ctx.ellipse(w/2 + xoff, yBase, w*0.78, thick, 0, 0, TAU);
        ctx.fill();
      }
      ctx.restore();

      /* ---- LAYER 2.5 · the raking sheen. A wet surface catches light at an
         angle across its whole face. One broad, faint diagonal is enough to
         stop the water reading matte. ---- */
      var sheen = ctx.createLinearGradient(w*0.18, 0, w*0.92, h);
      sheen.addColorStop(0,    "rgba(255,253,246,0)");
      sheen.addColorStop(0.42, "rgba(255,253,246,"+ (0.020 + 0.018*(1-moving)).toFixed(4) +")");
      sheen.addColorStop(0.56, "rgba(246,240,226,"+ (0.026 + 0.022*(1-moving)).toFixed(4) +")");
      sheen.addColorStop(1,    "rgba(255,253,246,0)");
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.fillStyle = sheen;
      ctx.translate(0, Math.sin(e*0.00006)*h*0.012);
      ctx.fillRect(0, 0, w, h);
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
        px += (tx-px)*0.019; py += (ty-py)*0.019;
        var lg = ctx.createRadialGradient(px*w, py*h, 6, px*w, py*h, Math.max(w,h)*0.72);
        lg.addColorStop(0,   "rgba(255,252,242,0.085)");
        lg.addColorStop(0.34,"rgba(217,164,65,0.055)");
        lg.addColorStop(1,   "rgba(250,246,240,0)");
        ctx.fillStyle = lg;
        ctx.fillRect(0,0,w,h);
      }

      /* ---- drops. A ring spreads, and a second one follows it, so it reads
         as a surface being touched rather than a circle being drawn. ---- */
      if(!drops.length || e - drops[drops.length-1].t0 > 6400){
        drops.push({x: w*0.12 + Math.random()*w*0.76,
                    y: h*0.16 + Math.random()*h*0.7,
                    t0: e, sc: 0.7 + Math.random()*0.9});
      }
      for(var d2=drops.length-1; d2>=0; d2--){
        var dp = drops[d2], age = e - dp.t0;
        if(age > 15000){ drops.splice(d2,1); continue; }
        var fal = 1 - age/15000;
        fal = fal*fal;
        for(var rg=0; rg<2; rg++){
          var rr2 = (14 + age*0.0135*dp.sc) * (rg ? 1.9 : 1);
          ctx.strokeStyle = "rgba(126,112,92," + (fal*(rg?0.038:0.062)).toFixed(4) + ")";
          ctx.lineWidth = rg ? 1 : 1.3;
          ctx.beginPath(); ctx.arc(dp.x, dp.y - sy*0.02 + flow*0.2, rr2, 0, TAU); ctx.stroke();
        }
      }

      /* ---- wake. Faint streaked lines behind a scrolling page. ---- */
      if(wakeAmp > 1.2){
        ctx.save();
        ctx.globalAlpha = Math.min(0.42, wakeAmp/72);
        for(var k3=0;k3<4;k3++){
          var wy = (k3/4)*h + (flow*2 % h);
          ctx.strokeStyle = k3%2 ? "rgba(192,86,33,0.085)" : "rgba(217,164,65,0.11)";
          ctx.lineWidth = k3%2 ? 0.9 : 1.1;
          ctx.beginPath();
          for(var sx2=0; sx2<=w; sx2+=22){
            var off = Math.sin(sx2*0.0034 + e*0.00014 + k3 + wakePh)*8*(1+wakeAmp/42)
                    + sy0*0.6;
            if(sx2===0) ctx.moveTo(sx2, wy+off); else ctx.lineTo(sx2, wy+off);
          }
          ctx.stroke();
        }
        ctx.restore();
      }

      if(!paused){ requestAnimationFrame(draw); }
    }

    /* ═══════════════════════════════════════════════════════════════════
       v56 — CONTINUOUS WATER.

       This used to pause the loop on every scroll event and, on resume, did
       `t0 = performance.now()`. Because every animated value in draw() is a
       function of `e = now - t0`, resetting t0 snapped the entire water back
       to frame zero. Combined with pausing on each scroll tick, the effect
       was: water for a moment, then a lurch, then stillness - which is
       exactly the "only in short time" report.

       Two changes, both measured rather than guessed:
       - t0 is NEVER reset. `e` only ever grows, so sin(e*f) is continuous and
         the water cannot jump.
       - the loop no longer stops for scrolling. It was measured at 0.68ms per
         frame against a 16.7ms budget for 60fps - about 4% - so there was no
         reason to stall it. Scrolling still feeds the wake, so the water
         REACTS to scroll, it just never stops.

       The only pause left is tab-hidden, which is genuinely invisible to the
       visitor and is the one case where stopping is free.
       ═══════════════════════════════════════════════════════════════════ */
    var paused = false;
    function setPaused(v, reason){
      if(v === paused) return;
      paused = v;
      if(reason === "scroll"){
        document.documentElement.classList.toggle("is-scrolling", v);
        if(v){ document.documentElement.classList.add("was-scrolling"); }
        else {
          setTimeout(function(){ document.documentElement.classList.remove("was-scrolling"); }, 900);
        }
      }
      if(!paused){
        /* t0 is deliberately NOT reset here. That single line was the lurch. */
        requestAnimationFrame(draw);
      }
    }
    var scrollTick = false;
    window.addEventListener("scroll", function(){
      /* v56: the water keeps running through the scroll. We only track the
         wake so it leans into the movement, exactly as it always did. */
      document.documentElement.classList.add("is-scrolling");
      document.documentElement.classList.add("was-scrolling");
      clearTimeout(window.__prajnaSettle);
      window.__prajnaSettle = setTimeout(function(){
        document.documentElement.classList.remove("is-scrolling");
        document.documentElement.classList.remove("was-scrolling");
      }, 900);
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
      else { setPaused(false, "tab"); }
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
              ".board .post, .loc, .day";
    var items = document.querySelectorAll(sel);
    if(!("IntersectionObserver" in window)){
      Array.prototype.forEach.call(items, function(el){ el.classList.add("flow-in"); });
      return;
    }
    /* v42: a reveal that depends on an observer callback firing is a reveal that
       can silently fail. On a phone a fast flick can scroll past an element
       before its entry is processed, and if the entry is dropped the element
       stays at opacity:0 FOREVER - invisible content that the layout still
       reserves space for, which is exactly what "elements not in their proper
       position" looks like. So the observer is now only an ENHANCER: a
       failsafe sweeps anything already at or above the fold, and a scroll-idle
       sweep catches anything the observer missed. Nothing can stay hidden. */
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(en){
        if(en.isIntersecting){ en.target.classList.add("flow-in"); io.unobserve(en.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.02 });
    function sweep(){
      Array.prototype.forEach.call(items, function(el){
        if(el.classList.contains("flow-in")) return;
        var r = el.getBoundingClientRect();
        if(r.top < (window.innerHeight || 800) + 40) el.classList.add("flow-in");
      });
    }
    Array.prototype.forEach.call(items, function(el){
      if(el.hasAttribute("data-flow")){ el.classList.add("flow-in"); return; }
      el.setAttribute("data-flow","");
      el.classList.add("flow");
      io.observe(el);
    });
    sweep();
    /* a slow backstop: if an entry is ever dropped, this still reveals it */
    var t = null;
    window.addEventListener("scroll", function(){
      if(t) clearTimeout(t);
      t = setTimeout(sweep, 180);
    }, { passive: true });
    setTimeout(function(){ Array.prototype.forEach.call(items, function(el){
      el.classList.add("flow-in"); }); }, 1400);
  }

  /* 5 — scroll chrome moved into site.js so only one listener
     toggles header.scrolled (two were racing). */

  /* v43: chrome() was called here but never defined anywhere - the header/chrome
   handling moved to site.js in an earlier pass and the call was left behind,
   so boot() threw ReferenceError on every page load. */
  function boot(){ ambient(); lotuses(); ripples(); flow(); }
  if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
