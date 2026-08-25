import path from "path";
import { FileCategory } from "../../generated/prisma/client.js";

export const UPLOAD_ROOT = path.join(process.cwd(), "uploads");

export const FILE_DIRECTORIES: Record<FileCategory, string> = {
    IMAGE: path.join(UPLOAD_ROOT, "images"),
    DOCUMENT: path.join(UPLOAD_ROOT, "documents"),
    VIDEO: path.join(UPLOAD_ROOT, "videos"),
    AUDIO: path.join(UPLOAD_ROOT, "audio"),
    ARCHIVE: path.join(UPLOAD_ROOT, "archives"),
};

export const FILE_BASE_URL = process.env.BASE_URL || "http://localhost:5000";