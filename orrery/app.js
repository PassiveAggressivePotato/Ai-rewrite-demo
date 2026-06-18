/* =====================================================================
   Orrery — a living solar system
   Vanilla JS + three.js (r128) + Tone.js. Mobile-first, single page.
   ===================================================================== */
(function () {
"use strict";

if (typeof THREE === "undefined") {
  document.getElementById("loadStatus").textContent =
    "Couldn't load the 3D engine — check your connection and reload.";
  return;
}

// ---------------------------------------------------------------- helpers
const $  = (s) => document.querySelector(s);
const $$ = (s) => Array.from(document.querySelectorAll(s));
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const lerp  = (a, b, t) => a + (b - a) * t;
const easeOut = (t) => 1 - Math.pow(1 - t, 3);
const easeInOut = (t) => (t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t+2,3)/2);
const DEG = Math.PI / 180;

let toastTimer;
function toast(msg) {
  const el = $("#toast");
  el.textContent = msg;
  el.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("show"), 2600);
}

// ---------------------------------------------------------------- scene
const sceneEl = $("#scene");
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
sceneEl.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x04050c);

const camera = new THREE.PerspectiveCamera(
  55, window.innerWidth / window.innerHeight, 0.1, 20000
);

const ambient = new THREE.AmbientLight(0x33405f, 0.55);
scene.add(ambient);
// decay 0 keeps every planet lit regardless of distance, while the light still
// comes from the Sun's position so day/night terminators (phases) render correctly
const sunLight = new THREE.PointLight(0xfff2d8, 2.6, 0, 0);
scene.add(sunLight);

// starfield backdrop
(function makeStars() {
  const N = 2200, pos = new Float32Array(N * 3), col = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) {
    const r = 1600 + Math.random() * 6000;
    const t = Math.random() * Math.PI * 2, p = Math.acos(2 * Math.random() - 1);
    pos[i*3]   = r * Math.sin(p) * Math.cos(t);
    pos[i*3+1] = r * Math.cos(p);
    pos[i*3+2] = r * Math.sin(p) * Math.sin(t);
    const w = 0.6 + Math.random() * 0.4;
    const tint = Math.random();
    col[i*3]   = w * (0.8 + tint*0.2);
    col[i*3+1] = w * 0.85;
    col[i*3+2] = w * (0.9 + (1-tint)*0.1);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  g.setAttribute("color", new THREE.BufferAttribute(col, 3));
  const m = new THREE.PointsMaterial({ size: 3.0, sizeAttenuation: false, vertexColors: true, transparent: true, opacity: 0.95 });
  scene.add(new THREE.Points(g, m));
})();

// ---------------------------------------------------------------- textures
function noiseCanvas(w, h, draw) {
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  draw(c.getContext("2d"), w, h);
  const tex = new THREE.CanvasTexture(c);
  tex.anisotropy = 4;
  return tex;
}
const hex = (n) => "#" + n.toString(16).padStart(6, "0");
function shade(color, f) {
  const r = (color>>16)&255, g=(color>>8)&255, b=color&255;
  const cl = (x)=>clamp(Math.round(x),0,255);
  return `rgb(${cl(r*f)},${cl(g*f)},${cl(b*f)})`;
}

function rockyTexture(color) {
  return noiseCanvas(256, 128, (ctx, w, h) => {
    ctx.fillStyle = hex(color); ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 1400; i++) {
      const x = Math.random()*w, y = Math.random()*h;
      const r = Math.random()*4 + 0.5;
      ctx.globalAlpha = 0.06 + Math.random()*0.12;
      ctx.fillStyle = Math.random() > 0.5 ? "#fff" : "#000";
      ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill();
    }
    // a few craters
    for (let i = 0; i < 26; i++) {
      const x = Math.random()*w, y = Math.random()*h, r = Math.random()*7 + 2;
      ctx.globalAlpha = 0.25; ctx.strokeStyle = "#000"; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.stroke();
    }
    ctx.globalAlpha = 1;
  });
}
function bandedTexture(color) {
  return noiseCanvas(256, 256, (ctx, w, h) => {
    for (let y = 0; y < h; y++) {
      const t = y / h;
      const f = 0.78 + 0.22 * Math.sin(t * Math.PI * (7 + Math.sin(t*9)*3));
      ctx.fillStyle = shade(color, f);
      ctx.fillRect(0, y, w, 1);
    }
    // turbulence streaks
    for (let i = 0; i < 500; i++) {
      const y = Math.random()*h;
      ctx.globalAlpha = 0.05;
      ctx.fillStyle = Math.random()>.5 ? "#fff" : "#000";
      ctx.fillRect(Math.random()*w, y, Math.random()*40+10, 1);
    }
    ctx.globalAlpha = 1;
  });
}
function earthTexture() {
  return noiseCanvas(256, 128, (ctx, w, h) => {
    ctx.fillStyle = "#1b4fb0"; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "#2f7d3a";
    for (let i = 0; i < 60; i++) {
      const x = Math.random()*w, y = Math.random()*h;
      ctx.globalAlpha = 0.8;
      ctx.beginPath();
      ctx.ellipse(x, y, Math.random()*22+6, Math.random()*14+4, Math.random()*7, 0, 7);
      ctx.fill();
    }
    // ice caps
    ctx.globalAlpha = 0.85; ctx.fillStyle = "#eaf2ff";
    ctx.fillRect(0, 0, w, 6); ctx.fillRect(0, h-6, w, 6);
    ctx.globalAlpha = 1;
  });
}
function sunTexture() {
  return noiseCanvas(256, 256, (ctx, w, h) => {
    const g = ctx.createRadialGradient(w/2, h/2, 10, w/2, h/2, w/2);
    g.addColorStop(0, "#fff6d8"); g.addColorStop(0.5, "#ffcf52"); g.addColorStop(1, "#ff8a1e");
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 900; i++) {
      ctx.globalAlpha = 0.06;
      ctx.fillStyle = Math.random()>.5 ? "#fff7cc" : "#d2540a";
      const x=Math.random()*w,y=Math.random()*h,r=Math.random()*6+1;
      ctx.beginPath(); ctx.arc(x,y,r,0,7); ctx.fill();
    }
    ctx.globalAlpha = 1;
  });
}
function ringTexture(base) {
  return noiseCanvas(256, 16, (ctx, w, h) => {
    for (let x = 0; x < w; x++) {
      const a = 0.15 + 0.85 * Math.abs(Math.sin(x * 0.14)) * (0.5 + Math.random()*0.5);
      ctx.globalAlpha = clamp(a, 0, 1);
      ctx.fillStyle = shade(base, 0.7 + Math.random()*0.4);
      ctx.fillRect(x, 0, 1, h);
    }
    ctx.globalAlpha = 1;
  });
}

// ---------------------------------------------------------------- scaling
const SUN_R = 6;            // sun display radius (compact baseline)
const AU_UNIT = 31;        // 1 AU -> world units in "real" spacing (earth-anchored)
const COMPACT = {          // hand-tuned compact orbit radii (world units)
  mercury: 16, venus: 23, earth: 31, mars: 40,
  jupiter: 58, saturn: 78, uranus: 100, neptune: 124,
};
const anchors = BODIES.map(b => ({ a: b.a, c: COMPACT[b.id] })).sort((p,q)=>p.a-q.a);

const params = {
  distScale: 0,     // 0 = compact, 1 = real
  sizeBoost: 40,    // planet size exaggeration
  sunMass: 1,       // multiplier
  hzRing: true,
  trails: true,
  sonify: false,
  paused: false,
};

function interpCompact(au) {
  if (au <= anchors[0].a) return anchors[0].c * (au / anchors[0].a);
  for (let i = 1; i < anchors.length; i++) {
    if (au <= anchors[i].a) {
      const p = anchors[i-1], q = anchors[i];
      return lerp(p.c, q.c, (au - p.a) / (q.a - p.a));
    }
  }
  const p = anchors[anchors.length-2], q = anchors[anchors.length-1];
  return q.c + (au - q.a) * (q.c - p.c) / (q.a - p.a);
}
function auToDisplay(au) {
  return lerp(interpCompact(au), au * AU_UNIT, params.distScale);
}
// sub-linear size mapping so the giant/tiny range stays viewable
function bodyDisplayRadius(obj) {
  const rel = obj.data.radiusKm / 6371;   // Earth radii
  const base = 1.5 * Math.pow(rel, 0.4);  // compress huge dynamic range
  return base * (params.sizeBoost / 40) * (obj._userSize || 1);
}

// ---------------------------------------------------------------- build
const bodies = [];      // planets (+ sun handled separately)
const pickables = [];   // meshes for raycasting
let earthBody = null;

function unitCircle(segments) {
  const pts = [];
  for (let i = 0; i <= segments; i++) {
    const t = (i / segments) * Math.PI * 2;
    pts.push(new THREE.Vector3(Math.cos(t), 0, Math.sin(t)));
  }
  const g = new THREE.BufferGeometry().setFromPoints(pts);
  return g;
}
const circleGeo = unitCircle(128);

// --- The Sun
const sunMat = new THREE.MeshBasicMaterial({ map: sunTexture(), color: 0xffffff });
const sunMesh = new THREE.Mesh(new THREE.SphereGeometry(SUN_R, 48, 48), sunMat);
sunMesh.userData.bodyId = "sun";
scene.add(sunMesh);
pickables.push(sunMesh);
// glow sprite
const glowTex = noiseCanvas(128, 128, (ctx, w, h) => {
  const g = ctx.createRadialGradient(w/2,h/2,0,w/2,h/2,w/2);
  g.addColorStop(0, "rgba(255,220,140,0.9)");
  g.addColorStop(0.4, "rgba(255,170,60,0.35)");
  g.addColorStop(1, "rgba(255,150,40,0)");
  ctx.fillStyle = g; ctx.fillRect(0,0,w,h);
});
const sunGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
sunGlow.scale.set(SUN_R*5, SUN_R*5, 1);
scene.add(sunGlow);

const sunState = { baseR: SUN_R, color: 0xffcc55 };

// --- Planets
function makeBody(b, parentBody) {
  const group = new THREE.Group();           // positioned at orbit point
  scene.add(group);
  const tilt = new THREE.Group();            // axial tilt
  tilt.rotation.z = (b.tilt || 0) * DEG;
  group.add(tilt);

  let map;
  if (b.id === "earth") map = earthTexture();
  else if (b.bands)     map = bandedTexture(b.color);
  else                  map = rockyTexture(b.color);

  const mat = new THREE.MeshStandardMaterial({
    map, color: 0xffffff, roughness: 0.92, metalness: 0.0,
  });
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(1, 40, 40), mat);
  mesh.userData.bodyId = b.id;
  tilt.add(mesh);
  pickables.push(mesh);

  // rings
  let ringMesh = null;
  if (b.rings) {
    const rg = new THREE.RingGeometry(1.4, 2.4, 64);
    // remap UVs so the ring texture runs radially
    const pos = rg.attributes.position, uv = rg.attributes.uv;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), y = pos.getY(i);
      const rr = Math.sqrt(x*x + y*y);
      uv.setXY(i, (rr - 1.4) / 1.0, 0.5);
    }
    const rmat = new THREE.MeshBasicMaterial({
      map: ringTexture(b.color), side: THREE.DoubleSide, transparent: true, opacity: 0.85,
    });
    ringMesh = new THREE.Mesh(rg, rmat);
    ringMesh.rotation.x = Math.PI / 2;
    tilt.add(ringMesh);
  }

  // orbit trail
  const trailMat = new THREE.LineBasicMaterial({ color: 0x4763a8, transparent: true, opacity: 0.35 });
  const trail = new THREE.LineLoop(circleGeo, trailMat);
  if (parentBody) parentBody.group.add(trail); else scene.add(trail);

  const obj = {
    data: b, group, tilt, mesh, ringMesh, trail,
    parent: parentBody || null,
    phase0: Math.random() * Math.PI * 2,
    angle: 0, spin: 0,
    _userSize: 1, _userDist: 1, _userSpin: 1,
    displayR: 1, orbitR: 1,
    moons: [],
  };
  b._userSize = 1;
  return obj;
}

BODIES.forEach((b) => {
  const obj = makeBody(b, null);
  bodies.push(obj);
  if (b.id === "earth") earthBody = obj;
  if (b.moons) b.moons.forEach((m) => {
    const mo = makeBody(m, obj);
    obj.moons.push(mo);
  });
});

// --- Habitable zone ring
function hzRingMaterial() {
  return new THREE.MeshBasicMaterial({ color: 0x2fd27a, transparent: true, opacity: 0.10, side: THREE.DoubleSide });
}
let hzMesh = new THREE.Mesh(new THREE.RingGeometry(1, 1.4, 96), hzRingMaterial());
hzMesh.rotation.x = Math.PI / 2;
scene.add(hzMesh);

function updateHZ() {
  hzMesh.visible = params.hzRing;
  if (!params.hzRing) return;
  const L = Math.pow(params.sunMass, 3.5);     // mass–luminosity relation
  const inner = auToDisplay(0.95 * Math.sqrt(L));
  const outer = auToDisplay(1.37 * Math.sqrt(L));
  hzMesh.geometry.dispose();
  hzMesh.geometry = new THREE.RingGeometry(inner, outer, 96);
}

// ---------------------------------------------------------------- camera ctl
const cam = { radius: 60, theta: 0.9, phi: 1.05, tx: 0, ty: 0, tz: 0 };
let followBody = null;

function applyCamera() {
  if (followBody) {
    cam.tx = followBody.group.position.x;
    cam.ty = followBody.group.position.y;
    cam.tz = followBody.group.position.z;
  }
  const sp = Math.sin(cam.phi);
  camera.position.set(
    cam.tx + cam.radius * sp * Math.cos(cam.theta),
    cam.ty + cam.radius * Math.cos(cam.phi),
    cam.tz + cam.radius * sp * Math.sin(cam.theta)
  );
  camera.lookAt(cam.tx, cam.ty, cam.tz);
}

// simple multi-field tweener over cam
const tweens = [];
function tweenCam(target, dur, ease) {
  const keys = Object.keys(target);
  const start = {};
  keys.forEach(k => start[k] = cam[k]);
  tweens.length = 0; // single camera tween at a time
  tweens.push({ keys, start, target, dur, ease: ease || easeInOut, t: 0 });
}
function updateTweens(dt) {
  for (let i = tweens.length - 1; i >= 0; i--) {
    const tw = tweens[i];
    tw.t += dt;
    const k = clamp(tw.t / tw.dur, 0, 1);
    const e = tw.ease(k);
    tw.keys.forEach(key => { cam[key] = lerp(tw.start[key], tw.target[key], e); });
    if (k >= 1) tweens.splice(i, 1);
  }
}

const VIEWS = {
  oblique: { phi: 1.05, theta: 0.9 },
  top:     { phi: 0.12, theta: 0.9 },
  side:    { phi: 1.52, theta: 0.9 },
};
function setView(name) {
  if (name === "follow") {
    const fb = findBody(selected);
    if (!fb) { toast("Pick a planet or moon (not the Sun) to follow."); return; }
    followBody = fb;
    const r = followBody.displayR;
    tweenCam({ radius: clamp(r * 7, 9, 80), phi: 1.0 }, 1.0);
  } else {
    followBody = null;
    const v = VIEWS[name];
    tweenCam({ phi: v.phi, theta: cam.theta, tx: 0, ty: 0, tz: 0, radius: overviewRadius() }, 1.1);
  }
  $$("#angles button").forEach(btn => btn.classList.toggle("active", btn.dataset.view === name));
}
function overviewRadius() {
  const neptune = auToDisplay(30.07);
  return clamp(neptune * 1.9, 120, 4000);
}

// ---------------------------------------------------------------- physics
let simDays = 0;
function speedFromSlider(v) {
  return Math.sign(v) * (Math.pow(10, Math.abs(v)) - 1); // days per second
}
let daysPerSec = speedFromSlider(0.8);

function updateBodies(dt) {
  const effSpeed = params.paused ? 0 : daysPerSec;
  simDays += effSpeed * dt;
  const years = simDays / 365.25;
  const massFactor = Math.sqrt(params.sunMass);

  for (const obj of bodies) {
    const b = obj.data;
    const meanMotion = (2 * Math.PI / b.period) * massFactor; // rad/year
    obj.angle = obj.phase0 + meanMotion * years;

    obj.orbitR = auToDisplay(b.a) * obj._userDist;
    obj.group.position.set(Math.cos(obj.angle) * obj.orbitR, 0, Math.sin(obj.angle) * obj.orbitR);

    obj.displayR = bodyDisplayRadius(obj);
    obj.mesh.scale.setScalar(obj.displayR);
    if (obj.ringMesh) obj.ringMesh.scale.setScalar(obj.displayR);

    obj.trail.visible = params.trails;
    obj.trail.scale.set(obj.orbitR, 1, obj.orbitR);

    // spin
    const spinRate = (effSpeed / (Math.abs(b.day) || 1)) * Math.sign(b.day || 1) * obj._userSpin;
    obj.mesh.rotation.y += spinRate * dt * 0.6;

    // moons
    for (const mo of obj.moons) {
      const mb = mo.data;
      const mn = (2 * Math.PI / mb.period) * massFactor;
      mo.angle = mo.phase0 + mn * years;
      const moonOrbit = (obj.displayR * 2.6 + 2.4) * mo._userDist;
      mo.orbitR = moonOrbit;
      mo.group.position.set(
        obj.group.position.x + Math.cos(mo.angle) * moonOrbit,
        obj.group.position.y,
        obj.group.position.z + Math.sin(mo.angle) * moonOrbit
      );
      mo.displayR = bodyDisplayRadius(mo) * 0.6;
      mo.mesh.scale.setScalar(mo.displayR);
      mo.trail.visible = params.trails;
      mo.trail.scale.set(moonOrbit, 1, moonOrbit);
      mo.mesh.rotation.y += spinRate * dt * 0.4;
    }
  }
  maybeSonify();
}

// ---------------------------------------------------------------- find
function allBodies() {
  const out = [];
  for (const o of bodies) { out.push(o); o.moons.forEach(m => out.push(m)); }
  return out;
}
function findBody(id) {
  if (id === "sun") return null;
  return allBodies().find(o => o.data.id === id) || null;
}
function bodyData(id) {
  if (id === "sun") return SUN;
  const o = findBody(id);
  return o ? o.data : null;
}

// ---------------------------------------------------------------- audio
const audio = {
  ready: false, pad: null, reverb: null, pluck: null, muted: false,
  notes: {}, lastWrap: {},
};
async function initAudio() {
  if (audio.ready || typeof Tone === "undefined") return;
  try {
    await Tone.start();
    const reverb = new Tone.Reverb({ decay: 9, wet: 0.55 }).toDestination();
    const filter = new Tone.Filter(900, "lowpass").connect(reverb);
    const pad = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: "sine" },
      envelope: { attack: 3, decay: 2, sustain: 0.8, release: 6 },
      volume: -22,
    }).connect(filter);
    const pluck = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: "triangle" },
      envelope: { attack: 0.005, decay: 0.4, sustain: 0, release: 0.6 },
      volume: -14,
    }).connect(reverb);

    const chords = [
      ["A2","E3","A3","C4","E4"],
      ["F2","C3","F3","A3","C4"],
      ["G2","D3","G3","B3","D4"],
      ["D2","A2","D3","F3","A3"],
    ];
    let ci = 0;
    new Tone.Loop((time) => {
      pad.triggerAttackRelease(chords[ci % chords.length], "8m", time);
      ci++;
    }, "8m").start(0);
    Tone.Transport.bpm.value = 60;
    Tone.Transport.start();

    // assign sonification notes: outer = low, inner = high (pentatonic)
    const scale = ["C2","D2","E2","G2","A2","C3","D3","E3","G3","A3","C4","D4","E4","G4","A4"];
    bodies.slice().reverse().forEach((o, i) => {
      audio.notes[o.data.id] = scale[Math.min(i + 4, scale.length - 1)];
    });

    audio.pad = pad; audio.reverb = reverb; audio.pluck = pluck;
    audio.ready = true;
    setAudioMute(audio.muted);
  } catch (e) {
    console.warn("audio init failed", e);
  }
}
function setAudioMute(m) {
  audio.muted = m;
  if (typeof Tone !== "undefined" && Tone.Destination) {
    Tone.Destination.mute = m;
  }
}
let lastPluck = 0;
function maybeSonify() {
  if (!params.sonify || !audio.ready || params.paused) return;
  const sp = Math.abs(daysPerSec);
  if (sp < 0.5 || sp > 800) return;          // out of musical range
  const now = (typeof Tone !== "undefined") ? Tone.now() : 0;
  for (const o of bodies) {
    const wrapped = Math.floor((o.angle - o.phase0) / (Math.PI * 2));
    if (audio.lastWrap[o.data.id] === undefined) { audio.lastWrap[o.data.id] = wrapped; continue; }
    if (wrapped !== audio.lastWrap[o.data.id]) {
      audio.lastWrap[o.data.id] = wrapped;
      if (now - lastPluck > 0.04) {
        try { audio.pluck.triggerAttackRelease(audio.notes[o.data.id] || "C3", "8n", now); } catch (e) {}
        lastPluck = now;
      }
    }
  }
}

// ---------------------------------------------------------------- selection + facts
let selected = null;
const factState = { id: null, facts: [], idx: 0, url: null };

function selectBody(id) {
  selected = id;
  const d = bodyData(id);
  if (!d) return;
  $("#info").classList.remove("hidden");
  $("#infoName").textContent = d.name;
  $("#infoTag").textContent = d.kind || "";
  loadFacts(d);
  // selected-tab controls
  $("#bodyEmpty").classList.add("hidden");
  $("#bodyControls").classList.remove("hidden");
  $("#bodySel").textContent = d.name;
  const o = findBody(id);
  $("#bodySize").value = o ? o._userSize : 1;
  $("#bodySizeVal").textContent = (o ? o._userSize : 1).toFixed(1) + "×";
  $("#bodyDistWrap").style.display = (id === "sun") ? "none" : "";
  if (o) {
    $("#bodyDist").value = o._userDist; $("#bodyDistVal").textContent = o._userDist.toFixed(1) + "×";
    $("#bodySpin").value = o._userSpin; $("#bodySpinVal").textContent = o._userSpin.toFixed(1) + "×";
  }
}

function renderFact() {
  const f = factState.facts;
  $("#infoFact").textContent = f.length ? f[factState.idx] : "No facts available.";
  $("#factCount").textContent = f.length ? (factState.idx + 1) + " / " + f.length : "—";
  const src = $("#infoSource");
  if (factState.url) { src.classList.remove("hidden"); } else { src.classList.add("hidden"); }
}
function setPhoto(url) {
  const ph = $("#infoPhoto");
  if (url) {
    ph.classList.remove("empty");
    ph.style.backgroundImage = `url("${url}")`;
  } else {
    ph.classList.add("empty");
    ph.style.backgroundImage = "";
  }
}
function loadFacts(d) {
  const id = d.id;
  factState.id = id;
  factState.idx = 0;
  factState.facts = (FACTS[id] || []).slice();
  factState.url = "https://en.wikipedia.org/wiki/" + encodeURIComponent(d.wiki || d.name);
  setPhoto(null);
  renderFact();
  fetchWiki(d).catch(() => {});
}
async function fetchWiki(d) {
  const title = d.wiki || d.name;
  const url = "https://en.wikipedia.org/api/rest_v1/page/summary/" + encodeURIComponent(title);
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) return;
  const j = await res.json();
  if (factState.id !== d.id) return;  // user moved on
  const img = (j.originalimage && j.originalimage.source) || (j.thumbnail && j.thumbnail.source);
  if (img) setPhoto(img);
  if (j.content_urls && j.content_urls.desktop) factState.url = j.content_urls.desktop.page;
  if (j.extract) {
    const sentences = j.extract.replace(/\s+/g, " ").match(/[^.!?]+[.!?]+/g) || [j.extract];
    const extra = sentences.map(s => s.trim()).filter(s => s.length > 25);
    const seen = new Set(factState.facts);
    extra.forEach(s => { if (!seen.has(s)) { factState.facts.push(s); seen.add(s); } });
  }
  renderFact();
}

// ---------------------------------------------------------------- what-if
const whatif = { objs: [], jupiterLight: null, active: new Set() };
function clearWhatIf() {
  whatif.objs.forEach(o => { scene.remove(o); o.geometry && o.geometry.dispose(); });
  whatif.objs.length = 0;
  if (whatif.jupiterLight) { scene.remove(whatif.jupiterLight); whatif.jupiterLight = null; }
  // restore jupiter
  const jup = findBody("jupiter");
  if (jup) { jup.mesh.material.emissive = new THREE.Color(0x000000); jup.mesh.material.emissiveIntensity = 0; }
  // restore earth rings
  const earth = findBody("earth");
  if (earth && earth._extraRing) { earth.tilt.remove(earth._extraRing); earth._extraRing = null; }
  // restore sun
  sunMesh.scale.setScalar(1);
  sunMesh.material.color.setHex(0xffffff);
  sunLight.color.setHex(0xfff2d8);
  whatif.active.clear();
}
function applyWhatIf(which) {
  if (which === "reset") { clearWhatIf(); toast("System restored."); return; }
  whatif.active.add(which);
  if (which === "ignite") {
    const jup = findBody("jupiter");
    jup.mesh.material.emissive = new THREE.Color(0xff7b3a);
    jup.mesh.material.emissiveIntensity = 1.3;
    const light = new THREE.PointLight(0xff8a4a, 1.6, 0, 1.6);
    scene.add(light); whatif.jupiterLight = light;
    toast("Jupiter ignites into a brown dwarf 🔥");
  } else if (which === "earthrings") {
    const earth = findBody("earth");
    if (earth._extraRing) return;
    const rg = new THREE.RingGeometry(1.5, 2.6, 64);
    const rmat = new THREE.MeshBasicMaterial({ map: ringTexture(0x9fd8ff), side: THREE.DoubleSide, transparent: true, opacity: 0.8 });
    const ring = new THREE.Mesh(rg, rmat);
    ring.rotation.x = Math.PI / 2;
    ring.scale.setScalar(earth.displayR);
    earth.tilt.add(ring);
    earth._extraRing = ring;
    // keep it scaled with the planet
    toast("Earth gets a ring system 💍");
  } else if (which === "binary") {
    const companion = new THREE.Mesh(
      new THREE.SphereGeometry(SUN_R * 0.7, 32, 32),
      new THREE.MeshBasicMaterial({ map: sunTexture(), color: 0xffd9a0 })
    );
    companion.userData.spin = 0;
    scene.add(companion); whatif.objs.push(companion);
    const light = new THREE.PointLight(0xffd9a0, 1.4, 0, 1.5);
    scene.add(light); whatif.objs.push(light);
    companion._isCompanion = true; light._companion = companion;
    whatif._companion = companion; whatif._companionLight = light;
    toast("A companion star joins the dance ☀️☀️");
  } else if (which === "rogue") {
    const rogue = new THREE.Mesh(
      new THREE.SphereGeometry(2.4, 24, 24),
      new THREE.MeshStandardMaterial({ map: rockyTexture(0x55504a), roughness: 1 })
    );
    rogue._rogueT = -1;
    scene.add(rogue); whatif.objs.push(rogue);
    whatif._rogue = rogue;
    toast("A rogue planet tears through the system 🪨");
  } else if (which === "swell") {
    sunMesh.scale.setScalar(4.2);
    sunMesh.material.color.setHex(0xff6a3a);
    sunLight.color.setHex(0xff7a4a);
    toast("The Sun swells into a red giant 🔴");
  }
}
function updateWhatIf(dt) {
  if (whatif._companion) {
    const t = performance.now() * 0.0002;
    const R = SUN_R * 4;
    whatif._companion.position.set(Math.cos(t) * R, 0, Math.sin(t) * R);
    whatif._companion.rotation.y += dt * 0.3;
    if (whatif._companionLight) whatif._companionLight.position.copy(whatif._companion.position);
  }
  if (whatif._rogue) {
    const r = whatif._rogue;
    r._rogueT += dt * 0.06 * (params.paused ? 0 : 1);
    if (r._rogueT > 1) r._rogueT = -1;
    const span = overviewRadius() * 1.2;
    r.position.set(lerp(-span, span, (r._rogueT + 1) / 2), lerp(-20, 20, (r._rogueT + 1) / 2) * 0.3, -span * 0.3);
    r.rotation.y += dt;
  }
  // keep earth's what-if ring scaled with planet
  const earth = findBody("earth");
  if (earth && earth._extraRing) earth._extraRing.scale.setScalar(earth.displayR);
}

// ---------------------------------------------------------------- input
const ray = new THREE.Raycaster();
const ndc = new THREE.Vector2();
let pointer = { down: false, moved: false, x: 0, y: 0, sx: 0, sy: 0, t: 0 };
let pinch = { active: false, dist: 0 };

function onDown(e) {
  const t = e.touches ? e.touches[0] : e;
  if (e.touches && e.touches.length === 2) {
    pinch.active = true;
    pinch.dist = touchDist(e.touches);
    return;
  }
  pointer.down = true; pointer.moved = false;
  pointer.x = pointer.sx = t.clientX;
  pointer.y = pointer.sy = t.clientY;
  pointer.t = performance.now();
}
function onMove(e) {
  if (pinch.active && e.touches && e.touches.length === 2) {
    const d = touchDist(e.touches);
    const ratio = pinch.dist / d;
    cam.radius = clamp(cam.radius * ratio, 8, 6000);
    pinch.dist = d;
    e.preventDefault();
    return;
  }
  if (!pointer.down) return;
  const t = e.touches ? e.touches[0] : e;
  const dx = t.clientX - pointer.x, dy = t.clientY - pointer.y;
  if (Math.abs(t.clientX - pointer.sx) + Math.abs(t.clientY - pointer.sy) > 6) pointer.moved = true;
  cam.theta -= dx * 0.006;
  cam.phi = clamp(cam.phi - dy * 0.006, 0.08, Math.PI - 0.08);
  pointer.x = t.clientX; pointer.y = t.clientY;
  e.preventDefault();
}
function onUp(e) {
  if (pinch.active) { pinch.active = false; pointer.down = false; return; }
  if (pointer.down && !pointer.moved && performance.now() - pointer.t < 400) {
    tryPick(pointer.sx, pointer.sy);
  }
  pointer.down = false;
}
function touchDist(ts) {
  const dx = ts[0].clientX - ts[1].clientX, dy = ts[0].clientY - ts[1].clientY;
  return Math.hypot(dx, dy);
}
function tryPick(x, y) {
  ndc.x = (x / window.innerWidth) * 2 - 1;
  ndc.y = -(y / window.innerHeight) * 2 + 1;
  ray.setFromCamera(ndc, camera);
  const hits = ray.intersectObjects(pickables, false);
  if (hits.length) {
    const id = hits[0].object.userData.bodyId;
    selectBody(id);
    const o = findBody(id);
    if (o) {
      followBody = null;
      const targetR = clamp(o.displayR * 8, 9, 90);
      tweenCam({ tx: o.group.position.x, ty: o.group.position.y, tz: o.group.position.z, radius: targetR, phi: 1.0 }, 1.1);
      // after arriving, follow it
      setTimeout(() => { if (selected === id) followBody = o; }, 1150);
    } else { // sun
      followBody = null;
      tweenCam({ tx: 0, ty: 0, tz: 0, radius: SUN_R * 6, phi: 1.0 }, 1.1);
    }
  }
}

const dom = renderer.domElement;
dom.addEventListener("mousedown", onDown);
window.addEventListener("mousemove", onMove, { passive: false });
window.addEventListener("mouseup", onUp);
dom.addEventListener("touchstart", onDown, { passive: false });
dom.addEventListener("touchmove", onMove, { passive: false });
dom.addEventListener("touchend", onUp);
dom.addEventListener("wheel", (e) => {
  cam.radius = clamp(cam.radius * (1 + Math.sign(e.deltaY) * 0.1), 8, 6000);
  e.preventDefault();
}, { passive: false });

// ---------------------------------------------------------------- UI wiring
$("#playPause").addEventListener("click", () => {
  params.paused = !params.paused;
  $("#playPause").textContent = params.paused ? "▶" : "⏸";
});
$("#soundToggle").addEventListener("click", () => {
  params.sonify = !params.sonify;
  $("#soundToggle").classList.toggle("off", !params.sonify);
  toast(params.sonify ? "Harmony of the spheres: on ♪" : "Sonification off");
});
$("#trailToggle").addEventListener("click", () => {
  params.trails = !params.trails;
  $("#trailToggle").classList.toggle("off", !params.trails);
  $("#trailToggle2").checked = params.trails;
});
$("#panelToggle").addEventListener("click", () => {
  $("#sheet").classList.toggle("down");
});

$("#speed").addEventListener("input", (e) => {
  daysPerSec = speedFromSlider(parseFloat(e.target.value));
  const a = Math.abs(daysPerSec);
  let label;
  if (a < 0.01) label = "paused";
  else if (a < 2) label = daysPerSec.toFixed(2) + " days/s";
  else if (a < 400) label = Math.round(daysPerSec) + " days/s";
  else label = (daysPerSec / 365.25).toFixed(1) + " yr/s";
  $("#speedLabel").textContent = label;
});

$$("#angles button").forEach(btn => btn.addEventListener("click", () => setView(btn.dataset.view)));

$("#infoClose").addEventListener("click", () => { $("#info").classList.add("hidden"); selected = null; });
$("#factPrev").addEventListener("click", () => {
  if (!factState.facts.length) return;
  factState.idx = (factState.idx - 1 + factState.facts.length) % factState.facts.length;
  renderFact();
});
$("#factNext").addEventListener("click", () => {
  if (!factState.facts.length) return;
  factState.idx = (factState.idx + 1) % factState.facts.length;
  renderFact();
});
$("#infoSource").addEventListener("click", () => { if (factState.url) window.open(factState.url, "_blank"); });

// sheet tabs
$$(".tabs button").forEach(btn => btn.addEventListener("click", () => {
  $$(".tabs button").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");
  $$(".tabPanel").forEach(p => p.classList.toggle("hidden", p.dataset.panel !== btn.dataset.tab));
}));

// system controls
$("#sunMass").addEventListener("input", (e) => {
  params.sunMass = parseFloat(e.target.value);
  $("#sunMassVal").textContent = params.sunMass.toFixed(2) + "×";
  const b = clamp(params.sunMass, 0.3, 3);
  sunLight.intensity = 2.6 * Math.pow(b, 1.2);
  if (!whatif.active.has("swell")) {
    sunMesh.scale.setScalar(lerp(0.8, 1.6, clamp((b - 0.2) / 2.8, 0, 1)));
    sunGlow.scale.setScalar(SUN_R * 5 * sunMesh.scale.x);
  }
  updateHZ();
});
$("#distScale").addEventListener("input", (e) => {
  params.distScale = parseFloat(e.target.value);
  $("#distVal").textContent = params.distScale < 0.05 ? "compact"
    : params.distScale > 0.95 ? "true scale" : Math.round(params.distScale * 100) + "%";
  updateHZ();
  if (!followBody && !selected) tweenCam({ radius: overviewRadius() }, 0.6, easeOut);
});
$("#sizeBoost").addEventListener("input", (e) => {
  params.sizeBoost = parseFloat(e.target.value);
  $("#sizeVal").textContent = params.sizeBoost + "×";
});
$("#hzToggle").addEventListener("change", (e) => { params.hzRing = e.target.checked; updateHZ(); });
$("#trailToggle2").addEventListener("change", (e) => {
  params.trails = e.target.checked;
  $("#trailToggle").classList.toggle("off", !params.trails);
});

// selected-body controls
$("#bodySize").addEventListener("input", (e) => {
  const o = findBody(selected); if (!o) return;
  o._userSize = parseFloat(e.target.value);
  $("#bodySizeVal").textContent = o._userSize.toFixed(1) + "×";
});
$("#bodyDist").addEventListener("input", (e) => {
  const o = findBody(selected); if (!o) return;
  o._userDist = parseFloat(e.target.value);
  $("#bodyDistVal").textContent = o._userDist.toFixed(1) + "×";
});
$("#bodySpin").addEventListener("input", (e) => {
  const o = findBody(selected); if (!o) return;
  o._userSpin = parseFloat(e.target.value);
  $("#bodySpinVal").textContent = o._userSpin.toFixed(1) + "×";
});
$("#focusBtn").addEventListener("click", () => { if (selected) setView("follow"); });

$$(".whatif-grid button").forEach(btn => btn.addEventListener("click", () => applyWhatIf(btn.dataset.wi)));

// ---------------------------------------------------------------- intro warp
const warp = $("#warp");
const wctx = warp.getContext("2d");
let warpStars = [], warpRAF = 0, warpRunning = true;
function sizeWarp() {
  warp.width = window.innerWidth; warp.height = window.innerHeight;
}
function initWarp() {
  sizeWarp();
  warpStars = [];
  for (let i = 0; i < 320; i++) {
    warpStars.push({ x: (Math.random()-0.5)*warp.width, y: (Math.random()-0.5)*warp.height, z: Math.random()*warp.width });
  }
}
function drawWarp() {
  if (!warpRunning) return;
  const w = warp.width, h = warp.height, cx = w/2, cy = h/2;
  wctx.fillStyle = "rgba(5,6,13,0.35)";
  wctx.fillRect(0, 0, w, h);
  for (const s of warpStars) {
    s.z -= w * 0.012;
    if (s.z < 1) { s.z = w; s.x = (Math.random()-0.5)*w; s.y = (Math.random()-0.5)*h; }
    const k = 128 / s.z;
    const x = cx + s.x * k, y = cy + s.y * k;
    const px = cx + s.x * (128 / (s.z + w*0.012)), py = cy + s.y * (128 / (s.z + w*0.012));
    const size = clamp((1 - s.z / w) * 2.4, 0.2, 2.6);
    wctx.strokeStyle = `rgba(${180+Math.random()*60|0},210,255,${clamp(1 - s.z/w,0.1,1)})`;
    wctx.lineWidth = size;
    wctx.beginPath(); wctx.moveTo(px, py); wctx.lineTo(x, y); wctx.stroke();
  }
  warpRAF = requestAnimationFrame(drawWarp);
}

// ---------------------------------------------------------------- start
let started = false;
function start() {
  if (started) return;
  started = true;
  audio.muted = $("#muteIntro").checked;
  initAudio();

  const title = $("#title");
  title.classList.add("fade");
  setTimeout(() => { warpRunning = false; cancelAnimationFrame(warpRAF); title.remove(); }, 1200);

  // reveal UI
  ["#hud", "#angles", "#speedDock", "#sheet"].forEach(s => $(s).classList.remove("hidden"));
  $("#sheet").classList.add("down");
  $("#soundToggle").classList.add("off"); // sonify starts off

  // zoom out reveal
  cam.radius = 14; cam.phi = 1.25; cam.theta = 0.4;
  tweenCam({ radius: overviewRadius(), phi: 1.05, theta: 0.9 }, 3.2, easeInOut);

  // initial labels
  $("#speed").value = 0.8;
  $("#speed").dispatchEvent(new Event("input"));
  updateHZ();
  toast("Tap any planet to explore it.");
}
$("#startBtn").addEventListener("click", start);

// ---------------------------------------------------------------- loop
let last = performance.now();
let clockAccum = 0;
function animate(now) {
  requestAnimationFrame(animate);
  let dt = (now - last) / 1000; last = now;
  dt = Math.min(dt, 0.05);

  updateTweens(dt);
  updateBodies(dt);
  updateWhatIf(dt);
  sunMesh.rotation.y += dt * 0.05;
  applyCamera();

  clockAccum += dt;
  if (clockAccum > 0.12) {
    clockAccum = 0;
    const clk = $("#clock");
    if (clk) clk.textContent = "Year " + (simDays / 365.25).toFixed(2);
  }
  renderer.render(scene, camera);
}

// ---------------------------------------------------------------- resize
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  sizeWarp();
});

// pre-start: gentle drift over the system behind the title
cam.radius = 90; cam.phi = 1.1; cam.theta = 0;
updateHZ();
initWarp();
drawWarp();
requestAnimationFrame(animate);
$("#loadStatus").textContent = "ready";

// slow auto-spin before the user starts
(function preSpin() {
  if (started) return;
  cam.theta += 0.0008;
  requestAnimationFrame(preSpin);
})();

})();
