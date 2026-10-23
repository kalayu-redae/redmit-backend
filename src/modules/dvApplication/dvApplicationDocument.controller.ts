import { Request, Response, NextFunction } from "express";
import { prisma } from "../../config/prisma.js";
import catchAsync from "../../utils/catchAsync.js";
import AppError from "../../utils/appError.js";
import FileManager from "../../utils/file/file.manager.js";
import { DVDocumentType } from "../../generated/prisma/enums.js";

const getUploadedFile = (req: Request) =>
    req.file as Express.Multer.File | undefined;

const isAdmin = (req: Request) => req.user?.role === "ADMIN";

const terminalStatuses = ["COMPLETED", "REJECTED", "CANCELLED"];

// ── UPLOAD DV DOCUMENT ────────────────────────────────────────────────────────

export const uploadDVApplicationDocument = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        const userId = req.user?.id;

        if (!userId) {
            return next(new AppError("Authentication required", 401));
        }

        const { requestId } = req.params as { requestId: string };
        const { documentType, subjectType, subjectIndex } = req.body;

        const file = getUploadedFile(req);

        if (!file) {
            return next(new AppError("Please upload a document", 400));
        }

        if (
            !documentType ||
            !Object.values(DVDocumentType).includes(documentType)
        ) {
            return next(new AppError("Valid documentType is required", 400));
        }

        if (
            subjectType !== undefined &&
            subjectType !== "" &&
            !["APPLICANT", "SPOUSE", "CHILD"].includes(subjectType)
        ) {
            return next(
                new AppError(
                    "subjectType must be APPLICANT, SPOUSE, or CHILD",
                    400,
                ),
            );
        }

        let parsedSubjectIndex: number | null = null;

        if (subjectIndex !== undefined && subjectIndex !== "") {
            parsedSubjectIndex = Number(subjectIndex);

            if (
                !Number.isInteger(parsedSubjectIndex) ||
                parsedSubjectIndex < 0
            ) {
                return next(
                    new AppError(
                        "subjectIndex must be a non-negative integer",
                        400,
                    ),
                );
            }
        }

        const request = await prisma.dVApplicationRequest.findUnique({
            where: { id: requestId },
            select: {
                id: true,
                userId: true,
                status: true,
            },
        });

        if (!request) {
            return next(
                new AppError("DV application request not found", 404),
            );
        }

        if (!isAdmin(req) && request.userId !== userId) {
            return next(
                new AppError(
                    "You are not allowed to upload documents for this request",
                    403,
                ),
            );
        }

        if (terminalStatuses.includes(request.status)) {
            return next(
                new AppError(
                    "Documents cannot be uploaded to a closed request",
                    409,
                ),
            );
        }

        const allowedMimeTypes = [
            "image/jpeg",
            "image/png",
            "image/webp",
            "application/pdf",
        ];

        if (!allowedMimeTypes.includes(file.mimetype)) {
            return next(
                new AppError(
                    "Only JPEG, PNG, WebP, and PDF documents are allowed",
                    400,
                ),
            );
        }

        // Store sensitive DV documents privately.
        const uploadedFile = await FileManager.upload(file, false);

        try {
            const document = await prisma.dVApplicationDocument.create({
                data: {
                    requestId: request.id,
                    fileId: uploadedFile.id,
                    documentType: documentType as DVDocumentType,
                    subjectType: subjectType || null,
                    subjectIndex: parsedSubjectIndex,
                },
                include: {
                    file: {
                        select: {
                            id: true,
                            originalName: true,
                            filename: true,
                            mimeType: true,
                            url: true,
                            visibility: true,
                            createdAt: true,
                        },
                    },
                },
            });

            return res.status(201).json({
                status: 1,
                message: "DV document uploaded successfully",
                data: document,
            });
        } catch (error) {
            // Clean up the stored file if creating its document record fails.
            await FileManager.delete(uploadedFile.id).catch(() => undefined);
            throw error;
        }
    },
);

// ── GET DOCUMENTS FOR A DV REQUEST ────────────────────────────────────────────

export const getDVApplicationDocuments = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        const userId = req.user?.id;

        if (!userId) {
            return next(new AppError("Authentication required", 401));
        }

        const { requestId } = req.params as { requestId: string };

        const request = await prisma.dVApplicationRequest.findUnique({
            where: { id: requestId },
            select: {
                id: true,
                userId: true,
            },
        });

        if (!request) {
            return next(
                new AppError("DV application request not found", 404),
            );
        }

        if (!isAdmin(req) && request.userId !== userId) {
            return next(
                new AppError(
                    "You are not allowed to view documents for this request",
                    403,
                ),
            );
        }

        const documents = await prisma.dVApplicationDocument.findMany({
            where: { requestId: request.id },
            orderBy: { createdAt: "desc" },
            include: {
                file: {
                    select: {
                        id: true,
                        originalName: true,
                        filename: true,
                        mimeType: true,
                        url: true,
                        visibility: true,
                        createdAt: true,
                    },
                },
            },
        });

        return res.status(200).json({
            status: 1,
            message: "DV application documents retrieved successfully",
            data: documents,
        });
    },
);

// ── DELETE DV DOCUMENT ───────────────────────────────────────────────────────

export const deleteDVApplicationDocument = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        const userId = req.user?.id;

        if (!userId) {
            return next(new AppError("Authentication required", 401));
        }

        const { id } = req.params as { id: string };

        const document = await prisma.dVApplicationDocument.findUnique({
            where: { id },
            include: {
                request: {
                    select: {
                        id: true,
                        userId: true,
                        status: true,
                    },
                },
            },
        });

        if (!document) {
            return next(new AppError("DV document not found", 404));
        }

        if (!isAdmin(req) && document.request.userId !== userId) {
            return next(
                new AppError(
                    "You are not allowed to delete this document",
                    403,
                ),
            );
        }

        if (
            !isAdmin(req) &&
            terminalStatuses.includes(document.request.status)
        ) {
            return next(
                new AppError(
                    "Documents cannot be deleted from a closed request",
                    409,
                ),
            );
        }

        // Remove the document record and its associated stored file.
        await prisma.dVApplicationDocument.delete({
            where: { id: document.id },
        });

        await FileManager.delete(document.fileId);

        return res.status(200).json({
            status: 1,
            message: "DV document deleted successfully",
        });
    },
);