"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEmbeddingsModel = exports.getLLM = void 0;
const ollama_1 = require("@langchain/ollama");
// In a real scenario, this would import the actual Antigravity SDK or use a generic HTTP wrapper
// For this MVP, we will simulate Antigravity by trying to connect to a non-existent endpoint
// or just logging it and using Ollama if the key is 'dummy'.
const getLLM = (modelName = "llama3.1") => {
    const antigravityKey = process.env.ANTIGRAVITY_API_KEY;
    // Primary: Antigravity (Simulated)
    // If we had a real client, we would return it here.
    // For the demo, if the key is dummy, we skip to fallback or use a mock that logs.
    // We will use ChatOllama as the robust local solution.
    // To demonstrate "Fallback", we can wrap it.
    const ollama = new ollama_1.ChatOllama({
        baseUrl: process.env.OLLAMA_BASE_URL || "http://localhost:11434",
        model: modelName, // e.g., "llama3.1" or "mistral-nemo"
        temperature: 0.7,
    });
    return ollama;
};
exports.getLLM = getLLM;
const getEmbeddingsModel = () => {
    // Return Ollama Embeddings
    const { OllamaEmbeddings } = require("@langchain/ollama");
    return new OllamaEmbeddings({
        model: "nomic-embed-text",
        baseUrl: process.env.OLLAMA_BASE_URL || "http://localhost:11434",
    });
};
exports.getEmbeddingsModel = getEmbeddingsModel;
