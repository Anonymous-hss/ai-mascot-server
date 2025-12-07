"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const onboardingRoutes_1 = __importDefault(require("./routes/onboardingRoutes"));
const aiRoutes_1 = __importDefault(require("./routes/aiRoutes"));
const ragRoutes_1 = __importDefault(require("./routes/ragRoutes"));
const errorHandler_1 = require("./middleware/errorHandler");
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3001;
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Routes
app.use('/api/auth', authRoutes_1.default);
app.use('/api/onboarding', onboardingRoutes_1.default);
app.use('/api/ai', aiRoutes_1.default);
app.use('/api/rag', ragRoutes_1.default);
// Health Check
app.get('/', (req, res) => {
    res.send('AI Mascot API is running');
});
// Error Handler
app.use(errorHandler_1.errorHandler);
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
