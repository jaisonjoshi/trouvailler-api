import Location from "../models/Location.js";

class LocationRepository {
  findAll(filters = {}, options = {}) {
    const sortBy = options.sortBy || "createdAt";
    const sortOrder = options.sortOrder === "asc" ? 1 : -1;

    const sortOption = {};
    sortOption[sortBy] = sortOrder;

    const query = { isDeleted: { $ne: true }, ...filters };
    return Location.find(query).sort(sortOption);
  }

  findById(id) {
    return Location.findOne({ _id: id, isDeleted: { $ne: true } });
  }

  findByIds(ids) {
    return Location.find({ _id: { $in: ids }, isDeleted: { $ne: true } });
  }

  findByName(name) {
    return Location.findOne({
      name: { $regex: `^${name}$`, $options: "i" },
      isDeleted: { $ne: true },
    });
  }

  findBySlug(slug) {
    return Location.findOne({ slug: slug.toLowerCase(), isDeleted: { $ne: true } });
  }

  create(data) {
    const newLocation = new Location(data);
    return newLocation.save();
  }

  update(id, data) {
    return Location.findOneAndUpdate(
      { _id: id, isDeleted: { $ne: true } },
      { $set: data },
      { new: true, runValidators: true },
    );
  }

  delete(id) {
    return Location.findByIdAndUpdate(id, { $set: { isDeleted: true } }, { new: true });
  }
}

export default new LocationRepository();
