// Application initialization
document.addEventListener('DOMContentLoaded', () => {
    // Create the simulator instance
    const sim = new Simulation();
    
    // Create the dashboard manager
    const ui = new UIManager(sim);
    
    // Wire up event processing hooks for animation details
    sim.onEventProcessed = (event) => {
        // When a passenger successfully exits, queue the exiting visual walking/fadeout animation
        if (event.type === 'PASSENGER_ALIGHT' && event.data && event.data.passenger) {
            ui.registerExitingPassenger(event.data.passenger);
        }
        
        // Refresh the Future Event List UI
        ui.renderFEL();
    };

    // Perform initial reset to clear parameters and schedule first spawn
    sim.reset();
    
    // Log initial status
    sim.log("Simulator ready. Click 'Play' or 'Step Event' to begin.", "system");
});
