// Dispatcher algorithm coordinator
function getNextTargetFloor(sim) {
    const currentFloor = sim.elevator.currentFloorDiscrete;
    const direction = sim.elevator.direction;
    const activeRequests = sim.getActiveRequests(); // Set of floor numbers with pending calls

    if (activeRequests.size === 0) {
        return { targetFloor: null, direction: 'IDLE' };
    }

    switch (sim.activeAlgorithm) {
        case 'LOOK':
            return getLookDecision(currentFloor, direction, activeRequests);
        case 'SSTF':
            return getSstfDecision(currentFloor, direction, activeRequests);
        case 'FCFS':
            return getFcfsDecision(currentFloor, direction, sim.fcfsQueue);
        default:
            return getLookDecision(currentFloor, direction, activeRequests);
    }
}

// LOOK Algorithm implementation
function getLookDecision(currentFloor, direction, activeRequests) {
    if (direction === 'IDLE') {
        // Find closest request. If tie, prefer lower floor.
        let closestFloor = null;
        let minDistance = Infinity;

        activeRequests.forEach(f => {
            const dist = Math.abs(f - currentFloor);
            if (dist < minDistance) {
                minDistance = dist;
                closestFloor = f;
            } else if (dist === minDistance && f < closestFloor) {
                closestFloor = f;
            }
        });

        const newDir = closestFloor > currentFloor ? 'UP' : (closestFloor < currentFloor ? 'DOWN' : 'IDLE');
        return { targetFloor: closestFloor, direction: newDir };
    }

    if (direction === 'UP') {
        // 1. Look for requests above current floor
        let target = null;
        let minFloorAbove = Infinity;
        
        activeRequests.forEach(f => {
            if (f > currentFloor && f < minFloorAbove) {
                minFloorAbove = f;
                target = f;
            }
        });

        if (target !== null) {
            return { targetFloor: target, direction: 'UP' };
        }

        // 2. Look for request at current floor (doors just closed, passenger waiting)
        if (activeRequests.has(currentFloor)) {
            return { targetFloor: currentFloor, direction: 'UP' };
        }

        // 3. Reverse direction: look for requests below
        let maxFloorBelow = -Infinity;
        activeRequests.forEach(f => {
            if (f < currentFloor && f > maxFloorBelow) {
                maxFloorBelow = f;
                target = f;
            }
        });

        if (target !== null) {
            return { targetFloor: target, direction: 'DOWN' };
        }
    }

    if (direction === 'DOWN') {
        // 1. Look for requests below current floor
        let target = null;
        let maxFloorBelow = -Infinity;

        activeRequests.forEach(f => {
            if (f < currentFloor && f > maxFloorBelow) {
                maxFloorBelow = f;
                target = f;
            }
        });

        if (target !== null) {
            return { targetFloor: target, direction: 'DOWN' };
        }

        // 2. Look for request at current floor
        if (activeRequests.has(currentFloor)) {
            return { targetFloor: currentFloor, direction: 'DOWN' };
        }

        // 3. Reverse direction: look for requests above
        let minFloorAbove = Infinity;
        activeRequests.forEach(f => {
            if (f > currentFloor && f < minFloorAbove) {
                minFloorAbove = f;
                target = f;
            }
        });

        if (target !== null) {
            return { targetFloor: target, direction: 'UP' };
        }
    }

    // Fallback
    return { targetFloor: currentFloor, direction: 'IDLE' };
}

// Shortest Seek Time First (SSTF) Algorithm implementation
function getSstfDecision(currentFloor, direction, activeRequests) {
    let closestFloor = null;
    let minDistance = Infinity;

    activeRequests.forEach(f => {
        const dist = Math.abs(f - currentFloor);
        if (dist < minDistance) {
            minDistance = dist;
            closestFloor = f;
        } else if (dist === minDistance) {
            // If distance is tied:
            // 1. Prefer matching current direction
            if (direction === 'UP' && f > currentFloor) {
                closestFloor = f;
            } else if (direction === 'DOWN' && f < currentFloor) {
                closestFloor = f;
            }
        }
    });

    let newDir = direction;
    if (closestFloor > currentFloor) {
        newDir = 'UP';
    } else if (closestFloor < currentFloor) {
        newDir = 'DOWN';
    } else {
        // Stay at current floor (open doors)
        newDir = direction === 'IDLE' ? 'UP' : direction; // default fallback if idle
    }

    return { targetFloor: closestFloor, direction: newDir };
}

// First-Come, First-Served (FCFS) Algorithm implementation
function getFcfsDecision(currentFloor, direction, fcfsQueue) {
    if (fcfsQueue.length === 0) {
        return { targetFloor: null, direction: 'IDLE' };
    }

    // Target is the oldest active request in the queue
    const target = fcfsQueue[0];
    
    let newDir = 'IDLE';
    if (target > currentFloor) {
        newDir = 'UP';
    } else if (target < currentFloor) {
        newDir = 'DOWN';
    } else {
        // Already at target, can open doors
        newDir = 'IDLE';
    }

    return { targetFloor: target, direction: newDir };
}
