"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.graph = void 0;
const langgraph_1 = require("@langchain/langgraph");
const messages_1 = require("@langchain/core/messages");
const factory_1 = require("../llm/factory");
const schemas_1 = require("./schemas");
// Worker Nodes
const brandAgent = async (state) => {
    const llm = (0, factory_1.getLLM)().withStructuredOutput(schemas_1.BrandAuditSchema);
    const response = await llm.invoke([
        ...state.messages,
        new messages_1.HumanMessage(`Perform a brand audit based on the context: ${state.userContext || "No context provided."}`),
    ]);
    return { brandAudit: response };
};
const strategyAgent = async (state) => {
    const llm = (0, factory_1.getLLM)().withStructuredOutput(schemas_1.StrategySchema);
    const response = await llm.invoke([
        ...state.messages,
        new messages_1.HumanMessage(`Develop a marketing strategy based on the brand audit: ${JSON.stringify(state.brandAudit)}`),
    ]);
    return { strategy: response };
};
const contentAgent = async (state) => {
    const llm = (0, factory_1.getLLM)().withStructuredOutput(schemas_1.ContentCalendarSchema);
    const response = await llm.invoke([
        ...state.messages,
        new messages_1.HumanMessage(`Create a content calendar based on the strategy: ${JSON.stringify(state.strategy)}`),
    ]);
    return { contentCalendar: response };
};
const campaignAgent = async (state) => {
    const llm = (0, factory_1.getLLM)().withStructuredOutput(schemas_1.CampaignSchema);
    const response = await llm.invoke([
        ...state.messages,
        new messages_1.HumanMessage(`Design a campaign based on the strategy: ${JSON.stringify(state.strategy)}`),
    ]);
    return { campaign: response };
};
// Supervisor / Router
// For this MVP, we can just have a linear flow or a simple router based on user intent.
// Or we can expose individual endpoints that trigger specific sub-graphs.
// Let's make a simple router that decides what to do based on the last message or "next" field.
// Graph Construction
const workflow = new langgraph_1.StateGraph({
    channels: {
        messages: {
            reducer: (a, b) => a.concat(b),
            default: () => [],
        },
        next: {
            reducer: (a, b) => b,
            default: () => "END",
        },
        brandAudit: {
            reducer: (a, b) => b ?? a,
            default: () => undefined,
        },
        strategy: {
            reducer: (a, b) => b ?? a,
            default: () => undefined,
        },
        contentCalendar: {
            reducer: (a, b) => b ?? a,
            default: () => undefined,
        },
        campaign: {
            reducer: (a, b) => b ?? a,
            default: () => undefined,
        },
        userContext: {
            reducer: (a, b) => b ?? a,
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
exports.graph = workflow.compile();
