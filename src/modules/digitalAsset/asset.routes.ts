import { Router } from "express";
import { upload } from "../../middleware/upload.middleware.js";
import { jwtAuthenticate } from "../../middleware/jwtAuthenticate.js";
import {
    createDigitalAsset,
    getDigitalAssets,
    getDigitalAsset,
    getMyDigitalAssets,
    updateDigitalAsset,
    updateDigitalAssetStatus,
    markDigitalAssetAsSold,
    deleteDigitalAsset,
} from "./asset.controller.js";

const router = Router();

router.get("/", getDigitalAssets);
router.get("/my", jwtAuthenticate, getMyDigitalAssets);
router.get("/:id", getDigitalAsset);

router.post("/", jwtAuthenticate,
    upload.fields([{ name: "thumbnail", maxCount: 1 }, { name: "files", maxCount: 20 }]),
    createDigitalAsset
);

router.patch("/:id", jwtAuthenticate,
    upload.fields([{ name: "thumbnail", maxCount: 1 }, { name: "files", maxCount: 20 }]),
    updateDigitalAsset
);

router.patch("/:id/status", jwtAuthenticate, updateDigitalAssetStatus);
router.patch("/:id/sold", jwtAuthenticate, markDigitalAssetAsSold);
router.delete("/:id", jwtAuthenticate, deleteDigitalAsset);

export default router;