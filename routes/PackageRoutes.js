import express from "express";
import PackageController from "../controllers/PackageController.js";
import { validateBody } from "../utils/validate.js";
import { createPackageSchema, updatePackageSchema } from "../validation/PackageValidation.js";

const router = express.Router();

/**
 * @openapi
 * /api/packages:
 *   get:
 *     summary: Retrieve all packages
 *     description: Fetch travel packages list. Supports optional filters for search query, destinationId, and category.
 *     tags:
 *       - Packages
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search keyword matching title
 *       - in: query
 *         name: destinationId
 *         schema:
 *           type: string
 *         description: Destination filter code (e.g. amalfi, bali)
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Tour tags category (e.g. Honeymoon)
 *     responses:
 *       200:
 *         description: A JSON array of packages
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Package'
 */
router.get("/", PackageController.getAll);

/**
 * @openapi
 * /api/packages/{id}:
 *   get:
 *     summary: Fetch package details by ID
 *     tags:
 *       - Packages
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The database Package ID
 *     responses:
 *       200:
 *         description: Package details object
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Package'
 *       404:
 *         description: Package not found
 */
router.get("/:id", PackageController.getById);

/**
 * @openapi
 * /api/packages:
 *   post:
 *     summary: Publish a new travel package
 *     tags:
 *       - Packages
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Package'
 *     responses:
 *       201:
 *         description: Package created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Package'
 *       400:
 *         description: Validation schema error (Zod)
 */
router.post("/", validateBody(createPackageSchema), PackageController.create);

/**
 * @openapi
 * /api/packages/{id}:
 *   put:
 *     summary: Modify an existing package
 *     tags:
 *       - Packages
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Package ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Package'
 *     responses:
 *       200:
 *         description: Package updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Package'
 *       400:
 *         description: Validation error
 *       404:
 *         description: Package not found
 */
router.put("/:id", validateBody(updatePackageSchema), PackageController.update);

/**
 * @openapi
 * /api/packages/{id}:
 *   delete:
 *     summary: Remove a package
 *     tags:
 *       - Packages
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Package ID
 *     responses:
 *       200:
 *         description: Deletion confirmation
 *       404:
 *         description: Package not found
 */
router.delete("/:id", PackageController.delete);

/**
 * @openapi
 * /api/packages/media/delete:
 *   post:
 *     summary: Delete uploaded media from Cloudinary
 *     tags:
 *       - Packages
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - urls
 *             properties:
 *               urls:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Media successfully processed/deleted
 *       400:
 *         description: Bad request
 */
router.post("/media/delete", PackageController.deleteMedia);

export default router;
