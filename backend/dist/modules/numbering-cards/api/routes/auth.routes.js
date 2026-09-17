"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = require("../controllers/auth.controller");
const auth_1 = require("../../../../middleware/auth");
const router = (0, express_1.Router)();
// POST /api/auth/login
router.post('/login', auth_controller_1.login);
// POST /api/auth/logout  (requiere auth)
router.post('/logout', auth_1.authenticate, auth_controller_1.logout);
// GET /api/auth/me  (requiere auth)
router.get('/me', auth_1.authenticate, auth_controller_1.me);
exports.default = router;
//# sourceMappingURL=auth.routes.js.map