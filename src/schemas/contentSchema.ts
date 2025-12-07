import { z } from "zod";

/**
 * Enhanced Content Calendar Schema
 * Detailed content planning with performance predictions and A/B testing suggestions
 */
export const ContentCalendarSchema = z.object({
  // Calendar Metadata
  month: z.string()
    .describe("The month for this calendar (e.g., 'January 2024')"),
  
  theme: z.string()
    .describe("Overall content theme for the month")
    .optional(),
  
  objectives: z.array(z.string())
    .describe("Content objectives for this period")
    .optional(),
  
  // Content Posts
  posts: z.array(z.object({
    // Basic Info
    date: z.string().describe("Date of the post (YYYY-MM-DD)"),
    platform: z.enum(["LinkedIn", "Twitter", "Instagram", "Facebook", "TikTok", "Blog", "YouTube", "Email"])
      .describe("Platform for the post"),
    
    // Content Details
    topic: z.string().describe("Topic or theme of the post"),
    contentType: z.enum(["Educational", "Promotional", "Engagement", "Thought Leadership", "User Generated", "Behind the Scenes"])
      .describe("Type of content"),
    
    content: z.string().describe("The actual post content/caption"),
    
    // Media & Assets
    mediaType: z.enum(["Image", "Video", "Carousel", "Text Only", "Infographic", "Story"])
      .describe("Type of media to use")
      .optional(),
    
    visualGuidelines: z.string()
      .describe("Guidelines for visual content creation")
      .optional(),
    
    // Optimization
    hashtags: z.array(z.string()).describe("Relevant hashtags"),
    
    callToAction: z.string()
      .describe("Clear call-to-action for the post")
      .optional(),
    
    targetAudience: z.string()
      .describe("Specific audience segment for this post")
      .optional(),
    
    // Performance Predictions
    expectedEngagement: z.enum(["High", "Medium", "Low"])
      .describe("Predicted engagement level based on content type and timing")
      .optional(),
    
    bestTimeToPost: z.string()
      .describe("Optimal posting time based on audience activity")
      .optional(),
    
    // A/B Testing
    abTestSuggestion: z.object({
      variantA: z.string().describe("First variant to test"),
      variantB: z.string().describe("Second variant to test"),
      testMetric: z.string().describe("Metric to measure (e.g., 'Click-through rate', 'Engagement rate')")
    })
      .describe("A/B testing suggestion for this post")
      .optional()
  }))
    .describe("List of scheduled posts"),
  
  // Content Themes & Pillars
  contentPillars: z.array(z.object({
    pillar: z.string().describe("Content pillar name"),
    description: z.string().describe("Pillar description"),
    postCount: z.number().describe("Number of posts in this pillar")
  }))
    .describe("Content pillars distribution for the month")
    .optional(),
  
  // Performance Tracking
  successMetrics: z.array(z.string())
    .describe("Key metrics to track for this content calendar")
    .optional()
});

export type ContentCalendar = z.infer<typeof ContentCalendarSchema>;
