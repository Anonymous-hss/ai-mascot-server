import { z } from "zod";

export const BrandAuditSchema = z.object({
  brandVoice: z.string().describe("The identified voice of the brand.").optional(),
  targetAudience: z.string().describe("The primary audience segments.").optional(),
  healthScore: z.number().min(0).max(100).describe("Brand health score (0-100).").optional(),
  sentiment: z.enum(["Positive", "Neutral", "Negative"]).describe("Brand sentiment.").optional(),
  strengths: z.array(z.string()).describe("Brand strengths.").optional(),
  weaknesses: z.array(z.string()).describe("Brand weaknesses.").optional(),
  opportunities: z.array(z.string()).describe("Market opportunities.").optional(),
  recommendations: z.array(z.string()).describe("Strategic recommendations.").optional(),
});

export const ContentCalendarSchema = z.object({
  month: z.string().describe("The month for this calendar."),
  posts: z.array(
    z.object({
      date: z.string().describe("Date of the post (YYYY-MM-DD)."),
      platform: z.enum(["LinkedIn", "Twitter", "Instagram", "Blog"]).describe("Platform for the post."),
      topic: z.string().describe("Topic or theme of the post."),
      content: z.string().describe("The actual post content/caption."),
      hashtags: z.array(z.string()).describe("Relevant hashtags."),
    })
  ).describe("List of scheduled posts."),
});

export const StrategySchema = z.object({
  goal: z.string().describe("The primary marketing goal."),
  channels: z.array(z.string()).describe("Recommended channels."),
  tactics: z.array(z.string()).describe("Specific tactics to achieve the goal."),
  kpis: z.array(z.string()).describe("Key Performance Indicators to track."),
  timeline: z.string().describe("Estimated timeline for execution."),
});

export const CampaignSchema = z.object({
  campaignName: z.string().describe("Name of the campaign."),
  tagline: z.string().describe("Catchy tagline."),
  keyMessage: z.string().describe("Core message to convey."),
  adCopy: z.array(z.string()).describe("Draft ad copies for different formats."),
  budgetAllocation: z.record(z.string(), z.string()).describe("Suggested budget split (e.g., {'Ads': '50%', 'Influencers': '30%'})."),
});
