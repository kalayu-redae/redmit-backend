import { Request, Response, NextFunction } from "express";
import { prisma } from "../../config/prisma.js";
import catchAsync from "../../utils/catchAsync.js";
import AppError from "../../utils/appError.js";
import FileManager from "../../utils/file/file.manager.js";

const parseDetails = (details: any) => {
    if (!details) return {};
    if (typeof details === "object") return details;
    try {
        return JSON.parse(details);
    } catch {
        return {};
    }
};

const buildSlug = (value: string) => value.trim().toLowerCase().replace(/\s+/g, "-");

export const createDigitalAsset = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const sellerId = req.user?.id;
    if (!sellerId) return next(new AppError("Authentication required", 401));

    const { name, slug, type, description, price, currency, platform, username, profileUrl, followers, following, posts, views, country, niche, engagementRate, monthlyRevenue, revenueCurrency, category, url, otherPlatform, details } = req.body;

    if (!name || !type || price === undefined) return next(new AppError("Name, type and price are required", 400));

    const assetSlug = buildSlug(slug || name);
    const existingAsset = await prisma.digitalAsset.findUnique({ where: { slug: assetSlug } });
    if (existingAsset) return next(new AppError("Asset slug already exists", 409));

    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
    const thumbnailFile = files?.thumbnail?.[0];
    const assetFiles = files?.files || [];

    let thumbnailId: string | undefined;

    if (thumbnailFile) {
        const uploadedThumbnail = await FileManager.upload(thumbnailFile);
        thumbnailId = uploadedThumbnail.id;
    }

    const asset = await prisma.digitalAsset.create({
        data: {
            sellerId,
            name: name.trim(),
            slug: assetSlug,
            type,
            description: description || null,
            price: Number(price),
            currency: currency || "USD",
            thumbnailId: thumbnailId || null,
        },
    });

    if (type === "SOCIAL_MEDIA_ACCOUNT") {
        await prisma.socialMediaAsset.create({
            data: {
                assetId: asset.id,
                platform,
                username: username || null,
                profileUrl: profileUrl || null,
                followers: followers !== undefined ? Number(followers) : null,
                following: following !== undefined ? Number(following) : null,
                posts: posts !== undefined ? Number(posts) : null,
                views: views !== undefined ? Number(views) : null,
                country: country || null,
                niche: niche || null,
                engagementRate: engagementRate !== undefined ? Number(engagementRate) : null,
                monthlyRevenue: monthlyRevenue !== undefined ? Number(monthlyRevenue) : null,
                revenueCurrency: revenueCurrency || null,
            },
        });
    }

    if (type === "OTHER") {
        await prisma.otherAsset.create({
            data: {
                assetId: asset.id,
                category: category || null,
                url: url || null,
                platform: otherPlatform || null,
                details: parseDetails(details),
            },
        });
    }

    if (assetFiles.length > 0) {
        const uploadedFiles = await Promise.all(assetFiles.map(file => FileManager.upload(file)));
        await prisma.digitalAsset.update({
            where: { id: asset.id },
            data: { files: { connect: uploadedFiles.map(file => ({ id: file.id })) } },
        });
    }

    const createdAsset = await prisma.digitalAsset.findUnique({
        where: { id: asset.id },
        include: {
            seller: { select: { id: true, username: true, fullName: true } },
            thumbnail: true,
            files: true,
            socialMediaDetails: true,
            otherDetails: true,
        },
    });

    return res.status(201).json({ status: 1, message: "Digital asset created successfully", data: createdAsset });
});

export const getDigitalAssets = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { page = 1, limit = 10, search, type, sellerId, minPrice, maxPrice, isSold, isActive, sortBy = "createdAt", order = "desc" } = req.query;

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
    if (sellerId) where.sellerId = String(sellerId);
    if (isSold !== undefined) where.isSold = String(isSold) === "true";
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

    const [assets, total] = await Promise.all([
        prisma.digitalAsset.findMany({
            where,
            orderBy: { [safeSortBy]: safeOrder },
            skip: (pageNumber - 1) * limitNumber,
            take: limitNumber,
            include: {
                thumbnail: true,
                seller: { select: { id: true, username: true, fullName: true } },
                socialMediaDetails: true,
                otherDetails: true,
            },
        }),
        prisma.digitalAsset.count({ where }),
    ]);

    return res.status(200).json({
        status: 1,
        message: "Digital assets retrieved successfully",
        pagination: { total, page: pageNumber, limit: limitNumber, totalPages: Math.ceil(total / limitNumber) },
        data: assets,
    });
});

export const getDigitalAsset = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params as { id: string };

    const asset = await prisma.digitalAsset.findUnique({
        where: { id },
        include: {
            seller: { select: { id: true, username: true, fullName: true } },
            thumbnail: true,
            files: true,
            socialMediaDetails: true,
            otherDetails: true,
        },
    });

    if (!asset) return next(new AppError("Digital asset not found", 404));

    return res.status(200).json({ status: 1, data: asset });
});

export const getMyDigitalAssets = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const sellerId = req.user?.id;
    if (!sellerId) return next(new AppError("Authentication required", 401));

    const assets = await prisma.digitalAsset.findMany({
        where: { sellerId },
        orderBy: { createdAt: "desc" },
        include: {
            thumbnail: true,
            files: true,
            socialMediaDetails: true,
            otherDetails: true,
        },
    });

    return res.status(200).json({ status: 1, message: "Your digital assets retrieved successfully", data: assets });
});

export const updateDigitalAsset = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params as { id: string };
    const sellerId = req.user?.id;

    if (!sellerId) return next(new AppError("Authentication required", 401));

    const asset = await prisma.digitalAsset.findUnique({
        where: { id },
        include: { socialMediaDetails: true, otherDetails: true },
    });

    if (!asset) return next(new AppError("Digital asset not found", 404));
    if (asset.sellerId !== sellerId) return next(new AppError("You are not allowed to update this asset", 403));

    const { name, slug, type, description, price, currency, platform, username, profileUrl, followers, following, posts, views, country, niche, engagementRate, monthlyRevenue, revenueCurrency, category, url, otherPlatform, details } = req.body;

    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
    const thumbnailFile = files?.thumbnail?.[0];
    const assetFiles = files?.files || [];

    let thumbnailId = asset.thumbnailId;

    if (thumbnailFile) {
        const uploadedThumbnail = await FileManager.upload(thumbnailFile);
        thumbnailId = uploadedThumbnail.id;
    }

    let newSlug = asset.slug;

    if (slug !== undefined) {
        newSlug = buildSlug(slug);
        if (newSlug !== asset.slug) {
            const existingAsset = await prisma.digitalAsset.findUnique({ where: { slug: newSlug } });
            if (existingAsset) return next(new AppError("Asset slug already exists", 409));
        }
    }

    const updatedAsset = await prisma.digitalAsset.update({
        where: { id },
        data: {
            ...(name !== undefined && { name: name.trim() }),
            ...(slug !== undefined && { slug: newSlug }),
            ...(type !== undefined && { type }),
            ...(description !== undefined && { description }),
            ...(price !== undefined && { price: Number(price) }),
            ...(currency !== undefined && { currency }),
            ...(thumbnailId !== asset.thumbnailId && { thumbnailId }),
        },
    });

    const finalType = type || asset.type;

    if (finalType === "SOCIAL_MEDIA_ACCOUNT") {
        if (asset.otherDetails) await prisma.otherAsset.delete({ where: { assetId: id } });

        await prisma.socialMediaAsset.upsert({
            where: { assetId: id },
            create: {
                assetId: id,
                platform,
                username: username || null,
                profileUrl: profileUrl || null,
                followers: followers !== undefined ? Number(followers) : null,
                following: following !== undefined ? Number(following) : null,
                posts: posts !== undefined ? Number(posts) : null,
                views: views !== undefined ? Number(views) : null,
                country: country || null,
                niche: niche || null,
                engagementRate: engagementRate !== undefined ? Number(engagementRate) : null,
                monthlyRevenue: monthlyRevenue !== undefined ? Number(monthlyRevenue) : null,
                revenueCurrency: revenueCurrency || null,
            },
            update: {
                ...(platform !== undefined && { platform }),
                ...(username !== undefined && { username }),
                ...(profileUrl !== undefined && { profileUrl }),
                ...(followers !== undefined && { followers: Number(followers) }),
                ...(following !== undefined && { following: Number(following) }),
                ...(posts !== undefined && { posts: Number(posts) }),
                ...(views !== undefined && { views: Number(views) }),
                ...(country !== undefined && { country }),
                ...(niche !== undefined && { niche }),
                ...(engagementRate !== undefined && { engagementRate: Number(engagementRate) }),
                ...(monthlyRevenue !== undefined && { monthlyRevenue: Number(monthlyRevenue) }),
                ...(revenueCurrency !== undefined && { revenueCurrency }),
            },
        });
    }

    if (finalType === "OTHER") {
        if (asset.socialMediaDetails) await prisma.socialMediaAsset.delete({ where: { assetId: id } });

        await prisma.otherAsset.upsert({
            where: { assetId: id },
            create: {
                assetId: id,
                category: category || null,
                url: url || null,
                platform: otherPlatform || null,
                details: parseDetails(details),
            },
            update: {
                ...(category !== undefined && { category }),
                ...(url !== undefined && { url }),
                ...(otherPlatform !== undefined && { platform: otherPlatform }),
                ...(details !== undefined && { details: parseDetails(details) }),
            },
        });
    }

    if (assetFiles.length > 0) {
        const uploadedFiles = await Promise.all(assetFiles.map(file => FileManager.upload(file)));
        await prisma.digitalAsset.update({
            where: { id },
            data: { files: { connect: uploadedFiles.map(file => ({ id: file.id })) } },
        });
    }

    const result = await prisma.digitalAsset.findUnique({
        where: { id },
        include: {
            seller: { select: { id: true, username: true, fullName: true } },
            thumbnail: true,
            files: true,
            socialMediaDetails: true,
            otherDetails: true,
        },
    });

    return res.status(200).json({ status: 1, message: "Digital asset updated successfully", data: result });
});

export const updateDigitalAssetStatus = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params as { id: string };
    const sellerId = req.user?.id;

    if (!sellerId) return next(new AppError("Authentication required", 401));

    const asset = await prisma.digitalAsset.findUnique({ where: { id } });
    if (!asset) return next(new AppError("Digital asset not found", 404));
    if (asset.sellerId !== sellerId) return next(new AppError("You are not allowed to update this asset", 403));

    const updatedAsset = await prisma.digitalAsset.update({
        where: { id },
        data: { isActive: !asset.isActive },
    });

    return res.status(200).json({
        status: 1,
        message: `Digital asset ${updatedAsset.isActive ? "activated" : "deactivated"} successfully`,
        data: updatedAsset,
    });
});

export const markDigitalAssetAsSold = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params as { id: string };
    const sellerId = req.user?.id;

    if (!sellerId) return next(new AppError("Authentication required", 401));

    const asset = await prisma.digitalAsset.findUnique({ where: { id } });
    if (!asset) return next(new AppError("Digital asset not found", 404));
    if (asset.sellerId !== sellerId) return next(new AppError("You are not allowed to update this asset", 403));

    const updatedAsset = await prisma.digitalAsset.update({
        where: { id },
        data: { isSold: true, isActive: false },
    });

    return res.status(200).json({ status: 1, message: "Digital asset marked as sold", data: updatedAsset });
});

export const deleteDigitalAsset = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params as { id: string };
    const sellerId = req.user?.id;

    if (!sellerId) return next(new AppError("Authentication required", 401));

    const asset = await prisma.digitalAsset.findUnique({
        where: { id },
        include: { files: true },
    });

    if (!asset) return next(new AppError("Digital asset not found", 404));
    if (asset.sellerId !== sellerId) return next(new AppError("You are not allowed to delete this asset", 403));

    await prisma.digitalAsset.delete({ where: { id } });

    return res.status(200).json({ status: 1, message: "Digital asset deleted successfully" });
});