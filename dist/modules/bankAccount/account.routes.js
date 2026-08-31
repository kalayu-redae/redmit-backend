import { Router } from "express";
import { createBankAccount, getBankAccounts, getActiveBankAccounts, getBankAccount, updateBankAccount, updateBankAccountStatus, deleteBankAccount, } from "./account.controller.js";
import { jwtAuthenticate, requireAdmin } from "../../middleware/jwtAuthenticate.js";
const router = Router();
/**
 * @swagger
 * /api/bank-accounts/active:
 *   get:
 *     summary: List active bank accounts (public — shown to buyers during checkout)
 *     tags:
 *       - Bank Accounts
 *     responses:
 *       200:
 *         description: List of active bank accounts
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: integer
 *                   example: 1
 *                 bankAccounts:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/BankAccount'
 */
router.get("/active", getActiveBankAccounts);
/**
 * @swagger
 * /api/bank-accounts:
 *   get:
 *     summary: List all bank accounts
 *     tags:
 *       - Bank Accounts
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
 *                 status:
 *                   type: integer
 *                   example: 1
 *                 bankAccounts:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/BankAccount'
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Admin role required
 *   post:
 *     summary: Create a bank account
 *     tags:
 *       - Bank Accounts
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - bankName
 *               - accountName
 *               - accountNumber
 *             properties:
 *               bankName:
 *                 type: string
 *               accountName:
 *                 type: string
 *               accountNumber:
 *                 type: string
 *               phoneNumber:
 *                 type: string
 *               accountType:
 *                 type: string
 *               instructions:
 *                 type: string
 *               logoUrl:
 *                 type: string
 *     responses:
 *       201:
 *         description: Bank account created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: integer
 *                   example: 1
 *                 bankAccount:
 *                   $ref: '#/components/schemas/BankAccount'
 *       409:
 *         description: Account number already exists
 */
router.get("/", jwtAuthenticate, requireAdmin, getBankAccounts);
router.post("/", jwtAuthenticate, requireAdmin, createBankAccount);
/**
 * @swagger
 * /api/bank-accounts/{id}:
 *   get:
 *     summary: Get a single bank account by ID
 *     tags:
 *       - Bank Accounts
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
 *         description: Bank account found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: integer
 *                   example: 1
 *                 bankAccount:
 *                   $ref: '#/components/schemas/BankAccount'
 *       404:
 *         description: Bank account not found
 *   patch:
 *     summary: Update a bank account
 *     tags:
 *       - Bank Accounts
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
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               bankName:
 *                 type: string
 *               accountName:
 *                 type: string
 *               accountNumber:
 *                 type: string
 *               phoneNumber:
 *                 type: string
 *               accountType:
 *                 type: string
 *               instructions:
 *                 type: string
 *               logoUrl:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Bank account updated
 *       404:
 *         description: Not found
 *       409:
 *         description: Account number already in use
 *   delete:
 *     summary: Delete a bank account
 *     description: Cannot delete an account that has payment records — deactivate it instead.
 *     tags:
 *       - Bank Accounts
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
 *         description: Bank account deleted
 *       400:
 *         description: Account has payment records
 *       404:
 *         description: Not found
 */
router.get("/:id", jwtAuthenticate, requireAdmin, getBankAccount);
router.patch("/:id", jwtAuthenticate, requireAdmin, updateBankAccount);
router.delete("/:id", jwtAuthenticate, requireAdmin, deleteBankAccount);
/**
 * @swagger
 * /api/bank-accounts/{id}/status:
 *   patch:
 *     summary: Activate or deactivate a bank account
 *     tags:
 *       - Bank Accounts
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
 *               - isActive
 *             properties:
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Status updated
 *       400:
 *         description: isActive must be a boolean
 *       404:
 *         description: Not found
 */
router.patch("/:id/status", jwtAuthenticate, requireAdmin, updateBankAccountStatus);
export default router;
