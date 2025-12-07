"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProgress = exports.saveStep = void 0;
const prisma_1 = __importDefault(require("../utils/prisma"));
const saveStep = async (req, res) => {
    try {
        const { userId, step, data } = req.body;
        const onboarding = await prisma_1.default.onboarding.upsert({
            where: { userId },
            update: { step, data: JSON.stringify(data) },
            create: { userId, step, data: JSON.stringify(data) },
        });
        res.json({ success: true, onboarding });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.saveStep = saveStep;
const getProgress = async (req, res) => {
    try {
        const { userId } = req.query;
        if (!userId)
            return res.status(400).json({ error: "UserId required" });
        const onboarding = await prisma_1.default.onboarding.findUnique({
            where: { userId: String(userId) },
        });
        res.json({ success: true, onboarding });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.getProgress = getProgress;
