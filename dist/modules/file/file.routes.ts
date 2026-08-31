// import { Router } from "express";
// import { upload } from "../../middleware/upload.middleware.js";
// import FileManager from "../../utils/file/file.manager.js";
// import catchAsync from "../../utils/catchAsync.js";
// const router = Router();
// router.post("/", upload.single("file"), catchAsync(async (req, res, next) => {
//     if (!req.file) {
//         return res.status(400).json({
//             status: 0,
//             message: "No file uploaded",
//         });
//     }
//     console.log("req.file", req.file);
//     const file = await FileManager.upload(req.file);
//     return res.status(201).json({
//         status: 1,
//         message: "File uploaded successfully",
//         data: file,
//     });
// }));
// router.post("/many", upload.array("files", 20), catchAsync(async (req, res, next) => {
//     const files = req.files;
//     if (!files || files.length === 0) {
//         return res.status(400).json({
//             status: 0,
//             message: "No files uploaded",
//         });
//     }
//     const savedFiles = await FileManager.uploadMany(files);
//     return res.status(201).json({
//         status: 1,
//         message: "Files uploaded successfully",
//         count: savedFiles.length,
//         data: savedFiles,
//     });
// }));
// router.get("/", catchAsync(async (req, res, next) => {
//     const ids = String(req.query.ids || "")
//         .split(",")
//         .map((id) => id.trim())
//         .filter(Boolean);
//     if (ids.length === 0) {
//         return res.status(400).json({
//             status: 0,
//             message: "Please provide file IDs",
//         });
//     }
//     const files = await FileManager.getMany(ids);
//     return res.status(200).json({
//         status: 1,
//         count: files.length,
//         data: files,
//     });
// }));
// router.get("/:id", catchAsync(async (req, res, next) => {
//     const file = await FileManager.get(req.params.id);
//     if (!file) {
//         return res.status(404).json({
//             status: 0,
//             message: "File not found",
//         });
//     }
//     return res.status(200).json({
//         status: 1,
//         data: file,
//     });
// }));
// router.delete("/", catchAsync(async (req, res, next) => {
//     const { ids } = req.body;
//     if (!Array.isArray(ids) || ids.length === 0) {
//         return res.status(400).json({
//             status: 0,
//             message: "Please provide an array of file IDs",
//         });
//     }
//     const files = await FileManager.deleteMany(ids);
//     return res.status(200).json({
//         status: 1,
//         message: "Files deleted successfully",
//         count: files.length,
//         data: files,
//     });
// }));
// router.delete("/:id", catchAsync(async (req, res, next) => {
//     const file = await FileManager.delete(req.params.id);
//     if (!file) {
//         return res.status(404).json({
//             status: 0,
//             message: "File not found",
//         });
//     }
//     return res.status(200).json({
//         status: 1,
//         message: "File deleted successfully",
//         data: file,
//     });
// }));
// export default router;
