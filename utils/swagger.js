import swaggerJSDoc from "swagger-jsdoc";

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
  apis: ["./routes/*.js"], // Location of route definitions with JSDoc @openapi annotations
};

export const swaggerSpec = swaggerJSDoc(options);
