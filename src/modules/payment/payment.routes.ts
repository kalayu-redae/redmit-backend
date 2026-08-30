import { Router } from "express";
import {
    createPayment,
    getPayments,
    getPayment,
    submitManualPayment,
    uploadPaymentProof,
    verifyPayment,
    rejectPayment,
    cancelPayment,
} from "./payment.controller.js";
import { upload } from "../../middleware/upload.middleware.js";
import { jwtAuthenticate } from "../../middleware/jwtAuthenticate.js";

const router = Router();

/**
 * @swagger
 * /api/payments:
 *   post:
 *     summary: Create a payment for an order
 *     tags:
 *       - Payments
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - orderId
 *               - method
 *             properties:
 *               orderId:
 *                 type: string
 *                 format: uuid
 *               method:
 *                 type: string
 *                 enum:
 *                   - MANUAL_BANK_TRANSFER
 *               bankAccountId:
 *                 type: string
 *                 format: uuid
 *                 description: Required when method is MANUAL_BANK_TRANSFER
 *     responses:
 *       201:
 *         description: Payment created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: integer
 *                   example: 1
 *                 payment:
 *                   $ref: '#/components/schemas/Payment'
 *       400:
 *         description: Validation error or invalid order total
 *       403:
 *         description: Order does not belong to you
 *       404:
 *         description: Order or bank account not found
 *   get:
 *     summary: List payments — admins see all, regular users see only their own
 *     tags:
 *       - Payments
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of payments
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: integer
 *                   example: 1
 *                 payments:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Payment'
 *       401:
 *         description: Not authenticated
 */
router.post("/", jwtAuthenticate, createPayment);
router.get("/", jwtAuthenticate, getPayments);

/**
 * @swagger
 * /api/payments/{id}:
 *   get:
 *     summary: Get a single payment by ID (owner or admin)
 *     tags:
 *       - Payments
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Payment found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: integer
 *                   example: 1
 *                 payment:
 *                   $ref: '#/components/schemas/Payment'
 *       403:
 *         description: Not your payment
 *       404:
 *         description: Payment not found
 */
router.get("/:id", jwtAuthenticate, getPayment);

/**
 * @swagger
 * /api/payments/{id}/manual:
 *   patch:
 *     summary: Submit a transaction reference for a manual bank transfer (owner only)
 *     tags:
 *       - Payments
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - transactionReference
 *             properties:
 *               transactionReference:
 *                 type: string
 *     responses:
 *       200:
 *         description: Payment submitted for verification
 *       400:
 *         description: Not a manual payment or already completed
 *       403:
 *         description: Not your payment
 *       404:
 *         description: Payment not found
 */
router.patch("/:id/manual", jwtAuthenticate, submitManualPayment);

/**
 * @swagger
 * /api/payments/{id}/proof:
 *   patch:
 *     summary: Upload a payment proof file (owner only)
 *     tags:
 *       - Payments
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Proof uploaded
 *       400:
 *         description: No file or payment already completed
 *       403:
 *         description: Not your payment
 *       404:
 *         description: Payment not found
 */
router.patch("/:id/proof", jwtAuthenticate, upload.single("file"), uploadPaymentProof);

/**
 * @swagger
 * /api/payments/{id}/verify:
 *   patch:
 *     summary: Verify a manual payment and confirm the order (admin only)
 *     tags:
 *       - Payments
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Payment verified and order confirmed
 *       400:
 *         description: Not a manual payment or already verified
 *       403:
 *         description: Admin role required
 *       404:
 *         description: Payment not found
 */
router.patch("/:id/verify", jwtAuthenticate, verifyPayment);

/**
 * @swagger
 * /api/payments/{id}/reject:
 *   patch:
 *     summary: Reject a manual payment (admin only)
 *     tags:
 *       - Payments
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - rejectionReason
 *             properties:
 *               rejectionReason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Payment rejected
 *       400:
 *         description: Payment already completed
 *       403:
 *         description: Admin role required
 *       404:
 *         description: Payment not found
 */
router.patch("/:id/reject", jwtAuthenticate, rejectPayment);

/**
 * @swagger
 * /api/payments/{id}/cancel:
 *   patch:
 *     summary: Cancel a payment (owner only)
 *     tags:
 *       - Payments
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Payment cancelled
 *       400:
 *         description: Cannot cancel a completed payment
 *       403:
 *         description: Not your payment
 *       404:
 *         description: Payment not found
 */
router.patch("/:id/cancel", jwtAuthenticate, cancelPayment);

export default router;
