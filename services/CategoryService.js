import CategoryRepository from "../repositories/CategoryRepository.js";
import { generateSlug } from "../utils/slug.js";
import PageService from "./PageService.js";
import CategorySection from "../models/CategorySection.js";

class CategoryService {
  getAllCategories(filters = {}, options = {}) {
    const query = {};
    if (filters.appliesTo) {
      query.appliesTo = filters.appliesTo;
    }
    if (filters.search) {
      query.name = { $regex: filters.search, $options: "i" };
    }
    return CategoryRepository.findAll(query, options);
  }

  async getCategoryById(id) {
    const category = await CategoryRepository.findById(id);
    if (!category) {
      this.throwError("Category not found", 404);
    }
    return category;
  }

  async getCategoryBySlug(slug) {
    const category = await CategoryRepository.findBySlug(slug);
    if (!category) {
      this.throwError("Category not found", 404);
    }
    return category;
  }

  async createCategory(data) {
    await this._ensureUniqueName(data.name);

    const slug = generateSlug(data.name);
    await this._ensureUniqueSlug(slug);
    data.slug = slug;

    const category = await CategoryRepository.create(data);

    try {
      await PageService.createPage({
        title: `${category.name} Landing Page`,
        slug: `category-${category.slug}`,
        type: "category",
        isActive: true,
        sections: [
          { type: "navbar", title: "Navbar Header", isVisible: true, order: 0 },
          { type: "hero-header", title: `${category.name} Banner`, isVisible: true, order: 1 },
          { type: "footer", title: "Footer layout", isVisible: true, order: 2 },
        ],
      });
    } catch (err) {
      console.warn("Failed to auto-create landing page for category:", err);
    }

    return category;
  }

  async updateCategory(id, data) {
    const category = await this.getCategoryById(id);

    if (data.name && data.name.toLowerCase() !== category.name.toLowerCase()) {
      await this._ensureUniqueName(data.name);

      const newSlug = generateSlug(data.name);
      await this._ensureUniqueSlug(newSlug, id);
      data.slug = newSlug;
    }

    return CategoryRepository.update(id, data);
  }

  async deleteCategory(id) {
    const category = await this.getCategoryById(id);
    const result = await CategoryRepository.delete(id);

    try {
      const page = await PageService.getPageBySlug(`category-${category.slug}`);
      if (page) {
        await PageService.deletePage(page._id);
      }
    } catch (err) {
      console.warn("Failed to auto-delete landing page for category:", err);
    }

    try {
      await CategorySection.updateMany(
        { categories: id },
        { $pull: { categories: id } }
      );
      await CategorySection.updateMany(
        { categories: { $size: 0 } },
        { $set: { isActive: false } }
      );
    } catch (err) {
      console.warn("Failed to pull category from category carousels on deletion:", err);
    }

    return result;
  }

  async _ensureUniqueName(name) {
    const existing = await CategoryRepository.findByName(name);
    if (existing) {
      this.throwError("A category with the same name already exists.");
    }
  }

  async _ensureUniqueSlug(slug, excludeId) {
    const existing = await CategoryRepository.findBySlug(slug);
    if (existing && (!excludeId || existing._id.toString() !== excludeId)) {
      this.throwError("A category with the same slug already exists.");
    }
  }

  throwError(message, statusCode = 400) {
    const error = new Error(message);
    error.statusCode = statusCode;
    throw error;
  }
}

export default new CategoryService();
