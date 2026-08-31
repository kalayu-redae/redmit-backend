import { prisma } from "../../config/prisma.js";
import catchAsync from "../../utils/catchAsync.js";
import AppError from "../../utils/appError.js";
import FileManager from "../../utils/file/file.manager.js";
const buildSlug = (value) => value.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^\w-]/g, "");
// ── CREATE ─────────────────────────────────────────────────────────────────────
export const createOpportunity = catchAsync(async (req, res, next) => {
    const { title, slug, type, description, organization, location, eligibility, requirements, benefits, sourceUrl, applicationUrl, deadline, } = req.body;
    if (!title || !type || !description || !applicationUrl) {
        return next(new AppError("Title, type, description and application URL are required", 400));
    }
    const opportunitySlug = buildSlug(slug || title);
    const existingOpportunity = await prisma.opportunity.findUnique({
        where: { slug: opportunitySlug },
    });
    if (existingOpportunity) {
        return next(new AppError("An opportunity with this slug already exists", 409));
    }
    let thumbnailFileId = null;
    if (req.file) {
        const uploaded = await FileManager.upload(req.file);
        thumbnailFileId = uploaded.id;
    }
    const opportunity = await prisma.opportunity.create({
        data: {
            title,
            slug: opportunitySlug,
            type,
            description,
            organization: organization || null,
            location: location || null,
            eligibility: eligibility || null,
            requirements: requirements || null,
            benefits: benefits || null,
            sourceUrl: sourceUrl || null,
            applicationUrl,
            deadline: deadline ? new Date(deadline) : null,
            thumbnailFileId,
        },
        include: {
            thumbnail: true,
        },
    });
    return res.status(201).json({
        status: 1,
        message: "Opportunity created successfully",
        data: opportunity,
    });
});
// ── GET ALL (paginated) ────────────────────────────────────────────────────────
export const getOpportunities = catchAsync(async (req, res) => {
    const { type, search, published, page = 1, limit = 10, sortBy = "createdAt", order = "desc", } = req.query;
    const pageNumber = Math.max(Number(page), 1);
    const limitNumber = Math.max(Number(limit), 1);
    const allowedSortFields = ["createdAt", "updatedAt", "deadline", "title"];
    const safeSortBy = allowedSortFields.includes(String(sortBy)) ? String(sortBy) : "createdAt";
    const safeOrder = String(order).toLowerCase() === "asc" ? "asc" : "desc";
    const where = {};
    if (type)
        where.type = type;
    if (published !== undefined)
        where.isPublished = published === "true";
    if (search) {
        where.OR = [
            { title: { contains: String(search), mode: "insensitive" } },
            { organization: { contains: String(search), mode: "insensitive" } },
            { description: { contains: String(search), mode: "insensitive" } },
        ];
    }
    const [opportunities, total] = await Promise.all([
        prisma.opportunity.findMany({
            where,
            orderBy: { [safeSortBy]: safeOrder },
            skip: (pageNumber - 1) * limitNumber,
            take: limitNumber,
            include: { thumbnail: true },
        }),
        prisma.opportunity.count({ where }),
    ]);
    return res.status(200).json({
        status: 1,
        message: "Opportunities retrieved successfully",
        pagination: {
            total,
            page: pageNumber,
            limit: limitNumber,
            totalPages: Math.ceil(total / limitNumber),
        },
        data: opportunities,
    });
});
// ── GET ONE ────────────────────────────────────────────────────────────────────
export const getOpportunity = catchAsync(async (req, res, next) => {
    const id = String(req.params.id);
    const opportunity = await prisma.opportunity.findUnique({
        where: { id },
        include: { thumbnail: true },
    });
    if (!opportunity)
        return next(new AppError("Opportunity not found", 404));
    return res.status(200).json({
        status: 1,
        data: opportunity,
    });
});
// ── UPDATE ─────────────────────────────────────────────────────────────────────
export const updateOpportunity = catchAsync(async (req, res, next) => {
    const id = String(req.params.id);
    const existing = await prisma.opportunity.findUnique({ where: { id } });
    if (!existing)
        return next(new AppError("Opportunity not found", 404));
    const { title, slug, type, description, organization, location, eligibility, requirements, benefits, sourceUrl, applicationUrl, deadline, } = req.body;
    let newSlug = existing.slug;
    if (slug !== undefined) {
        newSlug = buildSlug(slug);
        if (newSlug !== existing.slug) {
            const slugExists = await prisma.opportunity.findUnique({ where: { slug: newSlug } });
            if (slugExists)
                return next(new AppError("An opportunity with this slug already exists", 409));
        }
    }
    let thumbnailFileId = existing.thumbnailFileId;
    if (req.file) {
        const uploaded = await FileManager.upload(req.file);
        thumbnailFileId = uploaded.id;
    }
    const opportunity = await prisma.opportunity.update({
        where: { id },
        data: {
            ...(title !== undefined && { title }),
            ...(slug !== undefined && { slug: newSlug }),
            ...(type !== undefined && { type }),
            ...(description !== undefined && { description }),
            ...(organization !== undefined && { organization }),
            ...(location !== undefined && { location }),
            ...(eligibility !== undefined && { eligibility }),
            ...(requirements !== undefined && { requirements }),
            ...(benefits !== undefined && { benefits }),
            ...(sourceUrl !== undefined && { sourceUrl }),
            ...(applicationUrl !== undefined && { applicationUrl }),
            ...(deadline !== undefined && { deadline: deadline ? new Date(deadline) : null }),
            thumbnailFileId,
        },
        include: { thumbnail: true },
    });
    // Delete old thumbnail after successful update
    if (req.file && existing.thumbnailFileId) {
        await FileManager.delete(existing.thumbnailFileId);
    }
    return res.status(200).json({
        status: 1,
        message: "Opportunity updated successfully",
        data: opportunity,
    });
});
// ── DELETE ─────────────────────────────────────────────────────────────────────
export const deleteOpportunity = catchAsync(async (req, res, next) => {
    const id = String(req.params.id);
    const opportunity = await prisma.opportunity.findUnique({ where: { id } });
    if (!opportunity)
        return next(new AppError("Opportunity not found", 404));
    await prisma.opportunity.delete({ where: { id } });
    // Clean up thumbnail from storage
    if (opportunity.thumbnailFileId) {
        await FileManager.delete(opportunity.thumbnailFileId);
    }
    return res.status(200).json({
        status: 1,
        message: "Opportunity deleted successfully",
    });
});
// ── PUBLISH ────────────────────────────────────────────────────────────────────
export const publishOpportunity = catchAsync(async (req, res, next) => {
    const id = String(req.params.id);
    const opportunity = await prisma.opportunity.findUnique({ where: { id } });
    if (!opportunity)
        return next(new AppError("Opportunity not found", 404));
    if (opportunity.isPublished) {
        return next(new AppError("Opportunity is already published", 400));
    }
    const updated = await prisma.opportunity.update({
        where: { id },
        data: { isPublished: true },
    });
    return res.status(200).json({
        status: 1,
        message: "Opportunity published successfully",
        data: updated,
    });
});
// ── UNPUBLISH ──────────────────────────────────────────────────────────────────
export const unpublishOpportunity = catchAsync(async (req, res, next) => {
    const id = String(req.params.id);
    const opportunity = await prisma.opportunity.findUnique({ where: { id } });
    if (!opportunity)
        return next(new AppError("Opportunity not found", 404));
    if (!opportunity.isPublished) {
        return next(new AppError("Opportunity is already unpublished", 400));
    }
    const updated = await prisma.opportunity.update({
        where: { id },
        data: { isPublished: false },
    });
    return res.status(200).json({
        status: 1,
        message: "Opportunity unpublished successfully",
        data: updated,
    });
});
