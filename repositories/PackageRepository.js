import Package from "../models/Package.js";

class PackageRepository {
  async findAll(filters = {}) {
    return await Package.find(filters).sort({ createdAt: -1 });
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
