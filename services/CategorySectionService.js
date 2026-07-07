import CategorySectionRepository from "../repositories/CategorySectionRepository.js";
import CategoryRepository from "../repositories/CategoryRepository.js";
import {
  createCategorySectionSchema,
  updateCategorySectionSchema,
} from "../validation/CategorySectionValidation.js";

class CategorySectionService {
  async getAllSections(filters = {}, options = {}) {
    return CategorySectionRepository.findAll(filters, options);
  }

  async getSectionById(id) {
    const section = await CategorySectionRepository.findById(id);
    if (!section) {
      this.throwError("Category Carousel not found", 404);
    }
    return section;
  }

  async createSection(data) {
    const validatedData = createCategorySectionSchema.parse(data);

    await this._ensureUniqueTitle(validatedData.title);
    await this._ensureCategoriesExist(validatedData.categories);
    this._applyEmptyCategoriesConstraint(validatedData);

    return CategorySectionRepository.create(validatedData);
  }

  async updateSection(id, data) {
    const validatedData = updateCategorySectionSchema.parse(data);
    const section = await this.getSectionById(id);

    if (validatedData.title && validatedData.title.toLowerCase() !== section.title.toLowerCase()) {
      await this._ensureUniqueTitle(validatedData.title);
    }

    if (validatedData.categories) {
      await this._ensureCategoriesExist(validatedData.categories);
      this._applyEmptyCategoriesConstraint(validatedData);
    }

    return CategorySectionRepository.update(id, validatedData);
  }

  async deleteSection(id) {
    await this.getSectionById(id);
    return CategorySectionRepository.delete(id);
  }

  throwError(message, statusCode = 400) {
    const error = new Error(message);
    error.statusCode = statusCode;
    throw error;
  }

  async _ensureUniqueTitle(title) {
    const existing = await CategorySectionRepository.findByTitle(title);
    if (existing) {
      this.throwError("A category carousel with the same title already exists.");
    }
  }

  _applyEmptyCategoriesConstraint(data) {
    if (data.categories && data.categories.length === 0) {
      data.isActive = false;
    }
  }

  async _ensureCategoriesExist(categoryIds) {
    const results = await Promise.all(
      categoryIds.map((id) => CategoryRepository.findById(id)),
    );
    for (let i = 0; i < categoryIds.length; i++) {
      if (!results[i]) {
        this.throwError(`Referenced category ID ${categoryIds[i]} does not exist.`);
      }
    }
  }
}

export default new CategorySectionService();
