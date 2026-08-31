import { prisma } from "../../config/prisma.js";
import catchAsync from "../../utils/catchAsync.js";
import AppError from "../../utils/appError.js";
import FileManager from "../../utils/file/file.manager.js";
const buildSlug = (value) => value.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^\w-]/g, "");
const parseDetails = (details) => {
    if (!details)
        return {};
    if (typeof details === "object")
        return details;
    try {
        return JSON.parse(details);
    }
    catch {
        return {};
    }
};
const getUploadedFiles = (req) => req.files;
export const createDigitalAccess = catchAsync(async (req, res, next) => {
    const providerId = req.user?.id;
    if (!providerId)
        return next(new AppError("Authentication required", 401));
    const { name, slug, type, description, price, currency, details } = req.body;
    if (!name || !type || price === undefined)
        return next(new AppError("Name, type and price are required", 400));
    const accessSlug = buildSlug(slug || name);
    const existingAccess = await prisma.digitalAccess.findUnique({ where: { slug: accessSlug } });
    if (existingAccess)
        return next(new AppError("Access slug already exists", 409));
    const files = getUploadedFiles(req);
    const thumbnailFile = files?.thumbnail?.[0];
    const accessFiles = files?.files || [];
    let thumbnailId = null;
    if (thumbnailFile) {
        const uploadedThumbnail = await FileManager.upload(thumbnailFile);
        thumbnailId = uploadedThumbnail.id;
    }
    const access = await prisma.digitalAccess.create({
        data: {
            providerId,
            name: name.trim(),
            slug: accessSlug,
            type,
            description: description || null,
            price: Number(price),
            currency: currency || "USD",
            thumbnailId,
            details: parseDetails(details),
        },
    });
    if (accessFiles.length > 0) {
        const uploadedFiles = await Promise.all(accessFiles.map(file => FileManager.upload(file)));
        await prisma.digitalAccess.update({
            where: { id: access.id },
            data: { files: { connect: uploadedFiles.map(file => ({ id: file.id })) } },
        });
    }
    const result = await prisma.digitalAccess.findUnique({
        where: { id: access.id },
        include: {
            provider: { select: { id: true, username: true, fullName: true } },
            thumbnail: true,
            files: true,
        },
    });
    return res.status(201).json({ status: 1, message: "Digital access created successfully", data: result });
});
export const getDigitalAccesses = catchAsync(async (req, res, next) => {
    const { page = 1, limit = 10, search, type, providerId, minPrice, maxPrice, isActive, sortBy = "createdAt", order = "desc" } = req.query;
    const pageNumber = Math.max(Number(page), 1);
    const limitNumber = Math.max(Number(limit), 1);
    const where = {};
    if (search) {
        where.OR = [
            { name: { contains: String(search), mode: "insensitive" } },
            { description: { contains: String(search), mode: "insensitive" } },
        ];
    }
    if (type)
        where.type = String(type);
    if (providerId)
        where.providerId = String(providerId);
    if (isActive !== undefined)
        where.isActive = String(isActive) === "true";
    if (minPrice !== undefined || maxPrice !== undefined) {
        where.price = {
            ...(minPrice !== undefined && { gte: Number(minPrice) }),
            ...(maxPrice !== undefined && { lte: Number(maxPrice) }),
        };
    }
    const allowedSortFields = ["name", "price", "createdAt", "updatedAt"];
    const safeSortBy = allowedSortFields.includes(String(sortBy)) ? String(sortBy) : "createdAt";
    const safeOrder = String(order).toLowerCase() === "asc" ? "asc" : "desc";
    const [accesses, total] = await Promise.all([
        prisma.digitalAccess.findMany({
            where,
            orderBy: { [safeSortBy]: safeOrder },
            skip: (pageNumber - 1) * limitNumber,
            take: limitNumber,
            include: {
                provider: { select: { id: true, username: true, fullName: true } },
                thumbnail: true,
            },
        }),
        prisma.digitalAccess.count({ where }),
    ]);
    return res.status(200).json({
        status: 1,
        message: "Digital accesses retrieved successfully",
        pagination: { total, page: pageNumber, limit: limitNumber, totalPages: Math.ceil(total / limitNumber) },
        data: accesses,
    });
});
export const getDigitalAccess = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const access = await prisma.digitalAccess.findUnique({
        where: { id },
        include: {
            provider: { select: { id: true, username: true, fullName: true } },
            thumbnail: true,
            files: true,
        },
    });
    if (!access)
        return next(new AppError("Digital access not found", 404));
    return res.status(200).json({ status: 1, message: "Digital access retrieved successfully", data: access });
});
export const getMyDigitalAccesses = catchAsync(async (req, res, next) => {
    const providerId = req.user?.id;
    if (!providerId)
        return next(new AppError("Authentication required", 401));
    const accesses = await prisma.digitalAccess.findMany({
        where: { providerId },
        orderBy: { createdAt: "desc" },
        include: {
            thumbnail: true,
            files: true,
        },
    });
    return res.status(200).json({ status: 1, message: "Your digital accesses retrieved successfully", data: accesses });
});
export const updateDigitalAccess = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const providerId = req.user?.id;
    if (!providerId)
        return next(new AppError("Authentication required", 401));
    const access = await prisma.digitalAccess.findUnique({ where: { id } });
    if (!access)
        return next(new AppError("Digital access not found", 404));
    if (access.providerId !== providerId)
        return next(new AppError("You are not allowed to update this access", 403));
    const { name, slug, type, description, price, currency, details } = req.body;
    const files = getUploadedFiles(req);
    const thumbnailFile = files?.thumbnail?.[0];
    const accessFiles = files?.files || [];
    let thumbnailId = access.thumbnailId;
    if (thumbnailFile) {
        const uploadedThumbnail = await FileManager.upload(thumbnailFile);
        thumbnailId = uploadedThumbnail.id;
    }
    let newSlug = access.slug;
    if (slug !== undefined) {
        newSlug = buildSlug(slug);
        if (newSlug !== access.slug) {
            const existingAccess = await prisma.digitalAccess.findUnique({ where: { slug: newSlug } });
            if (existingAccess)
                return next(new AppError("Access slug already exists", 409));
        }
    }
    await prisma.digitalAccess.update({
        where: { id },
        data: {
            ...(name !== undefined && { name: name.trim() }),
            ...(slug !== undefined && { slug: newSlug }),
            ...(type !== undefined && { type }),
            ...(description !== undefined && { description }),
            ...(price !== undefined && { price: Number(price) }),
            ...(currency !== undefined && { currency }),
            ...(details !== undefined && { details: parseDetails(details) }),
            ...(thumbnailId !== access.thumbnailId && { thumbnailId }),
        },
    });
    if (accessFiles.length > 0) {
        const uploadedFiles = await Promise.all(accessFiles.map(file => FileManager.upload(file)));
        await prisma.digitalAccess.update({
            where: { id },
            data: { files: { connect: uploadedFiles.map(file => ({ id: file.id })) } },
        });
    }
    const result = await prisma.digitalAccess.findUnique({
        where: { id },
        include: {
            provider: { select: { id: true, username: true, fullName: true } },
            thumbnail: true,
            files: true,
        },
    });
    return res.status(200).json({ status: 1, message: "Digital access updated successfully", data: result });
});
export const updateDigitalAccessStatus = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const providerId = req.user?.id;
    if (!providerId)
        return next(new AppError("Authentication required", 401));
    const access = await prisma.digitalAccess.findUnique({ where: { id } });
    if (!access)
        return next(new AppError("Digital access not found", 404));
    if (access.providerId !== providerId)
        return next(new AppError("You are not allowed to update this access", 403));
    const updatedAccess = await prisma.digitalAccess.update({
        where: { id },
        data: { isActive: !access.isActive },
    });
    return res.status(200).json({
        status: 1,
        message: `Digital access ${updatedAccess.isActive ? "activated" : "deactivated"} successfully`,
        data: updatedAccess,
    });
});
export const deleteDigitalAccess = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const providerId = req.user?.id;
    if (!providerId)
        return next(new AppError("Authentication required", 401));
    const access = await prisma.digitalAccess.findUnique({ where: { id } });
    if (!access)
        return next(new AppError("Digital access not found", 404));
    if (access.providerId !== providerId)
        return next(new AppError("You are not allowed to delete this access", 403));
    await prisma.digitalAccess.delete({ where: { id } });
    return res.status(200).json({ status: 1, message: "Digital access deleted successfully" });
});
