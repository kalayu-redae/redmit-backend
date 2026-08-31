import { Router } from "express";
import { upload } from "../../middleware/upload.middleware.js";
import { jwtAuthenticate } from "../../middleware/jwtAuthenticate.js";
import { createDigitalGrowth, getDigitalGrowths, getDigitalGrowth, getMyDigitalGrowths, updateDigitalGrowth, updateDigitalGrowthStatus, deleteDigitalGrowth, } from "./growth.controller.js";
const router = Router();
/**
 * @swagger
 * /api/growth:
 *   get:
 *     summary: List all digital growth services
 *     tags:
 *       - Digital Growth
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
 *         description: Paginated list of digital growth services
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
 *     summary: Create a digital growth service
 *     tags:
 *       - Digital Growth
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
 *         description: Growth service created
 *       409:
 *         description: Slug already exists
 */
router.get("/", getDigitalGrowths);
router.post("/", jwtAuthenticate, upload.fields([{ name: "thumbnail", maxCount: 1 }, { name: "files", maxCount: 20 }]), createDigitalGrowth);
/**
 * @swagger
 * /api/growth/my:
 *   get:
 *     summary: Get the authenticated provider's own growth services
 *     tags:
 *       - Digital Growth
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Your growth services
 *       401:
 *         description: Not authenticated
 */
router.get("/my", jwtAuthenticate, getMyDigitalGrowths);
/**
 * @swagger
 * /api/growth/{id}:
 *   get:
 *     summary: Get a single digital growth service by ID
 *     tags:
 *       - Digital Growth
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Growth service found
 *       404:
 *         description: Not found
 *   patch:
 *     summary: Update a digital growth service (owner only)
 *     tags:
 *       - Digital Growth
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
 *         description: Growth service updated
 *       403:
 *         description: Not the owner
 *       404:
 *         description: Not found
 *   delete:
 *     summary: Delete a digital growth service (owner only)
 *     tags:
 *       - Digital Growth
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
router.get("/:id", getDigitalGrowth);
router.patch("/:id", jwtAuthenticate, upload.fields([{ name: "thumbnail", maxCount: 1 }, { name: "files", maxCount: 20 }]), updateDigitalGrowth);
router.delete("/:id", jwtAuthenticate, deleteDigitalGrowth);
/**
 * @swagger
 * /api/growth/{id}/status:
 *   patch:
 *     summary: Toggle a growth service's active status (owner only)
 *     tags:
 *       - Digital Growth
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
router.patch("/:id/status", jwtAuthenticate, updateDigitalGrowthStatus);
export default router;
