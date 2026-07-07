import express from "express";
import TicketController from "../controllers/TicketController.js";

const router = express.Router();

/**
 * @openapi
 * /api/tickets:
 *   get:
 *     summary: Retrieve all tickets
 *     description: Fetch support tickets with optional filtering and sorting.
 *     tags:
 *       - Tickets
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by name or email
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, contacted, resolved, cancelled]
 *         description: Filter by ticket status
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *         description: Field to sort results by (e.g. createdAt, name)
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *         description: Sort direction
 *     responses:
 *       200:
 *         description: A JSON array of tickets
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Ticket'
 */
router.get("/", TicketController.getAll);

/**
 * @openapi
 * /api/tickets:
 *   post:
 *     summary: Create Ticket
 *     tags:
 *       - Tickets
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Ticket'
 *     responses:
 *       201:
 *         description: Ticket created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Ticket'
 *       400:
 *         description: Validation error
 */
router.post("/", TicketController.create);

/**
 * @openapi
 * /api/tickets/{id}:
 *   get:
 *     summary: Retrieve ticket by ID
 *     tags:
 *       - Tickets
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ticket ID
 *     responses:
 *       200:
 *         description: Ticket details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Ticket'
 *       404:
 *         description: Ticket not found
 */
router.get("/:id", TicketController.getById);

/**
 * @openapi
 * /api/tickets/{id}:
 *   put:
 *     summary: Update Ticket
 *     tags:
 *       - Tickets
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ticket ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Ticket'
 *     responses:
 *       200:
 *         description: Ticket updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Ticket'
 *       400:
 *         description: Validation error
 *       404:
 *         description: Ticket not found
 */
router.put("/:id", TicketController.update);

/**
 * @openapi
 * /api/tickets/{id}:
 *   delete:
 *     summary: Delete Ticket
 *     tags:
 *       - Tickets
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ticket ID
 *     responses:
 *       200:
 *         description: Ticket deleted successfully
 *       404:
 *         description: Ticket not found
 */
router.delete("/:id", TicketController.delete);

export default router;
