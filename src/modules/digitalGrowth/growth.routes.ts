import { Router } from "express";
import { upload } from "../../middleware/upload.middleware.js";
import { jwtAuthenticate } from "../../middleware/jwtAuthenticate.js";
import {
    createDigitalGrowth,
    getDigitalGrowths,
    getDigitalGrowth,
    getMyDigitalGrowths,
    updateDigitalGrowth,
    updateDigitalGrowthStatus,
    deleteDigitalGrowth,
} from "./growth.controller.js";

const router = Router();

router.get("/", getDigitalGrowths);
router.get("/my", jwtAuthenticate, getMyDigitalGrowths);
router.get("/:id", getDigitalGrowth);

router.post("/", jwtAuthenticate, upload.fields([
    { name: "thumbnail", maxCount: 1 },
    { name: "files", maxCount: 20 },
]), createDigitalGrowth);

router.patch("/:id", jwtAuthenticate, upload.fields([
    { name: "thumbnail", maxCount: 1 },
    { name: "files", maxCount: 20 },
]), updateDigitalGrowth);

router.patch("/:id/status", jwtAuthenticate, updateDigitalGrowthStatus);
router.delete("/:id", jwtAuthenticate, deleteDigitalGrowth);

export default router;