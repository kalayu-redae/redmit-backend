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

/**
 * @swagger
 * /api/assets:
 *   get:
 *     summary: List all digital assets
 *     tags:
 *       - Digital Assets
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
 *           enum:
 *             - SOCIAL_MEDIA_ACCOUNT
 *             - OTHER
 *       - in: query
 *         name: sellerId
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
 *         name: isSold
 *         schema:
 *           type: boolean
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
 *         description: Paginated list of digital assets
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
 *     summary: Create a digital asset
 *     tags:
 *       - Digital Assets
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
 *                 description: Auto-generated from name if omitted
 *               type:
 *                 type: string
 *                 enum:
 *                   - SOCIAL_MEDIA_ACCOUNT
 *                   - OTHER
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               currency:
 *                 type: string
 *                 default: USD
 *               thumbnail:
 *                 type: string
 *                 format: binary
 *               files:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *               platform:
 *                 type: string
 *                 description: Required for SOCIAL_MEDIA_ACCOUNT type
 *               username:
 *                 type: string
 *               profileUrl:
 *                 type: string
 *               followers:
 *                 type: integer
 *               following:
 *                 type: integer
 *               posts:
 *                 type: integer
 *               views:
 *                 type: integer
 *               country:
 *                 type: string
 *               niche:
 *                 type: string
 *               engagementRate:
 *                 type: number
 *               monthlyRevenue:
 *                 type: number
 *               revenueCurrency:
 *                 type: string
 *               category:
 *                 type: string
 *                 description: For OTHER type
 *               url:
 *                 type: string
 *               details:
 *                 type: string
 *                 description: JSON string of extra details
 *     responses:
 *       201:
 *         description: Digital asset created
 *       409:
 *         description: Asset slug already exists
 */
router.get("/", getDigitalAssets);
router.post("/", jwtAuthenticate, upload.fields([{ name: "thumbnail", maxCount: 1 }, { name: "files", maxCount: 20 }]), createDigitalAsset);

/**
 * @swagger
 * /api/assets/my:
 *   get:
 *     summary: Get the authenticated seller's own digital assets
 *     tags:
 *       - Digital Assets
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Your digital assets
 *       401:
 *         description: Not authenticated
 */
router.get("/my", jwtAuthenticate, getMyDigitalAssets);

/**
 * @swagger
 * /api/assets/{id}:
 *   get:
 *     summary: Get a single digital asset by ID
 *     tags:
 *       - Digital Assets
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Asset found
 *       404:
 *         description: Asset not found
 *   patch:
 *     summary: Update a digital asset (owner only)
 *     tags:
 *       - Digital Assets
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
 *                 enum:
 *                   - SOCIAL_MEDIA_ACCOUNT
 *                   - OTHER
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               currency:
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
 *         description: Asset updated
 *       403:
 *         description: Not the owner
 *       404:
 *         description: Asset not found
 *   delete:
 *     summary: Delete a digital asset (owner only)
 *     tags:
 *       - Digital Assets
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
 *         description: Asset deleted
 *       403:
 *         description: Not the owner
 *       404:
 *         description: Asset not found
 */
router.get("/:id", getDigitalAsset);
router.patch("/:id", jwtAuthenticate, upload.fields([{ name: "thumbnail", maxCount: 1 }, { name: "files", maxCount: 20 }]), updateDigitalAsset);
router.delete("/:id", jwtAuthenticate, deleteDigitalAsset);

/**
 * @swagger
 * /api/assets/{id}/status:
 *   patch:
 *     summary: Toggle a digital asset's active status (owner only)
 *     tags:
 *       - Digital Assets
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
 *         description: Asset not found
 */
router.patch("/:id/status", jwtAuthenticate, updateDigitalAssetStatus);

/**
 * @swagger
 * /api/assets/{id}/sold:
 *   patch:
 *     summary: Mark a digital asset as sold (owner only)
 *     description: Sets isSold to true and isActive to false. This cannot be undone via the API.
 *     tags:
 *       - Digital Assets
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
 *         description: Asset marked as sold
 *       403:
 *         description: Not the owner
 *       404:
 *         description: Asset not found
 */
router.patch("/:id/sold", jwtAuthenticate, markDigitalAssetAsSold);

export default router;
