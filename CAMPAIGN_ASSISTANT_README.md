# Campaign Assistant - GFH Data Integration

## Overview
The Campaign Assistant is an AI-powered component that provides intelligent recommendations based on GFH's historical campaign performance data from the "GFH - Weekly Campaign performance.xlsx" file.

## Features

### 1. **Dynamic GFH Data Analysis** ⭐ NEW!
- **Real-time analysis** of user's campaign setup against actual GFH performance data
- **Personalized insights** based on selected budget, duration, countries, platforms
- **5 insight categories**: Timing, Market, Platform, Budget, and Content analysis  
- **Priority-based recommendations**: High/Medium/Low priority insights with specific actions
- **Live data matching**: Compares user choices with actual GFH campaign results

### 2. **Smart Timing Recommendations**
- Analyzes 11 weeks of historical performance data
- Suggests optimal campaign phases (Launch, Peak, Optimization, Final Push)
- Provides expected CPM, CPC, and CTR for each phase
- Based on actual GFH campaign week-on-week performance

### 2. **Content Type Intelligence**
- Recommends best-performing content types for selected platforms
- Shows engagement boost potential (+X% CTR improvement)
- Suggests optimal timing for each content type
- Based on content performance insights from successful GFH campaigns

### 3. **Market Performance Insights**
- Analyzes performance across 6 GCC markets (KSA, UAE, Kuwait, Qatar, Oman, Bahrain)
- Shows market-specific strengths and considerations
- Recommends budget allocation percentages based on historical ROI
- Highlights cost-efficient markets (e.g., Oman: $0.071 CPC, 3.01% CTR)

### 4. **Platform Recommendations**
- Compares 5 platforms with actual GFH performance metrics
- Ranks platforms by suitability for campaign objectives
- Shows historical CPM, CPC, CTR data
- Recommends budget distribution based on performance

### 5. **Strategic Insights**
- AI-generated overall campaign strategy
- Budget and duration-specific recommendations
- Multi-market and multi-platform optimization tips

## Integration Points

### In Campaign Setup Process
The assistant appears automatically when:
- Budget > $0
- Duration > 0 days  
- At least 1 country selected

### Contextual Hints Throughout Setup
- **Budget Step**: Shows budget-specific platform recommendations
- **Country Selection**: Displays market performance insights from GFH data
- **Platform Selection**: Shows historical performance metrics for each platform
- **Content Selection**: Highlights high-performing content types with engagement data

## Data Sources

### Historical Performance Data
- **11 weeks** of campaign performance data
- **6 GCC markets** with detailed metrics
- **5 platforms** with comprehensive performance data
- **10+ content types** with performance insights

### Key Metrics Used
- **CPM** (Cost Per Mille): $1.44 - $7.04 range
- **CPC** (Cost Per Click): $0.071 - $1.11 range  
- **CTR** (Click Through Rate): 0.13% - 4.76% range
- **CPI** (Cost Per Install): $1.26 - $9.27 range

## Usage Example

```typescript
<CampaignAssistantComponent
  budget={25000}
  duration={42}
  countries={['Saudi Arabia', 'UAE', 'Oman']}
  platforms={['Meta (Facebook)', 'Google Ads', 'LinkedIn']}
  objectives={['Traffic', 'Conversions']}
  contentSelected={['Influencer Reel', 'Prizes Animation']}
  onRecommendationApply={(type, data) => {
    // Handle applying AI recommendations
    if (type === 'content') {
      addContentToSelection(data);
    }
  }}
/>
```

## Dynamic Analysis Examples

### Real-Time Insights Based on User Input

**Example 1: Market Selection**
```
User selects: Oman + $20,000 budget
GFH Insight: "Oman shows excellent efficiency: 3.01% CTR at $0.071 CPC (42.3x efficiency score)"
Recommendation: "Allocate 25% of budget to Oman for optimal ROI"
Data Source: Actual GFH market performance showing Oman's superior cost efficiency
```

**Example 2: Platform + Objective Matching**
```
User selects: Google Ads + App Install objective
GFH Insight: "Perfect match! Google UAC achieved 4.76% CTR and 14.2 installs per $1000 spend"
Recommendation: "Allocate 40% budget to Google UAC for app install campaigns"
Data Source: GFH's Google UAC campaigns delivering 14,217 installs from $14,313 spend
```

**Example 3: Budget Optimization**
```
User inputs: $50,000 budget across Meta + Google
GFH Insight: "High budget detected! GFH achieved $0.127 CPC on Meta, $0.110 on Google"
Recommendation: "Split 60% Meta / 40% Google based on historical efficiency ratios"
Data Source: Meta ($20,992 spend, 165,686 clicks) vs Google ($14,314 spend, 130,041 clicks)
```

## Key Benefits

### 1. **Data-Driven Decisions**
- All recommendations based on actual GFH campaign performance
- Reduces guesswork in campaign planning
- Improves campaign ROI through historical insights

### 2. **Time-Saving**
- Instant access to months of performance analysis
- Pre-calculated optimal strategies
- Automated content and platform recommendations

### 3. **Performance Optimization**
- Market-specific insights for better targeting
- Platform performance rankings for budget allocation
- Content timing recommendations for maximum engagement

### 4. **Cost Efficiency**
- Identifies most cost-effective markets (Oman: $0.071 CPC)
- Recommends budget distribution based on historical ROI
- Highlights high-performing platform combinations

## Technical Implementation

### Files Created/Modified
1. **`gfhDataAnalyzer.ts`** ⭐ NEW! - Dynamic GFH data analysis engine
2. **`campaignAssistant.ts`** - Core analysis engine  
3. **`CampaignAssistantComponent.tsx`** - UI component with dynamic insights
4. **`CampaignSetup.tsx`** - Integration and contextual hints

### Data Processing
- **Real-time parsing** of GFH Excel data into structured metrics
- **Dynamic matching** of user selections with historical performance
- **Efficiency scoring** using CTR/CPC ratios from actual campaigns
- **Contextual insights** that change based on user's specific setup
- **Priority ranking** of insights based on performance impact
- **Live recommendations** that update as user modifies campaign parameters

## Future Enhancements
- Real-time performance tracking integration
- A/B testing recommendations
- Seasonal performance analysis
- Industry benchmark comparisons
- Machine learning-powered optimizations

---

*The Campaign Assistant leverages GFH's extensive campaign history to provide actionable, data-driven recommendations for optimal campaign performance.*