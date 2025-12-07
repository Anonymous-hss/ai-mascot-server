import { z } from "zod";

/**
 * Enhanced Campaign Schema
 * Comprehensive campaign design with audience segmentation and conversion funnel
 */
export const CampaignSchema = z.object({
  // Campaign Identity
  campaignName: z.string()
    .describe("Name of the campaign"),
  
  tagline: z.string()
    .describe("Catchy, memorable tagline"),
  
  keyMessage: z.string()
    .describe("Core message to convey"),
  
  campaignObjective: z.enum(["Brand Awareness", "Lead Generation", "Sales Conversion", "Customer Retention", "Product Launch"])
    .describe("Primary campaign objective")
    .optional(),
  
  // Creative Elements
  adCopy: z.array(z.object({
    format: z.string().describe("Ad format (e.g., 'Social Media Post', 'Google Ad', 'Email Subject')"),
    copy: z.string().describe("The actual ad copy"),
    variation: z.string().describe("Variation identifier (e.g., 'A', 'B', 'C')").optional()
  }))
    .describe("Draft ad copies for different formats"),
  
  visualConcept: z.string()
    .describe("Description of visual concept and design direction")
    .optional(),
  
  // Audience Segmentation
  audienceSegments: z.array(z.object({
    segment: z.string().describe("Audience segment name"),
    demographics: z.string().describe("Demographic characteristics"),
    psychographics: z.string().describe("Psychographic characteristics"),
    messaging: z.string().describe("Tailored messaging for this segment"),
    channels: z.array(z.string()).describe("Best channels to reach this segment")
  }))
    .describe("Detailed audience segmentation strategy")
    .optional(),
  
  // Budget Allocation
  budgetAllocation: z.record(z.string(), z.string())
    .describe("Suggested budget split (e.g., {'Paid Ads': '50%', 'Influencers': '30%', 'Content': '20%'})"),
  
  // Conversion Funnel
  conversionFunnel: z.object({
    awareness: z.object({
      tactics: z.array(z.string()).describe("Awareness stage tactics"),
      metrics: z.array(z.string()).describe("Metrics to track")
    }).describe("Top of funnel - Awareness"),
    
    consideration: z.object({
      tactics: z.array(z.string()).describe("Consideration stage tactics"),
      metrics: z.array(z.string()).describe("Metrics to track")
    }).describe("Middle of funnel - Consideration"),
    
    conversion: z.object({
      tactics: z.array(z.string()).describe("Conversion stage tactics"),
      metrics: z.array(z.string()).describe("Metrics to track")
    }).describe("Bottom of funnel - Conversion"),
    
    retention: z.object({
      tactics: z.array(z.string()).describe("Retention tactics"),
      metrics: z.array(z.string()).describe("Metrics to track")
    }).describe("Post-conversion - Retention").optional()
  })
    .describe("Complete conversion funnel strategy")
    .optional(),
  
  // Timeline
  duration: z.string()
    .describe("Campaign duration")
    .optional(),
  
  phases: z.array(z.object({
    phase: z.string().describe("Phase name (e.g., 'Teaser', 'Launch', 'Sustain')"),
    duration: z.string().describe("Phase duration"),
    activities: z.array(z.string()).describe("Key activities in this phase")
  }))
    .describe("Campaign phases")
    .optional(),
  
  // Success Metrics
  kpis: z.array(z.object({
    metric: z.string().describe("KPI name"),
    target: z.string().describe("Target value"),
    measurement: z.string().describe("How to measure")
  }))
    .describe("Campaign KPIs")
    .optional()
});

export type Campaign = z.infer<typeof CampaignSchema>;
