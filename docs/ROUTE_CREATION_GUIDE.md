# Developer Guide: Adding a New CRUD Route

This step-by-step developer guide provides copy-pasteable boilerplate templates to quickly create a new CRUD resource (e.g. `Destination`, `Review`, `Booking`) in the `trouvailler-api` project.

Replace **`Feature`** (capitalized) and **`feature`** (lowercase) with the name of your resource.

---

## Step 1: Create the Database Model
Create a new file: `models/Feature.js`

```javascript
import mongoose from "mongoose";

const featureSchema = new mongoose.Schema({
  // Define fields here
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  image: {
    type: String,
    required: true
  }
}, {
  timestamps: true // Automatically manages createdAt and updatedAt
});

const Feature = mongoose.model("Feature", featureSchema);

export default Feature;
```

---

## Step 2: Create the Validation Schemas
Create a new file: `validation/FeatureValidation.js`

```javascript
import { z } from "zod";

export const createFeatureSchema = z.object({
  name: z.string().min(1, "Name is required").trim(),
  description: z.string().min(1, "Description is required").trim(),
  image: z.string().url("Image must be a valid URL")
});

export const updateFeatureSchema = createFeatureSchema.partial();
```

---

## Step 3: Create the Repository
Create a new file: `repositories/FeatureRepository.js`

```javascript
import Feature from "../models/Feature.js";

class FeatureRepository {
  async findAll(filters = {}, options = {}) {
    const sortBy = options.sortBy || "createdAt";
    const sortOrder = options.sortOrder === "asc" ? 1 : -1;

    const sortOption = {};
    sortOption[sortBy] = sortOrder;

    return await Feature.find(filters).sort(sortOption);
  }

  async findById(id) {
    return await Feature.findById(id);
  }

  async findByName(name) {
    return await Feature.findOne({ name: { $regex: `^${name}$`, $options: "i" } });
  }

  async create(data) {
    const newFeature = new Feature(data);
    return await newFeature.save();
  }

  async update(id, data) {
    return await Feature.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true, runValidators: true }
    );
  }

  async delete(id) {
    return await Feature.findByIdAndDelete(id);
  }
}

export default new FeatureRepository();
```

---

## Step 4: Create the Service Layer
Create a new file: `services/FeatureService.js`

```javascript
import FeatureRepository from "../repositories/FeatureRepository.js";
import { createFeatureSchema, updateFeatureSchema } from "../validation/FeatureValidation.js";

class FeatureService {
  async getAllFeatures(filters = {}, options = {}) {
    return await FeatureRepository.findAll(filters, options);
  }

  async getFeatureById(id) {
    const feature = await FeatureRepository.findById(id);
    if (!feature) {
      const error = new Error("Feature not found");
      error.statusCode = 404;
      throw error;
    }
    return feature;
  }

  async createFeature(data) {
    // Validate request data
    const validatedData = createFeatureSchema.parse(data);

    // Business check: unique constraint (optional)
    const existing = await FeatureRepository.findByName(validatedData.name);
    if (existing) {
      const error = new Error("Feature name already exists");
      error.statusCode = 400;
      throw error;
    }

    return await FeatureRepository.create(validatedData);
  }

  async updateFeature(id, data) {
    // Validate request data
    const validatedData = updateFeatureSchema.parse(data);

    // Ensure resource exists
    const feature = await this.getCategoryById(id);

    // Check unique constraint conflict (optional)
    if (validatedData.name && validatedData.name.toLowerCase() !== feature.name.toLowerCase()) {
      const existing = await FeatureRepository.findByName(validatedData.name);
      if (existing) {
        const error = new Error("Feature name already exists");
        error.statusCode = 400;
        throw error;
      }
    }

    return await FeatureRepository.update(id, validatedData);
  }

  async deleteFeature(id) {
    // Ensure resource exists
    await this.getFeatureById(id);
    return await FeatureRepository.delete(id);
  }
}

export default new FeatureService();
```

---

## Step 5: Create the Controller
Create a new file: `controllers/FeatureController.js`

```javascript
import FeatureService from "../services/FeatureService.js";

class FeatureController {
  async getAll(req, res, next) {
    try {
      const filters = {};
      const options = {
        sortBy: req.query.sortBy,
        sortOrder: req.query.sortOrder
      };
      const features = await FeatureService.getAllFeatures(filters, options);
      res.status(200).json(features);
    } catch (err) {
      next(err);
    }
  }

  async getById(req, res, next) {
    try {
      const { id } = req.params;
      const feature = await FeatureService.getFeatureById(id);
      res.status(200).json(feature);
    } catch (err) {
      next(err);
    }
  }

  async create(req, res, next) {
    try {
      const newFeature = await FeatureService.createFeature(req.body);
      res.status(201).json(newFeature);
    } catch (err) {
      next(err);
    }
  }

  async update(req, res, next) {
    try {
      const { id } = req.params;
      const updatedFeature = await FeatureService.updateFeature(id, req.body);
      res.status(200).json(updatedFeature);
    } catch (err) {
      next(err);
    }
  }

  async delete(req, res, next) {
    try {
      const { id } = req.params;
      await FeatureService.deleteFeature(id);
      res.status(200).json({
        success: true,
        message: "Feature deleted successfully"
      });
    } catch (err) {
      next(err);
    }
  }
}

export default new FeatureController();
```

---

## Step 6: Create Routes and OpenAPI Specs
Create a new file: `routes/FeatureRoutes.js`

```javascript
import express from "express";
import FeatureController from "../controllers/FeatureController.js";
import { validateBody } from "../middleware/validate.js";
import { createFeatureSchema, updateFeatureSchema } from "../validation/FeatureValidation.js";

const router = express.Router();

/**
 * @openapi
 * /api/features:
 *   get:
 *     summary: Retrieve all features
 *     tags:
 *       - Features
 *     responses:
 *       200:
 *         description: A JSON array of features
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Feature'
 */
router.get("/", FeatureController.getAll);

/**
 * @openapi
 * /api/features/{id}:
 *   get:
 *     summary: Fetch feature details by ID
 *     tags:
 *       - Features
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Database ID
 *     responses:
 *       200:
 *         description: Feature object details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Feature'
 *       404:
 *         description: Feature not found
 */
router.get("/:id", FeatureController.getById);

/**
 * @openapi
 * /api/features:
 *   post:
 *     summary: Create a new feature
 *     tags:
 *       - Features
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Feature'
 *     responses:
 *       201:
 *         description: Feature created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Feature'
 *       400:
 *         description: Validation schema error (Zod)
 */
router.post("/", validateBody(createFeatureSchema), FeatureController.create);

/**
 * @openapi
 * /api/features/{id}:
 *   put:
 *     summary: Update an existing feature
 *     tags:
 *       - Features
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Feature'
 *     responses:
 *       200:
 *         description: Feature updated successfully
 *       400:
 *         description: Validation schema error (Zod)
 *       404:
 *         description: Feature not found
 */
router.put("/:id", validateBody(updateFeatureSchema), FeatureController.update);

/**
 * @openapi
 * /api/features/{id}:
 *   delete:
 *     summary: Delete a feature
 *     tags:
 *       - Features
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Feature deleted successfully
 *       404:
 *         description: Feature not found
 */
router.delete("/:id", FeatureController.delete);

export default router;
```

---

## Step 7: Mount the Router
Open: [app.js](file:///Users/jaisonjoshi/Documents/Personal%20Projects/Trouvailler/trouvailler-api/app.js)

1. Import the router:
   ```javascript
   import featureRoutes from "./routes/FeatureRoutes.js";
   ```
2. Mount the middleware endpoint:
   ```javascript
   app.use("/api/features", featureRoutes);
   ```

---

## Step 8: Map the OpenAPI schemas dynamically
Open: [utils/swagger.js](file:///Users/jaisonjoshi/Documents/Personal%20Projects/Trouvailler/trouvailler-api/utils/swagger.js)

1. Import the validation Zod schema:
   ```javascript
   import { createFeatureSchema } from "../validation/FeatureValidation.js";
   ```
2. Convert and inject it at the bottom:
   ```javascript
   swaggerSpec.components.schemas.Feature = z.toJSONSchema(createFeatureSchema, { target: "openapi-3.0" });
   ```

---

## Step 9: Rebuild the Codebase graphs
Run the following command in `trouvailler-api/` to refresh the index/graph artifacts:
```bash
npm run graph
```
