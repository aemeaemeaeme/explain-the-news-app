import { api } from "encore.dev/api";
import { extractArticle } from "./robust_extractor";
import { analyzeWithLLM } from "./llm_router";

// Test domain set as specified in requirements
const TEST_DOMAINS = [
  "https://www.reuters.com/world/us/biden-executive-order-aims-boost-chip-production-2024-01-15/",
  "https://apnews.com/article/climate-change-united-nations-cop28-fossil-fuels-1234567890ab",
  "https://www.bbc.com/news/world-us-canada-67890123",
  "https://edition.cnn.com/2024/01/15/politics/congress-voting-rights/index.html",
  "https://www.politico.com/news/2024/01/15/infrastructure-spending-analysis-00123456",
  "https://www.npr.org/2024/01/15/1234567890/economic-policy-federal-reserve"
];

interface TestResult {
  url: string;
  domain: string;
  status: "full" | "limited" | "error";
  method: string;
  confidence: string;
  textLength: number;
  analysisProvider?: string;
  errors: string[];
  success: boolean;
}

export const testDomains = api(
  { expose: true, method: "GET", path: "/test/domains" },
  async (): Promise<{ results: TestResult[]; summary: { full: number; limited: number; error: number; successRate: number } }> => {
    console.log("🧪 Starting domain test set validation");
    
    const results: TestResult[] = [];
    
    for (const url of TEST_DOMAINS) {
      console.log(`\n🔍 Testing: ${url}`);
      
      const domain = new URL(url).hostname;
      let result: TestResult = {
        url,
        domain,
        status: "error",
        method: "none",
        confidence: "low",
        textLength: 0,
        errors: [],
        success: false
      };

      try {
        // Test extraction
        const extractionResult = await extractArticle(url);
        
        result.status = extractionResult.status;
        result.method = extractionResult.extractionMethod;
        result.confidence = extractionResult.confidence;
        result.textLength = extractionResult.text.length;
        result.errors = extractionResult.errors;
        
        console.log(`📊 Extraction: ${extractionResult.status} | Method: ${extractionResult.extractionMethod} | Length: ${extractionResult.text.length}`);

        // Test LLM analysis only if extraction was successful
        if (extractionResult.status !== "error" && extractionResult.text.length > 50) {
          try {
            const analysisResult = await analyzeWithLLM(
              extractionResult.text, 
              url, 
              extractionResult.title, 
              extractionResult.status === "limited"
            );
            
            result.analysisProvider = analysisResult.meta.provider;
            result.success = analysisResult.meta.status !== "error";
            
            console.log(`🤖 Analysis: ${analysisResult.meta.provider} | Status: ${analysisResult.meta.status}`);
          } catch (analysisError) {
            console.log(`❌ Analysis failed: ${analysisError}`);
            result.errors.push(`Analysis failed: ${analysisError}`);
          }
        } else {
          result.success = extractionResult.status === "limited"; // Limited is still a success
        }

      } catch (error: any) {
        console.log(`💥 Test failed: ${error.message}`);
        result.errors.push(error.message || String(error));
      }

      results.push(result);
      
      console.log(`✅ Result: ${result.success ? 'SUCCESS' : 'FAILED'} | Status: ${result.status}`);
    }

    // Calculate summary
    const summary = {
      full: results.filter(r => r.status === "full").length,
      limited: results.filter(r => r.status === "limited").length,
      error: results.filter(r => r.status === "error").length,
      successRate: Math.round((results.filter(r => r.success).length / results.length) * 100)
    };

    console.log(`\n📊 Test Summary:`);
    console.log(`  Full analyses: ${summary.full}/${results.length}`);
    console.log(`  Limited analyses: ${summary.limited}/${results.length}`);
    console.log(`  Errors: ${summary.error}/${results.length}`);
    console.log(`  Success rate: ${summary.successRate}%`);

    return { results, summary };
  }
);

// Individual domain test
export const testSingleDomain = api<{ url: string }, TestResult>(
  { expose: true, method: "POST", path: "/test/domain" },
  async ({ url }) => {
    console.log(`🧪 Testing single domain: ${url}`);
    
    const domain = new URL(url).hostname;
    let result: TestResult = {
      url,
      domain,
      status: "error",
      method: "none",
      confidence: "low",
      textLength: 0,
      errors: [],
      success: false
    };

    try {
      const extractionResult = await extractArticle(url);
      
      result.status = extractionResult.status;
      result.method = extractionResult.extractionMethod;
      result.confidence = extractionResult.confidence;
      result.textLength = extractionResult.text.length;
      result.errors = extractionResult.errors;

      if (extractionResult.status !== "error" && extractionResult.text.length > 50) {
        try {
          const analysisResult = await analyzeWithLLM(
            extractionResult.text, 
            url, 
            extractionResult.title, 
            extractionResult.status === "limited"
          );
          
          result.analysisProvider = analysisResult.meta.provider;
          result.success = analysisResult.meta.status !== "error";
        } catch (analysisError) {
          result.errors.push(`Analysis failed: ${analysisError}`);
        }
      } else {
        result.success = extractionResult.status === "limited";
      }

    } catch (error: any) {
      result.errors.push(error.message || String(error));
    }

    return result;
  }
);