import express from "express";
import LocationController from "../controllers/LocationController.js";
import { validateBody } from "../middleware/validate.js";
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
 *       - $ref: '#/components/parameters/locationSearchQuery'
 *       - $ref: '#/components/parameters/locationLevelFilter'
 *       - $ref: '#/components/parameters/locationParentFilter'
 *       - $ref: '#/components/parameters/locationSortBy'
 *       - $ref: '#/components/parameters/locationSortOrder'
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
 * /api/locations:
 *   post:
 *     summary: Create Location
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
 *         description: Validation schema error (Zod)
 */
router.post("/", validateBody(createLocationSchema), LocationController.create);

/**
 * @openapi
 * /api/locations/slug/{slug}:
 *   get:
 *     summary: Retrieve location by slug
 *     tags:
 *       - Locations
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *         description: Location slug for SEO-friendly access
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
router.get("/slug/:slug", LocationController.getBySlug);

/**
 * @openapi
 * /api/locations/{id}:
 *   get:
 *     summary: Retrieve location by ID
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
 * /api/locations/{id}:
 *   put:
 *     summary: Update Location
 *     tags:
 *       - Locations
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Location ID
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
 *     summary: Delete Location
 *     tags:
 *       - Locations
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Location ID
 *     responses:
 *       200:
 *         description: Deletion confirmation
 *       404:
 *         description: Location not found
 */
router.delete("/:id", LocationController.delete);

export default router;
