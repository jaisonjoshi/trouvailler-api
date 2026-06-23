import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import mongoose from "mongoose";
import request from "supertest";
import app from "../../app.js";
import { buildPackage } from "../helpers/factories.js";
import { startInMemoryMongo, stopInMemoryMongo, clearDatabase } from "../helpers/mongoMemoryServer.js";
import Package from "../../models/Package.js";

describe("Package API (Integration)", () => {
  let server;

  beforeAll(async () => {
    await startInMemoryMongo();
    server = app.listen(0);
  });

  afterAll(async () => {
    server.close();
    await stopInMemoryMongo();
  });

  beforeEach(async () => {
    await clearDatabase();
  });

  describe("GET /api/packages", () => {
    it("returns empty array when no packages exist", async () => {
      const res = await request(app).get("/api/packages");
      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });

    it("returns all packages", async () => {
      await Package.create(buildPackage({ title: "Package A" }));
      await Package.create(buildPackage({ title: "Package B", destinationId: "bali" }));

      const res = await request(app).get("/api/packages");
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(2);
      expect(res.body.map((p) => p.title)).toContain("Package A");
      expect(res.body.map((p) => p.title)).toContain("Package B");
    });

    it("filters by destinationId", async () => {
      await Package.create(buildPackage({ title: "Amalfi Tour", destinationId: "amalfi" }));
      await Package.create(buildPackage({ title: "Bali Retreat", destinationId: "bali" }));

      const res = await request(app).get("/api/packages?destinationId=amalfi");
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].title).toBe("Amalfi Tour");
    });

    it("filters by category", async () => {
      await Package.create(buildPackage({ title: "Honeymoon Package", category: "Honeymoon" }));
      await Package.create(buildPackage({ title: "Adventure Trip", category: "Adventure" }));

      const res = await request(app).get("/api/packages?category=Honeymoon");
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].title).toBe("Honeymoon Package");
    });

    it("searches by title (case-insensitive)", async () => {
      await Package.create(buildPackage({ title: "Amalfi Coast Explorer" }));
      await Package.create(buildPackage({ title: "Bali Beach Resort" }));

      const res = await request(app).get("/api/packages?search=amalfi");
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].title).toContain("Amalfi");
    });

    it("searches by location (case-insensitive)", async () => {
      await Package.create(buildPackage({ title: "Italian Dream", location: "Italy, Europe" }));
      await Package.create(buildPackage({ title: "Bali Dream", location: "Bali, Indonesia" }));

      const res = await request(app).get("/api/packages?search=italy");
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].location).toContain("Italy");
    });

    it("sorts by price ascending", async () => {
      await Package.create(buildPackage({ title: "Cheap", price: 500 }));
      await Package.create(buildPackage({ title: "Expensive", price: 2000 }));
      await Package.create(buildPackage({ title: "Mid", price: 1000 }));

      const res = await request(app).get("/api/packages?sortBy=price&sortOrder=asc");
      expect(res.status).toBe(200);
      expect(res.body[0].title).toBe("Cheap");
      expect(res.body[1].title).toBe("Mid");
      expect(res.body[2].title).toBe("Expensive");
    });

    it("sorts by price descending (default)", async () => {
      await Package.create(buildPackage({ title: "Cheap", price: 500 }));
      await Package.create(buildPackage({ title: "Expensive", price: 2000 }));

      const res = await request(app).get("/api/packages?sortBy=price");
      expect(res.status).toBe(200);
      expect(res.body[0].title).toBe("Expensive");
    });
  });

  describe("GET /api/packages/:id", () => {
    it("returns 200 with package by id", async () => {
      const pkg = await Package.create(buildPackage({ title: "Find Me" }));

      const res = await request(app).get(`/api/packages/${pkg._id}`);
      expect(res.status).toBe(200);
      expect(res.body.title).toBe("Find Me");
      expect(res.body._id).toBe(pkg._id.toString());
    });

    it("returns 404 for non-existent id", async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      const res = await request(app).get(`/api/packages/${fakeId}`);
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe("Package not found");
    });

    it("returns 400 for invalid id format", async () => {
      const res = await request(app).get("/api/packages/invalid-id-format");
      expect(res.status).toBe(400);
      expect(res.body.message).toBe("Invalid ID format");
    });
  });

  describe("POST /api/packages", () => {
    it("returns 201 with created package for valid data", async () => {
      const data = buildPackage();

      const res = await request(app).post("/api/packages").send(data);
      expect(res.status).toBe(201);
      expect(res.body.title).toBe(data.title);
      expect(res.body.destinationId).toBe(data.destinationId);
      expect(res.body._id).toBeDefined();
      expect(res.body.createdAt).toBeDefined();
    });

    it("returns 201 with defaults applied for omitted optional fields", async () => {
      const data = buildPackage({
        images: undefined,
        schedule: undefined,
        inclusions: undefined,
        exclusions: undefined,
        seo: undefined,
      });

      const res = await request(app).post("/api/packages").send(data);
      expect(res.status).toBe(201);
      expect(res.body.images).toEqual([]);
      expect(res.body.schedule).toEqual([]);
      expect(res.body.inclusions).toEqual([]);
      expect(res.body.exclusions).toEqual([]);
      expect(res.body.seo).toBeDefined();
    });

    it("returns 400 for missing required fields", async () => {
      const res = await request(app).post("/api/packages").send({});
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe("Validation failed");
      expect(res.body.errors.length).toBeGreaterThan(0);
    });

    it("returns 400 for invalid field types", async () => {
      const data = buildPackage({ price: "not-a-number" });

      const res = await request(app).post("/api/packages").send(data);
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it("returns 400 for negative price", async () => {
      const data = buildPackage({ price: -100 });

      const res = await request(app).post("/api/packages").send(data);
      expect(res.status).toBe(400);
    });

    it("returns 400 for invalid image URL", async () => {
      const data = buildPackage({ image: "not-a-url" });

      const res = await request(app).post("/api/packages").send(data);
      expect(res.status).toBe(400);
    });

    it("returns 400 when schedule items have empty dayTitle", async () => {
      const data = buildPackage({
        schedule: [{ dayTitle: "", dayDesc: "Something" }],
      });

      const res = await request(app).post("/api/packages").send(data);
      expect(res.status).toBe(400);
    });

    it("persists the package to the database", async () => {
      const data = buildPackage();
      const res = await request(app).post("/api/packages").send(data);

      const saved = await Package.findById(res.body._id);
      expect(saved).not.toBeNull();
      expect(saved.title).toBe(data.title);
    });

    it("strips unknown fields from request body", async () => {
      const data = { ...buildPackage(), unknownField: "should-be-ignored" };

      const res = await request(app).post("/api/packages").send(data);
      expect(res.status).toBe(201);
      expect(res.body.unknownField).toBeUndefined();
    });
  });

  describe("PUT /api/packages/:id", () => {
    it("returns 200 with updated package", async () => {
      const pkg = await Package.create(buildPackage({ title: "Original Title" }));

      const res = await request(app)
        .put(`/api/packages/${pkg._id}`)
        .send({ title: "Updated Title" });

      expect(res.status).toBe(200);
      expect(res.body.title).toBe("Updated Title");
    });

    it("persists changes to the database", async () => {
      const pkg = await Package.create(buildPackage({ title: "Original" }));

      await request(app)
        .put(`/api/packages/${pkg._id}`)
        .send({ price: 999 });

      const updated = await Package.findById(pkg._id);
      expect(updated.price).toBe(999);
    });

    it("returns 404 when package does not exist", async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      const res = await request(app)
        .put(`/api/packages/${fakeId}`)
        .send({ title: "Nope" });

      expect(res.status).toBe(404);
    });

    it("returns 400 for invalid update data", async () => {
      const pkg = await Package.create(buildPackage());

      const res = await request(app)
        .put(`/api/packages/${pkg._id}`)
        .send({ price: -50 });

      expect(res.status).toBe(400);
    });

    it("allows partial update with just one field", async () => {
      const pkg = await Package.create(
        buildPackage({ title: "Original", price: 1000 })
      );

      const res = await request(app)
        .put(`/api/packages/${pkg._id}`)
        .send({ title: "Only Title Changed" });

      expect(res.status).toBe(200);
      expect(res.body.title).toBe("Only Title Changed");
      expect(res.body.price).toBe(1000);
    });

    it("updates nested schedule array", async () => {
      const pkg = await Package.create(buildPackage());
      const newSchedule = [
        { dayTitle: "Day 1: New", dayDesc: "New description" },
      ];

      const res = await request(app)
        .put(`/api/packages/${pkg._id}`)
        .send({ schedule: newSchedule });

      expect(res.status).toBe(200);
      expect(res.body.schedule).toEqual(newSchedule);
    });
  });

  describe("DELETE /api/packages/:id", () => {
    it("returns 200 with success message", async () => {
      const pkg = await Package.create(buildPackage());

      const res = await request(app).delete(`/api/packages/${pkg._id}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe("Package successfully deleted");
    });

    it("removes package from database", async () => {
      const pkg = await Package.create(buildPackage());

      await request(app).delete(`/api/packages/${pkg._id}`);

      const deleted = await Package.findById(pkg._id);
      expect(deleted).toBeNull();
    });

    it("returns 404 when package does not exist", async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      const res = await request(app).delete(`/api/packages/${fakeId}`);
      expect(res.status).toBe(404);
    });
  });

  describe("POST /api/packages/media/delete", () => {
    it("returns 400 when urls is missing", async () => {
      const res = await request(app).post("/api/packages/media/delete").send({});
      expect(res.status).toBe(400);
      expect(res.body.message).toContain("urls");
    });

    it("returns 400 when urls is empty", async () => {
      const res = await request(app)
        .post("/api/packages/media/delete")
        .send({ urls: [] });
      expect(res.status).toBe(400);
    });

    it("returns 200 when credentials are not configured", async () => {
      const origKey = process.env.CLOUDINARY_API_KEY;
      const origSecret = process.env.CLOUDINARY_API_SECRET;
      delete process.env.CLOUDINARY_API_KEY;
      delete process.env.CLOUDINARY_API_SECRET;

      const res = await request(app)
        .post("/api/packages/media/delete")
        .send({ urls: ["https://res.cloudinary.com/test/image/upload/v1/test.jpg"] });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain("credentials");

      process.env.CLOUDINARY_API_KEY = origKey;
      process.env.CLOUDINARY_API_SECRET = origSecret;
    });
  });

  describe("Global error handling", () => {
    it("returns generic 500 for unknown errors", async () => {
      const origFind = Package.find;
      Package.find = () => { throw new Error("Unexpected DB crash"); };

      const res = await request(app).get("/api/packages");
      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe("Unexpected DB crash");

      Package.find = origFind;
    });

    it("does not include stack trace in production mode", async () => {
      const origEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "production";

      Package.find = () => { throw new Error("Hidden"); };

      const res = await request(app).get("/api/packages");
      expect(res.status).toBe(500);
      expect(res.body.stack).toBeUndefined();

      process.env.NODE_ENV = origEnv;
      Package.find = () => Package.find;
    });
  });
});
