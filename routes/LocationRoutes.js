import express from "express";
import LocationController from "../controllers/LocationController.js";
import { validateBody } from "../utils/validate.js";
import { createLocationSchema, updateLocationSchema } from "../validation/LocationValidation.js";

const router = express.Router();

/**
 * @openapi
 * /api/locations:
 *   get:
 *     summary: Retrieve all locations
 *     tags:
 *       - Locations
 *     parameters:
 *       - in: query
 *         name: level
 *         schema:
 *           type: string
 *         description: Filter by location level (country, state, destination)
 *       - in: query
 *         name: parentLocation
 *         schema:
 *           type: string
 *         description: Filter by parent location ID
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by location name or short description
 *     responses:
 *       200:
 *         description: A JSON array of locations
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Location'
 */
router.get("/", LocationController.getAll);

/**
 * @openapi
 * /api/locations/{id}:
 *   get:
 *     summary: Fetch location details by ID
 *     tags:
 *       - Locations
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Database ID
 *     responses:
 *       200:
 *         description: Location object details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Location'
 *       404:
 *         description: Location not found
 */
router.get("/:id", LocationController.getById);

/**
 * @openapi
 * /api/locations:
 *   post:
 *     summary: Create a new location
 *     tags:
 *       - Locations
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Location'
 *     responses:
 *       201:
 *         description: Location created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Location'
 *       400:
 *         description: Validation schema error (Zod) or name collision
 */
router.post("/", validateBody(createLocationSchema), LocationController.create);

/**
 * @openapi
 * /api/locations/{id}:
 *   put:
 *     summary: Update an existing location
 *     tags:
 *       - Locations
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Location'
 *     responses:
 *       200:
 *         description: Location updated successfully
 *       400:
 *         description: Validation schema error (Zod)
 *       404:
 *         description: Location not found
 */
router.put("/:id", validateBody(updateLocationSchema), LocationController.update);

/**
 * @openapi
 * /api/locations/{id}:
 *   delete:
 *     summary: Delete a location
 *     tags:
 *       - Locations
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Location deleted successfully
 *       404:
 *         description: Location not found
 */
router.delete("/:id", LocationController.delete);

export default router;
