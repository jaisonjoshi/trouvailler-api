import express from "express";
import CategoryController from "../controllers/CategoryController.js";
import { validateBody } from "../utils/validate.js";
import { createCategorySchema, updateCategorySchema } from "../validation/CategoryValidation.js";

const router = express.Router();

/**
 * @openapi
 * /api/categories:
 *   get:
 *     summary: Retrieve all categories
 *     description: Fetch category list with optional filtering and sorting.
 *     tags:
 *       - Categories
 *     parameters:
 *       - $ref: '#/components/parameters/categoryAppliesToFilter'
 *       - $ref: '#/components/parameters/categorySortBy'
 *       - $ref: '#/components/parameters/categorySortOrder'
 *     responses:
 *       200:
 *         description: A JSON array of categories
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Category'
 */
router.get("/", CategoryController.getAll);

/**
 * @openapi
 * /api/categories:
 *   post:
 *     summary: Create Category
 *     tags:
 *       - Categories
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Category'
 *     responses:
 *       201:
 *         description: Category created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Category'
 *       400:
 *         description: Validation schema error (Zod)
 */
router.post("/", validateBody(createCategorySchema), CategoryController.create);

/**
 * @openapi
 * /api/categories/slug/{slug}:
 *   get:
 *     summary: Retrieve category by slug
 *     tags:
 *       - Categories
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *         description: Category slug for SEO-friendly access
 *     responses:
 *       200:
 *         description: Category details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Category'
 *       404:
 *         description: Category not found
 */
router.get("/slug/:slug", CategoryController.getBySlug);

/**
 * @openapi
 * /api/categories/{id}:
 *   get:
 *     summary: Retrieve category by ID
 *     tags:
 *       - Categories
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The database Category ID
 *     responses:
 *       200:
 *         description: Category details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Category'
 *       404:
 *         description: Category not found
 */
router.get("/:id", CategoryController.getById);

/**
 * @openapi
 * /api/categories/{id}:
 *   put:
 *     summary: Update Category
 *     tags:
 *       - Categories
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The database Category ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Category'
 *     responses:
 *       200:
 *         description: Category updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Category'
 *       400:
 *         description: Validation schema error (Zod)
 *       404:
 *         description: Category not found
 */
router.put("/:id", validateBody(updateCategorySchema), CategoryController.update);

/**
 * @openapi
 * /api/categories/{id}:
 *   delete:
 *     summary: Delete Category
 *     tags:
 *       - Categories
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The database Category ID
 *     responses:
 *       200:
 *         description: Category deleted successfully
 *       404:
 *         description: Category not found
 */
router.delete("/:id", CategoryController.delete);

export default router;
