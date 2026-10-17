import { Router } from "express";
import { upload } from "../../middleware/upload.middleware.js";
import { jwtAuthenticate } from "../../middleware/jwtAuthenticate.js";
import { createDVApplication, getDVApplications, getDVApplication, updateDVApplication, updateDVApplicationStatus, deleteDVApplication, } from "./dvApplication.controller.js";
const router = Router();
// All routes require authentication
router.use(jwtAuthenticate);
/**
 * @swagger
 * /api/dv-applications:
 *   get:
 *     summary: List DV applications — admins see all, users see only their own
 *     tags:
 *       - DV Applications
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *           maximum: 100
 *         description: Items per page (max 100)
 *       - in: query
 *         name: status
 *         schema:
 *           $ref: '#/components/schemas/DVApplicationStatus'
 *         description: Filter by application status
 *       - in: query
 *         name: dvYear
 *         schema:
 *           type: integer
 *           example: 2026
 *         description: Filter by DV lottery year
 *     responses:
 *       200:
 *         description: Paginated list of DV applications
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: integer
 *                   example: 1
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/DVApplication'
 *       400:
 *         description: Invalid status or dvYear value
 *       401:
 *         description: Not authenticated
 *   post:
 *     summary: Create a new DV application
 *     description: >
 *       The authenticated user becomes the applicant (`userId`). A `providerId`
 *       must be supplied to link the application to an active service provider.
 *       An optional thumbnail image may be uploaded.
 *     tags:
 *       - DV Applications
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - providerId
 *               - name
 *               - price
 *               - serviceFee
 *               - dvYear
 *             properties:
 *               providerId:
 *                 type: string
 *                 format: uuid
 *                 description: ID of the active provider user handling this application
 *               name:
 *                 type: string
 *                 example: DV Application Assistance
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *                 example: 150.00
 *                 description: Total service price (non-negative)
 *               serviceFee:
 *                 type: number
 *                 example: 25.00
 *                 description: Internal service fee (non-negative)
 *               currency:
 *                 type: string
 *                 default: USD
 *               dvYear:
 *                 type: integer
 *                 example: 2026
 *               details:
 *                 type: object
 *                 description: Any extra JSON details
 *               thumbnail:
 *                 type: string
 *                 format: binary
 *                 description: Optional cover image
 *     responses:
 *       201:
 *         description: DV application created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: integer
 *                   example: 1
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/DVApplication'
 *       400:
 *         description: Missing required fields, invalid fee value, or non-integer dvYear
 *       401:
 *         description: Not authenticated
 *       404:
 *         description: Active provider not found
 */
router.get("/", getDVApplications);
router.post("/", upload.fields([{ name: "thumbnail", maxCount: 1 }]), createDVApplication);
/**
 * @swagger
 * /api/dv-applications/{id}:
 *   get:
 *     summary: Get a single DV application by ID
 *     description: >
 *       Regular users can only retrieve their own applications.
 *       Admins can retrieve any application.
 *     tags:
 *       - DV Applications
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
 *         description: DV application found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: integer
 *                   example: 1
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/DVApplication'
 *       401:
 *         description: Not authenticated
 *       404:
 *         description: Not found or not authorised to view this application
 *   patch:
 *     summary: Update a DV application (admin only)
 *     description: >
 *       Admins can update any field on the application, including fees,
 *       year, status label, and thumbnail. All fields are optional.
 *     tags:
 *       - DV Applications
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
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *                 description: Non-negative
 *               serviceFee:
 *                 type: number
 *                 description: Non-negative
 *               currency:
 *                 type: string
 *               dvYear:
 *                 type: integer
 *               details:
 *                 type: object
 *               isActive:
 *                 type: boolean
 *               thumbnail:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: DV application updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: integer
 *                   example: 1
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/DVApplication'
 *       400:
 *         description: Invalid fee or dvYear value
 *       403:
 *         description: Admin role required
 *       404:
 *         description: DV application not found
 *   delete:
 *     summary: Delete a DV application (admin only)
 *     tags:
 *       - DV Applications
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
 *         description: DV application deleted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: integer
 *                   example: 1
 *                 message:
 *                   type: string
 *       403:
 *         description: Admin role required
 *       404:
 *         description: DV application not found
 */
router.get("/:id", getDVApplication);
router.patch("/:id", upload.fields([{ name: "thumbnail", maxCount: 1 }]), updateDVApplication);
router.delete("/:id", deleteDVApplication);
/**
 * @swagger
 * /api/dv-applications/{id}/status:
 *   patch:
 *     summary: Update the status of a DV application (admin only)
 *     description: >
 *       Transitions the application through its lifecycle statuses.
 *       Setting status to `SUBMITTED` automatically records a `submittedAt` timestamp.
 *     tags:
 *       - DV Applications
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
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 $ref: '#/components/schemas/DVApplicationStatus'
 *     responses:
 *       200:
 *         description: Status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: integer
 *                   example: 1
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/DVApplication'
 *       400:
 *         description: Missing or invalid status value
 *       403:
 *         description: Admin role required
 *       404:
 *         description: DV application not found
 */
router.patch("/:id/status", updateDVApplicationStatus);
export default router;
