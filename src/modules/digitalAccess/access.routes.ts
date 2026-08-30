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

/**
 * @swagger
 * /api/access:
 *   get:
 *     summary: List all digital access services
 *     tags:
 *       - Digital Access
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
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *       - in: query
 *         name: providerId
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           default: createdAt
 *           enum:
 *             - name
 *             - price
 *             - createdAt
 *             - updatedAt
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum:
 *             - asc
 *             - desc
 *           default: desc
 *     responses:
 *       200:
 *         description: Paginated list of digital access services
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
 *                     type: object
 *   post:
 *     summary: Create a digital access service
 *     tags:
 *       - Digital Access
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - type
 *               - price
 *             properties:
 *               name:
 *                 type: string
 *               slug:
 *                 type: string
 *                 description: Auto-generated if omitted
 *               type:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               currency:
 *                 type: string
 *                 default: USD
 *               details:
 *                 type: string
 *                 description: JSON string of extra details
 *               thumbnail:
 *                 type: string
 *                 format: binary
 *               files:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       201:
 *         description: Access service created
 *       409:
 *         description: Slug already exists
 */
router.get("/", getDigitalAccesses);
router.post("/", jwtAuthenticate, upload.fields([{ name: "thumbnail", maxCount: 1 }, { name: "files", maxCount: 20 }]), createDigitalAccess);

/**
 * @swagger
 * /api/access/my:
 *   get:
 *     summary: Get the authenticated provider's own access services
 *     tags:
 *       - Digital Access
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Your access services
 *       401:
 *         description: Not authenticated
 */
router.get("/my", jwtAuthenticate, getMyDigitalAccesses);

/**
 * @swagger
 * /api/access/{id}:
 *   get:
 *     summary: Get a single digital access service by ID
 *     tags:
 *       - Digital Access
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Access service found
 *       404:
 *         description: Not found
 *   patch:
 *     summary: Update a digital access service (owner only)
 *     tags:
 *       - Digital Access
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
 *               slug:
 *                 type: string
 *               type:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               currency:
 *                 type: string
 *               details:
 *                 type: string
 *               thumbnail:
 *                 type: string
 *                 format: binary
 *               files:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       200:
 *         description: Access service updated
 *       403:
 *         description: Not the owner
 *       404:
 *         description: Not found
 *   delete:
 *     summary: Delete a digital access service (owner only)
 *     tags:
 *       - Digital Access
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
 *         description: Deleted
 *       403:
 *         description: Not the owner
 *       404:
 *         description: Not found
 */
router.get("/:id", getDigitalAccess);
router.patch("/:id", jwtAuthenticate, upload.fields([{ name: "thumbnail", maxCount: 1 }, { name: "files", maxCount: 20 }]), updateDigitalAccess);
router.delete("/:id", jwtAuthenticate, deleteDigitalAccess);

/**
 * @swagger
 * /api/access/{id}/status:
 *   patch:
 *     summary: Toggle a digital access service's active status (owner only)
 *     tags:
 *       - Digital Access
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
 *         description: Status toggled
 *       403:
 *         description: Not the owner
 *       404:
 *         description: Not found
 */
router.patch("/:id/status", jwtAuthenticate, updateDigitalAccessStatus);

export default router;
