import { getLLM } from "./llm/factory";
import { BrandAuditSchema } from "./agents/schemas";
import { HumanMessage } from "@langchain/core/messages";
import { z } from "zod";

async function regressionTest() {
  console.log("🚀 Starting Regression Testing...");

  // Test 1: Structured Output Validation
  console.log("\n1️⃣ Testing Brand Audit Structured Output...");
  try {
    const llm = getLLM().withStructuredOutput(BrandAuditSchema);
    const result = await llm.invoke([
      new HumanMessage("Perform a brand audit for a coffee shop called 'Java Joy'.")
    ]);
    
    console.log("   Raw Result:", JSON.stringify(result, null, 2));

    // Validate types
    if (!Array.isArray(result.strengths)) throw new Error("strengths is not an array");
    if (!Array.isArray(result.weaknesses)) throw new Error("weaknesses is not an array");
    if (typeof result.brandVoice !== 'string') throw new Error("brandVoice is not a string");
    
    console.log("   ✅ Schema Validation Passed");
  } catch (error: any) {
    console.error("   ❌ Schema Validation Failed:", error.message);
    process.exit(1);
  }

  // Test 2: Array Joining Logic (Simulation)
  console.log("\n2️⃣ Testing Safe Join Logic...");
  const safeJoin = (arr: any) => Array.isArray(arr) ? arr.join(", ") : String(arr || "");
  
  const testCases = [
    { input: ["a", "b"], expected: "a, b" },
    { input: "string", expected: "string" },
    { input: null, expected: "" },
    { input: undefined, expected: "" }
  ];

  testCases.forEach(({ input, expected }, i) => {
    const output = safeJoin(input);
    if (output === expected) {
        console.log(`   ✅ Case ${i + 1} Passed`);
    } else {
        console.error(`   ❌ Case ${i + 1} Failed: Expected '${expected}', got '${output}'`);
        process.exit(1);
    }
  });

  console.log("\n✨ Regression Tests Passed!");
}

regressionTest();
