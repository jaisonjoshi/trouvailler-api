import express from "express";
import CategorySectionController from "../controllers/CategorySectionController.js";
import { validateBody } from "../middleware/validate.js";
import {
  createCategorySectionSchema,
  updateCategorySectionSchema,
} from "../validation/CategorySectionValidation.js";

const router = express.Router();

/**
 * @openapi
 * /api/category-sections:
 *   get:
 *     summary: Retrieve all category sections
 *     description: Fetch curated groups of categories.
 *     tags:
 *       - Category Sections
 *     responses:
 *       200:
 *         description: A JSON array of category sections
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/CategorySection'
 */
router.get("/", CategorySectionController.getAll);

/**
 * @openapi
 * /api/category-sections/{id}:
 *   get:
 *     summary: Retrieve category section by ID
 *     tags:
 *       - Category Sections
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The category section ID
 *     responses:
 *       200:
 *         description: Category section details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CategorySection'
 *       404:
 *         description: Category section not found
 */
router.get("/:id", CategorySectionController.getById);

/**
 * @openapi
 * /api/category-sections:
 *   post:
 *     summary: Create Category Section
 *     tags:
 *       - Category Sections
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CategorySection'
 *     responses:
 *       201:
 *         description: Category section created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CategorySection'
 *       400:
 *         description: Validation schema error (Zod)
 */
router.post("/", validateBody(createCategorySectionSchema), CategorySectionController.create);

/**
 * @openapi
 * /api/category-sections/{id}:
 *   put:
 *     summary: Update Category Section
 *     tags:
 *       - Category Sections
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The category section ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CategorySection'
 *     responses:
 *       200:
 *         description: Category section updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CategorySection'
 *       400:
 *         description: Validation schema error (Zod)
 *       404:
 *         description: Category section not found
 */
router.put("/:id", validateBody(updateCategorySectionSchema), CategorySectionController.update);

/**
 * @openapi
 * /api/category-sections/{id}:
 *   delete:
 *     summary: Delete Category Section
 *     tags:
 *       - Category Sections
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The category section ID
 *     responses:
 *       200:
 *         description: Category section deleted successfully
 *       404:
 *         description: Category section not found
 */
router.delete("/:id", CategorySectionController.delete);

export default router;
