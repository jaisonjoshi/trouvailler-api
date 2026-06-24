import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import mongoose from "mongoose";
import request from "supertest";
import app from "../../app.js";
import { startInMemoryMongo, stopInMemoryMongo, clearDatabase } from "../helpers/mongoMemoryServer.js";
import Category from "../../models/Category.js";

describe("Category API (Integration)", () => {
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

  const validCategory = {
    name: "Adventure",
    description: "Exciting adventure and outdoor trips.",
    image: "https://images.unsplash.com/photo-1533588841144-74d6403de009?w=800"
  };

  describe("GET /api/categories", () => {
    it("returns empty array when no categories exist", async () => {
      const res = await request(app).get("/api/categories");
      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });

    it("returns all categories", async () => {
      await Category.create(validCategory);
      await Category.create({
        name: "Honeymoon",
        description: "Romantic getaways.",
        image: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800"
      });

      const res = await request(app).get("/api/categories");
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(2);
      expect(res.body.map(c => c.name)).toContain("Adventure");
      expect(res.body.map(c => c.name)).toContain("Honeymoon");
    });
  });

  describe("GET /api/categories/:id", () => {
    it("returns category details when it exists", async () => {
      const cat = await Category.create(validCategory);

      const res = await request(app).get(`/api/categories/${cat._id}`);
      expect(res.status).toBe(200);
      expect(res.body.name).toBe("Adventure");
    });

    it("returns 404 when category does not exist", async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app).get(`/api/categories/${fakeId}`);
      expect(res.status).toBe(404);
      expect(res.body.message).toContain("Category not found");
    });

    it("returns 400 when ID format is invalid", async () => {
      const res = await request(app).get("/api/categories/invalid-id-123");
      expect(res.status).toBe(400);
      expect(res.body.message).toContain("Invalid ID format");
    });
  });

  describe("POST /api/categories", () => {
    it("creates a new category when data is valid", async () => {
      const res = await request(app)
        .post("/api/categories")
        .send(validCategory);

      expect(res.status).toBe(201);
      expect(res.body.name).toBe("Adventure");
      expect(res.body._id).toBeDefined();

      const inDb = await Category.findById(res.body._id);
      expect(inDb).not.toBeNull();
      expect(inDb.name).toBe("Adventure");
    });

    it("returns 400 when required fields are missing", async () => {
      const invalid = { name: "Adventure" };
      const res = await request(app)
        .post("/api/categories")
        .send(invalid);

      expect(res.status).toBe(400);
      expect(res.body.message).toBe("Validation failed");
    });

    it("returns 400 when name already exists", async () => {
      await Category.create(validCategory);

      const res = await request(app)
        .post("/api/categories")
        .send(validCategory);

      expect(res.status).toBe(400);
      expect(res.body.message).toContain("Category name already exists");
    });
  });

  describe("PUT /api/categories/:id", () => {
    it("updates an existing category", async () => {
      const cat = await Category.create(validCategory);
      const updateData = { name: "Extreme Adventure", description: "Even more action." };

      const res = await request(app)
        .put(`/api/categories/${cat._id}`)
        .send(updateData);

      expect(res.status).toBe(200);
      expect(res.body.name).toBe("Extreme Adventure");
      expect(res.body.description).toBe("Even more action.");
    });

    it("returns 400 when updating to an existing category name", async () => {
      const cat1 = await Category.create(validCategory);
      const cat2 = await Category.create({
        name: "Honeymoon",
        description: "Romantic getaways.",
        image: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800"
      });

      const res = await request(app)
        .put(`/api/categories/${cat2._id}`)
        .send({ name: "Adventure" });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain("Category name already exists");
    });

    it("returns 404 when category does not exist", async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .put(`/api/categories/${fakeId}`)
        .send({ name: "Honeymoon" });

      expect(res.status).toBe(404);
    });
  });

  describe("DELETE /api/categories/:id", () => {
    it("deletes an existing category", async () => {
      const cat = await Category.create(validCategory);

      const res = await request(app).delete(`/api/categories/${cat._id}`);
      expect(res.status).toBe(200);
      expect(res.body.message).toContain("deleted successfully");

      const inDb = await Category.findById(cat._id);
      expect(inDb).toBeNull();
    });

    it("returns 404 when category does not exist", async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app).delete(`/api/categories/${fakeId}`);
      expect(res.status).toBe(404);
    });
  });
});
