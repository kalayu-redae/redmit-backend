import { Router } from "express";
import { upload } from "../../middleware/upload.middleware.js";
import { jwtAuthenticate } from "../../middleware/jwtAuthenticate.js";
import FileManager from "../../utils/file/file.manager.js";
import catchAsync from "../../utils/catchAsync.js";
const router = Router();
/**
 * @swagger
 * /api/files:
 *   post:
 *     summary: Upload a single file
 *     tags:
 *       - Files
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: File uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: integer
 *                   example: 1
 *                 data:
 *                   $ref: '#/components/schemas/File'
 *       400:
 *         description: No file uploaded
 *       401:
 *         description: Not authenticated
 *   get:
 *     summary: Get multiple files by comma-separated IDs
 *     tags:
 *       - Files
 *     parameters:
 *       - in: query
 *         name: ids
 *         required: true
 *         schema:
 *           type: string
 *         description: Comma-separated file UUIDs e.g. id1,id2,id3
 *     responses:
 *       200:
 *         description: Files retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: integer
 *                   example: 1
 *                 count:
 *                   type: integer
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/File'
 *       400:
 *         description: No IDs provided
 *   delete:
 *     summary: Delete multiple files by IDs
 *     tags:
 *       - Files
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - ids
 *             properties:
 *               ids:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *     responses:
 *       200:
 *         description: Files deleted
 *       400:
 *         description: No IDs provided
 *       401:
 *         description: Not authenticated
 */
router.post("/", jwtAuthenticate, upload.single("file"), catchAsync(async (req, res) => {
    if (!req.file)
        return res.status(400).json({ status: 0, message: "No file uploaded" });
    const file = await FileManager.upload(req.file);
    return res.status(201).json({ status: 1, message: "File uploaded successfully", data: file });
}));
router.get("/", catchAsync(async (req, res) => {
    const ids = String(req.query.ids || "").split(",").map(id => id.trim()).filter(Boolean);
    if (ids.length === 0)
        return res.status(400).json({ status: 0, message: "Please provide file IDs" });
    const files = await FileManager.getMany(ids);
    return res.status(200).json({ status: 1, count: files.length, data: files });
}));
router.delete("/", jwtAuthenticate, catchAsync(async (req, res) => {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0)
        return res.status(400).json({ status: 0, message: "Please provide an array of file IDs" });
    const files = await FileManager.deleteMany(ids);
    return res.status(200).json({ status: 1, message: "Files deleted successfully", count: files.length, data: files });
}));
/**
 * @swagger
 * /api/files/many:
 *   post:
 *     summary: Upload multiple files (max 20)
 *     tags:
 *       - Files
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - files
 *             properties:
 *               files:
 *                 type: array
 *                 maxItems: 20
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       201:
 *         description: Files uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: integer
 *                   example: 1
 *                 count:
 *                   type: integer
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/File'
 *       400:
 *         description: No files provided
 *       401:
 *         description: Not authenticated
 */
router.post("/many", jwtAuthenticate, upload.array("files", 20), catchAsync(async (req, res) => {
    const files = req.files;
    if (!files || files.length === 0)
        return res.status(400).json({ status: 0, message: "No files uploaded" });
    const savedFiles = await FileManager.uploadMany(files);
    return res.status(201).json({ status: 1, message: "Files uploaded successfully", count: savedFiles.length, data: savedFiles });
}));
/**
 * @swagger
 * /api/files/{id}:
 *   get:
 *     summary: Get a single file by ID
 *     tags:
 *       - Files
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: File found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: integer
 *                   example: 1
 *                 data:
 *                   $ref: '#/components/schemas/File'
 *       404:
 *         description: File not found
 *   delete:
 *     summary: Delete a single file by ID
 *     tags:
 *       - Files
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: File deleted
 *       401:
 *         description: Not authenticated
 *       404:
 *         description: File not found
 */
router.get("/:id", catchAsync(async (req, res) => {
    const file = await FileManager.get(req.params.id);
    if (!file)
        return res.status(404).json({ status: 0, message: "File not found" });
    return res.status(200).json({ status: 1, data: file });
}));
router.delete("/:id", jwtAuthenticate, catchAsync(async (req, res) => {
    const file = await FileManager.delete(req.params.id);
    if (!file)
        return res.status(404).json({ status: 0, message: "File not found" });
    return res.status(200).json({ status: 1, message: "File deleted successfully", data: file });
}));
export default router;
