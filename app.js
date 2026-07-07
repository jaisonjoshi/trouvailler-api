import express from "express";
import cors from "cors";
import { apiReference } from "@scalar/express-api-reference";
import fs from "fs";

const packageJson = JSON.parse(
  fs.readFileSync(new URL("./package.json", import.meta.url), "utf-8")
);

import { swaggerSpec } from "./utils/swagger.js";
import errorHandler from "./middleware/errorHandler.js";
import notFoundHandler from "./middleware/notFoundHandler.js";
import packageRoutes from "./routes/PackageRoutes.js";
import categoryRoutes from "./routes/CategoryRoutes.js";
import locationRoutes from "./routes/LocationRoutes.js";
import packageSectionRoutes from "./routes/PackageSectionRoutes.js";
import pageRoutes from "./routes/PageRoutes.js";
import locationSectionRoutes from "./routes/LocationSectionRoutes.js";
import categorySectionRoutes from "./routes/CategorySectionRoutes.js";
import searchRoutes from "./routes/SearchRoutes.js";
import ticketRoutes from "./routes/TicketRoutes.js";

const app = express();

app.disable("x-powered-by");
app.use(cors());
app.use(
  express.json({
    limit: "2mb",
  }),
);

app.get("/openapi.json", (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.send(swaggerSpec);
});

app.use(
  "/docs",
  apiReference({
    spec: {
      content: swaggerSpec,
    },
    theme: "purple",
  }),
);

app.use("/api/packages", packageRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/locations", locationRoutes);
app.use("/api/package-sections", packageSectionRoutes);
app.use("/api/pages", pageRoutes);
app.use("/api/location-sections", locationSectionRoutes);
app.use("/api/category-sections", categorySectionRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/tickets", ticketRoutes);

app.get("/", (req, res) => {
  res.json({
    name: "Trouvailler API",
    status: "ok",
    docs: "/docs",
    openapi: "/openapi.json",
  });
});

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    service: "Trouvailler API",
    version: packageJson.version,
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
