import { Router } from "express";
import { upload } from "../../middleware/upload.middleware.js";
import { jwtAuthenticate } from "../../middleware/jwtAuthenticate.js";
import FileManager from "../../utils/file/file.manager.js";
import catchAsync from "../../utils/catchAsync.js";

const router = Router();

// Upload routes — require authentication
router.post("/", jwtAuthenticate, upload.single("file"), catchAsync(async (req, res) => {
    if (!req.file) {
        return res.status(400).json({
            status: 0,
            message: "No file uploaded",
        });
    }

    const file = await FileManager.upload(req.file);

    return res.status(201).json({
        status: 1,
        message: "File uploaded successfully",
        data: file,
    });
}));

router.post("/many", jwtAuthenticate, upload.array("files", 20), catchAsync(async (req, res) => {
    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
        return res.status(400).json({
            status: 0,
            message: "No files uploaded",
        });
    }

    const savedFiles = await FileManager.uploadMany(files);

    return res.status(201).json({
        status: 1,
        message: "Files uploaded successfully",
        count: savedFiles.length,
        data: savedFiles,
    });
}));

// Read routes — public
router.get("/", catchAsync(async (req, res) => {
    const ids = String(req.query.ids || "")
        .split(",")
        .map((id) => id.trim())
        .filter(Boolean);

    if (ids.length === 0) {
        return res.status(400).json({
            status: 0,
            message: "Please provide file IDs",
        });
    }

    const files = await FileManager.getMany(ids);

    return res.status(200).json({
        status: 1,
        count: files.length,
        data: files,
    });
}));

router.get("/:id", catchAsync(async (req, res) => {
    const file = await FileManager.get(req.params.id as string);

    if (!file) {
        return res.status(404).json({
            status: 0,
            message: "File not found",
        });
    }

    return res.status(200).json({
        status: 1,
        data: file,
    });
}));

// Delete routes — require authentication
router.delete("/", jwtAuthenticate, catchAsync(async (req, res) => {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({
            status: 0,
            message: "Please provide an array of file IDs",
        });
    }

    const files = await FileManager.deleteMany(ids);

    return res.status(200).json({
        status: 1,
        message: "Files deleted successfully",
        count: files.length,
        data: files,
    });
}));

router.delete("/:id", jwtAuthenticate, catchAsync(async (req, res) => {
    const file = await FileManager.delete(req.params.id as string);

    if (!file) {
        return res.status(404).json({
            status: 0,
            message: "File not found",
        });
    }

    return res.status(200).json({
        status: 1,
        message: "File deleted successfully",
        data: file,
    });
}));

export default router;
