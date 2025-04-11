import { onCLS, onFCP, onFID, onLCP, onTTFB } from 'web-vitals'

function reportWebVitals(onPerfEntry: any) {
    if (onPerfEntry && typeof onPerfEntry === 'function') {
        onCLS(onPerfEntry) // Measures visual stability
        onFID(onPerfEntry) // Measures interactivity
        onLCP(onPerfEntry) // Measures loading performance
        onFCP(onPerfEntry) // Measures time to first content display
        onTTFB(onPerfEntry) // Measures server response time
    }
}

export default reportWebVitals
