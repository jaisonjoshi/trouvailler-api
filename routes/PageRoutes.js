import express from "express";
import PageController from "../controllers/PageController.js";
import { validateBody } from "../middleware/validate.js";
import {
  createPageSchema,
  updatePageSchema,
} from "../validation/PageValidation.js";

const router = express.Router();

/**
 * @openapi
 * /api/pages:
 *   get:
 *     summary: Retrieve all pages
 *     description: Fetch all CMS pages.
 *     tags:
 *       - Pages
 *     responses:
 *       200:
 *         description: A JSON array of pages
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Page'
 */
router.get("/", PageController.getAll);

/**
 * @openapi
 * /api/pages:
 *   post:
 *     summary: Create Page
 *     tags:
 *       - Pages
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Page'
 *     responses:
 *       201:
 *         description: Page created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Page'
 *       400:
 *         description: Validation schema error (Zod)
 */
router.post("/", validateBody(createPageSchema), PageController.create);

/**
 * @openapi
 * /api/pages/slug/{slug}:
 *   get:
 *     summary: Retrieve published page by slug
 *     tags:
 *       - Pages
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *         description: Page slug for SEO-friendly access
 *     responses:
 *       200:
 *         description: Page details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Page'
 *       404:
 *         description: Page not found
 */
router.get("/slug/:slug", PageController.getPublishedBySlug);

/**
 * @openapi
 * /api/pages/slug/{slug}:
 *   put:
 *     summary: Update page by slug
 *     tags:
 *       - Pages
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *         description: Page slug
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Page'
 *     responses:
 *       200:
 *         description: Page updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Page'
 *       400:
 *         description: Validation error
 *       404:
 *         description: Page not found
 */
router.put("/slug/:slug", validateBody(updatePageSchema), PageController.updateBySlug);

/**
 * @openapi
 * /api/pages/{id}:
 *   get:
 *     summary: Retrieve page by ID
 *     tags:
 *       - Pages
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The page ID
 *     responses:
 *       200:
 *         description: Page details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Page'
 *       404:
 *         description: Page not found
 */
router.get("/:id", PageController.getById);

/**
 * @openapi
 * /api/pages/{id}:
 *   put:
 *     summary: Update Page
 *     tags:
 *       - Pages
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The page ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Page'
 *     responses:
 *       200:
 *         description: Page updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Page'
 *       400:
 *         description: Validation error
 *       404:
 *         description: Page not found
 */
router.put("/:id", validateBody(updatePageSchema), PageController.update);

/**
 * @openapi
 * /api/pages/{id}:
 *   delete:
 *     summary: Delete Page
 *     tags:
 *       - Pages
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The page ID
 *     responses:
 *       200:
 *         description: Page deleted successfully
 *       404:
 *         description: Page not found
 */
router.delete("/:id", PageController.delete);

export default router;
