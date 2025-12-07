import { ChatOllama } from "@langchain/ollama";
import { BaseChatModel } from "@langchain/core/language_models/chat_models";

// In a real scenario, this would import the actual Antigravity SDK or use a generic HTTP wrapper
// For this MVP, we will simulate Antigravity by trying to connect to a non-existent endpoint
// or just logging it and using Ollama if the key is 'dummy'.

export const getLLM = (modelName: string = "llama3.2"): BaseChatModel => {
  const antigravityKey = process.env.ANTIGRAVITY_API_KEY;
  
  // Primary: Antigravity (Simulated)
  // If we had a real client, we would return it here.
  // For the demo, if the key is dummy, we skip to fallback or use a mock that logs.
  
  // We will use ChatOllama as the robust local solution.
  // To demonstrate "Fallback", we can wrap it.
  
  const ollama = new ChatOllama({
    baseUrl: process.env.OLLAMA_BASE_URL || "http://localhost:11434",
    model: modelName, // e.g., "llama3.2" or "mistral-nemo"
    temperature: 0.1, // Lower temperature for more deterministic tool calling
    format: "json", // Enable JSON mode for structured output
  });

  return ollama as any;
};

export const getEmbeddingsModel = () => {
    // Return Ollama Embeddings
    const { OllamaEmbeddings } = require("@langchain/ollama");
    // Fallback to llama3.2 since it is installed, if nomic is not found or desired.
    // Ideally we use nomic-embed-text, but if it fails to pull, we use what we have.
    return new OllamaEmbeddings({
        model: "nomic-embed-text", // Try nomic first, but if it fails, the user might need to pull it.
        // If we want to force a model we know exists:
        // model: "llama3.2", 
        baseUrl: process.env.OLLAMA_BASE_URL || "http://localhost:11434",
    });
}
