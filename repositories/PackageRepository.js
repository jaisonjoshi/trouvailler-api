import Package from "../models/Package.js";

class PackageRepository {
  async findAll(filters = {}, options = {}) {
    const sortBy = options.sortBy || "createdAt";
    const sortOrder = options.sortOrder === "asc" ? 1 : -1;

    const sortOption = {};
    sortOption[sortBy] = sortOrder;

    const query = { isDeleted: { $ne: true } };
    Object.assign(query, filters);

    return await Package.find(query).sort(sortOption);
  }

  async findById(id, includeDeleted = false) {
    const query = { _id: id };
    if (!includeDeleted) {
      query.isDeleted = { $ne: true };
    }
    return await Package.findOne(query);
  }

  async findBySlug(slug, includeDeleted = false) {
    const query = { slug };
    if (!includeDeleted) {
      query.isDeleted = { $ne: true };
    }
    return await Package.findOne(query);
  }

  async create(data) {
    const newPackage = new Package(data);
    return await newPackage.save();
  }

  async update(id, data) {
    return await Package.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true, runValidators: true }
    );
  }

  async delete(id) {
    return await Package.findByIdAndUpdate(
      id,
      { $set: { isDeleted: true } },
      { new: true }
    );
  }
}

export default new PackageRepository();
