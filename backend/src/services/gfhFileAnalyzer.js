const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');
const { Ollama } = require('ollama');

class GFHFileAnalyzer {
  constructor() {
    this.ollama = new Ollama({ host: 'http://localhost:11434' });
    this.model = 'mistral';
    this.gfhFilePath = path.join(__dirname, '../../../GFH - Weekly Campaign performance.xlsx');
    this.cachedData = null;
    this.lastReadTime = null;
  }

  /**
   * Read and parse the complete GFH Excel file
   */
  async readGFHFile() {
    try {
      console.log('📊 Reading GFH Excel file:', this.gfhFilePath);
      
      // Check if file exists
      if (!fs.existsSync(this.gfhFilePath)) {
        throw new Error(`GFH file not found: ${this.gfhFilePath}`);
      }

      // Check if we need to re-read the file
      const stats = fs.statSync(this.gfhFilePath);
      if (this.cachedData && this.lastReadTime && stats.mtime <= this.lastReadTime) {
        console.log('✅ Using cached GFH data');
        return this.cachedData;
      }

      // Read the Excel file
      const workbook = XLSX.readFile(this.gfhFilePath);
      const sheetNames = workbook.SheetNames;
      console.log('📋 Found sheets:', sheetNames);

      const allData = {};
      let totalRecords = 0;

      // Parse all sheets
      for (const sheetName of sheetNames) {
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
          header: 1,
          defval: '',
          blankrows: false
        });

        if (jsonData.length > 0) {
          // First row is headers
          const headers = jsonData[0];
          const rows = jsonData.slice(1).filter(row => row.some(cell => cell !== ''));

          const sheetData = rows.map(row => {
            const record = {};
            headers.forEach((header, index) => {
              if (header) {
                record[header.toString().trim()] = row[index] || '';
              }
            });
            return record;
          });

          allData[sheetName] = {
            headers,
            records: sheetData,
            count: sheetData.length
          };
          
          totalRecords += sheetData.length;
          console.log(`📄 Sheet "${sheetName}": ${sheetData.length} records`);
        }
      }

      // Cache the data
      this.cachedData = {
        sheets: allData,
        totalRecords,
        readTime: new Date(),
        filePath: this.gfhFilePath,
        fileStats: {
          size: stats.size,
          modified: stats.mtime,
          sizeFormatted: `${(stats.size / 1024).toFixed(2)} KB`
        }
      };
      this.lastReadTime = stats.mtime;

      console.log(`✅ Successfully read GFH file: ${totalRecords} total records across ${sheetNames.length} sheets`);
      return this.cachedData;

    } catch (error) {
      console.error('❌ Error reading GFH file:', error);
      throw new Error(`Failed to read GFH file: ${error.message}`);
    }
  }

  /**
   * Analyze user's campaign question against GFH data using Ollama AI
   */
  async analyzeWithOllama(userQuestion, campaignContext = {}) {
    try {
      console.log('🤖 Starting Ollama analysis for:', userQuestion);
      
      // Read the complete GFH data
      const gfhData = await this.readGFHFile();
      
      // Prepare comprehensive data summary for AI
      const dataSummary = this.prepareDataSummary(gfhData);
      const relevantRecords = this.extractRelevantRecords(gfhData, userQuestion, campaignContext);

      // Calculate accuracy factors
      const accuracyFactors = this.calculateAccuracyFactors(gfhData, relevantRecords, userQuestion);

      // Create comprehensive AI prompt
      const prompt = `You are an expert Campaign Performance Analyst with access to the complete GFH - Weekly Campaign Performance dataset. 

USER QUESTION: ${userQuestion}

CAMPAIGN CONTEXT:
${JSON.stringify(campaignContext, null, 2)}

COMPLETE GFH DATASET SUMMARY:
${dataSummary}

RELEVANT DATA RECORDS (${relevantRecords.length} records):
${JSON.stringify(relevantRecords, null, 2)}

ACCURACY CONTEXT:
- Total GFH records analyzed: ${gfhData.totalRecords}
- Relevant records found: ${relevantRecords.length}
- Data coverage: ${accuracyFactors.dataCoverage}%
- Data quality score: ${accuracyFactors.dataQuality}/10
- File last modified: ${gfhData.fileStats.modified}

INSTRUCTIONS:
1. Analyze the user's question using ALL available GFH data
2. Reference specific campaigns, dates, platforms, and performance metrics from the actual data
3. Provide quantitative insights with exact numbers from the GFH file
4. Compare performance across different periods, platforms, or markets when relevant
5. Calculate accuracy score based on data availability and confidence in analysis

Respond in JSON format:
{
  "answer": "Detailed analysis directly referencing GFH data with specific numbers and dates",
  "keyFindings": [
    {
      "finding": "Specific insight from GFH data",
      "evidence": "Exact data from GFH file supporting this finding",
      "dataSource": "Sheet name and record details"
    }
  ],
  "dataAnalysis": {
    "totalRecordsAnalyzed": ${gfhData.totalRecords},
    "relevantRecords": ${relevantRecords.length},
    "sheetsAnalyzed": [${Object.keys(gfhData.sheets).map(s => `"${s}"`).join(', ')}],
    "dateRange": "Date range of analyzed data",
    "platforms": ["List of platforms found in data"],
    "markets": ["List of markets found in data"]
  },
  "recommendations": [
    "Actionable recommendations based on GFH performance patterns"
  ],
  "accuracyScore": {
    "overall": 85,
    "explanation": "Detailed explanation of accuracy calculation",
    "factors": {
      "dataCoverage": ${accuracyFactors.dataCoverage},
      "dataQuality": ${accuracyFactors.dataQuality},
      "relevanceScore": 0,
      "confidence": 0
    }
  },
  "dataSource": {
    "fileName": "GFH - Weekly Campaign performance.xlsx",
    "fileSize": "${gfhData.fileStats.sizeFormatted}",
    "lastModified": "${gfhData.fileStats.modified}",
    "totalSheets": ${Object.keys(gfhData.sheets).length}
  }
}

CRITICAL: Base ALL insights on the actual GFH data provided. Reference specific numbers, dates, and campaigns from the file.`;

      // Get AI analysis
      const response = await this.ollama.chat({
        model: this.model,
        messages: [{ role: 'user', content: prompt }],
        stream: false
      });

      let aiAnalysis;
      try {
        aiAnalysis = JSON.parse(response.message.content);
      } catch (parseError) {
        console.error('Failed to parse Ollama response:', parseError);
        // Create fallback response
        aiAnalysis = {
          answer: response.message.content,
          keyFindings: [{
            finding: "AI response parsing failed",
            evidence: "Raw response available",
            dataSource: "System error"
          }],
          dataAnalysis: {
            totalRecordsAnalyzed: gfhData.totalRecords,
            relevantRecords: relevantRecords.length,
            sheetsAnalyzed: Object.keys(gfhData.sheets),
            dateRange: "Unable to parse",
            platforms: [],
            markets: []
          },
          recommendations: ["Review raw AI response"],
          accuracyScore: {
            overall: 30,
            explanation: "Response parsing failed - low accuracy",
            factors: accuracyFactors
          },
          dataSource: {
            fileName: "GFH - Weekly Campaign performance.xlsx",
            fileSize: gfhData.fileStats.sizeFormatted,
            lastModified: gfhData.fileStats.modified,
            totalSheets: Object.keys(gfhData.sheets).length
          }
        };
      }

      console.log(`✅ Ollama analysis completed with ${aiAnalysis.accuracyScore?.overall || 0}% accuracy`);
      return aiAnalysis;

    } catch (error) {
      console.error('❌ Ollama analysis error:', error);
      
      // Return error response with fallback data
      const gfhData = await this.readGFHFile().catch(() => ({ totalRecords: 0, fileStats: {} }));
      
      return {
        answer: `Analysis failed: ${error.message}. Ensure Ollama is running on localhost:11434 with the mistral model.`,
        keyFindings: [{
          finding: "AI service unavailable",
          evidence: `Error: ${error.message}`,
          dataSource: "System error"
        }],
        dataAnalysis: {
          totalRecordsAnalyzed: gfhData.totalRecords || 0,
          relevantRecords: 0,
          sheetsAnalyzed: [],
          dateRange: "Unavailable",
          platforms: [],
          markets: []
        },
        recommendations: [
          "Start Ollama service: 'ollama serve'",
          "Install mistral model: 'ollama pull mistral'",
          "Verify GFH Excel file exists and is readable"
        ],
        accuracyScore: {
          overall: 0,
          explanation: "AI service unavailable - cannot provide accurate analysis",
          factors: {
            dataCoverage: 0,
            dataQuality: 0,
            relevanceScore: 0,
            confidence: 0
          }
        },
        dataSource: {
          fileName: "GFH - Weekly Campaign performance.xlsx",
          fileSize: gfhData.fileStats?.sizeFormatted || "Unknown",
          lastModified: gfhData.fileStats?.modified || "Unknown",
          totalSheets: 0
        }
      };
    }
  }

  /**
   * Prepare comprehensive data summary for AI analysis
   */
  prepareDataSummary(gfhData) {
    const summary = {
      file: {
        name: "GFH - Weekly Campaign performance.xlsx",
        totalRecords: gfhData.totalRecords,
        totalSheets: Object.keys(gfhData.sheets).length,
        readTime: gfhData.readTime,
        fileSize: gfhData.fileStats.sizeFormatted
      },
      sheets: {}
    };

    // Analyze each sheet
    for (const [sheetName, sheetData] of Object.entries(gfhData.sheets)) {
      const records = sheetData.records;
      
      summary.sheets[sheetName] = {
        recordCount: records.length,
        columns: sheetData.headers,
        columnCount: sheetData.headers.length,
        sampleRecord: records[0] || {},
        uniqueValues: this.getUniqueValues(records, sheetData.headers.slice(0, 5)) // First 5 columns
      };
    }

    return JSON.stringify(summary, null, 2);
  }

  /**
   * Extract records relevant to the user's question
   */
  extractRelevantRecords(gfhData, userQuestion, campaignContext) {
    const allRecords = [];
    
    // Collect all records from all sheets
    for (const [sheetName, sheetData] of Object.entries(gfhData.sheets)) {
      const recordsWithSheet = sheetData.records.map(record => ({
        ...record,
        _sheetName: sheetName
      }));
      allRecords.push(...recordsWithSheet);
    }

    // Keywords to search for
    const questionKeywords = this.extractKeywords(userQuestion);
    const contextKeywords = this.extractKeywords(JSON.stringify(campaignContext));
    const allKeywords = [...questionKeywords, ...contextKeywords];

    console.log('🔍 Searching for keywords:', allKeywords);

    // Score and filter relevant records
    const scoredRecords = allRecords.map(record => {
      let relevanceScore = 0;
      const recordText = JSON.stringify(record).toLowerCase();
      
      // Score based on keyword matches
      allKeywords.forEach(keyword => {
        const keywordLower = keyword.toLowerCase();
        if (recordText.includes(keywordLower)) {
          relevanceScore += 1;
        }
      });

      return {
        record,
        relevanceScore
      };
    });

    // Sort by relevance and return top records
    const relevant = scoredRecords
      .filter(item => item.relevanceScore > 0)
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, 50) // Limit to top 50 most relevant records
      .map(item => item.record);

    console.log(`📊 Found ${relevant.length} relevant records out of ${allRecords.length} total`);
    return relevant;
  }

  /**
   * Calculate accuracy factors for the analysis
   */
  calculateAccuracyFactors(gfhData, relevantRecords, userQuestion) {
    const totalRecords = gfhData.totalRecords;
    const relevantCount = relevantRecords.length;
    
    // Data coverage: percentage of total data that's relevant
    const dataCoverage = totalRecords > 0 ? Math.round((relevantCount / totalRecords) * 100) : 0;
    
    // Data quality: based on completeness of records
    let qualityScore = 0;
    if (relevantRecords.length > 0) {
      const avgCompleteness = relevantRecords.reduce((sum, record) => {
        const filledFields = Object.values(record).filter(value => 
          value !== null && value !== undefined && value !== ''
        ).length;
        const totalFields = Object.keys(record).length;
        return sum + (filledFields / totalFields);
      }, 0) / relevantRecords.length;
      
      qualityScore = Math.round(avgCompleteness * 10);
    }

    return {
      dataCoverage,
      dataQuality: qualityScore,
      totalRecords,
      relevantRecords: relevantCount
    };
  }

  /**
   * Extract keywords from text
   */
  extractKeywords(text) {
    const commonWords = ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'what', 'how', 'when', 'where', 'why', 'who'];
    
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2 && !commonWords.includes(word))
      .filter((word, index, arr) => arr.indexOf(word) === index) // Remove duplicates
      .slice(0, 20); // Limit to 20 keywords
  }

  /**
   * Get unique values for specified columns
   */
  getUniqueValues(records, columns) {
    const uniqueValues = {};
    
    columns.forEach(column => {
      if (column) {
        const values = records
          .map(record => record[column])
          .filter(value => value !== null && value !== undefined && value !== '')
          .filter((value, index, arr) => arr.indexOf(value) === index)
          .slice(0, 10); // Limit to 10 unique values per column
        
        uniqueValues[column] = values;
      }
    });

    return uniqueValues;
  }

  /**
   * Get basic file info without full analysis
   */
  async getFileInfo() {
    try {
      if (!fs.existsSync(this.gfhFilePath)) {
        throw new Error('GFH file not found');
      }

      const stats = fs.statSync(this.gfhFilePath);
      const workbook = XLSX.readFile(this.gfhFilePath);
      
      return {
        exists: true,
        path: this.gfhFilePath,
        size: stats.size,
        sizeFormatted: `${(stats.size / 1024).toFixed(2)} KB`,
        modified: stats.mtime,
        sheets: workbook.SheetNames,
        sheetCount: workbook.SheetNames.length
      };
    } catch (error) {
      return {
        exists: false,
        error: error.message
      };
    }
  }
}

module.exports = GFHFileAnalyzer;