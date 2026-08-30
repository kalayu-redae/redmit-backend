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

// Public read routes — active bank accounts are shown to buyers during checkout
router.get("/active", getActiveBankAccounts);

// All other routes require authentication + admin role
router.get("/", jwtAuthenticate, requireAdmin, getBankAccounts);
router.get("/:id", jwtAuthenticate, requireAdmin, getBankAccount);
router.post("/", jwtAuthenticate, requireAdmin, createBankAccount);
router.patch("/:id", jwtAuthenticate, requireAdmin, updateBankAccount);
router.patch("/:id/status", jwtAuthenticate, requireAdmin, updateBankAccountStatus);
router.delete("/:id", jwtAuthenticate, requireAdmin, deleteBankAccount);

export default router;
