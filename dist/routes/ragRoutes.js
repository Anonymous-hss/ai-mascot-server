"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const ragController_1 = require("../controllers/ragController");
const router = (0, express_1.Router)();
router.post('/ingest', ragController_1.ingestController);
router.post('/query', ragController_1.queryController);
exports.default = router;
