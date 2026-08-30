import { Router } from "express";

import { getUser, getUsers, updateUser, resetPassword, updateStatus, deleteUser, deleteUsers, deleteAllUsers, sendEmailToUser, sendEmails, sendEmailToAllUsers } from "./user.controller.js";

import { jwtAuthenticate, requireAdmin } from "../../middleware/jwtAuthenticate.js";
import { upload } from "../../middleware/upload.middleware.js";

const router = Router();

// All user-admin routes require authentication + admin role
router.use(jwtAuthenticate, requireAdmin);

router.get("/", getUsers);
router.get("/:id", getUser);
router.patch("/:id", upload.single("avatar"), updateUser);
router.patch("/:id/password", resetPassword);
router.patch("/:id/status", updateStatus);

// Static routes MUST come before /:id to avoid being swallowed as a param
router.delete("/all", deleteAllUsers);   // must be before /:id
router.delete("/", deleteUsers);
router.delete("/:id", deleteUser);

router.post("/:id/email", sendEmailToUser);
router.post("/email/all", sendEmailToAllUsers);   // must be before /email (more specific first)
router.post("/email", sendEmails);

export default router;
