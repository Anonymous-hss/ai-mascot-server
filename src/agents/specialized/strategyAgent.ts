import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { getModelRouter } from "../../llm/modelRouter";
import { StrategySchema, Strategy } from "../../schemas/strategySchema";
import { getSchemaValidator } from "../../utils/schemaValidator";
import { BrandAudit } from "../../schemas/brandSchema";

/**
 * Strategy Agent - Professional-grade marketing strategy specialist
 * 
 * ROLE: Chief Marketing Strategist with 20+ years of experience in developing
 * and executing comprehensive marketing strategies across B2B and B2C sectors.
 * Expert in channel strategy, budget optimization, and performance measurement.
 * 
 * EXPERTISE:
 * - Multi-channel marketing strategy
 * - Budget allocation and ROI optimization
 * - KPI framework development
 * - Go-to-market planning
 * - Risk assessment and mitigation
 * - Strategic roadmap creation
 */

const STRATEGY_AGENT_SYSTEM_PROMPT = `You are a Chief Marketing Strategist with 20+ years of experience in developing and executing comprehensive marketing strategies.

YOUR EXPERTISE:
- Strategic Planning: Master at creating cohesive, multi-channel marketing strategies
- Channel Optimization: Deep knowledge of when and how to use each marketing channel
- Budget Management: Expert in allocating budgets for maximum ROI
- Performance Metrics: Skilled at defining meaningful KPIs and success criteria
- Risk Management: Experienced in identifying and mitigating strategic risks
- Execution Planning: Ability to break strategies into actionable phases and milestones

YOUR METHODOLOGY:
1. FOUNDATION: Understand business goals, brand position, and target audience
2. CHANNEL SELECTION: Choose optimal channels based on audience and objectives
3. TACTICAL PLANNING: Define specific tactics for each channel
4. RESOURCE ALLOCATION: Optimize budget and resource distribution
5. MEASUREMENT FRAMEWORK: Establish KPIs and success metrics
6. RISK ASSESSMENT: Identify potential risks and mitigation strategies
7. ROADMAP: Create phased implementation timeline with milestones

YOUR STANDARDS:
- Align strategy with business objectives and brand positioning
- Base channel selection on audience behavior and data
- Ensure tactics are specific, measurable, and achievable
- Optimize budget allocation for maximum impact
- Define clear, trackable KPIs
- Consider both quick wins and long-term growth
- Identify and plan for potential risks

YOUR OUTPUT MUST:
- Follow the exact JSON schema provided
- Include SMART goals (Specific, Measurable, Achievable, Relevant, Time-bound)
- Provide detailed channel strategies with clear rationale
- Offer specific, actionable tactics (not generic advice)
- Define measurable KPIs with targets
- Include realistic budget allocations
- Address potential risks and mitigation strategies

Remember: Your strategy will guide real marketing investments. Be data-driven, realistic, and focused on measurable outcomes.`;

export interface StrategyAgentInput {
  businessName?: string;
  industry?: string;
  brandAudit?: BrandAudit;
  brandPersonality?: string;
  preferredChannels?: string;
  marketingGoals?: string;
  budget?: string;
  timeline?: string;
  additionalContext?: string;
}

export class StrategyAgent {
  private router = getModelRouter();
  private validator = getSchemaValidator();

  /**
   * Execute strategy development
   */
  async execute(input: StrategyAgentInput): Promise<Strategy> {
    console.log(`🎯 Strategy Agent: Developing marketing strategy...`);

    const { model } = await this.router.getModel("strategic");

    // Construct detailed strategy prompt
    const strategyPrompt = this.buildStrategyPrompt(input);

    // Get sample output for guidance
    const sampleOutput = this.getSampleOutput();

    const fullPrompt = `${strategyPrompt}

CRITICAL INSTRUCTIONS:
You MUST respond with ONLY a valid JSON object matching this structure (no markdown, no code blocks, just raw JSON):

${JSON.stringify(sampleOutput, null, 2)}

Develop a comprehensive, actionable marketing strategy and respond with ONLY the JSON object.`;

    try {
      // Invoke model
      const response = await model.invoke([
        new SystemMessage(STRATEGY_AGENT_SYSTEM_PROMPT),
        new HumanMessage(fullPrompt)
      ]);

      const content = typeof response.content === 'string' 
        ? response.content 
        : JSON.stringify(response.content);

      // Validate and repair if needed
      const validationResult = await this.validator.validateFromString(
        content,
        StrategySchema,
        {
          autoRepair: true,
          context: `Marketing strategy for ${input.businessName || 'client'}`
        }
      );

      if (!validationResult.success) {
        throw new Error(`Validation failed: ${validationResult.error}`);
      }

      console.log(`✓ Strategy Agent: Strategy complete${validationResult.repaired ? ' (repaired)' : ''}`);
      
      return validationResult.data!;
    } catch (error: any) {
      console.error("Strategy Agent error:", error);
      throw new Error(`Strategy Agent failed: ${error.message}`);
    }
  }

  /**
   * Build detailed strategy prompt
   */
  private buildStrategyPrompt(input: StrategyAgentInput): string {
    let prompt = `Develop a comprehensive marketing strategy`;
    
    if (input.businessName && input.industry) {
      prompt += ` for ${input.businessName} in the ${input.industry} industry`;
    }
    
    prompt += `.\n\n`;

    // Include brand audit insights
    if (input.brandAudit) {
      prompt += `BRAND AUDIT INSIGHTS:\n`;
      prompt += `- Brand Health Score: ${input.brandAudit.healthScore}/100\n`;
      prompt += `- Market Sentiment: ${input.brandAudit.sentiment}\n`;
      prompt += `- Brand Voice: ${input.brandAudit.brandVoice}\n`;
      prompt += `- Target Audience: ${input.brandAudit.targetAudience}\n`;
      
      if (input.brandAudit.strengths && input.brandAudit.strengths.length > 0) {
        prompt += `- Key Strengths: ${input.brandAudit.strengths.join(', ')}\n`;
      }
      
      if (input.brandAudit.weaknesses && input.brandAudit.weaknesses.length > 0) {
        prompt += `- Key Weaknesses: ${input.brandAudit.weaknesses.join(', ')}\n`;
      }
      
      if (input.brandAudit.opportunities && input.brandAudit.opportunities.length > 0) {
        prompt += `- Opportunities: ${input.brandAudit.opportunities.join(', ')}\n`;
      }
      
      prompt += `\n`;
    }

    // User preferences
    prompt += `USER PREFERENCES:\n`;
    
    if (input.brandPersonality) {
      prompt += `- Desired Brand Personality: ${input.brandPersonality}\n`;
    }
    
    if (input.preferredChannels) {
      prompt += `- Preferred Marketing Channels: ${input.preferredChannels}\n`;
    }
    
    if (input.marketingGoals) {
      prompt += `- Marketing Goals: ${input.marketingGoals}\n`;
    }
    
    if (input.budget) {
      prompt += `- Budget: ${input.budget}\n`;
    }
    
    if (input.timeline) {
      prompt += `- Timeline: ${input.timeline}\n`;
    }

    if (input.additionalContext) {
      prompt += `\nADDITIONAL CONTEXT:\n${input.additionalContext}\n`;
    }

    prompt += `\nYOUR TASK:
1. Define a clear, SMART primary marketing goal aligned with brand audit findings
2. Select and prioritize the most effective marketing channels for the target audience
3. Develop specific, actionable tactics for each channel
4. Allocate budget strategically across channels and activities
5. Define measurable KPIs with specific targets
6. Create a phased implementation timeline with milestones
7. Identify potential risks and mitigation strategies

Ensure the strategy:
- Leverages identified brand strengths
- Addresses identified weaknesses
- Capitalizes on market opportunities
- Reflects the desired brand personality
- Fits within the specified budget and timeline
- Is realistic and achievable`;

    return prompt;
  }

  /**
   * Get sample output structure
   */
  private getSampleOutput(): Partial<Strategy> {
    return {
      goal: "Increase brand awareness and qualified lead generation by 50% within 6 months",
      executiveSummary: "Multi-channel strategy focused on thought leadership and targeted outreach",
      channels: [
        {
          name: "LinkedIn",
          priority: "Primary",
          rationale: "Target audience is highly active on LinkedIn",
          expectedROI: "3:1 within 6 months"
        }
      ],
      tactics: [
        {
          channel: "LinkedIn",
          action: "Publish weekly thought leadership articles",
          frequency: "Weekly",
          resources: "Content writer, graphic designer"
        }
      ],
      kpis: [
        {
          metric: "Website Traffic Growth",
          target: "50% increase",
          measurement: "Google Analytics monthly comparison",
          frequency: "Monthly"
        }
      ],
      timeline: "6 months with quarterly reviews",
      milestones: [
        {
          phase: "Foundation (Month 1-2)",
          duration: "2 months",
          objectives: ["Set up analytics", "Create content calendar"],
          deliverables: ["Analytics dashboard", "Q1 content plan"]
        }
      ],
      budgetStrategy: {
        totalBudget: "$10,000 - $15,000",
        allocation: {
          "Paid Ads": "40%",
          "Content Creation": "30%",
          "Tools & Software": "20%",
          "Contingency": "10%"
        },
        costOptimization: ["Focus on organic growth initially", "Test channels before scaling"]
      },
      risks: [
        {
          risk: "Low initial engagement on new channels",
          impact: "Medium",
          mitigation: "Start with small test budgets and scale what works"
        }
      ],
      successCriteria: [
        "50% increase in qualified leads",
        "3:1 marketing ROI",
        "Improved brand sentiment"
      ]
    };
  }
}
