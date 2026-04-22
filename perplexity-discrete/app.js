/* =====================================================================
   Queue Lab — discrete event simulation dashboard
   - Event-driven simulator (priority queue by time)
   - Arrival & service distributions: deterministic / exponential / bursty / high-variance
   - Real-time canvas animation of customers flowing through the queue
   - Live charts via Chart.js
   - Theoretical M/M/c comparison (Erlang-C)
   ===================================================================== */

'use strict';

/* ---------- Theme toggle ---------- */
(function () {
  const toggle = document.querySelector('[data-theme-toggle]');
  const root = document.documentElement;
  const prefersDark = matchMedia('(prefers-color-scheme: dark)').matches;
  let theme = prefersDark ? 'dark' : 'light';
  root.setAttribute('data-theme', theme);
  render();
  toggle.addEventListener('click', () => {
    theme = theme === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', theme);
    render();
    // Let charts pick up new colors
    window.dispatchEvent(new CustomEvent('themechange', { detail: theme }));
  });
  function render() {
    toggle.setAttribute(
      'aria-label',
      'Switch to ' + (theme === 'dark' ? 'light' : 'dark') + ' mode'
    );
    toggle.innerHTML =
      theme === 'dark'
        ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>'
        : '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
  }
})();

/* ---------- CSS variable reader (re-reads on theme change) ---------- */
function cssVar(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

/* =====================================================================
   MIN-HEAP priority queue — keyed by time
   ===================================================================== */
class MinHeap {
  constructor() {
    this.a = [];
  }
  get size() {
    return this.a.length;
  }
  push(item) {
    this.a.push(item);
    this._up(this.a.length - 1);
  }
  pop() {
    const top = this.a[0];
    const last = this.a.pop();
    if (this.a.length) {
      this.a[0] = last;
      this._down(0);
    }
    return top;
  }
  _up(i) {
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (this.a[p].t <= this.a[i].t) break;
      [this.a[p], this.a[i]] = [this.a[i], this.a[p]];
      i = p;
    }
  }
  _down(i) {
    const n = this.a.length;
    for (;;) {
      const l = i * 2 + 1,
        r = l + 1;
      let s = i;
      if (l < n && this.a[l].t < this.a[s].t) s = l;
      if (r < n && this.a[r].t < this.a[s].t) s = r;
      if (s === i) break;
      [this.a[s], this.a[i]] = [this.a[i], this.a[s]];
      i = s;
    }
  }
}

/* =====================================================================
   Random distributions
   ===================================================================== */
function expRand(mean) {
  return -Math.log(1 - Math.random()) * mean;
}
// log-normal with given mean & CV
function lognormalRand(mean, cv) {
  const variance = (cv * mean) ** 2;
  const sigma2 = Math.log(1 + variance / (mean * mean));
  const sigma = Math.sqrt(sigma2);
  const mu = Math.log(mean) - sigma2 / 2;
  // Box-Muller
  const u = 1 - Math.random();
  const v = 1 - Math.random();
  const z = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  return Math.exp(mu + sigma * z);
}

/* =====================================================================
   SIMULATION
   ===================================================================== */
class Simulation {
  constructor() {
    this.reset();
  }
  reset() {
    this.now = 0;
    this.events = new MinHeap();
    this.waitingQueue = []; // array of customer objects waiting
    this.servers = []; // { id, customer|null, busySince, totalBusy }
    this.completed = [];
    this.waitSamples = []; // for histogram (ring-buffered)
    this.waitSamplesMax = 400;
    this.stats = {
      arrivals: 0,
      served: 0,
      balked: 0,
      // time-weighted accumulators
      qTimeIntegral: 0, // ∑ Lq(t)*dt
      nTimeIntegral: 0, // ∑ L(t)*dt  (in system)
      lastUpdate: 0,
    };
    this.timeSeries = []; // { t, L, Lq } — trimmed
    this.timeSeriesWindow = 30; // minutes visible on chart
    this.nextCustomerId = 0;

    // params (set via applyConfig)
    this.arrivalRate = 1.2;
    this.meanService = 2.5;
    this.numServers = 3;
    this.arrivalType = 'poisson';
    this.serviceType = 'exponential';

    this._initServers(this.numServers);
  }
  _initServers(n) {
    this.servers = [];
    for (let i = 0; i < n; i++) {
      this.servers.push({ id: i, customer: null, busySince: 0, totalBusy: 0, totalServed: 0 });
    }
  }
  applyConfig(cfg) {
    this.arrivalRate = cfg.arrivalRate;
    this.meanService = cfg.meanService;
    this.arrivalType = cfg.arrivalType;
    this.serviceType = cfg.serviceType;

    if (cfg.numServers !== this.numServers) {
      const oldN = this.numServers;
      this.numServers = cfg.numServers;
      if (cfg.numServers > oldN) {
        for (let i = oldN; i < cfg.numServers; i++) {
          this.servers.push({
            id: i,
            customer: null,
            busySince: this.now,
            totalBusy: 0,
            totalServed: 0,
          });
        }
      } else {
        // When reducing servers mid-run, keep busy ones draining but don't drop them
        // Simplest: truncate from the tail; if any dropped server is busy, return customer to queue
        for (let i = oldN - 1; i >= cfg.numServers; i--) {
          const s = this.servers[i];
          if (s.customer) {
            // Put back in queue front (lost their place) - use arrival order
            s.customer.serviceStart = null;
            this.waitingQueue.unshift(s.customer);
          }
          this.servers.pop();
        }
      }
    }
  }
  sampleInterarrival() {
    const mean = 1 / this.arrivalRate;
    switch (this.arrivalType) {
      case 'deterministic':
        return mean;
      case 'bursty':
        // mixture: 70% small gaps (tight bursts), 30% long gaps
        if (Math.random() < 0.7) return expRand(mean * 0.35);
        return expRand(mean * 2.52); // preserves overall mean ≈ `mean`
      case 'poisson':
      default:
        return expRand(mean);
    }
  }
  sampleService() {
    const m = this.meanService;
    switch (this.serviceType) {
      case 'deterministic':
        return m;
      case 'heavy':
        return Math.max(0.05, lognormalRand(m, 1.5));
      case 'exponential':
      default:
        return expRand(m);
    }
  }
  scheduleFirstArrival() {
    if (this.events.size === 0 && this.stats.arrivals === 0) {
      this.events.push({ t: this.now + this.sampleInterarrival(), type: 'arrival' });
    }
  }
  _accumulateTimeStats(dt) {
    const busyCount = this.servers.filter((s) => s.customer).length;
    const Lq = this.waitingQueue.length;
    const L = Lq + busyCount;
    this.stats.qTimeIntegral += Lq * dt;
    this.stats.nTimeIntegral += L * dt;
    for (const s of this.servers) {
      if (s.customer) s.totalBusy += dt;
    }
  }
  _pushTimeSeriesSample() {
    const busy = this.servers.filter((s) => s.customer).length;
    const Lq = this.waitingQueue.length;
    this.timeSeries.push({ t: this.now, L: Lq + busy, Lq });
    // Trim older than window
    const cutoff = this.now - this.timeSeriesWindow;
    while (this.timeSeries.length && this.timeSeries[0].t < cutoff) this.timeSeries.shift();
  }
  // Advance simulation up to `untilTime` (simulated minutes).
  advance(untilTime) {
    this.scheduleFirstArrival();
    while (this.events.size && this.events.a[0].t <= untilTime) {
      const ev = this.events.pop();
      const dt = ev.t - this.stats.lastUpdate;
      if (dt > 0) this._accumulateTimeStats(dt);
      this.stats.lastUpdate = ev.t;
      this.now = ev.t;

      if (ev.type === 'arrival') this._handleArrival();
      else if (ev.type === 'departure') this._handleDeparture(ev);
    }
    // catch up time stats to "now = untilTime"
    const dt = untilTime - this.stats.lastUpdate;
    if (dt > 0) {
      this._accumulateTimeStats(dt);
      this.stats.lastUpdate = untilTime;
      this.now = untilTime;
    }
    this._pushTimeSeriesSample();
  }
  _handleArrival() {
    const id = ++this.nextCustomerId;
    const cust = { id, arrivalTime: this.now, serviceStart: null, serviceEnd: null };
    this.stats.arrivals++;
    // Find free server
    const free = this.servers.find((s) => !s.customer);
    if (free) {
      this._startService(free, cust);
    } else {
      this.waitingQueue.push(cust);
    }
    // Schedule next arrival
    this.events.push({ t: this.now + this.sampleInterarrival(), type: 'arrival' });
  }
  _startService(server, customer) {
    customer.serviceStart = this.now;
    const dur = this.sampleService();
    customer.serviceEnd = this.now + dur;
    customer.serverId = server.id;
    server.customer = customer;
    server.busySince = this.now;
    this.events.push({ t: customer.serviceEnd, type: 'departure', serverId: server.id, customer });
  }
  _handleDeparture(ev) {
    const server = this.servers[ev.serverId];
    if (!server) return;
    const customer = ev.customer;
    this.stats.served++;
    server.totalServed++;
    server.customer = null;
    // record wait sample
    const wait = customer.serviceStart - customer.arrivalTime;
    this.waitSamples.push(wait);
    if (this.waitSamples.length > this.waitSamplesMax) this.waitSamples.shift();
    this.completed.push({ id: customer.id, doneAt: this.now });
    if (this.completed.length > 60) this.completed.shift();
    // Pull next from queue
    if (this.waitingQueue.length) {
      const next = this.waitingQueue.shift();
      this._startService(server, next);
    }
  }
  // aggregate metrics
  metrics() {
    const T = Math.max(this.now, 1e-9);
    const Lq = this.stats.qTimeIntegral / T;
    const L = this.stats.nTimeIntegral / T;
    const avgWait =
      this.waitSamples.length > 0
        ? this.waitSamples.reduce((a, b) => a + b, 0) / this.waitSamples.length
        : 0;
    const utilPerServer = this.servers.map((s) => s.totalBusy / T);
    const avgUtil = utilPerServer.reduce((a, b) => a + b, 0) / utilPerServer.length;
    const throughput = this.stats.served / T;
    return { L, Lq, avgWait, utilPerServer, avgUtil, throughput };
  }
}

/* =====================================================================
   M/M/c THEORY (Erlang-C)
   ===================================================================== */
function mmcTheory(lambda, mu, c) {
  // returns { rho, Pwait, Lq, Wq, utilization, throughput, stable }
  const a = lambda / mu; // offered load
  const rho = a / c; // utilization
  if (rho >= 0.999) {
    return { rho, stable: false, Lq: Infinity, Wq: Infinity, Pwait: 1, utilization: rho };
  }
  // P0
  let sum = 0;
  for (let k = 0; k < c; k++) {
    sum += Math.pow(a, k) / factorial(k);
  }
  const lastTerm = (Math.pow(a, c) / factorial(c)) * (1 / (1 - rho));
  const P0 = 1 / (sum + lastTerm);
  const Pwait = lastTerm * P0; // Erlang C
  const Lq = (Pwait * rho) / (1 - rho);
  const Wq = Lq / lambda;
  return { rho, stable: true, Lq, Wq, Pwait, utilization: rho, throughput: lambda };
}
function factorial(n) {
  let x = 1;
  for (let i = 2; i <= n; i++) x *= i;
  return x;
}

/* =====================================================================
   FLOOR ANIMATION
   Customers are rendered as dots that move between three zones:
      DOOR -> QUEUE SLOTS -> SERVER STATIONS -> EXIT
   Positions are interpolated per animation frame from their target slot.
   ===================================================================== */
class FloorRenderer {
  constructor(canvas, sim) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.sim = sim;
    this.entities = new Map(); // customerId -> { x, y, tx, ty, state, color, size }
    this.completedAnimations = []; // { x, y, age }
    this.dpr = Math.max(1, Math.min(window.devicePixelRatio || 1, 2));
    this._resize = this._resize.bind(this);
    window.addEventListener('resize', this._resize);
    this._resize();
  }
  _resize() {
    const rect = this.canvas.getBoundingClientRect();
    this.canvas.width = rect.width * this.dpr;
    this.canvas.height = rect.height * this.dpr;
    this.w = rect.width;
    this.h = rect.height;
  }
  // Compute target slot positions (in CSS pixels)
  _layout() {
    const W = this.w,
      H = this.h;
    const doorX = W * 0.08;
    const doorY = H * 0.5;
    const queueStartX = W * 0.2;
    const queueEndX = W * 0.55;
    const queueY = H * 0.5;
    const serverX = W * 0.78;
    const n = this.sim.numServers;
    const serverYTop = H * 0.15;
    const serverYBot = H * 0.85;
    const serverYs = [];
    if (n === 1) serverYs.push(H * 0.5);
    else for (let i = 0; i < n; i++) serverYs.push(serverYTop + (i / (n - 1)) * (serverYBot - serverYTop));
    const exitX = W * 0.95;
    return { doorX, doorY, queueStartX, queueEndX, queueY, serverX, serverYs, exitX };
  }
  _slotForQueueIndex(i, layout) {
    // Queue goes right-to-left from queueEndX → queueStartX, then stacks
    const maxVisible = 14;
    const dx = (layout.queueEndX - layout.queueStartX) / (maxVisible - 1);
    const col = Math.min(i, maxVisible - 1);
    const row = Math.floor(i / maxVisible);
    return {
      x: layout.queueEndX - col * dx,
      y: layout.queueY + row * 16 - (row ? 8 : 0),
    };
  }
  _ensure(customer, initialX, initialY) {
    if (!this.entities.has(customer.id)) {
      this.entities.set(customer.id, {
        x: initialX,
        y: initialY,
        tx: initialX,
        ty: initialY,
        state: 'wait',
        size: 7,
        birth: performance.now(),
      });
    }
    return this.entities.get(customer.id);
  }
  _update() {
    const layout = this._layout();
    const activeIds = new Set();
    // Waiting queue
    this.sim.waitingQueue.forEach((c, i) => {
      const slot = this._slotForQueueIndex(i, layout);
      const e = this._ensure(c, layout.doorX, layout.doorY);
      e.tx = slot.x;
      e.ty = slot.y;
      e.state = 'wait';
      activeIds.add(c.id);
    });
    // Being served
    this.sim.servers.forEach((s, idx) => {
      if (s.customer) {
        const e = this._ensure(s.customer, layout.queueEndX, layout.queueY);
        e.tx = layout.serverX - 20;
        e.ty = layout.serverYs[idx];
        e.state = 'serve';
        activeIds.add(s.customer.id);
      }
    });
    // Remove stale (departed) entities → flash completion pulse
    for (const [id, e] of this.entities) {
      if (!activeIds.has(id)) {
        // add completion ping
        this.completedAnimations.push({ x: e.x, y: e.y, age: 0 });
        this.entities.delete(id);
      }
    }
    // Smooth movement (critically-damped interpolation)
    const lerp = 0.18;
    for (const e of this.entities.values()) {
      e.x += (e.tx - e.x) * lerp;
      e.y += (e.ty - e.y) * lerp;
    }
    // Age completion pulses
    this.completedAnimations = this.completedAnimations.filter((p) => {
      p.age += 1 / 60;
      return p.age < 0.8;
    });
  }
  draw() {
    this._update();
    const { ctx, w, h, dpr } = this;
    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, w, h);

    const layout = this._layout();

    // Read theme colors each frame (cheap)
    const cText = cssVar('--color-text-muted') || '#667085';
    const cFaint = cssVar('--color-text-faint') || '#98a2b3';
    const cBorder = cssVar('--color-border') || '#e1e6ee';
    const cPrimary = cssVar('--color-primary') || '#0e7490';
    const cWait = cssVar('--c-wait') || '#d97706';
    const cServe = cssVar('--c-serve') || '#0e7490';
    const cDone = cssVar('--c-done') || '#15803d';
    const cSurface = cssVar('--color-surface') || '#fff';

    // Background zones — subtle divider between queue area and service area
    ctx.strokeStyle = cBorder;
    ctx.setLineDash([4, 6]);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(layout.serverX - 38, 10);
    ctx.lineTo(layout.serverX - 38, h - 10);
    ctx.stroke();
    ctx.setLineDash([]);

    // Queue guideline
    ctx.strokeStyle = color_mix(cBorder, 0.6);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(layout.queueStartX, layout.queueY + 14);
    ctx.lineTo(layout.queueEndX + 4, layout.queueY + 14);
    ctx.stroke();

    // Labels
    ctx.fillStyle = cFaint;
    ctx.font = "500 10px 'Inter', sans-serif";
    ctx.textAlign = 'left';
    ctx.fillText('ENTRY', layout.doorX - 14, 20);
    ctx.textAlign = 'center';
    ctx.fillText('QUEUE', (layout.queueStartX + layout.queueEndX) / 2, 20);
    ctx.textAlign = 'right';
    ctx.fillText('SERVERS', layout.serverX + 30, 20);

    // Draw door
    ctx.fillStyle = cSurface;
    ctx.strokeStyle = cBorder;
    ctx.lineWidth = 1.5;
    roundRect(ctx, layout.doorX - 14, layout.doorY - 22, 20, 44, 4);
    ctx.fill();
    ctx.stroke();
    // arrow in door
    ctx.strokeStyle = cPrimary;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(layout.doorX - 4, layout.doorY);
    ctx.lineTo(layout.doorX + 4, layout.doorY);
    ctx.moveTo(layout.doorX + 1, layout.doorY - 3);
    ctx.lineTo(layout.doorX + 4, layout.doorY);
    ctx.lineTo(layout.doorX + 1, layout.doorY + 3);
    ctx.stroke();

    // Draw server stations
    this.sim.servers.forEach((s, idx) => {
      const cx = layout.serverX;
      const cy = layout.serverYs[idx];
      const busy = !!s.customer;
      // Station body
      ctx.fillStyle = busy ? color_mix(cServe, 0.15, cSurface) : cSurface;
      ctx.strokeStyle = busy ? cServe : cBorder;
      ctx.lineWidth = busy ? 1.6 : 1;
      roundRect(ctx, cx - 18, cy - 14, 50, 28, 6);
      ctx.fill();
      ctx.stroke();
      // Status dot
      ctx.fillStyle = busy ? cServe : color_mix(cBorder, 1);
      ctx.beginPath();
      ctx.arc(cx + 22, cy, 3, 0, Math.PI * 2);
      ctx.fill();
      // Utilization ring
      const util = s.totalBusy / Math.max(this.sim.now, 1e-9);
      ctx.strokeStyle = color_mix(cServe, 0.25, cBorder);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx + 22, cy, 8, -Math.PI / 2, -Math.PI / 2 + util * Math.PI * 2);
      ctx.stroke();
      // Server label
      ctx.fillStyle = cText;
      ctx.font = "600 10px 'JetBrains Mono', monospace";
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('#' + (idx + 1), cx + 7, cy);
    });

    // Draw completion pulses
    for (const p of this.completedAnimations) {
      const a = 1 - p.age / 0.8;
      const r = 6 + p.age * 22;
      ctx.strokeStyle = withAlpha(cDone, a * 0.9);
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Draw customers
    for (const e of this.entities.values()) {
      const col = e.state === 'serve' ? cServe : cWait;
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.arc(e.x, e.y, e.size, 0, Math.PI * 2);
      ctx.fill();
      // Subtle glow for service
      if (e.state === 'serve') {
        ctx.strokeStyle = withAlpha(col, 0.35);
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(e.x, e.y, e.size + 2, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    // Queue count badge
    const qLen = this.sim.waitingQueue.length;
    if (qLen > 0) {
      ctx.font = "600 10px 'JetBrains Mono', monospace";
      ctx.fillStyle = cText;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'alphabetic';
      ctx.fillText(qLen + ' waiting', (layout.queueStartX + layout.queueEndX) / 2, h - 14);
    }

    ctx.restore();
  }
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
function parseColor(c) {
  // Returns [r,g,b] from #rgb / #rrggbb / rgb()
  c = c.trim();
  if (c.startsWith('#')) {
    if (c.length === 4) {
      return [parseInt(c[1] + c[1], 16), parseInt(c[2] + c[2], 16), parseInt(c[3] + c[3], 16)];
    }
    return [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)];
  }
  const m = c.match(/rgba?\(([^)]+)\)/);
  if (m) return m[1].split(',').slice(0, 3).map((x) => parseInt(x));
  return [120, 120, 120];
}
function withAlpha(c, a) {
  const [r, g, b] = parseColor(c);
  return `rgba(${r},${g},${b},${a})`;
}
function color_mix(c, a, bg = '#ffffff') {
  const [r1, g1, b1] = parseColor(c);
  const [r2, g2, b2] = parseColor(bg);
  return `rgb(${Math.round(r1 * a + r2 * (1 - a))},${Math.round(g1 * a + g2 * (1 - a))},${Math.round(
    b1 * a + b2 * (1 - a)
  )})`;
}

/* =====================================================================
   UI WIRING
   ===================================================================== */
const UI = (() => {
  const el = (id) => document.getElementById(id);
  const controls = {
    arrivalRate: el('arrivalRate'),
    serviceTime: el('serviceTime'),
    numServers: el('numServers'),
    simSpeed: el('simSpeed'),
    arrivalRateOut: el('arrivalRateOut'),
    serviceTimeOut: el('serviceTimeOut'),
    numServersOut: el('numServersOut'),
    simSpeedOut: el('simSpeedOut'),
    arrivalPatternLabel: el('arrivalPatternLabel'),
    serviceVariabilityLabel: el('serviceVariabilityLabel'),
    btnStart: el('btnStart'),
    btnReset: el('btnReset'),
    btnStartLabel: el('btnStartLabel'),
    rhoVal: el('rhoVal'),
    rhoFill: el('rhoFill'),
    stabilityMsg: el('stabilityMsg'),
    stability: el('stability'),
    simClock: el('simClock'),
    kpiQueue: el('kpiQueue'),
    kpiService: el('kpiService'),
    kpiServed: el('kpiServed'),
    kpiArrivals: el('kpiArrivals'),
    kpiBalked: el('kpiBalked'),
    metricWait: el('metricWait'),
    metricQueue: el('metricQueue'),
    metricUtil: el('metricUtil'),
    metricThroughput: el('metricThroughput'),
    metricWaitBar: el('metricWaitBar'),
    metricQueueBar: el('metricQueueBar'),
    metricUtilBar: el('metricUtilBar'),
    metricThroughputBar: el('metricThroughputBar'),
    theoryWait: el('theoryWait'),
    theoryQueue: el('theoryQueue'),
    theoryUtil: el('theoryUtil'),
    theoryThroughput: el('theoryThroughput'),
    scenarioLabel: el('scenario-label'),
  };
  return { el, controls };
})();

/* ---------- Scenarios ---------- */
const SCENARIOS = {
  bank: {
    label: 'Bank tellers',
    arrivalRate: 0.9,
    serviceTime: 2.5,
    numServers: 3,
    arrival: 'poisson',
    service: 'exponential',
  },
  email: {
    label: 'Email center',
    arrivalRate: 3.5,
    serviceTime: 1.2,
    numServers: 5,
    arrival: 'bursty',
    service: 'heavy',
  },
  cafe: {
    label: 'Coffee shop',
    arrivalRate: 1.1,
    serviceTime: 1.5,
    numServers: 2,
    arrival: 'poisson',
    service: 'exponential',
  },
};

/* =====================================================================
   CHARTS — built once, updated in place for live feel
   ===================================================================== */
function chartColors() {
  return {
    text: cssVar('--color-text-muted') || '#667085',
    faint: cssVar('--color-text-faint') || '#98a2b3',
    grid: withAlpha(cssVar('--color-border') || '#e1e6ee', 0.6),
    primary: cssVar('--color-primary') || '#0e7490',
    wait: cssVar('--c-wait') || '#d97706',
    serve: cssVar('--c-serve') || '#0e7490',
    done: cssVar('--c-done') || '#15803d',
    purple: cssVar('--c-purple') || '#7c3aed',
    surface: cssVar('--color-surface') || '#fff',
  };
}

Chart.defaults.font.family = "'Inter', ui-sans-serif, system-ui, sans-serif";
Chart.defaults.font.size = 11;
Chart.defaults.animation.duration = 0; // live updates — no entry anim
Chart.defaults.plugins.legend.labels.boxWidth = 10;
Chart.defaults.plugins.legend.labels.boxHeight = 10;

function buildQueueChart(canvas) {
  const c = chartColors();
  return new Chart(canvas, {
    type: 'line',
    data: {
      datasets: [
        {
          label: 'Queue length (Lq)',
          data: [],
          borderColor: c.wait,
          backgroundColor: withAlpha(c.wait, 0.14),
          fill: true,
          tension: 0.2,
          borderWidth: 1.75,
          pointRadius: 0,
        },
        {
          label: 'In system (L)',
          data: [],
          borderColor: c.serve,
          backgroundColor: 'transparent',
          borderDash: [4, 3],
          borderWidth: 1.75,
          pointRadius: 0,
          tension: 0.2,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      parsing: { xAxisKey: 't', yAxisKey: 'v' },
      scales: {
        x: {
          type: 'linear',
          title: { display: true, text: 'Simulated time (min)', color: c.faint },
          grid: { color: c.grid, drawTicks: false },
          ticks: { color: c.text, maxTicksLimit: 6 },
        },
        y: {
          beginAtZero: true,
          title: { display: true, text: 'Customers', color: c.faint },
          grid: { color: c.grid, drawTicks: false },
          ticks: { color: c.text, precision: 0 },
        },
      },
      plugins: {
        legend: { position: 'top', align: 'end', labels: { color: c.text, usePointStyle: true } },
        tooltip: {
          backgroundColor: c.surface,
          borderColor: c.grid,
          borderWidth: 1,
          titleColor: c.text,
          bodyColor: c.text,
          callbacks: {
            title: (items) => 't = ' + items[0].parsed.x.toFixed(1) + ' min',
          },
        },
      },
    },
  });
}
function buildWaitChart(canvas) {
  const c = chartColors();
  return new Chart(canvas, {
    type: 'bar',
    data: {
      labels: [],
      datasets: [
        {
          label: 'Completed waits',
          data: [],
          backgroundColor: c.wait,
          borderRadius: 3,
          barPercentage: 0.95,
          categoryPercentage: 0.95,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          title: { display: true, text: 'Wait time (min)', color: c.faint },
          grid: { display: false },
          ticks: { color: c.text, maxRotation: 0, autoSkip: true, maxTicksLimit: 8 },
        },
        y: {
          beginAtZero: true,
          title: { display: true, text: 'Customers', color: c.faint },
          grid: { color: c.grid, drawTicks: false },
          ticks: { color: c.text, precision: 0 },
        },
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: c.surface,
          borderColor: c.grid,
          borderWidth: 1,
          titleColor: c.text,
          bodyColor: c.text,
        },
      },
    },
  });
}
function buildUtilChart(canvas) {
  const c = chartColors();
  return new Chart(canvas, {
    type: 'bar',
    data: {
      labels: [],
      datasets: [
        {
          label: 'Utilization',
          data: [],
          backgroundColor: c.serve,
          borderRadius: 4,
          barPercentage: 0.75,
        },
      ],
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          min: 0,
          max: 1,
          title: { display: true, text: 'Busy fraction', color: c.faint },
          grid: { color: c.grid, drawTicks: false },
          ticks: {
            color: c.text,
            callback: (v) => Math.round(v * 100) + '%',
            stepSize: 0.25,
          },
        },
        y: { grid: { display: false }, ticks: { color: c.text } },
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: c.surface,
          borderColor: c.grid,
          borderWidth: 1,
          titleColor: c.text,
          bodyColor: c.text,
          callbacks: {
            label: (ctx) => 'Busy ' + (ctx.parsed.x * 100).toFixed(1) + '%',
          },
        },
      },
    },
  });
}

/* =====================================================================
   APP CONTROLLER
   ===================================================================== */
const App = (() => {
  const sim = new Simulation();
  const floor = new FloorRenderer(document.getElementById('floor'), sim);
  const chartQueue = buildQueueChart(document.getElementById('chartQueue'));
  const chartWait = buildWaitChart(document.getElementById('chartWait'));
  const chartUtil = buildUtilChart(document.getElementById('chartUtil'));

  let running = false;
  let lastWall = 0;
  let simSpeed = 10;
  let arrivalType = 'poisson';
  let serviceType = 'exponential';

  function currentConfig() {
    return {
      arrivalRate: parseFloat(UI.controls.arrivalRate.value),
      meanService: parseFloat(UI.controls.serviceTime.value),
      numServers: parseInt(UI.controls.numServers.value, 10),
      arrivalType,
      serviceType,
    };
  }

  function applyNow() {
    sim.applyConfig(currentConfig());
    updateParamOutputs();
    updateStability();
    updateTheoryReadouts();
  }

  /* ---------- Parameter readouts ---------- */
  function updateParamOutputs() {
    UI.controls.arrivalRateOut.textContent =
      parseFloat(UI.controls.arrivalRate.value).toFixed(2) + ' / min';
    UI.controls.serviceTimeOut.textContent =
      parseFloat(UI.controls.serviceTime.value).toFixed(2) + ' min';
    UI.controls.numServersOut.textContent = UI.controls.numServers.value;
    UI.controls.simSpeedOut.textContent = UI.controls.simSpeed.value + '×';
    UI.controls.arrivalPatternLabel.textContent = labelFor('arrival', arrivalType);
    UI.controls.serviceVariabilityLabel.textContent = labelFor('service', serviceType);
    // Slider track gradient progress
    setSliderProgress(UI.controls.arrivalRate);
    setSliderProgress(UI.controls.serviceTime);
    setSliderProgress(UI.controls.numServers);
    setSliderProgress(UI.controls.simSpeed);
  }
  function setSliderProgress(input) {
    const min = parseFloat(input.min);
    const max = parseFloat(input.max);
    const val = parseFloat(input.value);
    const pct = ((val - min) / (max - min)) * 100;
    input.style.setProperty('--r', pct + '%');
  }
  function labelFor(kind, v) {
    if (kind === 'arrival')
      return { deterministic: 'Steady', poisson: 'Poisson', bursty: 'Bursty' }[v];
    return { deterministic: 'Fixed', exponential: 'Exponential', heavy: 'High variance' }[v];
  }

  /* ---------- Stability ---------- */
  function updateStability() {
    const c = currentConfig();
    const mu = 1 / c.meanService;
    const rho = c.arrivalRate / (c.numServers * mu);
    UI.controls.rhoVal.textContent = rho.toFixed(2);
    const pct = Math.min(rho, 1.25) * 100;
    UI.controls.rhoFill.style.width = Math.min(pct, 100) + '%';
    let msg, klass;
    if (rho < 0.7) {
      msg = 'Stable — servers have slack, waits short.';
      klass = '';
    } else if (rho < 0.9) {
      msg = 'Busy — waits grow nonlinearly with any bump.';
      klass = '';
    } else if (rho < 1) {
      msg = 'Near saturation — tiny variance causes big queues.';
      klass = '';
    } else {
      msg = 'Unstable — queue grows without bound. Add servers or reduce arrivals.';
      klass = 'is-unstable';
    }
    UI.controls.stabilityMsg.textContent = msg;
    UI.controls.stability.classList.toggle('is-unstable', klass === 'is-unstable');
  }

  function updateTheoryReadouts() {
    const c = currentConfig();
    const mu = 1 / c.meanService;
    const theory = mmcTheory(c.arrivalRate, mu, c.numServers);
    if (!theory.stable) {
      UI.controls.theoryWait.textContent = '∞';
      UI.controls.theoryQueue.textContent = '∞';
    } else {
      UI.controls.theoryWait.textContent = theory.Wq.toFixed(2);
      UI.controls.theoryQueue.textContent = theory.Lq.toFixed(2);
    }
    UI.controls.theoryUtil.textContent = (Math.min(theory.rho, 1) * 100).toFixed(0) + '%';
    UI.controls.theoryThroughput.textContent = Math.min(c.arrivalRate, c.numServers * mu).toFixed(
      2
    );
  }

  /* ---------- Live UI refresh ---------- */
  function refreshLive() {
    const m = sim.metrics();
    // Clock
    const mins = sim.now;
    const hh = Math.floor(mins / 60);
    const mm = Math.floor(mins) % 60;
    const ss = Math.floor((mins - Math.floor(mins)) * 60);
    UI.controls.simClock.textContent =
      String(hh).padStart(2, '0') +
      ':' +
      String(mm).padStart(2, '0') +
      ':' +
      String(ss).padStart(2, '0');

    const busy = sim.servers.filter((s) => s.customer).length;
    UI.controls.kpiQueue.textContent = sim.waitingQueue.length;
    UI.controls.kpiService.textContent = busy;
    UI.controls.kpiServed.textContent = sim.stats.served;
    UI.controls.kpiArrivals.textContent = sim.stats.arrivals;
    UI.controls.kpiBalked.textContent = sim.stats.balked;

    UI.controls.metricWait.textContent = m.avgWait.toFixed(2);
    UI.controls.metricQueue.textContent = m.Lq.toFixed(2);
    UI.controls.metricUtil.textContent = (m.avgUtil * 100).toFixed(0) + '%';
    UI.controls.metricThroughput.textContent = m.throughput.toFixed(2);

    // Bars: compare measured vs theoretical benchmark
    const cfg = currentConfig();
    const mu = 1 / cfg.meanService;
    const theory = mmcTheory(cfg.arrivalRate, mu, cfg.numServers);
    const maxWait = theory.stable ? Math.max(theory.Wq * 2.5, 0.5) : 20;
    const maxLq = theory.stable ? Math.max(theory.Lq * 2.5, 1) : 20;
    UI.controls.metricWaitBar.style.width = Math.min((m.avgWait / maxWait) * 100, 100) + '%';
    UI.controls.metricQueueBar.style.width = Math.min((m.Lq / maxLq) * 100, 100) + '%';
    UI.controls.metricUtilBar.style.width = Math.min(m.avgUtil * 100, 100) + '%';
    UI.controls.metricThroughputBar.style.width =
      Math.min((m.throughput / Math.max(cfg.arrivalRate, 0.1)) * 100, 100) + '%';
  }

  function refreshCharts() {
    // Queue chart
    const tsLq = sim.timeSeries.map((p) => ({ x: p.t, y: p.Lq, t: p.t, v: p.Lq }));
    const tsL = sim.timeSeries.map((p) => ({ x: p.t, y: p.L, t: p.t, v: p.L }));
    chartQueue.data.datasets[0].data = tsLq;
    chartQueue.data.datasets[1].data = tsL;
    if (sim.timeSeries.length) {
      const last = sim.timeSeries[sim.timeSeries.length - 1].t;
      const first = sim.timeSeries[0].t;
      chartQueue.options.scales.x.min = Math.max(0, first);
      chartQueue.options.scales.x.max = Math.max(last, first + 1);
    }
    chartQueue.update('none');

    // Wait histogram
    const samples = sim.waitSamples;
    if (samples.length > 0) {
      const maxW = Math.max(...samples);
      const bins = 18;
      const hi = Math.max(maxW, 0.5);
      const step = hi / bins;
      const counts = new Array(bins).fill(0);
      for (const w of samples) {
        let idx = Math.min(Math.floor(w / step), bins - 1);
        if (idx < 0) idx = 0;
        counts[idx]++;
      }
      const labels = counts.map((_, i) => (i * step).toFixed(1));
      chartWait.data.labels = labels;
      chartWait.data.datasets[0].data = counts;
    } else {
      chartWait.data.labels = [];
      chartWait.data.datasets[0].data = [];
    }
    chartWait.update('none');

    // Utilization
    const T = Math.max(sim.now, 1e-9);
    const utils = sim.servers.map((s) => s.totalBusy / T);
    chartUtil.data.labels = sim.servers.map((s, i) => 'Server ' + (i + 1));
    chartUtil.data.datasets[0].data = utils;
    // Color bars by load
    chartUtil.data.datasets[0].backgroundColor = utils.map((u) => {
      if (u > 0.9) return cssVar('--color-error') || '#b91c1c';
      if (u > 0.75) return cssVar('--color-warn') || '#d97706';
      return cssVar('--c-serve') || '#0e7490';
    });
    chartUtil.update('none');
  }

  /* ---------- Main loop ---------- */
  function tick(nowWall) {
    if (!running) return;
    const dtWall = Math.min((nowWall - lastWall) / 1000, 0.1); // seconds
    lastWall = nowWall;
    const dtSim = dtWall * simSpeed;
    if (dtSim > 0) sim.advance(sim.now + dtSim);
    floor.draw();
    refreshLive();
    requestAnimationFrame(tick);
  }
  function startLoop() {
    running = true;
    lastWall = performance.now();
    UI.controls.btnStartLabel.textContent = 'Pause';
    UI.controls.btnStart.querySelector('svg').innerHTML =
      '<path d="M5 3h2v10H5zM9 3h2v10H9z"/>';
    requestAnimationFrame(tick);
  }
  function stopLoop() {
    running = false;
    UI.controls.btnStartLabel.textContent = 'Resume';
    UI.controls.btnStart.querySelector('svg').innerHTML =
      '<path d="M4 2.5v11a.5.5 0 0 0 .77.42l9-5.5a.5.5 0 0 0 0-.84l-9-5.5A.5.5 0 0 0 4 2.5Z"/>';
  }

  /* ---------- Event bindings ---------- */
  function bindEvents() {
    ['input', 'change'].forEach((ev) => {
      UI.controls.arrivalRate.addEventListener(ev, applyNow);
      UI.controls.serviceTime.addEventListener(ev, applyNow);
      UI.controls.numServers.addEventListener(ev, applyNow);
    });
    UI.controls.simSpeed.addEventListener('input', () => {
      simSpeed = parseFloat(UI.controls.simSpeed.value);
      updateParamOutputs();
    });

    document.querySelectorAll('[data-arrival]').forEach((btn) => {
      btn.addEventListener('click', () => {
        document
          .querySelectorAll('[data-arrival]')
          .forEach((b) => b.classList.toggle('is-active', b === btn));
        document.querySelectorAll('[data-arrival]').forEach((b) => {
          b.setAttribute('aria-checked', String(b === btn));
        });
        arrivalType = btn.dataset.arrival;
        applyNow();
      });
    });
    document.querySelectorAll('[data-service]').forEach((btn) => {
      btn.addEventListener('click', () => {
        document
          .querySelectorAll('[data-service]')
          .forEach((b) => b.classList.toggle('is-active', b === btn));
        document.querySelectorAll('[data-service]').forEach((b) => {
          b.setAttribute('aria-checked', String(b === btn));
        });
        serviceType = btn.dataset.service;
        applyNow();
      });
    });

    UI.controls.btnStart.addEventListener('click', () => {
      if (running) stopLoop();
      else startLoop();
    });
    UI.controls.btnReset.addEventListener('click', () => {
      stopLoop();
      sim.reset();
      sim.applyConfig(currentConfig());
      refreshLive();
      refreshCharts();
      floor.draw();
      UI.controls.btnStartLabel.textContent = 'Start';
    });

    document.querySelectorAll('.scenario-chip').forEach((chip) => {
      chip.addEventListener('click', () => {
        document
          .querySelectorAll('.scenario-chip')
          .forEach((c) => c.classList.toggle('is-active', c === chip));
        loadScenario(chip.dataset.scenario);
      });
    });

    // Periodic chart refresh (lighter than per-frame)
    setInterval(() => {
      if (running) refreshCharts();
    }, 400);

    // Theme change → rebuild chart colors
    window.addEventListener('themechange', () => {
      // Rebuild chart palettes
      applyChartTheme(chartQueue);
      applyChartTheme(chartWait);
      applyChartTheme(chartUtil);
    });
  }

  function applyChartTheme(chart) {
    const c = chartColors();
    chart.options.scales.x.ticks.color = c.text;
    chart.options.scales.y.ticks.color = c.text;
    chart.options.scales.x.grid.color = c.grid;
    chart.options.scales.y.grid.color = c.grid;
    if (chart.options.scales.x.title) chart.options.scales.x.title.color = c.faint;
    if (chart.options.scales.y.title) chart.options.scales.y.title.color = c.faint;
    if (chart.options.plugins.legend.labels) chart.options.plugins.legend.labels.color = c.text;
    // Reset dataset colors where monochrome
    if (chart === chartQueue) {
      chart.data.datasets[0].borderColor = c.wait;
      chart.data.datasets[0].backgroundColor = withAlpha(c.wait, 0.14);
      chart.data.datasets[1].borderColor = c.serve;
    } else if (chart === chartWait) {
      chart.data.datasets[0].backgroundColor = c.wait;
    }
    chart.update('none');
  }

  function loadScenario(key) {
    const s = SCENARIOS[key];
    if (!s) return;
    UI.controls.scenarioLabel.textContent = s.label;
    UI.controls.arrivalRate.value = s.arrivalRate;
    UI.controls.serviceTime.value = s.serviceTime;
    UI.controls.numServers.value = s.numServers;
    arrivalType = s.arrival;
    serviceType = s.service;
    document.querySelectorAll('[data-arrival]').forEach((b) => {
      const on = b.dataset.arrival === arrivalType;
      b.classList.toggle('is-active', on);
      b.setAttribute('aria-checked', String(on));
    });
    document.querySelectorAll('[data-service]').forEach((b) => {
      const on = b.dataset.service === serviceType;
      b.classList.toggle('is-active', on);
      b.setAttribute('aria-checked', String(on));
    });
    // Reset & start fresh so scenario feels like a new experiment
    stopLoop();
    sim.reset();
    sim.applyConfig(currentConfig());
    updateParamOutputs();
    updateStability();
    updateTheoryReadouts();
    refreshLive();
    refreshCharts();
    floor.draw();
    startLoop();
  }

  function init() {
    bindEvents();
    applyNow();
    refreshLive();
    refreshCharts();
    floor.draw();
    // Auto-start so the page feels alive
    startLoop();
  }

  return { init };
})();

/* ---------- GO ---------- */
window.addEventListener('DOMContentLoaded', App.init);
