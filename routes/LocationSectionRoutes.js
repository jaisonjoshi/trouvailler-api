import express from "express";
import LocationSectionController from "../controllers/LocationSectionController.js";
import { validateBody } from "../middleware/validate.js";
import {
  createLocationSectionSchema,
  updateLocationSectionSchema,
} from "../validation/LocationSectionValidation.js";

const router = express.Router();

/**
 * @openapi
 * /api/location-sections:
 *   get:
 *     summary: Retrieve all location sections
 *     description: Fetch curated groups of locations.
 *     tags:
 *       - Location Sections
 *     responses:
 *       200:
 *         description: A JSON array of location sections
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/LocationSection'
 */
router.get("/", LocationSectionController.getAll);

/**
 * @openapi
 * /api/location-sections/{id}:
 *   get:
 *     summary: Retrieve location section by ID
 *     tags:
 *       - Location Sections
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The location section ID
 *     responses:
 *       200:
 *         description: Location section details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LocationSection'
 *       404:
 *         description: Location section not found
 */
router.get("/:id", LocationSectionController.getById);

/**
 * @openapi
 * /api/location-sections:
 *   post:
 *     summary: Create Location Section
 *     tags:
 *       - Location Sections
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LocationSection'
 *     responses:
 *       201:
 *         description: Location section created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LocationSection'
 *       400:
 *         description: Validation schema error (Zod)
 */
router.post("/", validateBody(createLocationSectionSchema), LocationSectionController.create);

/**
 * @openapi
 * /api/location-sections/{id}:
 *   put:
 *     summary: Update Location Section
 *     tags:
 *       - Location Sections
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The location section ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LocationSection'
 *     responses:
 *       200:
 *         description: Location section updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LocationSection'
 *       400:
 *         description: Validation schema error (Zod)
 *       404:
 *         description: Location section not found
 */
router.put("/:id", validateBody(updateLocationSectionSchema), LocationSectionController.update);

/**
 * @openapi
 * /api/location-sections/{id}:
 *   delete:
 *     summary: Delete Location Section
 *     tags:
 *       - Location Sections
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The location section ID
 *     responses:
 *       200:
 *         description: Location section deleted successfully
 *       404:
 *         description: Location section not found
 */
router.delete("/:id", LocationSectionController.delete);

export default router;
