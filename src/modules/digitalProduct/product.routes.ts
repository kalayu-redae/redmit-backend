import { Router } from "express";
import { upload } from "../../middleware/upload.middleware.js";
import { jwtAuthenticate } from "../../middleware/jwtAuthenticate.js";
import { createProduct, getProducts, getProduct, getMyProducts, updateProduct, updateProductStatus, deleteProduct } from "./product.controller.js";

const router = Router();

router.get("/", getProducts);
router.get("/my", jwtAuthenticate, getMyProducts);
router.get("/:id", getProduct);

router.post("/", jwtAuthenticate, upload.fields([{ name: "thumbnail", maxCount: 1 }, { name: "files", maxCount: 20 }]), createProduct);
router.patch("/:id", jwtAuthenticate, upload.fields([{ name: "thumbnail", maxCount: 1 }, { name: "files", maxCount: 20 }]), updateProduct);
router.patch("/:id/status", jwtAuthenticate, updateProductStatus);
router.delete("/:id", jwtAuthenticate, deleteProduct);

export default router;