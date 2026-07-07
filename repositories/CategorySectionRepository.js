import CategorySection from "../models/CategorySection.js";

class CategorySectionRepository {
  findAll(filters = {}, options = {}) {
    const sortBy = options.sortBy || "createdAt";
    const sortOrder = options.sortOrder === "asc" ? 1 : -1;

    const sortOption = {};
    sortOption[sortBy] = sortOrder;

    const query = { isDeleted: { $ne: true } };
    Object.assign(query, filters);

    return CategorySection.find(query).populate("categories").sort(sortOption);
  }

  findById(id, includeDeleted = false) {
    const query = { _id: id };
    if (!includeDeleted) {
      query.isDeleted = { $ne: true };
    }
    return CategorySection.findOne(query).populate("categories");
  }

  findByTitle(title, includeDeleted = false) {
    const escaped = title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const query = { title: { $regex: `^${escaped}$`, $options: "i" } };
    if (!includeDeleted) {
      query.isDeleted = { $ne: true };
    }
    return CategorySection.findOne(query);
  }

  create(data) {
    const newSection = new CategorySection(data);
    return newSection.save().then((s) => s.populate("categories"));
  }

  update(id, data) {
    return CategorySection.findOneAndUpdate(
      { _id: id, isDeleted: { $ne: true } },
      { $set: data },
      { new: true, runValidators: true }
    ).populate("categories");
  }

  delete(id) {
    return CategorySection.findOneAndUpdate(
      { _id: id, isDeleted: { $ne: true } },
      { $set: { isDeleted: true } },
      { new: true }
    );
  }
}

export default new CategorySectionRepository();
