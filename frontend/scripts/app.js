(async () => {
    const app = window.GrandStayApp;

    if (!app) {
        console.error('GrandStay core runtime failed to load.');
        return;
    }

    app.initCore();

    try {
        if (typeof app.initBookingAndSpa === 'function') {
            await app.initBookingAndSpa();
        }

        if (typeof app.initDining === 'function') {
            await app.initDining();
        }

        console.log('GrandStay Hotel Website - Successfully Loaded');
    } catch (error) {
        console.error('GrandStay initialization failed:', error);
    }
})();
