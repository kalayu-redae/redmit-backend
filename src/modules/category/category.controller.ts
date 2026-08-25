import { Request, Response, NextFunction } from "express";
import { prisma } from "../../config/prisma.js";
import catchAsync from "../../utils/catchAsync.js";
import AppError from "../../utils/appError.js";
import FileManager from "../../utils/file/file.manager.js";

export const createCategory = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { name, slug, description } = req.body;
    if (!name) return next(new AppError("Category name is required", 400));

    const categorySlug = (slug || name).trim().toLowerCase().replace(/\s+/g, "-");
    const existingCategory = await prisma.category.findFirst({ where: { OR: [{ name: { equals: name.trim(), mode: "insensitive" } }, { slug: categorySlug }] } });
    if (existingCategory) return next(new AppError("Category name or slug already exists", 409));

    let imageId: string | undefined;
    if (req.file) {
        const file = await FileManager.upload(req.file);
        imageId = file.id;
    }

    const category = await prisma.category.create({ data: { name: name.trim(), slug: categorySlug, description, ...(imageId && { imageId }) }, include: { image: true } });

    return res.status(201).json({ status: 1, message: "Category created successfully", data: category });
});

export const getCategories = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { page = 1, limit = 10, search, isActive, sortBy = "createdAt", order = "desc" } = req.query;
    const pageNumber = Math.max(Number(page), 1);
    const limitNumber = Math.max(Number(limit), 1);
    const allowedSortFields = ["name", "createdAt", "updatedAt", "isActive"];
    const safeSortBy = allowedSortFields.includes(String(sortBy)) ? String(sortBy) : "createdAt";
    const where: any = {};
    if (search) where.OR = [{ name: { contains: String(search), mode: "insensitive" } }, { description: { contains: String(search), mode: "insensitive" } }];
    if (isActive !== undefined) where.isActive = String(isActive) === "true";

    const [categories, total] = await Promise.all([
        prisma.category.findMany({ where, orderBy: { [safeSortBy]: String(order).toLowerCase() === "asc" ? "asc" : "desc" }, skip: (pageNumber - 1) * limitNumber, take: limitNumber, include: { image: true } }),
        prisma.category.count({ where })
    ]);

    return res.status(200).json({ status: 1, message: "Categories retrieved successfully", pagination: { total, page: pageNumber, limit: limitNumber, totalPages: Math.ceil(total / limitNumber) }, data: categories });
});

export const getCategory = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params as { id: string };
    const category = await prisma.category.findUnique({ where: { id }, include: { image: true } });
    if (!category) return next(new AppError("Category not found", 404));
    return res.status(200).json({ status: 1, data: category });
});

export const updateCategory = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params as { id: string };
    const { name, slug, description } = req.body;
    const category = await prisma.category.findUnique({ where: { id }, include: { image: true } });
    if (!category) return next(new AppError("Category not found", 404));

    const newSlug = slug !== undefined ? slug.trim().toLowerCase().replace(/\s+/g, "-") : undefined;
    if (name !== undefined || newSlug !== undefined) {
        const duplicate = await prisma.category.findFirst({ where: { id: { not: id }, OR: [...(name ? [{ name: { equals: name.trim(), mode: "insensitive" as const } }] : []), ...(newSlug ? [{ slug: newSlug }] : [])] } });
        if (duplicate) return next(new AppError("Category name or slug already exists", 409));
    }

    let imageId = category.imageId;
    if (req.file) {
        const newFile = await FileManager.upload(req.file);
        imageId = newFile.id;
        if (category.imageId) await FileManager.delete(category.imageId);
    }

    const updatedCategory = await prisma.category.update({ where: { id }, data: { ...(name !== undefined && { name: name.trim() }), ...(newSlug !== undefined && { slug: newSlug }), ...(description !== undefined && { description }), imageId }, include: { image: true } });

    return res.status(200).json({ status: 1, message: "Category updated successfully", data: updatedCategory });
});

export const updateStatus = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params as { id: string };
    const category = await prisma.category.findUnique({ where: { id } });
    if (!category) return next(new AppError("Category not found", 404));

    const updatedCategory = await prisma.category.update({ where: { id }, data: { isActive: !category.isActive }, include: { image: true } });

    return res.status(200).json({ status: 1, message: `Category ${updatedCategory.isActive ? "activated" : "deactivated"} successfully`, data: updatedCategory });
});

export const deleteCategory = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params as { id: string };
    const category = await prisma.category.findUnique({ where: { id }, include: { image: true } });
    if (!category) return next(new AppError("Category not found", 404));

    const productCount = await prisma.digitalProduct.count({ where: { categoryId: id } });
    if (productCount > 0) return next(new AppError("Cannot delete category because it contains products", 400));

    await prisma.category.delete({ where: { id } });
    if (category.imageId) await FileManager.delete(category.imageId);

    return res.status(200).json({ status: 1, message: "Category deleted successfully" });
});