import express from "express";
import PackageController from "../controllers/PackageController.js";

const router = express.Router();

/**
 * @openapi
 * components:
 *   schemas:
 *     ScheduleItem:
 *       type: object
 *       required:
 *         - dayTitle
 *         - dayDesc
 *       properties:
 *         dayTitle:
 *           type: string
 *           example: "Day 1: Arrival & Leisure"
 *         dayDesc:
 *           type: string
 *           example: "Transfer from Srinagar Airport to houseboat."
 *     ActivityDetail:
 *       type: object
 *       required:
 *         - name
 *         - day
 *       properties:
 *         name:
 *           type: string
 *           example: "Shikara Ride"
 *         image:
 *           type: string
 *           example: "https://images.unsplash.com/photo-1593693397690-362cb9666fc2?auto=format&fit=crop&w=800&q=80"
 *         description:
 *           type: string
 *           example: "Relaxing Shikara tour around Dal Lake."
 *         price:
 *           type: string
 *           example: "Free"
 *         isIncluded:
 *           type: boolean
 *           default: true
 *         day:
 *           type: integer
 *           example: 1
 *     Package:
 *       type: object
 *       required:
 *         - destinationId
 *         - title
 *         - location
 *         - image
 *         - price
 *         - duration
 *         - accommodation
 *         - excursions
 *         - meals
 *       properties:
 *         _id:
 *           type: string
 *           example: "655b4fb9b48c66e94bc66ea2"
 *         destinationId:
 *           type: string
 *           example: "amalfi"
 *         title:
 *           type: string
 *           example: "Amalfi Coast Explorer"
 *         location:
 *           type: string
 *           example: "Italy, Europe"
 *         image:
 *           type: string
 *           example: "https://images.unsplash.com/photo-1516483638261-f4dbaf036963?auto=format&fit=crop&w=800&q=80"
 *         images:
 *           type: array
 *           items:
 *             type: string
 *           example: ["https://images.unsplash.com/photo-1516483638261-f4dbaf036963?auto=format&fit=crop&w=800&q=80"]
 *         description:
 *           type: string
 *           example: "Glide along the stunning clifftops of Amalfi."
 *         price:
 *           type: number
 *           example: 1299
 *         originalPrice:
 *           type: number
 *           example: 1599
 *         duration:
 *           type: string
 *           example: "5 Days / 4 Nights"
 *         shortDuration:
 *           type: string
 *           example: "5D / 4N"
 *         accommodation:
 *           type: string
 *           example: "4★ Sea-View Hotel"
 *         excursions:
 *           type: string
 *           example: "Boat Cruise & Ravello Tour"
 *         meals:
 *           type: string
 *           example: "Breakfast & Dinner"
 *         schedule:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/ScheduleItem'
 *         activities:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/ActivityDetail'
 *         inclusions:
 *           type: array
 *           items:
 *             type: string
 *           example: ["Hotel Stay", "Daily Breakfast"]
 *         exclusions:
 *           type: array
 *           items:
 *             type: string
 *           example: ["Flights", "Personal Shopping"]
 *         seo:
 *           type: object
 *           properties:
 *             title:
 *               type: string
 *               example: "Amalfi Tour"
 *             description:
 *               type: string
 *               example: "Book Amalfi tour program"
 *             keywords:
 *               type: string
 *               example: "amalfi, italy"
 */

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
 *         description: Search keyword matching title or location
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
router.post("/", PackageController.create);

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
router.put("/:id", PackageController.update);

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
