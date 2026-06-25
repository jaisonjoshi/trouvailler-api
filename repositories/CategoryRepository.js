import Category from "../models/Category.js";

class CategoryRepository {
  async findAll(filters = {}, options = {}) {
    const sortBy = options.sortBy || "createdAt";
    const sortOrder = options.sortOrder === "asc" ? 1 : -1;

    const sortOption = {};
    sortOption[sortBy] = sortOrder;

    return await Category.find(filters).sort(sortOption);
  }

  async findById(id) {
    return await Category.findById(id);
  }

  async findByName(name) {
    // Case-insensitive query to find category by name
    return await Category.findOne({ name: { $regex: `^${name}$`, $options: "i" } });
  }

  async findBySlug(slug) {
    return await Category.findOne({ slug: slug.toLowerCase() });
  }

  async create(data) {
    const newCategory = new Category(data);
    return await newCategory.save();
  }

  async update(id, data) {
    return await Category.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true, runValidators: true }
    );
  }

  async delete(id) {
    return await Category.findByIdAndDelete(id);
  }
}

export default new CategoryRepository();
