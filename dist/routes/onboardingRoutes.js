"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const onboardingController_1 = require("../controllers/onboardingController");
const router = (0, express_1.Router)();
router.post('/save-step', onboardingController_1.saveStep);
router.get('/get-progress', onboardingController_1.getProgress);
exports.default = router;
