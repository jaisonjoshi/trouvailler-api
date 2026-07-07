import PageRepository from "../repositories/PageRepository.js";
import PackageSection from "../models/PackageSection.js";
import LocationSection from "../models/LocationSection.js";
import CategorySection from "../models/CategorySection.js";
import { createPageSchema, updatePageSchema } from "../validation/PageValidation.js";

class PageService {
  getAllPages(filters = {}, options = {}) {
    return PageRepository.findAll(filters, options);
  }

  async getPageById(id) {
    const page = await PageRepository.findById(id);
    if (!page) {
      this.throwError("Page not found", 404);
    }
    return page;
  }

  async getPageBySlug(slug) {
    const page = await PageRepository.findBySlug(slug);
    if (!page) {
      this.throwError("Page not found", 404);
    }
    return page;
  }

  async createPage(data) {
    const validatedData = createPageSchema.parse(data);
    await this._ensureUniqueSlug(validatedData.slug);
    return PageRepository.create(validatedData);
  }

  async updatePage(id, data) {
    await this.getPageById(id);
    const validatedData = updatePageSchema.parse(data);
    if (validatedData.slug) {
      await this._ensureUniqueSlug(validatedData.slug, id);
    }
    return PageRepository.update(id, validatedData);
  }

  async updatePageBySlug(slug, data) {
    const page = await PageRepository.findBySlug(slug);
    if (!page) {
      this.throwError("Page not found", 404);
    }
    const validatedData = updatePageSchema.parse(data);
    return PageRepository.update(page._id, validatedData);
  }

  async deletePage(id) {
    const page = await this.getPageById(id);
    const coreSlugs = ["home"];
    if (coreSlugs.includes(page.slug)) {
      this.throwError(`${page.title} cannot be deleted.`, 400);
    }
    return PageRepository.delete(id);
  }

  async getPublishedPageBySlug(slug) {
    const normSlug = slug.toLowerCase();
    const page = await PageRepository.findBySlug(normSlug);

    if (!page || !page.isActive) {
      this.throwError("Page not found", 404);
    }

    const pageObj = page.toObject();

    await this._populateCarouselData(pageObj, "package-carousel", "packageSectionId", PackageSection, "packages");
    await this._populateCarouselData(pageObj, "location-carousel", "locationSectionId", LocationSection, "locations");
    await this._populateCarouselData(pageObj, "category-carousel", "categorySectionId", CategorySection, "categories");

    pageObj.sections = pageObj.sections
      .filter((s) => s.isVisible !== false)
      .sort((a, b) => a.order - b.order);

    return pageObj;
  }

  async _ensureUniqueSlug(slug, excludeId = null) {
    const existing = await PageRepository.findBySlug(slug);
    if (existing && (!excludeId || existing._id.toString() !== excludeId)) {
      this.throwError("A page with this slug already exists.");
    }
  }

  async _populateCarouselData(pageObj, type, idField, model, populatePath) {
    const sectionIds = pageObj.sections
      .filter((s) => s.type === type && s.config?.[idField])
      .map((s) => s.config[idField].toString());

    if (sectionIds.length === 0) {
      return;
    }

    const sections = await model
      .find({
        _id: { $in: sectionIds },
        isDeleted: { $ne: true },
        isActive: true,
      })
      .populate({
        path: populatePath,
        match: { isDeleted: { $ne: true } },
      });

    const sectionMap = new Map(sections.map((c) => [c._id.toString(), c]));

    pageObj.sections.forEach((s) => {
      if (s.type === type && s.config?.[idField]) {
        const carousel = sectionMap.get(s.config[idField].toString());
        if (carousel) {
          s.data = carousel;
        }
      }
    });
  }

  throwError(message, statusCode = 400) {
    const error = new Error(message);
    error.statusCode = statusCode;
    throw error;
  }
}

export default new PageService();
