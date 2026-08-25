import { Request, Response, NextFunction } from "express";
import { prisma } from "../../config/prisma.js";
import catchAsync from "../../utils/catchAsync.js";
import AppError from "../../utils/appError.js";
import FileManager from "../../utils/file/file.manager.js";

const buildSlug = (value: string) => value.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^\w-]/g, "");

const parseDetails = (details: any) => {
    if (!details) return {};
    if (typeof details === "object") return details;
    try { return JSON.parse(details); } catch { return {}; }
};

const getUploadedFiles = (req: Request) => req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;

export const createDigitalGrowth = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const providerId = req.user?.id;
    if (!providerId) return next(new AppError("Authentication required", 401));

    const { name, slug, type, description, price, currency, details } = req.body;
    if (!name || !type || price === undefined) return next(new AppError("Name, type and price are required", 400));

    const growthSlug = buildSlug(slug || name);
    const existingGrowth = await prisma.digitalGrowth.findUnique({ where: { slug: growthSlug } });
    if (existingGrowth) return next(new AppError("Growth service slug already exists", 409));

    const files = getUploadedFiles(req);
    const thumbnailFile = files?.thumbnail?.[0];
    const growthFiles = files?.files || [];

    let thumbnailId: string | null = null;

    if (thumbnailFile) {
        const uploadedThumbnail = await FileManager.upload(thumbnailFile);
        thumbnailId = uploadedThumbnail.id;
    }

    const growth = await prisma.digitalGrowth.create({
        data: {
            providerId,
            name: name.trim(),
            slug: growthSlug,
            type,
            description: description || null,
            price: Number(price),
            currency: currency || "USD",
            thumbnailId,
            details: parseDetails(details),
        },
    });

    if (growthFiles.length > 0) {
        const uploadedFiles = await Promise.all(growthFiles.map(file => FileManager.upload(file)));
        await prisma.digitalGrowth.update({
            where: { id: growth.id },
            data: { files: { connect: uploadedFiles.map(file => ({ id: file.id })) } },
        });
    }

    const result = await prisma.digitalGrowth.findUnique({
        where: { id: growth.id },
        include: {
            provider: { select: { id: true, username: true, fullName: true } },
            thumbnail: true,
            files: true,
        },
    });

    return res.status(201).json({ status: 1, message: "Digital growth created successfully", data: result });
});

export const getDigitalGrowths = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { page = 1, limit = 10, search, type, providerId, minPrice, maxPrice, isActive, sortBy = "createdAt", order = "desc" } = req.query;

    const pageNumber = Math.max(Number(page), 1);
    const limitNumber = Math.max(Number(limit), 1);
    const where: any = {};

    if (search) {
        where.OR = [
            { name: { contains: String(search), mode: "insensitive" } },
            { description: { contains: String(search), mode: "insensitive" } },
        ];
    }

    if (type) where.type = String(type);
    if (providerId) where.providerId = String(providerId);
    if (isActive !== undefined) where.isActive = String(isActive) === "true";

    if (minPrice !== undefined || maxPrice !== undefined) {
        where.price = {
            ...(minPrice !== undefined && { gte: Number(minPrice) }),
            ...(maxPrice !== undefined && { lte: Number(maxPrice) }),
        };
    }

    const allowedSortFields = ["name", "price", "createdAt", "updatedAt"];
    const safeSortBy = allowedSortFields.includes(String(sortBy)) ? String(sortBy) : "createdAt";
    const safeOrder = String(order).toLowerCase() === "asc" ? "asc" : "desc";

    const [growths, total] = await Promise.all([
        prisma.digitalGrowth.findMany({
            where,
            orderBy: { [safeSortBy]: safeOrder },
            skip: (pageNumber - 1) * limitNumber,
            take: limitNumber,
            include: {
                provider: { select: { id: true, username: true, fullName: true } },
                thumbnail: true,
            },
        }),
        prisma.digitalGrowth.count({ where }),
    ]);

    return res.status(200).json({
        status: 1,
        message: "Digital growth services retrieved successfully",
        pagination: { total, page: pageNumber, limit: limitNumber, totalPages: Math.ceil(total / limitNumber) },
        data: growths,
    });
});

export const getDigitalGrowth = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params as { id: string };

    const growth = await prisma.digitalGrowth.findUnique({
        where: { id },
        include: {
            provider: { select: { id: true, username: true, fullName: true } },
            thumbnail: true,
            files: true,
        },
    });

    if (!growth) return next(new AppError("Digital growth service not found", 404));

    return res.status(200).json({ status: 1, message: "Digital growth service retrieved successfully", data: growth });
});

export const getMyDigitalGrowths = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const providerId = req.user?.id;
    if (!providerId) return next(new AppError("Authentication required", 401));

    const growths = await prisma.digitalGrowth.findMany({
        where: { providerId },
        orderBy: { createdAt: "desc" },
        include: {
            thumbnail: true,
            files: true,
        },
    });

    return res.status(200).json({ status: 1, message: "Your digital growth services retrieved successfully", data: growths });
});

export const updateDigitalGrowth = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params as { id: string };
    const providerId = req.user?.id;

    if (!providerId) return next(new AppError("Authentication required", 401));

    const growth = await prisma.digitalGrowth.findUnique({ where: { id } });
    if (!growth) return next(new AppError("Digital growth service not found", 404));
    if (growth.providerId !== providerId) return next(new AppError("You are not allowed to update this service", 403));

    const { name, slug, type, description, price, currency, details } = req.body;
    const files = getUploadedFiles(req);
    const thumbnailFile = files?.thumbnail?.[0];
    const growthFiles = files?.files || [];

    let thumbnailId = growth.thumbnailId;

    if (thumbnailFile) {
        const uploadedThumbnail = await FileManager.upload(thumbnailFile);
        thumbnailId = uploadedThumbnail.id;
    }

    let newSlug = growth.slug;

    if (slug !== undefined) {
        newSlug = buildSlug(slug);

        if (newSlug !== growth.slug) {
            const existingGrowth = await prisma.digitalGrowth.findUnique({ where: { slug: newSlug } });
            if (existingGrowth) return next(new AppError("Growth service slug already exists", 409));
        }
    }

    await prisma.digitalGrowth.update({
        where: { id },
        data: {
            ...(name !== undefined && { name: name.trim() }),
            ...(slug !== undefined && { slug: newSlug }),
            ...(type !== undefined && { type }),
            ...(description !== undefined && { description }),
            ...(price !== undefined && { price: Number(price) }),
            ...(currency !== undefined && { currency }),
            ...(details !== undefined && { details: parseDetails(details) }),
            ...(thumbnailId !== growth.thumbnailId && { thumbnailId }),
        },
    });

    if (growthFiles.length > 0) {
        const uploadedFiles = await Promise.all(growthFiles.map(file => FileManager.upload(file)));
        await prisma.digitalGrowth.update({
            where: { id },
            data: { files: { connect: uploadedFiles.map(file => ({ id: file.id })) } },
        });
    }

    const result = await prisma.digitalGrowth.findUnique({
        where: { id },
        include: {
            provider: { select: { id: true, username: true, fullName: true } },
            thumbnail: true,
            files: true,
        },
    });

    return res.status(200).json({ status: 1, message: "Digital growth service updated successfully", data: result });
});

export const updateDigitalGrowthStatus = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params as { id: string };
    const providerId = req.user?.id;

    if (!providerId) return next(new AppError("Authentication required", 401));

    const growth = await prisma.digitalGrowth.findUnique({ where: { id } });
    if (!growth) return next(new AppError("Digital growth service not found", 404));
    if (growth.providerId !== providerId) return next(new AppError("You are not allowed to update this service", 403));

    const updatedGrowth = await prisma.digitalGrowth.update({
        where: { id },
        data: { isActive: !growth.isActive },
    });

    return res.status(200).json({
        status: 1,
        message: `Digital growth service ${updatedGrowth.isActive ? "activated" : "deactivated"} successfully`,
        data: updatedGrowth,
    });
});

export const deleteDigitalGrowth = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params as { id: string };
    const providerId = req.user?.id;

    if (!providerId) return next(new AppError("Authentication required", 401));

    const growth = await prisma.digitalGrowth.findUnique({ where: { id } });
    if (!growth) return next(new AppError("Digital growth service not found", 404));
    if (growth.providerId !== providerId) return next(new AppError("You are not allowed to delete this service", 403));

    await prisma.digitalGrowth.delete({ where: { id } });

    return res.status(200).json({ status: 1, message: "Digital growth service deleted successfully" });
});