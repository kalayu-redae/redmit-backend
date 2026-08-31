import { prisma } from "../../config/prisma.js";
import catchAsync from "../../utils/catchAsync.js";
import AppError from "../../utils/appError.js";
const generateOrderNumber = () => `ORD-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
export const createOrder = catchAsync(async (req, res, next) => {
    const buyerId = req.user?.id;
    if (!buyerId)
        return next(new AppError("Authentication required", 401));
    const { items, currency = "USD" } = req.body;
    if (!Array.isArray(items) || items.length === 0)
        return next(new AppError("Order items are required", 400));
    const orderItems = [];
    for (const item of items) {
        if (!item.type || !item.id)
            return next(new AppError("Each item must have type and id", 400));
        const quantity = Math.max(Number(item.quantity) || 1, 1);
        let name = "";
        let price = 0;
        let relation = {};
        switch (item.type) {
            case "DIGITAL_PRODUCT": {
                const product = await prisma.digitalProduct.findUnique({ where: { id: item.id } });
                if (!product)
                    return next(new AppError("Digital product not found", 404));
                if (!product.isActive)
                    return next(new AppError("Digital product is not available", 400));
                name = product.name;
                price = Number(product.price);
                relation = { digitalProductId: product.id };
                break;
            }
            case "DIGITAL_ASSET": {
                const asset = await prisma.digitalAsset.findUnique({ where: { id: item.id } });
                if (!asset)
                    return next(new AppError("Digital asset not found", 404));
                if (!asset.isActive)
                    return next(new AppError("Digital asset is not available", 400));
                if (asset.isSold)
                    return next(new AppError("Digital asset has already been sold", 400));
                name = asset.name;
                price = Number(asset.price);
                relation = { digitalAssetId: asset.id };
                break;
            }
            case "DIGITAL_ACCESS": {
                const access = await prisma.digitalAccess.findUnique({ where: { id: item.id } });
                if (!access)
                    return next(new AppError("Digital access not found", 404));
                if (!access.isActive)
                    return next(new AppError("Digital access is not available", 400));
                name = access.name;
                price = Number(access.price);
                relation = { digitalAccessId: access.id };
                break;
            }
            case "DIGITAL_GROWTH": {
                const growth = await prisma.digitalGrowth.findUnique({ where: { id: item.id } });
                if (!growth)
                    return next(new AppError("Digital growth service not found", 404));
                if (!growth.isActive)
                    return next(new AppError("Digital growth service is not available", 400));
                name = growth.name;
                price = Number(growth.price);
                relation = { digitalGrowthId: growth.id };
                break;
            }
            default:
                return next(new AppError("Invalid order item type", 400));
        }
        orderItems.push({
            type: item.type,
            name,
            quantity,
            unitPrice: price,
            totalPrice: price * quantity,
            currency,
            ...relation,
        });
    }
    const subtotal = orderItems.reduce((sum, item) => sum + item.totalPrice, 0);
    const discount = 0;
    const tax = 0;
    const total = subtotal - discount + tax;
    const order = await prisma.order.create({
        data: {
            orderNumber: generateOrderNumber(),
            buyerId,
            subtotal,
            discount,
            tax,
            total,
            currency,
            status: "PENDING",
            items: {
                create: orderItems,
            },
        },
        include: {
            items: true,
        },
    });
    return res.status(201).json({
        status: 1,
        message: "Order created successfully",
        data: order,
    });
});
export const getOrders = catchAsync(async (req, res, next) => {
    const buyerId = req.user?.id;
    if (!buyerId)
        return next(new AppError("Authentication required", 401));
    const { page = 1, limit = 10, status } = req.query;
    const pageNumber = Math.max(Number(page), 1);
    const limitNumber = Math.max(Number(limit), 1);
    const where = { buyerId };
    if (status)
        where.status = String(status);
    const [orders, total] = await Promise.all([
        prisma.order.findMany({
            where,
            orderBy: { createdAt: "desc" },
            skip: (pageNumber - 1) * limitNumber,
            take: limitNumber,
            include: { items: true },
        }),
        prisma.order.count({ where }),
    ]);
    return res.status(200).json({
        status: 1,
        message: "Orders retrieved successfully",
        pagination: {
            total,
            page: pageNumber,
            limit: limitNumber,
            totalPages: Math.ceil(total / limitNumber),
        },
        data: orders,
    });
});
export const getOrder = catchAsync(async (req, res, next) => {
    const buyerId = req.user?.id;
    if (!buyerId)
        return next(new AppError("Authentication required", 401));
    const order = await prisma.order.findFirst({
        where: {
            id: req.params.id,
            buyerId,
        },
        include: {
            items: {
                include: {
                    digitalProduct: { include: { thumbnail: true } },
                    digitalAsset: { include: { thumbnail: true } },
                    digitalAccess: { include: { thumbnail: true } },
                    digitalGrowth: { include: { thumbnail: true } },
                },
            },
        },
    });
    if (!order)
        return next(new AppError("Order not found", 404));
    return res.status(200).json({
        status: 1,
        message: "Order retrieved successfully",
        data: order,
    });
});
export const cancelOrder = catchAsync(async (req, res, next) => {
    const buyerId = req.user?.id;
    if (!buyerId)
        return next(new AppError("Authentication required", 401));
    const order = await prisma.order.findFirst({
        where: {
            id: req.params.id,
            buyerId,
        },
    });
    if (!order)
        return next(new AppError("Order not found", 404));
    if (order.status !== "PENDING")
        return next(new AppError("Only pending orders can be cancelled", 400));
    const updatedOrder = await prisma.order.update({
        where: { id: order.id },
        data: { status: "CANCELLED" },
    });
    return res.status(200).json({
        status: 1,
        message: "Order cancelled successfully",
        data: updatedOrder,
    });
});
