import PackageRepository from "../repositories/PackageRepository.js";
import PackageSectionRepository from "../repositories/PackageSectionRepository.js";
import {
  createPackageSectionSchema,
  updatePackageSectionSchema,
} from "../validation/PackageSectionValidation.js";

class PackageSectionService {
  getAll(filters = {}, options = {}) {
    const showDeleted = options.showDeleted;
    const dbFilters = { ...filters };
    if (!showDeleted) {
      dbFilters.isDeleted = { $ne: true };
    }

    return PackageSectionRepository.findAll(dbFilters, options).populate({
      path: "packages",
      match: { isDeleted: { $ne: true } },
    });
  }

  async getById(id) {
    const section = await PackageSectionRepository.findById(id);
    if (!section) {
      this.throwError("Package carousel section not found", 404);
    }
    return section.populate({
      path: "packages",
      match: { isDeleted: { $ne: true } },
    });
  }

  async create(data) {
    const validated = createPackageSectionSchema.parse(data);
    await this._ensurePackagesExist(validated.packages);
    this._applyEmptyPackagesConstraint(validated, validated.packages);
    const section = await PackageSectionRepository.create(validated);
    return section.populate({
      path: "packages",
      match: { isDeleted: { $ne: true } },
    });
  }

  async update(id, data) {
    const current = await this.getById(id);
    const validated = updatePackageSectionSchema.parse(data);

    if (validated.packages !== undefined) {
      await this._ensurePackagesExist(validated.packages);
    }
    const finalPackages = validated.packages !== undefined ? validated.packages : current.packages;
    this._applyEmptyPackagesConstraint(validated, finalPackages);
    const updated = await PackageSectionRepository.update(id, validated);
    return updated.populate({
      path: "packages",
      match: { isDeleted: { $ne: true } },
    });
  }

  async delete(id) {
    await this.getById(id);
    return PackageSectionRepository.delete(id);
  }

  async _ensurePackagesExist(packageIds) {
    if (!packageIds || packageIds.length === 0) {
      return;
    }
    const existing = await PackageRepository.findByIds(packageIds);
    const existingIds = new Set(existing.map((p) => p._id.toString()));
    const missing = packageIds.filter((id) => !existingIds.has(id.toString()));
    if (missing.length > 0) {
      this.throwError("One or more referenced packages do not exist.");
    }
  }

  _applyEmptyPackagesConstraint(data, packages) {
    if (!packages || packages.length === 0) {
      data.isActive = false;
    }
  }

  throwError(message, statusCode = 400) {
    const error = new Error(message);
    error.statusCode = statusCode;
    throw error;
  }
}

export default new PackageSectionService();
