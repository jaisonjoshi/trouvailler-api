import express from "express";
import PackageSectionController from "../controllers/PackageSectionController.js";
import { validateBody } from "../middleware/validate.js";
import {
  createPackageSectionSchema,
  updatePackageSectionSchema,
} from "../validation/PackageSectionValidation.js";

const router = express.Router();

/**
 * @openapi
 * /api/package-sections:
 *   get:
 *     summary: Retrieve all package sections
 *     description: Fetch curated groups of packages.
 *     tags:
 *       - Package Sections
 *     responses:
 *       200:
 *         description: A JSON array of package sections
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/PackageSection'
 */
router.get("/", PackageSectionController.getAll);

/**
 * @openapi
 * /api/package-sections:
 *   post:
 *     summary: Create Package Section
 *     tags:
 *       - Package Sections
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PackageSection'
 *     responses:
 *       201:
 *         description: Package section created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PackageSection'
 *       400:
 *         description: Validation schema error (Zod)
 */
router.post("/", validateBody(createPackageSectionSchema), PackageSectionController.create);

/**
 * @openapi
 * /api/package-sections/{id}:
 *   get:
 *     summary: Retrieve package section by ID
 *     tags:
 *       - Package Sections
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The package section ID
 *     responses:
 *       200:
 *         description: Package section details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PackageSection'
 *       404:
 *         description: Package section not found
 */
router.get("/:id", PackageSectionController.getById);

/**
 * @openapi
 * /api/package-sections/{id}:
 *   put:
 *     summary: Update Package Section
 *     tags:
 *       - Package Sections
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The package section ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PackageSection'
 *     responses:
 *       200:
 *         description: Package section updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PackageSection'
 *       400:
 *         description: Validation schema error (Zod)
 *       404:
 *         description: Package section not found
 */
router.put("/:id", validateBody(updatePackageSectionSchema), PackageSectionController.update);

/**
 * @openapi
 * /api/package-sections/{id}:
 *   delete:
 *     summary: Delete Package Section
 *     tags:
 *       - Package Sections
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The package section ID
 *     responses:
 *       200:
 *         description: Package section deleted successfully
 *       404:
 *         description: Package section not found
 */
router.delete("/:id", PackageSectionController.delete);

export default router;
