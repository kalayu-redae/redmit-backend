import { Router } from "express";
import { upload } from "../../middleware/upload.middleware.js";
import { jwtAuthenticate } from "../../middleware/jwtAuthenticate.js";
import { createProduct, getProducts, getProduct, getMyProducts, updateProduct, updateProductStatus, deleteProduct } from "./product.controller.js";
const router = Router();
/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: List all digital products
 *     tags:
 *       - Digital Products
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
 *         name: categoryId
 *         schema:
 *           type: string
 *           format: uuid
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
 *         description: Paginated list of products
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
 *     summary: Create a digital product
 *     tags:
 *       - Digital Products
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
 *               - categoryId
 *               - price
 *             properties:
 *               name:
 *                 type: string
 *               slug:
 *                 type: string
 *                 description: Auto-generated from name if omitted
 *               shortDescription:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               currency:
 *                 type: string
 *                 default: USD
 *               categoryId:
 *                 type: string
 *                 format: uuid
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
 *         description: Product created
 *       400:
 *         description: Validation error
 *       409:
 *         description: Product slug already exists
 */
router.get("/", getProducts);
router.post("/", jwtAuthenticate, upload.fields([{ name: "thumbnail", maxCount: 1 }, { name: "files", maxCount: 20 }]), createProduct);
/**
 * @swagger
 * /api/products/my:
 *   get:
 *     summary: Get the authenticated seller's own products
 *     tags:
 *       - Digital Products
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Your products
 *       401:
 *         description: Not authenticated
 */
router.get("/my", jwtAuthenticate, getMyProducts);
/**
 * @swagger
 * /api/products/{id}:
 *   get:
 *     summary: Get a single digital product by ID
 *     tags:
 *       - Digital Products
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Product found
 *       404:
 *         description: Product not found
 *   patch:
 *     summary: Update a digital product (owner only)
 *     tags:
 *       - Digital Products
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
 *               shortDescription:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               currency:
 *                 type: string
 *               categoryId:
 *                 type: string
 *                 format: uuid
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
 *         description: Product updated
 *       403:
 *         description: Not the owner
 *       404:
 *         description: Product not found
 *   delete:
 *     summary: Delete a digital product (owner only)
 *     tags:
 *       - Digital Products
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
 *         description: Product deleted
 *       403:
 *         description: Not the owner
 *       404:
 *         description: Product not found
 */
router.get("/:id", getProduct);
router.patch("/:id", jwtAuthenticate, upload.fields([{ name: "thumbnail", maxCount: 1 }, { name: "files", maxCount: 20 }]), updateProduct);
router.delete("/:id", jwtAuthenticate, deleteProduct);
/**
 * @swagger
 * /api/products/{id}/status:
 *   patch:
 *     summary: Toggle a product's active status (owner only)
 *     tags:
 *       - Digital Products
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
 *       404:
 *         description: Product not found
 */
router.patch("/:id/status", jwtAuthenticate, updateProductStatus);
export default router;
