import { Router } from "express";

import { register, login, getMe, updateMe, forgotPassword, resetPassword, updateMyPassword, removeMyAvatar } from "./auth.controller.js";
import { jwtAuthenticate } from "../../middleware/jwtAuthenticate.js";
import { upload } from "../../middleware/upload.middleware.js";

const router = Router();

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     description: Create a new Redmit user account.
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterRequest'
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Invalid request
 *       409:
 *         description: Email or username already exists
 */
router.post("/register", upload.single("avatar"), register);
router.post("/login", login);


router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

router.get("/me", jwtAuthenticate, getMe);
router.patch("/me", jwtAuthenticate, upload.single("avatar"), updateMe);

router.patch("/update-my-password", jwtAuthenticate, updateMyPassword);
router.delete("/me/avatar", jwtAuthenticate, removeMyAvatar);


export default router;