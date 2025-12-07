"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.queryController = exports.ingestController = void 0;
const ingest_1 = require("../rag/ingest");
const ingestController = async (req, res) => {
    try {
        const { content, metadata } = req.body;
        // In a real app, handle file uploads via multer and read file content
        if (!content) {
            return res.status(400).json({ error: "Content is required" });
        }
        const count = await (0, ingest_1.ingestDocument)(content, metadata || {});
        res.json({ success: true, chunks: count });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.ingestController = ingestController;
const queryController = async (req, res) => {
    try {
        const { query } = req.body;
        if (!query) {
            return res.status(400).json({ error: "Query is required" });
        }
        const context = await (0, ingest_1.queryContext)(query);
        res.json({ success: true, context });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.queryController = queryController;
