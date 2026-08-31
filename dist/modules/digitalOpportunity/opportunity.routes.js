import { Router } from "express";
import { upload } from "../../middleware/upload.middleware.js";
import { jwtAuthenticate, requireAdmin } from "../../middleware/jwtAuthenticate.js";
import { createOpportunity, getOpportunities, getOpportunity, updateOpportunity, deleteOpportunity, publishOpportunity, unpublishOpportunity, } from "./opportunity.controller.js";
const router = Router();
/**
 * @swagger
 * /api/opportunities:
 *   get:
 *     summary: List opportunities with filters and pagination
 *     tags:
 *       - Opportunities
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
 *         name: type
 *         schema:
 *           type: string
 *           enum:
 *             - SCHOLARSHIP
 *             - JOB
 *             - INTERNSHIP
 *             - FELLOWSHIP
 *             - COMPETITION
 *             - GRANT
 *             - TRAINING
 *             - VOLUNTEER
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by title, organization, or description
 *       - in: query
 *         name: published
 *         schema:
 *           type: boolean
 *         description: Filter by publication status
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           default: createdAt
 *           enum:
 *             - createdAt
 *             - updatedAt
 *             - deadline
 *             - title
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
 *         description: Paginated list of opportunities
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
 *                     $ref: '#/components/schemas/Opportunity'
 *   post:
 *     summary: Create an opportunity (admin only)
 *     tags:
 *       - Opportunities
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - type
 *               - description
 *               - applicationUrl
 *             properties:
 *               title:
 *                 type: string
 *                 example: Erasmus Mundus Scholarship
 *               slug:
 *                 type: string
 *                 description: Auto-generated from title if omitted
 *               type:
 *                 type: string
 *                 enum:
 *                   - SCHOLARSHIP
 *                   - JOB
 *                   - INTERNSHIP
 *                   - FELLOWSHIP
 *                   - COMPETITION
 *                   - GRANT
 *                   - TRAINING
 *                   - VOLUNTEER
 *               description:
 *                 type: string
 *               organization:
 *                 type: string
 *               location:
 *                 type: string
 *               eligibility:
 *                 type: string
 *               requirements:
 *                 type: string
 *               benefits:
 *                 type: string
 *               sourceUrl:
 *                 type: string
 *                 format: uri
 *               applicationUrl:
 *                 type: string
 *                 format: uri
 *               deadline:
 *                 type: string
 *                 format: date-time
 *               thumbnail:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Opportunity created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: integer
 *                   example: 1
 *                 data:
 *                   $ref: '#/components/schemas/Opportunity'
 *       400:
 *         description: Validation error
 *       409:
 *         description: Slug already exists
 */
router.get("/", getOpportunities);
router.post("/", jwtAuthenticate, requireAdmin, upload.single("thumbnail"), createOpportunity);
/**
 * @swagger
 * /api/opportunities/{id}:
 *   get:
 *     summary: Get a single opportunity by ID
 *     tags:
 *       - Opportunities
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Opportunity found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: integer
 *                   example: 1
 *                 data:
 *                   $ref: '#/components/schemas/Opportunity'
 *       404:
 *         description: Opportunity not found
 *   patch:
 *     summary: Update an opportunity (admin only)
 *     tags:
 *       - Opportunities
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
 *               title:
 *                 type: string
 *               slug:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum:
 *                   - SCHOLARSHIP
 *                   - JOB
 *                   - INTERNSHIP
 *                   - FELLOWSHIP
 *                   - COMPETITION
 *                   - GRANT
 *                   - TRAINING
 *                   - VOLUNTEER
 *               description:
 *                 type: string
 *               organization:
 *                 type: string
 *               location:
 *                 type: string
 *               eligibility:
 *                 type: string
 *               requirements:
 *                 type: string
 *               benefits:
 *                 type: string
 *               sourceUrl:
 *                 type: string
 *                 format: uri
 *               applicationUrl:
 *                 type: string
 *                 format: uri
 *               deadline:
 *                 type: string
 *                 format: date-time
 *               thumbnail:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Opportunity updated
 *       404:
 *         description: Opportunity not found
 *       409:
 *         description: Slug already exists
 *   delete:
 *     summary: Delete an opportunity (admin only)
 *     tags:
 *       - Opportunities
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
 *         description: Opportunity deleted
 *       404:
 *         description: Opportunity not found
 */
router.get("/:id", getOpportunity);
router.patch("/:id", jwtAuthenticate, requireAdmin, upload.single("thumbnail"), updateOpportunity);
router.delete("/:id", jwtAuthenticate, requireAdmin, deleteOpportunity);
/**
 * @swagger
 * /api/opportunities/{id}/publish:
 *   patch:
 *     summary: Publish an opportunity (admin only)
 *     tags:
 *       - Opportunities
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
 *         description: Opportunity published
 *       400:
 *         description: Already published
 *       404:
 *         description: Opportunity not found
 */
router.patch("/:id/publish", jwtAuthenticate, requireAdmin, publishOpportunity);
/**
 * @swagger
 * /api/opportunities/{id}/unpublish:
 *   patch:
 *     summary: Unpublish an opportunity (admin only)
 *     tags:
 *       - Opportunities
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
 *         description: Opportunity unpublished
 *       400:
 *         description: Already unpublished
 *       404:
 *         description: Opportunity not found
 */
router.patch("/:id/unpublish", jwtAuthenticate, requireAdmin, unpublishOpportunity);
export default router;
