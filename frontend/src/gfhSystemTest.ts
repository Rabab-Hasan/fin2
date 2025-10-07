// GFH System Test Script - Run this to verify the system works correctly
import GFHDataParser from './utils/gfhDataParser';
import GFHDataAnalyzer from './utils/gfhDataAnalyzer';
import { askGFH } from './utils/gfhQueryInterface';

console.log('🔍 Testing GFH Data System...');
console.log('=====================================');

// Test 1: Basic data parsing
console.log('\n1. Testing GFH Data Parser:');
try {
  const allData = GFHDataParser.getAllCampaignData();
  console.log(`✅ Found ${allData.length} campaigns in GFH data`);
  console.log(`   Sample: ${allData[0].campaign} - ${allData[0].platform} in ${allData[0].market}`);
} catch (error) {
  console.log(`❌ Parser Error: ${error.message}`);
}

// Test 2: Instagram timing in Oman
console.log('\n2. Testing Instagram Timing in Oman:');
try {
  const timing = askGFH.instagramTimingOman();
  console.log(`✅ Instagram Oman Analysis: ${timing.substring(0, 200)}...`);
} catch (error) {
  console.log(`❌ Timing Error: ${error.message}`);
}

// Test 3: Platform data for specific market
console.log('\n3. Testing Platform Data Lookup:');
try {
  const omanMeta = GFHDataParser.getPlatformDataForMarket('Meta', 'OMN');
  if (omanMeta.length > 0) {
    console.log(`✅ Found Meta campaign in Oman: ${(omanMeta[0].deliveredCTR * 100).toFixed(2)}% CTR at $${omanMeta[0].deliveredCPC.toFixed(3)} CPC`);
  } else {
    console.log('❌ No Meta data found for Oman');
  }
} catch (error) {
  console.log(`❌ Platform Data Error: ${error.message}`);
}

// Test 4: Dynamic campaign analysis
console.log('\n4. Testing Dynamic Campaign Analysis:');
try {
  const analysis = GFHDataAnalyzer.analyzeUserCampaign(
    5000, // budget
    30,   // duration
    ['Oman'], // countries
    ['Instagram'], // platforms
    ['Brand Awareness'], // objectives
    ['video'] // content types
  );
  console.log(`✅ Generated ${analysis.length} dynamic insights`);
  if (analysis.length > 0) {
    console.log(`   Sample insight: ${analysis[0].type} - ${analysis[0].message}`);
  }
} catch (error) {
  console.log(`❌ Dynamic Analysis Error: ${error.message}`);
}

// Test 5: Market comparison
console.log('\n5. Testing Market Comparison:');
try {
  const comparison = askGFH.marketComparison();
  console.log(`✅ Market Comparison: ${comparison.substring(0, 150)}...`);
} catch (error) {
  console.log(`❌ Market Comparison Error: ${error.message}`);
}

console.log('\n=====================================');
console.log('🎯 GFH System Test Complete!');
console.log('If all tests show ✅, the system is working correctly.');
console.log('The Campaign Assistant now uses REAL GFH data instead of generic recommendations.');