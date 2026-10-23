import { Router } from "express";
import { upload } from "../../middleware/upload.middleware.js";
import { jwtAuthenticate } from "../../middleware/jwtAuthenticate.js";
import {
    createDVProgram,
    getDVPrograms,
    getDVProgram,
    updateDVProgram,
    updateDVProgramStatus,
    deleteDVProgram,
} from "./dvProgram.controller.js";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: DV Programs
 *   description: Diversity Visa program management
 */

/**
 * @swagger
 * /api/dv-programs:
 *   get:
 *     summary: List DV programs
 *     tags:
 *       - DV Programs
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: dvYear
 *         schema:
 *           type: integer
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Admin-only filter
 *       - in: query
 *         name: acceptingRequests
 *         schema:
 *           type: boolean
 *         description: Admin-only filter
 *     responses:
 *       200:
 *         description: Paginated DV programs
 *       400:
 *         description: Invalid query parameter
 */
router.get("/", getDVPrograms);

/**
 * @swagger
 * /api/dv-programs/{id}:
 *   get:
 *     summary: Get a DV program by ID
 *     tags:
 *       - DV Programs
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: DV program retrieved successfully
 *       404:
 *         description: DV program not found
 */
router.get("/:id", getDVProgram);

/**
 * @swagger
 * /api/dv-programs:
 *   post:
 *     summary: Create a DV program
 *     tags:
 *       - DV Programs
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - dvYear
 *               - startDate
 *               - endDate
 *             properties:
 *               dvYear:
 *                 type: integer
 *               startDate:
 *                 type: string
 *                 format: date-time
 *               endDate:
 *                 type: string
 *                 format: date-time
 *               paymentAssistanceFee:
 *                 type: number
 *                 default: 0
 *               formFillingFee:
 *                 type: number
 *                 default: 0
 *               internationalPaymentFee:
 *                 type: number
 *                 default: 0
 *               currency:
 *                 type: string
 *                 default: ETB
 *               thumbnail:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: DV program created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Admin access required
 *       409:
 *         description: DV year already exists
 */
router.post(
    "/",
    jwtAuthenticate,
    upload.fields([{ name: "thumbnail", maxCount: 1 }]),
    createDVProgram,
);

/**
 * @swagger
 * /api/dv-programs/{id}:
 *   patch:
 *     summary: Update a DV program
 *     tags:
 *       - DV Programs
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               dvYear:
 *                 type: integer
 *               startDate:
 *                 type: string
 *                 format: date-time
 *               endDate:
 *                 type: string
 *                 format: date-time
 *               paymentAssistanceFee:
 *                 type: number
 *               formFillingFee:
 *                 type: number
 *               internationalPaymentFee:
 *                 type: number
 *               currency:
 *                 type: string
 *               thumbnail:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: DV program updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Admin access required
 *       404:
 *         description: DV program not found
 *       409:
 *         description: DV year already exists
 */
router.patch(
    "/:id",
    jwtAuthenticate,
    upload.fields([{ name: "thumbnail", maxCount: 1 }]),
    updateDVProgram,
);

/**
 * @swagger
 * /api/dv-programs/{id}/status:
 *   patch:
 *     summary: Activate/deactivate a DV program or control request acceptance
 *     tags:
 *       - DV Programs
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               isActive:
 *                 type: boolean
 *               acceptingRequests:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: DV program status updated successfully
 *       400:
 *         description: Invalid status combination
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Admin access required
 *       404:
 *         description: DV program not found
 */
router.patch("/:id/status", jwtAuthenticate, updateDVProgramStatus);

/**
 * @swagger
 * /api/dv-programs/{id}:
 *   delete:
 *     summary: Delete a DV program
 *     tags:
 *       - DV Programs
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: DV program deleted successfully
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Admin access required
 *       404:
 *         description: DV program not found
 *       409:
 *         description: Cannot delete a program that has requests
 */
router.delete("/:id", jwtAuthenticate, deleteDVProgram);

export default router;