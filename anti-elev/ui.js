// UI Manager class to handle DOM updates, canvas rendering, and user inputs
class UIManager {
    constructor(sim) {
        this.sim = sim;
        this.simSpeed = 1.0;
        this.lastFrameRealTime = null;
        
        // Canvas chart context
        this.canvas = document.getElementById('live-chart');
        this.ctx = this.canvas.getContext('2d');
        this.chartHistory = []; // Stores { time, floor, state }
        
        // Exiting passengers tracking for fadeout animations
        this.exitingPassengers = []; // Stores { id, floor, spawnRealTime, xOffset }

        // Cache DOM elements
        this.dom = {
            simTime: document.getElementById('sim-time'),
            simStatus: document.getElementById('sim-status'),
            elevator: document.getElementById('elevator'),
            shaft: document.getElementById('shaft'),
            doorL: document.getElementById('door-l'),
            doorR: document.getElementById('door-r'),
            cabinFloorNum: document.getElementById('cabin-floor-num'),
            cabinDirArrow: document.getElementById('cabin-dir-arrow'),
            cabinPassengers: document.getElementById('cabin-passengers'),
            felList: document.getElementById('fel-list'),
            logOutput: document.getElementById('log-output'),
            
            // Buttons
            btnPlay: document.getElementById('btn-play'),
            btnPause: document.getElementById('btn-pause'),
            btnStep: document.getElementById('btn-step'),
            btnReset: document.getElementById('btn-reset'),
            btnSpawn: document.getElementById('btn-spawn'),
            
            // Inputs
            speedSlider: document.getElementById('sim-speed'),
            speedVal: document.getElementById('speed-val'),
            algoSelect: document.getElementById('algo-select'),
            spawnFrom: document.getElementById('spawn-from'),
            spawnTo: document.getElementById('spawn-to'),
            autoSpawnCheck: document.getElementById('auto-spawn'),
            spawnRateSlider: document.getElementById('spawn-rate'),
            rateVal: document.getElementById('rate-val'),
            
            // Config Inputs
            cfgCapacity: document.getElementById('cfg-capacity'),
            cfgSpeed: document.getElementById('cfg-speed'),
            cfgDoorTime: document.getElementById('cfg-door-time'),
            cfgBoardTime: document.getElementById('cfg-board-time'),
            
            // Stats
            statServed: document.getElementById('stat-served'),
            statAvgWait: document.getElementById('stat-avg-wait'),
            statAvgTransit: document.getElementById('stat-avg-transit'),
            statAvgTrip: document.getElementById('stat-avg-trip'),
            statUtilization: document.getElementById('stat-utilization')
        };

        this.initEventListeners();
        this.setupTabs();
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());

        // Override CSS transitions so JS controls animations precisely
        this.dom.elevator.style.transition = 'none';
        this.dom.doorL.style.transition = 'none';
        this.dom.doorR.style.transition = 'none';

        // Connect simulation callbacks
        this.sim.onLogMessage = (time, msg, type) => this.addLog(time, msg, type);
        this.sim.onStateChanged = () => this.updateDashboard();
        
        // Initial draw
        this.updateDashboard();
    }

    initEventListeners() {
        // Controls
        this.dom.btnPlay.addEventListener('click', () => this.play());
        this.dom.btnPause.addEventListener('click', () => this.pause());
        this.dom.btnStep.addEventListener('click', () => {
            this.sim.step();
            this.updateDashboard();
        });
        this.dom.btnReset.addEventListener('click', () => {
            this.sim.reset();
            this.chartHistory = [];
            this.exitingPassengers = [];
            this.dom.logOutput.innerHTML = '';
            this.updateDashboard();
        });

        // Speed Multiplier
        this.dom.speedSlider.addEventListener('input', (e) => {
            this.simSpeed = parseFloat(e.target.value);
            this.dom.speedVal.textContent = this.simSpeed.toFixed(1) + 'x';
        });

        // Algorithm selector
        this.dom.algoSelect.addEventListener('change', (e) => {
            this.sim.activeAlgorithm = e.target.value;
            this.sim.log(`Switched scheduling algorithm to ${e.target.value}`, 'system');
            this.updateDashboard();
        });

        // Spawn Passenger
        this.dom.btnSpawn.addEventListener('click', () => {
            const from = parseInt(this.dom.spawnFrom.value);
            const to = parseInt(this.dom.spawnTo.value);
            if (from === to) {
                alert('Source and destination floors must be different.');
                return;
            }
            this.sim.spawnPassenger(from, to);
        });

        // Auto Spawn Configs
        this.dom.autoSpawnCheck.addEventListener('change', (e) => {
            this.sim.autoSpawnEnabled = e.target.checked;
            this.sim.log(`Auto-spawn ${e.target.checked ? 'enabled' : 'disabled'}`, 'system');
            
            // If turning on, clear old arrival events and schedule a new one
            if (e.target.checked) {
                this.sim.eventQueue.events = this.sim.eventQueue.events.filter(ev => ev.type !== 'PASSENGER_ARRIVE');
                this.sim.scheduleNextArrival();
            }
        });

        this.dom.spawnRateSlider.addEventListener('input', (e) => {
            const val = parseInt(e.target.value);
            this.sim.config.meanArrivalRate = val;
            this.dom.rateVal.textContent = val + 's';
        });

        // Config Inputs (Real-time update)
        const updateConfigs = () => {
            this.sim.config.capacity = Math.max(1, parseInt(this.dom.cfgCapacity.value) || 4);
            this.sim.elevator.capacity = this.sim.config.capacity;
            this.sim.config.travelSpeed = Math.max(0.1, parseFloat(this.dom.cfgSpeed.value) || 1.5);
            this.sim.config.doorTime = Math.max(0.1, parseFloat(this.dom.cfgDoorTime.value) || 1.0);
            this.sim.config.boardTime = Math.max(0.05, parseFloat(this.dom.cfgBoardTime.value) || 0.5);
        };

        this.dom.cfgCapacity.addEventListener('change', updateConfigs);
        this.dom.cfgSpeed.addEventListener('change', updateConfigs);
        this.dom.cfgDoorTime.addEventListener('change', updateConfigs);
        this.dom.cfgBoardTime.addEventListener('change', updateConfigs);

        // Bind interactive floor call buttons (clicking them manually calls the elevator)
        document.querySelectorAll('.btn-call').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const floor = parseInt(btn.dataset.floor);
                const dir = btn.dataset.dir;
                
                // Spawn a mock passenger going in that direction
                let dest = floor;
                if (dir === 'up') {
                    dest = floor === 3 ? 4 : floor + 1; // pick some logical dest
                } else {
                    dest = floor === 2 ? 1 : floor - 1;
                }
                this.sim.spawnPassenger(floor, dest);
            });
        });
    }

    setupTabs() {
        const headers = document.querySelectorAll('.tab-header');
        headers.forEach(header => {
            header.addEventListener('click', () => {
                headers.forEach(h => h.classList.remove('active'));
                header.classList.add('active');
                
                const tabId = 'tab-' + header.dataset.tab;
                document.querySelectorAll('.tab-content').forEach(content => {
                    content.classList.remove('active');
                });
                document.getElementById(tabId).classList.add('active');
            });
        });
    }

    play() {
        if (this.sim.running) return;
        this.sim.running = true;
        this.lastFrameRealTime = performance.now();
        this.dom.btnPlay.disabled = true;
        this.dom.btnPause.disabled = false;
        this.dom.simStatus.textContent = 'RUNNING';
        this.dom.simStatus.className = 'badge-value status-running';
        this.sim.log('Simulation started.', 'system');
        
        requestAnimationFrame((t) => this.loop(t));
    }

    pause() {
        if (!this.sim.running) return;
        this.sim.running = false;
        this.dom.btnPlay.disabled = false;
        this.dom.btnPause.disabled = true;
        this.dom.simStatus.textContent = 'PAUSED';
        this.dom.simStatus.className = 'badge-value status-paused';
        this.sim.log('Simulation paused.', 'system');
    }

    loop(nowRealTime) {
        if (!this.sim.running) return;

        // Calculate elapsed real-world time in seconds
        const dtRealSeconds = (nowRealTime - this.lastFrameRealTime) / 1000.0;
        this.lastFrameRealTime = nowRealTime;

        // Advance simulation time based on speed multiplier
        const dtSimSeconds = dtRealSeconds * this.simSpeed;
        const targetSimTime = this.sim.currentTime + dtSimSeconds;

        // Process all events scheduled up to targetSimTime
        while (this.sim.eventQueue.length > 0 && this.sim.eventQueue.peek().time <= targetSimTime) {
            this.sim.step();
        }

        // Catch up simulation time if no events occurred
        if (this.sim.currentTime < targetSimTime) {
            this.sim.currentTime = targetSimTime;
        }

        // Append to chart history
        this.chartHistory.push({
            time: this.sim.currentTime,
            floor: this.sim.elevator.currentFloor,
            state: this.sim.elevator.state
        });
        // Limit chart history to last 60 seconds
        const cutoffTime = this.sim.currentTime - 60.0;
        this.chartHistory = this.chartHistory.filter(pt => pt.time >= cutoffTime);

        // Update visual animations frame by frame
        this.animateCabinAndDoors();
        this.updateExitingPassengers();
        this.renderChart();
        
        // Keep UI clock updated
        this.dom.simTime.textContent = this.sim.currentTime.toFixed(2) + 's';

        requestAnimationFrame((t) => this.loop(t));
    }

    // Directly control cabin height and door widths based on exact state at sim time
    animateCabinAndDoors() {
        const elev = this.sim.elevator;
        
        // 1. Calculate floor height dynamically if elevator is currently moving
        // By looking ahead in the Event Queue, we can interpolate the elevator height smoothly!
        if (elev.state === 'MOVING') {
            const nextEvent = this.sim.eventQueue.events.find(e => e.type === 'ELEVATOR_ARRIVE');
            if (nextEvent) {
                const arrivalTime = nextEvent.time;
                const targetFloor = nextEvent.data.floor;
                const startFloor = elev.startFloor || 1;
                const travelDuration = Math.abs(targetFloor - startFloor) * this.sim.config.travelSpeed;
                const startTime = arrivalTime - travelDuration;
                
                // Interpolate current decimal floor
                const progress = Math.min(1.0, Math.max(0.0, (this.sim.currentTime - startTime) / travelDuration));
                elev.currentFloor = startFloor + (targetFloor - startFloor) * progress;
            }
        }
        
        // Position cabin (0% is floor 1, 75% is floor 4)
        const bottomPercent = (elev.currentFloor - 1) * 25;
        this.dom.elevator.style.bottom = `calc(${bottomPercent}% + 4px)`;

        // Visual cabin status indicators
        this.dom.cabinFloorNum.textContent = elev.currentFloorDiscrete;
        this.dom.cabinDirArrow.textContent = elev.direction === 'UP' ? '▲' : (elev.direction === 'DOWN' ? '▼' : ' ');
        this.dom.cabinDirArrow.style.color = elev.direction === 'IDLE' ? 'transparent' : 'hsl(var(--color-cyan))';

        // Apply visual classes for glow styling
        this.dom.elevator.classList.toggle('moving', elev.state === 'MOVING');
        this.dom.elevator.classList.toggle('doors-open', elev.state === 'DOORS_OPEN' || elev.state === 'DOORS_OPENING');

        // 2. Door scaling animation
        let doorScale = 1.0; // Closed by default
        
        if (elev.state === 'DOORS_OPENING') {
            // Open progress: time elapsed since we started opening
            const nextEvent = this.sim.eventQueue.events.find(e => e.type === 'DOORS_OPENED');
            if (nextEvent) {
                const duration = this.sim.config.doorTime / 2;
                const start = nextEvent.time - duration;
                const progress = Math.min(1.0, Math.max(0.0, (this.sim.currentTime - start) / duration));
                doorScale = 1.0 - progress; // opens up to 0 scale
            }
        } else if (elev.state === 'DOORS_OPEN') {
            doorScale = 0.0; // Fully open
        } else if (elev.state === 'DOORS_CLOSING') {
            const nextEvent = this.sim.eventQueue.events.find(e => e.type === 'DOORS_CLOSED');
            if (nextEvent) {
                const duration = this.sim.config.doorTime / 2;
                const start = nextEvent.time - duration;
                const progress = Math.min(1.0, Math.max(0.0, (this.sim.currentTime - start) / duration));
                doorScale = progress; // closes up to 1 scale
            }
        }

        this.dom.doorL.style.transform = `scaleX(${doorScale})`;
        this.dom.doorR.style.transform = `scaleX(${doorScale})`;
        this.dom.elevator.classList.toggle('open', doorScale < 0.95);
    }

    addLog(time, message, type) {
        const line = document.createElement('div');
        line.className = `log-line ${type}`;
        line.innerHTML = `[${time.toFixed(1)}s] ${message}`;
        this.dom.logOutput.appendChild(line);
        
        // Auto-scroll log
        this.dom.logOutput.scrollTop = this.dom.logOutput.scrollHeight;
    }

    // Update the dashboard statistics, queues, and button lights
    updateDashboard() {
        // Update Stats Counters
        const stats = this.sim.getStats();
        this.dom.statServed.textContent = stats.served;
        this.dom.statAvgWait.textContent = stats.avgWait.toFixed(1) + 's';
        this.dom.statAvgTransit.textContent = stats.avgTransit.toFixed(1) + 's';
        this.dom.statAvgTrip.textContent = stats.avgTrip.toFixed(1) + 's';
        this.dom.statUtilization.textContent = stats.utilization.toFixed(0) + '%';

        // Update Floor Call Button Lights
        const activeRequests = this.sim.getActiveRequests();
        for (let f = 1; f <= 4; f++) {
            const upBtn = document.querySelector(`.floor[data-floor="${f}"] .call-up`);
            const downBtn = document.querySelector(`.floor[data-floor="${f}"] .call-down`);
            
            // Check if there are passengers waiting at this floor going UP or DOWN
            const hasUpCall = this.sim.floorQueues[f].some(p => p.destFloor > f);
            const hasDownCall = this.sim.floorQueues[f].some(p => p.destFloor < f);
            
            if (upBtn) upBtn.classList.toggle('active', hasUpCall);
            if (downBtn) downBtn.classList.toggle('active', hasDownCall);
        }

        // Render Lobbies
        for (let f = 1; f <= 4; f++) {
            const lobby = document.getElementById(`lobby-${f}`);
            const queue = this.sim.floorQueues[f];
            
            // Clear out passengers
            lobby.innerHTML = '';
            
            queue.forEach(p => {
                const el = this.createPassengerElement(p);
                lobby.appendChild(el);
            });
        }

        // Render Cabin Passengers
        this.dom.cabinPassengers.innerHTML = '';
        this.sim.elevator.passengers.forEach(p => {
            const el = this.createPassengerElement(p);
            this.dom.cabinPassengers.appendChild(el);
        });

        // Render FEL List
        this.renderFEL();
    }

    createPassengerElement(p) {
        const el = document.createElement('div');
        el.className = `passenger ${p.state.toLowerCase()}`;
        el.textContent = p.destFloor;
        el.dataset.id = p.id;
        
        // Detailed tooltip
        const statusText = p.state === 'WAITING' ? `Waiting (since ${p.arrivalTime.toFixed(1)}s)` : 
                           p.state === 'RIDING' ? `Riding (Wait: ${p.waitTime.toFixed(1)}s)` : p.state;
        el.setAttribute('data-tooltip', `Pax #${p.id}\nSrc: Floor ${p.sourceFloor}\nDst: Floor ${p.destFloor}\nStatus: ${statusText}`);
        
        return el;
    }

    // Triggered when passenger exits - add to fading visual tracking
    registerExitingPassenger(p) {
        this.exitingPassengers.push({
            id: p.id,
            floor: p.destFloor,
            spawnRealTime: performance.now(),
            xOffset: 0 // start at elevator exit door
        });
    }

    // Render exiting passengers walking away from the elevator shaft and fading out
    updateExitingPassengers() {
        const now = performance.now();
        const fadeDurationMs = 2000; // 2 seconds

        // Update exiting passengers list
        this.exitingPassengers = this.exitingPassengers.filter(ep => {
            const elapsed = now - ep.spawnRealTime;
            return elapsed < fadeDurationMs;
        });

        // Render exiting passengers on screen
        // Clean old exit containers
        document.querySelectorAll('.exit-pax-indicator').forEach(el => el.remove());

        this.exitingPassengers.forEach(ep => {
            const elapsed = now - ep.spawnRealTime;
            const progress = elapsed / fadeDurationMs;
            
            // Walk speed: move rightwards across the lobby
            const walkDistance = 150; // pixels
            const xOffset = walkDistance * progress;
            const opacity = 1.0 - progress;

            const lobby = document.getElementById(`lobby-${ep.floor}`);
            if (lobby) {
                const dot = document.createElement('div');
                dot.className = 'passenger completed exit-pax-indicator';
                dot.textContent = '✓';
                dot.style.position = 'absolute';
                dot.style.left = `${90 + xOffset}px`; // Offset elevator shaft
                dot.style.opacity = opacity;
                dot.style.pointerEvents = 'none';
                dot.style.zIndex = '3';
                
                // Append to building floor row rather than lobby to allow absolute placement
                const floorRow = document.querySelector(`.floor[data-floor="${ep.floor}"]`);
                floorRow.appendChild(dot);
            }
        });
    }

    renderFEL() {
        this.dom.felList.innerHTML = '';
        
        // Show first 8 events
        const events = this.sim.eventQueue.events.slice(0, 8);
        
        if (events.length === 0) {
            this.dom.felList.innerHTML = '<div class="fel-item"><span class="fel-item-desc">Queue empty</span></div>';
            return;
        }

        events.forEach(e => {
            const el = document.createElement('div');
            el.className = 'fel-item';
            
            let desc = '';
            if (e.type === 'PASSENGER_ARRIVE') {
                desc = `Pax at F${e.data.source} → F${e.data.dest}`;
            } else if (e.type === 'ELEVATOR_ARRIVE') {
                desc = `Elevator arrives at Floor ${e.data.floor}`;
            } else if (e.type === 'ELEVATOR_DEPART') {
                desc = `Elevator departs towards F${e.data.targetFloor}`;
            } else if (e.type === 'PASSENGER_BOARD') {
                desc = `Pax #${e.data.passenger.id} boards`;
            } else if (e.type === 'PASSENGER_ALIGHT') {
                desc = `Pax #${e.data.passenger.id} exits`;
            } else {
                desc = e.type.replace('_', ' ');
            }

            el.innerHTML = `
                <span class="fel-item-time">${e.time.toFixed(1)}s</span>
                <span class="fel-item-type">${e.type}</span>
                <span class="fel-item-desc">${desc}</span>
            `;
            this.dom.felList.appendChild(el);
        });
    }

    resizeCanvas() {
        const container = this.canvas.parentElement;
        this.canvas.width = container.clientWidth;
        this.canvas.height = container.clientHeight || 160;
        this.renderChart();
    }

    renderChart() {
        const width = this.canvas.width;
        const height = this.canvas.height;
        const ctx = this.ctx;
        
        // Clear canvas
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, width, height);

        if (this.chartHistory.length === 0) {
            ctx.fillStyle = '#64748b';
            ctx.font = '12px Outfit';
            ctx.textAlign = 'center';
            ctx.fillText('No history to plot. Click Play.', width / 2, height / 2);
            return;
        }

        const paddingLeft = 40;
        const paddingRight = 10;
        const paddingTop = 15;
        const paddingBottom = 20;
        
        const chartWidth = width - paddingLeft - paddingRight;
        const chartHeight = height - paddingTop - paddingBottom;

        const maxSimTime = this.sim.currentTime;
        const minSimTime = maxSimTime - 60.0; // Draw 60 seconds interval

        // Map Time to Canvas X coordinate
        const getX = (t) => {
            const pct = (t - minSimTime) / 60.0;
            return paddingLeft + pct * chartWidth;
        };

        // Map Elevator Floor (1.0 to 4.0) to Canvas Y coordinate
        const getY = (f) => {
            const pct = (f - 1.0) / 3.0; // 3 floors distance range (4 - 1 = 3)
            return paddingTop + (1.0 - pct) * chartHeight; // invert Y
        };

        // Draw Grid Lines (Floors 1, 2, 3, 4)
        ctx.lineWidth = 1;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.fillStyle = '#94a3b8';
        ctx.font = '10px JetBrains Mono';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';

        for (let f = 1; f <= 4; f++) {
            const y = getY(f);
            
            // Draw horizontal floor lines
            ctx.beginPath();
            ctx.moveTo(paddingLeft, y);
            ctx.lineTo(width - paddingRight, y);
            ctx.stroke();

            // Label floor numbers
            ctx.fillText(`Floor ${f}`, paddingLeft - 8, y);
        }

        // Draw Elevator Path Line
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = 'rgba(0, 243, 255, 0.85)';
        ctx.shadowColor = 'rgba(0, 243, 255, 0.35)';
        ctx.shadowBlur = 6;
        
        ctx.beginPath();
        let pathStarted = false;
        
        this.chartHistory.forEach(pt => {
            if (pt.time >= minSimTime) {
                const x = getX(pt.time);
                const y = getY(pt.floor);
                
                if (!pathStarted) {
                    ctx.moveTo(x, y);
                    pathStarted = true;
                } else {
                    ctx.lineTo(x, y);
                }
            }
        });
        ctx.stroke();
        
        // Reset shadow for subsequent draws
        ctx.shadowBlur = 0;

        // Draw Doors-Open shading on chart
        ctx.fillStyle = 'rgba(16, 185, 129, 0.15)'; // emerald overlay
        let openStart = null;

        this.chartHistory.forEach(pt => {
            if (pt.time >= minSimTime) {
                const isOpen = pt.state === 'DOORS_OPEN' || pt.state === 'DOORS_OPENING' || pt.state === 'DOORS_CLOSING';
                
                if (isOpen && openStart === null) {
                    openStart = pt.time;
                } else if (!isOpen && openStart !== null) {
                    // Draw a shaded bar representing door open period
                    const xStart = getX(openStart);
                    const xEnd = getX(pt.time);
                    const y = getY(pt.floor);
                    
                    ctx.fillRect(xStart, y - 8, xEnd - xStart, 16);
                    openStart = null;
                }
            }
        });
        
        // If elevator is still open at current time, draw up to current time
        if (openStart !== null) {
            const xStart = getX(openStart);
            const xEnd = getX(maxSimTime);
            const currentFloorVal = this.sim.elevator.currentFloor;
            ctx.fillRect(xStart, getY(currentFloorVal) - 8, xEnd - xStart, 16);
        }

        // Draw X-axis timestamps at bottom
        ctx.fillStyle = '#64748b';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.font = '9px JetBrains Mono';
        
        const tickInterval = 10.0; // every 10 seconds
        const startTick = Math.ceil(minSimTime / tickInterval) * tickInterval;
        
        for (let t = startTick; t <= maxSimTime; t += tickInterval) {
            const x = getX(t);
            if (x >= paddingLeft && x <= width - paddingRight) {
                ctx.fillText(`${t.toFixed(0)}s`, x, height - paddingBottom + 5);
            }
        }
    }
}
