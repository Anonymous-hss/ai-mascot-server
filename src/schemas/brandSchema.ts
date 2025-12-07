import { z } from "zod";

/**
 * Enhanced Brand Audit Schema
 * Comprehensive brand analysis with competitive insights and confidence scoring
 */
export const BrandAuditSchema = z.object({
  // Core Brand Identity
  brandVoice: z.string()
    .describe("The identified voice and tone of the brand (e.g., 'Professional and authoritative', 'Friendly and approachable')")
    .optional(),
  
  targetAudience: z.string()
    .describe("Primary audience segments with demographics and psychographics")
    .optional(),
  
  brandPersonality: z.string()
    .describe("Brand personality traits and characteristics")
    .optional(),
  
  // Health Metrics
  healthScore: z.number()
    .min(0)
    .max(100)
    .describe("Overall brand health score (0-100) based on market presence, consistency, and engagement")
    .optional(),
  
  sentiment: z.enum(["Positive", "Neutral", "Negative", "Mixed"])
    .describe("Overall brand sentiment in the market")
    .optional(),
  
  // SWOT Analysis
  strengths: z.array(z.string())
    .describe("Key brand strengths and competitive advantages")
    .optional(),
  
  weaknesses: z.array(z.string())
    .describe("Areas of improvement and current limitations")
    .optional(),
  
  opportunities: z.array(z.string())
    .describe("Market opportunities and growth potential")
    .optional(),
  
  threats: z.array(z.string())
    .describe("Competitive threats and market challenges")
    .optional(),
  
  // Strategic Recommendations
  recommendations: z.array(z.object({
    priority: z.enum(["High", "Medium", "Low"]).describe("Priority level"),
    category: z.string().describe("Category (e.g., 'Content Strategy', 'Brand Positioning')"),
    action: z.string().describe("Specific recommended action"),
    expectedImpact: z.string().describe("Expected business impact"),
    timeline: z.string().describe("Suggested implementation timeline")
  }))
    .describe("Prioritized strategic recommendations")
    .optional(),
  
  // Competitive Analysis
  competitivePosition: z.object({
    marketPosition: z.enum(["Leader", "Challenger", "Follower", "Niche"]).describe("Market position"),
    differentiators: z.array(z.string()).describe("Key differentiators from competitors"),
    competitiveGaps: z.array(z.string()).describe("Gaps compared to competitors")
  })
    .describe("Competitive positioning analysis")
    .optional(),
  
  // Confidence Scoring
  confidence: z.object({
    overall: z.number().min(0).max(1).describe("Overall confidence in analysis (0-1)"),
    dataQuality: z.enum(["High", "Medium", "Low"]).describe("Quality of available data"),
    assumptions: z.array(z.string()).describe("Key assumptions made in analysis")
  })
    .describe("Confidence metrics for the audit")
    .optional()
});

export type BrandAudit = z.infer<typeof BrandAuditSchema>;
