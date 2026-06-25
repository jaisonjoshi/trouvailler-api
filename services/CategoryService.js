import CategoryRepository from "../repositories/CategoryRepository.js";
import { createCategorySchema, updateCategorySchema } from "../validation/CategoryValidation.js";
import { generateSlug } from "../utils/slug.js";

class CategoryService {
  async getAllCategories(filters = {}, options = {}) {
    return await CategoryRepository.findAll(filters, options);
  }

  async getCategoryById(id) {
    const category = await CategoryRepository.findById(id);
    if (!category) {
      const error = new Error("Category not found");
      error.statusCode = 404;
      throw error;
    }
    return category;
  }

  async createCategory(data) {
    // Validate request data
    const validatedData = createCategorySchema.parse(data);

    // Check unique category name constraint
    const existingCategory = await CategoryRepository.findByName(validatedData.name);
    if (existingCategory) {
      const error = new Error("Category name already exists");
      error.statusCode = 400;
      throw error;
    }

    // Generate and validate slug uniqueness
    const slug = generateSlug(validatedData.name);
    const existingSlug = await CategoryRepository.findBySlug(slug);
    if (existingSlug) {
      const error = new Error("Category slug already exists");
      error.statusCode = 400;
      throw error;
    }
    validatedData.slug = slug;

    return await CategoryRepository.create(validatedData);
  }

  async updateCategory(id, data) {
    // Validate update fields
    const validatedData = updateCategorySchema.parse(data);

    // Ensure category exists
    const category = await this.getCategoryById(id);

    // Check if name is being changed and if new name already exists elsewhere
    if (validatedData.name && validatedData.name.toLowerCase() !== category.name.toLowerCase()) {
      const existingCategory = await CategoryRepository.findByName(validatedData.name);
      if (existingCategory) {
        const error = new Error("Category name already exists");
        error.statusCode = 400;
        throw error;
      }

      // Regenerate and validate slug uniqueness
      const newSlug = generateSlug(validatedData.name);
      const existingSlug = await CategoryRepository.findBySlug(newSlug);
      if (existingSlug && existingSlug._id.toString() !== id) {
        const error = new Error("Category slug already exists");
        error.statusCode = 400;
        throw error;
      }
      validatedData.slug = newSlug;
    }

    return await CategoryRepository.update(id, validatedData);
  }

  async deleteCategory(id) {
    // Ensure category exists
    await this.getCategoryById(id);
    return await CategoryRepository.delete(id);
  }
}

export default new CategoryService();
