import express from "express";
import PackageController from "../controllers/PackageController.js";
import { validateBody } from "../utils/validate.js";
import { createPackageSchema, updatePackageSchema, deleteMediaSchema } from "../validation/PackageValidation.js";

const router = express.Router();

/**
 * @openapi
 * /api/packages:
 *   get:
 *     summary: Retrieve all packages
 *     description: Fetch travel packages list with optional filtering, sorting, and search.
 *     tags:
 *       - Packages
 *     parameters:
 *       - $ref: '#/components/parameters/packageSearchQuery'
 *       - $ref: '#/components/parameters/packageStatusFilter'
 *       - $ref: '#/components/parameters/packageCategoriesFilter'
 *       - $ref: '#/components/parameters/packageMainLocationFilter'
 *       - $ref: '#/components/parameters/packageLocationsFilter'
 *       - $ref: '#/components/parameters/packageSortBy'
 *       - $ref: '#/components/parameters/packageSortOrder'
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
 * /api/packages:
 *   post:
 *     summary: Create Package
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
 *             $ref: '#/components/schemas/DeleteMediaRequest'
 *     responses:
 *       200:
 *         description: Media successfully processed/deleted
 *       400:
 *         description: Bad request
 */
router.post("/media/delete", validateBody(deleteMediaSchema), PackageController.deleteMedia);

/**
 * @openapi
 * /api/packages/slug/{slug}:
 *   get:
 *     summary: Retrieve package by slug
 *     tags:
 *       - Packages
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *         description: Package slug for SEO-friendly access
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
router.get("/slug/:slug", PackageController.getBySlug);

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
 * /api/packages/{id}:
 *   put:
 *     summary: Update Package
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

export default router;
