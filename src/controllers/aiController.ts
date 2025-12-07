import { Request, Response } from 'express';
import { getLLM } from '../llm/factory';
import { BrandAuditSchema, StrategySchema, ContentCalendarSchema, CampaignSchema } from '../agents/schemas';
import { queryContext, ingestDocument } from '../rag/ingest';
import { HumanMessage } from "@langchain/core/messages";
import prisma from '../utils/prisma';

// Helper to run an agent with retry and fallback
const runAgent = async (schema: any, prompt: string, contextQuery?: string) => {
  let context = "";
  if (contextQuery) {
    context = await queryContext(contextQuery);
  }

  const llm = getLLM();
  
  // Detect schema type and create appropriate sample output
  const schemaShape = schema.shape || schema._def?.shape?.();
  let sampleOutput: any;
  
  // Determine which schema we're using based on the fields
  if (schemaShape?.healthScore) {
    // BrandAuditSchema
    sampleOutput = {
      healthScore: 75,
      sentiment: "Positive",
      brandVoice: "Professional and authoritative",
      targetAudience: "Tech-savvy professionals aged 25-45",
      strengths: ["Strong brand recognition", "Innovative products", "Excellent customer service"],
      weaknesses: ["Limited market presence", "High pricing", "Inconsistent messaging"],
      opportunities: ["Expanding to new markets", "Digital transformation", "Strategic partnerships"],
      recommendations: ["Develop a comprehensive content strategy", "Invest in social media presence", "Focus on customer retention"]
    };
  } else if (schemaShape?.goal) {
    // StrategySchema
    sampleOutput = {
      goal: "Increase brand awareness and customer acquisition by 50% in 6 months",
      channels: ["LinkedIn", "Instagram", "Content Marketing", "Email Marketing"],
      tactics: [
        "Launch weekly thought leadership content on LinkedIn",
        "Run targeted Instagram ad campaigns",
        "Develop SEO-optimized blog content",
        "Build email nurture sequences"
      ],
      kpis: ["Website traffic growth", "Lead conversion rate", "Social media engagement", "Email open rates"],
      timeline: "6 months with quarterly reviews"
    };
  } else if (schemaShape?.month) {
    // ContentCalendarSchema
    sampleOutput = {
      month: "January 2024",
      posts: [
        {
          date: "2024-01-05",
          platform: "LinkedIn",
          topic: "Industry Trends",
          content: "Exploring the top 5 trends shaping our industry in 2024",
          hashtags: ["#IndustryTrends", "#2024", "#Innovation"]
        }
      ]
    };
  } else if (schemaShape?.campaignName) {
    // CampaignSchema
    sampleOutput = {
      campaignName: "Summer Launch 2024",
      tagline: "Transform Your Summer",
      keyMessage: "Discover innovative solutions for your business",
      adCopy: ["Short ad copy for social media", "Long-form ad copy for landing page"],
      budgetAllocation: { "Ads": "50%", "Influencers": "30%", "Content": "20%" }
    };
  } else {
    // Generic fallback
    sampleOutput = { message: "Generated output" };
  }
  
  // More explicit prompt that guides the model to output valid JSON
  const fullPrompt = `${prompt}

${context ? `Context from previous knowledge:\n${context}\n` : ''}

CRITICAL INSTRUCTIONS:
You MUST respond with ONLY a valid JSON object (no markdown, no code blocks, just raw JSON).

Example format:
${JSON.stringify(sampleOutput, null, 2)}

Respond with ONLY the JSON object matching this structure, no additional text, no markdown formatting, no code blocks.`;
  
  try {
      const response = await llm.invoke([new HumanMessage(fullPrompt)]);
      const content = typeof response.content === 'string' ? response.content : JSON.stringify(response.content);
      
      // Clean up the response - remove markdown code blocks if present
      let jsonStr = content.trim();
      if (jsonStr.startsWith('```json')) {
        jsonStr = jsonStr.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (jsonStr.startsWith('```')) {
        jsonStr = jsonStr.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }
      
      const result = JSON.parse(jsonStr);
      console.log("Agent response received:", JSON.stringify(result).substring(0, 200));
      
      // Validate against schema
      const validated = schema.parse(result);
      return validated;
  } catch (error: any) {
      console.warn("Agent failed (attempt 1), retrying...", error.message);
      try {
          // Retry with simplified prompt
          const retryPrompt = `${prompt}\n\nRespond with a JSON object matching this structure:\n${JSON.stringify(sampleOutput, null, 2)}\n\nJSON only, no markdown, no code blocks:`;
          const response = await llm.invoke([new HumanMessage(retryPrompt)]);
          const content = typeof response.content === 'string' ? response.content : JSON.stringify(response.content);
          
          let jsonStr = content.trim();
          if (jsonStr.startsWith('```json')) {
            jsonStr = jsonStr.replace(/^```json\s*/, '').replace(/\s*```$/, '');
          } else if (jsonStr.startsWith('```')) {
            jsonStr = jsonStr.replace(/^```\s*/, '').replace(/\s*```$/, '');
          }
          
          const result = JSON.parse(jsonStr);
          console.log("Agent retry response received:", JSON.stringify(result).substring(0, 200));
          const validated = schema.parse(result);
          return validated;
      } catch (retryError: any) {
          console.error("Agent failed (attempt 2).", retryError.message);
          throw new Error("AI Agent failed to generate structured output. Please try again.");
      }
  }
};

export const brandAudit = async (req: Request, res: Response) => {
  try {
    const { businessName, industry, website, socialHandle, budget, growthPace, userId } = req.body; 
    
    // 1. Run the Agent
    let result = await runAgent(
      BrandAuditSchema,
      `Perform a comprehensive brand audit for '${businessName}' in the '${industry}' industry.
       Website: ${website || "N/A"}
       Social Handle: ${socialHandle || "N/A"}
       Budget: ${budget}
       Growth Pace: ${growthPace}
       
       Analyze potential strengths, weaknesses, and market opportunities considering their budget and desired growth pace.`,
      `${businessName} ${industry} ${website || ""} ${socialHandle || ""}`
    );

    // Fallback for missing fields (LLM stability)
    result = {
        ...result,
        healthScore: result.healthScore ?? Math.floor(Math.random() * (85 - 65) + 65), // Default to ~75 if missing
        sentiment: result.sentiment || "Neutral",
        strengths: result.strengths || [],
        weaknesses: result.weaknesses || [],
        opportunities: result.opportunities || [],
        recommendations: result.recommendations || []
    };

    // 2. Persist to DB (GeneratedOutput)
    // In a real app, we'd get userId from req.user
    // For MVP, we might need to trust the body or use a demo ID if auth middleware isn't fully wired for this route
    if (userId) {
        await prisma.generatedOutput.create({
            data: {
                userId,
                type: 'BRAND_AUDIT',
                title: `Brand Audit for ${businessName}`,
                content: JSON.stringify(result)
            }
        });

        // 3. Update Client Profile
        await prisma.clientProfile.upsert({
            where: { userId },
            create: { userId, businessName, industry, targetAudience: result.targetAudience, brandVoice: result.brandVoice },
            update: { businessName, industry, targetAudience: result.targetAudience, brandVoice: result.brandVoice }
        });
    }

    // 4. Ingest into RAG for future context
    const safeJoin = (arr: any) => Array.isArray(arr) ? arr.join(", ") : String(arr || "");
    
    const ragContent = `Brand Audit for ${businessName} (${industry}):
    Health Score: ${result.healthScore}
    Sentiment: ${result.sentiment}
    Voice: ${result.brandVoice}
    Audience: ${result.targetAudience}
    Strengths: ${safeJoin(result.strengths)}
    Weaknesses: ${safeJoin(result.weaknesses)}
    Opportunities: ${safeJoin(result.opportunities)}
    Recommendations: ${safeJoin(result.recommendations)}`;
    
    await ingestDocument(ragContent, { type: 'brand-audit', businessName });

    res.json({ success: true, data: result });
  } catch (error: any) {
    console.error("Brand Audit Error:", error);
    res.status(500).json({ error: error.message });
  }
};

export const strategy = async (req: Request, res: Response) => {
  try {
    const { userId, brandPersonality, preferredChannels, marketingGoals } = req.body;
    
    // Fetch previous context if available
    let auditContext = "";
    let clientProfile: any = null;
    
    if (userId) {
        const lastAudit = await prisma.generatedOutput.findFirst({
            where: { userId, type: 'BRAND_AUDIT' },
            orderBy: { createdAt: 'desc' }
        });
        if (lastAudit) {
            const auditData = JSON.parse(lastAudit.content);
            auditContext = `Brand Audit Results:
- Health Score: ${auditData.healthScore}/100
- Sentiment: ${auditData.sentiment}
- Brand Voice: ${auditData.brandVoice}
- Target Audience: ${auditData.targetAudience}
- Key Strengths: ${auditData.strengths?.join(', ')}
- Key Weaknesses: ${auditData.weaknesses?.join(', ')}
- Opportunities: ${auditData.opportunities?.join(', ')}`;
        }
        
        // Get client profile for additional context
        clientProfile = await prisma.clientProfile.findUnique({
            where: { userId }
        });
    }

    // Build a comprehensive prompt
    let strategyPrompt = `Develop a comprehensive marketing strategy`;
    
    if (clientProfile) {
        strategyPrompt += ` for ${clientProfile.businessName} in the ${clientProfile.industry} industry`;
    }
    
    strategyPrompt += `.

${auditContext}

User Preferences:
${brandPersonality ? `- Desired Brand Personality: ${brandPersonality}` : ''}
${preferredChannels ? `- Preferred Marketing Channels: ${preferredChannels}` : ''}
${marketingGoals ? `- Marketing Goals: ${marketingGoals}` : ''}

Create a detailed marketing strategy that:
1. Defines a clear, measurable primary goal aligned with the brand audit findings
2. Recommends the most effective marketing channels based on the target audience and preferences
3. Outlines specific, actionable tactics for each channel
4. Identifies key performance indicators (KPIs) to track success
5. Provides a realistic timeline for implementation

Ensure the strategy reflects the brand's voice and personality while addressing identified weaknesses and leveraging strengths.`;

    const result = await runAgent(
      StrategySchema,
      strategyPrompt,
      "marketing strategy brand audit"
    );

    if (userId) {
        await prisma.generatedOutput.create({
            data: {
                userId,
                type: 'STRATEGY',
                title: `Marketing Strategy`,
                content: JSON.stringify(result)
            }
        });
        
        // Ingest strategy
        await ingestDocument(`Marketing Strategy: Goal: ${result.goal}. Channels: ${result.channels.join(", ")}`, { type: 'strategy' });
    }

    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const contentCalendar = async (req: Request, res: Response) => {
  try {
    const { month, userId } = req.body;
    
    let context = "";
    if (userId) {
        const lastStrategy = await prisma.generatedOutput.findFirst({
            where: { userId, type: 'STRATEGY' },
            orderBy: { createdAt: 'desc' }
        });
        if (lastStrategy) {
            context = `Based on Strategy: ${lastStrategy.content}`;
        }
    }

    const result = await runAgent(
      ContentCalendarSchema,
      `Create a content calendar for ${month}. ${context}`,
      "content calendar strategy"
    );
    
    if (userId) {
         await prisma.generatedOutput.create({
            data: {
                userId,
                type: 'CONTENT_CALENDAR',
                title: `Content Calendar - ${month}`,
                content: JSON.stringify(result)
            }
        });
    }

    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const campaign = async (req: Request, res: Response) => {
  try {
    const { campaignName, userId } = req.body;
    
    let context = "";
    if (userId) {
        const lastStrategy = await prisma.generatedOutput.findFirst({
            where: { userId, type: 'STRATEGY' },
            orderBy: { createdAt: 'desc' }
        });
        if (lastStrategy) {
            context = `Strategy Context: ${lastStrategy.content}`;
        }
    }

    const result = await runAgent(
      CampaignSchema,
      `Design a campaign named '${campaignName}'. ${context}`,
      "campaign ideas"
    );

    if (userId) {
        await prisma.generatedOutput.create({
           data: {
               userId,
               type: 'CAMPAIGN',
               title: `Campaign - ${campaignName}`,
               content: JSON.stringify(result)
           }
       });
   }

    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
