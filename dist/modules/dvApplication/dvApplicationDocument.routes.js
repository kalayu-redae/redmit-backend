import { Router } from "express";
import { jwtAuthenticate } from "../../middleware/jwtAuthenticate.js";
import { upload } from "../../middleware/upload.middleware.js";
import { uploadDVApplicationDocument, getDVApplicationDocuments, deleteDVApplicationDocument, } from "./dvApplicationDocument.controller.js";
const router = Router();
/**
 * @swagger
 * tags:
 *   name: DV Application Documents
 *   description: Upload and manage documents for DV application requests
 */
/**
 * @swagger
 * /api/dv-application-requests/{requestId}/documents:
 *   post:
 *     summary: Upload a document for a DV application request
 *     tags: [DV Application Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: requestId
 *         required: true
 *         schema:
 *           type: string
 *         description: DV application request ID
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *               - documentType
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *               documentType:
 *                 type: string
 *                 enum:
 *                   - APPLICANT_PHOTO
 *                   - SPOUSE_PHOTO
 *                   - CHILD_PHOTO
 *                   - PASSPORT
 *                   - SUPPORTING_DOCUMENT
 *                   - INTERNATIONAL_PAYMENT_CONFIRMATION
 *                   - OTHER
 *               subjectType:
 *                 type: string
 *                 enum: [APPLICANT, SPOUSE, CHILD]
 *               subjectIndex:
 *                 type: integer
 *                 minimum: 0
 *     responses:
 *       201:
 *         description: Document uploaded successfully
 *       400:
 *         description: Invalid document or upload data
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Not authorized to upload documents for this request
 *       404:
 *         description: DV application request not found
 */
router.post("/:requestId/documents", jwtAuthenticate, upload.single("file"), uploadDVApplicationDocument);
/**
 * @swagger
 * /api/dv-application-requests/{requestId}/documents:
 *   get:
 *     summary: Get documents for a DV application request
 *     tags: [DV Application Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: requestId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Documents retrieved successfully
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Not authorized to view these documents
 *       404:
 *         description: DV application request not found
 */
router.get("/:requestId/documents", jwtAuthenticate, getDVApplicationDocuments);
/**
 * @swagger
 * /api/dv-application-requests/documents/{id}:
 *   delete:
 *     summary: Delete a DV application document
 *     tags: [DV Application Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: DV application document ID
 *     responses:
 *       200:
 *         description: Document deleted successfully
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Not authorized to delete this document
 *       404:
 *         description: Document not found
 */
router.delete("/documents/:id", jwtAuthenticate, deleteDVApplicationDocument);
export default router;
