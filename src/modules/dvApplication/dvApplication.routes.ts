
import { Router } from "express";
import { upload } from "../../middleware/upload.middleware.js";
import { jwtAuthenticate } from "../../middleware/jwtAuthenticate.js";
import {
    createDVApplication,
    getDVApplications,
    getDVApplication,
    updateDVApplication,
    updateDVApplicationStatus,
    deleteDVApplication,
} from "./dvApplication.controller.js";

const router = Router();

router.use(jwtAuthenticate);

router.get("/", getDVApplications);

router.post(
    "/",
    upload.fields([
        { name: "thumbnail", maxCount: 1 },
    ]),
    createDVApplication
);

router.get("/:id", getDVApplication);

router.patch(
    "/:id",
    upload.fields([
        { name: "thumbnail", maxCount: 1 },
    ]),
    updateDVApplication
);

router.patch("/:id/status", updateDVApplicationStatus);

router.delete("/:id", deleteDVApplication);

export default router;
