import { Router } from "express";
import { upload } from "../../middleware/upload.middleware.js";
import { jwtAuthenticate } from "../../middleware/jwtAuthenticate.js";
import {
    createDigitalAccess,
    getDigitalAccesses,
    getDigitalAccess,
    getMyDigitalAccesses,
    updateDigitalAccess,
    updateDigitalAccessStatus,
    deleteDigitalAccess,
} from "./access.controller.js";

const router = Router();

router.get("/", getDigitalAccesses);
router.get("/my", jwtAuthenticate, getMyDigitalAccesses);
router.get("/:id", getDigitalAccess);

router.post("/", jwtAuthenticate, upload.fields([
    { name: "thumbnail", maxCount: 1 },
    { name: "files", maxCount: 20 },
]), createDigitalAccess);

router.patch("/:id", jwtAuthenticate, upload.fields([
    { name: "thumbnail", maxCount: 1 },
    { name: "files", maxCount: 20 },
]), updateDigitalAccess);

router.patch("/:id/status", jwtAuthenticate, updateDigitalAccessStatus);
router.delete("/:id", jwtAuthenticate, deleteDigitalAccess);

export default router;