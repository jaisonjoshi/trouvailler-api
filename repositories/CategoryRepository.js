import Category from "../models/Category.js";

class CategoryRepository {
  findAll(filters = {}, options = {}) {
    const sortBy = options.sortBy || "createdAt";
    const sortOrder = options.sortOrder === "asc" ? 1 : -1;

    const sortOption = {};
    sortOption[sortBy] = sortOrder;

    const query = options.showDeleted ? { ...filters } : { isDeleted: { $ne: true }, ...filters };
    return Category.find(query).sort(sortOption);
  }

  findById(id) {
    return Category.findOne({ _id: id, isDeleted: { $ne: true } });
  }

  findByIds(ids) {
    return Category.find({ _id: { $in: ids }, isDeleted: { $ne: true } });
  }

  findByName(name) {
    return Category.findOne({
      name: { $regex: `^${name}$`, $options: "i" },
      isDeleted: { $ne: true },
    });
  }

  findBySlug(slug) {
    return Category.findOne({ slug: slug.toLowerCase(), isDeleted: { $ne: true } });
  }

  create(data) {
    const newCategory = new Category(data);
    return newCategory.save();
  }

  update(id, data) {
    return Category.findOneAndUpdate(
      { _id: id, isDeleted: { $ne: true } },
      { $set: data },
      { new: true, runValidators: true },
    );
  }

  delete(id) {
    return Category.findByIdAndUpdate(id, { $set: { isDeleted: true } }, { new: true });
  }
}

export default new CategoryRepository();
