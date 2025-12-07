import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { getModelRouter } from "../../llm/modelRouter";
import { BrandAuditSchema, BrandAudit } from "../../schemas/brandSchema";
import { getSchemaValidator } from "../../utils/schemaValidator";

/**
 * Brand Agent - Professional-grade brand analysis specialist
 * 
 * ROLE: Senior Brand Strategist with 15+ years of experience in brand positioning,
 * market analysis, and competitive intelligence. Expert in identifying brand strengths,
 * weaknesses, opportunities, and threats through systematic analysis.
 * 
 * EXPERTISE:
 * - Brand identity and voice analysis
 * - Target audience segmentation
 * - Competitive positioning
 * - SWOT analysis
 * - Brand health assessment
 * - Strategic recommendations
 */

const BRAND_AGENT_SYSTEM_PROMPT = `You are a Senior Brand Strategist with 15+ years of experience in brand positioning, market analysis, and competitive intelligence.

YOUR EXPERTISE:
- Brand Identity: Deep understanding of brand voice, personality, and positioning
- Market Analysis: Ability to assess market position and competitive landscape
- Audience Insights: Expert in identifying and segmenting target audiences
- Strategic Thinking: Skilled at connecting brand insights to actionable strategies
- Data-Driven: Use metrics and evidence to support recommendations

YOUR METHODOLOGY:
1. DISCOVERY: Gather all available information about the brand
2. ANALYSIS: Systematically evaluate brand identity, market position, and audience
3. ASSESSMENT: Score brand health across multiple dimensions
4. INSIGHTS: Identify key strengths, weaknesses, opportunities, and threats
5. RECOMMENDATIONS: Provide prioritized, actionable strategic recommendations

YOUR STANDARDS:
- Be thorough and comprehensive in your analysis
- Base recommendations on evidence and market realities
- Prioritize recommendations by impact and feasibility
- Consider both short-term wins and long-term brand building
- Maintain professional objectivity while being constructively critical

YOUR OUTPUT MUST:
- Follow the exact JSON schema provided
- Include specific, actionable insights (not generic advice)
- Provide realistic health scores based on available data
- Identify concrete competitive advantages and gaps
- Offer strategic recommendations with clear expected impact

Remember: You are analyzing real businesses. Your insights will directly influence their marketing strategy. Be professional, thorough, and actionable.`;

export interface BrandAgentInput {
  businessName: string;
  industry: string;
  website?: string;
  socialHandle?: string;
  budget?: string;
  growthPace?: string;
  additionalContext?: string;
  competitorData?: string;
}

export class BrandAgent {
  private router = getModelRouter();
  private validator = getSchemaValidator();

  /**
   * Execute brand audit analysis
   */
  async execute(input: BrandAgentInput): Promise<BrandAudit> {
    console.log(`🎯 Brand Agent: Analyzing ${input.businessName}...`);

    const { model } = await this.router.getModel("strategic");

    // Construct detailed analysis prompt
    const analysisPrompt = this.buildAnalysisPrompt(input);

    // Get sample output for guidance
    const sampleOutput = this.getSampleOutput();

    const fullPrompt = `${analysisPrompt}

CRITICAL INSTRUCTIONS:
You MUST respond with ONLY a valid JSON object matching this structure (no markdown, no code blocks, just raw JSON):

${JSON.stringify(sampleOutput, null, 2)}

Analyze the brand thoroughly and respond with ONLY the JSON object. Be specific and actionable in your analysis.`;

    try {
      // Invoke model
      const response = await model.invoke([
        new SystemMessage(BRAND_AGENT_SYSTEM_PROMPT),
        new HumanMessage(fullPrompt)
      ]);

      const content = typeof response.content === 'string' 
        ? response.content 
        : JSON.stringify(response.content);

      // Validate and repair if needed
      const validationResult = await this.validator.validateFromString(
        content,
        BrandAuditSchema,
        {
          autoRepair: true,
          context: `Brand audit for ${input.businessName} in ${input.industry} industry`
        }
      );

      if (!validationResult.success) {
        throw new Error(`Validation failed: ${validationResult.error}`);
      }

      console.log(`✓ Brand Agent: Analysis complete${validationResult.repaired ? ' (repaired)' : ''}`);
      
      // Ensure critical fields have defaults
      const result = this.ensureDefaults(validationResult.data!);
      
      return result;
    } catch (error: any) {
      console.error("Brand Agent error:", error);
      throw new Error(`Brand Agent failed: ${error.message}`);
    }
  }

  /**
   * Build detailed analysis prompt
   */
  private buildAnalysisPrompt(input: BrandAgentInput): string {
    let prompt = `Perform a comprehensive brand audit for "${input.businessName}" in the "${input.industry}" industry.\n\n`;

    prompt += `BRAND INFORMATION:\n`;
    prompt += `- Business Name: ${input.businessName}\n`;
    prompt += `- Industry: ${input.industry}\n`;
    
    if (input.website) {
      prompt += `- Website: ${input.website}\n`;
    }
    
    if (input.socialHandle) {
      prompt += `- Social Media: ${input.socialHandle}\n`;
    }
    
    if (input.budget) {
      prompt += `- Marketing Budget: ${input.budget}\n`;
    }
    
    if (input.growthPace) {
      prompt += `- Desired Growth Pace: ${input.growthPace}\n`;
    }

    if (input.additionalContext) {
      prompt += `\nADDITIONAL CONTEXT:\n${input.additionalContext}\n`;
    }

    if (input.competitorData) {
      prompt += `\nCOMPETITOR INSIGHTS:\n${input.competitorData}\n`;
    }

    prompt += `\nYOUR TASK:
1. Analyze the brand's identity, voice, and positioning
2. Identify the target audience with specific demographics/psychographics
3. Assess brand health with a realistic score (0-100)
4. Determine overall market sentiment
5. Conduct SWOT analysis (Strengths, Weaknesses, Opportunities, Threats)
6. Evaluate competitive position in the market
7. Provide prioritized strategic recommendations

Consider the budget and growth pace in your recommendations. Be specific and actionable.`;

    return prompt;
  }

  /**
   * Get sample output structure
   */
  private getSampleOutput(): Partial<BrandAudit> {
    return {
      healthScore: 75,
      sentiment: "Positive",
      brandVoice: "Professional and authoritative with a friendly undertone",
      targetAudience: "Tech-savvy professionals aged 25-45, decision-makers in B2B companies",
      brandPersonality: "Innovative, trustworthy, and customer-centric",
      strengths: [
        "Strong product-market fit",
        "Excellent customer service reputation",
        "Innovative technology stack"
      ],
      weaknesses: [
        "Limited brand awareness in target market",
        "Inconsistent messaging across channels",
        "Underdeveloped content strategy"
      ],
      opportunities: [
        "Growing demand in target market",
        "Untapped social media channels",
        "Strategic partnership potential"
      ],
      threats: [
        "Increasing competition from established players",
        "Market saturation in core segment",
        "Rapid technology changes"
      ],
      recommendations: [
        {
          priority: "High",
          category: "Brand Positioning",
          action: "Develop a clear, differentiated value proposition",
          expectedImpact: "Increased brand recognition and customer acquisition",
          timeline: "1-2 months"
        }
      ],
      competitivePosition: {
        marketPosition: "Challenger",
        differentiators: ["Innovative features", "Superior customer support"],
        competitiveGaps: ["Market presence", "Brand awareness"]
      },
      confidence: {
        overall: 0.75,
        dataQuality: "Medium",
        assumptions: ["Limited public data available", "Industry benchmarks used for comparison"]
      }
    };
  }

  /**
   * Ensure critical fields have defaults
   */
  private ensureDefaults(audit: BrandAudit): BrandAudit {
    return {
      ...audit,
      healthScore: audit.healthScore ?? 70,
      sentiment: audit.sentiment ?? "Neutral",
      strengths: audit.strengths ?? [],
      weaknesses: audit.weaknesses ?? [],
      opportunities: audit.opportunities ?? [],
      threats: audit.threats ?? [],
      recommendations: audit.recommendations ?? []
    };
  }
}
