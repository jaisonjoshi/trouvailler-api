import PackageRepository from "../repositories/PackageRepository.js";
import { createPackageSchema, updatePackageSchema } from "../validation/PackageValidation.js";

class PackageService {
  async getAllPackages(filters = {}, options = {}) {
    // If we want to add search logic (e.g. by title), we can parse it here
    const query = {};
    if (filters.destinationId) {
      query.destinationId = filters.destinationId;
    }
    if (filters.categories && Array.isArray(filters.categories) && filters.categories.length > 0) {
      query.categories = { $in: filters.categories };
    }
    if (filters.mainLocation) {
      query.mainLocation = filters.mainLocation;
    }
    if (filters.locations) {
      query.locations = { $in: Array.isArray(filters.locations) ? filters.locations : [filters.locations] };
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

    return await PackageRepository.update(id, validatedData);
  }

  async deletePackage(id) {
    // Ensure package exists
    await this.getPackageById(id);
    return await PackageRepository.delete(id);
  }
}

export default new PackageService();
