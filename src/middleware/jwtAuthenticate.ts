import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { prisma } from "../config/prisma.js";
import AppError from "../utils/appError.js";
import catchAsync from "../utils/catchAsync.js";

interface JwtPayload {
    id: string;
    role: string;
    iat?: number;
    exp?: number;
}

export const jwtAuthenticate = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    let token: string | undefined;

    if (req.headers.authorization?.startsWith("Bearer ")) {
        token = req.headers.authorization.split(" ")[1];
    }

    if (!token) return next(new AppError("You are not logged in. Please log in to get access.", 401));

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload;

        const user = await prisma.user.findUnique({
            where: { id: decoded.id },
            select: {
                id: true,
                email: true,
                phone: true,
                username: true,
                fullName: true,
                avatarFileId: true,
                role: true,
                isVerified: true,
                isActive: true,
            },
        });

        if (!user) {
            return next(new AppError("The user belonging to this token no longer exists.", 401));
        }

        if (!user.isActive) {
            return next(new AppError("Your account has been deactivated.", 403));
        }

        req.user = user;

        next();
    } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            return next(new AppError("Your token has expired. Please log in again.", 401));
        }

        if (error instanceof jwt.JsonWebTokenError) {
            return next(new AppError("Invalid authentication token.", 401));
        }

        next(error);
    }
});

export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) return next(new AppError("Authentication required", 401));
    if (req.user.role !== "ADMIN") return next(new AppError("You do not have permission to perform this action", 403));
    next();
};
