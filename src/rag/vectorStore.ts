import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { getEmbeddingsModel } from "../llm/factory";
import fs from "fs";
import path from "path";
import { Document } from "@langchain/core/documents";

const VECTOR_STORE_PATH = path.join(process.cwd(), "data", "vector_store.json");

// Helper to save memory store to disk
const saveToDisk = async (store: MemoryVectorStore) => {
    const docs = store.memoryVectors;
    fs.writeFileSync(VECTOR_STORE_PATH, JSON.stringify(docs));
};

// Helper to load memory store from disk
const loadFromDisk = async (): Promise<MemoryVectorStore> => {
    const embeddings = getEmbeddingsModel();
    const store = new MemoryVectorStore(embeddings);
    
    if (fs.existsSync(VECTOR_STORE_PATH)) {
        try {
            const data = JSON.parse(fs.readFileSync(VECTOR_STORE_PATH, "utf-8"));
            // Restore vectors
            // MemoryVectorStore doesn't have a direct 'load' from JSON, so we re-add them or hack it.
            // The cleanest way for MVP is to re-add documents if we saved documents, but we saved vectors.
            // Let's just save the documents and re-embed them on startup? No, that's slow.
            // We can inject the vectors directly if we access the private property or use a compatible format.
            // Actually, MemoryVectorStore stores { content, embedding, metadata }.
            
            // Let's use a simpler approach: Save the Documents (content+metadata) and re-add them. 
            // It's safer and "demo-ready" enough for small scale.
            // Wait, re-embedding every time is bad for Ollama speed.
            
            // Let's assume we can just use the memory store instance for the session.
            // But user wants persistence.
            
            // Better approach for MVP without native deps:
            // Use a simple JSON file that stores { content, metadata, embedding }
            // And load it into MemoryVectorStore manually.
            
            for (const item of data) {
                await store.addVectors([item.embedding], [new Document({ pageContent: item.content, metadata: item.metadata })]);
            }
        } catch (e) {
            console.error("Failed to load vector store", e);
        }
    }
    return store;
};

// Singleton instance to avoid reloading
let storeInstance: MemoryVectorStore | null = null;

export const getVectorStore = async () => {
  if (!storeInstance) {
    storeInstance = await loadFromDisk();
  }
  return storeInstance;
};

export const saveVectorStore = async (vectorStore: MemoryVectorStore) => {
   // We need to extract the vectors. MemoryVectorStore exposes `memoryVectors` which is public in JS.
   const vectors = (vectorStore as any).memoryVectors;
   fs.writeFileSync(VECTOR_STORE_PATH, JSON.stringify(vectors));
};

export const initVectorStore = async () => {
    return getVectorStore();
}
