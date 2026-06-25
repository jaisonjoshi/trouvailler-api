import LocationRepository from "../repositories/LocationRepository.js";
import CategoryRepository from "../repositories/CategoryRepository.js";
import { createLocationSchema, updateLocationSchema } from "../validation/LocationValidation.js";
import { generateSlug } from "../utils/slug.js";

class LocationService {
  async getAllLocations(filters = {}, options = {}) {
    const query = {};
    if (filters.level) {
      query.level = filters.level;
    }
    if (filters.parentLocation !== undefined) {
      query.parentLocation = filters.parentLocation;
    }
    if (filters.search) {
      query.$or = [
        { name: { $regex: filters.search, $options: "i" } },
        { shortDescription: { $regex: filters.search, $options: "i" } }
      ];
    }
    return await LocationRepository.findAll(query, options);
  }

  async getLocationById(id) {
    const location = await LocationRepository.findById(id);
    if (!location) {
      const error = new Error("Location not found");
      error.statusCode = 404;
      throw error;
    }
    return location;
  }

  async validateParentLocation(level, parentLocationId, currentLocationId = null) {
    if (parentLocationId && currentLocationId && parentLocationId.toString() === currentLocationId.toString()) {
      const error = new Error("A location cannot be its own parent");
      error.statusCode = 400;
      throw error;
    }

    if (level === "country") {
      if (parentLocationId) {
        const error = new Error("A country cannot have a parent location");
        error.statusCode = 400;
        throw error;
      }
      return;
    }

    if (!parentLocationId) {
      if (level === "state") {
        const error = new Error("A state must have a parent country location");
        error.statusCode = 400;
        throw error;
      }
      return;
    }

    const parentLocation = await LocationRepository.findById(parentLocationId);
    if (!parentLocation) {
      const error = new Error("Parent location not found");
      error.statusCode = 400;
      throw error;
    }

    if (level === "state") {
      if (parentLocation.level !== "country") {
        const error = new Error("A state's parent must be a country");
        error.statusCode = 400;
        throw error;
      }
    }

    if (level === "destination") {
      if (parentLocation.level !== "country" && parentLocation.level !== "state") {
        const error = new Error("A destination's parent must be a country or a state");
        error.statusCode = 400;
        throw error;
      }
    }
  }

  async validateCategories(categoryIds) {
    if (!categoryIds || categoryIds.length === 0) return;

    for (const catId of categoryIds) {
      const category = await CategoryRepository.findById(catId);
      if (!category) {
        const error = new Error(`Category with ID ${catId} not found`);
        error.statusCode = 400;
        throw error;
      }
      if (!category.appliesTo || !category.appliesTo.includes("location")) {
        const error = new Error(`Category "${category.name}" does not apply to locations`);
        error.statusCode = 400;
        throw error;
      }
    }
  }

  async createLocation(data) {
    const validatedData = createLocationSchema.parse(data);

    // Business check: unique name
    const existing = await LocationRepository.findByName(validatedData.name);
    if (existing) {
      const error = new Error("Location name already exists");
      error.statusCode = 400;
      throw error;
    }

    // Generate and validate slug uniqueness
    const slug = generateSlug(validatedData.name);
    const existingSlug = await LocationRepository.findBySlug(slug);
    if (existingSlug) {
      const error = new Error("Location slug already exists");
      error.statusCode = 400;
      throw error;
    }
    validatedData.slug = slug;

    // Validate parent rules
    await this.validateParentLocation(validatedData.level, validatedData.parentLocation);

    // Validate categories appliesTo constraint
    await this.validateCategories(validatedData.categories);

    // Clean up empty string parentLocation to null in DB
    if (validatedData.parentLocation === "") {
      validatedData.parentLocation = null;
    }

    return await LocationRepository.create(validatedData);
  }

  async updateLocation(id, data) {
    const validatedData = updateLocationSchema.parse(data);

    // Ensure resource exists
    const location = await this.getLocationById(id);

    // If name changes, check uniqueness & regenerate slug
    if (validatedData.name && validatedData.name.toLowerCase() !== location.name.toLowerCase()) {
      const existing = await LocationRepository.findByName(validatedData.name);
      if (existing) {
        const error = new Error("Location name already exists");
        error.statusCode = 400;
        throw error;
      }

      const newSlug = generateSlug(validatedData.name);
      const existingSlug = await LocationRepository.findBySlug(newSlug);
      if (existingSlug && existingSlug._id.toString() !== id) {
        const error = new Error("Location slug already exists");
        error.statusCode = 400;
        throw error;
      }
      validatedData.slug = newSlug;
    }

    // Determine level & parent for validation
    const currentLevel = validatedData.level !== undefined ? validatedData.level : location.level;
    let currentParent = validatedData.parentLocation;
    if (currentParent === undefined) {
      currentParent = location.parentLocation;
    } else if (currentParent === "" || currentParent === null) {
      currentParent = null;
    }

    // Validate parent rules
    await this.validateParentLocation(currentLevel, currentParent, id);

    // Validate categories appliesTo constraint
    if (validatedData.categories !== undefined) {
      await this.validateCategories(validatedData.categories);
    }

    // Clean up empty string parentLocation to null in DB
    if (validatedData.parentLocation === "") {
      validatedData.parentLocation = null;
    }

    return await LocationRepository.update(id, validatedData);
  }

  async deleteLocation(id) {
    await this.getLocationById(id);
    return await LocationRepository.delete(id);
  }
}

export default new LocationService();
