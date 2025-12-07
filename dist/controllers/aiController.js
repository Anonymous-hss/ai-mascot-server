"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.campaign = exports.contentCalendar = exports.strategy = exports.brandAudit = void 0;
const factory_1 = require("../llm/factory");
const schemas_1 = require("../agents/schemas");
const ingest_1 = require("../rag/ingest");
const messages_1 = require("@langchain/core/messages");
// Helper to run an agent
const runAgent = async (schema, prompt, contextQuery) => {
    let context = "";
    if (contextQuery) {
        context = await (0, ingest_1.queryContext)(contextQuery);
    }
    const llm = (0, factory_1.getLLM)().withStructuredOutput(schema);
    const fullPrompt = `${prompt}\n\nContext:\n${context}`;
    // Retry logic could be added here
    return await llm.invoke([new messages_1.HumanMessage(fullPrompt)]);
};
const brandAudit = async (req, res) => {
    try {
        const { businessName, industry } = req.body;
        const result = await runAgent(schemas_1.BrandAuditSchema, `Perform a brand audit for ${businessName} in the ${industry} industry.`, `${businessName} ${industry}`);
        res.json({ success: true, data: result });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.brandAudit = brandAudit;
const strategy = async (req, res) => {
    try {
        const { brandAudit } = req.body;
        const result = await runAgent(schemas_1.StrategySchema, `Develop a marketing strategy based on this brand audit: ${JSON.stringify(brandAudit)}`, "marketing strategy best practices");
        res.json({ success: true, data: result });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.strategy = strategy;
const contentCalendar = async (req, res) => {
    try {
        const { strategy, month } = req.body;
        const result = await runAgent(schemas_1.ContentCalendarSchema, `Create a content calendar for ${month} based on this strategy: ${JSON.stringify(strategy)}`, "content ideas");
        res.json({ success: true, data: result });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.contentCalendar = contentCalendar;
const campaign = async (req, res) => {
    try {
        const { strategy, campaignName } = req.body;
        const result = await runAgent(schemas_1.CampaignSchema, `Design a campaign named '${campaignName}' based on this strategy: ${JSON.stringify(strategy)}`, "campaign examples");
        res.json({ success: true, data: result });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.campaign = campaign;
