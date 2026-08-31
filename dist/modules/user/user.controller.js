import { prisma } from "../../config/prisma.js";
import argon2 from "argon2";
import crypto from "crypto";
import catchAsync from "../../utils/catchAsync.js";
import AppError from "../../utils/appError.js";
import FileManager from "../../utils/file/file.manager.js";
import { sendEmail } from "../../utils/emailUtils.js";
const DEFAULT_AVATAR = (req) => `${req.protocol}://${req.get("host")}/uploads/defaults/default-avatar.png`;
const userResponse = (req, user) => ({ id: user.id, email: user.email, phone: user.phone, username: user.username, fullName: user.fullName, avatarUrl: user.avatar?.url || DEFAULT_AVATAR(req), role: user.role, isVerified: user.isVerified, isActive: user.isActive, createdAt: user.createdAt, updatedAt: user.updatedAt });
const buildUserQuery = (query) => {
    const { search, email, fullName, phone, username, role, isVerified, isActive, joinDate, leaveDate } = query;
    const where = {};
    if (email)
        where.email = { contains: String(email).trim(), mode: "insensitive" };
    if (fullName)
        where.fullName = { contains: String(fullName).trim(), mode: "insensitive" };
    if (phone)
        where.phone = { contains: String(phone).trim(), mode: "insensitive" };
    if (username)
        where.username = { contains: String(username).trim(), mode: "insensitive" };
    if (role)
        where.role = role;
    if (isVerified !== undefined)
        where.isVerified = isVerified === "true";
    if (isActive !== undefined)
        where.isActive = isActive === "true";
    if (joinDate || leaveDate) {
        where.createdAt = {};
        if (joinDate)
            where.createdAt.gte = new Date(String(joinDate));
        if (leaveDate)
            where.createdAt.lte = new Date(String(leaveDate));
    }
    if (search) {
        const value = String(search).trim();
        where.OR = [
            { fullName: { contains: value, mode: "insensitive" } },
            { email: { contains: value, mode: "insensitive" } },
            { phone: { contains: value, mode: "insensitive" } },
            { username: { contains: value, mode: "insensitive" } }
        ];
    }
    return where;
};
export const getUsers = catchAsync(async (req, res, next) => {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 100);
    const sortBy = String(req.query.sortBy || "createdAt");
    const order = String(req.query.order).toLowerCase() === "asc" ? "asc" : "desc";
    const allowedSortFields = ["createdAt", "updatedAt", "email", "username", "fullName", "isActive", "isVerified"];
    if (!allowedSortFields.includes(sortBy))
        return next(new AppError("Invalid sort field", 400));
    const where = buildUserQuery(req.query);
    const [users, total] = await Promise.all([
        prisma.user.findMany({ where, orderBy: { [sortBy]: order }, skip: (page - 1) * limit, take: limit, include: { avatar: true } }),
        prisma.user.count({ where })
    ]);
    return res.status(200).json({
        status: 1, message: "Users retrieved successfully", pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
        data: users.map(user => userResponse(req, user))
    });
});
export const getUser = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const user = await prisma.user.findUnique({ where: { id }, include: { avatar: true } });
    if (!user)
        return next(new AppError("User not found", 404));
    return res.status(200).json({ status: 1, message: "User retrieved successfully", data: userResponse(req, user) });
});
export const updateUser = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const { email, phone, username, fullName, role, isVerified, isActive } = req.body;
    const existingUser = await prisma.user.findUnique({ where: { id }, include: { avatar: true } });
    if (!existingUser)
        return next(new AppError("User not found", 404));
    const normalizedEmail = email !== undefined ? String(email).trim().toLowerCase() : undefined;
    const normalizedPhone = phone !== undefined ? String(phone).trim() : undefined;
    const normalizedUsername = username !== undefined ? String(username).trim().toLowerCase() : undefined;
    if (normalizedEmail !== undefined && normalizedEmail !== existingUser.email) {
        const emailExists = await prisma.user.findUnique({ where: { email: normalizedEmail } });
        if (emailExists)
            return next(new AppError("Email is already registered", 409));
    }
    if (normalizedPhone !== undefined && normalizedPhone !== existingUser.phone) {
        const phoneExists = await prisma.user.findUnique({ where: { phone: normalizedPhone } });
        if (phoneExists)
            return next(new AppError("Phone number is already registered", 409));
    }
    if (normalizedUsername !== undefined && normalizedUsername !== existingUser.username) {
        const usernameExists = await prisma.user.findUnique({ where: { username: normalizedUsername } });
        if (usernameExists)
            return next(new AppError("Username is already taken", 409));
    }
    const data = {};
    if (normalizedEmail !== undefined)
        data.email = normalizedEmail;
    if (normalizedPhone !== undefined)
        data.phone = normalizedPhone;
    if (normalizedUsername !== undefined)
        data.username = normalizedUsername;
    if (fullName !== undefined)
        data.fullName = fullName === null ? null : String(fullName).trim();
    if (role !== undefined)
        data.role = role;
    if (isVerified !== undefined)
        data.isVerified = isVerified === true || isVerified === "true";
    if (isActive !== undefined)
        data.isActive = isActive === true || isActive === "true";
    if (req.file) {
        const newAvatar = await FileManager.upload(req.file);
        data.avatarFileId = newAvatar.id;
    }
    const user = await prisma.user.update({ where: { id }, data, include: { avatar: true } });
    if (req.file && existingUser.avatar)
        await FileManager.delete(existingUser.avatar.id);
    return res.status(200).json({ status: 1, message: "User updated successfully", data: userResponse(req, user) });
});
export const resetPassword = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const user = await prisma.user.findUnique({
        where: { id },
        select: { id: true, email: true, fullName: true },
    });
    if (!user)
        return next(new AppError("User not found", 404));
    const temporaryPassword = crypto.randomBytes(8).toString("hex");
    const passwordHash = await argon2.hash(temporaryPassword);
    await prisma.user.update({
        where: { id },
        data: { passwordHash, mustChangePassword: true },
    });
    try {
        await sendEmail({
            email: user.email,
            subject: "Your Redmit Password Has Been Reset",
            message: `Hello ${user.fullName || "User"},

Your Redmit account password has been reset by an administrator.

Your temporary password is:

${temporaryPassword}

Please log in using this temporary password and change it immediately for security reasons.

If you did not expect this password reset, please contact Redmit support.

Best regards,
Redmit Team

https://redmit.com`,
        });
    }
    catch (error) {
        return next(new AppError("Password was reset, but we could not send the email to the user.", 500));
    }
    return res.status(200).json({
        status: 1,
        message: "Password reset successfully. A temporary password has been sent to the user's email.",
    });
});
export const updateStatus = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const { isActive } = req.body;
    if (typeof isActive !== "boolean")
        return next(new AppError("isActive must be a boolean", 400));
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user)
        return next(new AppError("User not found", 404));
    await prisma.user.update({ where: { id }, data: { isActive } });
    return res.status(200).json({ status: 1, message: `User ${isActive ? "activated" : "deactivated"} successfully` });
});
export const deleteUser = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user)
        return next(new AppError("User not found", 404));
    await prisma.user.update({ where: { id }, data: { isActive: false } });
    return res.status(200).json({ status: 1, message: "User deleted successfully" });
});
export const deleteUsers = catchAsync(async (req, res, next) => {
    const { ids } = req.body;
    if (!Array.isArray(ids) || !ids.length)
        return next(new AppError("User IDs are required", 400));
    const result = await prisma.user.updateMany({ where: { id: { in: ids } }, data: { isActive: false } });
    return res.status(200).json({ status: 1, message: "Users deleted successfully", count: result.count });
});
export const deleteAllUsers = catchAsync(async (req, res, next) => {
    const result = await prisma.user.updateMany({ data: { isActive: false } });
    return res.status(200).json({ status: 1, message: "All users deleted successfully", count: result.count });
});
export const sendEmailToUser = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const { subject, message } = req.body;
    if (!subject || !message)
        return next(new AppError("Subject and message are required", 400));
    const user = await prisma.user.findUnique({ where: { id }, select: { email: true } });
    if (!user)
        return next(new AppError("User not found", 404));
    await sendEmail({ email: user.email, subject, message });
    return res.status(200).json({ status: 1, message: "Email sent successfully" });
});
export const sendEmails = catchAsync(async (req, res, next) => {
    const { ids, subject, message } = req.body;
    if (!Array.isArray(ids) || !ids.length)
        return next(new AppError("User IDs are required", 400));
    if (!subject || !message)
        return next(new AppError("Subject and message are required", 400));
    const users = await prisma.user.findMany({ where: { id: { in: ids }, isActive: true }, select: { email: true } });
    if (!users.length)
        return next(new AppError("No users found", 404));
    await Promise.all(users.map(user => sendEmail({ email: user.email, subject, message })));
    return res.status(200).json({ status: 1, message: "Emails sent successfully", count: users.length });
});
export const sendEmailToAllUsers = catchAsync(async (req, res, next) => {
    const { subject, message } = req.body;
    if (!subject || !message)
        return next(new AppError("Subject and message are required", 400));
    const users = await prisma.user.findMany({ where: { isActive: true }, select: { email: true } });
    if (!users.length)
        return next(new AppError("No active users found", 404));
    await Promise.all(users.map(user => sendEmail({ email: user.email, subject, message })));
    return res.status(200).json({ status: 1, message: "Email sent to all users successfully", count: users.length });
});
