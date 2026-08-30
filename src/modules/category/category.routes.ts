import { Router } from "express";
import { upload } from "../../middleware/upload.middleware.js";
import { createCategory, getCategories, getCategory, updateCategory, updateStatus, deleteCategory } from "./category.controller.js";
import { jwtAuthenticate, requireAdmin } from "../../middleware/jwtAuthenticate.js";

const router = Router();

// Public read routes
router.get("/", getCategories);
router.get("/:id", getCategory);

// Write routes require authentication + admin role
router.post("/", jwtAuthenticate, requireAdmin, upload.single("image"), createCategory);
router.patch("/:id", jwtAuthenticate, requireAdmin, upload.single("image"), updateCategory);
router.patch("/:id/status", jwtAuthenticate, requireAdmin, updateStatus);
router.delete("/:id", jwtAuthenticate, requireAdmin, deleteCategory);

export default router;
