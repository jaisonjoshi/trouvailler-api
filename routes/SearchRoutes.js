import express from "express";
import SearchController from "../controllers/SearchController.js";

const router = express.Router();

/**
 * @openapi
 * /api/search:
 *   get:
 *     summary: Search locations and categories
 *     description: Perform a global search across locations and categories by keyword.
 *     tags:
 *       - Search
 *     parameters:
 *       - in: query
 *         name: q
 *         required: false
 *         schema:
 *           type: string
 *         description: Search keyword
 *     responses:
 *       200:
 *         description: Search results with matching locations and categories
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 locations:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Location'
 *                 categories:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Category'
 */
router.get("/", SearchController.search);

export default router;
