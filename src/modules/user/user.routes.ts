import { Router } from "express";

import { getUser, getUsers, updateUser, resetPassword, updateStatus, deleteUser, deleteUsers, deleteAllUsers, sendEmailToUser, sendEmails, sendEmailToAllUsers } from "./user.controller.js";
import { jwtAuthenticate, requireAdmin } from "../../middleware/jwtAuthenticate.js";
import { upload } from "../../middleware/upload.middleware.js";

const router = Router();

// All user-admin routes require authentication + admin role
router.use(jwtAuthenticate, requireAdmin);

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: List all users with filters and pagination
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10, maximum: 100 }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *         description: Search across name, email, phone, username
 *       - in: query
 *         name: role
 *         schema: { type: string, enum: [USER, ADMIN] }
 *       - in: query
 *         name: isActive
 *         schema: { type: boolean }
 *       - in: query
 *         name: isVerified
 *         schema: { type: boolean }
 *       - in: query
 *         name: sortBy
 *         schema: { type: string, default: createdAt, enum: [createdAt, updatedAt, email, username, fullName, isActive, isVerified] }
 *       - in: query
 *         name: order
 *         schema: { type: string, enum: [asc, desc], default: desc }
 *     responses:
 *       200:
 *         description: Paginated list of users
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: integer, example: 1 }
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Admin role required
 */
router.get("/", getUsers);

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Get a single user by ID
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: User found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: integer, example: 1 }
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       404:
 *         description: User not found
 */
router.get("/:id", getUser);

/**
 * @swagger
 * /api/users/{id}:
 *   patch:
 *     summary: Update a user's profile (admin)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               email: { type: string, format: email }
 *               phone: { type: string }
 *               username: { type: string }
 *               fullName: { type: string }
 *               role: { type: string, enum: [USER, ADMIN] }
 *               isVerified: { type: boolean }
 *               isActive: { type: boolean }
 *               avatar: { type: string, format: binary }
 *     responses:
 *       200:
 *         description: User updated successfully
 *       404:
 *         description: User not found
 *       409:
 *         description: Email, phone, or username already in use
 */
router.patch("/:id", upload.single("avatar"), updateUser);

/**
 * @swagger
 * /api/users/{id}/password:
 *   patch:
 *     summary: Reset a user's password and email them a temporary one (admin)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Temporary password emailed to user
 *       404:
 *         description: User not found
 */
router.patch("/:id/password", resetPassword);

/**
 * @swagger
 * /api/users/{id}/status:
 *   patch:
 *     summary: Activate or deactivate a user (admin)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [isActive]
 *             properties:
 *               isActive: { type: boolean }
 *     responses:
 *       200:
 *         description: Status updated
 *       400:
 *         description: isActive must be a boolean
 *       404:
 *         description: User not found
 */
router.patch("/:id/status", updateStatus);

/**
 * @swagger
 * /api/users/all:
 *   delete:
 *     summary: Deactivate all users (admin)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All users deactivated
 */
// Static routes MUST come before /:id to avoid being swallowed as a param
router.delete("/all", deleteAllUsers);

/**
 * @swagger
 * /api/users:
 *   delete:
 *     summary: Deactivate multiple users by IDs (admin)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [ids]
 *             properties:
 *               ids:
 *                 type: array
 *                 items: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Users deactivated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: integer, example: 1 }
 *                 count: { type: integer }
 */
router.delete("/", deleteUsers);

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: Deactivate a single user by ID (admin)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: User deactivated
 *       404:
 *         description: User not found
 */
router.delete("/:id", deleteUser);

/**
 * @swagger
 * /api/users/{id}/email:
 *   post:
 *     summary: Send an email to a specific user (admin)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [subject, message]
 *             properties:
 *               subject: { type: string }
 *               message: { type: string }
 *     responses:
 *       200:
 *         description: Email sent
 *       404:
 *         description: User not found
 */
router.post("/:id/email", sendEmailToUser);

/**
 * @swagger
 * /api/users/email/all:
 *   post:
 *     summary: Send an email to all active users (admin)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [subject, message]
 *             properties:
 *               subject: { type: string }
 *               message: { type: string }
 *     responses:
 *       200:
 *         description: Emails sent to all active users
 */
// more specific path before /email
router.post("/email/all", sendEmailToAllUsers);

/**
 * @swagger
 * /api/users/email:
 *   post:
 *     summary: Send an email to multiple users by IDs (admin)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [ids, subject, message]
 *             properties:
 *               ids:
 *                 type: array
 *                 items: { type: string, format: uuid }
 *               subject: { type: string }
 *               message: { type: string }
 *     responses:
 *       200:
 *         description: Emails sent
 */
router.post("/email", sendEmails);

export default router;
