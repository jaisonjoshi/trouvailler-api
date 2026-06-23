import Package from "../models/Package.js";

class PackageRepository {
  async findAll(filters = {}, options = {}) {
    const sortBy = options.sortBy || "createdAt";
    const sortOrder = options.sortOrder === "asc" ? 1 : -1;

    const sortOption = {};
    sortOption[sortBy] = sortOrder;

    return await Package.find(filters).sort(sortOption);
  }

  async findById(id) {
    return await Package.findById(id);
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
    return await Package.findByIdAndDelete(id);
  }
}

export default new PackageRepository();
