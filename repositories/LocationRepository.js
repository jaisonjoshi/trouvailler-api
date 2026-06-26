import Location from "../models/Location.js";

class LocationRepository {
  async findAll(filters = {}, options = {}) {
    const sortBy = options.sortBy || "createdAt";
    const sortOrder = options.sortOrder === "asc" ? 1 : -1;

    const sortOption = {};
    sortOption[sortBy] = sortOrder;

    const query = { isDeleted: { $ne: true }, ...filters };
    return await Location.find(query).sort(sortOption);
  }

  async findById(id) {
    return await Location.findOne({ _id: id, isDeleted: { $ne: true } });
  }

  async findByIds(ids) {
    return await Location.find({ _id: { $in: ids }, isDeleted: { $ne: true } });
  }

  async findByName(name) {
    return await Location.findOne({ name: { $regex: `^${name}$`, $options: "i" }, isDeleted: { $ne: true } });
  }

  async findBySlug(slug) {
    return await Location.findOne({ slug: slug.toLowerCase(), isDeleted: { $ne: true } });
  }

  async create(data) {
    const newLocation = new Location(data);
    return await newLocation.save();
  }

  async update(id, data) {
    return await Location.findOneAndUpdate(
      { _id: id, isDeleted: { $ne: true } },
      { $set: data },
      { new: true, runValidators: true }
    );
  }

  async delete(id) {
    return await Location.findByIdAndUpdate(
      id,
      { $set: { isDeleted: true } },
      { new: true }
    );
  }
}

export default new LocationRepository();
