import PackageRepository from "../repositories/PackageRepository.js";
import { createPackageSchema, updatePackageSchema } from "../validation/PackageValidation.js";

class PackageService {
  async getAllPackages(filters = {}, options = {}) {
    // If we want to add search logic (e.g. by title or location), we can parse it here
    const query = {};
    if (filters.destinationId) {
      query.destinationId = filters.destinationId;
    }
    if (filters.category) {
      query.category = filters.category;
    }
    if (filters.search) {
      query.$or = [
        { title: { $regex: filters.search, $options: "i" } },
        { location: { $regex: filters.search, $options: "i" } }
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
    return await PackageRepository.create(validatedData);
  }

  async updatePackage(id, data) {
    // Validate update fields
    const validatedData = updatePackageSchema.parse(data);
    
    // Ensure package exists
    await this.getPackageById(id);

    return await PackageRepository.update(id, validatedData);
  }

  async deletePackage(id) {
    // Ensure package exists
    await this.getPackageById(id);
    return await PackageRepository.delete(id);
  }
}

export default new PackageService();
