import LocationRepository from "../repositories/LocationRepository.js";
import CategoryRepository from "../repositories/CategoryRepository.js";
import { createLocationSchema, updateLocationSchema } from "../validation/LocationValidation.js";
import { generateSlug } from "../utils/slug.js";

class LocationService {
  getAllLocations(filters = {}, options = {}) {
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
        { shortDescription: { $regex: filters.search, $options: "i" } },
      ];
    }
    return LocationRepository.findAll(query, options);
  }

  async getLocationById(id) {
    const location = await LocationRepository.findById(id);
    if (!location) {
      this.throwError("Location not found", 404);
    }
    return location;
  }

  async getLocationBySlug(slug) {
    const location = await LocationRepository.findBySlug(slug);
    if (!location) {
      this.throwError("Location not found", 404);
    }
    return location;
  }

  async createLocation(data) {
    const validatedData = createLocationSchema.parse(data);

    const existing = await LocationRepository.findByName(validatedData.name);
    if (existing) {
      this.throwError("A location with the same name already exists.");
    }

    const slug = generateSlug(validatedData.name);
    const existingSlug = await LocationRepository.findBySlug(slug);
    if (existingSlug) {
      this.throwError("A location with the same slug already exists.");
    }
    validatedData.slug = slug;

    await this.validateParentLocation(validatedData.level, validatedData.parentLocation);
    await this.validateCategories(validatedData.categories);

    if (validatedData.parentLocation === "") {
      validatedData.parentLocation = null;
    }

    return LocationRepository.create(validatedData);
  }

  async updateLocation(id, data) {
    const validatedData = updateLocationSchema.parse(data);
    const location = await this.getLocationById(id);

    if (validatedData.name && validatedData.name.toLowerCase() !== location.name.toLowerCase()) {
      const existing = await LocationRepository.findByName(validatedData.name);
      if (existing) {
        this.throwError("A location with the same name already exists.");
      }

      const newSlug = generateSlug(validatedData.name);
      const existingSlug = await LocationRepository.findBySlug(newSlug);
      if (existingSlug && existingSlug._id.toString() !== id) {
        this.throwError("A location with the same slug already exists.");
      }
      validatedData.slug = newSlug;
    }

    const currentLevel = validatedData.level !== undefined ? validatedData.level : location.level;
    let currentParent = validatedData.parentLocation;
    if (currentParent === undefined) {
      currentParent = location.parentLocation;
    } else if (currentParent === "" || currentParent === null) {
      currentParent = null;
    }

    await this.validateParentLocation(currentLevel, currentParent, id);

    if (validatedData.categories !== undefined) {
      await this.validateCategories(validatedData.categories);
    }

    if (validatedData.parentLocation === "") {
      validatedData.parentLocation = null;
    }

    return LocationRepository.update(id, validatedData);
  }

  async deleteLocation(id) {
    await this.getLocationById(id);
    return LocationRepository.delete(id);
  }

  throwError(message, statusCode = 400) {
    const error = new Error(message);
    error.statusCode = statusCode;
    throw error;
  }

  async validateParentLocation(level, parentLocationId, currentLocationId = null) {
    if (
      parentLocationId &&
      currentLocationId &&
      parentLocationId.toString() === currentLocationId.toString()
    ) {
      this.throwError("A location cannot be its own parent");
    }

    if (level === "country") {
      if (parentLocationId) {
        this.throwError("A country cannot have a parent location");
      }
      return;
    }

    if (!parentLocationId) {
      if (level === "state") {
        this.throwError("A state must have a parent country location");
      }
      return;
    }

    const parentLocation = await LocationRepository.findById(parentLocationId);
    if (!parentLocation) {
      this.throwError("Parent location not found");
    }

    if (level === "state") {
      if (parentLocation.level !== "country") {
        this.throwError("A state's parent must be a country");
      }
    }

    if (level === "destination") {
      if (parentLocation.level !== "country" && parentLocation.level !== "state") {
        this.throwError("A destination's parent must be a country or a state");
      }
    }
  }

  async validateCategories(categoryIds) {
    if (!categoryIds || categoryIds.length === 0) {
      return;
    }

    const existingCategories = await CategoryRepository.findByIds(categoryIds);
    const existingIds = new Set(existingCategories.map((cat) => cat._id.toString()));

    const missingIds = categoryIds.filter((id) => !existingIds.has(id.toString()));
    if (missingIds.length > 0) {
      this.throwError("One or more selected categories do not exist.");
    }

    for (const cat of existingCategories) {
      if (!cat.appliesTo || !cat.appliesTo.includes("location")) {
        this.throwError(`Category "${cat.name}" does not apply to locations`);
      }
    }
  }
}

export default new LocationService();
