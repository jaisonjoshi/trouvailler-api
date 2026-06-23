import { describe, it, expect, vi, beforeEach } from "vitest";
import PackageService from "../../services/PackageService.js";
import PackageRepository from "../../repositories/PackageRepository.js";
import { buildPackage } from "../helpers/factories.js";

vi.mock("../../repositories/PackageRepository.js", () => ({
  default: {
    findAll: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

describe("PackageService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getAllPackages", () => {
    const mockPackages = [buildPackage({ _id: "1" }), buildPackage({ _id: "2", title: "Bali Retreat", destinationId: "bali" })];

    it("returns all packages when no filters", async () => {
      PackageRepository.findAll.mockResolvedValue(mockPackages);
      const result = await PackageService.getAllPackages({}, {});
      expect(result).toEqual(mockPackages);
      expect(PackageRepository.findAll).toHaveBeenCalledWith({}, {});
    });

    it("filters by destinationId", async () => {
      const filtered = [mockPackages[1]];
      PackageRepository.findAll.mockResolvedValue(filtered);
      const result = await PackageService.getAllPackages(
        { destinationId: "bali" },
        {}
      );
      expect(result).toEqual(filtered);
      expect(PackageRepository.findAll).toHaveBeenCalledWith(
        { destinationId: "bali" },
        {}
      );
    });

    it("filters by category", async () => {
      PackageRepository.findAll.mockResolvedValue([mockPackages[0]]);
      const result = await PackageService.getAllPackages(
        { category: "Honeymoon" },
        {}
      );
      expect(PackageRepository.findAll).toHaveBeenCalledWith(
        { category: "Honeymoon" },
        {}
      );
    });

    it("builds $or search query for title/location", async () => {
      PackageRepository.findAll.mockResolvedValue(mockPackages);
      await PackageService.getAllPackages({ search: "amalfi" }, {});
      expect(PackageRepository.findAll).toHaveBeenCalledWith(
        {
          $or: [
            { title: { $regex: "amalfi", $options: "i" } },
            { location: { $regex: "amalfi", $options: "i" } },
          ],
        },
        {}
      );
    });

    it("passes sort options to repository", async () => {
      PackageRepository.findAll.mockResolvedValue(mockPackages);
      await PackageService.getAllPackages(
        {},
        { sortBy: "price", sortOrder: "asc" }
      );
      expect(PackageRepository.findAll).toHaveBeenCalledWith(
        {},
        { sortBy: "price", sortOrder: "asc" }
      );
    });

    it("returns empty array when no packages match", async () => {
      PackageRepository.findAll.mockResolvedValue([]);
      const result = await PackageService.getAllPackages(
        { destinationId: "nonexistent" },
        {}
      );
      expect(result).toEqual([]);
    });
  });

  describe("getPackageById", () => {
    const mockPackage = buildPackage({ _id: "abc123" });

    it("returns package when found", async () => {
      PackageRepository.findById.mockResolvedValue(mockPackage);
      const result = await PackageService.getPackageById("abc123");
      expect(result).toEqual(mockPackage);
      expect(PackageRepository.findById).toHaveBeenCalledWith("abc123");
    });

    it("throws 404 when package not found", async () => {
      PackageRepository.findById.mockResolvedValue(null);
      await expect(
        PackageService.getPackageById("nonexistent")
      ).rejects.toMatchObject({
        message: "Package not found",
        statusCode: 404,
      });
    });
  });

  describe("createPackage", () => {
    const validData = buildPackage();

    it("creates a package with valid data", async () => {
      const created = { _id: "new-id", ...validData };
      PackageRepository.create.mockResolvedValue(created);
      const result = await PackageService.createPackage(validData);
      expect(result).toEqual(created);
      expect(PackageRepository.create).toHaveBeenCalledWith(validData);
    });

    it("throws ZodError for invalid data", async () => {
      const invalidData = { ...validData, title: "" };
      await expect(
        PackageService.createPackage(invalidData)
      ).rejects.toThrow();
    });

    it("strips unknown fields via Zod", async () => {
      const withExtra = { ...validData, extraField: "should-be-stripped" };
      PackageRepository.create.mockImplementation((data) =>
        Promise.resolve({ _id: "1", ...data })
      );
      await PackageService.createPackage(withExtra);
      const passedData = PackageRepository.create.mock.calls[0][0];
      expect(passedData).not.toHaveProperty("extraField");
    });
  });

  describe("updatePackage", () => {
    const existingPackage = buildPackage({ _id: "abc123" });
    const updateData = { title: "Updated Title" };

    it("updates package when it exists", async () => {
      PackageRepository.findById.mockResolvedValue(existingPackage);
      const updated = { ...existingPackage, title: "Updated Title" };
      PackageRepository.update.mockResolvedValue(updated);

      const result = await PackageService.updatePackage("abc123", updateData);
      expect(result.title).toBe("Updated Title");
      expect(PackageRepository.update).toHaveBeenCalledWith(
        "abc123",
        { title: "Updated Title", images: [], schedule: [], activities: [], inclusions: [], exclusions: [] }
      );
    });

    it("throws 404 when package to update does not exist", async () => {
      PackageRepository.findById.mockResolvedValue(null);
      await expect(
        PackageService.updatePackage("nonexistent", updateData)
      ).rejects.toMatchObject({
        message: "Package not found",
        statusCode: 404,
      });
      expect(PackageRepository.update).not.toHaveBeenCalled();
    });

    it("throws ZodError for invalid update data", async () => {
      await expect(
        PackageService.updatePackage("abc123", { price: -10 })
      ).rejects.toThrow();
    });

    it("calls existence check before update", async () => {
      PackageRepository.findById.mockResolvedValue(existingPackage);
      PackageRepository.update.mockResolvedValue(existingPackage);

      await PackageService.updatePackage("abc123", { meals: "Lunch" });
      expect(PackageRepository.findById).toHaveBeenCalledWith("abc123");
      expect(PackageRepository.update).toHaveBeenCalledWith("abc123", {
        meals: "Lunch",
        images: [],
        schedule: [],
        activities: [],
        inclusions: [],
        exclusions: [],
      });
    });
  });

  describe("deletePackage", () => {
    const existingPackage = buildPackage({ _id: "abc123" });

    it("deletes package when it exists", async () => {
      PackageRepository.findById.mockResolvedValue(existingPackage);
      PackageRepository.delete.mockResolvedValue(existingPackage);

      const result = await PackageService.deletePackage("abc123");
      expect(result).toEqual(existingPackage);
      expect(PackageRepository.delete).toHaveBeenCalledWith("abc123");
    });

    it("throws 404 when package to delete does not exist", async () => {
      PackageRepository.findById.mockResolvedValue(null);
      await expect(
        PackageService.deletePackage("nonexistent")
      ).rejects.toMatchObject({
        message: "Package not found",
        statusCode: 404,
      });
      expect(PackageRepository.delete).not.toHaveBeenCalled();
    });

    it("calls existence check before delete", async () => {
      PackageRepository.findById.mockResolvedValue(existingPackage);
      PackageRepository.delete.mockResolvedValue(existingPackage);

      await PackageService.deletePackage("abc123");
      expect(PackageRepository.findById).toHaveBeenCalledWith("abc123");
    });
  });
});
