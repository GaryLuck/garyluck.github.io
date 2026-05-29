// Priority Queue implementation for events, sorted by occurrence time
class EventQueue {
    constructor() {
        this.events = [];
    }

    push(event) {
        // Insert event in chronological order
        let index = this.events.findIndex(e => e.time > event.time);
        if (index === -1) {
            this.events.push(event);
        } else {
            this.events.splice(index, 0, event);
        }
    }

    pop() {
        return this.events.shift();
    }

    peek() {
        return this.events[0];
    }

    clear() {
        this.events = [];
    }

    removePassengerEvents(passengerId) {
        this.events = this.events.filter(e => {
            return !(e.data && e.data.passenger && e.data.passenger.id === passengerId);
        });
    }

    get length() {
        return this.events.length;
    }
}

// Event class representing a discrete event
class SimEvent {
    constructor(time, type, data = null) {
        this.time = time;      // Simulation time
        this.type = type;      // Event type string
        this.data = data;      // Optional payload
    }
}

// Passenger state representation
class Passenger {
    constructor(id, sourceFloor, destFloor, arrivalTime) {
        this.id = id;
        this.sourceFloor = parseInt(sourceFloor);
        this.destFloor = parseInt(destFloor);
        this.arrivalTime = arrivalTime;
        
        this.boardTime = null;
        this.exitTime = null;
        this.state = 'WAITING'; // 'WAITING', 'BOARDING', 'RIDING', 'EXITING', 'COMPLETED'
    }

    get waitTime() {
        if (this.boardTime === null) return 0;
        return this.boardTime - this.arrivalTime;
    }

    get transitTime() {
        if (this.exitTime === null || this.boardTime === null) return 0;
        return this.exitTime - this.boardTime;
    }

    get totalTime() {
        if (this.exitTime === null) return 0;
        return this.exitTime - this.arrivalTime;
    }
}

// Elevator state representation
class Elevator {
    constructor(capacity) {
        this.currentFloor = 1.0; // Decimal representation for smooth rendering
        this.startFloor = 1;     // Starting floor of current movement run
        this.targetFloor = 1;    // Next floor it is heading to
        this.direction = 'IDLE'; // 'UP', 'DOWN', 'IDLE'
        this.state = 'STOPPED';  // 'STOPPED', 'MOVING', 'DOORS_OPENING', 'DOORS_OPEN', 'DOORS_CLOSING'
        this.passengers = [];    // Passengers currently inside
        this.capacity = capacity;
        this.stops = new Set();  // Requested floors (hall calls + car calls)
    }

    get isFull() {
        return this.passengers.length >= this.capacity;
    }

    get currentFloorDiscrete() {
        return Math.round(this.currentFloor);
    }
}

// Core DES Engine
class Simulation {
    constructor() {
        this.currentTime = 0.0;
        this.eventQueue = new EventQueue();
        this.elevator = new Elevator(4);
        
        // Queues of waiting passengers on each floor (1-indexed)
        this.floorQueues = { 1: [], 2: [], 3: [], 4: [] };
        
        // Track all passengers for statistics
        this.passengers = [];
        this.nextPassengerId = 1;

        // Config variables
        this.config = {
            capacity: 4,
            travelSpeed: 1.5, // seconds per floor
            doorTime: 1.0,    // door cycle time (half to open, half to close)
            boardTime: 0.5,   // seconds per passenger boarding/alighting
            meanArrivalRate: 10, // Mean seconds per arrival (Poisson process)
        };

        this.autoSpawnEnabled = true;
        this.activeAlgorithm = 'LOOK';
        this.running = false;
        
        // FCFS dispatch queue
        this.fcfsQueue = [];

        // Callbacks for UI updates
        this.onEventProcessed = null;
        this.onStateChanged = null;
        this.onLogMessage = null;
    }

    reset() {
        this.currentTime = 0.0;
        this.eventQueue.clear();
        this.elevator = new Elevator(this.config.capacity);
        this.floorQueues = { 1: [], 2: [], 3: [], 4: [] };
        this.passengers = [];
        this.nextPassengerId = 1;
        this.fcfsQueue = [];
        
        this.log('System reset.', 'system');
        
        // Re-schedule first automatic arrival if enabled
        if (this.autoSpawnEnabled) {
            this.scheduleNextArrival();
        }

        if (this.onStateChanged) this.onStateChanged();
    }

    log(message, type = 'system') {
        if (this.onLogMessage) {
            this.onLogMessage(this.currentTime, message, type);
        }
    }

    // Helper: Schedule next arrival using Exponential Distribution (Poisson process)
    scheduleNextArrival() {
        // Exp distribution: -mean * ln(1 - U)
        const u = Math.random();
        const interArrivalTime = -this.config.meanArrivalRate * Math.log(1 - u);
        const arrivalTime = this.currentTime + interArrivalTime;
        
        // Generate random source & destination (ensuring source != dest)
        const source = Math.floor(Math.random() * 4) + 1;
        let dest = Math.floor(Math.random() * 4) + 1;
        while (dest === source) {
            dest = Math.floor(Math.random() * 4) + 1;
        }

        const event = new SimEvent(arrivalTime, 'PASSENGER_ARRIVE', { source, dest });
        this.eventQueue.push(event);
    }

    // Spawn a passenger immediately
    spawnPassenger(source, dest) {
        const pax = new Passenger(this.nextPassengerId++, source, dest, this.currentTime);
        this.passengers.push(pax);
        this.floorQueues[source].push(pax);
        
        this.log(`Passenger #${pax.id} arrived at Floor ${source} heading to Floor ${dest}`, 'pax-arrive');
        
        // Register the call
        this.registerCall(source, dest > source ? 'up' : 'down');
        
        // If elevator is idle, wake it up
        if (this.elevator.direction === 'IDLE' && this.elevator.state === 'STOPPED') {
            this.scheduleNextElevatorAction();
        }

        if (this.onStateChanged) this.onStateChanged();
    }

    registerCall(floor, dir) {
        this.elevator.stops.add(floor);
        
        if (this.activeAlgorithm === 'FCFS') {
            if (!this.fcfsQueue.includes(floor)) {
                this.fcfsQueue.push(floor);
            }
        }
    }

    // Process the next event from the event queue
    step() {
        if (this.eventQueue.length === 0) {
            return false;
        }

        const event = this.eventQueue.pop();
        
        // Ensure simulation time doesn't go backwards (DES rule)
        if (event.time < this.currentTime) {
            event.time = this.currentTime;
        }
        
        this.currentTime = event.time;

        switch (event.type) {
            case 'PASSENGER_ARRIVE':
                this.handlePassengerArrive(event.data.source, event.data.dest);
                break;
            case 'ELEVATOR_ARRIVE':
                this.handleElevatorArrive(event.data.floor);
                break;
            case 'DOORS_OPENING':
                this.handleDoorsOpening();
                break;
            case 'DOORS_OPENED':
                this.handleDoorsOpened();
                break;
            case 'PASSENGER_BOARD':
                this.handlePassengerBoard(event.data.passenger);
                break;
            case 'PASSENGER_ALIGHT':
                this.handlePassengerAlight(event.data.passenger);
                break;
            case 'DOORS_CLOSING':
                this.handleDoorsClosing();
                break;
            case 'DOORS_CLOSED':
                this.handleDoorsClosed();
                break;
            case 'ELEVATOR_DEPART':
                this.handleElevatorDepart(event.data.targetFloor);
                break;
        }

        if (this.onEventProcessed) this.onEventProcessed(event);
        if (this.onStateChanged) this.onStateChanged();
        
        return true;
    }

    handlePassengerArrive(source, dest) {
        this.spawnPassenger(source, dest);
        
        if (this.autoSpawnEnabled) {
            this.scheduleNextArrival();
        }
    }

    handleElevatorArrive(floor) {
        this.elevator.currentFloor = floor;
        this.elevator.state = 'STOPPED';
        this.log(`Elevator arrived at Floor ${floor}`, 'elev-arrive');
        
        // Remove from FCFS queue if it's the target
        if (this.activeAlgorithm === 'FCFS') {
            this.fcfsQueue = this.fcfsQueue.filter(f => f !== floor);
        }
        
        // Clear stops at this floor
        this.elevator.stops.delete(floor);

        // Schedule doors opening
        const halfCycle = this.config.doorTime / 2;
        this.eventQueue.push(new SimEvent(this.currentTime + halfCycle, 'DOORS_OPENING'));
    }

    handleDoorsOpening() {
        this.elevator.state = 'DOORS_OPENING';
        this.log(`Elevator doors opening at Floor ${this.elevator.currentFloorDiscrete}`, 'system');
        const halfCycle = this.config.doorTime / 2;
        this.eventQueue.push(new SimEvent(this.currentTime + halfCycle, 'DOORS_OPENED'));
    }

    handleDoorsOpened() {
        this.elevator.state = 'DOORS_OPEN';
        const currentFloor = this.elevator.currentFloorDiscrete;
        this.log(`Elevator doors fully open at Floor ${currentFloor}`, 'system');

        // 1. Identify boarding and alighting passengers
        const alighting = this.elevator.passengers.filter(p => p.destFloor === currentFloor);
        
        // Boarding passengers: filter the lobby queue
        const lobbyQueue = this.floorQueues[currentFloor];
        const boarding = [];
        
        // Decide which passenger can board based on direction and capacity
        let currentOccupancy = this.elevator.passengers.length - alighting.length;
        
        for (let i = 0; i < lobbyQueue.length; i++) {
            const p = lobbyQueue[i];
            
            // Check if elevator can accommodate
            if (currentOccupancy >= this.config.capacity) {
                break; // Elevator full
            }

            // Decide boarding filter based on algorithm direction
            const pDir = p.destFloor > currentFloor ? 'UP' : 'DOWN';
            
            // Under LOOK algorithm, we only board passengers heading in the elevator's current direction
            // unless the elevator direction is IDLE, or there are no requests ahead in the current direction.
            let willBoard = false;
            
            if (this.elevator.direction === 'IDLE') {
                willBoard = true;
                // Adopt passenger's direction
                this.elevator.direction = pDir;
            } else if (this.activeAlgorithm === 'LOOK') {
                // Check if passenger matches elevator's direction
                if (pDir === this.elevator.direction) {
                    willBoard = true;
                } else {
                    // Check if elevator has any other calls in its current direction.
                    // If not, and this passenger is waiting to go the opposite way, we reverse direction and let them board.
                    const hasCallsAhead = this.hasCallsInDirection(currentFloor, this.elevator.direction);
                    const alightingAhead = this.elevator.passengers.some(ap => 
                        this.elevator.direction === 'UP' ? ap.destFloor > currentFloor : ap.destFloor < currentFloor
                    );

                    if (!hasCallsAhead && !alightingAhead) {
                        this.elevator.direction = pDir;
                        willBoard = true;
                    }
                }
            } else {
                // SSTF or FCFS boards anyone who fits
                willBoard = true;
            }

            if (willBoard) {
                boarding.push(p);
                currentOccupancy++;
            }
        }

        // 2. Schedule boarding and alighting events
        let delay = 0.0;
        
        // Alight events first
        alighting.forEach(p => {
            p.state = 'EXITING';
            this.eventQueue.push(new SimEvent(this.currentTime + delay, 'PASSENGER_ALIGHT', { passenger: p }));
            delay += this.config.boardTime;
        });

        // Board events next
        boarding.forEach(p => {
            // Remove from lobby queue so no other elevator action tries to process them
            const idx = this.floorQueues[currentFloor].indexOf(p);
            if (idx > -1) this.floorQueues[currentFloor].splice(idx, 1);
            
            p.state = 'BOARDING';
            this.eventQueue.push(new SimEvent(this.currentTime + delay, 'PASSENGER_BOARD', { passenger: p }));
            delay += this.config.boardTime;
        });

        // 3. Schedule doors closing after boarding/alighting completes
        const doorHoldOpenTime = 1.0; // Minimum time doors stay open
        const doorsCloseDelay = Math.max(doorHoldOpenTime, delay);
        
        this.eventQueue.push(new SimEvent(this.currentTime + doorsCloseDelay, 'DOORS_CLOSING'));
    }

    handlePassengerAlight(passenger) {
        passenger.exitTime = this.currentTime;
        passenger.state = 'COMPLETED';
        
        // Remove from elevator cabin
        this.elevator.passengers = this.elevator.passengers.filter(p => p.id !== passenger.id);
        
        this.log(`Passenger #${passenger.id} exited at Floor ${passenger.destFloor} (Wait: ${passenger.waitTime.toFixed(1)}s, Transit: ${passenger.transitTime.toFixed(1)}s)`, 'board');
    }

    handlePassengerBoard(passenger) {
        passenger.boardTime = this.currentTime;
        passenger.state = 'RIDING';
        
        this.elevator.passengers.push(passenger);
        // Add destination as a stop
        this.registerCall(passenger.destFloor, passenger.destFloor > passenger.sourceFloor ? 'up' : 'down');
        
        this.log(`Passenger #${passenger.id} boarded elevator at Floor ${passenger.sourceFloor} (Wait: ${passenger.waitTime.toFixed(1)}s)`, 'board');
    }

    handleDoorsClosing() {
        this.elevator.state = 'DOORS_CLOSING';
        this.log(`Elevator doors closing at Floor ${this.elevator.currentFloorDiscrete}`, 'system');
        const halfCycle = this.config.doorTime / 2;
        this.eventQueue.push(new SimEvent(this.currentTime + halfCycle, 'DOORS_CLOSED'));
    }

    handleDoorsClosed() {
        this.elevator.state = 'STOPPED';
        this.log(`Elevator doors closed at Floor ${this.elevator.currentFloorDiscrete}`, 'system');
        
        // Determine what the elevator does next
        this.scheduleNextElevatorAction();
    }

    // Core Dispatcher Scheduler
    scheduleNextElevatorAction() {
        const currentFloor = this.elevator.currentFloorDiscrete;
        
        // 1. Get next target floor from scheduling algorithms
        const decision = getNextTargetFloor(this);
        
        if (decision.targetFloor === null) {
            // No requests active in the building
            this.elevator.targetFloor = currentFloor;
            this.elevator.direction = 'IDLE';
            this.log('Elevator idling, awaiting requests.', 'system');
        } else {
            this.elevator.targetFloor = decision.targetFloor;
            this.elevator.direction = decision.direction;
            
            if (decision.targetFloor === currentFloor) {
                // If decision says stay at current floor, open doors immediately
                const halfCycle = this.config.doorTime / 2;
                this.eventQueue.push(new SimEvent(this.currentTime + halfCycle, 'DOORS_OPENING'));
            } else {
                // Schedule elevator departure
                this.eventQueue.push(new SimEvent(this.currentTime, 'ELEVATOR_DEPART', { targetFloor: decision.targetFloor }));
            }
        }
    }

    handleElevatorDepart(targetFloor) {
        this.elevator.state = 'MOVING';
        this.elevator.startFloor = this.elevator.currentFloorDiscrete; // Store starting floor of travel
        const currentFloor = this.elevator.currentFloor;
        const floorsToTravel = Math.abs(targetFloor - currentFloor);
        const travelDuration = floorsToTravel * this.config.travelSpeed;
        
        this.log(`Elevator departing Floor ${this.elevator.currentFloorDiscrete} towards Floor ${targetFloor} (ETA: ${travelDuration.toFixed(1)}s)`, 'depart');
        
        // Create an ARRIVE event in the future
        this.eventQueue.push(new SimEvent(this.currentTime + travelDuration, 'ELEVATOR_ARRIVE', { floor: targetFloor }));
    }

    // Helper: Find if there are calls in a given direction
    hasCallsInDirection(floor, direction) {
        // Check if there are outstanding stops or lobby passengers in the specified direction
        for (let f = 1; f <= 4; f++) {
            const hasLobbyPax = this.floorQueues[f].length > 0;
            const hasStop = this.elevator.stops.has(f);
            
            if (hasLobbyPax || hasStop) {
                if (direction === 'UP' && f > floor) return true;
                if (direction === 'DOWN' && f < floor) return true;
            }
        }
        return false;
    }

    // Helper for algorithms: Get all active requests (stops + lobby queues)
    getActiveRequests() {
        const requests = new Set();
        // Add elevator stops (destinations)
        this.elevator.stops.forEach(f => requests.add(f));
        // Add floor lobbies where passengers are waiting
        for (let f = 1; f <= 4; f++) {
            if (this.floorQueues[f].length > 0) {
                requests.add(f);
            }
        }
        return requests;
    }

    // Statistics Calculations
    getStats() {
        const completed = this.passengers.filter(p => p.state === 'COMPLETED');
        const count = completed.length;
        
        let avgWait = 0.0;
        let avgTransit = 0.0;
        let avgTrip = 0.0;
        
        if (count > 0) {
            const sumWait = completed.reduce((sum, p) => sum + p.waitTime, 0);
            const sumTransit = completed.reduce((sum, p) => sum + p.transitTime, 0);
            const sumTrip = completed.reduce((sum, p) => sum + p.totalTime, 0);
            
            avgWait = sumWait / count;
            avgTransit = sumTransit / count;
            avgTrip = sumTrip / count;
        }

        // Elevator utilization: portion of time cabin has passengers inside
        // Since that's tricky to calculate without integrating over time, we can calculate:
        // current utilization: current cabin size / capacity
        const currentPaxCount = this.elevator.passengers.length;
        const utilization = (currentPaxCount / this.config.capacity) * 100;

        return {
            served: count,
            avgWait: avgWait,
            avgTransit: avgTransit,
            avgTrip: avgTrip,
            utilization: utilization
        };
    }
}
