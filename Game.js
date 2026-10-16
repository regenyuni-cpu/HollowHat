const $ = i => document.getElementById(i), rnd = (a, b) => a + Math.random() * (b - a), ri = (a, b) => Math.floor(rnd(a, b));
const W = 800, H = 480, VW = 320, VH = 180, cv = $('g'), ctx = cv.getContext('2d'), dk = document.createElement('canvas'); dk.width = VW; dk.height = VH; const dx = dk.getContext('2d');
const WALLS = [[110, 10, 680, 8], [110, 462, 680, 8], [782, 10, 8, 460], [110, 10, 8, 280], [110, 350, 8, 120], [330, 18, 8, 82], [330, 150, 8, 90], [330, 248, 8, 82], [330, 380, 8, 82], [560, 18, 8, 82], [560, 150, 8, 90], [560, 248, 8, 82], [560, 380, 8, 82], [118, 240, 72, 8], [240, 240, 90, 8], [338, 240, 82, 8], [470, 240, 90, 8], [568, 240, 82, 8], [700, 240, 82, 8], [380, 100, 50, 8], [620, 380, 60, 8], [240, 380, 8, 60]];
const DOORS = [{ x: 110, y: 290, w: 8, h: 60 }, { x: 330, y: 100, w: 8, h: 50 }, { x: 330, y: 330, w: 8, h: 50 }, { x: 560, y: 100, w: 8, h: 50 }, { x: 560, y: 330, w: 8, h: 50 }, { x: 190, y: 240, w: 50, h: 8 }, { x: 420, y: 240, w: 50, h: 8 }, { x: 650, y: 240, w: 50, h: 8 }];
const HIDES = [{ x: 128, y: 26, w: 22, h: 34, t: 'closet' }, { x: 380, y: 150, w: 40, h: 22, t: 'table' }, { x: 690, y: 30, w: 30, h: 36, t: 'closet' }, { x: 150, y: 400, w: 50, h: 22, t: 'couch' }, { x: 430, y: 420, w: 50, h: 22, t: 'couch' }, { x: 640, y: 300, w: 40, h: 22, t: 'table' }, { x: 350, y: 30, w: 30, h: 36, t: 'closet' }, { x: 700, y: 420, w: 50, h: 22, t: 'couch' }];
const RN = ['Study', 'Kitchen', 'Nursery', 'Foyer', 'Living Room', 'Bedroom'], LOC = [['Mercer House', '#2b2219', '#251d15'], ['Willow Lane Cabin', '#232a1b', '#1d2316'], ['Dunmore Clinic', '#1f2830', '#192026'], ['Hollis Manor', '#2b1b26', '#241520']], VAN = [0, 270, 105, 100], STORY = ["The bank takes the van on Friday. The old Mercer house is full of scrap. Fill the quota before dawn.", "Something followed you home last night. It's learning the house.", "Wet footsteps upstairs. Something weeps when the lights go out.", "You hear scratching under the furniture. Hiding isn't always safe now.", "More of them every night. The debt keeps growing."];
const HC = ['#2b1b10', '#a5522a', '#e8c34a', '#d33', '#eee', '#6b3fa0'], SC = ['#3a7bd5', '#d54a4a', '#4ab56b', '#e0a030', '#a050c0', '#ddd'];
const MN = ['Hollow', 'Lurker', 'Weeper', 'Crawler'], MC = ['#bbb', '#822', '#9df', '#5a3'];
let ROOM = null, isHost = true, myId = 'me', S = null, code = '', prof = { n: 'Kid', h: HC[1], s: SC[0] };
let L = { x: 50, y: 310, d: 0, f: 1, hd: 0, st: 100, ex: 0, sp: 0 }, keys = {}, joy = { x: 0, y: 0 }, lastR = -1, lastPh = '', hb = 0, key0 = '', scared = 0, showMap = 0, pD = '';

function hit(x, y, r, all) { if (x < r || y < r || x > W - r || y > H - r) return true; const ch = w => x + r > w[0] && x - r < w[0] + w[2] && y + r > w[1] && y - r < w[1] + w[3]; for (const w of WALLS) if (ch(w)) return true; for (let i = 0; i < DOORS.length; i++) if ((all || (S && S.D && !S.D[i])) && ch(DOORS[i])) return true; return false }
function mv(o, dx, dy, r) { if (!hit(o.x + dx, o.y, r)) o.x += dx; if (!hit(o.x, o.y + dy, r)) o.y += dy }
function los(a, b) { const d = Math.hypot(b.x - a.x, b.y - a.y); for (let t = 8; t < d; t += 8) if (hit(a.x + (b.x - a.x) * t / d, a.y + (b.y - a.y) * t / d, 0)) return false; return true }
const inV = p => p.x >= VAN[0] && p.x <= VAN[0] + VAN[2] && p.y >= VAN[1] && p.y <= VAN[1] + VAN[3];
const roomOf = (x, y) => x < 110 ? -1 : (y < 240 ? 0 : 3) + (x < 330 ? 0 : x < 560 ? 1 : 2);

/* audio */
let AC; function au() { if (!AC) try { AC = new (window.AudioContext || webkitAudioContext)(); tone(48, 3600, 'sawtooth', .02) } catch (e) { } }
function tone(f, d, ty, v, f2) { if (!AC) return; const o = AC.createOscillator(), g = AC.createGain(), t = AC.currentTime; o.type = ty || 'sine'; o.frequency.setValueAtTime(f, t); if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + d); g.gain.setValueAtTime(v || .1, t); g.gain.exponentialRampToValueAtTime(.001, t + d); o.connect(g); g.connect(AC.destination); o.start(); o.stop(t + d) }
function noise(d, v) { if (!AC) return; const b = AC.createBuffer(1, AC.sampleRate * d, AC.sampleRate), a = b.getChannelData(0); for (let i = 0; i < a.length; i++) a[i] = (Math.random() * 2 - 1) * (1 - i / a.length); const s = AC.createBufferSource(), g = AC.createGain(); g.gain.value = v; s.buffer = b; s.connect(g); g.connect(AC.destination); s.start() }
function scare(t) { noise(1, .7); tone(900, .9, 'sawtooth', .25, 60); const c = $('sc'), x = c.getContext('2d'); c.style.display = 'block'; x.fillStyle = '#fff'; x.fillRect(0, 0, 64, 36); setTimeout(() => { x.fillStyle = '#000'; x.fillRect(0, 0, 64, 36); x.fillStyle = MC[t]; x.fillRect(14, 4, 36, 30); x.fillStyle = '#000'; x.fillRect(19, 12, 9, 8); x.fillRect(36, 12, 9, 8); x.fillRect(20, 25, 24, 7); x.fillStyle = '#f00'; x.fillRect(22, 14, 3, 4); x.fillRect(39, 14, 3, 4); x.fillStyle = '#fff'; for (let i = 0; i < 8; i++) x.fillRect(20 + i * 3, 25, 2, 3 + (i % 2) * 3) }, 70); c.className = 'sh'; setTimeout(() => c.style.display = 'none', 1500) }

/* host sim */
function newState() { S = { ph: 'lobby', r: 0, q: 0, b: 0, m: 0, t: 0, P: {}, M: [], C: [], up: { l: 0, s: 0, v: 0, b: 0 }, D: DOORS.map((d, i) => i ? 0 : 1), msg: '', mt: 0 } }
function startRound(r) {
  S.ph = 'play'; S.r = r; S.q = 100 + r * 60 + r * r * 8; S.b = 0; S.t = 210; S.C = []; S.M = []; S.D = DOORS.map((d, i) => i ? 0 : 1); let sum = 0, i = 0;
  while (i < 14 + r * 2 || sum < S.q * 1.6) { let x, y; do { x = rnd(130, 770); y = rnd(30, 450) } while (hit(x, y, 9, 1)); const v = Math.random() < .1 ? ri(90, 150) : ri(8, 70); sum += v; S.C.push({ x: x | 0, y: y | 0, v }); i++ }
  for (let i = 0; i < Math.min(9, r); i++) { let x, y; do { x = rnd(400, 770); y = rnd(30, 450) } while (hit(x, y, 8, 1)); S.M.push({ x, y, t: i % 4, tg: '', al: 0, w: null, tp: rnd(8, 14) }) }
  let k = 0; for (const id in S.P) { const p = S.P[id]; p.x = 40 + (k % 3) * 18; p.y = 305 + Math.floor(k / 3) * 14; p.dn = 0; p.hd = 0; p.bp = []; p.cr = 0; k++ }
  S.msg = 'NIGHT ' + r + ' — ' + LOC[(r - 1) % 4][0] + '. ' + STORY[Math.min(r - 1, 4)] + ' Quota: $' + S.q; S.mt = 8
}
function toShop() { S.ph = 'shop'; S.m += S.b - S.q; S.b = 0; S.C = []; S.M = [] }
function buy(k) { const lv = S.up[k], c = 40 * (lv + 1); if (lv < 4 && S.m >= c) { S.m -= c; S.up[k]++ } }
const cap = () => 3 + 2 * S.up.b, setbp = (p, a) => { p.bp = a; p.cr = a.reduce((s, v) => s + v, 0) };
function pickup(id) {
  const p = S.P[id]; if (!p || p.dn || S.ph != 'play') return; p.bp = p.bp || [];
  let b = -1, bd = 22; S.C.forEach((c, i) => { const d = Math.hypot(c.x - p.x, c.y - p.y); if (d < bd) { bd = d; b = i } });
  if (b >= 0 && p.bp.length < cap()) { setbp(p, p.bp.concat(S.C[b].v)); S.C.splice(b, 1); tone(900, .1, 'square', .06); return }
  let k = -1; bd = 30; DOORS.forEach((d, i) => { const q = Math.hypot(d.x + d.w / 2 - p.x, d.y + d.h / 2 - p.y); if (q < bd) { bd = q; k = i } });
  if (k >= 0) S.D[k] ^= 1; else if (b >= 0) { S.msg = 'Backpack full! Empty it in the van.'; S.mt = 2 }
}
function drop(id) { const p = S.P[id]; if (!p || p.dn || !p.bp || !p.bp.length) return; const a = p.bp.slice(), v = a.pop(); S.C.push({ x: p.x | 0, y: p.y | 0, v }); setbp(p, a) }
function syncPeers() {
  let ids = [myId];
  if (ROOM) {
    const ps = ROOM.peers();
    ids = ps.map(p => p.peer); if (!ids.includes(myId)) ids.push(myId);
    for (const p of ps) { const e = ent(p.peer); if (e && p.peer != myId) { const r = p.presence || {}; e.n = String(r.n || 'Kid').slice(0, 10); e.h = r.h; e.s = r.s } }
  }
  const m = ent(myId); if (m) { m.n = prof.n; m.h = prof.h; m.s = prof.s }
  for (const id in S.P) if (!ids.includes(id)) delete S.P[id]
}
function ent(id) { if (!S.P[id]) { if (Object.keys(S.P).length >= 10) return null; S.P[id] = { x: 50, y: 310, d: 0, f: 0, hd: 0, dn: S.ph == 'play' ? 1 : 0, cr: 0, bp: [], n: 'Kid', h: HC[0], s: SC[0], sp: 0 } } return S.P[id] }
function mon(m, dt) {
  const ps = Object.entries(S.P).filter(([, p]) => !p.dn && !inV(p)), sp0 = [38, 44, 40, 32][m.t] * Math.min(1.8, 1 + .06 * S.r); let best = null, bd = 1e9, fast = 1;
  for (const [id, p] of ps) { const d = Math.hypot(p.x - m.x, p.y - m.y); if (p.hd && !(m.t == 3 && d < 34)) continue; const rg = 110 + (p.f ? 80 : 0) + (p.sp ? 40 : 0); if (d < rg && d < bd && (los(m, p) || d < 30)) { bd = d; best = id } }
  if (best) { if (m.al <= 0 && m.tg != best) ROOM && ROOM.emit('sight', { id: best }); m.tg = best; m.al = m.t == 3 ? 8 : 4 } else m.al -= dt;
  const tp = S.P[m.tg];
  if (m.t == 2) { m.tp -= dt; if (m.tp <= 0 && ps.length) { m.tp = rnd(10, 16); const p = ps[ri(0, ps.length)][1]; for (let k = 0; k < 12; k++) { const a = rnd(0, 6.28), x = p.x + Math.cos(a) * rnd(110, 150), y = p.y + Math.sin(a) * rnd(110, 150); if (x > 130 && !hit(x, y, 8)) { m.x = x; m.y = y; m.al = 4; m.tg = ps.find(([, q]) => q == p)[0]; break } } } }
  let tx, ty, s;
  if (m.al > 0 && tp && !tp.dn && !inV(tp)) { tx = tp.x; ty = tp.y; s = sp0 * 1.25 * (m.t == 1 && tp.f ? 1.45 : 1) }
  else { if (!m.w || Math.hypot(m.w.x - m.x, m.w.y - m.y) < 8 || (m.wt -= dt) < 0) { if (m.t == 3 && Math.random() < .7) { const h = HIDES[ri(0, HIDES.length)]; m.w = { x: h.x + h.w / 2, y: h.y + h.h + 8 } } else { let x, y; do { x = rnd(125, 610); y = rnd(25, 375) } while (hit(x, y, 8)); m.w = { x, y } } m.wt = rnd(6, 12) } tx = m.w.x; ty = m.w.y; s = sp0 * .7 }
  const a = Math.atan2(ty - m.y, tx - m.x), ox = m.x, oy = m.y; mv(m, Math.cos(a) * s * dt, Math.sin(a) * s * dt, 6);
  if (m.x < 126) m.x = 126; let nd = 0; DOORS.forEach((d, i) => { if (!S.D[i] && m.x > d.x - 12 && m.x < d.x + d.w + 12 && m.y > d.y - 12 && m.y < d.y + d.h + 12) { nd = 1; m.dw = (m.dw || 0) + dt; if (m.dw > 1.5) { S.D[i] = 1; m.dw = 0 } } }); if (!nd) m.dw = 0;
  if (Math.hypot(m.x - ox, m.y - oy) < s * dt * .3) { m.w = null; mv(m, rnd(-1, 1) * s * dt * 2, rnd(-1, 1) * s * dt * 2, 6) }
  for (const [id, p] of ps) { const d = Math.hypot(p.x - m.x, p.y - m.y); if (d < 11 && (!p.hd || (m.t == 3 && d < 14))) { (p.bp || []).forEach((v, i) => S.C.push({ x: (p.x + i * 4) | 0, y: p.y | 0, v })); setbp(p, []); p.dn = 1; p.hd = 0; if (id == myId) scare(m.t); else ROOM && ROOM.emit('scare', { id, t: m.t }); m.al = 0 } }
}
function host(dt) {
  syncPeers(); if (S.mt > 0) S.mt -= dt; if (S.ph != 'play') return; S.t -= dt;
  const ps = Object.values(S.P); for (const p of ps) if (!p.dn && p.cr && inV(p)) { S.b += p.cr; setbp(p, []); tone(300, .2, 'triangle', .1, 600) }
  S.M.forEach(m => mon(m, dt)); const al = ps.filter(p => !p.dn);
  if (!al.length) S.ph = 'over'; else if (S.b >= S.q && al.every(inV)) toShop(); else if (S.t <= 0) { S.b >= S.q ? toShop() : S.ph = 'over' }
}

/* local player */
function local(dt) {
  const P = S.P[myId]; if (!P) return;
  if (lastR != S.r || lastPh != S.ph) { if (S.ph == 'play') { L.x = P.x; L.y = P.y; L.hd = 0; L.f = 1; L.ex = 0; fade('Arriving at ' + LOC[(S.r - 1) % 4][0] + '...') } else if (S.ph == 'shop') fade('Driving to the Night Market...'); lastR = S.r; lastPh = S.ph }
  const dj = S.D.join(); if (pD && dj != pD) tone(110, .4, 'sawtooth', .08, 70); pD = dj;
  if (S.ph != 'play' || P.dn) { if (P.dn) L.hd = 0; return }
  const mx = (keys.d || keys.ArrowRight ? 1 : 0) - (keys.a || keys.ArrowLeft ? 1 : 0) + joy.x, my = (keys.s || keys.ArrowDown ? 1 : 0) - (keys.w || keys.ArrowUp ? 1 : 0) + joy.y, mg = Math.hypot(mx, my), mvg = mg > .15 && !L.hd;
  const smax = 100 + 25 * S.up.s; L.sp = 0;
  if (mvg) {
    const n = Math.min(1, mg), sr = (keys.Shift || keys.run) && L.st > 0 && !L.ex; let s = 62 * (1 + .07 * S.up.v) * (1 - Math.min(.3, P.cr / 300)); if (sr) { s *= 1.65; L.st -= 30 * dt; L.sp = 1; if (L.st <= 0) { L.st = 0; L.ex = 1 } } else L.st = Math.min(smax, L.st + 16 * dt);
    mv(L, mx / mg * n * s * dt, my / mg * n * s * dt, 4); L.d = Math.atan2(my, mx)
  } else L.st = Math.min(smax, L.st + (L.hd ? 24 : 18) * dt);
  if (L.ex && L.st > 25) L.ex = 0;
  let near = 1e9; for (const m of S.M) near = Math.min(near, Math.hypot(m.x - L.x, m.y - L.y));
  hb -= dt; if (near < 170 && hb <= 0) { tone(55, .18, 'sine', .3); setTimeout(() => tone(48, .18, 'sine', .25), 170); hb = .35 + near / 230 }
  if (isHost) { Object.assign(P, { x: L.x, y: L.y, d: L.d, f: L.f, hd: L.hd, sp: L.sp }) }
}
function act() {
  au(); if (!S || S.ph != 'play') return; const P = S.P[myId]; if (!P || P.dn) return;
  if (L.hd) { L.hd = 0; return }
  for (const h of HIDES) if (Math.hypot(L.x - (h.x + h.w / 2), L.y - (h.y + h.h / 2)) < 26) { L.hd = 1; L.x = h.x + h.w / 2; L.y = h.y + h.h / 2; return }
  if (isHost) pickup(myId); else ROOM && ROOM.emit('act', { k: 'e' })
}
function dropIt() { if (!S || S.ph != 'play') return; if (isHost) drop(myId); else ROOM && ROOM.emit('act', { k: 'q' }) }
let fdT; function fade(t) { const f = $('fd'); f.textContent = t; f.style.opacity = 1; clearTimeout(fdT); fdT = setTimeout(() => f.style.opacity = 0, 1800) }
function light() { au(); L.f ^= 1; tone(1200, .04, 'square', .05) }

addEventListener('keydown', e => { const k = e.key.length > 1 ? e.key : e.key.toLowerCase(); keys[k] = 1; if (k == 'e') act(); if (k == 'f') light(); if (k == 'q') dropIt(); if (k == 'm') showMap ^= 1; if (k == ' ') e.preventDefault() });
addEventListener('keyup', e => { keys[e.key.length > 1 ? e.key : e.key.toLowerCase()] = 0 });
cv.addEventListener('click', light);

if ('ontouchstart' in window) {
  $('tc').style.display = 'block'; let o = null;
  addEventListener('touchstart', e => { au(); for (const t of e.changedTouches) if (t.clientX < innerWidth / 2 && !o) o = { id: t.identifier, x: t.clientX, y: t.clientY } }, { passive: true });
  addEventListener('touchmove', e => { for (const t of e.changedTouches) if (o && t.identifier == o.id) { joy.x = Math.max(-1, Math.min(1, (t.clientX - o.x) / 40)); joy.y = Math.max(-1, Math.min(1, (t.clientY - o.y) / 40)) } }, { passive: true });
  addEventListener('touchend', e => { for (const t of e.changedTouches) if (o && t.identifier == o.id) { o = null; joy.x = joy.y = 0 } }, { passive: true });
  $('bE').ontouchstart = e => { e.stopPropagation(); act() }; $('bF').ontouchstart = e => { e.stopPropagation(); light() }; $('bR').ontouchstart = e => { e.stopPropagation(); keys.run = 1 }; $('bR').ontouchend = () => keys.run = 0; $('bM').ontouchstart = e => { e.stopPropagation(); showMap ^= 1 }
}

/* drawing */
function kid(c, x, y, p, a) { x |= 0; y |= 0; c.globalAlpha = a || 1; c.fillStyle = '#0008'; c.fillRect(x - 3, y + 4, 7, 2); c.fillStyle = p.s; c.fillRect(x - 3, y - 1, 7, 6); c.fillStyle = '#e9c7a0'; c.fillRect(x - 3, y - 7, 7, 6); c.fillStyle = p.h; c.fillRect(x - 3, y - 8, 7, 3); c.fillRect(x - 3, y - 7, 1, 4); c.fillStyle = '#111'; c.fillRect(x - 1, y - 5, 1, 1); c.fillRect(x + 2, y - 5, 1, 1); c.fillStyle = '#5a4630'; c.fillRect(x - 5, y - 1, 3, 6); if (p.cr) { c.fillStyle = '#fc4'; c.fillRect(x - 5, y, 2, 2) } c.globalAlpha = 1 }
function mons(m) {
  const x = m.x | 0, y = m.y | 0, c = MC[m.t]; ctx.fillStyle = '#0008'; ctx.fillRect(x - 5, y + 6, 10, 2); ctx.fillStyle = c;
  if (m.t == 0) { ctx.fillRect(x - 3, y - 9, 7, 17); ctx.fillRect(x - 5, y - 2, 2, 9); ctx.fillRect(x + 4, y - 2, 2, 9) }
  else if (m.t == 1) { ctx.fillRect(x - 6, y - 5, 12, 12); ctx.fillRect(x - 4, y - 8, 8, 4) }
  else if (m.t == 2) { ctx.fillRect(x - 3, y - 10, 7, 18); ctx.fillRect(x - 7, y - 4, 3, 12); ctx.fillRect(x + 5, y - 4, 3, 12); ctx.fillStyle = '#124'; ctx.fillRect(x - 2, y - 7, 2, 4); ctx.fillRect(x + 1, y - 7, 2, 4) }
  else { ctx.fillRect(x - 8, y, 16, 6); ctx.fillRect(x - 10, y + 2, 3, 5); ctx.fillRect(x + 8, y + 2, 3, 5) }
}
function cone(x, y, a, len, w) { const g = dx.createRadialGradient(x, y, 3, x, y, len); g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(.75, 'rgba(0,0,0,.7)'); g.addColorStop(1, 'rgba(0,0,0,0)'); dx.fillStyle = g; dx.beginPath(); dx.moveTo(x, y); dx.arc(x, y, len, a - w, a + w); dx.closePath(); dx.fill() }
function glow(x, y, r, al) { const g = dx.createRadialGradient(x, y, 1, x, y, r); g.addColorStop(0, 'rgba(0,0,0,' + al + ')'); g.addColorStop(1, 'rgba(0,0,0,0)'); dx.fillStyle = g; dx.beginPath(); dx.arc(x, y, r, 0, 6.3); dx.fill() }
function draw() {
  const P = S.P, me = P[myId] || {}; let tx = L.x, ty = L.y; if (me.dn) { const o = Object.values(P).find(p => !p.dn); if (o) { tx = o.x; ty = o.y } }
  const cx = Math.max(0, Math.min(W - VW, tx - VW / 2)) | 0, cy = Math.max(0, Math.min(H - VH, ty - VH / 2)) | 0;
  ctx.setTransform(1, 0, 0, 1, -cx, -cy); ctx.fillStyle = '#0f1c0e'; ctx.fillRect(0, 0, W, H);
  const lc = LOC[(S.r > 0 ? S.r - 1 : 0) % 4]; for (let y = 18; y < 462; y += 16) for (let x = 118; x < 782; x += 16) { ctx.fillStyle = ((x + y) >> 4) & 1 ? lc[1] : lc[2]; ctx.fillRect(x, y, 16, 16) }
  ctx.fillStyle = '#cfd2d8'; ctx.fillRect(18, 292, 74, 52); ctx.fillStyle = '#79a7c9'; ctx.fillRect(78, 296, 12, 16); ctx.fillStyle = '#a33'; ctx.fillRect(18, 316, 74, 3); ctx.fillStyle = '#222'; ctx.fillRect(26, 342, 12, 6); ctx.fillRect(68, 342, 12, 6);
  HIDES.forEach(h => { ctx.fillStyle = h.t == 'closet' ? '#5a3a1e' : h.t == 'table' ? '#7a5a34' : '#6a2a3a'; ctx.fillRect(h.x, h.y, h.w, h.h); ctx.fillStyle = '#0005'; ctx.fillRect(h.x, h.y + h.h - 3, h.w, 3) });
  WALLS.forEach(w => { ctx.fillStyle = '#4b3b30'; ctx.fillRect(w[0], w[1], w[2], w[3]); ctx.fillStyle = '#6b5646'; ctx.fillRect(w[0], w[1], w[2], 2) });
  DOORS.forEach((d, i) => { if (S.D[i]) { ctx.fillStyle = '#8a6a42'; if (d.w < d.h) ctx.fillRect(d.x, d.y, 18, 3); else ctx.fillRect(d.x, d.y, 3, 18) } else { ctx.fillStyle = '#7a5430'; ctx.fillRect(d.x, d.y, d.w, d.h); ctx.fillStyle = '#e0b050'; ctx.fillRect((d.w < d.h ? d.x + 2 : d.x + d.w / 2) | 0, (d.w < d.h ? d.y + d.h / 2 : d.y + 2) | 0, 2, 2) } });
  S.C.forEach(c => { const s = 3 + (c.v / 30 | 0), q = c.x - (s >> 1), r = c.y - (s >> 1); ctx.fillStyle = c.v < 25 ? '#9aa' : c.v < 50 ? '#d9a030' : c.v < 80 ? '#4c8' : '#e5e'; ctx.fillRect(q, r, s, s); ctx.fillStyle = '#fff9'; ctx.fillRect(q, r, 1, 1) });
  S.M.forEach(mons);
  const ent = []; for (const id in P) { let p = P[id]; if (id == myId) p = Object.assign({}, p, { x: L.x, y: L.y, hd: L.hd, f: L.f, d: L.d }); ent.push(p) }
  ent.sort((a, b) => a.y - b.y).forEach(p => { if (p.dn) { ctx.fillStyle = '#733'; ctx.fillRect(p.x - 3 | 0, p.y | 0, 7, 2); return } kid(ctx, p.x, p.y, p, p.hd ? .35 : 1) });
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  dx.globalCompositeOperation = 'source-over'; dx.fillStyle = 'rgba(0,0,6,.95)'; dx.fillRect(0, 0, VW, VH); dx.globalCompositeOperation = 'destination-out';
  glow(55 - cx, 320 - cy, 48, .5);
  let nearM = 1e9; for (const m of S.M) nearM = Math.min(nearM, Math.hypot(m.x - L.x, m.y - L.y));
  for (const id in P) { let p = P[id]; if (p.dn) continue; if (id == myId) p = Object.assign({}, p, { x: L.x, y: L.y, hd: L.hd, f: L.f, d: L.d }); const x = p.x - cx, y = p.y - cy; glow(x, y, p.hd ? 10 : 24, .9); if (p.f && !p.hd) { const fl = (nearM < 90 && Math.random() < .05) ? .35 : 1; cone(x, y, p.d, (105 + 20 * S.up.l) * fl, .5) } }
  dx.globalCompositeOperation = 'source-over'; ctx.drawImage(dk, 0, 0);
  ctx.fillStyle = '#f22'; for (const m of S.M) { if (Math.hypot(m.x - L.x, m.y - L.y) < 140) { ctx.fillRect(m.x - cx - 3 | 0, m.y - cy - 4 | 0, 2, 2); ctx.fillRect(m.x - cx + 2 | 0, m.y - cy - 4 | 0, 2, 2) } } if (showMap) drawMap()
}
function drawMap() {
  const k = .35, ox = 20, oy = 10; ctx.fillStyle = '#000d'; ctx.fillRect(ox - 4, oy - 4, W * k + 8, H * k + 8); ctx.fillStyle = '#666'; WALLS.forEach(w => ctx.fillRect(ox + w[0] * k, oy + w[1] * k, Math.max(1, w[2] * k), Math.max(1, w[3] * k)));
  DOORS.forEach((d, i) => { ctx.fillStyle = S.D[i] ? '#4a4' : '#a63'; ctx.fillRect(ox + d.x * k, oy + d.y * k, Math.max(2, d.w * k), Math.max(2, d.h * k)) });
  const cnt = Array(6).fill(0), val = Array(6).fill(0); S.C.forEach(c => { const r = roomOf(c.x, c.y); if (r >= 0) { cnt[r]++; val[r] += c.v } }); ctx.font = '6px monospace'; ctx.textAlign = 'center';
  RN.forEach((n, i) => { const X = ox + [220, 445, 675][i % 3] * k, Y = oy + (i < 3 ? 130 : 355) * k; ctx.fillStyle = '#aaa'; ctx.fillText(n, X, Y - 4); ctx.fillStyle = '#fc4'; ctx.fillText(cnt[i] + ' scrap · $' + val[i], X, Y + 5) });
  ctx.fillStyle = '#8cf'; ctx.fillText('VAN', ox + 50 * k, oy + 320 * k); for (const id in S.P) { const p = S.P[id]; if (p.dn) continue; const q = id == myId ? L : p; ctx.fillStyle = id == myId ? '#fff' : p.s; ctx.fillRect(ox + q.x * k - 1, oy + q.y * k - 1, 3, 3) }
  ctx.fillStyle = '#777'; ctx.fillText('M: close map', ox + W * k / 2, oy + H * k + 1); ctx.textAlign = 'left'
}

/* ui */
function hud() {
  const P = S.P[myId] || {};
  $('h').textContent = S.ph == 'play' ? 'NIGHT ' + S.r + '  |  DAWN ' + Math.max(0, S.t | 0) + 's  |  VAN $' + S.b + '/$' + S.q + '  |  PACK ' + (P.bp ? P.bp.length : 0) + '/' + cap() + (P.cr ? ' ($' + P.cr + ')' : '') + '  |  ' + (RN[roomOf(L.x, L.y)] || 'Outside') : '';
  $('pl').innerHTML = Object.entries(S.P).map(([i, p]) => '<span style="color:' + (p.dn ? '#a44' : p.s) + '">' + (p.n || 'Kid') + (p.dn ? ' ✝' : '') + (i == myId ? ' (you)' : '') + '</span>').join('<br>');
  $('ms').textContent = S.mt > 0 ? S.msg : (S.ph == 'play' && S.b >= S.q ? 'Quota met! Everyone back to the van!' : (S.ph == 'play' && S.P[myId] && S.P[myId].dn ? 'You were caught. Spectating...' : ''));
  $('sf').style.width = (L.st / (100 + 25 * S.up.s) * 100) + '%'; $('sb').style.display = S.ph == 'play' ? 'block' : 'none';
  const k = S.ph + S.r + S.m + JSON.stringify(S.up) + (S.ph == 'lobby' ? Object.values(S.P).map(p => p.n).join() : ''); if (k != key0) { key0 = k; panel() }
}
function panel() {
  const pn = $('pn'), pc = $('pc'); pn.style.display = S.ph == 'play' ? 'none' : 'flex';
  if (S.ph == 'lobby') pc.innerHTML = '<h1>THE VAN</h1>' + (code ? '<p>Party code: <b style="font-size:22px;color:#e8d8b0">' + code + '</b><br><small>Friends open this same page and enter the code.</small></p>' : '<p>Solo run.</p>') + '<p>' + Object.values(S.P).map(p => '<span style="color:' + p.s + '">■ ' + p.n + '</span>').join('<br>') + '</p>' + (isHost ? '<button onclick="go()">Start Night 1</button>' : '<p>Waiting for the host...</p>');
  else if (S.ph == 'shop') { const it = [['l', 'Brighter flashlight'], ['s', 'Energy drinks (stamina)'], ['v', 'Running shoes (speed)'], ['b', 'Bigger backpack (+2 slots)']]; pc.innerHTML = '<h1>NIGHT MARKET</h1><p><i>A smiling stranger with too many teeth tends the stall. "Pay in scrap, little ones."</i></p><p>Team funds: <b>$' + S.m + '</b></p>' + it.map(([k, n]) => '<div>' + n + ' [lvl ' + S.up[k] + '/4] <button onclick="shop(\'' + k + '\')">' + (S.up[k] >= 4 ? 'MAX' : 'Buy $' + 40 * (S.up[k] + 1)) + '</button></div>').join('') + (isHost ? '<button onclick="go()">Drive back — Night ' + (S.r + 1) + '</button>' : '<p>Waiting for the host...</p>') }
  else if (S.ph == 'over') pc.innerHTML = '<h1>DAWN</h1><p>The van is gone. You survived ' + Math.max(0, S.r - 1) + ' night(s) and cleared up to Night ' + S.r + '.</p>' + (isHost ? '<button onclick="again()">Try again</button>' : '<p>Waiting for the host...</p>')
}
function go() { au(); startRound(S.ph == 'lobby' ? 1 : S.r + 1) }
function shop(k) { if (isHost) buy(k); else ROOM && ROOM.emit('buy', { k }) }
function again() { const P = S.P; newState(); S.P = P; S.ph = 'lobby' }

/* menu & networking */
function menu() {
  const sw = (k, a) => a.map(c => '<span class="sw' + (prof[k] == c ? ' on' : '') + '" style="background:' + c + '" onclick="pick(\'' + k + '\',\'' + c + '\')"></span>').join('');
  const n = $('nm') ? $('nm').value : prof.n; prof.n = n || 'Kid'; $('pn').style.display = 'flex';
  $('pc').innerHTML = '<h1>HOLLOW HAUL</h1><p><small>Haul scrap from the haunted Mercer house back to the van. Meet the quota before dawn. Hide (E), sprint (Shift), flashlight (F / click). Don\'t get caught.</small></p><canvas id="pv" width="24" height="24" style="width:72px;image-rendering:pixelated"></canvas><br><input id="nm" maxlength="10" value="' + prof.n + '" oninput="prof.n=this.value||\'Kid\';pv()"><div>Hair ' + sw('h', HC) + '</div><div>Shirt ' + sw('s', SC) + '</div><div><button onclick="solo()">Play solo</button><button onclick="create()">Create party</button></div><div><input id="cd" maxlength="4" placeholder="CODE" style="text-transform:uppercase"><button onclick="joinP()">Join</button></div><p id="er" style="color:#c55"></p><small>WASD move · E pick up / hide / open &amp; close doors · Q drop · M map · mobile: drag left half to move</small>'; pv()
}
function pv() { const c = $('pv').getContext('2d'); c.clearRect(0, 0, 24, 24); kid(c, 12, 14, prof) }
function pick(k, c) { prof[k] = c; menu() }
function pres(extra) { ROOM && ROOM.presence(Object.assign({ n: prof.n, h: prof.h, s: prof.s }, extra || {})) }

let cerr = '';
/* PeerJS Standalone Networking Layer */
function createRoomObject(peerInstance, hostConnMap) {
  const listeners = {};
  return {
    peers: () => {
      const list = [{ peer: myId, presence: { n: prof.n, h: prof.h, s: prof.s } }];
      if (isHost) {
        for (const [id, conn] of hostConnMap.entries()) {
          list.push({ peer: id, presence: conn.presence || {} });
        }
      } else {
        if (ROOM && ROOM.presenceData) {
          for (const id in ROOM.presenceData) {
            if (id !== myId) list.push({ peer: id, presence: ROOM.presenceData[id] });
          }
        }
      }
      return list;
    },
    emit: (event, data) => {
      const msg = { type: event, data, peer: myId };
      if (isHost) {
        for (const conn of hostConnMap.values()) {
          if (conn.open) conn.send(msg);
        }
      } else if (ROOM && ROOM.hostConn && ROOM.hostConn.open) {
        ROOM.hostConn.send(msg);
      }
    },
    on: (event, cb) => {
      if (!listeners[event]) listeners[event] = [];
      listeners[event].push(cb);
    },
    trigger: (event, msg) => {
      if (listeners[event]) listeners[event].forEach(cb => cb(msg));
    },
    presence: (data) => {
      if (isHost) {
        if (!ROOM.presenceData) ROOM.presenceData = {};
        ROOM.presenceData[myId] = data;
      } else if (ROOM && ROOM.hostConn && ROOM.hostConn.open) {
        ROOM.hostConn.send({ type: 'presence', data, peer: myId });
      }
    }
  };
}

async function connect(c) {
  cerr = '';
  const roomCode = 'hh-' + c.toLowerCase();
  return new Promise((resolve) => {
    if (isHost) {
      const peer = new Peer(roomCode);
      const connections = new Map();
      peer.on('open', (id) => {
        myId = id;
        const roomObj = createRoomObject(peer, connections);
        roomObj.presenceData = {};
        peer.on('connection', (conn) => {
          conn.on('open', () => {
            connections.set(conn.peer, conn);
            conn.send({ type: 'welcome', peerId: conn.peer });
          });
          conn.on('data', (msg) => {
            if (msg.type === 'presence') {
              conn.presence = msg.data;
              roomObj.presenceData[conn.peer] = msg.data;
              roomObj.emit('presence_sync', roomObj.presenceData);
            } else {
              roomObj.trigger(msg.type, msg);
            }
          });
          conn.on('close', () => {
            connections.delete(conn.peer);
            delete roomObj.presenceData[conn.peer];
          });
        });
        resolve(roomObj);
      });
      peer.on('error', (err) => {
        cerr = 'Code in use or network error. Try again.';
        resolve(null);
      });
    } else {
      const peer = new Peer();
      peer.on('open', (id) => {
        myId = id;
        const conn = peer.connect(roomCode);
        const roomObj = createRoomObject(peer, null);
        roomObj.hostConn = conn;
        conn.on('open', () => {
          resolve(roomObj);
        });
        conn.on('data', (msg) => {
          if (msg.type === 'presence_sync') {
            roomObj.presenceData = msg.data;
          } else {
            roomObj.trigger(msg.type, msg);
          }
        });
        conn.on('error', () => {
          cerr = 'Could not join party.';
          resolve(null);
        });
        setTimeout(() => {
          if (!conn.open) {
            cerr = 'Party not found or failed to connect.';
            resolve(null);
          }
        }, 3000);
      });
      peer.on('error', (err) => {
        cerr = 'Network connection failed.';
        resolve(null);
      });
    }
  });
}

function wire() {
  ROOM.on('pos', m => { if (!isHost || m.peer === myId || !S) return; const p = ent(m.peer), d = m.data || {}; if (p && !p.dn && S.ph == 'play') { p.x = +d.x || 0; p.y = +d.y || 0; p.d = +d.d || 0; p.f = d.f ? 1 : 0; p.hd = d.hd ? 1 : 0; p.sp = d.sp ? 1 : 0 } });
  ROOM.on('act', m => { if (isHost && m.peer !== myId) (m.data && m.data.k == 'q' ? drop : pickup)(m.peer) });
  ROOM.on('buy', m => { if (isHost && m.peer !== myId && S.ph == 'shop' && m.data && S.up[m.data.k] != null) buy(m.data.k) });
  ROOM.on('st', m => { if (!isHost && m.peer !== myId) S = m.data });
  ROOM.on('scare', m => { if (m.data && m.data.id == myId) scare(m.data.t) });
  ROOM.on('sight', m => { if (m.data && m.data.id == myId) { tone(1500, .4, 'sawtooth', .12, 300) } });
}

function begin() { menu_off(); setInterval(() => { if (!S) return; if (isHost) { ROOM && ROOM.emit('st', pack()) } else if (S.ph == 'play' && ROOM) { ROOM.emit('pos', { x: L.x | 0, y: L.y | 0, d: +L.d.toFixed(2), f: L.f, hd: L.hd, sp: L.sp }) } }, 100) }
function pack() { const r = Math.round, P = {}; for (const i in S.P) { const p = S.P[i]; P[i] = { x: r(p.x), y: r(p.y), d: +p.d.toFixed(1), f: p.f, hd: p.hd, dn: p.dn, cr: p.cr, bp: p.bp, n: p.n, h: p.h, s: p.s } } return { ph: S.ph, r: S.r, q: S.q, b: S.b, m: S.m, t: r(S.t), P, M: S.M.map(m => ({ x: r(m.x), y: r(m.y), t: m.t })), C: S.C, up: S.up, D: S.D, msg: S.mt > 0 ? S.msg : '', mt: r(S.mt * 10) / 10 } }
function menu_off() { $('pn').style.display = 'none' }
function solo() { au(); code = ''; ROOM = null; isHost = true; newState(); myId = 'me'; ent(myId); begin(); key0 = '' }

async function create() {
  au(); code = Array.from({ length: 4 }, () => String.fromCharCode(65 + ri(0, 26))).join(''); isHost = true; ROOM = await connect(code); if (!ROOM) { $('er').textContent = cerr; code = ''; return }
  newState(); pres({ host: 1 }); wire(); ent(myId); begin(); key0 = ''
}

async function joinP() {
  au(); const c = ($('cd').value || '').toUpperCase().replace(/[^A-Z]/g, ''); if (c.length != 4) { $('er').textContent = 'Enter the 4-letter code.'; return }
  $('er').textContent = 'Looking for the party...'; isHost = false; ROOM = await connect(c); if (!ROOM) { $('er').textContent = cerr; return }
  code = c; S = null; pres(); wire(); let t = 0; const w = setInterval(() => { t++; if (S) { clearInterval(w); begin(); key0 = '' } else if (t > 40) { clearInterval(w); ROOM = null; $('er').textContent = 'No party found with that code.' } }, 100)
}

let last = performance.now();
function loop(t) { const dt = Math.min(.05, (t - last) / 1000); last = t; if (S) { if (isHost) host(dt); local(dt); draw(); hud() } requestAnimationFrame(loop) }

menu();
requestAnimationFrame(loop);