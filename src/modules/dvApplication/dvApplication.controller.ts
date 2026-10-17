
import { Request, Response, NextFunction } from "express";
import { prisma } from "../../config/prisma.js";
import catchAsync from "../../utils/catchAsync.js";
import AppError from "../../utils/appError.js";
import FileManager from "../../utils/file/file.manager.js";
import { DVApplicationStatus } from "@prisma/client";

const isAdmin = (req: Request) => req.user?.role === "ADMIN";

const getUploadedFiles = (req: Request) =>
    req.files as
    | { [fieldname: string]: Express.Multer.File[] }
    | undefined;

const validateFees = (
    price: unknown,
    serviceFee: unknown,
    registrationFee: unknown
) => {
    for (const [name, value] of [
        ["price", price],
        ["serviceFee", serviceFee],
        ["registrationFee", registrationFee],
    ] as const) {
        if (
            value !== undefined &&
            value !== null &&
            (String(value).trim() === "" ||
                !Number.isFinite(Number(value)) ||
                Number(value) < 0)
        ) {
            throw new AppError(`${name} must be a non-negative number`, 400);
        }
    }
};

/**
 * Create a DV application.
 * Authenticated customer submits their application.
 */
export const createDVApplication = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        const userId = req.user?.id;

        if (!userId) {
            return next(new AppError("Authentication required", 401));
        }

        const {
            providerId,
            name,
            description,
            price,
            currency,
            serviceFee,
            registrationFee,
            dvYear,
            details,
        } = req.body;

        if (
            !providerId ||
            !name ||
            price === undefined ||
            serviceFee === undefined ||
            registrationFee === undefined ||
            dvYear === undefined
        ) {
            return next(
                new AppError(
                    "Provider, name, price, service fee, registration fee and DV year are required",
                    400
                )
            );
        }

        validateFees(price, serviceFee, registrationFee);

        if (!Number.isInteger(Number(dvYear))) {
            return next(new AppError("DV year must be an integer", 400));
        }

        const provider = await prisma.user.findUnique({
            where: { id: providerId },
            select: { id: true, isActive: true },
        });

        if (!provider || !provider.isActive) {
            return next(new AppError("Active provider not found", 404));
        }

        // The client cannot choose the customer ID; it comes from authentication.
        const files = getUploadedFiles(req);
        const thumbnail = files?.thumbnail?.[0];

        let thumbnailId: string | undefined;

        if (thumbnail) {
            const uploadedThumbnail = await FileManager.upload(thumbnail);
            thumbnailId = uploadedThumbnail.id;
        }

        const application = await prisma.dVApplication.create({
            data: {
                userId,
                providerId,
                name: String(name).trim(),
                description,
                price: Number(price),
                serviceFee: Number(serviceFee),
                registrationFee: Number(registrationFee),
                currency: currency || "USD",
                dvYear: Number(dvYear),
                ...(details !== undefined && { details }),
                ...(thumbnailId && { thumbnailId }),
            },
        });

        return res.status(201).json({
            status: 1,
            message: "DV application created successfully",
            data: application,
        });
    }
);

/**
 * Get DV applications.
 * Admin sees all applications; customers see their own.
 */
export const getDVApplications = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        if (!req.user?.id) {
            return next(new AppError("Authentication required", 401));
        }

        const page = Math.max(1, Number(req.query.page) || 1);
        const limit = Math.min(
            100,
            Math.max(1, Number(req.query.limit) || 10)
        );

        const status = req.query.status?.toString();
        const dvYear = req.query.dvYear
            ? Number(req.query.dvYear)
            : undefined;

        if (
            status &&
            !Object.values(DVApplicationStatus).includes(
                status as DVApplicationStatus
            )
        ) {
            return next(new AppError("Invalid application status", 400));
        }

        if (
            dvYear !== undefined &&
            !Number.isInteger(dvYear)
        ) {
            return next(new AppError("DV year must be an integer", 400));
        }

        const where = {
            ...(!isAdmin(req) && { userId: req.user.id }),
            ...(status && { status: status as DVApplicationStatus }),
            ...(dvYear !== undefined && { dvYear }),
        };

        const [applications, total] = await Promise.all([
            prisma.dVApplication.findMany({
                where,
                include: {
                    thumbnail: true,
                    people: true,
                    documents: {
                        select: {
                            id: true,
                            type: true,
                            personId: true,
                            fileId: true,
                            createdAt: true,
                        },
                    },
                },
                orderBy: { createdAt: "desc" },
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.dVApplication.count({ where }),
        ]);

        return res.status(200).json({
            status: 1,
            message: "DV applications retrieved successfully",
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
            data: applications,
        });
    }
);

/**
 * Get a single DV application.
 */
export const getDVApplication = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        const userId = req.user?.id;

        if (!userId) {
            return next(new AppError("Authentication required", 401));
        }

        const application = await prisma.dVApplication.findUnique({
            where: { id: req.params.id },
            include: {
                thumbnail: true,
                people: true,
                documents: {
                    select: {
                        id: true,
                        type: true,
                        personId: true,
                        fileId: true,
                        createdAt: true,
                    },
                },
            },
        });

        if (
            !application ||
            (!isAdmin(req) && application.userId !== userId)
        ) {
            return next(new AppError("DV application not found", 404));
        }

        return res.status(200).json({
            status: 1,
            message: "DV application retrieved successfully",
            data: application,
        });
    }
);

/**
 * Update application information and fees.
 * Admin only.
 */
export const updateDVApplication = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        if (!isAdmin(req)) {
            return next(new AppError("Admin access required", 403));
        }

        const {
            name,
            description,
            price,
            currency,
            serviceFee,
            registrationFee,
            dvYear,
            details,
            isActive,
        } = req.body;

        validateFees(price, serviceFee, registrationFee);

        if (
            dvYear !== undefined &&
            !Number.isInteger(Number(dvYear))
        ) {
            return next(new AppError("DV year must be an integer", 400));
        }

        const existing = await prisma.dVApplication.findUnique({
            where: { id: req.params.id },
            select: { id: true },
        });

        if (!existing) {
            return next(new AppError("DV application not found", 404));
        }

        const files = getUploadedFiles(req);
        const thumbnail = files?.thumbnail?.[0];

        let thumbnailId: string | undefined;

        if (thumbnail) {
            const uploadedThumbnail = await FileManager.upload(thumbnail);
            thumbnailId = uploadedThumbnail.id;
        }

        const application = await prisma.dVApplication.update({
            where: { id: req.params.id },
            data: {
                ...(name !== undefined && { name: String(name).trim() }),
                ...(description !== undefined && { description }),
                ...(price !== undefined && { price: Number(price) }),
                ...(currency !== undefined && { currency }),
                ...(serviceFee !== undefined && {
                    serviceFee: Number(serviceFee),
                }),
                ...(registrationFee !== undefined && {
                    registrationFee: Number(registrationFee),
                }),
                ...(dvYear !== undefined && { dvYear: Number(dvYear) }),
                ...(details !== undefined && { details }),
                ...(isActive !== undefined && { isActive }),
                ...(thumbnailId && { thumbnailId }),
            },
        });

        return res.status(200).json({
            status: 1,
            message: "DV application updated successfully",
            data: application,
        });
    }
);

/**
 * Update application status.
 * Admin only.
 */
export const updateDVApplicationStatus = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        if (!isAdmin(req)) {
            return next(new AppError("Admin access required", 403));
        }

        const { status } = req.body;

        if (
            !status ||
            !Object.values(DVApplicationStatus).includes(
                status as DVApplicationStatus
            )
        ) {
            return next(new AppError("Valid application status is required", 400));
        }

        const existing = await prisma.dVApplication.findUnique({
            where: { id: req.params.id },
            select: { id: true },
        });

        if (!existing) {
            return next(new AppError("DV application not found", 404));
        }

        const application = await prisma.dVApplication.update({
            where: { id: req.params.id },
            data: {
                status: status as DVApplicationStatus,
                ...(status === "SUBMITTED" && {
                    submittedAt: new Date(),
                }),
            },
        });

        return res.status(200).json({
            status: 1,
            message: "DV application status updated successfully",
            data: application,
        });
    }
);

/**
 * Delete an application.
 * Admin only.
 */
export const deleteDVApplication = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        if (!isAdmin(req)) {
            return next(new AppError("Admin access required", 403));
        }

        const application = await prisma.dVApplication.findUnique({
            where: { id: req.params.id },
            select: { id: true },
        });

        if (!application) {
            return next(new AppError("DV application not found", 404));
        }

        await prisma.dVApplication.delete({
            where: { id: req.params.id },
        });

        return res.status(200).json({
            status: 1,
            message: "DV application deleted successfully",
        });
    }
);
