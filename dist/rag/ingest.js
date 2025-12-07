"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.queryContext = exports.ingestDocument = void 0;
const text_splitter_1 = require("langchain/text_splitter");
const vectorStore_1 = require("./vectorStore");
const ingestDocument = async (content, metadata) => {
    const splitter = new text_splitter_1.RecursiveCharacterTextSplitter({
        chunkSize: 1000,
        chunkOverlap: 200,
    });
    const docs = await splitter.createDocuments([content], [metadata]);
    const vectorStore = await (0, vectorStore_1.getVectorStore)();
    await vectorStore.addDocuments(docs);
    return docs.length;
};
exports.ingestDocument = ingestDocument;
const queryContext = async (query, k = 3) => {
    const vectorStore = await (0, vectorStore_1.getVectorStore)();
    const results = await vectorStore.similaritySearch(query, k);
    return results.map(doc => doc.pageContent).join("\n\n");
};
exports.queryContext = queryContext;
