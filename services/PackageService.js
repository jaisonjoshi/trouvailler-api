import PackageRepository from "../repositories/PackageRepository.js";
import LocationRepository from "../repositories/LocationRepository.js";
import CategoryRepository from "../repositories/CategoryRepository.js";
import { createPackageSchema, updatePackageSchema } from "../validation/PackageValidation.js";
import { generateSlug } from "../utils/slug.js";

class PackageService {
  async getAllPackages(filters = {}, options = {}) {
    const query = {};
    if (filters.categories && Array.isArray(filters.categories) && filters.categories.length > 0) {
      query.categories = { $in: filters.categories };
    }
    if (filters.mainLocation) {
      query.mainLocation = filters.mainLocation;
    }
    if (filters.locations) {
      query.locations = { $in: Array.isArray(filters.locations) ? filters.locations : [filters.locations] };
    }
    if (filters.status) {
      query.status = filters.status;
    }
    if (filters.search) {
      query.title = { $regex: filters.search, $options: "i" };
    }
    return await PackageRepository.findAll(query, options);
  }

  async getPackageById(id) {
    const pkg = await PackageRepository.findById(id);
    if (!pkg) this.throwError("Package not found", 404);
    return pkg;
  }

  async getPackageBySlug(slug) {
    const pkg = await PackageRepository.findBySlug(slug);
    if (!pkg) this.throwError("Package not found", 404);
    return pkg;
  }

  async createPackage(data) {
    const validatedData = createPackageSchema.parse(data);

    this.validateMainLocation(validatedData.mainLocation, validatedData.locations);
    await this.validateReferencedLocations(validatedData.mainLocation, validatedData.locations);

    if (validatedData.categories && validatedData.categories.length > 0) {
      await this.validateReferencedCategories(validatedData.categories);
    }

    const slug = generateSlug(validatedData.title);
    const existingSlug = await PackageRepository.findBySlug(slug);
    if (existingSlug) this.throwError("A package with the same title already exists.");
    validatedData.slug = slug;

    return await PackageRepository.create(validatedData);
  }

  async updatePackage(id, data) {
    const validatedData = updatePackageSchema.parse(data);
    const pkg = await this.getPackageById(id);

    const finalMainLocation = validatedData.mainLocation !== undefined ? validatedData.mainLocation : pkg.mainLocation;
    const finalLocations = validatedData.locations !== undefined ? validatedData.locations : pkg.locations;

    this.validateMainLocation(finalMainLocation, finalLocations);

    if (validatedData.mainLocation !== undefined || validatedData.locations !== undefined) {
      await this.validateReferencedLocations(finalMainLocation, finalLocations);
    }

    if (validatedData.categories !== undefined && validatedData.categories.length > 0) {
      await this.validateReferencedCategories(validatedData.categories);
    }

    if (validatedData.title !== undefined && validatedData.title.toLowerCase() !== pkg.title.toLowerCase()) {
      const slug = generateSlug(validatedData.title);
      const existing = await PackageRepository.findBySlug(slug);
      if (existing && existing._id.toString() !== id) this.throwError("A package with the same title already exists.");
      validatedData.slug = slug;
    }

    return await PackageRepository.update(id, validatedData);
  }

  async deletePackage(id) {
    await this.getPackageById(id);
    return await PackageRepository.delete(id);
  }

  throwError(message, statusCode = 400) {
    const error = new Error(message);
    error.statusCode = statusCode;
    throw error;
  }

  validateMainLocation(mainLocation, locations) {
    const locationsStr = locations.map(loc => loc.toString());
    if (!locationsStr.includes(mainLocation.toString())) {
      this.throwError("Primary destination (mainLocation) must be included in the destinations covered (locations) array");
    }
  }

  async validateReferencedLocations(mainLocation, locations) {
    const allIds = [mainLocation.toString(), ...locations.map(loc => loc.toString())];
    const uniqueIds = [...new Set(allIds)];
    const existingLocations = await LocationRepository.findByIds(uniqueIds);
    const existingIds = new Set(existingLocations.map(loc => loc._id.toString()));

    const missingIds = uniqueIds.filter(id => !existingIds.has(id));
    if (missingIds.length > 0) {
      if (missingIds.includes(mainLocation.toString())) {
        this.throwError("Selected primary location does not exist.");
      }
      this.throwError("One or more selected locations do not exist.");
    }
  }

  async validateReferencedCategories(categories) {
    const existingCategories = await CategoryRepository.findByIds(categories);
    const existingIds = new Set(existingCategories.map(cat => cat._id.toString()));

    const missingIds = categories.filter(id => !existingIds.has(id.toString()));
    if (missingIds.length > 0) this.throwError("One or more selected categories do not exist.");

    for (const cat of existingCategories) {
      if (!cat.appliesTo || !cat.appliesTo.includes("package")) {
        this.throwError(`Category "${cat.name}" does not apply to packages`);
      }
    }
  }
}

export default new PackageService();
