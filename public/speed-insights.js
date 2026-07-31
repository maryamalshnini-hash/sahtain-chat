// Vercel Speed Insights Integration
// This script initializes Vercel Speed Insights for the application

(function() {
    'use strict';
    
    // Only run in browser environment
    if (typeof window === 'undefined') return;
    
    // Initialize the Speed Insights queue
    window.si = window.si || function(...params) {
        (window.siq = window.siq || []).push(params);
    };
    
    // Detect environment (development vs production)
    const isDevelopment = window.location.hostname === 'localhost' || 
                          window.location.hostname === '127.0.0.1';
    
    // Determine the correct script source based on environment
    const scriptSrc = isDevelopment 
        ? 'https://va.vercel-scripts.com/v1/speed-insights/script.debug.js'
        : '/_vercel/speed-insights/script.js';
    
    // Check if script is already loaded
    if (document.head.querySelector(`script[src*="${scriptSrc}"]`)) {
        return;
    }
    
    // Create and configure the script element
    const script = document.createElement('script');
    script.src = scriptSrc;
    script.defer = true;
    script.dataset.sdkn = '@vercel/speed-insights';
    script.dataset.sdkv = '1.3.1';
    
    // Optional: Set sample rate (1.0 = 100% of pageviews tracked)
    // script.dataset.sampleRate = '1.0';
    
    // Inject the script into the document head
    document.head.appendChild(script);
    
    // Optional: Log in development mode
    if (isDevelopment) {
        console.log('Vercel Speed Insights initialized (debug mode)');
    }
})();
