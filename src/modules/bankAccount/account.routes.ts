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

const router = Router();

router.post("/", createBankAccount);
router.get("/", getBankAccounts);
router.get("/active", getActiveBankAccounts);
router.get("/:id", getBankAccount);
router.patch("/:id", updateBankAccount);
router.patch("/:id/status", updateBankAccountStatus);
router.delete("/:id", deleteBankAccount);

export default router;