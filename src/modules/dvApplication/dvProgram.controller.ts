import { Request, Response, NextFunction } from "express";
import { prisma } from "../../config/prisma.js";
import catchAsync from "../../utils/catchAsync.js";
import AppError from "../../utils/appError.js";
import FileManager from "../../utils/file/file.manager.js";

const isAdmin = (req: Request) => req.user?.role === "ADMIN";


export const createDVProgram = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user?.id) return next(new AppError("Authentication required", 401));
    if (!isAdmin(req)) return next(new AppError("Admin access required", 403));

    const {
        dvYear,
        startDate,
        endDate,
        paymentAssistanceFee,
        formFillingFee,
        internationalPaymentFee,
        currency,
    } = req.body;

    if (!dvYear || !startDate || !endDate) {
        return next(new AppError("DV year, start date and end date are required", 400));
    }

    const year = Number(dvYear);
    if (!Number.isInteger(year) || year < 2000 || year > 9999) {
        return next(new AppError("DV year must be a valid year", 400));
    }

    const parsedStartDate = new Date(startDate);
    const parsedEndDate = new Date(endDate);

    if (Number.isNaN(parsedStartDate.getTime()) || Number.isNaN(parsedEndDate.getTime())) {
        return next(new AppError("Invalid start or end date", 400));
    }

    if (parsedEndDate <= parsedStartDate) {
        return next(new AppError("End date must be after start date", 400));
    }

    const fees = {
        paymentAssistanceFee: Number(paymentAssistanceFee ?? 0),
        formFillingFee: Number(formFillingFee ?? 0),
        internationalPaymentFee: Number(internationalPaymentFee ?? 0),
    };

    if (Object.values(fees).some(fee => !Number.isFinite(fee) || fee < 0)) {
        return next(new AppError("Fees must be valid non-negative numbers", 400));
    }

    const existingProgram = await prisma.dVProgram.findUnique({
        where: { dvYear: year },
    });

    if (existingProgram) {
        return next(new AppError("A DV program for this year already exists", 409));
    }

    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
    const thumbnail = files?.thumbnail?.[0];

    let thumbnailId: string | undefined;

    if (thumbnail) {
        const uploadedFile = await FileManager.upload(thumbnail);
        thumbnailId = uploadedFile.id;
    }

    try {
        const program = await prisma.dVProgram.create({
            data: {
                dvYear: year,
                startDate: parsedStartDate,
                endDate: parsedEndDate,
                ...fees,
                currency: currency || "ETB",
                isActive: false,
                acceptingRequests: false,
                ...(thumbnailId && { thumbnailId }),
            },
            include: {
                thumbnail: true,
                _count: { select: { requests: true } },
            },
        });

        return res.status(201).json({
            status: 1,
            message: "DV program created successfully",
            data: program,
        });
    } catch (error) {
        if (thumbnailId) await FileManager.delete(thumbnailId);
        throw error;
    }
});

export const getDVPrograms = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 10));
    const skip = (page - 1) * limit;

    const where: {
        isActive?: boolean;
        acceptingRequests?: boolean;
        dvYear?: number;
    } = {};

    const admin = isAdmin(req);

    if (!admin) {
        where.isActive = true;
    } else {
        if (req.query.isActive !== undefined) {
            where.isActive = req.query.isActive === "true";
        }

        if (req.query.acceptingRequests !== undefined) {
            where.acceptingRequests = req.query.acceptingRequests === "true";
        }
    }

    if (req.query.dvYear !== undefined) {
        const year = Number(req.query.dvYear);

        if (!Number.isInteger(year)) {
            return next(new AppError("DV year must be a valid integer", 400));
        }

        where.dvYear = year;
    }

    const [programs, total] = await prisma.$transaction([
        prisma.dVProgram.findMany({
            where,
            skip,
            take: limit,
            orderBy: { dvYear: "desc" },
            include: {
                thumbnail: true,
                _count: { select: { requests: true } },
            },
        }),
        prisma.dVProgram.count({ where }),
    ]);

    return res.status(200).json({
        status: 1,
        message: "DV programs retrieved successfully",
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
        data: programs,
    });
});

export const getDVProgram = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const program = await prisma.dVProgram.findUnique({
        where: { id: String(req.params.id) },
        include: {
            thumbnail: true,
            _count: { select: { requests: true } },
        },
    });

    if (!program) return next(new AppError("DV program not found", 404));

    if (!program.isActive && !isAdmin(req)) {
        return next(new AppError("DV program not found", 404));
    }

    return res.status(200).json({
        status: 1,
        message: "DV program retrieved successfully",
        data: program,
    });
});

export const updateDVProgram = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user?.id) return next(new AppError("Authentication required", 401));
    if (!isAdmin(req)) return next(new AppError("Admin access required", 403));

    const existingProgram = await prisma.dVProgram.findUnique({
        where: { id: String(req.params.id) },
    });

    if (!existingProgram) return next(new AppError("DV program not found", 404));

    const {
        dvYear,
        startDate,
        endDate,
        paymentAssistanceFee,
        formFillingFee,
        internationalPaymentFee,
        currency,
    } = req.body;

    const data: Record<string, unknown> = {};

    if (dvYear !== undefined) {
        const year = Number(dvYear);

        if (!Number.isInteger(year) || year < 2000 || year > 9999) {
            return next(new AppError("DV year must be a valid year", 400));
        }

        const duplicateYear = await prisma.dVProgram.findFirst({
            where: { dvYear: year, NOT: { id: existingProgram.id } },
        });

        if (duplicateYear) {
            return next(new AppError("A DV program for this year already exists", 409));
        }

        data.dvYear = year;
    }

    const parsedStartDate = startDate !== undefined ? new Date(startDate) : existingProgram.startDate;
    const parsedEndDate = endDate !== undefined ? new Date(endDate) : existingProgram.endDate;

    if (startDate !== undefined && Number.isNaN(parsedStartDate.getTime())) {
        return next(new AppError("Invalid start date", 400));
    }

    if (endDate !== undefined && Number.isNaN(parsedEndDate.getTime())) {
        return next(new AppError("Invalid end date", 400));
    }

    if (parsedEndDate <= parsedStartDate) {
        return next(new AppError("End date must be after start date", 400));
    }

    if (startDate !== undefined) data.startDate = parsedStartDate;
    if (endDate !== undefined) data.endDate = parsedEndDate;

    const feeFields = {
        paymentAssistanceFee,
        formFillingFee,
        internationalPaymentFee,
    };

    for (const [key, value] of Object.entries(feeFields)) {
        if (value !== undefined) {
            const fee = Number(value);

            if (!Number.isFinite(fee) || fee < 0) {
                return next(new AppError(`${key} must be a valid non-negative number`, 400));
            }

            data[key] = fee;
        }
    }

    if (currency !== undefined) {
        if (typeof currency !== "string" || !currency.trim()) {
            return next(new AppError("Currency must be a non-empty string", 400));
        }

        data.currency = currency.trim().toUpperCase();
    }

    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
    const thumbnail = files?.thumbnail?.[0];

    let uploadedThumbnailId: string | undefined;

    if (thumbnail) {
        const uploadedFile = await FileManager.upload(thumbnail);
        uploadedThumbnailId = uploadedFile.id;
        data.thumbnailId = uploadedThumbnailId;
    }

    try {
        const program = await prisma.dVProgram.update({
            where: { id: existingProgram.id },
            data,
            include: {
                thumbnail: true,
                _count: { select: { requests: true } },
            },
        });

        return res.status(200).json({
            status: 1,
            message: "DV program updated successfully",
            data: program,
        });
    } catch (error) {
        if (uploadedThumbnailId) await FileManager.delete(uploadedThumbnailId);
        throw error;
    }
});

export const updateDVProgramStatus = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user?.id) return next(new AppError("Authentication required", 401));
    if (!isAdmin(req)) return next(new AppError("Admin access required", 403));

    const { isActive, acceptingRequests } = req.body;

    if (isActive === undefined && acceptingRequests === undefined) {
        return next(new AppError("Provide isActive or acceptingRequests", 400));
    }

    if (
        (isActive !== undefined && typeof isActive !== "boolean") ||
        (acceptingRequests !== undefined && typeof acceptingRequests !== "boolean")
    ) {
        return next(new AppError("Status fields must be boolean values", 400));
    }

    const existingProgram = await prisma.dVProgram.findUnique({
        where: { id: String(req.params.id) },
    });

    if (!existingProgram) return next(new AppError("DV program not found", 404));

    const nextIsActive = isActive ?? existingProgram.isActive;
    const nextAcceptingRequests = isActive === false ? false : acceptingRequests ?? existingProgram.acceptingRequests;

    if (nextAcceptingRequests && !nextIsActive) {
        return next(new AppError("An inactive DV program cannot accept requests", 400));
    }

    const program = await prisma.dVProgram.update({
        where: { id: existingProgram.id },
        data: {
            ...(isActive !== undefined && { isActive }),
            acceptingRequests: nextAcceptingRequests,
        },
        include: {
            thumbnail: true,
            _count: { select: { requests: true } },
        },
    });

    return res.status(200).json({
        status: 1,
        message: "DV program status updated successfully",
        data: program,
    });
});

export const deleteDVProgram = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user?.id) return next(new AppError("Authentication required", 401));
    if (!isAdmin(req)) return next(new AppError("Admin access required", 403));

    const program = await prisma.dVProgram.findUnique({
        where: { id: String(req.params.id) },
        include: { _count: { select: { requests: true } } },
    });

    if (!program) return next(new AppError("DV program not found", 404));

    if (program._count.requests > 0) {
        return next(new AppError("Cannot delete a DV program with existing requests", 409));
    }

    await prisma.dVProgram.delete({
        where: { id: program.id },
    });

    if (program.thumbnailId) {
        await FileManager.delete(program.thumbnailId);
    }

    return res.status(200).json({
        status: 1,
        message: "DV program deleted successfully",
        data: null,
    });
});
