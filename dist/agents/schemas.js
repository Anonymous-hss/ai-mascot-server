"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CampaignSchema = exports.StrategySchema = exports.ContentCalendarSchema = exports.BrandAuditSchema = void 0;
const zod_1 = require("zod");
exports.BrandAuditSchema = zod_1.z.object({
    brandVoice: zod_1.z.string().describe("The identified voice of the brand (e.g., professional, playful)."),
    targetAudience: zod_1.z.string().describe("The primary audience segments identified."),
    strengths: zod_1.z.array(zod_1.z.string()).describe("List of brand strengths."),
    weaknesses: zod_1.z.array(zod_1.z.string()).describe("List of brand weaknesses."),
    opportunities: zod_1.z.array(zod_1.z.string()).describe("List of market opportunities."),
    recommendations: zod_1.z.array(zod_1.z.string()).describe("Strategic recommendations."),
});
exports.ContentCalendarSchema = zod_1.z.object({
    month: zod_1.z.string().describe("The month for this calendar."),
    posts: zod_1.z.array(zod_1.z.object({
        date: zod_1.z.string().describe("Date of the post (YYYY-MM-DD)."),
        platform: zod_1.z.enum(["LinkedIn", "Twitter", "Instagram", "Blog"]).describe("Platform for the post."),
        topic: zod_1.z.string().describe("Topic or theme of the post."),
        content: zod_1.z.string().describe("The actual post content/caption."),
        hashtags: zod_1.z.array(zod_1.z.string()).describe("Relevant hashtags."),
    })).describe("List of scheduled posts."),
});
exports.StrategySchema = zod_1.z.object({
    goal: zod_1.z.string().describe("The primary marketing goal."),
    channels: zod_1.z.array(zod_1.z.string()).describe("Recommended channels."),
    tactics: zod_1.z.array(zod_1.z.string()).describe("Specific tactics to achieve the goal."),
    kpis: zod_1.z.array(zod_1.z.string()).describe("Key Performance Indicators to track."),
    timeline: zod_1.z.string().describe("Estimated timeline for execution."),
});
exports.CampaignSchema = zod_1.z.object({
    campaignName: zod_1.z.string().describe("Name of the campaign."),
    tagline: zod_1.z.string().describe("Catchy tagline."),
    keyMessage: zod_1.z.string().describe("Core message to convey."),
    adCopy: zod_1.z.array(zod_1.z.string()).describe("Draft ad copies for different formats."),
    budgetAllocation: zod_1.z.record(zod_1.z.string(), zod_1.z.string()).describe("Suggested budget split (e.g., {'Ads': '50%', 'Influencers': '30%'})."),
});
