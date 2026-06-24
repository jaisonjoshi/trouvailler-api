import express from "express";
import CategoryController from "../controllers/CategoryController.js";
import { validateBody } from "../utils/validate.js";
import { createCategorySchema, updateCategorySchema } from "../validation/CategoryValidation.js";

const router = express.Router();

/**
 * @openapi
 * /api/categories:
 *   get:
 *     summary: Retrieve all travel categories
 *     description: Fetch categories list.
 *     tags:
 *       - Categories
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
 * /api/categories/{id}:
 *   get:
 *     summary: Fetch category details by ID
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
 *         description: Category details object
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
 * /api/categories:
 *   post:
 *     summary: Create a new travel category
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
 *         description: Validation schema error (Zod) or Category name exists
 */
router.post("/", validateBody(createCategorySchema), CategoryController.create);

/**
 * @openapi
 * /api/categories/{id}:
 *   put:
 *     summary: Update an existing travel category
 *     tags:
 *       - Categories
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Category ID
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
 *         description: Validation schema error (Zod) or Category name conflict
 *       404:
 *         description: Category not found
 */
router.put("/:id", validateBody(updateCategorySchema), CategoryController.update);

/**
 * @openapi
 * /api/categories/{id}:
 *   delete:
 *     summary: Delete a travel category
 *     tags:
 *       - Categories
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Category ID
 *     responses:
 *       200:
 *         description: Category deleted successfully
 *       404:
 *         description: Category not found
 */
router.delete("/:id", CategoryController.delete);

export default router;
