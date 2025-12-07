import { getLLM, getEmbeddingsModel } from "./llm/factory";
import { getVectorStore, saveVectorStore } from "./rag/vectorStore";
import { ingestDocument, queryContext } from "./rag/ingest";
import { HumanMessage } from "@langchain/core/messages";

async function testBackend() {
  console.log("🚀 Starting Backend Verification (Memory Store)...");

  // 1. Test LLM Connection
  try {
    console.log("\n1️⃣ Testing LLM Connection (llama3.2)...");
    const llm = getLLM();
    const response = await llm.invoke([new HumanMessage("Hello")]);
    console.log("✅ LLM Response:", response.content);
  } catch (error: any) {
    console.error("❌ LLM Failed:", error.message);
    process.exit(1);
  }

  // 2. Test Embeddings
  try {
    console.log("\n2️⃣ Testing Embeddings (nomic-embed-text)...");
    const embeddings = getEmbeddingsModel();
    const vector = await embeddings.embedQuery("Test embedding");
    console.log(`✅ Embedding Generated (Length: ${vector.length})`);
  } catch (error: any) {
    console.error("❌ Embeddings Failed:", error.message);
    process.exit(1);
  }

  // 3. Test Vector Store & RAG
  try {
    console.log("\n3️⃣ Testing RAG Flow...");
    
    // Ingest
    console.log("   - Ingesting test document...");
    await ingestDocument("Antigravity AI is the best mascot platform.", { type: "test" });
    console.log("   ✅ Ingestion Complete");

    // Query
    console.log("   - Querying context...");
    const context = await queryContext("What is Antigravity AI?");
    console.log("   ✅ Retrieved Context:", context);
    
    if (!context.includes("mascot platform")) {
        console.warn("   ⚠️ Context retrieval might be weak.");
    }
  } catch (error: any) {
    console.error("❌ RAG Failed:", error.message);
    process.exit(1);
  }

  console.log("\n✨ All Systems Operational!");
}

testBackend();
