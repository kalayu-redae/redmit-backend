import { prisma } from "../../config/prisma.js";
import catchAsync from "../../utils/catchAsync.js";
import AppError from "../../utils/appError.js";
import fileManager from "../../utils/file/file.manager.js";
const generatePaymentNumber = () => `PAY-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
export const createPayment = catchAsync(async (req, res, next) => {
    const { orderId, method, bankAccountId } = req.body;
    const userId = req.user?.id;
    if (!userId)
        return next(new AppError("Authentication required", 401));
    if (!orderId)
        return next(new AppError("Order ID is required", 400));
    if (!method)
        return next(new AppError("Payment method is required", 400));
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order)
        return next(new AppError("Order not found", 404));
    if (order.total <= 0)
        return next(new AppError("Invalid order total", 400));
    if (method === "MANUAL_BANK_TRANSFER") {
        if (!bankAccountId)
            return next(new AppError("Bank account is required", 400));
        const bankAccount = await prisma.bankAccount.findFirst({
            where: { id: bankAccountId, isActive: true },
        });
        if (!bankAccount)
            return next(new AppError("Bank account not found or inactive", 404));
    }
    const payment = await prisma.payment.create({
        data: {
            paymentNumber: generatePaymentNumber(),
            orderId,
            userId,
            method,
            amount: order.total,
            currency: order.currency,
            bankAccountId: method === "MANUAL_BANK_TRANSFER" ? bankAccountId : null,
            manualStatus: method === "MANUAL_BANK_TRANSFER" ? "PENDING_VERIFICATION" : "NOT_REQUIRED",
            status: method === "MANUAL_BANK_TRANSFER" ? "PROCESSING" : "PENDING",
        },
        include: {
            bankAccount: true,
            proofFile: true,
        },
    });
    return res.status(201).json({
        status: 1,
        message: "Payment created successfully",
        payment,
    });
});
export const getPayments = catchAsync(async (req, res, next) => {
    const payments = await prisma.payment.findMany({
        include: {
            order: true,
            user: {
                select: {
                    id: true,
                    username: true,
                    fullName: true,
                    email: true,
                },
            },
            bankAccount: true,
            proofFile: true,
            verifiedBy: {
                select: {
                    id: true,
                    username: true,
                    fullName: true,
                },
            },
        },
        orderBy: { createdAt: "desc" },
    });
    return res.status(200).json({
        status: 1,
        message: "Payments retrieved successfully",
        payments,
    });
});
export const getPayment = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const payment = await prisma.payment.findUnique({
        where: { id },
        include: {
            order: true,
            user: {
                select: {
                    id: true,
                    username: true,
                    fullName: true,
                    email: true,
                },
            },
            bankAccount: true,
            proofFile: true,
            verifiedBy: {
                select: {
                    id: true,
                    username: true,
                    fullName: true,
                },
            },
        },
    });
    if (!payment)
        return next(new AppError("Payment not found", 404));
    return res.status(200).json({
        status: 1,
        message: "Payment retrieved successfully",
        payment,
    });
});
export const submitManualPayment = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const { transactionReference } = req.body;
    if (!transactionReference)
        return next(new AppError("Transaction reference is required", 400));
    const payment = await prisma.payment.findUnique({ where: { id } });
    if (!payment)
        return next(new AppError("Payment not found", 404));
    if (payment.method !== "MANUAL_BANK_TRANSFER")
        return next(new AppError("This payment is not a manual bank transfer", 400));
    if (payment.status === "COMPLETED")
        return next(new AppError("Payment has already been completed", 400));
    const updatedPayment = await prisma.payment.update({
        where: { id },
        data: {
            transactionReference,
            status: "PROCESSING",
            manualStatus: "PENDING_VERIFICATION",
        },
        include: {
            bankAccount: true,
            proofFile: true,
        },
    });
    return res.status(200).json({
        status: 1,
        message: "Payment submitted for verification",
        payment: updatedPayment,
    });
});
export const uploadPaymentProof = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    if (!req.file)
        return next(new AppError("Payment proof file is required", 400));
    const payment = await prisma.payment.findUnique({ where: { id } });
    if (!payment)
        return next(new AppError("Payment not found", 404));
    if (payment.status === "COMPLETED")
        return next(new AppError("Payment has already been completed", 400));
    const file = await fileManager.upload(req.file);
    const updatedPayment = await prisma.payment.update({
        where: { id },
        data: {
            proofFileId: file.id,
        },
        include: {
            bankAccount: true,
            proofFile: true,
        },
    });
    return res.status(200).json({
        status: 1,
        message: "Payment proof uploaded successfully",
        payment: updatedPayment,
    });
});
export const verifyPayment = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const verifiedById = req.user?.id;
    if (!verifiedById)
        return next(new AppError("Authentication required", 401));
    const payment = await prisma.payment.findUnique({
        where: { id },
        include: { order: true },
    });
    if (!payment)
        return next(new AppError("Payment not found", 404));
    if (payment.method !== "MANUAL_BANK_TRANSFER")
        return next(new AppError("Only manual payments require manual verification", 400));
    if (payment.manualStatus === "VERIFIED")
        return next(new AppError("Payment is already verified", 400));
    const result = await prisma.$transaction(async (tx) => {
        const updatedPayment = await tx.payment.update({
            where: { id },
            data: {
                status: "COMPLETED",
                manualStatus: "VERIFIED",
                verifiedById,
                verifiedAt: new Date(),
                paidAt: new Date(),
            },
            include: {
                bankAccount: true,
                proofFile: true,
            },
        });
        const order = await tx.order.update({
            where: { id: payment.orderId },
            data: {
                status: "CONFIRMED",
            },
        });
        return { payment: updatedPayment, order };
    });
    return res.status(200).json({
        status: 1,
        message: "Payment verified successfully",
        payment: result.payment,
        order: result.order,
    });
});
export const rejectPayment = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const { rejectionReason } = req.body;
    if (!rejectionReason)
        return next(new AppError("Rejection reason is required", 400));
    const payment = await prisma.payment.findUnique({ where: { id } });
    if (!payment)
        return next(new AppError("Payment not found", 404));
    if (payment.status === "COMPLETED")
        return next(new AppError("Completed payment cannot be rejected", 400));
    const updatedPayment = await prisma.payment.update({
        where: { id },
        data: {
            status: "FAILED",
            manualStatus: "REJECTED",
            rejectionReason,
        },
        include: {
            bankAccount: true,
            proofFile: true,
        },
    });
    return res.status(200).json({
        status: 1,
        message: "Payment rejected successfully",
        payment: updatedPayment,
    });
});
export const cancelPayment = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const payment = await prisma.payment.findUnique({ where: { id } });
    if (!payment)
        return next(new AppError("Payment not found", 404));
    if (payment.status === "COMPLETED")
        return next(new AppError("Completed payment cannot be cancelled", 400));
    const updatedPayment = await prisma.payment.update({
        where: { id },
        data: {
            status: "CANCELLED",
        },
        include: {
            bankAccount: true,
            proofFile: true,
        },
    });
    return res.status(200).json({
        status: 1,
        message: "Payment cancelled successfully",
        payment: updatedPayment,
    });
});
