import { Router } from "express";
import { jwtAuthenticate } from "../../middleware/jwtAuthenticate.js";
import { createDVApplicationRequest, getMyDVApplicationRequests, getAllDVApplicationRequests, getDVApplicationRequest, updateDVApplicationRequestStatus, cancelDVApplicationRequest, } from "./dvApplicationRequest.controller.js";
const router = Router();
/**
 * @swagger
 * tags:
 *   name: DV Application Requests
 *   description: Manage Diversity Visa application service requests
 */
/**
 * @swagger
 * /api/dv-application-requests:
 *   post:
 *     summary: Create a DV application service request
 *     tags:
 *       - DV Application Requests
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - dvProgramId
 *               - requestType
 *             properties:
 *               dvProgramId:
 *                 type: string
 *                 format: uuid
 *               requestType:
 *                 type: string
 *                 enum:
 *                   - PAYMENT_ASSISTANCE
 *                   - FORM_FILLING
 *               needsInternationalPayment:
 *                 type: boolean
 *                 default: true
 *               applicantDetails:
 *                 type: object
 *                 description: Applicant information stored as JSON
 *     responses:
 *       201:
 *         description: DV application request created successfully
 *       400:
 *         description: Invalid request data or program not accepting requests
 *       401:
 *         description: Authentication required
 *       404:
 *         description: DV program not found
 */
router.post("/", jwtAuthenticate, createDVApplicationRequest);
/**
 * @swagger
 * /api/dv-application-requests/my-requests:
 *   get:
 *     summary: Get the authenticated user's DV requests
 *     tags:
 *       - DV Application Requests
 *     security:
 *       - bearerAuth: []
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
 *     responses:
 *       200:
 *         description: Paginated list of the user's DV requests
 *       401:
 *         description: Authentication required
 */
router.get("/my-requests", jwtAuthenticate, getMyDVApplicationRequests);
/**
 * @swagger
 * /api/dv-application-requests:
 *   get:
 *     summary: Get all DV application requests (admin only)
 *     tags:
 *       - DV Application Requests
 *     security:
 *       - bearerAuth: []
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
 *         name: status
 *         schema:
 *           type: string
 *           enum:
 *             - PENDING_PAYMENT
 *             - PAYMENT_REVIEW
 *             - APPROVED
 *             - IN_PROGRESS
 *             - COMPLETED
 *             - REJECTED
 *             - CANCELLED
 *       - in: query
 *         name: requestType
 *         schema:
 *           type: string
 *           enum:
 *             - PAYMENT_ASSISTANCE
 *             - FORM_FILLING
 *       - in: query
 *         name: dvProgramId
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Paginated list of DV requests
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Admin access required
 */
router.get("/", jwtAuthenticate, getAllDVApplicationRequests);
/**
 * @swagger
 * /api/dv-application-requests/{id}:
 *   get:
 *     summary: Get a DV application request by ID
 *     tags:
 *       - DV Application Requests
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
 *         description: DV application request retrieved successfully
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Not authorized to access this request
 *       404:
 *         description: DV application request not found
 */
router.get("/:id", jwtAuthenticate, getDVApplicationRequest);
/**
 * @swagger
 * /api/dv-application-requests/{id}/status:
 *   patch:
 *     summary: Update a DV request's status (admin only)
 *     tags:
 *       - DV Application Requests
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
 *                 type: string
 *                 enum:
 *                   - PENDING_PAYMENT
 *                   - PAYMENT_REVIEW
 *                   - APPROVED
 *                   - IN_PROGRESS
 *                   - COMPLETED
 *                   - REJECTED
 *                   - CANCELLED
 *               adminNotes:
 *                 type: string
 *     responses:
 *       200:
 *         description: DV application request status updated successfully
 *       400:
 *         description: Invalid status or request already finalized
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Admin access required
 *       404:
 *         description: DV application request not found
 */
router.patch("/:id/status", jwtAuthenticate, updateDVApplicationRequestStatus);
/**
 * @swagger
 * /api/dv-application-requests/{id}/cancel:
 *   patch:
 *     summary: Cancel a pending DV application request
 *     tags:
 *       - DV Application Requests
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
 *         description: DV application request cancelled successfully
 *       400:
 *         description: Request cannot be cancelled in its current state
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Not authorized to cancel this request
 *       404:
 *         description: DV application request not found
 */
router.patch("/:id/cancel", jwtAuthenticate, cancelDVApplicationRequest);
export default router;
