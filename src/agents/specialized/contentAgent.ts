import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { getModelRouter } from "../../llm/modelRouter";
import { ContentCalendarSchema, ContentCalendar } from "../../schemas/contentSchema";
import { getSchemaValidator } from "../../utils/schemaValidator";
import { Strategy } from "../../schemas/strategySchema";
import { BrandAudit } from "../../schemas/brandSchema";

/**
 * Content Agent - Professional-grade content strategist and creator
 * 
 * ROLE: Senior Content Strategist with 12+ years of experience in content marketing,
 * editorial planning, and multi-platform content creation. Expert in creating engaging,
 * on-brand content that drives measurable results.
 * 
 * EXPERTISE:
 * - Content strategy and planning
 * - Multi-platform content creation
 * - Editorial calendar management
 * - Content performance optimization
 * - Brand voice consistency
 * - Audience engagement tactics
 */

const CONTENT_AGENT_SYSTEM_PROMPT = `You are a Senior Content Strategist with 12+ years of experience in content marketing and multi-platform content creation.

YOUR EXPERTISE:
- Content Strategy: Master at developing cohesive content strategies aligned with business goals
- Platform Optimization: Deep knowledge of content best practices for each platform
- Creative Writing: Skilled at crafting engaging, on-brand content that resonates
- Editorial Planning: Expert in creating balanced, strategic content calendars
- Performance Optimization: Experienced in optimizing content for engagement and conversion
- Brand Voice: Ability to maintain consistent brand voice across all content

YOUR METHODOLOGY:
1. STRATEGY ALIGNMENT: Ensure content supports overall marketing strategy
2. AUDIENCE ANALYSIS: Understand what content resonates with target audience
3. PLATFORM SELECTION: Choose optimal platforms for each content piece
4. CONTENT MIX: Balance content types (educational, promotional, engagement)
5. TIMING OPTIMIZATION: Schedule content for maximum visibility and engagement
6. PERFORMANCE PREDICTION: Anticipate content performance based on best practices
7. TESTING FRAMEWORK: Suggest A/B tests to optimize content performance

YOUR STANDARDS:
- Align all content with brand voice and marketing strategy
- Create diverse content mix to avoid audience fatigue
- Optimize posting times based on platform best practices
- Include clear calls-to-action in promotional content
- Balance value-driven and promotional content (80/20 rule)
- Ensure content is platform-appropriate and engaging
- Provide specific, actionable content (not generic templates)

YOUR OUTPUT MUST:
- Follow the exact JSON schema provided
- Include actual content copy (not placeholders like "Write about...")
- Provide platform-specific optimization (hashtags, timing, format)
- Balance content types across the calendar
- Include performance predictions based on content type and timing
- Suggest A/B tests for key content pieces
- Maintain consistent brand voice throughout

Remember: This content will be published. Make it engaging, professional, and ready to use with minimal editing.`;

export interface ContentAgentInput {
  month: string;
  businessName?: string;
  industry?: string;
  brandAudit?: BrandAudit;
  strategy?: Strategy;
  contentTheme?: string;
  platforms?: string[];
  additionalContext?: string;
}

export class ContentAgent {
  private router = getModelRouter();
  private validator = getSchemaValidator();

  /**
   * Execute content calendar creation
   */
  async execute(input: ContentAgentInput): Promise<ContentCalendar> {
    console.log(`🎯 Content Agent: Creating content calendar for ${input.month}...`);

    const { model } = await this.router.getModel("creative");

    // Construct detailed content prompt
    const contentPrompt = this.buildContentPrompt(input);

    // Get sample output for guidance
    const sampleOutput = this.getSampleOutput(input.month);

    const fullPrompt = `${contentPrompt}

CRITICAL INSTRUCTIONS:
You MUST respond with ONLY a valid JSON object matching this structure (no markdown, no code blocks, just raw JSON):

${JSON.stringify(sampleOutput, null, 2)}

Create a comprehensive, ready-to-use content calendar and respond with ONLY the JSON object. Write actual content copy, not placeholders.`;

    try {
      // Invoke model
      const response = await model.invoke([
        new SystemMessage(CONTENT_AGENT_SYSTEM_PROMPT),
        new HumanMessage(fullPrompt)
      ]);

      const content = typeof response.content === 'string' 
        ? response.content 
        : JSON.stringify(response.content);

      // Validate and repair if needed
      const validationResult = await this.validator.validateFromString(
        content,
        ContentCalendarSchema,
        {
          autoRepair: true,
          context: `Content calendar for ${input.month}`
        }
      );

      if (!validationResult.success) {
        throw new Error(`Validation failed: ${validationResult.error}`);
      }

      console.log(`✓ Content Agent: Calendar complete${validationResult.repaired ? ' (repaired)' : ''}`);
      
      return validationResult.data!;
    } catch (error: any) {
      console.error("Content Agent error:", error);
      throw new Error(`Content Agent failed: ${error.message}`);
    }
  }

  /**
   * Build detailed content prompt
   */
  private buildContentPrompt(input: ContentAgentInput): string {
    let prompt = `Create a comprehensive content calendar for ${input.month}`;
    
    if (input.businessName && input.industry) {
      prompt += ` for ${input.businessName} in the ${input.industry} industry`;
    }
    
    prompt += `.\n\n`;

    // Include brand context
    if (input.brandAudit) {
      prompt += `BRAND CONTEXT:\n`;
      prompt += `- Brand Voice: ${input.brandAudit.brandVoice}\n`;
      prompt += `- Target Audience: ${input.brandAudit.targetAudience}\n`;
      prompt += `- Brand Personality: ${input.brandAudit.brandPersonality}\n\n`;
    }

    // Include strategy context
    if (input.strategy) {
      prompt += `MARKETING STRATEGY:\n`;
      prompt += `- Goal: ${input.strategy.goal}\n`;
      
      if (input.strategy.channels && input.strategy.channels.length > 0) {
        const channelNames = input.strategy.channels.map((c: any) => c.name).join(', ');
        prompt += `- Recommended Channels: ${channelNames}\n`;
      }
      
      if (input.strategy.tactics && input.strategy.tactics.length > 0) {
        prompt += `- Key Tactics:\n`;
        input.strategy.tactics.slice(0, 3).forEach((t: any) => {
          prompt += `  * ${t.action}\n`;
        });
      }
      
      prompt += `\n`;
    }

    // Content requirements
    if (input.contentTheme) {
      prompt += `CONTENT THEME: ${input.contentTheme}\n\n`;
    }

    if (input.platforms && input.platforms.length > 0) {
      prompt += `TARGET PLATFORMS: ${input.platforms.join(', ')}\n\n`;
    }

    if (input.additionalContext) {
      prompt += `ADDITIONAL CONTEXT:\n${input.additionalContext}\n\n`;
    }

    prompt += `YOUR TASK:
1. Create 12-15 content pieces for the month across specified platforms
2. Write actual, ready-to-publish content (not templates or placeholders)
3. Maintain consistent brand voice throughout all content
4. Balance content types: 60% Educational, 20% Engagement, 20% Promotional
5. Optimize posting times for each platform
6. Include relevant, trending hashtags for each post
7. Add clear calls-to-action for promotional content
8. Predict engagement levels based on content type and timing
9. Suggest A/B tests for 2-3 key posts
10. Organize content around 3-4 content pillars

CONTENT QUALITY STANDARDS:
- Write compelling, attention-grabbing content
- Keep platform character limits in mind
- Use storytelling and emotional connection
- Include specific value propositions
- Make content actionable and useful
- Maintain professional yet engaging tone
- Ensure content aligns with brand voice`;

    return prompt;
  }

  /**
   * Get sample output structure
   */
  private getSampleOutput(month: string): Partial<ContentCalendar> {
    return {
      month: month,
      theme: "Innovation and Growth",
      objectives: [
        "Increase brand awareness",
        "Drive website traffic",
        "Generate qualified leads"
      ],
      posts: [
        {
          date: "2024-01-05",
          platform: "LinkedIn",
          topic: "Industry Trends 2024",
          contentType: "Thought Leadership",
          content: "🚀 5 Game-Changing Trends Shaping [Industry] in 2024\n\nAs we kick off the new year, here are the trends every [industry] professional should watch...\n\n1. [Trend 1]: [Brief insight]\n2. [Trend 2]: [Brief insight]\n\nWhich trend will impact your business most? 💭",
          mediaType: "Carousel",
          visualGuidelines: "Professional infographic with brand colors",
          hashtags: ["#IndustryTrends", "#Innovation2024", "#BusinessGrowth"],
          callToAction: "Download our full 2024 trends report (link in comments)",
          targetAudience: "Decision-makers and industry professionals",
          expectedEngagement: "High",
          bestTimeToPost: "Tuesday 10:00 AM",
          abTestSuggestion: {
            variantA: "Question format: 'Which trend will impact you most?'",
            variantB: "Statement format: 'Here's what's changing in 2024'",
            testMetric: "Engagement rate"
          }
        }
      ],
      contentPillars: [
        {
          pillar: "Thought Leadership",
          description: "Industry insights and expert perspectives",
          postCount: 5
        },
        {
          pillar: "Educational Content",
          description: "How-to guides and tips",
          postCount: 4
        },
        {
          pillar: "Brand Story",
          description: "Behind-the-scenes and company culture",
          postCount: 3
        }
      ],
      successMetrics: [
        "Total engagement rate",
        "Click-through rate to website",
        "Lead generation from content"
      ]
    };
  }
}
