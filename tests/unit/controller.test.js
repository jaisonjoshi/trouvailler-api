import { describe, it, expect, vi, beforeEach } from "vitest";
import PackageController from "../../controllers/PackageController.js";
import PackageService from "../../services/PackageService.js";
import { buildPackage } from "../helpers/factories.js";

vi.mock("../../services/PackageService.js", () => ({
  default: {
    getAllPackages: vi.fn(),
    getPackageById: vi.fn(),
    createPackage: vi.fn(),
    updatePackage: vi.fn(),
    deletePackage: vi.fn(),
  },
}));

function mockReq(overrides = {}) {
  return {
    params: {},
    query: {},
    body: {},
    ...overrides,
  };
}

function mockRes() {
  const res = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
}

describe("PackageController", () => {
  let req, res, next;

  beforeEach(() => {
    vi.clearAllMocks();
    req = mockReq();
    res = mockRes();
    next = vi.fn();
  });

  describe("getAll", () => {
    it("returns 200 with all packages", async () => {
      const packages = [buildPackage()];
      PackageService.getAllPackages.mockResolvedValue(packages);

      await PackageController.getAll(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(packages);
    });

    it("passes query params as filters to service", async () => {
      req.query = {
        destinationId: "bali",
        category: "Honeymoon",
        search: "resort",
        sortBy: "price",
        sortOrder: "asc",
      };
      PackageService.getAllPackages.mockResolvedValue([]);

      await PackageController.getAll(req, res, next);

      expect(PackageService.getAllPackages).toHaveBeenCalledWith(
        {
          destinationId: "bali",
          category: "Honeymoon",
          search: "resort",
        },
        { sortBy: "price", sortOrder: "asc" }
      );
    });

    it("calls next with error on service failure", async () => {
      const error = new Error("DB error");
      PackageService.getAllPackages.mockRejectedValue(error);

      await PackageController.getAll(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
    });

    it("returns empty array when no packages exist", async () => {
      PackageService.getAllPackages.mockResolvedValue([]);

      await PackageController.getAll(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith([]);
    });
  });

  describe("getById", () => {
    it("returns 200 with package", async () => {
      const pkg = buildPackage({ _id: "abc123" });
      req.params = { id: "abc123" };
      PackageService.getPackageById.mockResolvedValue(pkg);

      await PackageController.getById(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(pkg);
      expect(PackageService.getPackageById).toHaveBeenCalledWith("abc123");
    });

    it("calls next with 404 error when not found", async () => {
      req.params = { id: "nonexistent" };
      const error = new Error("Package not found");
      error.statusCode = 404;
      PackageService.getPackageById.mockRejectedValue(error);

      await PackageController.getById(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe("create", () => {
    it("returns 201 with created package", async () => {
      const data = buildPackage();
      const created = { _id: "new-id", ...data };
      req.body = data;
      PackageService.createPackage.mockResolvedValue(created);

      await PackageController.create(req, res, next);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(created);
      expect(PackageService.createPackage).toHaveBeenCalledWith(data);
    });

    it("calls next with ZodError for invalid body", async () => {
      req.body = { title: "" };
      const zodError = new Error("Validation failed");
      zodError.name = "ZodError";
      PackageService.createPackage.mockRejectedValue(zodError);

      await PackageController.create(req, res, next);

      expect(next).toHaveBeenCalledWith(zodError);
    });
  });

  describe("update", () => {
    it("returns 200 with updated package", async () => {
      const updated = buildPackage({ _id: "abc123", title: "Updated" });
      req.params = { id: "abc123" };
      req.body = { title: "Updated" };
      PackageService.updatePackage.mockResolvedValue(updated);

      await PackageController.update(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(updated);
      expect(PackageService.updatePackage).toHaveBeenCalledWith("abc123", {
        title: "Updated",
      });
    });

    it("calls next with 404 when package not found", async () => {
      req.params = { id: "nonexistent" };
      req.body = { title: "Updated" };
      const error = new Error("Package not found");
      error.statusCode = 404;
      PackageService.updatePackage.mockRejectedValue(error);

      await PackageController.update(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe("delete", () => {
    it("returns 200 with success message", async () => {
      req.params = { id: "abc123" };
      PackageService.deletePackage.mockResolvedValue(buildPackage());

      await PackageController.delete(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Package successfully deleted",
      });
      expect(PackageService.deletePackage).toHaveBeenCalledWith("abc123");
    });

    it("calls next with 404 when package not found", async () => {
      req.params = { id: "nonexistent" };
      const error = new Error("Package not found");
      error.statusCode = 404;
      PackageService.deletePackage.mockRejectedValue(error);

      await PackageController.delete(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe("deleteMedia", () => {
    it("returns 400 when urls is missing", async () => {
      req.body = {};
      await PackageController.deleteMedia(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "urls (array) is required",
      });
    });

    it("returns 400 when urls is empty array", async () => {
      req.body = { urls: [] };
      await PackageController.deleteMedia(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("returns 400 when urls is not an array", async () => {
      req.body = { urls: "not-array" };
      await PackageController.deleteMedia(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("returns 200 with skip message when Cloudinary creds missing", async () => {
      delete process.env.CLOUDINARY_API_KEY;
      delete process.env.CLOUDINARY_API_SECRET;
      req.body = { urls: ["https://res.cloudinary.com/test/image/upload/v1/test.jpg"] };

      await PackageController.deleteMedia(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Cloudinary credentials not configured on backend. Skipping delete.",
      });
    });

    it("calls next on unexpected error", async () => {
      req.body = { urls: ["https://res.cloudinary.com/test/image/upload/v1/test.jpg"] };
      process.env.CLOUDINARY_API_KEY = "key";
      process.env.CLOUDINARY_API_SECRET = "secret";

      PackageService.deletePackage.mockRejectedValue(new Error("Unexpected"));

      await PackageController.deleteMedia(req, res, next);
    });
  });
});
