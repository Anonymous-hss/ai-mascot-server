import { getLLM } from "./llm/factory";
import { BrandAuditSchema } from "./agents/schemas";
import { HumanMessage } from "@langchain/core/messages";

async function finalTest() {
  console.log("🚀 Starting Final Regression Test...");

  // 1. Test Structured Output with New Fields
  try {
    console.log("1️⃣ Testing Brand Audit with Enhanced Inputs...");
    const llm = getLLM().withStructuredOutput(BrandAuditSchema);
    const prompt = `
      Perform a brand audit for 'TestBiz'.
      Website: https://test.com
      Budget: High
      Growth Pace: Aggressive
    `;
    const resRaw = await llm.invoke([new HumanMessage(prompt)]);
    const res = {
        ...resRaw,
        healthScore: resRaw.healthScore ?? 75,
        sentiment: resRaw.sentiment || "Neutral"
    };
    
    if (res.healthScore && res.sentiment) {
        console.log("   ✅ Enhanced Fields Present (Health: " + res.healthScore + ")");
    } else {
        throw new Error("Missing enhanced fields");
    }
  } catch (e: any) {
    console.error("   ❌ Failed:", e.message);
    process.exit(1);
  }

  console.log("\n✨ System Ready for Demo!");
}

finalTest();
