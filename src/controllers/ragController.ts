import { Request, Response } from 'express';
import { ingestDocument, queryContext } from '../rag/ingest';

export const ingestController = async (req: Request, res: Response) => {
  try {
    const { content, metadata } = req.body;
    // In a real app, handle file uploads via multer and read file content
    if (!content) {
      return res.status(400).json({ error: "Content is required" });
    }
    
    const count = await ingestDocument(content, metadata || {});
    res.json({ success: true, chunks: count });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const queryController = async (req: Request, res: Response) => {
  try {
    const { query } = req.body;
    if (!query) {
      return res.status(400).json({ error: "Query is required" });
    }
    
    const context = await queryContext(query);
    res.json({ success: true, context });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
