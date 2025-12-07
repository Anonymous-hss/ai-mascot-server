import { Request, Response } from 'express';
import prisma from '../utils/prisma';

export const saveStep = async (req: Request, res: Response) => {
  try {
    const { userId, step, data } = req.body;
    
    const onboarding = await prisma.onboarding.upsert({
      where: { userId },
      update: { step, data: JSON.stringify(data) },
      create: { userId, step, data: JSON.stringify(data) },
    });
    
    res.json({ success: true, onboarding });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getProgress = async (req: Request, res: Response) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ error: "UserId required" });
    
    const onboarding = await prisma.onboarding.findUnique({
      where: { userId: String(userId) },
    });
    
    res.json({ success: true, onboarding });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
