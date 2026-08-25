import fs from "fs/promises";
import path from "path";
import { FileCategory } from "../../generated/prisma/client.js";
import { FILE_DIRECTORIES } from "./file.config.js";

export const ensureUploadDirectories = async () => {
    await Promise.all(
        Object.values(FILE_DIRECTORIES).map((directory) =>
            fs.mkdir(directory, { recursive: true })
        )
    );
};

export const getFileCategory = (mimeType: string): FileCategory => {
    if (mimeType.startsWith("image/")) {
        return FileCategory.IMAGE;
    }

    if (mimeType.startsWith("video/")) {
        return FileCategory.VIDEO;
    }

    if (mimeType.startsWith("audio/")) {
        return FileCategory.AUDIO;
    }

    if (
        mimeType === "application/zip" ||
        mimeType === "application/x-rar-compressed" ||
        mimeType === "application/x-7z-compressed" ||
        mimeType === "application/gzip"
    ) {
        return FileCategory.ARCHIVE;
    }

    return FileCategory.DOCUMENT;
};

export const deletePhysicalFile = async (filePath: string) => {
    try {
        await fs.unlink(filePath);
    } catch (error: any) {
        if (error.code !== "ENOENT") {
            throw error;
        }
    }
};

export const getRelativeFilePath = (
    category: FileCategory,
    filename: string
) => {
    const folders: Record<FileCategory, string> = {
        IMAGE: "images",
        DOCUMENT: "documents",
        VIDEO: "videos",
        AUDIO: "audio",
        ARCHIVE: "archives",
    };

    return path.join("uploads", folders[category], filename);
};