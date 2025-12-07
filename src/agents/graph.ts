import { StateGraph, END } from "@langchain/langgraph";
import { HumanMessage, BaseMessage } from "@langchain/core/messages";
import { RunnableConfig } from "@langchain/core/runnables";
import { getLLM } from "../llm/factory";
import { BrandAuditSchema, StrategySchema, ContentCalendarSchema, CampaignSchema } from "./schemas";
import { z } from "zod";

// Define the State
export interface AgentState {
  messages: BaseMessage[];
  next: string;
  brandAudit?: z.infer<typeof BrandAuditSchema>;
  strategy?: z.infer<typeof StrategySchema>;
  contentCalendar?: z.infer<typeof ContentCalendarSchema>;
  campaign?: z.infer<typeof CampaignSchema>;
  userContext?: string; // Context from RAG
}

// Worker Nodes
const brandAgent = async (state: AgentState) => {
  const llm = getLLM().withStructuredOutput(BrandAuditSchema);
  const response = await llm.invoke([
    ...state.messages,
    new HumanMessage(`Perform a brand audit based on the context: ${state.userContext || "No context provided."}`),
  ]);
  return { brandAudit: response };
};

const strategyAgent = async (state: AgentState) => {
  const llm = getLLM().withStructuredOutput(StrategySchema);
  const response = await llm.invoke([
    ...state.messages,
    new HumanMessage(`Develop a marketing strategy based on the brand audit: ${JSON.stringify(state.brandAudit)}`),
  ]);
  return { strategy: response };
};

const contentAgent = async (state: AgentState) => {
  const llm = getLLM().withStructuredOutput(ContentCalendarSchema);
  const response = await llm.invoke([
    ...state.messages,
    new HumanMessage(`Create a content calendar based on the strategy: ${JSON.stringify(state.strategy)}`),
  ]);
  return { contentCalendar: response };
};

const campaignAgent = async (state: AgentState) => {
  const llm = getLLM().withStructuredOutput(CampaignSchema);
  const response = await llm.invoke([
    ...state.messages,
    new HumanMessage(`Design a campaign based on the strategy: ${JSON.stringify(state.strategy)}`),
  ]);
  return { campaign: response };
};

// Supervisor / Router
// For this MVP, we can just have a linear flow or a simple router based on user intent.
// Or we can expose individual endpoints that trigger specific sub-graphs.
// Let's make a simple router that decides what to do based on the last message or "next" field.

// Graph Construction
const workflow = new StateGraph<AgentState>({
    channels: {
        messages: {
            reducer: (a: BaseMessage[], b: BaseMessage[]) => a.concat(b),
            default: () => [],
        },
        next: {
            reducer: (a: string, b: string) => b,
            default: () => "END",
        },
        brandAudit: {
            reducer: (a: any, b: any) => b ?? a,
            default: () => undefined,
        },
        strategy: {
            reducer: (a: any, b: any) => b ?? a,
            default: () => undefined,
        },
        contentCalendar: {
            reducer: (a: any, b: any) => b ?? a,
            default: () => undefined,
        },
        campaign: {
            reducer: (a: any, b: any) => b ?? a,
            default: () => undefined,
        },
        userContext: {
            reducer: (a: string, b: string) => b ?? a,
            default: () => "",
        }
    }
});

workflow.addNode("brand_agent", brandAgent);
workflow.addNode("strategy_agent", strategyAgent);
workflow.addNode("content_agent", contentAgent);
workflow.addNode("campaign_agent", campaignAgent);

// We can define conditional edges or just expose the nodes directly via the API.
// For the "Multi-Agent Flow", let's define a sequence: Brand -> Strategy -> Content
// But usually the user requests one specific thing.
// Let's just compile it and allow starting at any node.

export const graph = workflow.compile();
