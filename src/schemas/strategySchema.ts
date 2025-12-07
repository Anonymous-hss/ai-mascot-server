import { z } from "zod";

/**
 * Enhanced Marketing Strategy Schema
 * Comprehensive strategy with budget allocation, risk assessment, and KPI tracking
 */
export const StrategySchema = z.object({
  // Primary Goal
  goal: z.string()
    .describe("The primary marketing goal with specific, measurable objectives (SMART format)"),
  
  // Strategic Overview
  executiveSummary: z.string()
    .describe("High-level executive summary of the strategy")
    .optional(),
  
  // Channel Strategy
  channels: z.array(z.object({
    name: z.string().describe("Channel name (e.g., 'LinkedIn', 'Instagram', 'Email Marketing')"),
    priority: z.enum(["Primary", "Secondary", "Experimental"]).describe("Channel priority"),
    rationale: z.string().describe("Why this channel was selected"),
    expectedROI: z.string().describe("Expected return on investment")
  }))
    .describe("Recommended marketing channels with prioritization"),
  
  // Tactical Execution
  tactics: z.array(z.object({
    channel: z.string().describe("Associated channel"),
    action: z.string().describe("Specific tactical action"),
    frequency: z.string().describe("Execution frequency (e.g., 'Daily', 'Weekly', '3x per week')"),
    resources: z.string().describe("Required resources and tools"),
    owner: z.string().describe("Suggested role/team owner").optional()
  }))
    .describe("Specific tactics to achieve the goal"),
  
  // Performance Metrics
  kpis: z.array(z.object({
    metric: z.string().describe("KPI name (e.g., 'Website Traffic Growth')"),
    target: z.string().describe("Target value or percentage"),
    measurement: z.string().describe("How to measure this KPI"),
    frequency: z.string().describe("Measurement frequency")
  }))
    .describe("Key Performance Indicators to track success"),
  
  // Timeline & Milestones
  timeline: z.string()
    .describe("Overall timeline for strategy execution"),
  
  milestones: z.array(z.object({
    phase: z.string().describe("Phase name (e.g., 'Launch', 'Growth', 'Scale')"),
    duration: z.string().describe("Duration of this phase"),
    objectives: z.array(z.string()).describe("Key objectives for this phase"),
    deliverables: z.array(z.string()).describe("Expected deliverables")
  }))
    .describe("Strategic milestones and phases")
    .optional(),
  
  // Budget Considerations
  budgetStrategy: z.object({
    totalBudget: z.string().describe("Total budget range or amount"),
    allocation: z.record(z.string(), z.string()).describe("Budget allocation by channel/activity (e.g., {'Paid Ads': '40%', 'Content': '30%'})"),
    costOptimization: z.array(z.string()).describe("Cost optimization strategies")
  })
    .describe("Budget allocation and optimization strategy")
    .optional(),
  
  // Risk Assessment
  risks: z.array(z.object({
    risk: z.string().describe("Identified risk"),
    impact: z.enum(["High", "Medium", "Low"]).describe("Potential impact"),
    mitigation: z.string().describe("Mitigation strategy")
  }))
    .describe("Risk assessment and mitigation strategies")
    .optional(),
  
  // Success Criteria
  successCriteria: z.array(z.string())
    .describe("Clear criteria for determining strategy success")
    .optional()
});

export type Strategy = z.infer<typeof StrategySchema>;
