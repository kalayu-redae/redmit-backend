import e, { Request, Response, NextFunction } from "express";
import argon2 from "argon2";
import jwt from "jsonwebtoken";
import crypto from "crypto";

import { prisma } from "../../config/prisma.js";
import catchAsync from "../../utils/catchAsync.js";
import AppError from "../../utils/appError.js";

import { sendPasswordResetLink } from "../../utils/emailUtils.js";
import FileManager from "../../utils/file/file.manager.js";

import { registerSchema, loginSchema } from "./auth.validation.js";

const signInToken = (user: { id: string; role: string; }) => {

    const token = jwt.sign(
        { id: user.id },
        process.env.JWT_SECRET!,
        { expiresIn: process.env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"] }
    );
    return token;

};

export const register = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const data = registerSchema.parse(req.body);
    const { email, phone, username, password, fullName } = data;

    const existingEmail = await prisma.user.findUnique({ where: { email } });
    if (existingEmail) return next(new AppError("Email is already registered", 409));

    const existingPhone = await prisma.user.findUnique({ where: { phone } });
    if (existingPhone) return next(new AppError("Phone number is already registered", 409));

    const existingUsername = await prisma.user.findUnique({ where: { username } });
    if (existingUsername) return next(new AppError("Username is already taken", 409));

    const passwordHash = await argon2.hash(password);

    let avatarFileId: string | undefined;

    if (req.file) {
        const avatar = await FileManager.upload(req.file);
        avatarFileId = avatar.id;
    }

    const user = await prisma.user.create({
        data: {
            email,
            phone,
            username,
            passwordHash,
            fullName,
            avatarFileId,
            role: "USER",
            isVerified: false,
            isActive: true,
        },
        include: {
            avatar: true,
        },
    });

    const avatarUrl = user.avatar?.url || `${req.protocol}://${req.get("host")}/uploads/defaults/default-avatar.png`;

    return res.status(201).json({
        status: 1,
        message: "User registered successfully",
        data: {
            id: user.id,
            email: user.email,
            phone: user.phone,
            username: user.username,
            fullName: user.fullName,
            avatarUrl,
            role: user.role,
            isVerified: user.isVerified,
            isActive: user.isActive,
            createdAt: user.createdAt,
        },
    });
});

export const login = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const data = loginSchema.parse(req.body);

    const { email, username, phone, password } = data;

    const user = await prisma.user.findUnique({
        where: { email: email || undefined, phone: phone || undefined, username: username || undefined },
        include: {
            avatar: true,
        },
    });

    if (!user) return next(new AppError("Invalid credentials", 401));
    if (!user.isActive) return next(new AppError("Your account is inactive", 403));

    const correct = await argon2.verify(user.passwordHash, password);
    if (!correct) return next(new AppError("Invalid credentials", 401));

    const token = signInToken(user);

    return res.status(200).json({
        status: 1,
        token,
        user: {
            id: user.id,
            email: user.email,
            phone: user.phone,
            username: user.username,
            fullName: user.fullName,
            avatarUrl: user.avatar?.url ?? `${req.protocol}://${req.get("host")}/uploads/defaults/default-avatar.png`,
            role: user.role,
            isVerified: user.isVerified,
            isActive: user.isActive,
            createdAt: user.createdAt,
        },
        message: "Login successful",
    });
}
);

export const getMe = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user?.id;
    if (!userId) return next(new AppError("Authentication required", 401));

    const user = await prisma.user.findUnique({
        where: { id: userId }, include: {
            avatar: true,
        },
    });

    if (!user) return next(new AppError("User not found", 404));

    const avatarUrl = user.avatar?.url || `${req.protocol}://${req.get("host")}/uploads/defaults/default-avatar.png`;

    return res.status(200).json({
        status: 1,
        user: {
            id: user.id,
            email: user.email,
            phone: user.phone,
            username: user.username,
            fullName: user.fullName,
            avatarUrl,
            role: user.role,
            isVerified: user.isVerified,
            isActive: user.isActive,
            createdAt: user.createdAt,
        },
    });
}
);

export const updateMe = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user?.id;

    if (!userId) return next(new AppError("Authentication required", 401));

    const { email, phone, username, fullName } = req.body;

    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
            avatar: true,
        },
    });

    if (!user) return next(new AppError("User not found", 404));

    const data: any = {};

    if (email !== undefined) data.email = email.toLowerCase().trim();
    if (phone !== undefined) data.phone = phone.trim();
    if (username !== undefined) data.username = username.toLowerCase().trim();
    if (fullName !== undefined) data.fullName = fullName.trim();

    // Handle new avatar
    if (req.file) {
        const newFile = await FileManager.upload(req.file);

        data.avatarFileId = newFile.id;
    }

    const updatedUser = await prisma.user.update({
        where: { id: userId },
        data,
        include: {
            avatar: true,
        },
    });

    // Delete old avatar after successful update
    if (req.file && user.avatar) await FileManager.delete(user.avatar.id);

    const avatarUrl = updatedUser.avatar?.url || `${req.protocol}://${req.get("host")}/uploads/defaults/default-avatar.png`;

    return res.status(200).json({
        status: 1,
        message: "Profile updated successfully",
        data: {
            id: updatedUser.id,
            email: updatedUser.email,
            phone: updatedUser.phone,
            username: updatedUser.username,
            fullName: updatedUser.fullName,
            avatarUrl,
            role: updatedUser.role,
            isVerified: updatedUser.isVerified,
            isActive: updatedUser.isActive,
            createdAt: updatedUser.createdAt,
            updatedAt: updatedUser.updatedAt,
        },
    });
});

export const forgotPassword = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { email } = req.body;

    if (!email) return next(new AppError("Email is required", 400));

    const normalizedEmail = email.toLowerCase().trim();

    const user = await prisma.user.findUnique({
        where: { email: normalizedEmail },
    });

    if (!user) return next(new AppError("There is no user with this email", 404));

    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpires = new Date(Date.now() + 10 * 60 * 1000);

    await prisma.user.update({
        where: { id: user.id },
        data: {
            passwordResetToken: resetToken,
            passwordResetTokenExpires: resetTokenExpires,
        },
    });

    const resetLink = `${process.env.BASE_URL}/reset-password?token=${resetToken}`;

    try {
        await sendPasswordResetLink(user.email, resetLink);

        return res.status(200).json({
            status: 1,
            message: "Password reset link sent successfully",
        });
    } catch (error) {
        await prisma.user.update({
            where: { id: user.id },
            data: {
                passwordResetToken: null,
                passwordResetTokenExpires: null,
            },
        });

        return next(
            new AppError(
                "There was an error sending the email. Please try again later!",
                500
            )
        );
    }
});

// export const verifyOTP = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
//     const { email, passwordResetOTP } = req.body;
//     console.log("Received email:", email);
//     console.log("Received OTP code:", passwordResetOTP);

//     if (!email || !passwordResetOTP) {
//         return next(new AppError("Email and OTP code are required", 400));
//     }

//     const user = await prisma.user.findFirst({
//         where: {
//             email: email.toLowerCase().trim(),
//             passwordResetOTP,
//             passwordResetOTPExpires: {
//                 gt: new Date(),
//             },
//         },
//     });

//     if (!user) return next(new AppError("Invalid or expired OTP code", 400));


//     const resetToken = crypto.randomBytes(32).toString("hex");

//     const resetTokenExpires = new Date(Date.now() + 10 * 60 * 1000);

//     await prisma.user.update({
//         where: { id: user.id },
//         data: {
//             passwordResetOTP: null,
//             passwordResetOTPExpires: null,
//             passwordResetToken: resetToken,
//             passwordResetTokenExpires: resetTokenExpires,
//         },
//     });

//     return res.status(200).json({
//         status: 1,
//         resetToken,
//         message: "OTP verified successfully. Proceed to reset your password.",
//     });
// });

export const resetPassword = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { resetToken, newPassword } = req.body;

    if (!resetToken || !newPassword) {
        return next(
            new AppError(
                "Reset token and new password are required",
                400
            )
        );
    }

    if (newPassword.length < 8) {
        return next(
            new AppError(
                "Password must be at least 8 characters long",
                400
            )
        );
    }

    const user = await prisma.user.findFirst({
        where: {
            passwordResetToken: resetToken,
            passwordResetTokenExpires: {
                gt: new Date(),
            },
        },
    });

    if (!user) {
        return next(
            new AppError(
                "Invalid or expired password reset link",
                400
            )
        );
    }

    const passwordHash = await argon2.hash(newPassword);

    await prisma.user.update({
        where: { id: user.id },
        data: {
            passwordHash,
            passwordResetToken: null,
            passwordResetTokenExpires: null,
        },
    });

    return res.status(200).json({
        status: 1,
        message: "Password reset successfully",
    });
});

export const updateMyPassword = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user?.id;
    const { currentPassword, newPassword } = req.body;

    if (!userId) return next(new AppError("Authentication required", 401));

    if (!currentPassword || !newPassword) {
        return next(new AppError("Please provide both current and new passwords", 400));
    }

    if (newPassword.length < 8) {
        return next(new AppError("New password must be at least 8 characters long", 400));
    }

    const user = await prisma.user.findUnique({
        where: { id: userId },
    });

    if (!user) return next(new AppError("User not found", 404));

    const correct = await argon2.verify(
        user.passwordHash,
        currentPassword
    );

    if (!correct) {
        return next(new AppError("Incorrect current password", 401));
    }

    const passwordHash = await argon2.hash(newPassword);

    await prisma.user.update({
        where: { id: userId },
        data: {
            passwordHash,
        },
    });

    return res.status(200).json({
        status: 1,
        message: "Password updated successfully",
    });
});

export const removeMyAvatar = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user?.id;

    if (!userId) {
        return next(new AppError("Authentication required", 401));
    }

    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
            avatar: true,
        },
    });

    if (!user) {
        return next(new AppError("User not found", 404));
    }

    if (!user.avatar) {
        return res.status(200).json({
            status: 1,
            message: "User is already using the default avatar",
        });
    }

    await prisma.user.update({
        where: { id: userId },
        data: {
            avatarFileId: null,
        },
    });

    await FileManager.delete(user.avatar.id);

    return res.status(200).json({
        status: 1,
        message: "Avatar removed successfully",
        avatarUrl: `${req.protocol}://${req.get("host")}/uploads/defaults/default-avatar.png`,
    });
});