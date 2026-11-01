/* ---------- Sonido medieval: efectos y música generativa sintetizados con Web Audio, sin archivos ----------
   SONIDO_MED.efecto(nombre, ctx, destino)     → efecto al instante (dado, golpe, herido, magia, cura, fallo, victoria, nivel,
                                                  botin, derrota, perfecto, bien, clic, bloqueo, pasos, fuego, hielo, critico, moneda, puerta)
   const m = new SONIDO_MED.Musica(ctx, salida) → m.pista("taberna" | 0..4 | "jefe" | "combate"), m.tick() cada ~80 ms, m.parar()
   Todo es determinista (generador con semilla), con envolventes suaves y nodos que se liberan al acabar. */
(function () {
  "use strict";
  const RAIZ = typeof window !== "undefined" ? window : globalThis;

  /* ---------- Utilidades ---------- */
  const hz = m => 440 * Math.pow(2, (m - 69) / 12);
  function prng(semilla) {
    let a = (semilla >>> 0) || 1;
    return () => {
      a = (a + 0x6D2B79F5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function hash(a, b) {
    let h = Math.imul((a | 0) ^ 0x9E3779B9, 0x85EBCA6B) ^ Math.imul((b | 0) + 0x632BE5AB, 0xC2B2AE35);
    h ^= h >>> 15; h = Math.imul(h, 0x2C1B3C6D); h ^= h >>> 12; h = Math.imul(h, 0x297A2D39); h ^= h >>> 15;
    return (h >>> 0) / 4294967296;
  }
  const azar = prng(0x5EED5);   // variación de los efectos entre llamadas, pero reproducible
  const conectar = (n, d) => { if (Array.isArray(d)) d.forEach(x => n.connect(x)); else n.connect(d); };
  const soltar = (fuente, ...nodos) => { fuente.onended = () => { nodos.forEach(n => { try { n.disconnect(); } catch (e) {} }); }; };

  /* Envolventes: ataque lineal y caída exponencial hasta -80 dB (sin chasquidos). */
  function envolvente(p, t, a, v, dur) {
    a = Math.max(0.001, Math.min(a, dur * 0.8));
    p.setValueAtTime(0, t);
    p.linearRampToValueAtTime(v, t + a);
    p.exponentialRampToValueAtTime(0.0001, t + dur);
  }
  function sostenida(p, t, a, v, dur, rel) {
    a = Math.max(0.002, a); rel = Math.max(0.02, Math.min(rel, dur - a - 0.001));
    p.setValueAtTime(0, t);
    p.linearRampToValueAtTime(v, t + a);
    p.setValueAtTime(v, t + dur - rel);
    p.exponentialRampToValueAtTime(0.0001, t + dur);
  }
  /* Curva de valores [[dt, v], ...] con rampas exponenciales. */
  function curva(p, t, pts) {
    p.setValueAtTime(pts[0][1], t + pts[0][0]);
    for (let i = 1; i < pts.length; i++) p.exponentialRampToValueAtTime(pts[i][1], t + pts[i][0]);
  }

  /* ---------- Caché por contexto: ruido, ondas, cuerdas Karplus–Strong y reverberación ---------- */
  const CACHE = new WeakMap();
  function cache(ctx) {
    let c = CACHE.get(ctx);
    if (!c) {
      const sr = ctx.sampleRate, n = Math.floor(sr * 2), b = ctx.createBuffer(1, n, sr), d = b.getChannelData(0), r = prng(9001);
      for (let i = 0; i < n; i++) d[i] = r() * 2 - 1;
      c = { ruido: b, ks: new Map(), ondas: {}, rev: null };
      CACHE.set(ctx, c);
    }
    return c;
  }
  const ONDAS = {
    flauta: [0, 1, 0.16, 0.06, 0.025, 0.01],
    organo: [0, 1, 0.55, 0.32, 0.28, 0.08, 0.14, 0, 0.1, 0, 0.04],
    ocarina: [0, 1, 0.05, 0.04],
    dron: [0, 1, 0.5, 0.33, 0.22, 0.14, 0.09, 0.05, 0.03]
  };
  function onda(ctx, k) {
    const c = cache(ctx);
    if (!c.ondas[k]) { const im = new Float32Array(ONDAS[k]), re = new Float32Array(im.length); c.ondas[k] = ctx.createPeriodicWave(re, im); }
    return c.ondas[k];
  }
  /* Timbres de cuerda pulsada: t60 = segundos hasta -60 dB, brillo de la excitación, posición de pulsación, s = filtro del lazo. */
  const LAUD = { n: "laud", dur: 1.3, t60: 1.1, brillo: 0.55, pos: 0.17, s: 0.5 };
  const LAUD_CORTO = { n: "laudc", dur: 0.7, t60: 0.55, brillo: 0.6, pos: 0.15, s: 0.5 };
  const ARPA = { n: "arpa", dur: 1.6, t60: 1.9, brillo: 0.75, pos: 0.11, s: 0.58 };
  const ARPA_EF = { n: "arpae", dur: 1.0, t60: 1.0, brillo: 0.85, pos: 0.1, s: 0.6 };
  const BAJO = { n: "bajo", dur: 1.0, t60: 0.9, brillo: 0.35, pos: 0.28, s: 0.5 };
  const BAJO_CORTO = { n: "bajoc", dur: 0.45, t60: 0.35, brillo: 0.45, pos: 0.25, s: 0.5 };
  function ksBuffer(ctx, f, tb) {
    const c = cache(ctx), clave = tb.n + "|" + f.toFixed(2);
    let b = c.ks.get(clave);
    if (b) return b;
    const sr = ctx.sampleRate, n = Math.floor(sr * tb.dur), out = new Float32Array(n);
    const P = sr / f;
    let L = Math.floor(P - (1 - tb.s)), d = P - (1 - tb.s) - L;
    if (d < 0.2) { L -= 1; d += 1; }
    const C = (1 - d) / (1 + d), gl = Math.pow(0.001, 1 / (f * tb.t60));
    const linea = new Float32Array(L), ex = new Float32Array(L), r = prng(Math.round(f * 100) + tb.n.length * 7919);
    let lp = 0;
    for (let i = 0; i < L; i++) { lp += tb.brillo * ((r() * 2 - 1) - lp); ex[i] = lp; }
    const k = Math.max(1, Math.round(L * tb.pos));
    let media = 0;
    for (let i = 0; i < L; i++) { linea[i] = ex[i] - 0.9 * (i >= k ? ex[i - k] : 0); media += linea[i]; }
    media /= L;
    for (let i = 0; i < L; i++) linea[i] -= media;
    let p = 0, prev = 0, ax = 0, ay = 0, dcx = 0, dcy = 0, pico = 1e-9;
    for (let i = 0; i < n; i++) {
      const x = linea[p], v = gl * (tb.s * x + (1 - tb.s) * prev);
      prev = x;
      const y = C * v + ax - C * ay;
      ax = v; ay = y; linea[p] = y;
      p = p + 1 === L ? 0 : p + 1;
      const o = x - dcx + 0.995 * dcy; dcx = x; dcy = o;    // sin continua
      out[i] = o;
      if (Math.abs(o) > pico) pico = Math.abs(o);
    }
    const ini = Math.floor(sr * 0.0015), fin = Math.floor(n * 0.3);
    for (let i = 0; i < n; i++) {
      let e = 1 / pico;
      if (i < ini) e *= i / ini;
      if (i > n - fin) e *= Math.pow((n - i) / fin, 2);
      out[i] *= e;
    }
    b = ctx.createBuffer(1, n, sr);
    b.getChannelData(0).set(out);
    if (c.ks.size > 160) c.ks.delete(c.ks.keys().next().value);
    c.ks.set(clave, b);
    return b;
  }
  function reverb(ctx) {
    const c = cache(ctx);
    if (c.rev) return c.rev;
    const sr = ctx.sampleRate, n = Math.floor(sr * 1.8), b = ctx.createBuffer(1, n, sr), d = b.getChannelData(0), r = prng(4242);
    const pre = Math.floor(sr * 0.014);
    let lp = 0;
    for (let i = pre; i < n; i++) {
      const x = (i - pre) / (n - pre), a = 0.55 - 0.45 * x;
      lp += a * ((r() * 2 - 1) - lp);
      d[i] = lp * Math.exp(-x * 5.5) * (1 - x);
    }
    let e = 0;
    for (let i = 0; i < n; i++) e += d[i] * d[i];
    const k = 1 / Math.sqrt(e);    // energía unidad: la ganancia del envío es la de la cola
    for (let i = 0; i < n; i++) d[i] *= k;
    c.rev = b;
    return b;
  }

  /* ---------- Piezas básicas (devuelven el nº de fuentes que suenan) ---------- */
  function ruido(ctx, dest, t, o) {
    const s = ctx.createBufferSource();
    s.buffer = cache(ctx).ruido; s.loop = true;
    const fl = ctx.createBiquadFilter();
    fl.type = o.tipo || "bandpass"; fl.Q.value = o.q === undefined ? 1 : o.q;
    if (o.fs) curva(fl.frequency, t, o.fs);
    else { fl.frequency.setValueAtTime(o.f, t); if (o.f2) fl.frequency.exponentialRampToValueAtTime(o.f2, t + (o.tf || o.dur)); }
    const g = ctx.createGain();
    if (o.rel) sostenida(g.gain, t, o.a || 0.002, o.v, o.dur, o.rel); else envolvente(g.gain, t, o.a || 0.002, o.v, o.dur);
    s.connect(fl); fl.connect(g); conectar(g, dest);
    s.start(t, (o.off === undefined ? hash(Math.round(t * 997), 3) : o.off) * 1.8);
    s.stop(t + o.dur + 0.02);
    soltar(s, fl, g);
    return 1;
  }
  function osc(ctx, dest, t, o) {
    const s = ctx.createOscillator();
    if (o.onda) s.setPeriodicWave(onda(ctx, o.onda)); else s.type = o.tipo || "sine";
    if (o.fs) curva(s.frequency, t, o.fs);
    else { s.frequency.setValueAtTime(o.f, t); if (o.f2) s.frequency.exponentialRampToValueAtTime(o.f2, t + (o.tf || o.dur)); }
    if (o.det) s.detune.value = o.det;
    const g = ctx.createGain();
    if (o.rel) sostenida(g.gain, t, o.a || 0.005, o.v, o.dur, o.rel); else envolvente(g.gain, t, o.a || 0.002, o.v, o.dur);
    let ult = s;
    const nodos = [g];
    if (o.lp) {
      const fl = ctx.createBiquadFilter();
      fl.type = o.lp.tipo || "lowpass"; fl.Q.value = o.lp.q || 0.7;
      if (o.lp.fs) curva(fl.frequency, t, o.lp.fs); else fl.frequency.value = o.lp.f;
      s.connect(fl); ult = fl; nodos.push(fl);
    }
    ult.connect(g); conectar(g, dest);
    s.start(t); s.stop(t + o.dur + 0.02);
    soltar(s, ...nodos);
    return 1;
  }
  function cuerda(ctx, dest, t, f, v, tb, dur) {
    const b = ksBuffer(ctx, f, tb), s = ctx.createBufferSource(), g = ctx.createGain();
    s.buffer = b;
    dur = Math.max(0.1, Math.min(dur || b.duration, b.duration));
    g.gain.setValueAtTime(v, t);
    if (dur < b.duration - 0.01) { g.gain.setValueAtTime(v, t + dur - 0.07); g.gain.linearRampToValueAtTime(0, t + dur); }
    s.connect(g); conectar(g, dest);
    s.start(t); s.stop(t + dur + 0.01);
    soltar(s, g);
    return 1;
  }
  /* Parciales senoidales (campanas, metal, monedas). det > 0 añade una copia desafinada que bate. */
  function parciales(ctx, dest, t, f, rat, amp, dec, v, det, at) {
    let n = 0;
    for (let i = 0; i < rat.length; i++) {
      const fi = f * rat[i];
      if (fi > ctx.sampleRate * 0.45) continue;
      n += osc(ctx, dest, t, { f: fi, dur: dec[i], v: v * amp[i], a: at || 0.0015 });
      if (det && i < 4) n += osc(ctx, dest, t, { f: fi * (1 + det), dur: dec[i] * 0.9, v: v * amp[i] * 0.6, a: at || 0.0015 });
    }
    return n;
  }
  function trompa(ctx, dest, t, f, dur, v) {
    dur = Math.max(dur, 0.1);
    const lp = { q: 1.4, fs: [[0, f * 1.3], [0.05, Math.min(f * 7, 9000)], [Math.max(0.06, dur * 0.7), f * 3.2]] };
    const fs = [[0, f * 0.97], [0.04, f]];
    osc(ctx, dest, t, { tipo: "sawtooth", fs, dur, v, a: 0.025, rel: Math.min(0.12, dur * 0.4), lp });
    osc(ctx, dest, t, { tipo: "sawtooth", fs: fs.map(([a, b]) => [a, b * 1.0035]), dur, v: v * 0.7, a: 0.03, rel: Math.min(0.12, dur * 0.4), lp });
    return 2;
  }
  function bombo(ctx, dest, t, f, v, dec) {
    osc(ctx, dest, t, { f: f * 2.2, f2: f, tf: 0.05, dur: dec, v, a: 0.002 });
    ruido(ctx, dest, t, { dur: Math.min(0.09, dec), v: v * 0.45, tipo: "lowpass", f: f * 7, q: 0.7 });
    return 2;
  }
  function tabor(ctx, dest, t, v) {
    ruido(ctx, dest, t, { dur: 0.13, v, tipo: "bandpass", f: 1900, q: 0.8 });
    osc(ctx, dest, t, { tipo: "triangle", f: 250, f2: 160, tf: 0.05, dur: 0.09, v: v * 0.8 });
    return 2;
  }
  function campana(ctx, dest, t, f, v, dur) {
    return parciales(ctx, dest, t, f, [0.5, 1, 1.19, 1.5, 2, 2.51, 3.01],
      [0.35, 1, 0.45, 0.3, 0.55, 0.2, 0.12], [dur, dur * 0.85, dur * 0.6, dur * 0.5, dur * 0.45, dur * 0.3, dur * 0.22], v);
  }
  function moneda(ctx, dest, t, esc, v) {
    ruido(ctx, dest, t, { dur: 0.012, v: v * 0.5, tipo: "bandpass", f: 6500, q: 1.5 });
    return 1 + parciales(ctx, dest, t, 2650 * esc, [1, 1.49, 2.03, 2.62], [1, 0.7, 0.5, 0.3], [0.28, 0.2, 0.13, 0.09], v);
  }
  function voz(ctx, dest, t, o) {
    const s = ctx.createOscillator(), g = ctx.createGain(), sal = ctx.createGain();
    s.type = "sawtooth";
    curva(s.frequency, t, o.fs);
    envolvente(g.gain, t, o.a || 0.04, o.v, o.dur);
    s.connect(g);
    const nodos = [g, sal];
    o.formantes.forEach(([f, q, a]) => {
      const fl = ctx.createBiquadFilter(), ga = ctx.createGain();
      fl.type = "bandpass"; fl.frequency.value = f; fl.Q.value = q; ga.gain.value = a;
      g.connect(fl); fl.connect(ga); ga.connect(sal); nodos.push(fl, ga);
    });
    conectar(sal, dest);
    s.start(t); s.stop(t + o.dur + 0.02);
    soltar(s, ...nodos);
    return 1;
  }

  /* ---------- Efectos ---------- */
  const EFECTOS = {
    dado(ctx, d, t) {
      [0, 0.04 + azar() * 0.012, 0.078 + azar() * 0.018].forEach((dt, i) => {
        const v = [1, 0.62, 0.36][i], f = 650 + azar() * 380;
        ruido(ctx, d, t + dt, { dur: 0.028, v: 0.55 * v, tipo: "bandpass", f: 1900 + azar() * 1200, q: 2.5 });
        osc(ctx, d, t + dt, { tipo: "triangle", f, dur: 0.05, v: 0.32 * v });
        osc(ctx, d, t + dt, { f: f * 2.35, dur: 0.03, v: 0.12 * v });
      });
    },
    golpe(ctx, d, t) {
      ruido(ctx, d, t, { dur: 0.08, a: 0.055, v: 0.14, tipo: "bandpass", f: 900, f2: 3500, q: 1.2 });
      const ti = t + 0.06;
      osc(ctx, d, ti, { f: 150, f2: 55, tf: 0.12, dur: 0.2, v: 0.6 });
      ruido(ctx, d, ti, { dur: 0.13, v: 0.5, tipo: "lowpass", f: 1400, f2: 300, q: 0.7 });
      ruido(ctx, d, ti, { dur: 0.035, v: 0.35, tipo: "bandpass", f: 3200, q: 1 });
      parciales(ctx, d, ti, 1250, [1, 1.62, 2.33, 3.1], [1, 0.6, 0.4, 0.25], [0.3, 0.22, 0.15, 0.1], 0.08, 0.004);
    },
    herido(ctx, d, t) {
      osc(ctx, d, t, { f: 110, f2: 42, tf: 0.15, dur: 0.24, v: 0.65 });
      ruido(ctx, d, t, { dur: 0.16, v: 0.5, tipo: "lowpass", f: 600, f2: 150, q: 0.7 });
      voz(ctx, d, t + 0.05, { fs: [[0, 128], [0.07, 138], [0.42, 88]], dur: 0.46, a: 0.05, v: 0.55,
        formantes: [[450, 7, 1], [820, 8, 0.6], [2600, 10, 0.12]] });
    },
    magia(ctx, d, t) {
      ruido(ctx, d, t, { dur: 0.7, a: 0.18, v: 0.2, tipo: "bandpass", f: 600, f2: 5200, tf: 0.55, q: 4 });
      const trem = ctx.createGain(), lfo = ctx.createOscillator(), lg = ctx.createGain();
      trem.gain.value = 0.6; lfo.frequency.value = 17; lg.gain.value = 0.4;
      lfo.connect(lg); lg.connect(trem.gain); trem.connect(d);
      lfo.start(t); lfo.stop(t + 0.9); soltar(lfo, lg, trem);
      [660, 990, 1320].forEach((f, i) => osc(ctx, trem, t + i * 0.03, { tipo: i ? "sine" : "triangle", f, f2: f * 1.5, tf: 0.5, dur: 0.75, a: 0.12, v: 0.12 }));
      for (let i = 0; i < 6; i++) osc(ctx, d, t + 0.08 + i * 0.085, { f: 2600 + azar() * 3400, dur: 0.14, v: 0.06, a: 0.006 });
    },
    cura(ctx, d, t) {
      [72, 76, 79, 84].forEach((m, i) => parciales(ctx, d, t + i * 0.09, hz(m), [1, 2, 3, 2.76], [1, 0.3, 0.1, 0.08], [0.95, 0.6, 0.35, 0.3], 0.16, 0, 0.005));
      osc(ctx, d, t, { f: hz(60), dur: 1.25, a: 0.3, v: 0.08 });
      osc(ctx, d, t, { f: hz(67), dur: 1.2, a: 0.35, v: 0.06 });
    },
    fallo(ctx, d, t) {
      ruido(ctx, d, t, { dur: 0.34, a: 0.12, v: 0.4, tipo: "bandpass", fs: [[0, 350], [0.12, 1800], [0.32, 650]], q: 2.2 });
      ruido(ctx, d, t, { dur: 0.3, a: 0.11, v: 0.12, tipo: "bandpass", fs: [[0, 1100], [0.12, 2600], [0.28, 1400]], q: 9 });
    },
    victoria(ctx, d, t) {
      [[0, 67, 0.11, 0.3], [0.13, 67, 0.08, 0.24], [0.22, 72, 0.11, 0.28], [0.35, 76, 0.11, 0.28], [0.5, 79, 0.72, 0.32], [0.5, 72, 0.72, 0.2]]
        .forEach(([dt, m, du, v]) => trompa(ctx, d, t + dt, hz(m), du, v));
      [48, 55, 60, 64, 67].forEach((m, i) => cuerda(ctx, d, t + 0.5 + i * 0.016, hz(m), 0.2, LAUD, 0.9));
      bombo(ctx, d, t, 90, 0.35, 0.25); bombo(ctx, d, t + 0.5, 80, 0.45, 0.4);
    },
    nivel(ctx, d, t) {
      [60, 64, 67, 72, 76, 79, 84, 88].forEach((m, i) => cuerda(ctx, d, t + i * 0.05, hz(m), 0.32, ARPA_EF, 1.0));
      osc(ctx, d, t + 0.35, { f: hz(96), dur: 0.7, a: 0.05, v: 0.04 });
    },
    botin(ctx, d, t) {
      let tt = t;
      for (let i = 0; i < 7; i++) { moneda(ctx, d, tt, 0.9 + azar() * 0.3, 0.12 * (1 - i * 0.09)); tt += 0.045 + azar() * 0.05; }
    },
    derrota(ctx, d, t) {
      [45, 57, 60, 64].forEach((m, i) => osc(ctx, d, t + 0.04 * i, { tipo: "sawtooth", f: hz(m), det: (i - 1.5) * 4, dur: 1.4, a: 0.12, v: 0.1,
        lp: { fs: [[0, 1400], [1.3, 380]], q: 0.8 } }));
      [69, 64, 60, 57].forEach((m, i) => cuerda(ctx, d, t + i * 0.13, hz(m), 0.22, LAUD, 1.0));
    },
    perfecto(ctx, d, t) {
      campana(ctx, d, t, hz(84), 0.13, 1.3);
      ruido(ctx, d, t, { dur: 0.45, a: 0.08, v: 0.08, tipo: "highpass", f: 5000, f2: 9000, q: 0.7 });
      for (let i = 0; i < 5; i++) osc(ctx, d, t + 0.05 + i * 0.06, { f: 3500 + azar() * 3500, dur: 0.12, v: 0.045, a: 0.005 });
    },
    bien(ctx, d, t) {
      tabor(ctx, d, t, 0.6);
      ruido(ctx, d, t, { dur: 0.05, v: 0.18, tipo: "highpass", f: 5000, q: 0.7 });
    },
    clic(ctx, d, t) {
      ruido(ctx, d, t, { dur: 0.06, a: 0.02, v: 0.3, tipo: "bandpass", f: 2400, f2: 4800, q: 0.9 });
      ruido(ctx, d, t + 0.035, { dur: 0.03, v: 0.25, tipo: "highpass", f: 3200, q: 0.7 });
      ruido(ctx, d, t + 0.005, { dur: 0.09, a: 0.035, v: 0.14, tipo: "lowpass", f: 1300, q: 0.5 });
    },
    bloqueo(ctx, d, t) {
      osc(ctx, d, t, { f: 190, f2: 70, tf: 0.08, dur: 0.16, v: 0.5 });
      ruido(ctx, d, t, { dur: 0.05, v: 0.4, tipo: "bandpass", f: 2600, q: 0.8 });
      parciales(ctx, d, t, 620, [1, 1.47, 2.09, 2.56, 3.37, 4.18], [1, 0.8, 0.6, 0.5, 0.35, 0.25], [0.5, 0.42, 0.33, 0.26, 0.2, 0.15], 0.1, 0.005);
    },
    pasos(ctx, d, t) {
      [0, 0.3, 0.6].forEach((dt, i) => {
        const tt = t + dt, v = [0.9, 1, 0.85][i];
        ruido(ctx, d, tt, { dur: 0.09, v: 0.5 * v, tipo: "lowpass", f: 750, f2: 250, q: 0.8 });
        osc(ctx, d, tt, { f: 95, f2: 50, dur: 0.07, v: 0.4 * v });
        ruido(ctx, d, tt + 0.012, { dur: 0.06, a: 0.005, v: 0.12 * v, tipo: "bandpass", f: 2200 + azar() * 600, q: 1.5 });
        ruido(ctx, d, tt + 0.055, { dur: 0.05, v: 0.3 * v, tipo: "lowpass", f: 550, q: 0.7 });
      });
    },
    fuego(ctx, d, t) {
      ruido(ctx, d, t, { dur: 1.05, a: 0.2, v: 0.45, tipo: "lowpass", fs: [[0, 250], [0.25, 2600], [1.0, 450]], q: 1.2 });
      ruido(ctx, d, t, { dur: 1.0, a: 0.25, v: 0.35, tipo: "lowpass", f: 170, q: 0.7 });
      for (let i = 0; i < 10; i++) ruido(ctx, d, t + 0.05 + azar() * 0.85, { dur: 0.014, v: 0.12 + azar() * 0.16, tipo: "highpass", f: 3000, q: 0.7 });
    },
    hielo(ctx, d, t) {
      let tt = t;
      for (let i = 0; i < 9; i++) {
        ruido(ctx, d, tt, { dur: 0.016, v: 0.3, tipo: "highpass", f: 4500, q: 0.7 });
        if (i % 3 === 0) parciales(ctx, d, tt, 2900 + azar() * 1800, [1, 1.52, 2.17], [1, 0.6, 0.35], [0.16, 0.11, 0.08], 0.07);
        tt += 0.09 - i * 0.008;
      }
      ruido(ctx, d, t, { dur: 0.45, a: 0.03, v: 0.12, tipo: "bandpass", f: 1800, q: 3 });
      parciales(ctx, d, t + 0.38, 2093, [1, 1.51, 2.2, 2.95], [1, 0.6, 0.4, 0.25], [0.75, 0.55, 0.4, 0.3], 0.07);
    },
    critico(ctx, d, t) {
      osc(ctx, d, t, { f: 120, f2: 38, tf: 0.25, dur: 0.42, v: 0.7 });
      ruido(ctx, d, t, { dur: 0.08, v: 0.5, tipo: "bandpass", f: 1800, q: 0.7 });
      ruido(ctx, d, t, { dur: 0.22, v: 0.35, tipo: "lowpass", f: 900, f2: 200, q: 0.7 });
      parciales(ctx, d, t, 330, [1, 1.34, 1.87, 2.41, 2.93, 3.6, 4.4], [1, 0.8, 0.7, 0.55, 0.45, 0.3, 0.2],
        [1.35, 1.15, 0.95, 0.75, 0.6, 0.45, 0.35], 0.09, 0.004);
    },
    moneda(ctx, d, t) {
      const e = 0.95 + azar() * 0.1;
      moneda(ctx, d, t, e, 0.15); moneda(ctx, d, t + 0.11, e, 0.07); moneda(ctx, d, t + 0.17, e, 0.035);
    },
    puerta(ctx, d, t) {
      const s = ctx.createOscillator(), lfo = ctx.createOscillator(), lg = ctx.createGain(), g = ctx.createGain(), sal = ctx.createGain();
      s.type = "sawtooth";
      curva(s.frequency, t, [[0, 36], [0.3, 56], [0.6, 44], [0.95, 64]]);
      lfo.frequency.value = 7.3; lg.gain.value = 9; lfo.connect(lg); lg.connect(s.frequency);
      sostenida(g.gain, t, 0.08, 1, 1.0, 0.12);
      s.connect(g);
      const nodos = [lg, g, sal];
      [[520, 6, 0.9], [1250, 8, 0.55], [2600, 10, 0.25]].forEach(([f, q, a]) => {
        const fl = ctx.createBiquadFilter(), ga = ctx.createGain();
        fl.type = "bandpass"; fl.frequency.value = f; fl.Q.value = q; ga.gain.value = a;
        g.connect(fl); fl.connect(ga); ga.connect(sal); nodos.push(fl, ga);
      });
      sal.gain.value = 0.9; sal.connect(d);
      s.start(t); s.stop(t + 1.03); lfo.start(t); lfo.stop(t + 1.03); soltar(s, ...nodos);
      osc(ctx, d, t + 1.0, { f: 80, f2: 45, dur: 0.22, v: 0.5 });
      ruido(ctx, d, t + 1.0, { dur: 0.16, v: 0.4, tipo: "lowpass", f: 450, q: 0.7 });
    }
  };
  /* Ganancia de cada efecto para que suenen parejos (calibrado midiendo el RMS de su tramo más fuerte). */
  const NIVEL = {
    dado: 1, golpe: 1, herido: 1, magia: 1, cura: 1, fallo: 1, victoria: 1, nivel: 1, botin: 1, derrota: 1,
    perfecto: 1, bien: 1, clic: 1, bloqueo: 1, pasos: 1, fuego: 1, hielo: 1, critico: 1, moneda: 1, puerta: 1
  };
  const VOL_EFECTOS = 1;
  function efecto(nombre, ctx, destino) {
    const f = EFECTOS[nombre];
    if (!f || !ctx || ctx.state === "closed") return;
    const d = ctx.createGain();
    d.gain.value = (NIVEL[nombre] || 1) * VOL_EFECTOS;
    d.connect(destino || ctx.destination);
    f(ctx, d, ctx.currentTime + 0.005);
    const fin = ctx.createConstantSource ? ctx.createConstantSource() : null;   // desconecta el bus del efecto al acabar
    if (fin) { const z = ctx.createGain(); z.gain.value = 0; fin.connect(z); z.connect(d); fin.start(); fin.stop(ctx.currentTime + 1.6); soltar(fin, z, d); }
  }

  /* ---------- Música ---------- */
  const MODOS = {
    mixo: [0, 2, 4, 5, 7, 9, 10], jonico: [0, 2, 4, 5, 7, 9, 11], dorico: [0, 2, 3, 5, 7, 9, 10], frigio: [0, 1, 3, 5, 7, 8, 10],
    eolico: [0, 2, 3, 5, 7, 8, 10], armonico: [0, 2, 3, 5, 7, 8, 11], frigdom: [0, 1, 4, 5, 7, 8, 10], locrio: [0, 1, 3, 5, 6, 8, 10]
  };
  const RIT = {
    r6: [[[0, 2], [2, 1], [3, 2], [5, 1]], [[0, 1], [1, 1], [2, 1], [3, 1], [4, 1], [5, 1]], [[0, 1], [1, 1], [2, 1], [3, 3]],
      [[0, 3], [3, 1], [4, 1], [5, 1]], [[0, 2], [2, 1], [3, 1], [4, 1], [5, 1]]],
    c6: [[0, 2], [2, 1], [3, 3]],
    lento: [[[0, 4], [4, 4], [8, 4], [12, 4]], [[0, 6], [6, 2], [8, 8]], [[0, 8], [8, 4], [12, 4]], [[0, 4], [4, 2], [6, 2], [8, 8]], [[0, 12], [12, 4]]],
    clento: [[0, 4], [4, 4], [8, 8]],
    rapido: [[[0, 2], [2, 2], [4, 2], [6, 2], [8, 2], [10, 2], [12, 2], [14, 2]], [[0, 3], [3, 1], [4, 2], [6, 2], [8, 3], [11, 1], [12, 4]],
      [[0, 2], [2, 1], [3, 1], [4, 2], [6, 2], [8, 4], [12, 2], [14, 2]], [[0, 4], [4, 2], [6, 2], [8, 2], [10, 2], [12, 4]]],
    crapido: [[0, 2], [2, 2], [4, 4], [8, 8]],
    escaso: [[[0, 8]], [[4, 4], [8, 8]], [[0, 6], [6, 2], [8, 4]], [], [[0, 4], [8, 8]]],
    cescaso: [[0, 16]]
  };
  const md7 = x => ((x % 7) + 7) % 7;
  function grado(P, g) { return P.raiz + P.modo[md7(g)] + 12 * Math.floor(g / 7); }
  /* Melodía de 8 compases con forma de frase (motivo, respuesta, motivo, cadencia) a partir de una semilla. */
  function componer(P, semilla, prog) {
    const r = prng(semilla), C = P.compas, fuerte = C === 6 ? 3 : 4, lo = P.rango[0], hi = P.rango[1];
    const pick = a => a[Math.floor(r() * a.length)];
    const A = pick(P.ritmos), B = pick(P.ritmos), D = pick(P.ritmos);
    const orden = [A, B, A, D, A, B, D, P.cadencia];
    let g = Math.round((lo + hi) / 2);
    const mel = [];
    for (let b = 0; b < prog.length; b++) {
      const ac = prog[b], rit = orden[b % 8];
      if (b === 4 && prog[4] === prog[0]) {
        mel.push(mel[0].slice());
        mel[0].forEach(x => { if (x) g = x.g; });
        continue;
      }
      const fila = new Array(C).fill(null);
      rit.forEach(([o, d], i) => {
        if (b === prog.length - 1 && i === rit.length - 1) {
          g = Math.round(g / 7) * 7;
          while (g > hi) g -= 7;
          while (g < lo) g += 7;
        } else if (o % fuerte === 0) {
          const obj = g + Math.round((r() - 0.5) * 5);
          let mejor = g, bd = 99;
          for (let x = lo; x <= hi; x++) {
            const k = md7(x - ac);
            if ((k === 0 || k === 2 || k === 4) && Math.abs(x - obj) < bd) { bd = Math.abs(x - obj); mejor = x; }
          }
          g = mejor;
        } else {
          let st = r() < 0.75 ? 1 : 2;
          if (r() < 0.5) st = -st;
          g += st;
          if (g > hi || g < lo) g -= 2 * st;
        }
        fila[o] = { g, d };
      });
      mel.push(fila);
    }
    return mel;
  }
  /* Voicing de un acorde (grados ac, ac+2, ac+4) dentro de [lo, hi] en MIDI. */
  function acorde(P, ac, lo, hi, n) {
    const out = [];
    for (let i = 0; i < (n || 3); i++) {
      let m = grado(P, ac + 2 * i);
      while (m > hi) m -= 12;
      while (m < lo) m += 12;
      out.push(m);
    }
    return out.sort((a, b) => a - b);
  }

  const PISTAS = {
    taberna: {
      compas: 6, paso: 0.165, raiz: 50, modo: MODOS.mixo, semilla: 31, nivel: 1,
      prog: [0, 0, 6, 0, 0, 3, 4, 0], progB: [3, 3, 0, 0, 6, 6, 4, 0], ritmos: RIT.r6, cadencia: RIT.c6, rango: [7, 15],
      toca(m, e) {
        const { t, s, ac, P } = e;
        if (e.nota) m.laud(t, grado(P, e.nota.g), 0.4, e.nota.d * e.paso + 0.45, { prio: 2 });
        if (s === 0) m.laud(t, grado(P, ac) - 12, 0.34, 0.9, { tb: BAJO, prio: 2 });
        if (s === 3) m.rasgueo(t, acorde(P, ac, 52, 64), 0.15, 0.55);
        if (s === 5 && e.b % 2) m.rasgueo(t, acorde(P, ac, 52, 64), 0.08, 0.3);
        m.pandereta(t, s === 0 ? 0.26 : s === 3 ? 0.2 : 0.08);
        if (s === 0) m.tambor(t, 70, 0.3, 0.25);
        if (s === 3 && e.b % 4 === 3) m.tambor(t, 85, 0.18, 0.18);
      }
    },
    0: {   // bosque: flauta y arpa, dórico
      compas: 16, paso: 0.17, raiz: 52, modo: MODOS.dorico, semilla: 7, nivel: 1,
      prog: [0, 3, 0, 6, 2, 3, 6, 0], progB: [5, 6, 0, 0, 3, 3, 6, 0], ritmos: RIT.lento, cadencia: RIT.clento, rango: [10, 18],
      toca(m, e) {
        const { t, s, ac, P } = e;
        if (e.nota) m.flauta(t, grado(P, e.nota.g), 0.26, e.nota.d * e.paso, { prio: 2 });
        if (s % 2 === 0) {
          const pat = [0, 2, 4, 7, 9, 7, 4, 2];
          m.laud(t, grado(P, ac + pat[s / 2]), 0.14, 1.2, { tb: ARPA, envio: "Rb" });
        }
        if (s === 0) m.laud(t, grado(P, ac) - 12, 0.2, 1.4, { tb: ARPA, prio: 2 });
        if (s === 6 && hash(P.semilla * 31 + e.b, 5) < 0.3) m.pajaro(t, 0.05);
      }
    },
    1: {   // mazmorra: dron, gotas, campana lejana, frigio
      compas: 16, paso: 0.24, raiz: 45, modo: MODOS.frigio, semilla: 11, nivel: 1,
      prog: [0, 0, 1, 0, 0, 1, 6, 0], progB: [5, 5, 1, 1, 0, 0, 1, 0], ritmos: RIT.escaso, cadencia: RIT.cescaso, rango: [7, 12],
      toca(m, e) {
        const { t, s, ac, P, b } = e;
        if (s === 0 && b % 2 === 0) { m.dron(t, grado(P, 0) - 12, 0.16, e.paso * 32 + 1.2); m.dron(t, grado(P, 4) - 12, 0.09, e.paso * 32 + 1.2); }
        if (e.nota) m.ocarina(t, grado(P, e.nota.g), 0.22, e.nota.d * e.paso, { prio: 2 });
        if (hash(P.semilla * 977 + e.n, 1) < 0.07) m.gota(t, 1100 + hash(e.n, 2) * 1500, 0.1);
        if (s === 0 && b % 4 === 2) m.campana(t, grado(P, 7), 0.07, 2.6, "Ra");
        if (s === 0 || s === 9) m.tambor(t, 48, s ? 0.12 : 0.2, 0.5);
        if (s === 8 && ac !== 0) m.laud(t, grado(P, ac + 7), 0.1, 1.2, { tb: BAJO, envio: "Ra" });
      }
    },
    2: {   // castillo: órgano y coro, solemne, eólico armónico
      compas: 16, paso: 0.2, raiz: 48, modo: MODOS.armonico, semilla: 5, nivel: 1,
      prog: [0, 3, 4, 0, 5, 3, 4, 0], progB: [5, 1, 4, 0, 5, 3, 4, 4], ritmos: RIT.lento, cadencia: RIT.clento, rango: [9, 16],
      toca(m, e) {
        const { t, s, ac, P, b } = e, compas = e.paso * 16;
        if (s === 0) {
          acorde(P, ac, 55, 67).forEach(x => m.organo(t, x, 0.075, compas + 0.15));
          m.organo(t, grado(P, ac) - 12, 0.09, compas + 0.15, { prio: 2 });
          if (b % 2 === 0) { const x = acorde(P, ac, 62, 74); m.coro(t, x[0], 0.11, compas * 2 + 0.3); m.coro(t, x[2], 0.08, compas * 2 + 0.3); }
          m.tambor(t, 62, b % 8 === 7 ? 0.32 : 0.18, 0.6);
        }
        if (e.nota) m.organo(t, grado(P, e.nota.g) + 12, 0.1, e.nota.d * e.paso, { prio: 2, envio: "Ra" });
        if (s === 12 && b % 8 === 7) m.tambor(t, 58, 0.26, 0.6);
        if (s === 0 && b % 16 === 0) m.campana(t, grado(P, 14), 0.05, 2.4, "Ra");
      }
    },
    3: {   // volcán: tambores graves, metales y yunque, frigio dominante
      compas: 16, paso: 0.14, raiz: 46, modo: MODOS.frigdom, semilla: 13, nivel: 1,
      prog: [0, 0, 1, 0, 0, 6, 1, 0], progB: [5, 5, 6, 6, 0, 1, 1, 0], ritmos: RIT.rapido, cadencia: RIT.crapido, rango: [7, 13],
      toca(m, e) {
        const { t, s, ac, P, b } = e;
        const tb = { 0: 0.5, 3: 0.28, 6: 0.34, 8: 0.44, 11: 0.28, 14: 0.3 }[s];
        if (tb) m.tambor(t, s === 0 || s === 8 ? 52 : 66, tb, 0.4);
        if (s === 4 || s === 12) m.caja(t, 0.2);
        if (s === 10 && b % 2) m.yunque(t, 0.08);
        if (s === 0) m.dron(t, grado(P, ac) - 12, 0.22, e.paso * 16 + 0.5);
        if (s === 0 && ac !== e.acPrev) acorde(P, ac, 53, 65).forEach(x => m.metal(t, x, 0.07, 0.35));
        if (e.nota) m.metal(t, grado(P, e.nota.g), 0.15, e.nota.d * e.paso * 0.9, { prio: 2 });
      }
    },
    4: {   // abismo: pads oscuros y disonantes, locrio
      compas: 16, paso: 0.26, raiz: 43, modo: MODOS.locrio, semilla: 23, nivel: 1,
      prog: [0, 1, 0, 4, 0, 1, 6, 0], progB: [3, 4, 1, 1, 0, 6, 1, 0], ritmos: RIT.escaso, cadencia: RIT.cescaso, rango: [14, 20],
      toca(m, e) {
        const { t, s, ac, P, b } = e, compas = e.paso * 16;
        if (s === 0) { const r = grado(P, ac); [r, r + 1, r + 6].forEach(x => m.pad(t, x, 0.06, compas + 1.2)); }
        if (s === 0 && b % 2 === 0) m.sub(t, 0.18, 2.6);
        if (s === 8 && hash(P.semilla + b, 9) < 0.5) m.susurro(t, 0.07);
        if (e.nota) m.vidrio(t, grado(P, e.nota.g), 0.07, e.nota.d * e.paso + 0.4, { prio: 2 });
        if (hash(P.semilla * 31 + e.n, 4) < 0.03) m.gota(t, 600 + hash(e.n, 6) * 500, 0.06);
      }
    },
    combate: {
      compas: 16, paso: 0.115, raiz: 50, modo: MODOS.eolico, semilla: 41, nivel: 1,
      prog: [0, 6, 5, 6, 0, 6, 3, 4], progB: [3, 3, 0, 0, 5, 6, 4, 4], ritmos: RIT.rapido, cadencia: RIT.crapido, rango: [7, 14],
      toca(m, e) {
        const { t, s, ac, P } = e;
        if (s === 0 || s === 8) m.tambor(t, 80, 0.42, 0.3);
        if (s === 10 || s === 7) m.tambor(t, 95, 0.2, 0.2);
        if (s === 4 || s === 12) m.caja(t, 0.3);
        if (s % 2 === 0) m.pandereta(t, s % 4 === 0 ? 0.1 : 0.06);
        if (e.nota) m.laud(t, grado(P, e.nota.g), 0.36, e.nota.d * e.paso + 0.2, { tb: LAUD_CORTO, prio: 2 });
        const bj = { 0: 0, 6: 4, 8: 0, 14: 4 }[s];
        if (bj !== undefined) m.laud(t, grado(P, ac + bj) - 12, 0.3, 0.4, { tb: BAJO_CORTO, prio: 2 });
        if (s === 4 || s === 12) m.rasgueo(t, acorde(P, ac, 55, 67), 0.09, 0.3);
      }
    },
    jefe: {
      compas: 16, paso: 0.1, raiz: 40, modo: MODOS.armonico, semilla: 17, nivel: 1,
      prog: [0, 0, 5, 4, 0, 0, 1, 4], progB: [5, 5, 3, 4, 5, 1, 4, 4], ritmos: RIT.rapido, cadencia: RIT.crapido, rango: [10, 16],
      toca(m, e) {
        const { t, s, ac, P, b } = e;
        const tb = { 0: 0.5, 2: 0.25, 3: 0.3, 6: 0.36, 8: 0.46, 10: 0.25, 11: 0.3, 14: 0.34 }[s];
        if (tb) m.tambor(t, s === 0 || s === 8 ? 50 : 62, tb, 0.35);
        if (s === 4 || s === 12 || (b % 8 === 7 && s >= 13)) m.caja(t, s > 12 ? 0.16 : 0.26);
        if (s % 2 === 0) { const semi = [0, 0, 7, 0, 1, 0, 7, 0][s / 2]; m.laud(t, grado(P, ac) + semi, 0.28, 0.25, { tb: BAJO_CORTO, prio: 2 }); }
        if (s === 0 && ac !== e.acPrev) acorde(P, ac, 52, 64).forEach(x => m.metal(t, x, 0.06, 0.3));
        if (e.nota) m.metal(t, grado(P, e.nota.g), 0.14, e.nota.d * e.paso * 0.9, { prio: 2 });
        if (s === 0 && b % 8 === 0) m.platillo(t, 0.07);
      }
    }
  };
  const VOL_MUSICA = 1;
  const MAX_VOCES = 24;
  const comps = {};
  function composicion(k) {
    if (!comps[k]) { const P = PISTAS[k]; comps[k] = [componer(P, P.semilla * 101 + 1, P.prog), componer(P, P.semilla * 101 + 77, P.progB)]; }
    return comps[k];
  }

  class Musica {
    constructor(ctx, salida) {
      this.c = ctx;
      this.maestro = ctx.createGain();
      this.maestro.gain.value = VOL_MUSICA;
      this.maestro.connect(salida || ctx.destination);
      this.conv = ctx.createConvolver();
      this.conv.normalize = false;
      this.conv.buffer = reverb(ctx);
      this.humedo = ctx.createGain(); this.humedo.gain.value = 0.55;
      this.conv.connect(this.humedo); this.humedo.connect(this.maestro);
      this.trk = null; this.nombre = null; this.viejas = []; this.voces = [];
      this.n = 0; this.t = 0; this.acPrev = null;
    }
    pista(nombre) {
      if (nombre === null || nombre === undefined || nombre === false) return this.parar();
      let k = String(nombre);
      if (!PISTAS[k]) k = "taberna";
      if (k === this.nombre && this.trk) return;
      const c = this.c, ahora = c.currentTime, P = PISTAS[k];
      this._soltar(ahora);
      const F = c.createGain(), R = c.createGain(), Rb = c.createGain(), Ra = c.createGain();
      [F, R].forEach(g => { g.gain.setValueAtTime(0, ahora); g.gain.linearRampToValueAtTime(P.nivel, ahora + 0.35); });
      Rb.gain.value = 0.25; Ra.gain.value = 0.8;
      F.connect(this.maestro); R.connect(this.conv); Rb.connect(R); Ra.connect(R);
      /* Formantes de "ah" para el coro de la pista */
      const fo = c.createGain(), nodos = [F, R, Rb, Ra, fo];
      [[700, 6, 1], [1150, 8, 0.55], [2800, 10, 0.2]].forEach(([f, q, a]) => {
        const fl = c.createBiquadFilter(), ga = c.createGain();
        fl.type = "bandpass"; fl.frequency.value = f; fl.Q.value = q; ga.gain.value = a * 2.2;
        fo.connect(fl); fl.connect(ga); ga.connect(F); ga.connect(Rb); nodos.push(fl, ga);
      });
      this.trk = { k, P, F, R, Rb, Ra, fo, nodos, comp: composicion(k) };
      this.nombre = k; this.n = 0; this.t = ahora + 0.06; this.acPrev = null;
    }
    parar() { this._soltar(this.c.currentTime); this.trk = null; this.nombre = null; }
    tick() {
      const c = this.c;
      if (c.state === "closed") return;
      const ahora = c.currentTime;
      this._limpiar(ahora);
      const k = this.trk;
      if (!k) return;
      const P = k.P;
      if (this.t < ahora) this.t = ahora + 0.03;
      while (this.t < ahora + 0.3) {
        const b = Math.floor(this.n / P.compas), s = this.n % P.compas, sec = [0, 0, 1, 1][Math.floor(b / 8) % 4], barra = b % 8;
        const ac = (sec ? P.progB : P.prog)[barra];
        const e = { t: this.t, s, b, n: this.n, ac, acPrev: this.acPrev, P, paso: P.paso, nota: k.comp[sec][barra][s] };
        try { P.toca(this, e); } catch (err) { /* nunca romper el bucle del juego */ }
        if (s === 0) this.acPrev = ac;
        this.t += P.paso; this.n++;
      }
    }
    _soltar(ahora) {
      const k = this.trk;
      if (!k) return;
      [k.F, k.R].forEach(g => {
        const p = g.gain;
        if (p.cancelAndHoldAtTime) p.cancelAndHoldAtTime(ahora); else { p.cancelScheduledValues(ahora); p.setValueAtTime(p.value, ahora); }
        p.linearRampToValueAtTime(0, ahora + 0.6);
      });
      this.viejas.push({ nodos: k.nodos, fin: ahora + 0.7 });
      this.trk = null;
    }
    _limpiar(ahora) {
      this.viejas = this.viejas.filter(v => {
        if (ahora < v.fin + 1.5) return true;
        v.nodos.forEach(n => { try { n.disconnect(); } catch (e) {} });
        return false;
      });
      if (this.voces.length) this.voces = this.voces.filter(f => f > ahora);
    }
    /* Límite de voces: lo accesorio se omite antes que la melodía o el bajo. */
    _voz(n, fin, prio) {
      const lim = prio === 2 ? MAX_VOCES + 2 : MAX_VOCES;
      if (this.voces.length + n > lim) return false;
      for (let i = 0; i < n; i++) this.voces.push(fin);
      return true;
    }
    _d(envio) { const k = this.trk; return envio ? [k.F, k[envio]] : k.F; }

    /* ---- Instrumentos ---- */
    laud(t, m, v, dur, o = {}) {
      const tb = o.tb || LAUD;
      dur = Math.max(0.12, Math.min(dur, tb.dur));
      if (this._voz(1, t + dur, o.prio)) cuerda(this.c, this._d(o.envio), t, hz(m), v, tb, dur);
    }
    rasgueo(t, ms, v, dur) { ms.forEach((m, i) => this.laud(t + i * 0.013, m, v, dur - i * 0.013, {})); }
    flauta(t, m, v, dur, o = {}) {
      dur = Math.max(dur, 0.18);
      if (!this._voz(3, t + dur + 0.12, o.prio)) return;
      const c = this.c, d = this._d(o.envio || "Rb"), f = hz(m);
      const s = c.createOscillator(), lfo = c.createOscillator(), lg = c.createGain(), g = c.createGain();
      s.setPeriodicWave(onda(c, o.onda || "flauta"));
      s.frequency.setValueAtTime(f * 0.985, t); s.frequency.exponentialRampToValueAtTime(f, t + 0.06);
      lfo.frequency.value = 5.1;
      lg.gain.setValueAtTime(0, t); lg.gain.linearRampToValueAtTime(f * 0.005, t + Math.min(0.45, dur));
      lfo.connect(lg); lg.connect(s.frequency);
      sostenida(g.gain, t, 0.05, v, dur + 0.1, 0.13);
      s.connect(g); conectar(g, d);
      s.start(t); s.stop(t + dur + 0.12); lfo.start(t); lfo.stop(t + dur + 0.12);
      soltar(s, g, lg);
      ruido(c, d, t, { dur: 0.13, a: 0.02, v: v * 0.22, tipo: "bandpass", f: Math.min(f * 2, 8000), q: 3 });
    }
    ocarina(t, m, v, dur, o = {}) { this.flauta(t, m, v, dur, Object.assign({ onda: "ocarina", envio: "Ra" }, o)); }
    organo(t, m, v, dur, o = {}) {
      if (this._voz(1, t + dur, o.prio)) osc(this.c, this._d(o.envio || "Rb"), t, { onda: "organo", f: hz(m), dur, v, a: 0.05, rel: 0.25 });
    }
    coro(t, m, v, dur) {
      if (!this._voz(2, t + dur, 0)) return;
      [-9, 9].forEach(det => osc(this.c, this.trk.fo, t, { tipo: "sawtooth", f: hz(m), det, dur, v: v * 0.5, a: 0.4, rel: 0.6 }));
    }
    metal(t, m, v, dur, o = {}) {
      if (this._voz(2, t + dur, o.prio)) trompa(this.c, this._d("Rb"), t, hz(m), dur, v);
    }
    tambor(t, f, v, dec) { if (this._voz(2, t + dec, 1)) bombo(this.c, this._d("Rb"), t, f, v, dec); }
    caja(t, v) { if (this._voz(2, t + 0.13, 1)) tabor(this.c, this._d("Rb"), t, v); }
    pandereta(t, v) {
      if (!this._voz(1, t + 0.09, 0)) return;
      ruido(this.c, this.trk.F, t, { dur: 0.08, v, tipo: "bandpass", f: 8500, q: 0.9 });
    }
    platillo(t, v) { if (this._voz(1, t + 1, 0)) ruido(this.c, this._d("Rb"), t, { dur: 1.0, v, tipo: "highpass", f: 5000, q: 0.5 }); }
    campana(t, m, v, dur, envio) { if (this._voz(7, t + dur, 0)) campana(this.c, this._d(envio || "Ra"), t, hz(m), v, dur); }
    gota(t, f, v) { if (this._voz(1, t + 0.1, 0)) osc(this.c, this._d("Ra"), t, { f, f2: f * 1.9, tf: 0.03, dur: 0.09, v }); }
    yunque(t, v) { if (this._voz(4, t + 0.5, 0)) parciales(this.c, this._d("Rb"), t, 1850, [1, 2.32, 3.86, 5.5], [1, 0.6, 0.4, 0.2], [0.5, 0.35, 0.22, 0.15], v); }
    dron(t, m, v, dur) {
      if (this._voz(1, t + dur, 2)) osc(this.c, this._d("Rb"), t, { onda: "dron", f: hz(m), dur, v, a: 1.0, rel: 1.0 });
    }
    pad(t, m, v, dur) {
      if (!this._voz(2, t + dur, 1)) return;
      [-11, 11].forEach(det => osc(this.c, this._d("Rb"), t, { tipo: "sawtooth", f: hz(m), det, dur, v, a: 1.2, rel: 1.2,
        lp: { fs: [[0, 220], [dur * 0.5, 850], [dur, 260]], q: 1.5 } }));
    }
    sub(t, v, dur) { if (this._voz(1, t + dur, 1)) osc(this.c, this.trk.F, t, { f: 52, f2: 36, tf: dur, dur, v, a: 0.4 }); }
    susurro(t, v) { if (this._voz(1, t + 2.2, 0)) ruido(this.c, this._d("Ra"), t, { dur: 2.2, a: 1.1, v, tipo: "bandpass", fs: [[0, 300], [1.2, 1300], [2.2, 500]], q: 5 }); }
    vidrio(t, m, v, dur, o = {}) {
      dur = Math.max(dur, 0.5);
      if (!this._voz(2, t + dur, o.prio)) return;
      const c = this.c, s = c.createOscillator(), lfo = c.createOscillator(), lg = c.createGain(), g = c.createGain(), f = hz(m);
      s.frequency.value = f; lfo.frequency.value = 3.7; lg.gain.value = f * 0.008;
      lfo.connect(lg); lg.connect(s.frequency);
      sostenida(g.gain, t, 0.3, v, dur, 0.4);
      s.connect(g); conectar(g, this._d("Ra"));
      s.start(t); s.stop(t + dur + 0.02); lfo.start(t); lfo.stop(t + dur + 0.02);
      soltar(s, g, lg);
    }
    pajaro(t, v) {
      if (!this._voz(3, t + 0.5, 0)) return;
      for (let i = 0; i < 3; i++) osc(this.c, this._d("Rb"), t + i * 0.13, { fs: [[0, 2900], [0.035, 4300], [0.08, 3300]], dur: 0.09, v, a: 0.01 });
    }
  }

  RAIZ.SONIDO_MED = { efecto, Musica, efectos: Object.keys(EFECTOS), pistas: ["taberna", 0, 1, 2, 3, 4, "combate", "jefe"] };
})();
