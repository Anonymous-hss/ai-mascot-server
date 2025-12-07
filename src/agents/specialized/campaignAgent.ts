import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { getModelRouter } from "../../llm/modelRouter";
import { CampaignSchema, Campaign } from "../../schemas/campaignSchema";
import { getSchemaValidator } from "../../utils/schemaValidator";
import { Strategy } from "../../schemas/strategySchema";
import { BrandAudit } from "../../schemas/brandSchema";

/**
 * Campaign Agent - Professional-grade campaign designer
 * 
 * ROLE: Creative Campaign Director with 15+ years of experience in designing
 * and executing integrated marketing campaigns. Expert in campaign concepting,
 * audience segmentation, and conversion funnel optimization.
 * 
 * EXPERTISE:
 * - Campaign concepting and creative development
 * - Audience segmentation and targeting
 * - Conversion funnel design
 * - Multi-channel campaign orchestration
 * - Performance measurement and optimization
 * - Budget allocation and ROI tracking
 */

const CAMPAIGN_AGENT_SYSTEM_PROMPT = `You are a Creative Campaign Director with 15+ years of experience in designing and executing integrated marketing campaigns.

YOUR EXPERTISE:
- Campaign Concepting: Master at developing compelling campaign concepts and narratives
- Creative Development: Skilled at crafting memorable taglines, messaging, and ad copy
- Audience Targeting: Expert in segmenting audiences and tailoring messaging
- Funnel Design: Experienced in designing complete conversion funnels
- Multi-Channel Orchestration: Ability to coordinate campaigns across multiple channels
- Performance Optimization: Data-driven approach to campaign measurement and optimization

YOUR METHODOLOGY:
1. CONCEPT DEVELOPMENT: Create a compelling campaign concept aligned with strategy
2. MESSAGING: Develop clear, memorable key messages and taglines
3. AUDIENCE SEGMENTATION: Identify and profile target audience segments
4. CREATIVE EXECUTION: Craft platform-specific ad copy and creative briefs
5. FUNNEL DESIGN: Map out complete customer journey from awareness to retention
6. BUDGET ALLOCATION: Optimize budget distribution across channels and tactics
7. MEASUREMENT PLAN: Define KPIs and success metrics for each funnel stage

YOUR STANDARDS:
- Create campaigns that are memorable and emotionally resonant
- Ensure messaging is clear, differentiated, and compelling
- Tailor messaging for each audience segment
- Design complete funnels, not just top-of-funnel tactics
- Allocate budget strategically for maximum ROI
- Define measurable success criteria
- Make campaigns actionable and executable

YOUR OUTPUT MUST:
- Follow the exact JSON schema provided
- Include creative, memorable campaign names and taglines
- Provide multiple ad copy variations for testing
- Detail specific audience segments with targeting criteria
- Map out complete conversion funnel with tactics for each stage
- Include realistic budget allocations
- Define clear KPIs for campaign success

Remember: This campaign will be executed with real budget. Make it creative, strategic, and results-driven.`;

export interface CampaignAgentInput {
  campaignName?: string;
  businessName?: string;
  industry?: string;
  brandAudit?: BrandAudit;
  strategy?: Strategy;
  campaignObjective?: string;
  budget?: string;
  duration?: string;
  additionalContext?: string;
}

export class CampaignAgent {
  private router = getModelRouter();
  private validator = getSchemaValidator();

  /**
   * Execute campaign design
   */
  async execute(input: CampaignAgentInput): Promise<Campaign> {
    console.log(`🎯 Campaign Agent: Designing campaign${input.campaignName ? ` "${input.campaignName}"` : ''}...`);

    const { model } = await this.router.getModel("creative");

    // Construct detailed campaign prompt
    const campaignPrompt = this.buildCampaignPrompt(input);

    // Get sample output for guidance
    const sampleOutput = this.getSampleOutput();

    const fullPrompt = `${campaignPrompt}

CRITICAL INSTRUCTIONS:
You MUST respond with ONLY a valid JSON object matching this structure (no markdown, no code blocks, just raw JSON):

${JSON.stringify(sampleOutput, null, 2)}

Design a comprehensive, creative campaign and respond with ONLY the JSON object.`;

    try {
      // Invoke model
      const response = await model.invoke([
        new SystemMessage(CAMPAIGN_AGENT_SYSTEM_PROMPT),
        new HumanMessage(fullPrompt)
      ]);

      const content = typeof response.content === 'string' 
        ? response.content 
        : JSON.stringify(response.content);

      // Validate and repair if needed
      const validationResult = await this.validator.validateFromString(
        content,
        CampaignSchema,
        {
          autoRepair: true,
          context: `Campaign design for ${input.campaignName || 'client'}`
        }
      );

      if (!validationResult.success) {
        throw new Error(`Validation failed: ${validationResult.error}`);
      }

      console.log(`✓ Campaign Agent: Campaign complete${validationResult.repaired ? ' (repaired)' : ''}`);
      
      return validationResult.data!;
    } catch (error: any) {
      console.error("Campaign Agent error:", error);
      throw new Error(`Campaign Agent failed: ${error.message}`);
    }
  }

  /**
   * Build detailed campaign prompt
   */
  private buildCampaignPrompt(input: CampaignAgentInput): string {
    let prompt = `Design a comprehensive marketing campaign`;
    
    if (input.campaignName) {
      prompt += ` named "${input.campaignName}"`;
    }
    
    if (input.businessName && input.industry) {
      prompt += ` for ${input.businessName} in the ${input.industry} industry`;
    }
    
    prompt += `.\n\n`;

    // Include brand context
    if (input.brandAudit) {
      prompt += `BRAND CONTEXT:\n`;
      prompt += `- Brand Voice: ${input.brandAudit.brandVoice}\n`;
      prompt += `- Target Audience: ${input.brandAudit.targetAudience}\n`;
      prompt += `- Brand Personality: ${input.brandAudit.brandPersonality}\n`;
      
      if (input.brandAudit.strengths && input.brandAudit.strengths.length > 0) {
        prompt += `- Key Differentiators: ${input.brandAudit.strengths.slice(0, 2).join(', ')}\n`;
      }
      
      prompt += `\n`;
    }

    // Include strategy context
    if (input.strategy) {
      prompt += `MARKETING STRATEGY:\n`;
      prompt += `- Goal: ${input.strategy.goal}\n`;
      
      if (input.strategy.channels && input.strategy.channels.length > 0) {
        const primaryChannels = input.strategy.channels
          .filter((c: any) => c.priority === "Primary")
          .map((c: any) => c.name)
          .join(', ');
        if (primaryChannels) {
          prompt += `- Primary Channels: ${primaryChannels}\n`;
        }
      }
      
      prompt += `\n`;
    }

    // Campaign parameters
    if (input.campaignObjective) {
      prompt += `CAMPAIGN OBJECTIVE: ${input.campaignObjective}\n\n`;
    }

    if (input.budget) {
      prompt += `BUDGET: ${input.budget}\n\n`;
    }

    if (input.duration) {
      prompt += `DURATION: ${input.duration}\n\n`;
    }

    if (input.additionalContext) {
      prompt += `ADDITIONAL CONTEXT:\n${input.additionalContext}\n\n`;
    }

    prompt += `YOUR TASK:
1. Create a memorable campaign name and catchy tagline
2. Define the core campaign message and key value proposition
3. Develop 3-5 ad copy variations for different formats (social, search, email)
4. Segment the target audience into 2-3 distinct groups with tailored messaging
5. Design a complete conversion funnel:
   - Awareness: How to attract attention
   - Consideration: How to nurture interest
   - Conversion: How to drive action
   - Retention: How to keep customers engaged
6. Allocate budget across channels and activities
7. Create a phased campaign timeline
8. Define success metrics and KPIs

CAMPAIGN QUALITY STANDARDS:
- Make the campaign concept creative and memorable
- Ensure messaging is clear and differentiated
- Write compelling ad copy that drives action
- Tailor messaging for each audience segment
- Design a complete funnel, not just awareness tactics
- Be realistic about budget and timeline
- Focus on measurable outcomes`;

    return prompt;
  }

  /**
   * Get sample output structure
   */
  private getSampleOutput(): Partial<Campaign> {
    return {
      campaignName: "Growth Accelerator 2024",
      tagline: "Transform Your Business, Accelerate Your Growth",
      keyMessage: "Unlock your business potential with innovative solutions designed for rapid, sustainable growth",
      campaignObjective: "Lead Generation",
      adCopy: [
        {
          format: "LinkedIn Sponsored Post",
          copy: "Ready to 10x your growth? 🚀 Discover how leading companies are transforming their business with [Product]. Limited spots available for our exclusive growth workshop. Register now →",
          variation: "A"
        },
        {
          format: "Google Search Ad",
          copy: "Accelerate Business Growth | Free Strategy Session | Proven Results for 500+ Companies | Get Started Today",
          variation: "B"
        }
      ],
      visualConcept: "Bold, modern design with upward growth arrows and vibrant gradient colors. Emphasize transformation and momentum.",
      audienceSegments: [
        {
          segment: "Growth-Stage Startups",
          demographics: "Founders/CEOs, 30-45 years old, Series A-B companies",
          psychographics: "Ambitious, data-driven, seeking scalable solutions",
          messaging: "Scale faster with proven growth frameworks used by unicorns",
          channels: ["LinkedIn", "Tech podcasts", "Startup communities"]
        }
      ],
      budgetAllocation: {
        "Paid Ads": "45%",
        "Content Marketing": "25%",
        "Events & Webinars": "20%",
        "Influencer Partnerships": "10%"
      },
      conversionFunnel: {
        awareness: {
          tactics: [
            "LinkedIn thought leadership content",
            "Targeted Google Ads",
            "Industry podcast sponsorships"
          ],
          metrics: ["Impressions", "Reach", "Brand awareness lift"]
        },
        consideration: {
          tactics: [
            "Free growth assessment tool",
            "Educational webinar series",
            "Case study content"
          ],
          metrics: ["Website visits", "Content downloads", "Webinar registrations"]
        },
        conversion: {
          tactics: [
            "Free strategy session offer",
            "Limited-time discount",
            "Personalized demo"
          ],
          metrics: ["Lead form submissions", "Demo requests", "Conversion rate"]
        },
        retention: {
          tactics: [
            "Onboarding email sequence",
            "Customer success check-ins",
            "Exclusive community access"
          ],
          metrics: ["Customer satisfaction", "Retention rate", "Referrals"]
        }
      },
      duration: "3 months",
      phases: [
        {
          phase: "Teaser (Weeks 1-2)",
          duration: "2 weeks",
          activities: [
            "Build anticipation with teaser content",
            "Warm up email list",
            "Prepare landing pages"
          ]
        }
      ],
      kpis: [
        {
          metric: "Qualified Leads Generated",
          target: "500 leads",
          measurement: "CRM tracking"
        },
        {
          metric: "Cost Per Lead",
          target: "Under $50",
          measurement: "Ad spend / total leads"
        }
      ]
    };
  }
}
