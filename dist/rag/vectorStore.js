"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initVectorStore = exports.getVectorStore = void 0;
const chroma_1 = require("@langchain/community/vectorstores/chroma");
const factory_1 = require("../llm/factory");
const getVectorStore = async (collectionName = "ai-mascot-rag") => {
    const embeddings = (0, factory_1.getEmbeddingsModel)();
    const vectorStore = await chroma_1.Chroma.fromExistingCollection(embeddings, {
        collectionName: collectionName,
        url: process.env.CHROMA_URL || "http://localhost:8000", // Default Chroma URL
    }).catch(() => {
        // If collection doesn't exist, we might need to create it or handle it.
        // Chroma.fromExistingCollection throws if not found usually, or we can use fromDocuments if we have docs.
        // For a generic getter, we might want to just return a new instance connected to that collection.
        return new chroma_1.Chroma(embeddings, {
            collectionName: collectionName,
            url: process.env.CHROMA_URL || "http://localhost:8000",
        });
    });
    return vectorStore;
};
exports.getVectorStore = getVectorStore;
const initVectorStore = async () => {
    // Helper to ensure collection exists or is ready
    const embeddings = (0, factory_1.getEmbeddingsModel)();
    return new chroma_1.Chroma(embeddings, {
        collectionName: "ai-mascot-rag",
        url: process.env.CHROMA_URL || "http://localhost:8000",
    });
};
exports.initVectorStore = initVectorStore;
