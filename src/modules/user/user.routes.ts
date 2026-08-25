import { Router } from "express";

import { getUser, getUsers, updateUser, resetPassword, updateStatus, deleteUser, deleteUsers, deleteAllUsers, sendEmailToUser, sendEmails, sendEmailToAllUsers } from "./user.controller.js";

import { jwtAuthenticate } from "../../middleware/jwtAuthenticate.js";
import { upload } from "../../middleware/upload.middleware.js";

const router = Router();


router.get("/", getUsers);
router.get("/:id", getUser);
router.patch("/:id", upload.single("avatar"), updateUser);
router.patch("/:id/password", resetPassword);
router.patch("/:id/status", updateStatus);

router.delete("/:id", deleteUser);
router.delete("/", deleteUsers);
router.delete("/all", deleteAllUsers);

router.post("/:id/email", sendEmailToUser);
router.post("/email", sendEmails);
router.post("/email/all", sendEmailToAllUsers);


export default router;