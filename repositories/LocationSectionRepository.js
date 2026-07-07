import LocationSection from "../models/LocationSection.js";

class LocationSectionRepository {
  findAll(filters = {}, options = {}) {
    const sortBy = options.sortBy || "createdAt";
    const sortOrder = options.sortOrder === "asc" ? 1 : -1;

    const sortOption = {};
    sortOption[sortBy] = sortOrder;

    const query = { isDeleted: { $ne: true } };
    Object.assign(query, filters);

    return LocationSection.find(query).populate("locations").sort(sortOption);
  }

  findById(id, includeDeleted = false) {
    const query = { _id: id };
    if (!includeDeleted) {
      query.isDeleted = { $ne: true };
    }
    return LocationSection.findOne(query).populate("locations");
  }

  findByTitle(title, includeDeleted = false) {
    const escaped = title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const query = { title: { $regex: `^${escaped}$`, $options: "i" } };
    if (!includeDeleted) {
      query.isDeleted = { $ne: true };
    }
    return LocationSection.findOne(query);
  }

  create(data) {
    const newSection = new LocationSection(data);
    return newSection.save().then((s) => s.populate("locations"));
  }

  update(id, data) {
    return LocationSection.findOneAndUpdate(
      { _id: id, isDeleted: { $ne: true } },
      { $set: data },
      { new: true, runValidators: true }
    ).populate("locations");
  }

  delete(id) {
    return LocationSection.findOneAndUpdate(
      { _id: id, isDeleted: { $ne: true } },
      { $set: { isDeleted: true } },
      { new: true }
    );
  }
}

export default new LocationSectionRepository();
