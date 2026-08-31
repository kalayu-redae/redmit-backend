import multer from "multer";
import path from "path";
import fs from "fs";
import crypto from "crypto";
const tempDirectory = path.join(process.cwd(), "uploads", "temp");
if (!fs.existsSync(tempDirectory)) {
    fs.mkdirSync(tempDirectory, {
        recursive: true,
    });
}
const storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
        cb(null, tempDirectory);
    },
    filename: (_req, file, cb) => {
        const extension = path.extname(file.originalname);
        const originalName = path
            .basename(file.originalname, extension)
            .trim()
            .replace(/[^a-zA-Z0-9-_]/g, "-")
            .replace(/-+/g, "-")
            .toLowerCase();
        const uniqueId = crypto.randomUUID();
        const filename = `${uniqueId}-${originalName}${extension.toLowerCase()}`;
        cb(null, filename);
    },
});
export const upload = multer({
    storage,
    limits: {
        fileSize: 100 * 1024 * 1024,
    },
});
