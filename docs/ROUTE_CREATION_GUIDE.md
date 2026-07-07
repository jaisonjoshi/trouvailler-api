# Developer Guide: Adding a New CRUD Route

This step-by-step developer guide provides copy-pasteable boilerplate templates to quickly create a new CRUD resource (e.g. `Destination`, `Review`, `Booking`) in the `trouvailler-api` project.

Replace **`Feature`** (capitalized) and **`feature`** (lowercase) with the name of your resource.

---

## Step 1: Create the Database Model

Create a new file: `models/Feature.js`

```javascript
import mongoose from "mongoose";

const featureSchema = new mongoose.Schema(
  {
    // Define fields here
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    image: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true, // Automatically manages createdAt and updatedAt
  },
);

const Feature = mongoose.model("Feature", featureSchema);

export default Feature;
```

---

## Step 2: Create the Validation Schemas

Create a new file: `validation/FeatureValidation.js`

Request validation happens in two layers:

- **Route middleware** (`validateBody`) — Always present. Catches malformed input early and returns `400` before the request reaches the controller.
- **Service-level parsing** (`.parse()`) — Optional. Used only when the service is expected to be called outside the HTTP layer (jobs, scripts, CLI tools, scheduled tasks). If the service is only called from controllers, route-level validation is sufficient.

```javascript
import { z } from "zod";

export const createFeatureSchema = z.object({
  name: z.string().min(1, "Name is required").trim(),
  description: z.string().min(1, "Description is required").trim(),
  image: z.string().url("Image must be a valid URL"),
});

export const updateFeatureSchema = createFeatureSchema.partial();
```

**Validation conventions:**

- Trim all user-entered string fields with `.trim()`.
- For fields that reference MongoDB ObjectIds (e.g. a `categoryId` or `parentId`), use the project's shared ObjectId validation pattern:
  ```javascript
  z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ObjectId")
  ```

---

## Step 3: Create the Repository

Create a new file: `repositories/FeatureRepository.js`

Repositories contain **persistence logic only**. They isolate Mongoose queries and must not contain business rules or request validation.

```javascript
import Feature from "../models/Feature.js";

const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

class FeatureRepository {
  findAll(filters = {}, options = {}) {
    const sortBy = options.sortBy || "createdAt";
    const sortOrder = options.sortOrder === "asc" ? 1 : -1;

    const sortOption = {};
    sortOption[sortBy] = sortOrder;

    return Feature.find(filters).sort(sortOption);
  }

  findById(id) {
    return Feature.findById(id);
  }

  findByName(name) {
    const safe = escapeRegex(name);
    return Feature.findOne({ name: { $regex: `^${safe}$`, $options: "i" } });
  }

  create(data) {
    const newFeature = new Feature(data);
    return newFeature.save();
  }

  update(id, data) {
    return Feature.findOneAndUpdate(
      { _id: id, isDeleted: { $ne: true } },
      { $set: data },
      { new: true, runValidators: true },
    );
  }

  delete(id) {
    return Feature.findOneAndUpdate(
      { _id: id, isDeleted: { $ne: true } },
      { $set: { isDeleted: true } },
      { new: true },
    );
  }
}

export default new FeatureRepository();
```

**Repository conventions:**

- Persistence layer only — no business rules, no request validation.
- User input used in `$regex` queries must be escaped to prevent regex injection.
- Methods that return Mongoose queries directly (`.find()`, `.findOne()`) do not need `async/await`.
- Update operations use `findOneAndUpdate` with `{ new: true, runValidators: true }`.
- If the resource supports soft deletes (`isDeleted`), consistently filter deleted records in every query and use `findOneAndUpdate` for delete instead of `findByIdAndDelete`.
- If the resource does not require soft deletes (e.g. transient data like tickets), `findByIdAndDelete` may be used instead.

---

## Step 4: Create the Service Layer

Create a new file: `services/FeatureService.js`

Services contain **business rules, orchestration, uniqueness checks, cross-entity validation, and algorithm logic**. They coordinate repositories and remain the single place where domain decisions are made.

```javascript
import FeatureRepository from "../repositories/FeatureRepository.js";

class FeatureService {
  getAllFeatures(filters = {}, options = {}) {
    return FeatureRepository.findAll(filters, options);
  }

  async getFeatureById(id) {
    const feature = await FeatureRepository.findById(id);
    if (!feature) {
      this.throwError("Feature not found", 404);
    }
    return feature;
  }

  async createFeature(data) {
    // Optional: parse if called outside HTTP layer
    // const validatedData = createFeatureSchema.parse(data);
    await this._ensureUniqueName(data.name);
    return FeatureRepository.create(data);
  }

  async updateFeature(id, data) {
    await this.getFeatureById(id);
    if (data.name) {
      await this._ensureUniqueName(data.name, id);
    }
    return FeatureRepository.update(id, data);
  }

  async deleteFeature(id) {
    await this.getFeatureById(id);
    return FeatureRepository.delete(id);
  }

  async _ensureUniqueName(name, excludeId = null) {
    const existing = await FeatureRepository.findByName(name);
    if (existing && (!excludeId || existing._id.toString() !== excludeId)) {
      this.throwError("Feature name already exists");
    }
  }

  throwError(message, statusCode = 400) {
    const error = new Error(message);
    error.statusCode = statusCode;
    throw error;
  }
}

export default new FeatureService();
```

**Service conventions:**

- **Public orchestration methods** (`create`, `update`, `getAll`, `getById`, `delete`) accept plain data, delegate to repositories, and stay small.
- **Private helpers** (prefixed with `_`) encapsulate reusable business logic — uniqueness checks, existence validation, derived field constraints.
- Repositories are called **only from services**. Controllers never interact with repositories directly.
- Controllers remain **thin** — extract request data, call one service method, return the response.
- Services throw consistent domain errors via a `throwError` helper that sets `statusCode` on the error object.
- Most services export a singleton (`export default new ServiceName()`) since they are stateless.

---

## Step 5: Create the Controller

Create a new file: `controllers/FeatureController.js`

Controllers remain **thin** — they extract request data, construct `filters` and `options` objects, call one service method, and return the response. Business logic belongs in the service layer.

```javascript
import FeatureService from "../services/FeatureService.js";

class FeatureController {
  async getAll(req, res, next) {
    try {
      const filters = {};
      const options = {
        sortBy: req.query.sortBy,
        sortOrder: req.query.sortOrder,
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
        message: "Feature deleted successfully",
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

## Step 8: Initialize Required System Data (Optional)

If your feature introduces mandatory system records that must exist before the API handles traffic (e.g. a default page, a default configuration), register their initialization in [services/BootstrapService.js](file:///Users/jaisonjoshi/Documents/Personal%20Projects/Trouvailler/trouvailler-api/services/BootstrapService.js) instead of creating them lazily during request handling.

BootstrapService runs in `index.js` after a successful MongoDB connection and before the server starts listening:

```javascript
async run() {
  await this.ensureHomePageExists();
  // Add your initialization call here
}
```

---

## Step 9: Map the OpenAPI schemas dynamically

Open: [utils/swagger.js](file:///Users/jaisonjoshi/Documents/Personal%20Projects/Trouvailler/trouvailler-api/utils/swagger.js)

1. Import the validation Zod schema:
   ```javascript
   import { createFeatureSchema } from "../validation/FeatureValidation.js";
   ```
2. Convert and inject it at the bottom:
   ```javascript
   swaggerSpec.components.schemas.Feature = z.toJSONSchema(createFeatureSchema, {
     target: "openapi-3.0",
   });
   ```

---

## Step 10: Rebuild the Codebase graphs

Run the following command in `trouvailler-api/` to refresh the index/graph artifacts:

```bash
npm run graph
```
