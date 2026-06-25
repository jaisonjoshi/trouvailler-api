import Location from "../models/Location.js";

class LocationRepository {
  async findAll(filters = {}, options = {}) {
    const sortBy = options.sortBy || "createdAt";
    const sortOrder = options.sortOrder === "asc" ? 1 : -1;

    const sortOption = {};
    sortOption[sortBy] = sortOrder;

    return await Location.find(filters).sort(sortOption);
  }

  async findById(id) {
    return await Location.findById(id);
  }

  async findByName(name) {
    return await Location.findOne({ name: { $regex: `^${name}$`, $options: "i" } });
  }

  async findBySlug(slug) {
    return await Location.findOne({ slug: slug.toLowerCase() });
  }

  async create(data) {
    const newLocation = new Location(data);
    return await newLocation.save();
  }

  async update(id, data) {
    return await Location.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true, runValidators: true }
    );
  }

  async delete(id) {
    return await Location.findByIdAndDelete(id);
  }
}

export default new LocationRepository();
