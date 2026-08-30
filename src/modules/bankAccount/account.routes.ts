import { Router } from "express";
import {
    createBankAccount,
    getBankAccounts,
    getActiveBankAccounts,
    getBankAccount,
    updateBankAccount,
    updateBankAccountStatus,
    deleteBankAccount,
} from "./account.controller.js";
import { jwtAuthenticate, requireAdmin } from "../../middleware/jwtAuthenticate.js";

const router = Router();

/**
 * @swagger
 * /api/bank-accounts/active:
 *   get:
 *     summary: List active bank accounts (shown to buyers during checkout)
 *     tags: [Bank Accounts]
 *     responses:
 *       200:
 *         description: List of active bank accounts
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: integer, example: 1 }
 *                 bankAccounts:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/BankAccount'
 */
// Public — must be before /:id
router.get("/active", getActiveBankAccounts);

/**
 * @swagger
 * /api/bank-accounts:
 *   get:
 *     summary: List all bank accounts (admin)
 *     tags: [Bank Accounts]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All bank accounts
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: integer, example: 1 }
 *                 bankAccounts:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/BankAccount'
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Admin role required
 */
router.get("/", jwtAuthenticate, requireAdmin, getBankAccounts);

/**
 * @swagger
 * /api/bank-accounts/{id}:
 *   get:
 *     summary: Get a single bank account by ID (admin)
 *     tags: [Bank Accounts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Bank account found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: integer, example: 1 }
 *                 bankAccount:
 *                   $ref: '#/components/schemas/BankAccount'
 *       404:
 *         description: Bank account not found
 */
router.get("/:id", jwtAuthenticate, requireAdmin, getBankAccount);

/**
 * @swagger
 * /api/bank-accounts:
 *   post:
 *     summary: Create a bank account (admin)
 *     tags: [Bank Accounts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [bankName, accountName, accountNumber]
 *             properties:
 *               bankName: { type: string }
 *               accountName: { type: string }
 *               accountNumber: { type: string }
 *               phoneNumber: { type: string }
 *               accountType: { type: string }
 *               instructions: { type: string }
 *               logoUrl: { type: string }
 *     responses:
 *       201:
 *         description: Bank account created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: integer, example: 1 }
 *                 bankAccount:
 *                   $ref: '#/components/schemas/BankAccount'
 *       409:
 *         description: Account number already exists
 */
router.post("/", jwtAuthenticate, requireAdmin, createBankAccount);

/**
 * @swagger
 * /api/bank-accounts/{id}:
 *   patch:
 *     summary: Update a bank account (admin)
 *     tags: [Bank Accounts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               bankName: { type: string }
 *               accountName: { type: string }
 *               accountNumber: { type: string }
 *               phoneNumber: { type: string }
 *               accountType: { type: string }
 *               instructions: { type: string }
 *               logoUrl: { type: string }
 *               isActive: { type: boolean }
 *     responses:
 *       200:
 *         description: Bank account updated
 *       404:
 *         description: Bank account not found
 *       409:
 *         description: Account number already in use
 */
router.patch("/:id", jwtAuthenticate, requireAdmin, updateBankAccount);

/**
 * @swagger
 * /api/bank-accounts/{id}/status:
 *   patch:
 *     summary: Activate or deactivate a bank account (admin)
 *     tags: [Bank Accounts]
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
 *         description: Bank account not found
 */
router.patch("/:id/status", jwtAuthenticate, requireAdmin, updateBankAccountStatus);

/**
 * @swagger
 * /api/bank-accounts/{id}:
 *   delete:
 *     summary: Delete a bank account (admin)
 *     description: Cannot delete an account that has payment records — deactivate it instead.
 *     tags: [Bank Accounts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Bank account deleted
 *       400:
 *         description: Account has payment records; deactivate instead
 *       404:
 *         description: Bank account not found
 */
router.delete("/:id", jwtAuthenticate, requireAdmin, deleteBankAccount);

export default router;
