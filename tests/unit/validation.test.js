import { describe, it, expect } from "vitest";
import { createPackageSchema, updatePackageSchema } from "../../validation/PackageValidation.js";
import { buildPackage } from "../helpers/factories.js";

describe("PackageValidation", () => {
  describe("createPackageSchema", () => {
    it("accepts a fully valid package payload", () => {
      const data = buildPackage();
      const result = createPackageSchema.parse(data);
      expect(result.title).toBe("Amalfi Coast Explorer");
      expect(result.destinationId).toBe("amalfi");
      expect(result.price).toBe(1299);
      expect(result.schedule).toHaveLength(1);
      expect(result.seo.title).toBe("Amalfi Tour");
    });

    it("applies defaults for optional array fields", () => {
      const data = buildPackage({
        images: undefined,
        schedule: undefined,
        activities: undefined,
        inclusions: undefined,
        exclusions: undefined,
      });
      const result = createPackageSchema.parse(data);
      expect(result.images).toEqual([]);
      expect(result.schedule).toEqual([]);
      expect(result.activities).toEqual([]);
      expect(result.inclusions).toEqual([]);
      expect(result.exclusions).toEqual([]);
    });

    it("applies default for isIncluded in activities", () => {
      const data = buildPackage({
        activities: [{ name: "Boat Tour", day: 1 }],
      });
      const result = createPackageSchema.parse(data);
      expect(result.activities[0].isIncluded).toBe(true);
    });

    describe("required field validation", () => {
      const requiredFields = [
        "destinationId",
        "title",
        "location",
        "image",
        "description",
        "price",
        "duration",
        "accommodation",
        "excursions",
        "meals",
      ];

      for (const field of requiredFields) {
        it(`rejects missing "${field}"`, () => {
          const data = buildPackage({ [field]: undefined });
          expect(() => createPackageSchema.parse(data)).toThrow();
        });

        it(`rejects empty string for "${field}"`, () => {
          const data = buildPackage({ [field]: "" });
          expect(() => createPackageSchema.parse(data)).toThrow();
        });
      }
    });

    it("rejects negative price", () => {
      const data = buildPackage({ price: -100 });
      expect(() => createPackageSchema.parse(data)).toThrow();
    });

    it("allows zero price", () => {
      const data = buildPackage({ price: 0 });
      const result = createPackageSchema.parse(data);
      expect(result.price).toBe(0);
    });

    it("rejects negative originalPrice", () => {
      const data = buildPackage({ originalPrice: -1 });
      expect(() => createPackageSchema.parse(data)).toThrow();
    });

    it("allows zero originalPrice", () => {
      const data = buildPackage({ originalPrice: 0 });
      const result = createPackageSchema.parse(data);
      expect(result.originalPrice).toBe(0);
    });

    it("allows null originalPrice", () => {
      const data = buildPackage({ originalPrice: null });
      const result = createPackageSchema.parse(data);
      expect(result.originalPrice).toBeNull();
    });

    it("rejects invalid image URL", () => {
      const data = buildPackage({ image: "not-a-url" });
      expect(() => createPackageSchema.parse(data)).toThrow();
    });

    it("rejects invalid gallery image URL", () => {
      const data = buildPackage({ images: ["not-a-url"] });
      expect(() => createPackageSchema.parse(data)).toThrow();
    });

    it("rejects schedule items with empty dayTitle", () => {
      const data = buildPackage({
        schedule: [{ dayTitle: "", dayDesc: "Description" }],
      });
      expect(() => createPackageSchema.parse(data)).toThrow();
    });

    it("rejects schedule items with empty dayDesc", () => {
      const data = buildPackage({
        schedule: [{ dayTitle: "Day 1", dayDesc: "" }],
      });
      expect(() => createPackageSchema.parse(data)).toThrow();
    });

    it("rejects activity with empty name", () => {
      const data = buildPackage({
        activities: [{ name: "", day: 1 }],
      });
      expect(() => createPackageSchema.parse(data)).toThrow();
    });

    it("rejects activity with non-positive day", () => {
      const data = buildPackage({
        activities: [{ name: "Tour", day: 0 }],
      });
      expect(() => createPackageSchema.parse(data)).toThrow();
    });

    it("rejects non-array inclusions", () => {
      const data = buildPackage({ inclusions: "not-array" });
      expect(() => createPackageSchema.parse(data)).toThrow();
    });

    it("allows optional seo to be omitted", () => {
      const data = buildPackage({ seo: undefined });
      const result = createPackageSchema.parse(data);
      expect(result.seo).toBeUndefined();
    });

    it("allows optional originalPrice to be omitted", () => {
      const data = buildPackage({ originalPrice: undefined });
      const result = createPackageSchema.parse(data);
      expect(result.originalPrice).toBeUndefined();
    });
  });

  describe("updatePackageSchema", () => {
    it("accepts a partial payload", () => {
      const result = updatePackageSchema.parse({ title: "Updated Title" });
      expect(result.title).toBe("Updated Title");
    });

    it("accepts empty object with default array values", () => {
      const result = updatePackageSchema.parse({});
      expect(result).toEqual({
        images: [],
        schedule: [],
        activities: [],
        inclusions: [],
        exclusions: [],
      });
    });

    it("rejects invalid partial data", () => {
      expect(() => updatePackageSchema.parse({ price: -5 })).toThrow();
    });

    it("rejects invalid URL in image partial update", () => {
      expect(() => updatePackageSchema.parse({ image: "bad" })).toThrow();
    });

    it("allows updating nested seo fields", () => {
      const result = updatePackageSchema.parse({
        seo: { title: "New SEO Title" },
      });
      expect(result.seo.title).toBe("New SEO Title");
    });

    it("rejects empty string for a required-like field in partial", () => {
      expect(() => updatePackageSchema.parse({ title: "" })).toThrow();
    });
  });
});
