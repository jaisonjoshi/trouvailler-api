import PackageRepository from "../repositories/PackageRepository.js";
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
      query.$or = [
        { title: { $regex: filters.search, $options: "i" } }
      ];
    }
    return await PackageRepository.findAll(query, options);
  }

  async getPackageById(id) {
    const pkg = await PackageRepository.findById(id);
    if (!pkg) {
      const error = new Error("Package not found");
      error.statusCode = 404;
      throw error;
    }
    return pkg;
  }

  async createPackage(data) {
    // Validate request data
    const validatedData = createPackageSchema.parse(data);

    if (!validatedData.locations.includes(validatedData.mainLocation)) {
      const error = new Error("Primary destination (mainLocation) must be included in the destinations covered (locations) array");
      error.statusCode = 400;
      throw error;
    }

    // Generate unique slug
    const baseSlug = generateSlug(validatedData.title);
    let slug = baseSlug;
    let counter = 1;
    while (await PackageRepository.findBySlug(slug)) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }
    validatedData.slug = slug;

    return await PackageRepository.create(validatedData);
  }

  async updatePackage(id, data) {
    // Validate update fields
    const validatedData = updatePackageSchema.parse(data);
    
    // Ensure package exists
    const pkg = await this.getPackageById(id);

    // Merge fields for business rules validation
    const finalMainLocation = validatedData.mainLocation !== undefined ? validatedData.mainLocation : pkg.mainLocation;
    const finalLocations = validatedData.locations !== undefined ? validatedData.locations : pkg.locations;

    if (finalMainLocation && finalLocations) {
      const locationsStr = finalLocations.map(loc => loc.toString());
      if (!locationsStr.includes(finalMainLocation.toString())) {
        const error = new Error("Primary destination (mainLocation) must be included in the destinations covered (locations) array");
        error.statusCode = 400;
        throw error;
      }
    }

    // Regenerate slug if title changes
    if (validatedData.title && validatedData.title !== pkg.title) {
      const baseSlug = generateSlug(validatedData.title);
      let slug = baseSlug;
      let counter = 1;
      while (true) {
        const existing = await PackageRepository.findBySlug(slug);
        if (!existing || existing._id.toString() === id) {
          break;
        }
        slug = `${baseSlug}-${counter}`;
        counter++;
      }
      validatedData.slug = slug;
    }

    return await PackageRepository.update(id, validatedData);
  }

  async deletePackage(id) {
    // Ensure package exists
    await this.getPackageById(id);
    return await PackageRepository.delete(id);
  }
}

export default new PackageService();
