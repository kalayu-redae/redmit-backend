import { Request, Response, NextFunction } from "express";
import { prisma } from "../../config/prisma.js";
import catchAsync from "../../utils/catchAsync.js";
import AppError from "../../utils/appError.js";
import { DVRequestType, DVRequestStatus } from "../../generated/prisma/enums.js";

const isAdmin = (req: Request) => req.user?.role === "ADMIN";

export const createDVApplicationRequest = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user?.id;
    const { dvProgramId, requestType } = req.body;
    let { needsInternationalPayment, applicantDetails } = req.body;

    if (!userId) return next(new AppError("Authentication required", 401));

    if (!dvProgramId || !requestType) {
        return next(new AppError("DV program and request type are required", 400));
    }

    if (!Object.values(DVRequestType).includes(requestType as DVRequestType)) {
        return next(new AppError("Invalid DV request type", 400));
    }

    if (needsInternationalPayment === undefined) {
        needsInternationalPayment = true;
    } else if (needsInternationalPayment === "true") {
        needsInternationalPayment = true;
    } else if (needsInternationalPayment === "false") {
        needsInternationalPayment = false;
    } else if (typeof needsInternationalPayment !== "boolean") {
        return next(new AppError("needsInternationalPayment must be a boolean", 400));
    }

    if (typeof applicantDetails === "string") {
        try {
            applicantDetails = JSON.parse(applicantDetails);
        } catch {
            return next(new AppError("applicantDetails must contain valid JSON", 400));
        }
    }

    if (
        applicantDetails !== undefined &&
        applicantDetails !== null &&
        (typeof applicantDetails !== "object" || Array.isArray(applicantDetails))
    ) {
        return next(new AppError("applicantDetails must be a JSON object", 400));
    }

    const program = await prisma.dVProgram.findUnique({
        where: { id: dvProgramId },
    });

    if (!program) return next(new AppError("DV program not found", 404));

    if (!program.isActive || !program.acceptingRequests) {
        return next(new AppError("This DV program is not currently accepting requests", 400));
    }

    const serviceFee = requestType === DVRequestType.PAYMENT_ASSISTANCE
        ? program.paymentAssistanceFee
        : program.formFillingFee;

    const internationalPaymentFee = needsInternationalPayment
        ? program.internationalPaymentFee
        : 0;

    const applicationRequest = await prisma.dVApplicationRequest.create({
        data: {
            userId,
            dvProgramId,
            requestType: requestType as DVRequestType,
            needsInternationalPayment,
            ...(applicantDetails !== undefined && { applicantDetails }),
            serviceFee,
            internationalPaymentFee,
            currency: program.currency,
            status: DVRequestStatus.PENDING_PAYMENT,
        },
        include: {
            dvProgram: {
                include: {
                    thumbnail: true,
                },
            },
            documents: {
                include: {
                    file: true,
                },
            },
            order: true,
        },
    });

    return res.status(201).json({
        status: 1,
        message: "DV application request created successfully",
        data: applicationRequest,
    });
});

export const getMyDVApplicationRequests = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user?.id;

    if (!userId) return next(new AppError("Authentication required", 401));

    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 10));
    const skip = (page - 1) * limit;

    const [requests, total] = await prisma.$transaction([
        prisma.dVApplicationRequest.findMany({
            where: { userId },
            skip,
            take: limit,
            orderBy: { createdAt: "desc" },
            include: {
                dvProgram: {
                    include: {
                        thumbnail: true,
                    },
                },
                documents: {
                    include: {
                        file: true,
                    },
                },
                order: true,
            },
        }),
        prisma.dVApplicationRequest.count({
            where: { userId },
        }),
    ]);

    return res.status(200).json({
        status: 1,
        message: "Your DV application requests retrieved successfully",
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
        data: requests,
    });
});

export const getAllDVApplicationRequests = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user?.id) return next(new AppError("Authentication required", 401));
    if (!isAdmin(req)) return next(new AppError("Admin access required", 403));

    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 10));
    const skip = (page - 1) * limit;

    const where: {
        status?: DVRequestStatus;
        requestType?: DVRequestType;
        dvProgramId?: string;
    } = {};

    if (req.query.status !== undefined) {
        if (!Object.values(DVRequestStatus).includes(req.query.status as DVRequestStatus)) {
            return next(new AppError("Invalid request status filter", 400));
        }

        where.status = req.query.status as DVRequestStatus;
    }

    if (req.query.requestType !== undefined) {
        if (!Object.values(DVRequestType).includes(req.query.requestType as DVRequestType)) {
            return next(new AppError("Invalid request type filter", 400));
        }

        where.requestType = req.query.requestType as DVRequestType;
    }

    if (req.query.dvProgramId !== undefined) {
        where.dvProgramId = String(req.query.dvProgramId);
    }

    const [requests, total] = await prisma.$transaction([
        prisma.dVApplicationRequest.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: "desc" },
            include: {
                user: {
                    select: {
                        id: true,
                        fullName: true,
                        email: true,
                        phone: true,
                    },
                },
                dvProgram: {
                    include: {
                        thumbnail: true,
                    },
                },
                documents: {
                    include: {
                        file: true,
                    },
                },
                order: true,
            },
        }),
        prisma.dVApplicationRequest.count({ where }),
    ]);

    return res.status(200).json({
        status: 1,
        message: "DV application requests retrieved successfully",
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
        data: requests,
    });
});

export const getDVApplicationRequest = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user?.id;

    if (!userId) return next(new AppError("Authentication required", 401));

    const applicationRequest = await prisma.dVApplicationRequest.findUnique({
        where: { id: String(req.params.id) },
        include: {
            user: {
                select: {
                    id: true,
                    fullName: true,
                    email: true,
                    phone: true,
                },
            },
            dvProgram: {
                include: {
                    thumbnail: true,
                },
            },
            documents: {
                include: {
                    file: true,
                },
            },
            order: true,
        },
    });

    if (!applicationRequest) {
        return next(new AppError("DV application request not found", 404));
    }

    if (applicationRequest.userId !== userId && !isAdmin(req)) {
        return next(new AppError("You are not authorized to access this request", 403));
    }

    return res.status(200).json({
        status: 1,
        message: "DV application request retrieved successfully",
        data: applicationRequest,
    });
});

export const updateDVApplicationRequestStatus = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user?.id) return next(new AppError("Authentication required", 401));
    if (!isAdmin(req)) return next(new AppError("Admin access required", 403));

    const { status, adminNotes } = req.body;

    if (!status) {
        return next(new AppError("Request status is required", 400));
    }

    if (!Object.values(DVRequestStatus).includes(status as DVRequestStatus)) {
        return next(new AppError("Invalid DV application request status", 400));
    }

    if (adminNotes !== undefined && typeof adminNotes !== "string") {
        return next(new AppError("adminNotes must be a string", 400));
    }

    const existingRequest = await prisma.dVApplicationRequest.findUnique({
        where: { id: String(req.params.id) },
    });

    if (!existingRequest) {
        return next(new AppError("DV application request not found", 404));
    }

    if (
        existingRequest.status === DVRequestStatus.CANCELLED ||
        existingRequest.status === DVRequestStatus.COMPLETED ||
        existingRequest.status === DVRequestStatus.REJECTED
    ) {
        return next(new AppError("This request is already in a final state", 400));
    }

    const updatedRequest = await prisma.dVApplicationRequest.update({
        where: { id: existingRequest.id },
        data: {
            status: status as DVRequestStatus,
            ...(adminNotes !== undefined && { adminNotes }),
        },
        include: {
            user: {
                select: {
                    id: true,
                    fullName: true,
                    email: true,
                    phone: true,
                },
            },
            dvProgram: true,
            documents: {
                include: {
                    file: true,
                },
            },
            order: true,
        },
    });

    return res.status(200).json({
        status: 1,
        message: "DV application request status updated successfully",
        data: updatedRequest,
    });
});

export const cancelDVApplicationRequest = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user?.id;

    if (!userId) return next(new AppError("Authentication required", 401));

    const existingRequest = await prisma.dVApplicationRequest.findUnique({
        where: { id: String(req.params.id) },
    });

    if (!existingRequest) {
        return next(new AppError("DV application request not found", 404));
    }

    if (existingRequest.userId !== userId && !isAdmin(req)) {
        return next(new AppError("You are not authorized to cancel this request", 403));
    }

    if (existingRequest.status !== DVRequestStatus.PENDING_PAYMENT) {
        return next(new AppError("Only requests awaiting payment can be cancelled", 400));
    }

    const cancelledRequest = await prisma.dVApplicationRequest.update({
        where: { id: existingRequest.id },
        data: {
            status: DVRequestStatus.CANCELLED,
        },
        include: {
            dvProgram: true,
            documents: {
                include: {
                    file: true,
                },
            },
            order: true,
        },
    });

    return res.status(200).json({
        status: 1,
        message: "DV application request cancelled successfully",
        data: cancelledRequest,
    });
});