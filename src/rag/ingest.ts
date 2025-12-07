import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { Document } from "@langchain/core/documents";
import { getVectorStore, saveVectorStore } from "./vectorStore";

export const ingestDocument = async (content: string, metadata: Record<string, any>) => {
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
  });

  const docs = await splitter.createDocuments([content], [metadata]);
  
  const vectorStore = await getVectorStore();
  await vectorStore.addDocuments(docs);
  await saveVectorStore(vectorStore);
  
  return docs.length;
};

export const queryContext = async (query: string, k: number = 3) => {
  try {
    const vectorStore = await getVectorStore();
    // HNSWLib might throw if empty or dimensions mismatch
    const results = await vectorStore.similaritySearch(query, k);
    return results.map(doc => doc.pageContent).join("\n\n");
  } catch (error) {
    console.warn("RAG Query failed (likely empty store):", error);
    return "";
  }
};
