import { prisma } from "../../config/prisma.js";
import catchAsync from "../../utils/catchAsync.js";
import AppError from "../../utils/appError.js";
export const createBankAccount = catchAsync(async (req, res, next) => {
    const { bankName, accountName, accountNumber, phoneNumber, accountType, instructions, logoUrl } = req.body;
    if (!bankName)
        return next(new AppError("Bank name is required", 400));
    if (!accountName)
        return next(new AppError("Account name is required", 400));
    if (!accountNumber)
        return next(new AppError("Account number is required", 400));
    const existingAccount = await prisma.bankAccount.findFirst({
        where: { accountNumber },
    });
    if (existingAccount)
        return next(new AppError("Bank account already exists", 409));
    const bankAccount = await prisma.bankAccount.create({
        data: {
            bankName,
            accountName,
            accountNumber,
            phoneNumber,
            accountType,
            instructions,
            logoUrl,
            isActive: true,
        },
    });
    return res.status(201).json({
        status: 1,
        message: "Bank account created successfully",
        bankAccount,
    });
});
export const getBankAccounts = catchAsync(async (_req, res) => {
    const bankAccounts = await prisma.bankAccount.findMany({
        orderBy: { createdAt: "desc" },
    });
    return res.status(200).json({
        status: 1,
        message: "Bank accounts retrieved successfully",
        bankAccounts,
    });
});
export const getActiveBankAccounts = catchAsync(async (_req, res) => {
    const bankAccounts = await prisma.bankAccount.findMany({
        where: { isActive: true },
        orderBy: { bankName: "asc" },
    });
    return res.status(200).json({
        status: 1,
        message: "Active bank accounts retrieved successfully",
        bankAccounts,
    });
});
export const getBankAccount = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const bankAccount = await prisma.bankAccount.findUnique({
        where: { id },
    });
    if (!bankAccount)
        return next(new AppError("Bank account not found", 404));
    return res.status(200).json({
        status: 1,
        message: "Bank account retrieved successfully",
        bankAccount,
    });
});
export const updateBankAccount = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const { bankName, accountName, accountNumber, phoneNumber, accountType, instructions, logoUrl, isActive } = req.body;
    const existingAccount = await prisma.bankAccount.findUnique({
        where: { id },
    });
    if (!existingAccount)
        return next(new AppError("Bank account not found", 404));
    if (accountNumber && accountNumber !== existingAccount.accountNumber) {
        const accountExists = await prisma.bankAccount.findFirst({
            where: {
                accountNumber,
                NOT: { id },
            },
        });
        if (accountExists)
            return next(new AppError("Bank account number already exists", 409));
    }
    const bankAccount = await prisma.bankAccount.update({
        where: { id },
        data: {
            ...(bankName !== undefined && { bankName }),
            ...(accountName !== undefined && { accountName }),
            ...(accountNumber !== undefined && { accountNumber }),
            ...(phoneNumber !== undefined && { phoneNumber }),
            ...(accountType !== undefined && { accountType }),
            ...(instructions !== undefined && { instructions }),
            ...(logoUrl !== undefined && { logoUrl }),
            ...(isActive !== undefined && { isActive }),
        },
    });
    return res.status(200).json({
        status: 1,
        message: "Bank account updated successfully",
        bankAccount,
    });
});
export const updateBankAccountStatus = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const { isActive } = req.body;
    if (typeof isActive !== "boolean")
        return next(new AppError("isActive must be a boolean", 400));
    const bankAccount = await prisma.bankAccount.findUnique({
        where: { id },
    });
    if (!bankAccount)
        return next(new AppError("Bank account not found", 404));
    const updatedBankAccount = await prisma.bankAccount.update({
        where: { id },
        data: { isActive },
    });
    return res.status(200).json({
        status: 1,
        message: `Bank account ${isActive ? "activated" : "deactivated"} successfully`,
        bankAccount: updatedBankAccount,
    });
});
export const deleteBankAccount = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const bankAccount = await prisma.bankAccount.findUnique({
        where: { id },
    });
    if (!bankAccount)
        return next(new AppError("Bank account not found", 404));
    const paymentCount = await prisma.payment.count({
        where: { bankAccountId: id },
    });
    if (paymentCount > 0) {
        return next(new AppError("Cannot delete a bank account that has payment records. Deactivate it instead.", 400));
    }
    await prisma.bankAccount.delete({
        where: { id },
    });
    return res.status(200).json({
        status: 1,
        message: "Bank account deleted successfully",
    });
});
