import swaggerJSDoc from "swagger-jsdoc";
import { z } from "zod";
import {
  createPackageSchema,
  scheduleItemSchema,
  activityDetailSchema
} from "../validation/PackageValidation.js";
import { createCategorySchema } from "../validation/CategoryValidation.js";

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
