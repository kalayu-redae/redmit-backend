import { Request, Response, NextFunction } from "express";
import { prisma } from "../../config/prisma.js";
import catchAsync from "../../utils/catchAsync.js";
import AppError from "../../utils/appError.js";
import FileManager from "../../utils/file/file.manager.js";

export const createProduct = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    console.log("req.user", req.user)

    const sellerId = req.user?.id;
    const { name, slug, shortDescription, description, price, currency, categoryId } = req.body;
    if (!sellerId) return next(new AppError("Authentication required", 401));
    if (!name || !categoryId || price === undefined) return next(new AppError("Name, category and price are required", 400));

    const category = await prisma.category.findUnique({ where: { id: categoryId } });
    if (!category) return next(new AppError("Category not found", 404));

    const productSlug = (slug || name).trim().toLowerCase().replace(/\s+/g, "-");
    const existingProduct = await prisma.digitalProduct.findUnique({ where: { slug: productSlug } });
    if (existingProduct) return next(new AppError("Product slug already exists", 409));

    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
    const thumbnail = files?.thumbnail?.[0];
    const productFiles = files?.files || [];

    let thumbnailId: string | undefined;

    if (thumbnail) {
        const file = await FileManager.upload(thumbnail);
        thumbnailId = file.id;
    }

    const product = await prisma.digitalProduct.create({
        data: {
            name: name.trim(),
            slug: productSlug,
            shortDescription,
            description,
            price: Number(price),
            currency: currency || "USD",
            categoryId,
            sellerId,
            ...(thumbnailId && { thumbnailId }),
        },
        include: {
            category: true,
            thumbnail: true,
        },
    });

    if (productFiles.length > 0) {
        const uploadedFiles = await Promise.all(productFiles.map(file => FileManager.upload(file)));

        await prisma.productFile.createMany({
            data: uploadedFiles.map(file => ({
                productId: product.id,
                fileId: file.id,
            })),
        });
    }

    const createdProduct = await prisma.digitalProduct.findUnique({
        where: { id: product.id },
        include: {
            category: true,
            thumbnail: true,
            files: {
                include: {
                    file: true,
                },
            },
        },
    });

    return res.status(201).json({
        status: 1,
        message: "Digital product created successfully",
        data: createdProduct,
    });
});

export const getProducts = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { page = 1, limit = 10, search, categoryId, sellerId, minPrice, maxPrice, isActive, sortBy = "createdAt", order = "desc" } = req.query;

    const pageNumber = Math.max(Number(page), 1);
    const limitNumber = Math.max(Number(limit), 1);
    const where: any = {};

    if (search) where.OR = [{ name: { contains: String(search), mode: "insensitive" } }, { description: { contains: String(search), mode: "insensitive" } }, { shortDescription: { contains: String(search), mode: "insensitive" } }];
    if (categoryId) where.categoryId = String(categoryId);
    if (sellerId) where.sellerId = String(sellerId);
    if (isActive !== undefined) where.isActive = String(isActive) === "true";
    if (minPrice !== undefined || maxPrice !== undefined) where.price = { ...(minPrice !== undefined && { gte: Number(minPrice) }), ...(maxPrice !== undefined && { lte: Number(maxPrice) }) };

    const allowedSortFields = ["name", "price", "createdAt", "updatedAt"];
    const safeSortBy = allowedSortFields.includes(String(sortBy)) ? String(sortBy) : "createdAt";
    const safeOrder = String(order).toLowerCase() === "asc" ? "asc" : "desc";

    const [products, total] = await Promise.all([
        prisma.digitalProduct.findMany({
            where,
            orderBy: { [safeSortBy]: safeOrder },
            skip: (pageNumber - 1) * limitNumber,
            take: limitNumber,
            include: {
                category: true,
                thumbnail: true,
                seller: {
                    select: {
                        id: true,
                        username: true,
                        fullName: true,
                    },
                },
            },
        }),
        prisma.digitalProduct.count({ where }),
    ]);

    return res.status(200).json({
        status: 1,
        message: "Products retrieved successfully",
        pagination: {
            total,
            page: pageNumber,
            limit: limitNumber,
            totalPages: Math.ceil(total / limitNumber),
        },
        data: products,
    });
});

export const getProduct = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params as { id: string };

    const product = await prisma.digitalProduct.findUnique({
        where: { id },
        include: {
            category: true,
            thumbnail: true,
            seller: {
                select: {
                    id: true,
                    username: true,
                    fullName: true,
                },
            },
            files: {
                include: {
                    file: true,
                },
            },
        },
    });

    if (!product) return next(new AppError("Product not found", 404));

    return res.status(200).json({
        status: 1,
        data: product,
    });
});

export const getMyProducts = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const sellerId = req.user?.id;
    if (!sellerId) return next(new AppError("Authentication required", 401));

    const products = await prisma.digitalProduct.findMany({
        where: { sellerId },
        orderBy: { createdAt: "desc" },
        include: {
            category: true,
            thumbnail: true,
            files: {
                include: {
                    file: true,
                },
            },
        },
    });

    return res.status(200).json({
        status: 1,
        message: "Your products retrieved successfully",
        data: products,
    });
});

export const updateProduct = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params as { id: string };
    const sellerId = req.user?.id;
    const { name, slug, shortDescription, description, price, currency, categoryId } = req.body;

    if (!sellerId) return next(new AppError("Authentication required", 401));

    const product = await prisma.digitalProduct.findUnique({
        where: { id },
        include: { thumbnail: true },
    });

    if (!product) return next(new AppError("Product not found", 404));
    if (product.sellerId !== sellerId) return next(new AppError("You are not allowed to update this product", 403));

    if (categoryId) {
        const category = await prisma.category.findUnique({ where: { id: categoryId } });
        if (!category) return next(new AppError("Category not found", 404));
    }

    const newSlug = slug !== undefined ? slug.trim().toLowerCase().replace(/\s+/g, "-") : undefined;

    if (newSlug && newSlug !== product.slug) {
        const existingProduct = await prisma.digitalProduct.findUnique({ where: { slug: newSlug } });
        if (existingProduct) return next(new AppError("Product slug already exists", 409));
    }

    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
    const newThumbnail = files?.thumbnail?.[0];

    let thumbnailId = product.thumbnailId;

    if (newThumbnail) {
        const uploadedThumbnail = await FileManager.upload(newThumbnail);
        thumbnailId = uploadedThumbnail.id;

        if (product.thumbnailId) {
            await FileManager.delete(product.thumbnailId);
        }
    }

    const updatedProduct = await prisma.digitalProduct.update({
        where: { id },
        data: {
            ...(name !== undefined && { name: name.trim() }),
            ...(newSlug !== undefined && { slug: newSlug }),
            ...(shortDescription !== undefined && { shortDescription }),
            ...(description !== undefined && { description }),
            ...(price !== undefined && { price: Number(price) }),
            ...(currency !== undefined && { currency }),
            ...(categoryId !== undefined && { categoryId }),
            thumbnailId,
        },
        include: {
            category: true,
            thumbnail: true,
            files: {
                include: {
                    file: true,
                },
            },
        },
    });

    return res.status(200).json({
        status: 1,
        message: "Product updated successfully",
        data: updatedProduct,
    });
});

export const updateProductStatus = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params as { id: string };

    const product = await prisma.digitalProduct.findUnique({ where: { id } });
    if (!product) return next(new AppError("Product not found", 404));

    const updatedProduct = await prisma.digitalProduct.update({
        where: { id },
        data: { isActive: !product.isActive },
    });

    return res.status(200).json({
        status: 1,
        message: `Product ${updatedProduct.isActive ? "activated" : "deactivated"} successfully`,
        data: updatedProduct,
    });
});

export const deleteProduct = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params as { id: string };
    const sellerId = req.user?.id;

    if (!sellerId) return next(new AppError("Authentication required", 401));

    const product = await prisma.digitalProduct.findUnique({
        where: { id },
        include: {
            files: true,
        },
    });

    if (!product) return next(new AppError("Product not found", 404));
    if (product.sellerId !== sellerId) return next(new AppError("You are not allowed to delete this product", 403));

    const fileIds = product.files.map(file => file.fileId);
    if (product.thumbnailId) fileIds.push(product.thumbnailId);

    await prisma.digitalProduct.delete({ where: { id } });

    await Promise.all(fileIds.map(fileId => FileManager.delete(fileId)));

    return res.status(200).json({
        status: 1,
        message: "Product deleted successfully",
    });
});