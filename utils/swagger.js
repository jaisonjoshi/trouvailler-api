import swaggerJSDoc from "swagger-jsdoc";
import { z } from "zod";
import {
  createPackageSchema,
  scheduleItemSchema,
  activityDetailSchema,
  deleteMediaSchema
} from "../validation/PackageValidation.js";
import { createCategorySchema } from "../validation/CategoryValidation.js";
import { createLocationSchema } from "../validation/LocationValidation.js";
import { PACKAGE_STATUS_VALUES } from "./constants.js";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Trouvailler API Documentation",
      version: "1.0.0",
      description: "A premium API specification for the Trouvailler backend, built with layered architecture.",
    },
    servers: [
      {
        url: "http://localhost:5005",
        description: "Local Development Server",
      },
    ],
  },
  apis: ["./routes/*.js"], // Location of route definitions and inline Swagger docs
};

export const swaggerSpec = swaggerJSDoc(options);

// Dynamically generate schemas from Zod and inject them under components.schemas
if (!swaggerSpec.components) {
  swaggerSpec.components = {};
}
if (!swaggerSpec.components.schemas) {
  swaggerSpec.components.schemas = {};
}

swaggerSpec.components.schemas.Package = z.toJSONSchema(createPackageSchema, { target: "openapi-3.0" });
swaggerSpec.components.schemas.ScheduleItem = z.toJSONSchema(scheduleItemSchema, { target: "openapi-3.0" });
swaggerSpec.components.schemas.ActivityDetail = z.toJSONSchema(activityDetailSchema, { target: "openapi-3.0" });
swaggerSpec.components.schemas.Category = z.toJSONSchema(createCategorySchema, { target: "openapi-3.0" });
swaggerSpec.components.schemas.Location = z.toJSONSchema(createLocationSchema, { target: "openapi-3.0" });
swaggerSpec.components.schemas.DeleteMediaRequest = z.toJSONSchema(deleteMediaSchema, { target: "openapi-3.0" });

// Reusable query parameter definitions
swaggerSpec.components.parameters = {
  packageSearchQuery: {
    in: "query",
    name: "search",
    schema: { type: "string" },
    description: "Search keyword matching package title"
  },
  packageStatusFilter: {
    in: "query",
    name: "status",
    schema: { type: "string", enum: PACKAGE_STATUS_VALUES },
    description: "Filter by package status"
  },
  packageCategoriesFilter: {
    in: "query",
    name: "categories",
    schema: { type: "string" },
    description: "Filter by category ID(s). Separate multiple IDs with commas."
  },
  packageMainLocationFilter: {
    in: "query",
    name: "mainLocation",
    schema: { type: "string" },
    description: "Filter by primary location ID"
  },
  packageLocationsFilter: {
    in: "query",
    name: "locations",
    schema: { type: "string" },
    description: "Filter by location ID(s). Separate multiple IDs with commas."
  },
  packageSortBy: {
    in: "query",
    name: "sortBy",
    schema: { type: "string" },
    description: "Field to sort results by (e.g. createdAt, title)"
  },
  packageSortOrder: {
    in: "query",
    name: "sortOrder",
    schema: { type: "string", enum: ["asc", "desc"] },
    description: "Sort direction"
  }
};
