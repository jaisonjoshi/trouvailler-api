import Package from "../models/Package.js";

class PackageRepository {
  findAll(filters = {}, options = {}) {
    const sortBy = options.sortBy || "createdAt";
    const sortOrder = options.sortOrder === "asc" ? 1 : -1;

    const sortOption = {};
    sortOption[sortBy] = sortOrder;

    const query = { isDeleted: { $ne: true } };
    Object.assign(query, filters);

    return Package.find(query).sort(sortOption);
  }

  findById(id, includeDeleted = false) {
    const query = { _id: id };
    if (!includeDeleted) {
      query.isDeleted = { $ne: true };
    }
    return Package.findOne(query);
  }

  findBySlug(slug, includeDeleted = false) {
    const query = { slug };
    if (!includeDeleted) {
      query.isDeleted = { $ne: true };
    }
    return Package.findOne(query);
  }

  create(data) {
    const newPackage = new Package(data);
    return newPackage.save();
  }

  update(id, data) {
    return Package.findOneAndUpdate(
      { _id: id, isDeleted: { $ne: true } },
      { $set: data },
      { new: true, runValidators: true },
    );
  }

  delete(id) {
    return Package.findOneAndUpdate(
      { _id: id, isDeleted: { $ne: true } },
      { $set: { isDeleted: true } },
      { new: true },
    );
  }
}

export default new PackageRepository();
