import CategoryRepository from "../repositories/CategoryRepository.js";
import { createCategorySchema, updateCategorySchema } from "../validation/CategoryValidation.js";
import { generateSlug } from "../utils/slug.js";

class CategoryService {
  getAllCategories(filters = {}, options = {}) {
    return CategoryRepository.findAll(filters, options);
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
    const validatedData = createCategorySchema.parse(data);

    const existingCategory = await CategoryRepository.findByName(validatedData.name);
    if (existingCategory) {
      this.throwError("A category with the same name already exists.");
    }

    const slug = generateSlug(validatedData.name);
    const existingSlug = await CategoryRepository.findBySlug(slug);
    if (existingSlug) {
      this.throwError("A category with the same slug already exists.");
    }
    validatedData.slug = slug;

    return CategoryRepository.create(validatedData);
  }

  async updateCategory(id, data) {
    const validatedData = updateCategorySchema.parse(data);
    const category = await this.getCategoryById(id);

    if (validatedData.name && validatedData.name.toLowerCase() !== category.name.toLowerCase()) {
      const existingCategory = await CategoryRepository.findByName(validatedData.name);
      if (existingCategory) {
        this.throwError("A category with the same name already exists.");
      }

      const newSlug = generateSlug(validatedData.name);
      const existingSlug = await CategoryRepository.findBySlug(newSlug);
      if (existingSlug && existingSlug._id.toString() !== id) {
        this.throwError("A category with the same slug already exists.");
      }
      validatedData.slug = newSlug;
    }

    return CategoryRepository.update(id, validatedData);
  }

  async deleteCategory(id) {
    await this.getCategoryById(id);
    return CategoryRepository.delete(id);
  }

  throwError(message, statusCode = 400) {
    const error = new Error(message);
    error.statusCode = statusCode;
    throw error;
  }
}

export default new CategoryService();
