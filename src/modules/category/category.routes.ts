import { Router } from "express";
import { upload } from "../../middleware/upload.middleware.js";
import { createCategory, getCategories, getCategory, updateCategory, updateStatus, deleteCategory } from "./category.controller.js";

const router = Router();

router.post("/", upload.single("image"), createCategory);
router.get("/", getCategories);
router.get("/:id", getCategory);
router.patch("/:id", upload.single("image"), updateCategory);
router.patch("/:id/status", updateStatus);
router.delete("/:id", deleteCategory);

export default router;