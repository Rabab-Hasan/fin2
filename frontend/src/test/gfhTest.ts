// Test the GFH Data Query Interface
import { askGFH } from '../utils/gfhQueryInterface';

// Test Instagram timing in Oman question
console.log("=== INSTAGRAM TIMING IN OMAN (FROM GFH DATA) ===");
console.log(askGFH.instagramTimingOman());

console.log("\n=== MARKET COMPARISON (FROM GFH DATA) ===");
console.log(askGFH.marketComparison());

console.log("\n=== PLATFORM TIMING EXAMPLES ===");
console.log(askGFH.platformTiming('Meta', 'OMN'));
console.log(askGFH.platformTiming('Google UAC', 'KSA'));

console.log("\n=== CONTENT RECOMMENDATIONS ===");
console.log(askGFH.contentRecommendations('Meta', 'OMN'));

export {}; // Make this a module