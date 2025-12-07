import { getLLM } from "./llm/factory";
import { BrandAuditSchema } from "./agents/schemas";
import { HumanMessage } from "@langchain/core/messages";
import { ingestDocument, queryContext } from "./rag/ingest";

async function testAll() {
  console.log("🚀 Starting Full System Test...");

  // 1. Test LLM
  try {
    console.log("1️⃣ Testing LLM...");
    const llm = getLLM();
    await llm.invoke([new HumanMessage("Hi")]);
    console.log("   ✅ LLM OK");
  } catch (e: any) {
    console.error("   ❌ LLM Failed:", e.message);
    process.exit(1);
  }

  // 2. Test RAG (Memory Store)
  try {
    console.log("2️⃣ Testing RAG (Memory)...");
    await ingestDocument("Test content", { id: 1 });
    const res = await queryContext("Test");
    if (!res) console.warn("   ⚠️ RAG returned empty (might be expected if score low)");
    else console.log("   ✅ RAG OK");
  } catch (e: any) {
    console.error("   ❌ RAG Failed:", e.message);
    process.exit(1);
  }

  // 3. Test Structured Output (Agent)
  try {
    console.log("3️⃣ Testing Structured Output...");
    const llm = getLLM().withStructuredOutput(BrandAuditSchema);
    const res = await llm.invoke([new HumanMessage("Audit 'TestBrand'. Industry: Tech.")]);
    console.log("   ✅ Structured Output OK:", Object.keys(res));
  } catch (e: any) {
    console.error("   ❌ Structured Output Failed:", e.message);
    process.exit(1);
  }

  console.log("\n✨ All systems go!");
}

testAll();
