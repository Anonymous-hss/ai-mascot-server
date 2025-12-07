import { z } from "zod";

/**
 * Competitive Research Schema
 * Comprehensive competitor analysis and market research
 */
export const ResearchSchema = z.object({
  // Research Metadata
  researchDate: z.string()
    .describe("Date of research (YYYY-MM-DD)"),
  
  industry: z.string()
    .describe("Industry being researched"),
  
  // Competitor Analysis
  competitors: z.array(z.object({
    name: z.string().describe("Competitor name"),
    website: z.string().describe("Competitor website").optional(),
    
    // Market Position
    marketPosition: z.enum(["Leader", "Challenger", "Follower", "Niche"])
      .describe("Market position"),
    
    estimatedMarketShare: z.string()
      .describe("Estimated market share percentage or range")
      .optional(),
    
    // Strengths & Weaknesses
    strengths: z.array(z.string()).describe("Key strengths"),
    weaknesses: z.array(z.string()).describe("Key weaknesses"),
    
    // Strategy Insights
    marketingStrategy: z.string()
      .describe("Overview of their marketing strategy")
      .optional(),
    
    contentStrategy: z.string()
      .describe("Their content approach and themes")
      .optional(),
    
    pricingStrategy: z.string()
      .describe("Pricing model and positioning")
      .optional(),
    
    // Differentiation
    uniqueSellingPoints: z.array(z.string())
      .describe("Their unique selling points"),
    
    targetAudience: z.string()
      .describe("Their target audience")
      .optional()
  }))
    .describe("Detailed competitor profiles"),
  
  // Market Trends
  marketTrends: z.array(z.object({
    trend: z.string().describe("Trend name or description"),
    impact: z.enum(["High", "Medium", "Low"]).describe("Impact on industry"),
    opportunity: z.string().describe("How to leverage this trend"),
    timeline: z.string().describe("Expected timeline or current stage")
  }))
    .describe("Current market trends and opportunities")
    .optional(),
  
  // SWOT Analysis (for client vs. market)
  swotAnalysis: z.object({
    strengths: z.array(z.string()).describe("Client's strengths vs. competitors"),
    weaknesses: z.array(z.string()).describe("Client's weaknesses vs. competitors"),
    opportunities: z.array(z.string()).describe("Market opportunities"),
    threats: z.array(z.string()).describe("Market threats")
  })
    .describe("SWOT analysis in competitive context")
    .optional(),
  
  // Strategic Recommendations
  recommendations: z.array(z.object({
    category: z.string().describe("Recommendation category"),
    recommendation: z.string().describe("Specific recommendation"),
    rationale: z.string().describe("Why this is recommended"),
    priority: z.enum(["High", "Medium", "Low"]).describe("Priority level"),
    competitiveAdvantage: z.string().describe("How this creates competitive advantage")
  }))
    .describe("Strategic recommendations based on research"),
  
  // Market Gaps
  marketGaps: z.array(z.object({
    gap: z.string().describe("Identified market gap"),
    opportunity: z.string().describe("Opportunity this gap presents"),
    difficulty: z.enum(["High", "Medium", "Low"]).describe("Difficulty to exploit")
  }))
    .describe("Identified market gaps and opportunities")
    .optional(),
  
  // Data Sources
  sources: z.array(z.string())
    .describe("Data sources used for this research")
    .optional()
});

export type Research = z.infer<typeof ResearchSchema>;
