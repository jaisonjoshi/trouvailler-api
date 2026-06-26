import Category from "../models/Category.js";

class CategoryRepository {
  async findAll(filters = {}, options = {}) {
    const sortBy = options.sortBy || "createdAt";
    const sortOrder = options.sortOrder === "asc" ? 1 : -1;

    const sortOption = {};
    sortOption[sortBy] = sortOrder;

    const query = options.showDeleted ? { ...filters } : { isDeleted: { $ne: true }, ...filters };
    return await Category.find(query).sort(sortOption);
  }

  async findById(id) {
    return await Category.findOne({ _id: id, isDeleted: { $ne: true } });
  }

  async findByIds(ids) {
    return await Category.find({ _id: { $in: ids }, isDeleted: { $ne: true } });
  }

  async findByName(name) {
    return await Category.findOne({ name: { $regex: `^${name}$`, $options: "i" }, isDeleted: { $ne: true } });
  }

  async findBySlug(slug) {
    return await Category.findOne({ slug: slug.toLowerCase(), isDeleted: { $ne: true } });
  }

  async create(data) {
    const newCategory = new Category(data);
    return await newCategory.save();
  }

  async update(id, data) {
    return await Category.findOneAndUpdate(
      { _id: id, isDeleted: { $ne: true } },
      { $set: data },
      { new: true, runValidators: true }
    );
  }

  async delete(id) {
    return await Category.findByIdAndUpdate(
      id,
      { $set: { isDeleted: true } },
      { new: true }
    );
  }
}

export default new CategoryRepository();
